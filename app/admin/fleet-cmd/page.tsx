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
  Users
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { OrganizerCredentials, Event as HfEvent, APIUsage, Team, TeamMember } from "@/types/common";
import { getFleetTelemetry } from "@/app/actions/fleet-cmd";
import bcrypt from "bcryptjs";

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
  
  // Modal State
  const [isGenModalOpen, setIsGenModalOpen] = useState(false);
  const [newAccessId, setNewAccessId] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Detail Modal State
  const [selectedTenant, setSelectedTenant] = useState<TenantWithEvent | null>(null);
  const [eventTeams, setEventTeams] = useState<TeamWithMembers[]>([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);

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
      if (shouldLoad) setLoading(false);
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
    const accessId = `HACK-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const rawPass = Math.random().toString(36).substring(2, 10);
    const hashedPass = await bcrypt.hash(rawPass, 10);

    const { error } = await supabase.from("hf_organizer_credentials").insert({
      access_id: accessId,
      password_hash: hashedPass,
      role: 'ORGANIZER',
      is_active: true
    });

    if (error) {
      alert("GEN_ERROR: " + error.message);
    } else {
      setNewAccessId(accessId);
      setNewPassword(rawPass);
      setIsGenModalOpen(true);
      fetchData(true);
    }
    setIsGenerating(false);
  };

  const resetOrganizerPassword = async (id: string, accessId: string) => {
    const rawPass = Math.random().toString(36).substring(2, 10);
    const hashedPass = await bcrypt.hash(rawPass, 10);
    
    const { error } = await supabase
        .from("hf_organizer_credentials")
        .update({ password_hash: hashedPass })
        .eq("id", id);
    
    if (error) {
        alert("RESET_FAIL: " + error.message);
    } else {
        setNewAccessId(accessId);
        setNewPassword(rawPass);
        setIsGenModalOpen(true);
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
    const { error } = await supabase
      .from("hf_organizer_credentials")
      .update({ is_active: !currentStatus })
      .eq("id", id);
    if (!error) fetchData(true);
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
            <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-white/5">
              <h3 className="font-bold text-sm uppercase tracking-wider">Tenant Registry</h3>
              <div className="flex gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={14} />
                  <input 
                    className="bg-[#0a0a0b] text-[11px] border border-white/10 focus:border-[#a855f7] outline-none rounded py-2 pl-9 pr-3 w-48 font-mono uppercase" 
                    placeholder="Filter nodes..." 
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <button 
                  onClick={generateCredentials}
                  disabled={isGenerating}
                  className="bg-[#a855f7] text-white px-6 py-2 text-[10px] font-bold uppercase rounded hover:shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all flex items-center gap-2"
                >
                  {isGenerating ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />}
                  New Tenant
                </button>
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
                          <button onClick={() => resetOrganizerPassword(t.id, t.access_id)} className="hover:text-yellow-500 transition-colors flex items-center gap-1"><RefreshCw size={12}/> Reset</button>
                          <button 
                            onClick={() => toggleTenantStatus(t.id, t.is_active)}
                            className={`${t.is_active ? 'hover:text-red-500' : 'hover:text-[#4edea3]'} transition-colors`}
                          >
                            {t.is_active ? 'Suspend' : 'Restore'}
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

      {/* CREDENTIALS GENERATED MODAL */}
      {isGenModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsGenModalOpen(false)}></div>
          <div className="relative bg-[#131314] border border-[#a855f7]/30 p-8 rounded-2xl max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-[#a855f7]/10 rounded-xl text-[#a855f7]">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold uppercase tracking-tight italic">Uplink Created</h3>
                <p className="text-[10px] text-white/40 uppercase font-mono tracking-widest">Organizer Mission Credentials</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-black/40 rounded-xl border border-white/5 group transition-all hover:border-[#a855f7]/20">
                <label className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-1 block">Access Identifier</label>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold font-mono text-[#a855f7] tracking-tighter">{newAccessId}</span>
                  <button onClick={() => navigator.clipboard.writeText(newAccessId)} className="text-white/20 hover:text-white transition-colors"><RefreshCw size={14}/></button>
                </div>
              </div>

              <div className="p-4 bg-black/40 rounded-xl border border-white/5 group transition-all hover:border-[#a855f7]/20">
                <label className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-1 block">Authorization Key</label>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold font-mono text-[#a855f7] tracking-tighter">{newPassword}</span>
                  <button onClick={() => navigator.clipboard.writeText(newPassword)} className="text-white/20 hover:text-white transition-colors"><RefreshCw size={14}/></button>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3">
              <div className="flex items-center gap-3 text-red-500/60 bg-red-500/5 p-4 rounded-xl border border-red-500/10 mb-2">
                <AlertCircle size={14} className="shrink-0" />
                <p className="text-[9px] font-bold uppercase leading-tight font-mono">CRITICAL: Credentials will not be shown again. Secure them immediately.</p>
              </div>
              <button 
                onClick={() => setIsGenModalOpen(false)}
                className="w-full py-4 bg-[#a855f7] text-white font-bold uppercase tracking-widest text-[10px] rounded-xl hover:brightness-110 transition-all shadow-xl active:scale-95"
              >
                CLOSE_HANDSHAKE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EVENT DETAIL MODAL */}
      {selectedTenant && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 font-mono uppercase tracking-tighter">
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

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
                    <div className="grid grid-cols-3 gap-6">
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

                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <h4 className="text-xs font-black text-white flex items-center gap-2 tracking-widest"><Users size={14}/> Active_Team_Registry</h4>
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
                                                <p className="text-[8px] text-white/20 mb-1 font-bold">PROGRESS</p>
                                                <p className="text-xl font-black text-secondary italic leading-none">{team.ai_progress_score}%</p>
                                            </div>
                                            <div>
                                                <h5 className="font-black text-white mb-1 group-hover:text-[#a855f7] transition-colors italic">{team.name}</h5>
                                                <p className="text-[9px] text-white/40 font-bold tracking-widest flex items-center gap-2 italic">
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
