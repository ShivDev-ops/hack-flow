"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lock, Clock, Zap, ShieldCheck } from "lucide-react";

export default function LobbyPage() {
  const router = useRouter();
  // In reality, fetch this from your `hf_events` table
  const mockStartTime = new Date(new Date().getTime() + 15 * 60000); // 15 mins from now
  
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = mockStartTime.getTime() - now;

      if (distance < 0) {
        clearInterval(interval);
        router.push("/lab/terminal"); // Auto-push to terminal when time is up
      } else {
        const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((distance % (1000 * 60)) / 1000);
        setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background aesthetic */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 blur-[150px] rounded-full pointer-events-none" />
      
      <div className="max-w-xl w-full z-10 text-center space-y-10">
        
        <div className="inline-flex items-center justify-center p-4 bg-emerald-500/10 rounded-full border border-emerald-500/20 mb-4 animate-pulse">
          <Lock className="text-emerald-500" size={32} />
        </div>

        <div>
          <h1 className="text-3xl md:text-5xl font-black font-mono uppercase tracking-tighter italic">Systems Locked</h1>
          <p className="text-slate-500 font-mono text-[10px] md:text-xs uppercase tracking-[0.2em] mt-4">
            Mission parameters are currently classified. Waiting for organizer uplink.
          </p>
        </div>

        {/* COUNTDOWN CORE */}
        <div className="bg-zinc-950 border border-white/5 rounded-3xl p-8 md:p-12 shadow-2xl relative">
          <div className="absolute top-0 right-0 p-4 opacity-20"><Zap size={40} /></div>
          
          <p className="text-[10px] text-emerald-500 font-mono font-black uppercase tracking-widest mb-4 flex items-center justify-center gap-2">
            <Clock size={12} /> T-Minus to Unseal
          </p>
          
          <div className="font-mono text-5xl md:text-7xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40 tabular-nums">
            {timeLeft || "00:00:00"}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
           {['Identity Sync', 'Git Webhooks', 'Database Link', 'Mission Specs'].map((step, i) => (
             <div key={step} className="bg-white/[0.02] border border-white/5 p-4 rounded-xl">
                <div className="flex justify-between items-center mb-2">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  <span className="text-[8px] text-slate-600 font-black">0{i+1}</span>
                </div>
                <div className="text-[9px] font-mono uppercase font-bold text-white/70">{step}</div>
                <div className="text-[8px] font-mono text-emerald-500 uppercase mt-1 flex items-center gap-1">
                  <ShieldCheck size={8} /> Verified
                </div>
             </div>
           ))}
        </div>

      </div>
    </div>
  );
}