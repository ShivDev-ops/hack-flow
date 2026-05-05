"use client";

import { Globe, Database } from "lucide-react";
import { ObservabilityConfig } from "@/lib/lab-config/observability";

interface ObservabilityPanelProps {
  obs: ObservabilityConfig;
}

export function ObservabilityPanel({ obs }: ObservabilityPanelProps) {
  return (
    <div className="col-span-1 flex flex-col gap-4">
      <div className="bg-[#1e293b]/50 border border-[#1e293b] p-4 rounded-2xl flex items-center justify-between hover:border-emerald-500/30 transition-colors">
        <div className="flex items-center gap-3">
          <Globe className="text-blue-400" size={20} />
          <div>
            <div className="text-[10px] uppercase text-slate-500 font-bold">Deployment</div>
            <div className="text-xs font-black uppercase tracking-widest">{obs.deployment.status}</div>
          </div>
        </div>
        <div className={`w-2 h-2 ${obs.deployment.color} rounded-full ${obs.deployment.showPulse ? 'animate-pulse' : ''} shadow-[0_0_8px_#3b82f6]`} />
      </div>
      <div className="bg-[#1e293b]/50 border border-[#1e293b] p-4 rounded-2xl flex items-center justify-between hover:border-emerald-500/30 transition-colors">
        <div className="flex items-center gap-3">
          <Database className="text-emerald-500" size={20} />
          <div>
            <div className="text-[10px] uppercase text-slate-500 font-bold">DB Pulse</div>
            <div className="text-xs font-black uppercase tracking-widest">{obs.dbPulse.latency}</div>
          </div>
        </div>
        <div className={`w-2 h-2 ${obs.dbPulse.color} rounded-full shadow-[0_0_8px_#10b981]`} />
      </div>
    </div>
  );
}
