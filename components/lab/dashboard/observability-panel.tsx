"use client";

import { Globe, Database } from "lucide-react";
import { ObservabilityConfig } from "@/lib/lab-config/observability";

interface ObservabilityPanelProps {
  obs: ObservabilityConfig;
}

export function ObservabilityPanel({ obs }: ObservabilityPanelProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="glass-panel rim-light p-6 rounded-2xl flex items-center justify-between hover:border-blue-500/30 transition-all duration-500 bg-white/[0.01] group">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
            <Globe className="text-blue-400" size={18} />
          </div>
          <div>
            <div className="text-[9px] uppercase text-white/20 font-black tracking-[0.2em] font-label-caps">Uplink_Status</div>
            <div className="text-[11px] font-black uppercase tracking-widest text-white/80 font-data-mono">{obs.deployment.status}</div>
          </div>
        </div>
        <div className={`w-2 h-2 ${obs.deployment.color} rounded-full ${obs.deployment.showPulse ? 'animate-pulse' : ''} shadow-[0_0_10px_#3b82f6]`} />
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
