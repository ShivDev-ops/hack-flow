// app/gateway/page.tsx
"use client";

import { useState } from "react";
import { verifyPinAndFetchTeams } from "@/app/actions/gateway";

export default function GatewayPage() {
  const [pin, setPin] = useState("");
  const [step, setStep] = useState(1); // 1: PIN, 2: Team Select, 3: Identity Claim
  const [, setTeams] = useState<string[]>([]);
  const [error, setError] = useState("");

  const handlePinSubmit = async () => {
    const res = await verifyPinAndFetchTeams(pin);
    if (res.success) {
      setTeams(res.teams || []);
      setStep(2);
    } else {
      setError(res.error || "Invalid PIN");
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">
            Hack-Flow <span className="text-emerald-500">Gateway</span>
          </h1>
          <p className="text-slate-500 text-xs mt-2 uppercase tracking-widest">Identify to Access Terminal</p>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <input 
              type="text" 
              maxLength={6}
              placeholder="ENTER EVENT PIN"
              className="w-full bg-zinc-900 border-2 border-zinc-800 rounded-xl p-5 text-center text-3xl font-mono text-emerald-500 focus:border-emerald-500 outline-none transition-all"
              value={pin}
              onChange={(e) => setPin(e.target.value.toUpperCase())}
            />
            {error && <p className="text-red-500 text-center text-xs font-bold">{error}</p>}
            <button 
              onClick={handlePinSubmit}
              className="w-full bg-white text-black font-black py-4 rounded-xl uppercase tracking-tighter hover:bg-emerald-500 transition-colors"
            >
              Verify Uplink
            </button>
          </div>
        )}

        {/* Step 2 & 3 will be populated next */}
      </div>
    </div>
  );
}