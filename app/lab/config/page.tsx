"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  Network, 
  GitBranch, 
  Globe, 
  Database, 
  Save, 
  Loader2, 
  CheckCircle2,
  ShieldAlert
} from "lucide-react";
import { getLabSession } from "@/app/actions/lab-auth";
import { getTeamConfig, updateTeamConfig } from "@/app/actions/lab-config";

export default function LabConfigPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teamId, setTeamId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    repoUrl: "",
    deploymentUrl: "",
    dbConnection: ""
  });

  useEffect(() => {
    async function init() {
      const session = await getLabSession();
      if (session?.teamId) {
        setTeamId(session.teamId);
        const res = await getTeamConfig(session.teamId);
        if (res.success && res.config) {
          setFormData(prev => ({ ...prev, repoUrl: res.config.repo_url || "" }));
        }
      }
    }
    init();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamId) return;

    setLoading(true);
    setError(null);

    const res = await updateTeamConfig(teamId, formData.repoUrl);

    setLoading(false);
    if (res.success) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setError(res.error || "Failed to update configuration");
    }
  };


  return (
    <div className="min-h-screen bg-[#0f172a] text-white font-mono p-4 md:p-6 lg:p-8 flex justify-center">
      <div className="max-w-2xl w-full space-y-8">
        
        <header className="border-b border-[#1e293b] pb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#1e293b] flex items-center justify-center border border-[#334155]">
              <Network className="text-emerald-500" size={20} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tighter italic">Sys_Config</h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Resource Linkage & Telemetry Setup</p>
            </div>
          </div>
        </header>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1e293b]/30 border border-[#1e293b] rounded-3xl p-6 md:p-8 shadow-2xl"
        >
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-8 flex gap-3 items-start">
            <ShieldAlert size={16} className="text-amber-500 mt-0.5 shrink-0" />
            <p className="text-[10px] text-amber-500/80 uppercase leading-relaxed font-bold tracking-widest">
              Provide these resources to activate the full Mission Control dashboard. Incorrect configurations will result in missing telemetry data.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-[10px] text-red-500 uppercase font-bold tracking-widest">
                {error}
              </div>
            )}
            
            {/* GitHub Repo */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 ml-1">
                <GitBranch size={12} className="text-slate-300" /> Primary Git Node
              </label>
              <div className="relative">
                <input 
                  type="url"
                  className="w-full bg-[#0f172a] border border-[#1e293b] rounded-xl px-4 py-3 text-xs text-white focus:border-emerald-500 outline-none transition-all placeholder:text-slate-600"
                  placeholder="https://github.com/your-team/project"
                  value={formData.repoUrl}
                  onChange={(e) => setFormData({...formData, repoUrl: e.target.value})}
                  required
                />
              </div>
            </div>

            {/* Deployment URL */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 ml-1">
                <Globe size={12} className="text-blue-400" /> Active Deployment Uplink
              </label>
              <div className="relative">
                <input 
                  type="url"
                  className="w-full bg-[#0f172a] border border-[#1e293b] rounded-xl px-4 py-3 text-xs text-white focus:border-blue-500 outline-none transition-all placeholder:text-slate-600"
                  placeholder="https://your-project.vercel.app"
                  value={formData.deploymentUrl}
                  onChange={(e) => setFormData({...formData, deploymentUrl: e.target.value})}
                />
              </div>
              <p className="text-[9px] text-slate-500 ml-1">Optional. Required for Live Status Badge.</p>
            </div>

            {/* DB Health Check */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 ml-1">
                <Database size={12} className="text-emerald-500" /> Database Health API (Pulse)
              </label>
              <div className="relative">
                <input 
                  type="url"
                  className="w-full bg-[#0f172a] border border-[#1e293b] rounded-xl px-4 py-3 text-xs text-white focus:border-emerald-500 outline-none transition-all placeholder:text-slate-600"
                  placeholder="https://your-api.com/health"
                  value={formData.dbConnection}
                  onChange={(e) => setFormData({...formData, dbConnection: e.target.value})}
                />
              </div>
              <p className="text-[9px] text-slate-500 ml-1">Optional. Endpoint must return HTTP 200 for nominal status.</p>
            </div>

            <div className="pt-6 border-t border-[#1e293b]">
              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-widest text-xs py-4 rounded-xl transition-all flex justify-center items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.2)] disabled:opacity-50"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : success ? <CheckCircle2 size={16} /> : <Save size={16} />}
                {loading ? "Committing..." : success ? "Configuration Saved" : "Commit Configuration"}
              </button>
            </div>

          </form>
        </motion.div>
      </div>
    </div>
  );
}