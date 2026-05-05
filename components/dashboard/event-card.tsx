"use client";

import { useState } from "react";
import Link from "next/link";
import { Users, Radio, Trash2, Settings, AlertTriangle, LayoutDashboard, Eye, Box, Loader2, Clock } from "lucide-react";
import { purgeEventAction } from "@/app/actions/ingest";
import { EventSettingsModal } from "./event-settings-modal";

import { Event } from "@/types/common";

export function EventCard({ event, participantCount, teamCount }: { event: Event, participantCount: number, teamCount: number }) {
  const [isPurging, setIsPurging] = useState(false);
  const [isPurgingActive, setIsPurgingActive] = useState(false);
  const [purgeInput, setPurgeInput] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handlePurge = async () => {
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

  return (
    <>
      <div className="bg-[#050505] border border-white/10 rounded-3xl flex flex-col hover:border-white/30 transition-all shadow-2xl group overflow-hidden">
        <div className="h-[96px] bg-black relative flex items-center justify-center border-b border-white/10">
           <div className={`absolute top-[12px] right-[12px] flex items-center text-[9px] font-black px-[8px] py-[4px] rounded uppercase tracking-widest ${event.is_active ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'bg-white/[0.05] text-[#a1a1aa] border border-white/10'}`}>
            {event.is_active ? 'Live' : 'Offline'}
          </div>
          <Box className="text-white/5 group-hover:text-white/10 transition-all duration-700" size={40} />
        </div>

        <div className="p-[24px] flex-1 flex flex-col space-y-[24px]">
          <div>
            <h3 className="text-lg md:text-xl font-black text-white uppercase tracking-tighter">{event.name}</h3>
            <p className="text-[10px] text-[#a1a1aa] font-mono uppercase mt-[4px]">ID: {event.id.slice(0, 8)}</p>
          </div>

          <div className="space-y-[8px] border-y border-white/10 py-[16px]">
             <div className="flex items-center gap-[8px] text-[9px] font-bold text-[#a1a1aa] uppercase tracking-widest">
                <Clock size={12} className="text-[#a1a1aa]" />
                <span>Start: <span className="text-white">{formatDate(event.start_time)}</span></span>
             </div>
             <div className="flex items-center gap-[8px] text-[9px] font-bold text-[#a1a1aa] uppercase tracking-widest">
                <Clock size={12} className="text-[#a1a1aa]" />
                <span>End: <span className="text-white">{formatDate(event.end_time)}</span></span>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-[16px]">
            <div>
              <p className="text-2xl font-black text-white font-mono">{(participantCount ?? 0).toLocaleString()}</p>
              <p className="text-[9px] text-[#a1a1aa] font-black uppercase flex items-center gap-[4px]"><Users size={12}/> Nodes</p>
            </div>
            <div>
              <p className="text-2xl font-black text-white font-mono">{(teamCount ?? 0).toLocaleString()}</p>
              <p className="text-[9px] text-[#a1a1aa] font-black uppercase flex items-center gap-[4px]"><Radio size={12}/> Teams</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-[8px] mt-auto">
            <Link href="/dashboard/triage" className="flex items-center justify-center gap-[8px] bg-white/[0.03] border border-white/10 py-[12px] rounded-xl text-[10px] font-black text-white uppercase hover:bg-white/[0.08] transition-all"><LayoutDashboard size={14}/> Triage</Link>
            <button onClick={() => setIsSettingsOpen(true)} className="flex items-center justify-center gap-[8px] bg-white/[0.03] border border-white/10 py-[12px] rounded-xl text-[10px] font-black text-white uppercase hover:bg-white/[0.08] transition-all"><Settings size={14}/> Config</button>
            <Link href={`/dashboard/event/${event.id}`} className="flex items-center justify-center gap-[8px] bg-white/[0.03] border border-white/10 py-[12px] rounded-xl text-[10px] font-black text-white uppercase hover:bg-white/[0.08] transition-all"><Eye size={14}/> View</Link>
            <button onClick={() => setIsPurging(true)} className="flex items-center justify-center gap-[8px] bg-red-500/10 py-[12px] rounded-xl text-[10px] font-black text-red-500 uppercase hover:bg-red-500/20 border border-red-500/20 transition-all"><Trash2 size={14}/> Purge</button>
          </div>
        </div>
      </div>

      {isPurging && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-md p-[16px]">
          {/* THE NUCLEAR FIX: Raw React inline styles guarantee the width cannot collapse */}
          <div 
            className="bg-[#050505] border border-red-500/20 rounded-3xl p-[24px] md:p-[32px] text-center space-y-[24px] shadow-2xl"
            style={{ width: '100%', maxWidth: '400px', minWidth: '320px' }}
          >
             <div className="p-[16px] bg-red-500/10 inline-block rounded-full"><AlertTriangle className="text-red-500" size={32} /></div>
             <div>
               <h2 className="text-xl font-black text-white uppercase tracking-tighter">Registry Purge Protocol</h2>
               <p className="text-[10px] text-[#a1a1aa] mt-[8px]">Permanently wipe all nodes for <strong className="text-white">{event.name}</strong>.</p>
             </div>
             <input className="w-full bg-white/[0.03] border border-white/10 focus:border-red-500/50 outline-none rounded-xl p-[16px] text-center text-white font-mono text-sm transition-colors" placeholder="TYPE EVENT NAME" value={purgeInput} onChange={e => setPurgeInput(e.target.value)} />
             <div className="flex gap-[8px]">
               <button onClick={() => {setIsPurging(false); setPurgeInput("");}} className="flex-1 py-[16px] text-[10px] font-black text-[#a1a1aa] uppercase hover:text-white rounded-xl transition-all">Abort</button>
               <button onClick={handlePurge} disabled={purgeInput.trim() !== (event.name || "").trim() || isPurgingActive} className="flex-1 flex justify-center items-center bg-red-600 hover:bg-red-500 py-[16px] rounded-xl text-white font-black uppercase text-[10px] disabled:opacity-50 disabled:bg-white/5 disabled:text-[#a1a1aa] transition-all">
                  {isPurgingActive ? <Loader2 className="animate-spin" size={14}/> : "Execute"}
               </button>
             </div>
          </div>
        </div>
      )}
      
      <EventSettingsModal event={event} isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
}