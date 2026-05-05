"use client";

import { useState, useEffect } from "react";
import { ingestParticipants } from "@/app/actions/ingest";
import { User, Users, Loader2, Sparkles, Zap, Archive } from "lucide-react";

interface RegistryUplinkProps {
  headers: string[];
  maxMembers: number;
  eventId: string;
  sheetUrl: string;
  onComplete: () => void;
}

export function RegistryUplink({ headers, maxMembers, eventId, sheetUrl, onComplete }: RegistryUplinkProps) {
  const [loading, setLoading] = useState(false);
  const [shouldPurge, setShouldPurge] = useState(false);
  const [mapping, setMapping] = useState<Record<string, string>>({ team_name: "" });

  // AI-Powered Auto-Mapping Logic
  useEffect(() => {
    if (headers && headers.length > 0) {
      const newMapping: Record<string, string> = { team_name: "" };
      
      const findHeader = (keywords: string[]) => {
        return headers.find((h: string) => 
          keywords.some(k => h.toLowerCase().replace(/_/g, ' ').includes(k.toLowerCase()))
        ) || "";
      };

      newMapping.team_name = findHeader(["team name", "team", "group name", "group"]);
      
      // Leader mapping
      newMapping.leader_name = findHeader(["leader name", "lead name", "team leader", "lead_name"]);
      newMapping.leader_reg = findHeader(["leader reg", "registration", "reg no", "roll no", "id"]);
      newMapping.leader_email = findHeader(["leader email", "lead email", "leader_email"]);
      newMapping.leader_phone = findHeader(["leader phone", "lead phone", "contact", "mobile"]);
      
      newMapping.payment_id = findHeader(["payment id", "transaction id", "payment ref"]);
      newMapping.payment_url = findHeader(["payment screenshot", "payment url", "screenshot"]);

      // Member mapping based on index
      for (let i = 2; i <= maxMembers; i++) {
        newMapping[`m${i}_name`] = findHeader([`member ${i} name`, `m${i} name`, `name ${i}`]);
        newMapping[`m${i}_reg`] = findHeader([`member ${i} reg`, `m${i} reg`, `reg ${i}`]);
        newMapping[`m${i}_email`] = findHeader([`member ${i} email`, `m${i} email`, `email ${i}`]);
        newMapping[`m${i}_phone`] = findHeader([`member ${i} phone`, `m${i} phone`, `phone ${i}`]);
      }

      // Use a microtask to avoid synchronous setState during render/effect
      Promise.resolve().then(() => {
        setMapping(newMapping);
      });
    }
  }, [headers, maxMembers]);

  const renderSelect = (key: string, label: string) => (
    <select 
      className="bg-black/40 border border-white/10 rounded-xl p-4 text-[10px] text-white outline-none w-full appearance-none focus:border-secondary/50 transition-all font-data-mono hover:border-white/20" 
      value={mapping[key] || ""}
      onChange={e => setMapping({...mapping, [key]: e.target.value})}
    >
      <option value="" className="bg-zinc-900 text-white/40">-- {label.toUpperCase()} --</option>
      {headers.map((h: string) => <option key={h} value={h} className="bg-zinc-900 text-white">{h}</option>)}
    </select>
  );

  const renderMemberMapping = (index: number, isLeader: boolean) => {
    const key = isLeader ? "leader" : `m${index + 1}`;
    const label = isLeader ? "Team Leader" : `Member ${index + 1}`;
    return (
      <div key={key} className="p-8 glass-panel rim-light rounded-[2rem] space-y-6 bg-white/[0.01] hover:border-secondary/10 transition-all duration-500">
        <p className="text-[10px] font-black text-secondary uppercase flex items-center gap-3 tracking-[0.2em] font-label-caps">
          {isLeader ? <User size={14}/> : <Users size={14}/>} {label} 
          {isLeader ? <span className="text-white/20 ml-auto font-data-mono text-[8px]">[REQUIRED]</span> : <span className="text-white/10 ml-auto font-data-mono text-[8px]">[OPTIONAL]</span>}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
    const res = await ingestParticipants(eventId, sheetUrl, mapping, shouldPurge, maxMembers);
    if (res.success) onComplete(); else alert("Error: " + res.error);
    setLoading(false);
  };

  return (
    <div className="space-y-8 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar p-1">
      <header className="flex justify-between items-start gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 bg-secondary rounded-full pulse-emerald" />
            <span className="text-[9px] font-black text-secondary uppercase tracking-[0.4em] font-label-caps">Phase_02: Uplink_Mapping</span>
          </div>
          <h3 className="text-2xl md:text-3xl font-black text-white uppercase italic tracking-tighter leading-none">Uplink Synchronization</h3>
          <p className="text-[10px] text-white/40 font-bold uppercase tracking-[0.3em] mt-3 font-label-caps">Map Source_Columns to Fleet_Registry</p>
        </div>
        <div className="flex items-center gap-2 bg-secondary/10 border border-secondary/20 px-4 py-2 rounded-full shadow-[0_0_15px_rgba(78,222,163,0.1)]">
          <Sparkles size={12} className="text-secondary animate-pulse" />
          <span className="text-[8px] font-black text-secondary uppercase tracking-[0.2em] font-label-caps">AI_Mapping_Active</span>
        </div>
      </header>
      
      {/* Global Team & Transaction Mapping */}
      <div className="p-8 glass-panel rim-light rounded-3xl space-y-6 bg-white/[0.01] hover:border-secondary/20 transition-all duration-500">
        <h4 className="text-[10px] font-black text-secondary uppercase flex items-center gap-2 tracking-[0.2em] font-label-caps">
          <Zap size={12} /> Global_Telemetry
        </h4>
        <div className="grid grid-cols-1 gap-4">
          {renderSelect("team_name", "Team Designation Column")}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderSelect("payment_id", "Transaction_ID (TXID)")}
          {renderSelect("payment_url", "Payment_Capture_URL")}
        </div>
      </div>

      <div className="space-y-4">
        {renderMemberMapping(0, true)}
        {Array.from({ length: maxMembers - 1 }).map((_, i) => renderMemberMapping(i + 1, false))}
      </div>
      
      <div className="p-6 bg-red-500/5 border border-red-500/10 rounded-2xl flex justify-between items-center cursor-pointer hover:bg-red-500/10 transition-all duration-300 group" onClick={() => setShouldPurge(!shouldPurge)}>
        <div className="flex items-center gap-4">
          <div className={`p-2 rounded-lg transition-colors ${shouldPurge ? 'bg-red-500/20' : 'bg-white/5'}`}>
            <Archive size={16} className={shouldPurge ? 'text-red-500' : 'text-white/20'} />
          </div>
          <div>
            <p className="text-[10px] text-red-500 font-black uppercase tracking-[0.2em] font-label-caps">Protocol: Purge_Registry</p>
            <p className="text-[9px] text-white/20 font-bold uppercase tracking-widest mt-1">Wipe existing nodes before ingestion cycle</p>
          </div>
        </div>
        <div className={`w-10 h-5 rounded-full relative transition-all duration-500 ${shouldPurge ? 'bg-red-500' : 'bg-white/5'}`}>
          <div className={`absolute top-1 w-3 h-3 bg-black rounded-full transition-all duration-500 ${shouldPurge ? 'right-1' : 'left-1'}`} />
        </div>
      </div>

      <button 
        onClick={handleSubmit} 
        disabled={loading || !mapping.team_name || !mapping.leader_reg} 
        className="w-full bg-secondary hover:bg-[#5affb4] py-5 rounded-[1.5rem] text-black font-black uppercase text-xs tracking-[0.3em] flex items-center justify-center gap-3 transition-all shadow-[0_0_30px_rgba(78,222,163,0.2)] active:scale-95 disabled:bg-white/5 disabled:text-white/20 font-label-caps mt-8"
      >
        {loading ? <Loader2 className="animate-spin" size={20} /> : <><Zap size={18} fill="currentColor" /> Confirm_Uplink & Initialize_Nodes</>}
      </button>
    </div>
  );
}