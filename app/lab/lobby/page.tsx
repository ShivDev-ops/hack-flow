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
    <div className="min-h-screen bg-background text-white flex flex-col items-center justify-center p-6 relative overflow-hidden selection:bg-secondary/30">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-secondary/5 blur-[150px] rounded-full pointer-events-none -z-10" />
      
      <div 
        className="w-full z-10 text-center space-y-12"
        style={{ maxWidth: '640px' }}
      >
        
        <div className={`inline-flex items-center justify-center w-20 h-20 rounded-[2rem] border transition-all duration-1000 ${
          isLive 
            ? 'bg-secondary text-black shadow-[0_0_50px_rgba(78,222,163,0.4)] border-transparent' 
            : isOver 
            ? 'bg-red-500/10 border-red-500/20 text-red-500' 
            : 'bg-white/[0.02] border-white/10 animate-pulse text-white/20'
        } rim-light`}>
          {isLive ? <Rocket size={32} fill="currentColor" /> : isOver ? <Lock size={32} /> : <Lock size={32} />}
        </div>

        <div>
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-secondary pulse-emerald shadow-[0_0_10px_#4edea3]' : isOver ? 'bg-red-500' : 'bg-white/20'}`} />
            <span className={`text-[10px] font-black uppercase tracking-[0.5em] font-label-caps ${isLive ? 'text-secondary' : isOver ? 'text-red-500' : 'text-white/20'}`}>
              System_State: {isLive ? "Operational" : isOver ? "Terminated" : "Restricted"}
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic leading-none">
            {isLive ? "Systems_Active" : isOver ? "Protocol_End" : "Systems_Locked"}
          </h1>
          <p className="text-white/40 font-bold text-[10px] md:text-xs uppercase tracking-[0.3em] mt-6 font-label-caps max-w-lg mx-auto leading-relaxed">
            {isLive 
              ? "Mission parameters unsealed. Full command uplink established. Prepare for deployment." 
              : isOver
              ? "The operational window has expired. Terminal access revoked. Synchronization concluded."
              : `Awaiting centralized command uplink for ${event?.name || 'Assigned_Sector'}. Mission specs classified.`
            }
          </p>
        </div>

        {/* COUNTDOWN CORE / ACTIVATE BUTTON */}
        <div className="glass-panel rim-light rounded-[3rem] p-10 md:p-16 shadow-2xl relative overflow-hidden bg-white/[0.01]">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] rotate-12"><Zap size={120} className="text-white" /></div>
          
          {isLive ? (
            <div className="space-y-8 animate-in zoom-in-95 duration-500">
              <p className="text-[10px] text-secondary font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 font-label-caps">
                <ShieldCheck size={14} className="pulse-emerald" /> Identity_Verified // Link_Ready
              </p>
              <button 
                onClick={() => router.push("/lab/dashboard/terminal")}
                className="w-full bg-secondary hover:bg-[#5affb4] text-black font-black py-6 rounded-[1.5rem] uppercase text-xs tracking-[0.3em] flex items-center justify-center gap-4 transition-all shadow-[0_0_50px_rgba(78,222,163,0.3)] active:scale-95 font-label-caps"
              >
                Establish_Terminal_Uplink <Rocket size={20} />
              </button>
            </div>
          ) : isOver ? (
            <div className="space-y-8">
               <p className="text-[10px] text-red-500 font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 font-label-caps">
                <Lock size={14} /> Authorization_Revoked
              </p>
              <div className="font-data-mono text-6xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-red-500 to-red-500/10 tabular-nums">
                00:00:00
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 font-label-caps">
                <Clock size={14} className="text-secondary" /> T-Minus_to_Unseal
              </p>
              
              <div className="font-data-mono text-6xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/10 tabular-nums">
                {timeLeft || "00:00:00"}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
           {['Identity Sync', 'Git Node', 'Resource Pulse', 'Task Ingress'].map((step, i) => (
             <div key={step} className="glass-panel rim-light p-5 rounded-2xl bg-white/[0.01] hover:border-secondary/20 transition-colors">
                <div className="flex justify-between items-center mb-3">
                  <div className={`w-1.5 h-1.5 rounded-full ${isLive || isOver ? 'bg-secondary shadow-[0_0_8px_#4edea3]' : 'bg-white/10'}`} />
                  <span className="text-[8px] text-white/10 font-black font-data-mono">0{i+1}</span>
                </div>
                <div className="text-[10px] font-label-caps uppercase font-black text-white/60 tracking-wider mb-2">{step}</div>
                <div className={`text-[8px] font-data-mono uppercase flex items-center gap-2 ${isLive || isOver ? 'text-secondary/60' : 'text-white/10'}`}>
                  {isLive || isOver ? <><ShieldCheck size={8} /> Verified</> : <><Lock size={8} /> Locked</>}
                </div>
             </div>
           ))}
        </div>

      </div>
    </div>
  );
}