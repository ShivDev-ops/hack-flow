"use client";

import { useEffect, useState } from "react";
import { Globe, Database, Loader2, ShieldAlert } from "lucide-react";
import { checkSystemHealth } from "@/app/actions/lab-config";

interface ObservabilityPanelProps {
  deploymentUrl?: string | null;
  dbEndpoint?: string | null;
}

export function ObservabilityPanel({ deploymentUrl, dbEndpoint }: ObservabilityPanelProps) {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({
    deployment: { status: "Offline", color: "bg-white/10", active: false, canIframe: true },
    database: { status: "Offline", color: "bg-white/10", active: false, latency: "---" }
  });

  useEffect(() => {
    async function runCheck() {
      setLoading(true);
      const res = await checkSystemHealth(deploymentUrl, dbEndpoint);
      setStatus(res);
      setLoading(false);
    }
    runCheck();
    
    // Refresh every 60 seconds
    const interval = setInterval(runCheck, 60000);
    return () => clearInterval(interval);
  }, [deploymentUrl, dbEndpoint]);

  return (
    <div className="flex items-center gap-4">
      {/* UPLINK STATUS */}
      <div className={`flex items-center gap-4 px-6 py-4 rounded-2xl border border-white/5 bg-white/[0.02] transition-all group ${status.deployment.active ? 'hover:border-blue-500/30' : 'opacity-40'}`}>
        <div className={`p-2.5 rounded-xl ${status.deployment.active ? 'bg-blue-500/10' : 'bg-white/5'}`}>
          <Globe className={status.deployment.active ? "text-blue-400" : "text-white/20"} size={18} />
        </div>
        <div>
          <div className="text-[10px] uppercase text-white/40 font-bold tracking-widest flex items-center gap-1">
            Website {status.deployment.active && !status.deployment.canIframe && <ShieldAlert size={10} className="text-yellow-500" />}
          </div>
          <div className="text-sm font-black uppercase tracking-tight text-white/80 flex items-center gap-2">
            {loading ? <Loader2 size={12} className="animate-spin opacity-40" /> : status.deployment.status}
            <div className={`w-2 h-2 ${status.deployment.color} rounded-full ${status.deployment.active ? 'shadow-[0_0_10px_#3b82f6] animate-pulse' : ''}`} />
          </div>
        </div>
      </div>

      {/* REGISTRY PULSE */}
      <div className={`flex items-center gap-4 px-6 py-4 rounded-2xl border border-white/5 bg-white/[0.02] transition-all group ${status.database.active ? 'hover:border-secondary/30' : 'opacity-40'}`}>
        <div className={`p-2.5 rounded-xl ${status.database.active ? 'bg-secondary/10' : 'bg-white/5'}`}>
          <Database className={status.database.active ? "text-secondary" : "text-white/20"} size={18} />
        </div>
        <div>
          <div className="text-[10px] uppercase text-white/40 font-bold tracking-widest">Database</div>
          <div className="text-sm font-black uppercase tracking-tight text-white/80 flex items-center gap-2">
            {loading ? <Loader2 size={12} className="animate-spin opacity-40" /> : status.database.latency}
            <div className={`w-2 h-2 ${status.database.color} rounded-full ${status.database.active ? 'shadow-[0_0_10px_#10b981] pulse-emerald' : ''}`} />
          </div>
        </div>
      </div>
    </div>
  );
}
