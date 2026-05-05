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
  ShieldAlert,
  Terminal,
  Zap,
  ExternalLink,
  Info
} from "lucide-react";
import { getLabSession } from "@/app/actions/lab-auth";
import { getTeamConfig, updateTeamConfig } from "@/app/actions/lab-config";

export default function LabConfigPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [appUrl, setAppUrl] = useState("");

  const [formData, setFormData] = useState({
    repoUrl: "",
    deploymentUrl: "",
    dbConnection: ""
  });

  useEffect(() => {
    setAppUrl(window.location.origin);
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
    <div className="min-h-screen bg-background text-white p-6 md:p-10 flex flex-col items-center custom-scrollbar">
      <div className="max-w-4xl w-full space-y-10">
        
        <header className="border-b border-white/5 pb-8">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center border border-secondary/20 rim-light">
              <Network className="text-secondary" size={24} />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter italic leading-none">Sys_Setup</h1>
              <p className="text-[10px] text-white/40 uppercase tracking-[0.4em] mt-3 font-label-caps">Resource Linkage & Telemetry Synchronization</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          
          {/* CONFIG FORM */}
          <div className="lg:col-span-3 space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel rim-light rounded-[2.5rem] p-8 md:p-10 shadow-2xl space-y-8"
            >
              <div className="bg-secondary/5 border border-secondary/10 rounded-2xl p-6 flex gap-4 items-start">
                <Info size={18} className="text-secondary mt-1 shrink-0" />
                <p className="text-[11px] text-white/60 uppercase leading-relaxed font-bold tracking-widest font-label-caps">
                  Connect your <span className="text-secondary">Primary Git Node</span> to activate the Live Git Feed and enable task verification.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-[10px] text-red-500 uppercase font-bold tracking-widest font-label-caps">
                    {error}
                  </div>
                )}
                
                {/* GitHub Repo */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-white/40 tracking-widest flex items-center gap-2 ml-1 font-label-caps">
                    <GitBranch size={12} className="text-secondary" /> Primary_Git_Node
                  </label>
                  <div className="relative group">
                    <input 
                      type="url"
                      style={{ colorScheme: 'dark' }}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-5 text-[13px] text-white focus:border-secondary/50 outline-none font-data-mono transition-all placeholder:text-white/10 group-hover:border-white/20"
                      placeholder="https://github.com/org/repo"
                      value={formData.repoUrl}
                      onChange={(e) => setFormData({...formData, repoUrl: e.target.value})}
                      required
                    />
                  </div>
                </div>

                {/* Deployment URL */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-white/40 tracking-widest flex items-center gap-2 ml-1 font-label-caps">
                    <Globe size={12} className="text-blue-400" /> Deployment_Uplink
                  </label>
                  <div className="relative group">
                    <input 
                      type="url"
                      style={{ colorScheme: 'dark' }}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-5 text-[13px] text-white focus:border-secondary/50 outline-none font-data-mono transition-all placeholder:text-white/10 group-hover:border-white/20"
                      placeholder="https://project.vercel.app"
                      value={formData.deploymentUrl}
                      onChange={(e) => setFormData({...formData, deploymentUrl: e.target.value})}
                    />
                  </div>
                  <p className="text-[9px] text-white/20 ml-1 font-label-caps uppercase tracking-widest">Optional // Required for Live Status Badge</p>
                </div>

                {/* DB Health Check */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-white/40 tracking-widest flex items-center gap-2 ml-1 font-label-caps">
                    <Database size={12} className="text-secondary" /> Registry_Pulse_Endpoint
                  </label>
                  <div className="relative group">
                    <input 
                      type="url"
                      style={{ colorScheme: 'dark' }}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-5 text-[13px] text-white focus:border-secondary/50 outline-none font-data-mono transition-all placeholder:text-white/10 group-hover:border-white/20"
                      placeholder="https://api.your-app.com/health"
                      value={formData.dbConnection}
                      onChange={(e) => setFormData({...formData, dbConnection: e.target.value})}
                    />
                  </div>
                  <p className="text-[9px] text-white/20 ml-1 font-label-caps uppercase tracking-widest">Optional // Must return HTTP 200 for nominal status</p>
                </div>

                <div className="pt-6 border-t border-white/5">
                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full bg-secondary hover:bg-[#5affb4] text-black font-black uppercase tracking-[0.3em] text-xs py-5 rounded-[1.5rem] transition-all flex justify-center items-center gap-3 shadow-[0_0_40px_rgba(78,222,163,0.2)] active:scale-[0.98] disabled:bg-white/5 disabled:text-white/20 font-label-caps"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : success ? <CheckCircle2 size={18} /> : <Zap size={18} fill="currentColor" />}
                    {loading ? "COMMITTING..." : success ? "CONFIGURATION_SAVED" : "COMMIT_CONFIGURATION"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>

          {/* HELP / WEBHOOK GUIDE */}
          <div className="lg:col-span-2 space-y-6">
             <div className="glass-panel rim-light rounded-[2rem] p-8 space-y-6 border-secondary/20">
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-secondary flex items-center gap-2 font-label-caps">
                  <Terminal size={14} /> Webhook_Setup
                </h3>
                <p className="text-[10px] text-white/40 leading-relaxed font-bold tracking-widest font-label-caps uppercase">
                  To stream commits into your terminal, you MUST configure a GitHub Webhook.
                </p>
                
                <div className="space-y-6 pt-4">
                  <div className="space-y-2">
                    <p className="text-[9px] text-secondary font-black uppercase tracking-widest font-label-caps">1. Payload URL</p>
                    <div className="bg-black/60 border border-white/10 p-4 rounded-xl font-data-mono text-[10px] text-white/80 break-all select-all cursor-pointer hover:bg-black/80 transition-all">
                      {appUrl}/api/webhooks/github
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[9px] text-secondary font-black uppercase tracking-widest font-label-caps">2. Content Type</p>
                    <p className="text-[10px] text-white font-data-mono">application/json</p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[9px] text-secondary font-black uppercase tracking-widest font-label-caps">3. Events</p>
                    <p className="text-[10px] text-white font-data-mono">Select the <span className="text-secondary">push</span> event.</p>
                  </div>
                </div>

                <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                  <p className="text-[9px] text-white/40 leading-tight uppercase font-bold">
                    Note: Navigate to your repository settings on GitHub to add this webhook. 
                    Path: <span className="text-white">Settings &gt; Webhooks &gt; Add Webhook</span>
                  </p>
                </div>
             </div>

             <div className="glass-panel rim-light rounded-[2rem] p-8 space-y-4">
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white/60 flex items-center gap-2 font-label-caps">
                  <ShieldAlert size={14} /> Security_Notice
                </h3>
                <p className="text-[10px] text-white/30 leading-relaxed font-medium uppercase tracking-widest font-label-caps">
                  Uplinks are per-team. Ensure you are using the correct repository. Only one repository can be linked per team node.
                </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}