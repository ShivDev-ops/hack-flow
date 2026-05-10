"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Lock, Clock, Zap, ShieldCheck, Loader2, Rocket, Network, Terminal, Database } from "lucide-react";
import { getEventDetailsForSession, destroyLabSession } from "@/app/actions/lab-auth";
import { Event } from "@/types/common";
import { motion } from "framer-motion";

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
        <Loader2 className="text-secondary animate-spin" size={40} />
      </div>
    );
  }

  const isOver = timeLeft === "OVER";

  const steps = [
    { title: 'Identity Sync', icon: <ShieldCheck size={14} />, detail: 'Verified' },
    { title: 'Git Node', icon: <Terminal size={14} />, detail: 'Active' },
    { title: 'Resource Pulse', icon: <Zap size={14} />, detail: 'Nominal' },
    { title: 'Task Ingress', icon: <Database size={14} />, detail: 'Syncing' }
  ];

  return (
    <div className="min-h-screen bg-background text-white p-6 md:p-10 flex flex-col items-center custom-scrollbar selection:bg-secondary/30">
      
      {/* Background Decor */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-secondary/5 blur-[180px] rounded-full" />
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>
      
      <div className="max-w-4xl w-full z-10 space-y-10">
        
        {/* HEADER SECTION - STRICT ALIGNMENT WITH SYS_SETUP/CONFIG_SYS */}
        <header className="border-b border-white/5 pb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border rim-light transition-all duration-700 ${
                isLive ? 'bg-secondary/10 border-secondary/20 shadow-[0_0_20px_rgba(78,222,163,0.1)]' : 'bg-white/[0.02] border-white/10'
              }`}>
                {isLive ? <Network className="text-secondary" size={24} /> : <Lock className="text-white/20" size={24} />}
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-2 h-2 rounded-full pulse-emerald ${isLive ? 'bg-secondary shadow-[0_0_10px_#4edea3]' : isOver ? 'bg-red-500' : 'bg-white/20'}`} />
                  <span className={`text-[11px] font-black uppercase tracking-[0.4em] font-label-caps ${isLive ? 'text-secondary' : isOver ? 'text-red-500' : 'text-white/40'}`}>
                    System_State // {isLive ? "Operational" : isOver ? "Terminated" : "Restricted"}
                  </span>
                </div>
                <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter italic leading-none">
                  Lobby <span className={isLive ? 'text-white' : 'text-white/20'}>Protocol</span>
                </h1>
              </div>
            </div>
            
            <div className="hidden md:block text-right">
               <p className="text-[10px] text-white/40 uppercase tracking-[0.3em] font-label-caps leading-relaxed max-w-[200px]">
                  {event?.name || 'Assigned_Sector'} // Identity confirmed.
               </p>
            </div>
          </div>
        </header>

        {/* MAIN PANEL - MATCHING CONFIG_SYS CARDS */}
        <div className="space-y-10">
          
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel rim-light rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden bg-white/[0.01]"
          >
            <div className="absolute top-0 right-0 p-10 opacity-[0.02] rotate-12 pointer-events-none">
              <Zap size={140} className="text-white" />
            </div>

            <div className="relative z-10 flex flex-col items-center text-center space-y-10">
              
              <div className="space-y-4 w-full">
                <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-white/40 font-label-caps">
                  {isLive ? "Connection_Established" : isOver ? "Mission_Concluded" : "Telemetry_Synchronization"}
                </h2>
                <div className={`font-data-mono text-6xl md:text-9xl font-black tracking-tighter tabular-nums leading-none ${
                  isLive ? 'text-secondary shadow-[0_0_30px_rgba(78,222,163,0.1)]' : isOver ? 'text-red-500' : 'text-transparent bg-clip-text bg-gradient-to-b from-white to-white/10'
                }`}>
                  {isLive ? "ACTIVE" : isOver ? "00:00:00" : (timeLeft || "00:00:00")}
                </div>
              </div>

              {/* DESCRIPTION BOX - MATCHING SYS_SETUP INFO BOX STYLE */}
              <div className="w-full max-w-2xl px-4">
                <div className="bg-secondary/5 border border-secondary/10 rounded-2xl p-6 md:p-8 flex items-center justify-center">
                  <p className="text-[11px] md:text-xs text-white/60 font-bold uppercase tracking-widest leading-relaxed font-label-caps italic text-center">
                    {isLive 
                      ? "Mission parameters unsealed. Full command uplink established. Establishment of identity bridge complete." 
                      : isOver
                      ? "The operational window has expired. Terminal access revoked. Synchronization concluded."
                      : "Awaiting centralized command uplink for deployment. System telemetry is being synchronized across the mesh."
                    }
                  </p>
                </div>
              </div>

              <div className="w-full max-w-md pt-4">
                {isLive ? (
                  <button 
                    onClick={() => router.push("/lab/dashboard/terminal")}
                    className="w-full bg-secondary hover:bg-[#5affb4] text-black font-black py-5 rounded-[1.5rem] uppercase text-xs tracking-[0.3em] flex items-center justify-center gap-4 transition-all shadow-[0_0_40px_rgba(78,222,163,0.2)] active:scale-[0.98] font-label-caps whitespace-nowrap"
                  >
                    ENTER MISSION CONTROL <Rocket size={20} />
                  </button>
                ) : (
                  <div className="flex items-center justify-center gap-4 text-white/20">
                    <div className="h-px w-12 bg-white/5" />
                    <span className="text-[9px] font-black uppercase tracking-[0.4em] font-label-caps whitespace-nowrap">Standby for Uplink</span>
                    <div className="h-px w-12 bg-white/5" />
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* STEP CARDS - REBUILT TO MATCH KANBAN/CONFIG STYLE */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <motion.div 
                key={step.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-panel rim-light p-6 rounded-[2rem] bg-white/[0.01] border-white/5 hover:border-secondary/20 transition-all group"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className={`p-3 rounded-xl border transition-colors ${isLive || isOver ? 'bg-secondary/10 border-secondary/20 text-secondary' : 'bg-white/5 border-white/10 text-white/20'}`}>
                    {step.icon}
                  </div>
                  <span className="text-[10px] font-black font-data-mono text-white/10 group-hover:text-white/20">0{i+1}</span>
                </div>
                <div className="space-y-1">
                  <div className="text-[11px] font-black text-white/80 uppercase tracking-widest font-label-caps group-hover:text-white transition-colors">{step.title}</div>
                  <div className={`text-[9px] font-black uppercase tracking-wider flex items-center gap-2 ${isLive || isOver ? 'text-secondary/60' : 'text-white/10'}`}>
                    <ShieldCheck size={10} className={isLive || isOver ? 'text-secondary' : 'text-white/20'} />
                    {isLive || isOver ? step.detail : "Locked"}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

        </div>

        {/* FOOTER INFO */}
        <footer className="pt-10 flex flex-col md:flex-row justify-between items-center gap-6 opacity-40">
           <div className="flex items-center gap-4">
              <div className="w-1.5 h-1.5 bg-secondary rounded-full" />
              <p className="text-[9px] font-black uppercase tracking-[0.4em] font-label-caps">Mesh_ID: {event?.id?.slice(0, 8) || 'Unknown'}</p>
           </div>
           <div className="flex gap-8">
              <span className="text-[9px] font-black uppercase tracking-[0.3em] font-label-caps hover:text-white transition-colors cursor-pointer">Protocol_Docs</span>
              <span className="text-[9px] font-black uppercase tracking-[0.3em] font-label-caps hover:text-white transition-colors cursor-pointer">Support_Link</span>
           </div>
        </footer>

      </div>
    </div>
  );
}
