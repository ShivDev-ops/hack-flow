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
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-md p-6" onClick={(e) => e.stopPropagation()}>
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#0A0A0B] border border-red-500/20 rounded-[3rem] p-10 text-center space-y-8 shadow-2xl max-w-md w-full relative"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 bg-red-500/10 inline-block rounded-3xl mb-2"><ShieldAlert className="text-red-500" size={40} /></div>
                <div className="space-y-2">
                    <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">Deep Purge</h2>
                    <p className="text-[11px] text-white/40 uppercase font-bold tracking-widest leading-relaxed">
                        Authorized destructive action for <span className="text-red-500">{event.name}</span>. <br/>
                        Type node name to confirm.
                    </p>
                </div>
                
                <input 
                    autoFocus
                    className="w-full bg-white/[0.03] border border-white/10 focus:border-red-500/50 outline-none rounded-2xl p-5 text-center text-white font-mono text-base transition-colors uppercase" 
                    placeholder="CONFIRM NODE NAME" 
                    value={purgeInput} 
                    onChange={e => setPurgeInput(e.target.value)} 
                />
                
                <div className="flex flex-col gap-3">
                    <button onClick={handlePurge} disabled={purgeInput.trim() !== (event.name || "").trim() || isPurgingActive} className="w-full bg-red-600 hover:bg-red-500 py-5 rounded-2xl text-white font-black uppercase text-xs tracking-widest disabled:opacity-20 transition-all shadow-[0_0_40px_#ef444433] active:scale-95">
                        {isPurgingActive ? <Loader2 className="animate-spin" size={20}/> : "Execute_Deep_Purge"}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setIsPurging(false); setPurgeInput(""); }} className="w-full py-3 text-[10px] font-black text-white/20 uppercase tracking-[0.4em] hover:text-white transition-all">Abort_Operation</button>
                </div>
            </motion.div>
            </div>
        )}
      </AnimatePresence>
    </>
  );
}
