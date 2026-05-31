from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
import json
import os
import re
from g4f.client import Client

app = FastAPI()
client = Client()

class UserPreferences(BaseModel):
    budget: float
    vibe: str
    dealbreaker: str

def score_cars_locally(cars: List, prefs: UserPreferences) -> List:
    """Local scoring system when LLM is unavailable"""
    vibe_scoring = {
        "city": {"compact": 10, "sedan": 8, "hatchback": 10, "suv": 3},
        "family": {"sedan": 10, "suv": 9, "hatchback": 6, "compact": 5},
        "rough": {"suv": 10, "sedan": 3, "hatchback": 4, "compact": 2}
    }
    
    dealbreaker_scoring = {
        "efficiency": "mileage_kmpl",
        "safety": "safety_rating",
        "premium": "brand"
    }
    
    scored = []
    for car in cars:
        score = 50  # Base score
        
        # Vibe match
        vibe_bonus = vibe_scoring.get(prefs.vibe, {}).get(car['type'], 5)
        score += vibe_bonus
        
        # Dealbreaker priority
        if prefs.dealbreaker == "efficiency":
            score += min(car.get('mileage_kmpl', 15) / 2, 30)
        elif prefs.dealbreaker == "safety":
            score += car.get('safety_rating', 3) * 8
        elif prefs.dealbreaker == "premium":
            premium_brands = {"audi", "mercedes", "bmw", "jaguar"}
            if car['brand'].lower() in premium_brands:
                score += 25
        
        # Budget bonus for better value
        score += max(0, (prefs.budget - car['price_lakh']) * 2)
        
        scored.append({
            **car,
            "match_score": min(int(score), 100),
            "vibe_verdict": f"Good match for {prefs.vibe} driving.",
            "trade_off": "Check on-ground reviews before purchase."
        })
    
    return sorted(scored, key=lambda x: x['match_score'], reverse=True)

@app.post("/recommend")
async def recommend_cars(prefs: UserPreferences):
    # 1. Load the cars data
    data_path = os.path.join(os.path.dirname(__file__), '..', 'src', 'data', 'cars.json')
    try:
        with open(data_path, 'r', encoding='utf-8') as f:
            all_cars = json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not load cars data: {str(e)}")

    # 2. Pre-filter by budget to save LLM context
    affordable_cars = [c for c in all_cars if c['price_lakh'] <= prefs.budget + 0.5]
    
    if not affordable_cars:
        return {"success": True, "results_count": 0, "recommendations": []}

    # Format the cars for the prompt concisely to save tokens
    cars_context = []
    for c in affordable_cars:
        cars_context.append(f"- {c['brand']} {c['name']} ({c['type']}): {c['price_lakh']} Lakh, {c['mileage_kmpl']} kmpl, Safety: {c['safety_rating']} Stars. Benefits: {', '.join(c['key_benefits'])}. Complaints: {', '.join(c['main_complaints'])}.")
    
    cars_text = "\n".join(cars_context)

    # 3. Construct the Prompt
    prompt = f"""
    You are an expert Indian car advisor. I have a client with the following preferences:
    - Max Budget: {prefs.budget} Lakhs
    - Lifestyle Vibe: {prefs.vibe}
    - Dealbreakers / Top Priorities: {prefs.dealbreaker}

    Here are the affordable cars available:
    {cars_text}

    Task:
    Evaluate these cars based on the user's preferences. Choose the EXACT top 3 best matching cars from the list above.
    For each car, calculate a match_score (out of 100), write a 'vibe_verdict' explaining why it fits their lifestyle, and a 'trade_off' realistic warning.
    
    Respond STRICTLY with a valid JSON array containing the top 3 cars in this exact format, with no markdown formatting or extra text outside the JSON:
    [
      {{
        "name": "Car Name",
        "brand": "Car Brand",
        "match_score": 95,
        "vibe_verdict": "Your explanation here...",
        "trade_off": "Your warning here..."
      }}
    ]
    """

    try:
        # 4. Try to call the LLM
        try:
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                timeout=10
            )
            
            reply_content = response.choices[0].message.content
            
            # 5. Extract JSON from the reply
            json_match = re.search(r'\[.*\]', reply_content, re.DOTALL)
            if not json_match:
                raise ValueError("LLM did not return a valid JSON array.")
                
            llm_results = json.loads(json_match.group(0))
            
            # 6. Merge LLM insights with original car data to ensure full payload
            recommendations = []
            for llm_car in llm_results:
                # Find the matching car in our database
                original_car = next((c for c in affordable_cars if c['name'].lower() == llm_car['name'].lower() and c['brand'].lower() == llm_car['brand'].lower()), None)
                
                if original_car:
                    recommendations.append({
                        **original_car,
                        "match_score": llm_car.get('match_score', 80),
                        "vibe_verdict": llm_car.get('vibe_verdict', 'Great fit!'),
                        "trade_off": llm_car.get('trade_off', 'Standard maintenance required.')
                    })

            # Fallback if parsing fails or LLM hallucinates names
            if not recommendations:
                recommendations = affordable_cars[:3]
        
        except Exception as llm_error:
            print(f"LLM provider failed ({str(llm_error)}), using local scoring...")
            # Fallback: Local scoring system
            recommendations = score_cars_locally(affordable_cars, prefs)
        
        # Sort by match score
        recommendations.sort(key=lambda x: x.get('match_score', 0), reverse=True)

        return {
            "success": True,
            "results_count": len(recommendations),
            "recommendations": recommendations[:3]
        }

    except Exception as e:
        print(f"Error: {e}")
        return {"success": False, "error": f"Failed to process: {str(e)}"}
