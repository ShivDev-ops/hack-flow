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
    <div className="flex items-center gap-4">
      {/* UPLINK STATUS */}
      <div className={`flex items-center gap-3 px-5 py-3 rounded-xl border border-white/5 bg-white/[0.02] transition-all group ${isLinked ? 'hover:border-blue-500/30' : 'opacity-40'}`}>
        <div className={`p-2 rounded-lg ${isLinked ? 'bg-blue-500/10' : 'bg-white/5'}`}>
          <Globe className={isLinked ? "text-blue-400" : "text-white/20"} size={16} />
        </div>
        <div>
          <div className="text-[9px] uppercase text-white/20 font-black tracking-widest font-label-caps">Uplink</div>
          <div className="text-[12px] font-black uppercase tracking-tight text-white/80 font-data-mono flex items-center gap-2">
            {isLinked ? "Online" : "Offline"}
            <div className={`w-1.5 h-1.5 ${isLinked ? 'bg-blue-500 shadow-[0_0_8px_#3b82f6] animate-pulse' : 'bg-white/10'} rounded-full`} />
          </div>
        </div>
      </div>

      {/* REGISTRY PULSE */}
      <div className="flex items-center gap-3 px-5 py-3 rounded-xl border border-white/5 bg-white/[0.02] transition-all hover:border-secondary/30 group">
        <div className="p-2 bg-secondary/10 rounded-lg">
          <Database className="text-secondary" size={16} />
        </div>
        <div>
          <div className="text-[9px] uppercase text-white/20 font-black tracking-widest font-label-caps">Registry</div>
          <div className="text-[12px] font-black uppercase tracking-tight text-white/80 font-data-mono flex items-center gap-2">
            {obs.dbPulse.latency}
            <div className={`w-1.5 h-1.5 ${obs.dbPulse.color} rounded-full shadow-[0_0_8px_#4edea3] pulse-emerald`} />
          </div>
        </div>
      </div>
    </div>
  );
}
