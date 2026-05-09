// app/admin/fleet-cmd/page.tsx
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { 
  Terminal, 
  Network, 
  Activity, 
  Gauge, 
  Lock, 
  Search, 
  Plus, 
  Cpu, 
  Fullscreen, 
  Loader2,
  RefreshCw,
  ShieldCheck,
  AlertCircle,
  Eye,
  Users,
  Trash2,
  CheckCircle2,
  Copy,
  Zap,
  ShieldAlert,
  ChevronRight,
  Mail
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { OrganizerCredentials, Event as HfEvent, APIUsage, Team, TeamMember } from "@/types/common";
import { 
  getFleetTelemetry, 
  generateOrganizerCredentialsAction, 
  resetOrganizerPasswordAction, 
  toggleTenantStatusAction,
  deleteTenantAction
} from "@/app/actions/fleet-cmd";
import { TenantDeleteModal } from "@/components/dashboard/tenant-delete-modal";

interface TenantWithEvent extends OrganizerCredentials {
  event?: HfEvent;
}

interface TeamWithMembers extends Team {
  members: TeamMember[];
}

export default function GlobalOverridePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  // State from Telemetry Action
  const [tenants, setTenants] = useState<TenantWithEvent[]>([]);
  const [events, setEvents] = useState<HfEvent[]>([]);
  const [usageByEvent, setUsageByEvent] = useState<Record<string, number>>({});
  const [totalTokens, setTotalTokens] = useState(0);
  const [totalParticipantsCount, setTotalParticipantsCount] = useState(0);
  const [latestLogs, setLatestLogs] = useState<APIUsage[]>([]);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  
  // Modal State
  const [isGenModalOpen, setIsGenModalOpen] = useState(false);
  const [newAccessId, setNewAccessId] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [emailStatus, setEmailStatus] = useState<"none" | "sent" | "failed">("none");

  // Detail Modal State
  const [selectedTenant, setSelectedTenant] = useState<TenantWithEvent | null>(null);
  const [eventTeams, setEventTeams] = useState<TeamWithMembers[]>([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);

  // Deletion Modal State
  const [tenantToDelete, setTenantToDelete] = useState<TenantWithEvent | null>(null);

  const supabase = useMemo(() => createClient(), []);

  const fetchData = useCallback(async (shouldLoad = true) => {
    if (shouldLoad) setLoading(true);
    try {
      const res = await getFleetTelemetry();
      
      if (res.success && res.data) {
        setTenants(res.data.tenants as any);
        setEvents(res.data.events as any);
        setUsageByEvent(res.data.usageMap);
        setTotalTokens(res.data.totalTokens);
        setTotalParticipantsCount(res.data.participantCount);
        setLatestLogs(res.data.logs as any);
      } else {
          console.error("TELEMETRY_ACTION_FAIL:", res.error);
      }
    } catch (error) {
      console.error("OVERRIDE_SYNC_ERROR:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated" || (session?.role !== "SUPER_ADMIN")) {
      router.push("/dashboard");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData(false);
  }, [status, session, router, fetchData]);

  const generateCredentials = async () => {
    setIsGenerating(true);
    const res = await generateOrganizerCredentialsAction(recipientEmail || undefined);

    if (res.success && res.accessId && res.rawPass) {
      setNewAccessId(res.accessId);
      setNewPassword(res.rawPass);
      setEmailStatus(res.emailSent ? "sent" : (recipientEmail ? "failed" : "none"));
      setIsGenModalOpen(true);
      setRecipientEmail(""); // Reset after use
      fetchData(true);
    } else {
      alert("GEN_ERROR: " + res.error);
    }
    setIsGenerating(false);
  };

  const resetOrganizerPassword = async (id: string, accessId: string) => {
    if (!confirm(`Are you sure you want to reset the password for ${accessId}?`)) return;
    
    const res = await resetOrganizerPasswordAction(id, accessId, recipientEmail || undefined);
    
    if (res.success && res.rawPass) {
        setNewAccessId(accessId);
        setNewPassword(res.rawPass);
        setEmailStatus(res.emailSent ? "sent" : (recipientEmail ? "failed" : "none"));
        setIsGenModalOpen(true);
        setRecipientEmail(""); // Reset after use
    } else {
        alert("RESET_FAIL: " + res.error);
    }
  };

  const confirmDeleteTenant = async () => {
    if (!tenantToDelete) return;
    
    const res = await deleteTenantAction(tenantToDelete.id);
    if (res.success) {
      setTenantToDelete(null);
      fetchData(true);
    } else {
      alert("DELETE_ERROR: " + res.error);
    }
  };

  const fetchEventDetails = async (tenant: TenantWithEvent) => {
    setSelectedTenant(tenant);
    if (!tenant.event_id) {
        setEventTeams([]);
        return;
    }
    setIsLoadingTeams(true);
    const { data } = await supabase
        .from("hf_teams")
        .select("*, members:hf_team_members(*)")
        .eq("event_id", tenant.event_id);
    setEventTeams(data || []);
    setIsLoadingTeams(false);
  };

  const toggleTenantStatus = async (id: string, currentStatus: boolean) => {
    const res = await toggleTenantStatusAction(id, currentStatus);
    if (res.success) {
      fetchData(true);
    } else {
      alert("TOGGLE_ERROR: " + res.error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const filteredTenants = tenants.filter(t => 
    t.access_id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (t.event?.name && t.event.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (status === "loading" || (loading && status === "authenticated")) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#a855f7]" size={48} />
      </div>
    );
  }

  return (
    <div className="bg-[#0a0a0b] text-[#e5e2e3] font-sans selection:bg-[#a855f7] selection:text-white min-h-screen">
      <header className="flex items-center justify-between border-b border-[#424754] px-8 py-4 bg-white/[0.03] backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="text-[#a855f7]">
            <Terminal size={24} />
          </div>
          <h1 className="text-lg font-bold tracking-tighter uppercase">Hack-Flow | Global Override</h1>
        </div>
        <div className="flex items-center gap-4 bg-[#131314] px-4 py-1.5 rounded-full border border-[#424754]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4edea3] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#4edea3]"></span>
          </span>
          <span className="font-mono text-[10px] text-[#4edea3] uppercase tracking-widest font-bold">99.99% UPTIME</span>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-mono font-bold uppercase text-white/40">
           {session?.user?.name} [GOD_MODE]
        </div>
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 px-4 py-2 border border-red-500 text-red-500 font-mono text-[10px] uppercase hover:bg-red-500 hover:text-white transition-all rounded font-bold">
            <Lock size={14} /> Lock Platform
          </button>
          <div className="w-8 h-8 rounded-full overflow-hidden border border-[#424754] bg-[#a855f7]/20 flex items-center justify-center text-[#a855f7] font-bold text-xs cursor-pointer" onClick={() => router.push("/dashboard")}>
            SA
          </div>
        </div>
      </header>

      <main className="p-8 space-y-8 max-w-[1600px] mx-auto w-full">
        {/* KPI Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiCard title="Active Tenants" value={tenants.length} icon={<Network size={20}/>} trend="▲ 2.4%" />
          <KpiCard title="Live Events" value={events.filter(e => e.is_active).length} icon={<Activity size={20}/>} trend="STABLE" />
          <KpiCard title="Global Participants" value={totalParticipantsCount.toLocaleString()} icon={<Users size={20}/>} trend="▲ 12%" />
          <KpiCard title="Global API Tokens" value={totalTokens.toLocaleString()} icon={<Gauge size={20}/>} trend="Gemini Pro 1.5" trendColor="text-[#a855f7]" />
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
          {/* Tenant Management Table */}
          <section className="xl:col-span-3 bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center bg-white/5 gap-4">
              <h3 className="font-bold text-sm uppercase tracking-wider">Tenant Registry</h3>
              <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={14} />
                  <input 
                    className="bg-[#0a0a0b] text-[11px] border border-white/10 focus:border-[#a855f7] outline-none rounded py-2 pl-9 pr-3 w-40 sm:w-48 font-mono uppercase" 
                    placeholder="Filter nodes..." 
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="flex items-center bg-black/40 border border-white/10 rounded-lg overflow-hidden group focus-within:border-[#a855f7]/50 transition-all">
                  <div className="pl-3 text-white/20 group-focus-within:text-[#a855f7] transition-colors">
                    <Mail size={14} />
                  </div>
                  <input 
                    type="email"
                    placeholder="DISPATCH_TARGET_EMAIL"
                    className="bg-transparent text-[10px] font-mono py-2 px-3 outline-none w-48 text-white placeholder:text-white/10 uppercase"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                  />
                  <button 
                    onClick={generateCredentials}
                    disabled={isGenerating}
                    className="bg-[#a855f7] text-white px-6 py-2 text-[10px] font-bold uppercase hover:bg-[#b866ff] transition-all flex items-center gap-2 border-l border-white/10 disabled:opacity-50"
                  >
                    {isGenerating ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />}
                    New Tenant
                  </button>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#1c1b1c] border-b border-white/10 text-white/40 font-mono text-[9px] uppercase tracking-widest">
                    <th className="px-6 py-4">Access ID</th>
                    <th className="px-6 py-4">Linked Event</th>
                    <th className="px-6 py-4">Auth Status</th>
                    <th className="px-6 py-4">API Usage</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono text-[10px]">
                  {filteredTenants.map((t) => (
                    <tr key={t.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4 font-bold text-white uppercase">{t.access_id}</td>
                      <td className="px-6 py-4 text-white/40 uppercase">
                        {t.event?.name || <span className="text-red-500/50 italic">Unassigned_Node</span>}
                      </td>
                      <td className="px-6 py-4 uppercase">
                        {t.azure_ad_id ? (
                          <span className="text-blue-400 flex items-center gap-1"><ShieldCheck size={12}/> Microsoft</span>
                        ) : (
                          <span className="text-white/20">Password Only</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[#a855f7] font-bold">{(usageByEvent[t.event_id || ''] || 0).toLocaleString()}</span> <span className="text-[8px] opacity-30">tokens</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <span className={`size-1.5 rounded-full ${t.is_active ? 'bg-[#4edea3] shadow-[0_0_5px_#4edea3]' : 'bg-red-500 shadow-[0_0_5px_#ef4444]'}`}></span>
                          <span className={`text-[9px] font-bold uppercase ${t.is_active ? 'text-[#4edea3]' : 'text-red-500'}`}>
                            {t.is_active ? 'Active' : 'Suspended'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-4 text-white/40 text-[9px] uppercase font-bold">
                          <button onClick={() => fetchEventDetails(t)} className="hover:text-[#a855f7] transition-colors flex items-center gap-1"><Eye size={12}/> View</button>
                          <button onClick={() => resetOrganizerPassword(t.id, t.access_id)} title="RESET_KEY_AND_DISPATCH" className="hover:text-yellow-500 transition-colors flex items-center gap-1"><RefreshCw size={12}/> Reset</button>
                          <button 
                            onClick={() => toggleTenantStatus(t.id, t.is_active)}
                            className={`${t.is_active ? 'hover:text-red-500' : 'hover:text-[#4edea3]'} transition-colors`}
                          >
                            {t.is_active ? 'Suspend' : 'Restore'}
                          </button>
                          <button 
                            onClick={() => setTenantToDelete(t)}
                            className="hover:text-red-600 transition-colors flex items-center gap-1"
                          >
                            <Trash2 size={12}/> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Infrastructure Pulse */}
          <aside className="space-y-8">
            <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6 rim-light">
              <div className="flex items-center gap-2 mb-6">
                <Cpu className="text-[#a855f7]" size={18} />
                <h4 className="font-mono text-[10px] uppercase tracking-wider">Resource Pulse</h4>
              </div>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-[9px] font-mono text-white/40 mb-2 uppercase">
                    <span>AI Model Load (Gemini)</span>
                    <span className="text-[#a855f7]">42%</span>
                  </div>
                  <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-[#a855f7]" style={{ width: '42%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[9px] font-mono text-white/40 mb-2 uppercase">
                    <span>Global DB Storage</span>
                    <span className="text-[#4edea3]">1.2GB / 5.0GB</span>
                  </div>
                  <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#a855f7] to-[#4edea3]" style={{ width: '24%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* System Logs Terminal */}
            <div className="bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden shadow-xl">
              <div className="bg-[#1c1b1c] px-4 py-2 border-b border-white/10 flex items-center gap-1.5">
                <div className="size-2 rounded-full bg-red-500"></div>
                <div className="size-2 rounded-full bg-yellow-500"></div>
                <div className="size-2 rounded-full bg-[#4edea3]"></div>
                <span className="ml-2 font-mono text-[9px] uppercase text-white/40">System-Logs / root</span>
              </div>
              <div className="p-4 h-48 overflow-y-auto font-mono text-[9px] bg-[#050506] custom-scrollbar">
                <LogLine time="14:22:01" tag="AUTH" msg="SUPER_ADMIN uplink established" color="text-white/40" />
                <LogLine time="14:22:04" tag="API" msg="GET /v4/tenants/active (200 OK)" color="text-white/40" />
                <LogLine time="14:23:12" tag="DB" msg="Cloud sync complete in 12ms" color="text-[#4edea3]" />
                <LogLine time="14:24:55" tag="WARN" msg="Peak tokens used by NYCU-NODE" color="text-yellow-500" />
                <LogLine time="14:25:01" tag="INFO" msg="Spawning new audit instance..." color="text-white/40" />
                <LogLine time="14:26:44" tag="BEAT" msg="Heartbeat stable" color="text-[#a855f7]" />
                {latestLogs.map((u, i) => (
                    <LogLine key={i} time={new Date(u.created_at).toLocaleTimeString([], { hour12: false })} tag="API" msg={`${u.operation_type}: ${u.tokens_consumed} tokens`} color="text-[#a855f7]" />
                ))}
                <p className="text-[#a855f7] opacity-50 animate-pulse mt-2">_</p>
              </div>
            </div>
          </aside>
        </div>

        {/* Map Visualization */}
        <section className="bg-white/[0.03] border border-white/10 rounded-xl relative h-80 overflow-hidden group shadow-2xl">
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0b] to-transparent"></div>
          <div className="relative z-10 p-8 flex flex-col justify-end h-full">
            <h4 className="text-xl font-bold mb-2 uppercase tracking-tighter">Active Network Nodes</h4>
            <p className="text-white/40 text-xs max-w-md uppercase tracking-tight font-mono">Real-time visualization of participant traffic and API routing across global edge regions.</p>
            <div className="flex gap-6 mt-6">
              <NodeStatus label="NA-EAST (12ms)" color="bg-[#a855f7]" />
              <NodeStatus label="EU-CENTRAL (24ms)" color="bg-[#a855f7]" />
              <NodeStatus label="ASIA-PAC (42ms)" color="bg-[#4edea3]" />
            </div>
          </div>
          <div className="absolute top-8 right-8 z-10">
            <button className="bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 px-4 py-2 rounded flex items-center gap-2 transition-all">
              <Fullscreen size={14} />
              <span className="text-[10px] font-bold uppercase font-mono">Expand Map</span>
            </button>
          </div>
        </section>
      </main>

      {/* REBUILT CREDENTIALS MODAL - SYS_SETUP AESTHETIC */}
      <AnimatePresence>
        {isGenModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm p-6">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="bg-zinc-950 border border-white/10 w-full max-w-[480px] rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative flex flex-col gap-10"
            >
              <header className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 bg-secondary rounded-full pulse-emerald shadow-[0_0_15px_rgba(78,222,163,0.5)]" />
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] font-mono">Registry_Uplink_Complete</span>
                </div>
                <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">Sys_Creds</h2>
              </header>

              <div className="space-y-4">
                <div className="space-y-6">
                  {/* Access ID Display */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-secondary tracking-[0.3em] flex items-center gap-2 ml-1">
                      <Network size={12} /> Access_Identifier
                    </label>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex justify-between items-center group hover:border-secondary/30 transition-all">
                      <span className="text-2xl font-black font-mono text-white tracking-tighter uppercase">{newAccessId}</span>
                      <button 
                        onClick={() => copyToClipboard(newAccessId)}
                        className="text-white/20 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5"
                      >
                        <Copy size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Password Display */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-secondary tracking-[0.3em] flex items-center gap-2 ml-1">
                      <Lock size={12} /> Authorization_Key
                    </label>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex justify-between items-center group hover:border-secondary/30 transition-all">
                      <span className="text-2xl font-black font-mono text-white tracking-tighter">{newPassword}</span>
                      <button 
                        onClick={() => copyToClipboard(newPassword)}
                        className="text-white/20 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5"
                      >
                        <Copy size={18} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Email Dispatch Status */}
                {emailStatus !== "none" && (
                  <div className={`p-4 rounded-xl border flex items-center gap-3 animate-in fade-in slide-in-from-left-2 duration-500 ${emailStatus === 'sent' ? 'bg-secondary/5 border-secondary/20 text-secondary' : 'bg-red-500/5 border-red-500/20 text-red-500'}`}>
                    {emailStatus === 'sent' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    <p className="text-[10px] font-black uppercase tracking-widest font-mono">
                      {emailStatus === 'sent' ? "Credential_Dispatch_Successful" : "Dispatch_Fail: Check_SMTP_Protocol"}
                    </p>
                  </div>
                )}

                <div className="bg-red-500/5 border border-red-500/10 p-6 rounded-2xl flex gap-4 mt-2">
                  <ShieldAlert size={20} className="text-red-500 shrink-0 mt-1" />
                  <div className="space-y-1">
                    <p className="text-[11px] font-black text-red-500 uppercase tracking-widest">Security_Critical</p>
                    <p className="text-[11px] text-white/40 leading-relaxed uppercase font-bold">
                      Credentials will not be displayed again. Handover these details to the tenant immediately.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-4">
                <button 
                  onClick={() => setIsGenModalOpen(false)}
                  className="w-full bg-secondary text-black font-black py-5 rounded-[1.5rem] uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-[#5affb4] transition-all shadow-[0_0_40px_rgba(78,222,163,0.2)] active:scale-95 group"
                >
                  {isCopied ? <CheckCircle2 size={18} /> : <Zap size={18} fill="currentColor" />}
                  {isCopied ? "COPIED_TO_TERMINAL" : "ACKNOWLEDGE_&_CLOSE"}
                  <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EVENT DETAIL MODAL */}
      {selectedTenant && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 font-mono uppercase tracking-tighter text-left">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setSelectedTenant(null)}></div>
            <div className="relative bg-[#0a0a0b] border border-white/10 w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col rounded-3xl shadow-[0_0_100px_rgba(168,85,247,0.1)]">
                <div className="p-8 border-b border-white/5 flex justify-between items-start bg-white/[0.02]">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 bg-[#a855f7]/20 text-[#a855f7] text-[9px] font-bold border border-[#a855f7]/30 rounded">NODE_EXPLORER</span>
                            <h2 className="text-3xl font-black text-white italic">{selectedTenant.event?.name || "UNASSIGNED_NODE"}</h2>
                        </div>
                        <p className="text-[10px] text-white/40 font-bold tracking-widest">ACCESS_ID: {selectedTenant.access_id} | CREATED: {new Date(selectedTenant.created_at).toLocaleDateString()}</p>
                    </div>
                    <button onClick={() => setSelectedTenant(null)} className="p-2 hover:bg-white/5 rounded-full transition-colors"><Plus className="rotate-45" size={24}/></button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8 text-left">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                            <p className="text-[9px] text-white/40 mb-1 font-bold tracking-widest">API_CONSUMPTION</p>
                            <h3 className="text-2xl font-black text-[#a855f7] italic">{(usageByEvent[selectedTenant.event_id || ''] || 0).toLocaleString()} <span className="text-[10px] not-italic text-white/20">TOKENS</span></h3>
                        </div>
                        <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl text-center">
                            <p className="text-[9px] text-white/40 mb-1 font-bold tracking-widest">MISSION_TEAMS</p>
                            <h3 className="text-2xl font-black text-white italic">{eventTeams.length} <span className="text-[10px] not-italic text-white/20">ACTIVE</span></h3>
                        </div>
                        <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl text-right">
                            <p className="text-[9px] text-white/40 mb-1 font-bold tracking-widest">NODE_STATUS</p>
                            <h3 className={`text-2xl font-black italic ${selectedTenant.is_active ? 'text-[#4edea3]' : 'text-red-500'}`}>{selectedTenant.is_active ? 'STABLE' : 'OFFLINE'}</h3>
                        </div>
                    </div>

                    {/* SECURITY & ACCESS SECTION */}
                    <div className="p-8 bg-[#a855f7]/5 border border-[#a855f7]/10 rounded-[2rem] space-y-6">
                        <div className="flex items-center gap-3">
                            <Lock size={18} className="text-[#a855f7]" />
                            <h4 className="text-xs font-black text-white uppercase tracking-widest">Security_&_Access_Protocol</h4>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-white/20 uppercase tracking-widest ml-1">Current_Access_ID</label>
                                <div className="bg-black/40 border border-white/5 rounded-xl p-4 font-mono text-sm text-white">
                                    {selectedTenant.access_id}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-white/20 uppercase tracking-widest ml-1">Authorization_Key_Status</label>
                                <div className="bg-black/40 border border-white/5 rounded-xl p-4 flex justify-between items-center">
                                    <span className="font-mono text-[11px] text-white/40 italic">•••••••• [ENCRYPTED]</span>
                                    <button 
                                        onClick={() => {
                                            setSelectedTenant(null);
                                            resetOrganizerPassword(selectedTenant.id, selectedTenant.access_id);
                                        }}
                                        className="text-[9px] font-black text-[#a855f7] uppercase hover:underline"
                                    >
                                        Reissue_Key
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-white/5 flex items-center gap-4">
                            <div className={`size-2 rounded-full ${selectedTenant.azure_ad_id ? 'bg-blue-400' : 'bg-white/10'}`} />
                            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                                Microsoft_Link: <span className={selectedTenant.azure_ad_id ? "text-blue-400" : "text-white/20"}>
                                    {selectedTenant.azure_ad_id ? `Linked_Authenticated [${selectedTenant.azure_ad_id.substring(0,8)}...]` : "No_Secondary_Auth_Linked"}
                                </span>
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <h4 className="text-xs font-black text-white flex items-center gap-2 tracking-widest text-left"><Users size={14}/> Active_Team_Registry</h4>
                            <span className="text-[9px] text-white/20">Total: {eventTeams.length} Nodes</span>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            {isLoadingTeams ? (
                                <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-white/10" /></div>
                            ) : eventTeams.length > 0 ? (
                                eventTeams.map((team) => (
                                    <div key={team.id} className="p-5 bg-white/[0.03] border border-white/5 rounded-2xl flex items-center justify-between group hover:border-[#a855f7]/20 transition-all">
                                        <div className="flex items-center gap-6">
                                            <div className="text-center px-4 border-r border-white/5">
                                                <p className="text-[8px] text-white/20 mb-1 font-bold text-left">PROGRESS</p>
                                                <p className="text-xl font-black text-secondary italic leading-none">{team.ai_progress_score}%</p>
                                            </div>
                                            <div>
                                                <h5 className="font-black text-white mb-1 group-hover:text-[#a855f7] transition-colors italic text-left">{team.name}</h5>
                                                <p className="text-[9px] text-white/40 font-bold tracking-widest flex items-center gap-2 italic text-left uppercase">
                                                    ID: <span className="text-white/60">{team.readable_id || "N/A"}</span> 
                                                    | PIN: <span className="text-white/60">**** [HASHED]</span>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-3">
                                            <button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-[9px] font-black rounded-lg transition-all border border-white/5">INSPECT_NODE</button>
                                            <button className="px-4 py-2 bg-white/5 hover:bg-red-500/20 hover:text-red-500 text-[9px] font-black rounded-lg transition-all border border-white/5">EJECT</button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-20 text-center bg-white/[0.01] border border-dashed border-white/5 rounded-3xl">
                                    <p className="text-white/20 text-[10px] font-bold tracking-[0.5em]">No teams detected in this node sector.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-8 border-t border-white/5 bg-white/[0.01] flex justify-between items-center font-mono uppercase tracking-tighter">
                    <p className="text-[9px] text-white/20 font-bold italic">Node Handshake: {selectedTenant.access_id}@{selectedTenant.event?.id?.substring(0,8)}</p>
                    <div className="flex gap-4">
                        <button onClick={() => setSelectedTenant(null)} className="px-8 py-3 bg-white/5 text-white text-[10px] font-black rounded-xl border border-white/10 hover:bg-white/10 transition-all">EXIT_DIVE</button>
                    </div>
                </div>
            </div>
        </div>
      )}

      <AnimatePresence>
        {tenantToDelete && (
          <TenantDeleteModal 
            tenantId={tenantToDelete.id}
            accessId={tenantToDelete.access_id}
            onConfirm={confirmDeleteTenant}
            onClose={() => setTenantToDelete(null)}
          />
        )}
      </AnimatePresence>

      <footer className="border-t border-[#424754] px-8 py-4 flex justify-between items-center bg-[#131314]">
        <div className="flex items-center gap-8">
          <p className="font-mono text-[9px] text-white/40 uppercase">System Version: 4.5.0-TENANT</p>
          <div className="h-3 w-[1px] bg-[#424754]"></div>
          <p className="font-mono text-[9px] text-white/40 uppercase">Kernel: HF-2026-X</p>
        </div>
        <div className="flex items-center gap-4 font-mono text-[9px] text-[#a855f7] uppercase font-bold tracking-widest">
          <a className="hover:underline" href="#">Documentation</a>
          <span className="text-white/10">© 2026 Hack-Flow Global Control</span>
        </div>
      </footer>
    </div>
  );
}

function KpiCard({ title, value, icon, trend, trendColor = "text-[#4edea3]" }: { title: string; value: string | number; icon: React.ReactNode; trend: string; trendColor?: string }) {
  return (
    <div className="bg-white/[0.03] border border-white/10 p-6 rounded-xl hover:border-[#a855f7] transition-all group rim-light shadow-xl">
      <div className="flex justify-between items-start mb-4">
        <p className="font-mono text-[9px] text-white/40 uppercase tracking-[0.2em] font-bold">{title}</p>
        <div className="text-[#a855f7] opacity-50 group-hover:opacity-100 transition-opacity">{icon}</div>
      </div>
      <h2 className="text-3xl font-black text-white tracking-tighter italic">{value}</h2>
      <div className="flex items-center gap-2 mt-2">
        <span className={`${trendColor} text-[10px] font-black tracking-widest`}>{trend}</span>
        <span className="text-white/20 text-[10px] uppercase font-mono italic">Live_Telemetry</span>
      </div>
    </div>
  );
}

function LogLine({ time, tag, msg, color }: { time: string; tag: string; msg: string; color: string }) {
  return (
    <p className="mb-1 leading-relaxed">
      <span className="text-[#a855f7] mr-2">[{time}]</span>
      <span className={`${color} font-black mr-2 tracking-widest`}>{tag}:</span>
      <span className="text-white/40 italic font-medium">{msg}</span>
    </p>
  );
}

function NodeStatus({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`size-2 rounded-full ${color} pulse-glow`}></span>
      <span className="font-mono text-[9px] uppercase tracking-tighter text-white/60">{label}</span>
    </div>
  );
}
