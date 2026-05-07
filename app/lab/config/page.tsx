"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Info,
  HelpCircle
} from "lucide-react";
import { getLabSession } from "@/app/actions/lab-auth";
import { getTeamConfig, updateTeamConfig, verifyTeamSync } from "@/app/actions/lab-config";

export default function LabConfigPage() {
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [syncCount, setSyncCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [readableId, setReadableId] = useState<string | null>(null);
  const [appUrl, setAppUrl] = useState("");

  const [formData, setFormData] = useState({
    repoUrl: "",
    deploymentUrl: "",
    dbConnection: ""
  });

  useEffect(() => {
    async function init() {
      setAppUrl(window.location.origin);
      const session = await getLabSession();
      if (session?.teamId) {
        setTeamId(session.teamId);
        const res = await getTeamConfig(session.teamId);
        if (res.success && res.config) {
          setReadableId(res.config.readable_id);
          setFormData({
            repoUrl: res.config.repo_url || "",
            deploymentUrl: res.config.deployment_url || "",
            dbConnection: res.config.db_connection || ""
          });
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

    const res = await updateTeamConfig(
      teamId, 
      formData.repoUrl, 
      formData.deploymentUrl, 
      formData.dbConnection
    );

    setLoading(false);
    if (res.success) {
      setSuccess(true);
      setShowVerifyModal(true);
      handleVerify(); // Auto-verify on open
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setError(res.error || "Failed to update configuration");
    }
  };

  const handleVerify = async () => {
    if (!teamId) return;
    setVerifying(true);
    const res = await verifyTeamSync(teamId);
    if (res.success) {
      setSyncCount(res.count ?? 0);
    }
    setVerifying(false);
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

                <div className="pt-6 border-t border-white/5 space-y-4">
                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full bg-secondary hover:bg-[#5affb4] text-black font-black uppercase tracking-[0.3em] text-xs py-5 rounded-[1.5rem] transition-all flex justify-center items-center gap-3 shadow-[0_0_40px_rgba(78,222,163,0.2)] active:scale-[0.98] disabled:bg-white/5 disabled:text-white/20 font-label-caps"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : success ? <CheckCircle2 size={18} /> : <Zap size={18} fill="currentColor" />}
                    {loading ? "COMMITTING..." : success ? "CONFIGURATION_SAVED" : "COMMIT_CONFIGURATION"}
                  </button>

                  <button 
                    type="button"
                    onClick={() => setShowHelpModal(true)}
                    className="w-full py-3 flex items-center justify-center gap-2 text-[9px] font-black text-white/30 hover:text-secondary uppercase tracking-[0.2em] transition-all font-label-caps group"
                  >
                    <HelpCircle size={14} className="group-hover:rotate-12 transition-transform" />
                    How to configure live webhooks?
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
                    <p className="text-[10px] text-white font-data-mono">Enable <span className="text-secondary">Push</span> and <span className="text-secondary">Pull Request</span> events.</p>
                  </div>
                </div>

                <div className="p-4 bg-secondary/5 border border-secondary/10 rounded-xl">
                  <p className="text-[9px] text-secondary leading-tight uppercase font-bold mb-1">
                    Neural PR Link Active
                  </p>
                  <p className="text-[9px] text-white/40 leading-tight uppercase font-medium">
                    Add <span className="text-white">&quot;fixes #task-id&quot;</span> to your PR description to auto-move tasks to Review.
                  </p>
                </div>
             </div>

             <div className="glass-panel rim-light rounded-[2rem] p-8 space-y-6 border-blue-500/20">
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-blue-400 flex items-center gap-2 font-label-caps">
                  <Database size={14} /> DB_Pulse_Setup
                </h3>
                <p className="text-[10px] text-white/40 leading-relaxed font-bold tracking-widest font-label-caps uppercase">
                  Visualize your database changes in real-time by enabling Supabase Webhooks.
                </p>
                
                <div className="space-y-6 pt-4">
                  <div className="space-y-2">
                    <p className="text-[9px] text-blue-400 font-black uppercase tracking-widest font-label-caps">1. Payload URL</p>
                    <div className="bg-black/60 border border-white/10 p-4 rounded-xl font-data-mono text-[10px] text-white/80 break-all select-all cursor-pointer hover:bg-black/80 transition-all">
                      {appUrl}/api/webhooks/supabase
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[9px] text-blue-400 font-black uppercase tracking-widest font-label-caps">2. HTTP Header</p>
                    <div className="bg-black/60 border border-white/10 p-4 rounded-xl font-data-mono text-[10px] text-white/80">
                      x-team-id: <span className="text-blue-400">{readableId || "TEAM-XXXX"}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[9px] text-blue-400 font-black uppercase tracking-widest font-label-caps">3. Events</p>
                    <p className="text-[10px] text-white font-data-mono">Enable <span className="text-blue-400">INSERT, UPDATE, DELETE</span> on your main tables.</p>
                  </div>
                </div>

                <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                  <p className="text-[9px] text-white/40 leading-tight uppercase font-bold">
                    Go to: <span className="text-white">Database &gt; Webhooks &gt; Create Webhook</span> in your Supabase Dashboard.
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

      {/* VERIFICATION MODAL - REBUILT B&W AESTHETIC */}
      <AnimatePresence>
        {showVerifyModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-sm p-6">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="bg-zinc-950 border border-white/10 w-full max-w-[440px] rounded-2xl p-8 md:p-10 shadow-2xl relative flex flex-col gap-8"
            >
              <header className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full" />
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em] font-mono">System_Handshake_Protocol</span>
                </div>
                <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">Sync_Verify</h2>
              </header>

              <div className="space-y-px bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                <div className="bg-black/40 p-5 flex justify-between items-center">
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest font-mono">Status</span>
                  {verifying ? (
                    <span className="text-[10px] font-black text-white uppercase animate-pulse">Scanning...</span>
                  ) : syncCount && syncCount > 0 ? (
                    <span className="text-[10px] font-black text-white uppercase">Nominal_Uplink</span>
                  ) : (
                    <span className="text-[10px] font-black text-white/40 uppercase">No_Telemetry</span>
                  )}
                </div>
                <div className="bg-black/40 p-5 flex justify-between items-center border-t border-white/5">
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest font-mono">Ingested</span>
                  <span className="text-xl font-black text-white font-mono">{syncCount ?? 0}</span>
                </div>
              </div>

              {(!syncCount || syncCount === 0) && !verifying && (
                <div className="bg-white/5 border border-white/10 p-5 rounded-xl flex gap-3 items-start">
                  <Info size={16} className="text-white mt-0.5 shrink-0" />
                  <p className="text-[10px] text-white/40 leading-relaxed font-bold uppercase tracking-widest font-mono">
                    GitHub only streams <span className="text-white underline decoration-white/20">future events</span>. Push a commit after setup to verify the node.
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleVerify}
                  disabled={verifying}
                  className="w-full bg-white text-black font-black py-5 rounded-xl uppercase text-[11px] tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all disabled:opacity-50 active:scale-95"
                >
                  {verifying ? <Loader2 className="animate-spin" size={16} /> : <Zap size={14} fill="currentColor" />}
                  {verifying ? "Verifying..." : "Re-Verify Uplink"}
                </button>
                <button 
                  onClick={() => setShowVerifyModal(false)}
                  className="w-full bg-transparent border border-white/10 text-white/60 font-black py-4 rounded-xl uppercase text-[10px] tracking-widest hover:bg-white/5 hover:text-white transition-all active:scale-95"
                >
                  Return to Dashboard
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* HELP MODAL */}
      <AnimatePresence>
        {showHelpModal && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/95 backdrop-blur-md p-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-950 border border-white/10 w-full max-w-[600px] rounded-[2rem] overflow-hidden shadow-2xl flex flex-col"
            >
              <header className="p-8 border-b border-white/5 bg-white/[0.02] flex justify-between items-center text-left">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-secondary/10 rounded-lg text-secondary">
                    <HelpCircle size={20} />
                  </div>
                  <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Uplink_Guide</h2>
                </div>
                <button onClick={() => setShowHelpModal(false)} className="text-white/20 hover:text-white transition-colors">
                   <Zap size={24} className="rotate-45" />
                </button>
              </header>

              <div className="p-8 space-y-12 overflow-y-auto max-h-[70vh] custom-scrollbar text-left font-body">
                
                {/* SECTION: GITHUB */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <GitBranch size={18} className="text-secondary" />
                    <h3 className="text-[15px] font-black text-white uppercase tracking-[0.2em] font-label-caps">Part_A: GitHub_Handshake</h3>
                  </div>
                  
                  <div className="space-y-6 ml-1">
                    <div className="flex gap-5">
                      <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-black text-secondary shrink-0">01</div>
                      <p className="text-[13px] text-white/60 leading-relaxed uppercase font-bold">Open your repository on GitHub. Navigate to <span className="text-white">Settings &gt; Webhooks &gt; Add Webhook</span>.</p>
                    </div>
                    <div className="flex gap-5">
                      <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-black text-secondary shrink-0">02</div>
                      <div className="space-y-3 flex-1">
                        <p className="text-[13px] text-white/60 leading-relaxed uppercase font-bold">Paste the <span className="text-secondary">Payload URL</span> and set Content Type to <span className="text-white font-mono">application/json</span>.</p>
                        <div className="bg-black/60 border border-white/10 p-4 rounded-xl font-data-mono text-[11px] text-secondary break-all select-all">
                          {appUrl}/api/webhooks/github
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-5">
                      <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-black text-secondary shrink-0">03</div>
                      <p className="text-[13px] text-white/60 leading-relaxed uppercase font-bold text-left">Select <span className="text-white">Push</span> and <span className="text-white">Pull Request</span> events, then click <span className="text-white">Add Webhook</span>.</p>
                    </div>

                    <div className="p-4 bg-secondary/5 border border-secondary/10 rounded-xl flex gap-4 mt-4">
                      <Zap size={20} className="text-secondary shrink-0" />
                      <div className="space-y-1">
                        <p className="text-[11px] font-black text-secondary uppercase tracking-widest font-label-caps">Pro_Tip: Neural_Automation</p>
                        <p className="text-[11px] text-white/40 leading-relaxed uppercase font-bold">
                          Including <span className="text-white">&quot;fixes #task-id&quot;</span> in your PR description will automatically move the task to <span className="text-white">Review</span>.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-white/5 w-full" />

                {/* SECTION: SUPABASE */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <Database size={18} className="text-blue-400" />
                    <h3 className="text-[15px] font-black text-white uppercase tracking-[0.2em] font-label-caps">Part_B: Supabase_Pulse</h3>
                  </div>
                  
                  <div className="space-y-6 ml-1">
                    <div className="flex gap-5">
                      <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-black text-blue-400 shrink-0">01</div>
                      <p className="text-[13px] text-white/60 leading-relaxed uppercase font-bold text-left">Go to <span className="text-white underline decoration-blue-500/20">Database &gt; Webhooks</span>, and enable the feature in your project dashboard.</p>
                    </div>

                    <div className="flex gap-4">
                      <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-black text-blue-400 shrink-0">02</div>
                      <div className="space-y-3 flex-1 text-left">
                        <p className="text-[13px] text-white/60 leading-relaxed uppercase font-bold">Add the <span className="text-blue-400">Payload URL</span> and both <span className="text-white underline decoration-blue-500/20">HTTP Headers</span>:</p>
                        <div className="space-y-2">
                          <div className="bg-black/60 border border-white/10 p-4 rounded-xl font-data-mono text-[11px] text-blue-400 break-all select-all">
                            {appUrl}/api/webhooks/supabase
                          </div>
                          <div className="bg-black/60 border border-white/10 p-4 rounded-xl font-data-mono text-[11px] text-white/80 space-y-1">
                            <div>Header 1: <span className="text-blue-400 font-bold">Content-Type</span> | <span className="text-white">application/json</span></div>
                            <div className="pt-1">Header 2: <span className="text-blue-400 font-bold">x-team-id</span> | <span className="text-white">{readableId}</span></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-5 text-left">
                      <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-black text-blue-400 shrink-0">03</div>
                      <p className="text-[13px] text-white/60 leading-relaxed uppercase font-bold">Select the tables you want to pulse (e.g. &quot;users&quot;) and check <span className="text-white">INSERT, UPDATE, DELETE</span>. Click <span className="text-white underline">Save</span>.</p>
                    </div>
                  </div>

                  {/* TROUBLESHOOTING NOTE */}
                  <div className="p-6 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex gap-4">
                    <ShieldAlert size={20} className="text-blue-400 shrink-0 mt-1" />
                    <div className="space-y-2">
                      <p className="text-[11px] font-black text-blue-400 uppercase tracking-widest font-label-caps">Troubleshooting_Notice</p>
                      <p className="text-[11px] text-white/40 leading-relaxed uppercase font-bold">
                        Webhooks <span className="text-white underline">will not work</span> on localhost. You must use your deployed URL. Ensure the header name is exactly <span className="text-white">x-team-id</span>.
                      </p>
                    </div>
                  </div>
                </div>

              </div>

              <footer className="p-8 bg-white/[0.02] border-t border-white/5">
                <button 
                  onClick={() => setShowHelpModal(false)}
                  className="w-full bg-white text-black font-black py-5 rounded-xl uppercase text-xs tracking-[0.2em] hover:bg-zinc-200 transition-all active:scale-95"
                >
                  Understood // Acknowledge
                </button>
              </footer>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
