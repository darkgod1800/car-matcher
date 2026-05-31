"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface CarRecommendation {
  id: string;
  name: string;
  brand: string;
  type: string;
  price_lakh: number;
  mileage_kmpl: number;
  safety_rating: number;
  key_benefits: string[];
  main_complaints: string[];
  match_score: number;
  vibe_verdict: string;
  trade_off: string;
}

export default function Results() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<CarRecommendation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [budget, setBudget] = useState<number>(0);
  const [vibe, setVibe] = useState<string>("");
  const [dealbreaker, setDealbreaker] = useState<string>("");

  const vibes = [
    { id: "city", label: "City Commute", desc: "Nimble, easy to park" },
    { id: "family", label: "Family First", desc: "Spacious, safe" },
    { id: "rough", label: "Rough & Tough", desc: "Go anywhere" },
  ];

  const dealbreakers = [
    { id: "efficiency", label: "Max Fuel Saving", desc: "Mileage is key" },
    { id: "safety", label: "Top Safety", desc: "No compromises" },
    { id: "premium", label: "Premium Feel", desc: "Luxury matters" },
  ];

  useEffect(() => {
    const data = sessionStorage.getItem("carMatcherData");
    if (!data) {
      // User hasn't submitted the form, redirect back
      router.replace("/");
      return;
    }

    const parsedData = JSON.parse(data);

    const fetchResults = async () => {
      try {
        const res = await fetch("/api/recommend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            budget: parsedData.budget,
            vibe: parsedData.vibe,
            dealbreakers: [parsedData.dealbreaker]
          }),
        });
        
        const responseData = await res.json();
        
        // Set parameters after async fetch to avoid synchronous setState warning
        setBudget(parsedData.budget);
        setVibe(parsedData.vibe);
        setDealbreaker(parsedData.dealbreaker);

        if (responseData.success) {
          setResults(responseData.recommendations);
        } else {
          setError(responseData.error || "Failed to fetch recommendations.");
        }
      } catch {
        setError("An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [router]);

  const handleStartOver = () => {
    sessionStorage.removeItem("carMatcherData");
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center font-sans">
        <svg className="animate-spin h-12 w-12 text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <h2 className="text-xl font-bold text-gray-800">Finding your perfect matches...</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-blue-200">
      <main className="max-w-6xl mx-auto px-4 py-12 md:py-20">
        
        {/* Header */}
        <header className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 mb-4">
            Car Matcher
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Find the perfect car for your lifestyle in the Indian market without the jargon.
          </p>
        </header>

        <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <h2 className="text-2xl font-bold text-gray-800">Your Top Matches</h2>
            <p className="text-gray-500 font-medium text-center md:text-right">
              Under ₹{budget} Lakh • {vibes.find(v => v.id === vibe)?.label} • {dealbreakers.find(d => d.id === dealbreaker)?.label}
            </p>
          </div>
          
          {error ? (
            <div className="text-center bg-white p-12 rounded-3xl border border-red-100 shadow-sm text-red-600">
              <p className="text-xl">{error}</p>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center bg-white p-12 rounded-3xl border border-gray-100 shadow-sm">
              <p className="text-xl text-gray-600">No cars found matching your criteria. Try increasing your budget or changing preferences.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              {results.map((car, index) => (
                <div key={car.id} className="bg-white rounded-3xl overflow-hidden shadow-md border border-gray-100 flex flex-col hover:shadow-lg transition-shadow">
                  
                  {/* Real Image fetching based on car name */}
                  <div className="h-56 bg-gray-200 relative overflow-hidden flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={`/Cars/${car.name}.png`}
                      alt={`${car.brand} ${car.name}`}
                      className="w-full h-full object-cover object-center"
                      onError={(e) => {
                        // Fallback in case image is missing
                        (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-${car.type === 'suv' ? '1533473359331-0135ef1b58bf' : car.type === 'sedan' ? '1555215695-3004980ad54e' : '1609521263047-f8f205293f24'}?auto=format&fit=crop&w=600&q=80`;
                      }}
                    />
                    {index === 0 && (
                      <div className="absolute top-4 left-4 bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm">
                        Top Match
                      </div>
                    )}
                  </div>
                  
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{car.brand}</p>
                        <h3 className="text-2xl font-extrabold text-gray-900 leading-none">{car.name}</h3>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Price</p>
                        <p className="text-xl font-bold text-gray-900 leading-none">₹{car.price_lakh}L</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-6">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-600 capitalize">
                        {car.type}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700">
                        {car.mileage_kmpl} kmpl
                      </span>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-purple-50 text-purple-700">
                        {car.safety_rating}★ Safety
                      </span>
                    </div>

                    <div className="flex-1 flex flex-col justify-end space-y-3">
                      <div className="bg-emerald-50/80 border border-emerald-100 p-4 rounded-2xl">
                        <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">Vibe Verdict</h4>
                        <p className="text-sm text-emerald-950 leading-relaxed font-medium">
                          {car.vibe_verdict}
                        </p>
                      </div>
                      
                      <div className="bg-amber-50/80 border border-amber-100 p-4 rounded-2xl">
                        <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">Real Trade-Off</h4>
                        <p className="text-sm text-amber-950 leading-relaxed font-medium">
                          {car.trade_off}
                        </p>
                      </div>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}

          <div className="mt-16 text-center">
            <button
              onClick={handleStartOver}
              className="inline-flex items-center justify-center px-8 py-3.5 border-2 border-gray-200 text-base font-semibold rounded-full text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900 transition-all shadow-sm focus:outline-none focus:ring-4 focus:ring-gray-100"
            >
              Start Over
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}
