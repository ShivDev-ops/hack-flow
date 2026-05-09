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
      <div className={`flex items-center gap-4 px-6 py-4 rounded-2xl border border-white/5 bg-white/[0.02] transition-all group ${isLinked ? 'hover:border-blue-500/30' : 'opacity-40'}`}>
        <div className={`p-2.5 rounded-xl ${isLinked ? 'bg-blue-500/10' : 'bg-white/5'}`}>
          <Globe className={isLinked ? "text-blue-400" : "text-white/20"} size={18} />
        </div>
        <div>
          <div className="text-[10px] uppercase text-white/40 font-bold tracking-widest">Website</div>
          <div className="text-sm font-black uppercase tracking-tight text-white/80 flex items-center gap-2">
            {isLinked ? "Active" : "Offline"}
            <div className={`w-2 h-2 ${isLinked ? 'bg-blue-500 shadow-[0_0_10px_#3b82f6] animate-pulse' : 'bg-white/10'} rounded-full`} />
          </div>
        </div>
      </div>

      {/* REGISTRY PULSE */}
      <div className="flex items-center gap-4 px-6 py-4 rounded-2xl border border-white/5 bg-white/[0.02] transition-all hover:border-secondary/30 group">
        <div className="p-2.5 bg-secondary/10 rounded-xl">
          <Database className="text-secondary" size={18} />
        </div>
        <div>
          <div className="text-[10px] uppercase text-white/40 font-bold tracking-widest">Database</div>
          <div className="text-sm font-black uppercase tracking-tight text-white/80 flex items-center gap-2">
            {obs.dbPulse.latency}
            <div className={`w-2 h-2 ${obs.dbPulse.color} rounded-full shadow-[0_0_10px_#10b981] pulse-emerald`} />
          </div>
        </div>
      </div>
    </div>
  );
}
