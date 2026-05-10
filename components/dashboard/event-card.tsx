"use client";

import { useState } from "react";
import { Users, Radio, Trash2, Box, Loader2, Clock, ShieldAlert, RefreshCw, BarChart3, ExternalLink, LayoutGrid } from "lucide-react";
import { purgeEventAction, syncEventAction } from "@/app/actions/ingest";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

import { Event } from "@/types/common";

/**
 * UI/UX PRO MAX COMPONENT: EVENT_CARD_REVAMP
 * Style: High-End Glassmorphism / Enterprise Dashboard
 */
export function EventCard({ event, participantCount, teamCount }: { event: Event, participantCount: number, teamCount: number }) {
  const [isPurging, setIsPurging] = useState(false);
  const [isPurgingActive, setIsPurgingActive] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [purgeInput, setPurgeInput] = useState("");
  const router = useRouter();

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const handlePurge = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (purgeInput.trim() === event.name.trim()) {
      setIsPurgingActive(true);
      const res = await purgeEventAction(event.id);
      setIsPurgingActive(false);
      
      if (res.success) {
        setIsPurging(false);
        setPurgeInput("");
        window.location.reload();
      } else {
        alert("Purge failed: " + res.error);
      }
    }
  };

  const handleSync = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsSyncing(true);
    try {
      const res = await syncEventAction(event.id);
      if (res.success) {
        alert("SYNC_COMPLETE: Registry updated successfully.");
        window.location.reload();
      } else {
        alert("SYNC_FAILED: " + res.error);
      }
    } catch (err) {
      alert("CRITICAL_SYNC_ERROR: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <>
      <div 
        onClick={() => router.push(`/dashboard/event/${event.id}/resources`)}
        className="bg-white/[0.02] border border-white/10 rounded-[2.5rem] flex flex-col hover:border-secondary/30 hover:bg-white/[0.04] transition-all duration-500 shadow-2xl group overflow-hidden cursor-pointer relative"
      >
        {/* Card Header Visual */}
        <div className="h-32 bg-black/40 relative flex items-center justify-center border-b border-white/5 overflow-hidden">
           <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
           <div className={`absolute top-6 right-6 flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${event.is_active ? 'bg-secondary text-black shadow-[0_0_20px_#10b981]' : 'bg-white/5 text-white/30 border border-white/10'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${event.is_active ? 'bg-black animate-pulse' : 'bg-white/20'}`} />
            {event.is_active ? 'Live Node' : 'Offline'}
          </div>
          <Box className="text-white/5 group-hover:text-secondary/10 group-hover:scale-110 transition-all duration-700" size={64} />
        </div>

        {/* Content Area */}
        <div className="p-8 flex-1 flex flex-col gap-8">
          <div className="space-y-1">
            <h3 className="text-3xl font-black text-white uppercase tracking-tighter italic group-hover:text-secondary transition-colors leading-none">{event.name}</h3>
            <p className="text-[11px] text-white/20 font-bold uppercase tracking-widest">Sector_ID: {event.id.slice(0, 8)}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex flex-col gap-1">
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2"><Users size={12}/> Participants</span>
                <span className="text-2xl font-black text-white italic">{(participantCount ?? 0).toLocaleString()}</span>
             </div>
             <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex flex-col gap-1">
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2"><Radio size={12}/> Lab Teams</span>
                <span className="text-2xl font-black text-white italic">{(teamCount ?? 0).toLocaleString()}</span>
             </div>
          </div>

          <div className="space-y-3 bg-black/20 rounded-2xl p-5 border border-white/5">
             <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                <span className="text-white/40">Deployment Window</span>
                <span className="text-white">{formatDate(event.start_time)} — {formatDate(event.end_time)}</span>
             </div>
             <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-secondary w-2/3" />
             </div>
          </div>

          <div className="flex flex-col gap-3 mt-auto">
             <button 
                onClick={handleSync}
                disabled={isSyncing}
                className="w-full flex items-center justify-center gap-3 bg-secondary text-black py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-[#5affb4] transition-all disabled:opacity-50 shadow-xl active:scale-95"
              >
                {isSyncing ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
                {isSyncing ? "Synchronizing..." : "Sync Data"}
             </button>
             <div className="grid grid-cols-2 gap-3">
                <button 
                    onClick={() => router.push(`/dashboard/event/${event.id}/resources`)}
                    className="flex items-center justify-center gap-2 bg-white/5 py-4 rounded-2xl text-[10px] font-black text-white/60 uppercase hover:bg-white/10 border border-white/5 transition-all"
                >
                    <BarChart3 size={14}/> Stats
                </button>
                <button 
                    onClick={(e) => { e.stopPropagation(); router.push(`/war-room/${event.id}`); }}
                    className="flex items-center justify-center gap-2 bg-blue-500/10 py-4 rounded-2xl text-[10px] font-black text-blue-400 uppercase hover:bg-blue-500/20 border border-blue-500/10 transition-all"
                >
                    <LayoutGrid size={14}/> War Room
                </button>
             </div>
             <button 
                onClick={(e) => { e.stopPropagation(); setIsPurging(true); }} 
                className="w-full mt-1 flex items-center justify-center gap-2 bg-red-500/5 py-3 rounded-xl text-[9px] font-black text-red-500/40 uppercase hover:bg-red-500/10 border border-red-500/10 transition-all"
            >
                <Trash2 size={12}/> Emergency Purge
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isPurging && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/95 backdrop-blur-sm p-6" onClick={() => { setIsPurging(false); setPurgeInput(""); }}>
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="bg-zinc-950 border border-white/10 w-full max-w-[440px] rounded-2xl p-8 md:p-10 shadow-2xl relative flex flex-col gap-8 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Visual Danger Indicator - Red Glow */}
              <div className="absolute top-0 left-0 w-full h-1 bg-red-500 shadow-[0_0_20px_#ef4444]" />
              
              <header className="space-y-4 text-center">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em] font-mono">Destructive_Action_Protocol</span>
                </div>
                <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">Deep_Purge</h2>
              </header>

              <div className="space-y-6 text-center">
                <div className="bg-white/5 border border-white/10 p-6 rounded-xl space-y-2">
                  <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest font-mono">Target_Node</p>
                  <p className="text-xl font-black text-red-500 uppercase tracking-tight break-all">{event.name}</p>
                </div>
                
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] font-mono">Verification_Token</p>
                  <input 
                    autoFocus
                    style={{ colorScheme: 'dark' }}
                    className="w-full bg-black/40 border border-white/10 focus:border-red-500/50 outline-none rounded-xl p-5 text-center text-white font-mono text-base uppercase transition-all placeholder:text-white/5 shadow-inner" 
                    placeholder="TYPE_NODE_NAME" 
                    value={purgeInput} 
                    onChange={e => setPurgeInput(e.target.value)} 
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={handlePurge} 
                  disabled={purgeInput.trim() !== (event.name || "").trim() || isPurgingActive} 
                  className="w-full bg-white text-black font-black py-5 rounded-xl uppercase text-[11px] tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-red-500 hover:text-white transition-all disabled:opacity-50 active:scale-95 shadow-xl"
                >
                  {isPurgingActive ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={14} fill="currentColor" />}
                  {isPurgingActive ? "Purging..." : "Execute Terminate"}
                </button>
                <button 
                  onClick={() => { setIsPurging(false); setPurgeInput(""); }}
                  className="w-full bg-transparent border border-white/10 text-white/60 font-black py-4 rounded-xl uppercase text-[13px] tracking-widest hover:bg-white/5 hover:text-white transition-all active:scale-95 font-mono italic"
                >
                  Abort_Sequence
                </button>
              </div>

              {/* Animated Scanline */}
              <div className="absolute inset-0 pointer-events-none animate-scan opacity-5" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
