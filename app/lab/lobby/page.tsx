"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Lock, Clock, Zap, ShieldCheck, Loader2, Rocket } from "lucide-react";
import { getEventDetailsForSession, destroyLabSession } from "@/app/actions/lab-auth";

export default function LobbyPage() {
  const router = useRouter();
  const [event, setEvent] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState("");
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchEventStatus = useCallback(async () => {
    const data = await getEventDetailsForSession();
    
    if (!data) {
      console.error("CRITICAL: No Event Data found for this session. Purging credentials.");
      await destroyLabSession(); 
      router.push("/lab/login");
      return;
    }

    setEvent(data);
    setLoading(false);
    
    // Strict Window Checking
    const now = new Date().getTime();
    const startTime = new Date(data.start_time).getTime();
    const endTime = data.end_time ? new Date(data.end_time).getTime() : new Date(startTime + 86400000).getTime();

    if (now > endTime) {
      setIsLive(false);
      setTimeLeft("OVER");
    } else if (data.is_active && now >= startTime && now <= endTime) {
      setIsLive(true);
    } else {
      setIsLive(false);
    }
  }, [router]);

  useEffect(() => {
    fetchEventStatus();
    // Poll every 30 seconds
    const pollInterval = setInterval(fetchEventStatus, 30000);
    return () => clearInterval(pollInterval);
  }, [fetchEventStatus]);

  useEffect(() => {
    if (!event || isLive || timeLeft === "OVER") return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const startTime = new Date(event.start_time).getTime();
      const distance = startTime - now;

      if (distance <= 0) {
        clearInterval(interval);
        fetchEventStatus(); // Trigger re-check when timer hits 0
      } else {
        const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((distance % (1000 * 60)) / 1000);
        setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [event, isLive, timeLeft, fetchEventStatus]);

  // Auto-redirect if status becomes live via polling
  useEffect(() => {
    if (isLive) {
      const timer = setTimeout(() => {
        router.push("/lab/terminal");
      }, 3000); // 3 second delay to let them see the "Active" state
      return () => clearTimeout(timer);
    }
  }, [isLive, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center">
        <Loader2 className="text-emerald-500 animate-spin" size={40} />
      </div>
    );
  }

  const isOver = timeLeft === "OVER";

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background aesthetic */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 blur-[150px] rounded-full pointer-events-none" />
      
      <div className="max-w-xl w-full z-10 text-center space-y-10">
        
        <div className={`inline-flex items-center justify-center p-4 rounded-full border mb-4 ${isLive ? 'bg-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.4)] border-emerald-400' : isOver ? 'bg-red-500/10 border-red-500/20' : 'bg-emerald-500/10 border-emerald-500/20 animate-pulse'}`}>
          {isLive ? <Rocket className="text-black" size={32} /> : isOver ? <Lock className="text-red-500" size={32} /> : <Lock className="text-emerald-500" size={32} />}
        </div>

        <div>
          <h1 className="text-3xl md:text-5xl font-black font-mono uppercase tracking-tighter italic">
            {isLive ? "Systems Active" : isOver ? "Event Concluded" : "Systems Locked"}
          </h1>
          <p className="text-slate-500 font-mono text-[10px] md:text-xs uppercase tracking-[0.2em] mt-4">
            {isLive 
              ? "Mission parameters unsealed. Uplink established." 
              : isOver
              ? "The operational window has closed. Thank you for participating."
              : `Waiting for ${event?.name || 'Event'} uplink. Mission parameters are currently classified.`
            }
          </p>
        </div>

        {/* COUNTDOWN CORE / ACTIVATE BUTTON */}
        <div className="bg-zinc-950 border border-white/5 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20"><Zap size={40} /></div>
          
          {isLive ? (
            <div className="space-y-6">
              <p className="text-[10px] text-emerald-500 font-mono font-black uppercase tracking-widest flex items-center justify-center gap-2">
                <ShieldCheck size={12} /> Authorization Verified
              </p>
              <button 
                onClick={() => router.push("/lab/terminal")}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-6 rounded-2xl uppercase text-sm flex items-center justify-center gap-3 transition-all shadow-[0_0_50px_rgba(16,185,129,0.2)] hover:scale-[1.02] active:scale-[0.98]"
              >
                Enter Terminal <Rocket size={18} />
              </button>
            </div>
          ) : isOver ? (
            <div className="space-y-6">
               <p className="text-[10px] text-red-500 font-mono font-black uppercase tracking-widest flex items-center justify-center gap-2">
                <Lock size={12} /> Terminal Locked
              </p>
              <div className="font-mono text-5xl md:text-7xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-red-500 to-red-500/40 tabular-nums">
                00:00:00
              </div>
            </div>
          ) : (
            <>
              <p className="text-[10px] text-emerald-500 font-mono font-black uppercase tracking-widest mb-4 flex items-center justify-center gap-2">
                <Clock size={12} /> T-Minus to Unseal
              </p>
              
              <div className="font-mono text-5xl md:text-7xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40 tabular-nums">
                {timeLeft || "00:00:00"}
              </div>
            </>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
           {['Identity Sync', 'Git Webhooks', 'Database Link', 'Mission Specs'].map((step, i) => (
             <div key={step} className="bg-white/[0.02] border border-white/5 p-4 rounded-xl">
                <div className="flex justify-between items-center mb-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${isLive || isOver ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-emerald-500/40'}`} />
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