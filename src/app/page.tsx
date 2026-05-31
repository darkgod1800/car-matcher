"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [budget, setBudget] = useState<number>(10);
  const [vibe, setVibe] = useState<string>("");
  const [dealbreaker, setDealbreaker] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

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

  const handleSubmit = () => {
    if (!vibe || !dealbreaker) {
      setError("Please select both a driving environment and a priority.");
      return;
    }
    setError(null);
    setLoading(true);
    
    // Save to sessionStorage and navigate
    sessionStorage.setItem("carMatcherData", JSON.stringify({
      budget,
      vibe,
      dealbreaker
    }));
    
    router.push("/results");
  };

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

        {/* --- INTAKE FORM --- */}
        <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-10 transition-all">
          <div className="space-y-10">
            
            {/* Question 1: Budget */}
            <section>
              <div className="flex justify-between items-end mb-4">
                <h2 className="text-xl font-semibold text-gray-800">1. What&apos;s your max budget?</h2>
                <span className="text-2xl font-bold text-blue-600">₹{budget} Lakh</span>
              </div>
              <input
                type="range"
                min="3"
                max="50"
                step="0.5"
                value={budget}
                onChange={(e) => setBudget(parseFloat(e.target.value))}
                className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-sm text-gray-500 mt-2 font-medium">
                <span>₹3 L</span>
                <span>₹25 L</span>
                <span>₹50 L</span>
              </div>
            </section>

            {/* Question 2: Vibe */}
            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">2. Daily Driving Environment</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {vibes.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setVibe(v.id)}
                    className={`text-left p-5 rounded-2xl border-2 transition-all duration-200 ${
                      vibe === v.id
                        ? "border-blue-600 bg-blue-50 shadow-md transform scale-[1.02]"
                        : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="font-bold text-lg mb-1">{v.label}</div>
                    <div className="text-sm text-gray-600">{v.desc}</div>
                  </button>
                ))}
              </div>
            </section>

            {/* Question 3: Priority */}
            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">3. Your Top Priority</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {dealbreakers.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setDealbreaker(d.id)}
                    className={`text-left p-5 rounded-2xl border-2 transition-all duration-200 ${
                      dealbreaker === d.id
                        ? "border-blue-600 bg-blue-50 shadow-md transform scale-[1.02]"
                        : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="font-bold text-lg mb-1">{d.label}</div>
                    <div className="text-sm text-gray-600">{d.desc}</div>
                  </button>
                ))}
              </div>
            </section>

            {error && (
              <div className="p-4 bg-red-50 text-red-700 rounded-xl font-medium border border-red-100">
                {error}
              </div>
            )}

            <div className="pt-4">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-4 rounded-2xl shadow-lg transition-all flex items-center justify-center text-lg disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Navigating...
                  </span>
                ) : (
                  "Find My Perfect Car"
                )}
              </button>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
