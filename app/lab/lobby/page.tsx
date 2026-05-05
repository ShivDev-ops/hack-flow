"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Lock, Clock, Zap, ShieldCheck, Loader2, Rocket } from "lucide-react";
import { getEventDetailsForSession, destroyLabSession } from "@/app/actions/lab-auth";
import { Event } from "@/types/common";

export default function LobbyPage() {
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
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
    const init = async () => {
      await fetchEventStatus();
    };
    init();

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
        router.push("/lab/dashboard/terminal");
      }, 3000); // 3 second delay to let them see the "Active" state
      return () => clearTimeout(timer);
    }
  }, [isLive, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="text-white animate-spin" size={40} />
      </div>
    );
  }

  const isOver = timeLeft === "OVER";

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-[16px] relative overflow-hidden">
      {/* Background aesthetic - Swapped to a subtle white/glassy glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/[0.02] blur-[150px] rounded-full pointer-events-none" />
      
      {/* THE NUCLEAR FIX: Hardcoded max-width to prevent v4 collapse */}
      <div 
        className="w-full z-10 text-center space-y-[40px]"
        style={{ maxWidth: '576px' }}
      >
        
        <div className={`inline-flex items-center justify-center p-[16px] rounded-full border mb-[16px] transition-all duration-700 ${
          isLive 
            ? 'bg-white shadow-[0_0_40px_rgba(255,255,255,0.3)] border-white' 
            : isOver 
            ? 'bg-red-500/10 border-red-500/20' 
            : 'bg-white/[0.02] border-white/10 animate-pulse'
        }`}>
          {isLive ? <Rocket className="text-black" size={32} /> : isOver ? <Lock className="text-red-500" size={32} /> : <Lock className="text-[#a1a1aa]" size={32} />}
        </div>

        <div>
          <h1 className="text-3xl md:text-5xl font-black font-sans uppercase tracking-tighter italic">
            {isLive ? "Systems Active" : isOver ? "Event Concluded" : "Systems Locked"}
          </h1>
          <p className="text-[#a1a1aa] font-mono text-[10px] md:text-xs uppercase tracking-[0.2em] mt-[16px]">
            {isLive 
              ? "Mission parameters unsealed. Uplink established." 
              : isOver
              ? "The operational window has closed. Thank you for participating."
              : `Waiting for ${event?.name || 'Event'} uplink. Mission parameters are classified.`
            }
          </p>
        </div>

        {/* COUNTDOWN CORE / ACTIVATE BUTTON */}
        <div className="bg-[#050505] border border-white/10 rounded-3xl p-[32px] md:p-[48px] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-[16px] opacity-10"><Zap size={40} className="text-white" /></div>
          
          {isLive ? (
            <div className="space-y-[24px]">
              <p className="text-[10px] text-white font-mono font-black uppercase tracking-widest flex items-center justify-center gap-[8px]">
                <ShieldCheck size={12} className="text-white" /> Authorization Verified
              </p>
              <button 
                onClick={() => router.push("/lab/dashboard/terminal")}
                className="w-full bg-white hover:bg-zinc-200 text-black font-black py-[24px] rounded-2xl uppercase text-sm flex items-center justify-center gap-[12px] transition-all shadow-[0_0_40px_rgba(255,255,255,0.15)] active:scale-[0.98]"
              >
                Enter Terminal <Rocket size={18} />
              </button>
            </div>
          ) : isOver ? (
            <div className="space-y-[24px]">
               <p className="text-[10px] text-red-500 font-mono font-black uppercase tracking-widest flex items-center justify-center gap-[8px]">
                <Lock size={12} /> Terminal Locked
              </p>
              <div className="font-mono text-5xl md:text-7xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-red-500 to-red-500/40 tabular-nums">
                00:00:00
              </div>
            </div>
          ) : (
            <>
              <p className="text-[10px] text-[#a1a1aa] font-mono font-black uppercase tracking-widest mb-[16px] flex items-center justify-center gap-[8px]">
                <Clock size={12} className="text-white" /> T-Minus to Unseal
              </p>
              
              <div className="font-mono text-5xl md:text-7xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40 tabular-nums">
                {timeLeft || "00:00:00"}
              </div>
            </>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-[16px] text-left">
           {['Identity Sync', 'Git Webhooks', 'Database Link', 'Mission Specs'].map((step, i) => (
             <div key={step} className="bg-white/[0.02] border border-white/5 p-[16px] rounded-xl">
                <div className="flex justify-between items-center mb-[8px]">
                  <div className={`w-[6px] h-[6px] rounded-full ${isLive || isOver ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'bg-white/20'}`} />
                  <span className="text-[8px] text-zinc-600 font-black">0{i+1}</span>
                </div>
                <div className="text-[9px] font-mono uppercase font-bold text-[#a1a1aa]">{step}</div>
                <div className="text-[8px] font-mono text-white uppercase mt-[4px] flex items-center gap-[4px]">
                  <ShieldCheck size={8} className="text-white" /> Verified
                </div>
             </div>
           ))}
        </div>

      </div>
    </div>
  );
}