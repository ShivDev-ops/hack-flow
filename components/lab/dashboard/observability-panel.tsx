"use client";

import { Globe, Database } from "lucide-react";
import { ObservabilityConfig } from "@/lib/lab-config/observability";

interface ObservabilityPanelProps {
  obs: ObservabilityConfig;
  deploymentUrl?: string | null;
}

export function ObservabilityPanel({ obs, deploymentUrl }: ObservabilityPanelProps) {
  const isLinked = !!deploymentUrl;

  return (
    <div className="flex flex-col gap-4">
      <div className={`glass-panel rim-light p-6 rounded-2xl flex items-center justify-between transition-all duration-500 bg-white/[0.01] group ${isLinked ? 'hover:border-blue-500/30' : 'opacity-50'}`}>
        <div className="flex items-center gap-4">
          <div className={`p-2 rounded-lg transition-colors ${isLinked ? 'bg-blue-500/10 group-hover:bg-blue-500/20' : 'bg-white/5'}`}>
            <Globe className={isLinked ? "text-blue-400" : "text-white/20"} size={18} />
          </div>
          <div>
            <div className="text-[9px] uppercase text-white/20 font-black tracking-[0.2em] font-label-caps">Uplink_Status</div>
            <div className="text-[11px] font-black uppercase tracking-widest text-white/80 font-data-mono">
              {isLinked ? "Operational" : "Offline"}
            </div>
          </div>
        </div>
        <div className={`w-2 h-2 ${isLinked ? 'bg-blue-500 shadow-[0_0_10px_#3b82f6] animate-pulse' : 'bg-white/10'} rounded-full`} />
      </div>

      <div className="glass-panel rim-light p-6 rounded-2xl flex items-center justify-between hover:border-secondary/30 transition-all duration-500 bg-white/[0.01] group">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-secondary/10 rounded-lg group-hover:bg-secondary/20 transition-colors">
            <Database className="text-secondary" size={18} />
          </div>
          <div>
            <div className="text-[9px] uppercase text-white/20 font-black tracking-[0.2em] font-label-caps">Registry_Pulse</div>
            <div className="text-[11px] font-black uppercase tracking-widest text-white/80 font-data-mono">{obs.dbPulse.latency}</div>
          </div>
        </div>
        <div className={`w-2 h-2 ${obs.dbPulse.color} rounded-full shadow-[0_0_10px_#4edea3] pulse-emerald`} />
      </div>
    </div>
  );
}
