"use client";

import { useState } from "react";
import Link from "next/link";
import { Users, Radio, Trash2, Settings, AlertTriangle, LayoutDashboard, Eye, Box, Loader2 } from "lucide-react";
import { purgeEventAction } from "@/app/actions/ingest";
import { EventSettingsModal } from "./event-settings-modal";

export function EventCard({ event, participantCount, teamCount }: any) {
  const [isPurging, setIsPurging] = useState(false);
  const [isPurgingActive, setIsPurgingActive] = useState(false);
  const [purgeInput, setPurgeInput] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handlePurge = async () => {
    if (purgeInput.trim() === event.event_name.trim()) {
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
      <div className="bg-zinc-900/20 border border-white/5 rounded-2xl flex flex-col hover:border-emerald-500/40 transition-all shadow-xl group overflow-hidden">
        <div className="h-24 bg-zinc-950 relative flex items-center justify-center border-b border-white/5">
           <div className={`absolute top-3 right-3 flex items-center text-[9px] font-black px-2 py-1 rounded uppercase tracking-widest ${event.is_active ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-zinc-800 text-slate-500'}`}>
            {event.is_active ? 'Live' : 'Offline'}
          </div>
          <Box className="text-zinc-800 group-hover:text-emerald-500/10 transition-all duration-700" size={40} />
        </div>

        <div className="p-6 flex-1 flex flex-col space-y-6">
          <div>
            <h3 className="text-lg md:text-xl font-black text-white uppercase italic tracking-tighter">{event.event_name}</h3>
            <p className="text-[10px] text-slate-600 font-mono uppercase mt-1">ID: {event.id.slice(0, 8)}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 border-y border-white/5 py-4">
            <div>
              <p className="text-2xl font-black text-white font-mono">{(participantCount ?? 0).toLocaleString()}</p>
              <p className="text-[9px] text-slate-500 font-black uppercase flex items-center gap-1"><Users size={12}/> Nodes</p>
            </div>
            <div>
              <p className="text-2xl font-black text-white font-mono">{(teamCount ?? 0).toLocaleString()}</p>
              <p className="text-[9px] text-slate-500 font-black uppercase flex items-center gap-1"><Radio size={12}/> Teams</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-auto">
            <Link href="/dashboard/triage" className="flex items-center justify-center gap-2 bg-white/5 py-3 rounded-lg text-[10px] font-black text-slate-300 uppercase hover:bg-white/10 transition-all"><LayoutDashboard size={14}/> Triage</Link>
            <button onClick={() => setIsSettingsOpen(true)} className="flex items-center justify-center gap-2 bg-white/5 py-3 rounded-lg text-[10px] font-black text-slate-300 uppercase hover:bg-white/10 transition-all"><Settings size={14}/> Config</button>
            <button className="flex items-center justify-center gap-2 bg-white/5 py-3 rounded-lg text-[10px] font-black text-slate-300 uppercase hover:bg-white/10 transition-all"><Eye size={14}/> View</button>
            <button onClick={() => setIsPurging(true)} className="flex items-center justify-center gap-2 bg-red-500/5 py-3 rounded-lg text-[10px] font-black text-red-500/80 uppercase hover:bg-red-500/20 border border-red-500/10 transition-all"><Trash2 size={14}/> Purge</button>
          </div>
        </div>
      </div>

      {isPurging && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4">
          <div className="bg-zinc-950 border border-red-500/20 w-full max-w-sm rounded-3xl p-6 md:p-8 text-center space-y-6">
             <div className="p-4 bg-red-500/10 inline-block rounded-full"><AlertTriangle className="text-red-500" size={32} /></div>
             <div>
               <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Registry Purge Protocol</h2>
               <p className="text-[10px] text-slate-400 mt-2">Permanently wipe all nodes for <strong className="text-white">{event.event_name}</strong>.</p>
             </div>
             <input className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-center text-white font-mono text-sm" placeholder="TYPE EVENT NAME" value={purgeInput} onChange={e => setPurgeInput(e.target.value)} />
             <div className="flex gap-2">
               <button onClick={() => {setIsPurging(false); setPurgeInput("");}} className="flex-1 py-4 text-[10px] font-black text-slate-500 uppercase hover:bg-white/5 rounded-xl transition-all">Abort</button>
               <button onClick={handlePurge} disabled={purgeInput.trim() !== event.event_name.trim() || isPurgingActive} className="flex-1 flex justify-center items-center bg-red-600 py-4 rounded-xl text-white font-black uppercase text-[10px] disabled:bg-zinc-900 transition-all">
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