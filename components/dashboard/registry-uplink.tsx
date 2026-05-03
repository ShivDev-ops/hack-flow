"use client";

import { useState } from "react";
import { ingestParticipants } from "@/app/actions/ingest";
import { User, Users, Loader2 } from "lucide-react";

export function RegistryUplink({ headers, maxMembers, eventId, sheetUrl, onComplete }: any) {
  const [loading, setLoading] = useState(false);
  const [shouldPurge, setShouldPurge] = useState(false);
  const [mapping, setMapping] = useState<any>({ team_name: "" });

  const renderSelect = (key: string, label: string) => (
    <select 
      className="bg-black border border-white/10 rounded-lg p-3 text-[10px] text-white outline-none w-full appearance-none" 
      onChange={e => setMapping({...mapping, [key]: e.target.value})}
    >
      <option value="">-- {label.toUpperCase()} --</option>
      {headers.map((h: string) => <option key={h} value={h}>{h}</option>)}
    </select>
  );

  const renderMemberMapping = (index: number, isLeader: boolean) => {
    const key = isLeader ? "leader" : `m${index + 1}`;
    const label = isLeader ? "Team Leader" : `Member ${index + 1}`;
    return (
      <div key={key} className="p-4 md:p-5 bg-white/[0.02] border border-white/5 rounded-2xl space-y-3">
        <p className="text-[10px] font-black text-emerald-500 uppercase flex items-center gap-2">
          {isLeader ? <User size={14}/> : <Users size={14}/>} {label} 
          {/* Only the leader is strictly required to form a team node */}
          {isLeader ? <span className="text-slate-500">(Required)</span> : <span className="text-slate-600">(Optional)</span>}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {renderSelect(`${key}_name`, "Name")}
          {renderSelect(`${key}_reg`, "Reg ID")}
          {renderSelect(`${key}_email`, "Email")}
          {renderSelect(`${key}_phone`, "Phone")}
        </div>
      </div>
    );
  };

  const handleSubmit = async () => {
    setLoading(true);
    // Removed minMembers from the function call
    const res = await ingestParticipants(eventId, sheetUrl, mapping, shouldPurge, maxMembers);
    if (res.success) onComplete(); else alert("Error: " + res.error);
    setLoading(false);
  };

  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
      <header className="space-y-1">
        <h3 className="text-xl md:text-2xl font-black text-white uppercase italic">Uplink Synchronization</h3>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Map columns to registry</p>
      </header>
      
      {/* Global Team & Transaction Mapping */}
      <div className="p-4 border border-white/10 rounded-2xl space-y-4 bg-white/[0.01]">
        <h4 className="text-[10px] font-black text-emerald-500 uppercase flex items-center gap-2">Global Telemetry</h4>
        <div className="grid grid-cols-1 gap-3">
          {renderSelect("team_name", "Team Name Column")}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {renderSelect("payment_id", "Transaction / Payment ID")}
          {renderSelect("payment_url", "Payment Screenshot URL")}
        </div>
      </div>

      {renderMemberMapping(0, true)}
      {Array.from({ length: maxMembers - 1 }).map((_, i) => renderMemberMapping(i + 1, false))}
      
      <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl flex justify-between items-center cursor-pointer hover:bg-red-500/10 transition-colors" onClick={() => setShouldPurge(!shouldPurge)}>
        <div>
          <p className="text-[10px] text-red-500 font-black uppercase tracking-widest">Protocol: Purge Registry</p>
          <p className="text-[9px] text-slate-500 font-bold uppercase">Wipe existing nodes before ingest</p>
        </div>
        <div className={`w-5 h-5 rounded border flex items-center justify-center ${shouldPurge ? 'bg-red-500 border-red-500' : 'border-white/20'}`}>
          {shouldPurge && <div className="w-2 h-2 bg-black" />}
        </div>
      </div>

      <button onClick={handleSubmit} disabled={loading || !mapping.team_name || !mapping.leader_reg} className="w-full bg-emerald-500 hover:bg-emerald-400 py-4 md:py-5 rounded-2xl text-black font-black uppercase text-xs flex items-center justify-center gap-2 transition-all">
        {loading ? <Loader2 className="animate-spin" size={16} /> : "Confirm Uplink & Initialize Nodes"}
      </button>
    </div>
  );
}