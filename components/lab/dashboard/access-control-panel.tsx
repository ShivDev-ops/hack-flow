"use client";

import { ShieldCheck } from "lucide-react";

interface AccessControlPanelProps {
  role: string;
}

export function AccessControlPanel({ role }: AccessControlPanelProps) {
  return (
    <div className="bg-[#1e293b]/50 border border-[#1e293b] rounded-2xl p-5 shadow-xl">
       <header className="flex items-center justify-between text-white border-b border-white/5 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-emerald-500" />
            <span className="text-xs font-black uppercase tracking-widest">Access Control</span>
          </div>
       </header>
       <div className="space-y-3">
         <div className="flex justify-between items-center bg-[#0f172a] p-3 rounded-lg border border-[#1e293b]">
            <span className="text-[9px] text-slate-500 uppercase font-bold">Your Role</span>
            <span className="text-[10px] text-emerald-400 font-bold">{role}</span>
         </div>
         <div className="flex justify-between items-center bg-[#0f172a] p-3 rounded-lg border border-[#1e293b]">
            <span className="text-[9px] text-slate-500 uppercase font-bold">Attendance</span>
            <span className="text-[10px] text-white font-bold bg-emerald-500/20 px-2 py-0.5 rounded text-emerald-500 border border-emerald-500/30">PRESENT</span>
         </div>
         <div className="pt-2 border-t border-[#1e293b]">
           <div className="text-[8px] text-slate-500 uppercase font-bold mb-2">Team PIN Area</div>
           <button className="w-full text-[9px] bg-[#1e293b] hover:bg-white/10 text-white py-2 rounded transition-colors uppercase font-bold tracking-widest">
             Manage PINs
           </button>
         </div>
       </div>
    </div>
  );
}
