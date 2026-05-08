"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { 
  ArrowLeft, 
  Users, 
  ShieldCheck, 
  ShieldAlert, 
  Loader2, 
  Trophy, 
  Zap,
  BarChart3,
  FileText,
  MessageSquare,
  Eye,
  Terminal,
  Activity,
  ChevronRight,
  History,
  Clock,
  LayoutGrid,
  List
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { TeamDetailsModal } from "@/components/dashboard/team-details-modal";
import { AuditReportModal } from "@/components/dashboard/audit-report-modal";
import { Event, Team, TeamMember } from "@/types/common";
import { performDeepAudit } from "@/app/actions/ai-tracker";
import { motion, AnimatePresence } from "framer-motion";

interface JudgingResult {
  alignment_score: number;
  execution_score: number;
  innovation_score: number;
  technical_score: number;
  total_score: number;
  ai_justification: string;
}

export default function EventViewPage() {
  const params = useParams();
  const id = params.id as string;
  const [event, setEvent] = useState<Event | any>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [auditingId, setAuditingId] = useState<string | null>(null);
  const [judgingResults, setJudgingResults] = useState<Record<string, JudgingResult>>({});
  const [telemetry, setTelemetry] = useState<any[]>([]);
  
  // Modals
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Report Modal
  const [selectedReportTeam, setSelectedReportTeam] = useState<any | null>(null);
  const [selectedReportResults, setSelectedReportResults] = useState<any | null>(null);
  const [selectedReportMilestones, setSelectedReportMilestones] = useState<any[]>([]);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isReportLoading, setIsReportLoading] = useState(false);

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    try {
      // 1. Fetch Event & Teams
      const [eventRes, teamsRes] = await Promise.all([
        supabase.from('hf_events').select('*').eq('id', id).single(),
        supabase.from('hf_teams').select('*').eq('event_id', id).order('ai_progress_score', { ascending: false })
      ]);

      if (eventRes.error) throw eventRes.error;
      setEvent(eventRes.data);
      const teamsData = teamsRes.data || [];
      setTeams(teamsData);

      const teamIds = teamsData.map((t: any) => t.id);

      // 2. Fetch Members, Results, and Telemetry
      if (teamIds.length > 0) {
        const [membersRes, resultsRes, telemetryRes] = await Promise.all([
            supabase.from('hf_team_members').select('*').in('team_id', teamIds),
            supabase.from('hf_judging_results').select('*').eq('event_id', id),
            supabase.from('hf_telemetry_logs').select('*, hf_teams(name)').in('team_id', teamIds).order('created_at', { ascending: false }).limit(20)
        ]);

        const resultsMap: Record<string, JudgingResult> = {};
        resultsRes.data?.forEach((r: any) => {
            resultsMap[r.team_id] = {
            alignment_score: r.alignment_score,
            execution_score: r.execution_score,
            innovation_score: r.innovation_score,
            technical_score: r.technical_score,
            total_score: r.total_score,
            ai_justification: r.ai_justification
            };
        });
        setJudgingResults(resultsMap);
        setMembers((membersRes.data as TeamMember[]) || []);
        setTelemetry(telemetryRes.data || []);
      }

    } catch (error: unknown) {
      console.error("DATA_FETCH_ERROR:", error);
    } finally {
      setLoading(false);
    }
  }, [id, supabase]);

  useEffect(() => {
    fetchData();
    // Real-time updates for telemetry
    const channel = supabase
      .channel(`event-broadcast-${id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'hf_telemetry_logs' }, () => fetchData())
      .subscribe();
    
    return () => { supabase.removeChannel(channel); };
  }, [fetchData, id, supabase]);

  const handleDeepAudit = async (team: any) => {
    if (!event) return;
    setAuditingId(team.id);
    try {
      const res = await performDeepAudit(
        team.id, 
        event.id, 
        event.problem_statement || "Build a hackathon project", 
        event.judging_rubric
      );
      if (res.success) await fetchData();
    } catch (err) {
      console.error("Audit failed", err);
    } finally {
      setAuditingId(null);
    }
  };

  const handleViewReport = async (team: any) => {
    setIsReportLoading(true);
    setSelectedReportTeam(team);
    setSelectedReportResults(judgingResults[team.id]);
    try {
        const { data: dna } = await supabase.from('hf_project_dna').select('*').eq('team_id', team.id).order('created_at', { ascending: true });
        setSelectedReportMilestones(dna || []);
        setIsReportOpen(true);
    } finally {
        setIsReportLoading(false);
    }
  };

  const top3 = useMemo(() => teams.slice(0, 3), [teams]);
  const runnersUp = useMemo(() => teams.slice(3), [teams]);

  if (loading && !event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-[#0A0A0B]">
        <Loader2 className="animate-spin text-secondary" size={48} />
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Syncing_Fleet_Telemetry</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#0A0A0B] text-white overflow-hidden font-sans">
      
      {/* 1. TOP BROADCAST BAR */}
      <header className="h-24 px-12 z-50 flex justify-between items-center bg-[#0A0A0B]/80 backdrop-blur-xl border-b border-white/5 shadow-[0_0_50px_rgba(78,222,163,0.05)]">
        <div className="flex items-center gap-6">
            <Link href="/dashboard" className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all group">
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            </Link>
            <div className="flex flex-col">
                <span className="text-[10px] font-black text-secondary uppercase tracking-[0.3em]">Command_Center</span>
                <h2 className="text-xl font-black uppercase italic tracking-tighter leading-none">Hack-Flow <span className="text-white/20">//</span> Broadcast</h2>
            </div>
        </div>

        <div className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none">
            <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">
                {event?.name || "WINTER HACKATHON"}
            </h1>
            <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.6em] mt-2">Live Ranking Protocol Active</p>
        </div>

        <div className="flex items-center gap-8">
            <div className="text-right flex flex-col">
                <div className="flex items-center gap-3 justify-end">
                    <div className="w-2 h-2 bg-secondary rounded-full animate-pulse shadow-[0_0_10px_#4edea3]" />
                    <span className="text-sm font-black uppercase tracking-widest">LIVE_RANKINGS</span>
                </div>
                <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest mt-1">System V0.98-BETA</span>
            </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        
        {/* 2. LEFT SIDE: LEADERBOARD & PODIUM (75%) */}
        <div className="w-3/4 flex flex-col p-12 gap-12 overflow-y-auto custom-scrollbar relative">
            
            {/* BACKGROUND DECOR */}
            <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-[120px] pointer-events-none" />
            
            {/* HERO PODIUM */}
            <div className="min-h-[450px] flex items-end justify-center gap-10 pb-6 relative z-10">
                
                {/* RANK 02 */}
                {top3[1] && (
                    <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex flex-col items-center gap-6 w-72">
                        <div className="text-center space-y-1">
                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter truncate w-64">{top3[1].name}</h3>
                            <p className="text-white/40 font-mono text-xs uppercase tracking-widest">Pulse: {top3[1].ai_progress_score}%</p>
                        </div>
                        <div className="w-full h-[240px] bg-gradient-to-b from-white/10 to-transparent border-t-2 border-white/20 backdrop-blur-md rounded-t-3xl flex flex-col items-center pt-8 relative group overflow-hidden">
                            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <span className="text-7xl font-black text-white/10 italic">02</span>
                            
                            <div className="mt-auto pb-10 flex flex-col items-center gap-4 relative z-10">
                                <div className="flex gap-2">
                                    <button onClick={() => handleViewReport(top3[1])} className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all border border-white/10">
                                        <Eye size={18} />
                                    </button>
                                    <button onClick={() => handleDeepAudit(top3[1])} disabled={auditingId === top3[1].id} className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all border border-white/10 text-[10px] font-black uppercase flex items-center gap-2">
                                        {auditingId === top3[1].id ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />} Audit
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* RANK 01 */}
                {top3[0] && (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-6 w-[400px]">
                        <div className="text-center space-y-2">
                            <div className="flex justify-center mb-2">
                                <div className="p-3 bg-amber-400/20 rounded-full border border-amber-400/30 text-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.3)]">
                                    <Trophy size={32} />
                                </div>
                            </div>
                            <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter truncate w-96">{top3[0].name}</h3>
                            <p className="text-amber-400 font-black text-sm uppercase tracking-[0.3em] flex items-center justify-center gap-3">
                                <Zap size={14} /> Total Score: {judgingResults[top3[0].id]?.total_score || "--"}
                            </p>
                        </div>
                        <div className="w-full h-[360px] bg-gradient-to-b from-amber-400/20 to-transparent border-t-4 border-amber-400/50 backdrop-blur-xl rounded-t-[3rem] flex flex-col items-center pt-12 relative group shadow-[0_-20px_100px_rgba(251,191,36,0.1)] overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
                            <span className="text-9xl font-black text-amber-400/10 italic leading-none">01</span>
                            
                            <div className="mt-auto pb-12 flex flex-col items-center gap-4 relative z-10 w-full px-12">
                                <div className="flex gap-3 w-full">
                                    <button onClick={() => handleViewReport(top3[0])} className="p-4 bg-amber-400/20 hover:bg-amber-400/30 rounded-2xl transition-all border border-amber-400/20 text-amber-400 flex-1 flex items-center justify-center">
                                        <Eye size={20} />
                                    </button>
                                    <button onClick={() => handleDeepAudit(top3[0])} disabled={auditingId === top3[0].id} className="flex-[3] py-4 bg-amber-400 text-black rounded-2xl transition-all font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 hover:bg-amber-300">
                                        {auditingId === top3[0].id ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />} Run AI Audit
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* RANK 03 */}
                {top3[2] && (
                    <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex flex-col items-center gap-6 w-72">
                         <div className="text-center space-y-1">
                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter truncate w-64">{top3[2].name}</h3>
                            <p className="text-white/40 font-mono text-xs uppercase tracking-widest">Pulse: {top3[2].ai_progress_score}%</p>
                        </div>
                        <div className="w-full h-[180px] bg-gradient-to-b from-orange-700/20 to-transparent border-t-2 border-orange-700/30 backdrop-blur-md rounded-t-3xl flex flex-col items-center pt-6 relative group overflow-hidden">
                            <span className="text-6xl font-black text-orange-700/10 italic">03</span>
                            
                            <div className="mt-auto pb-8 flex flex-col items-center gap-4 relative z-10">
                                <div className="flex gap-2">
                                    <button onClick={() => handleViewReport(top3[2])} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5">
                                        <Eye size={16} />
                                    </button>
                                    <button onClick={() => handleDeepAudit(top3[2])} disabled={auditingId === top3[2].id} className="px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5 text-[9px] font-black uppercase flex items-center gap-1">
                                        {auditingId === top3[2].id ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />} Audit
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* RUNNERS UP GRID */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 relative z-10 pb-20">
                {runnersUp.map((team, i) => (
                    <motion.div key={team.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.1 }} className="bg-white/[0.02] border border-white/5 p-6 rounded-[2rem] flex items-center gap-6 group hover:border-secondary/30 transition-all hover:bg-white/[0.04]">
                        <span className="text-3xl font-black text-white/10 italic leading-none">{String(i + 4).padStart(2, '0')}</span>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-white uppercase truncate group-hover:text-secondary transition-colors">{team.name}</p>
                            <p className="text-[10px] text-white/30 font-mono mt-1">{team.ai_progress_score}% COMPLETE</p>
                        </div>
                        <div className="flex flex-col gap-2">
                            <button onClick={() => handleViewReport(team)} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/5">
                                <Eye size={14} />
                            </button>
                            <button onClick={() => handleDeepAudit(team)} disabled={auditingId === team.id} className="p-2 bg-white/5 hover:bg-secondary/20 hover:text-secondary rounded-lg border border-white/5">
                                {auditingId === team.id ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>

        </div>

        {/* 3. RIGHT SIDE: ENGINEERING PULSE (25%) */}
        <aside className="w-1/4 bg-[#0e0e11] border-l border-white/5 flex flex-col p-10 overflow-hidden shadow-[-50px_0_100px_rgba(0,0,0,0.5)] z-20">
            <header className="flex items-center gap-4 mb-10">
                <div className="p-3 bg-secondary/10 rounded-2xl text-secondary">
                    <Activity size={20} />
                </div>
                <div>
                    <h4 className="text-xs font-black uppercase tracking-[0.3em]">Engineering_Pulse</h4>
                    <span className="text-[9px] text-white/20 font-bold uppercase tracking-widest">Real-time Stream</span>
                </div>
            </header>

            <div className="flex-1 relative overflow-hidden">
                <div className="space-y-6">
                    <AnimatePresence mode="popLayout">
                        {telemetry.map((log, i) => (
                            <motion.div 
                                key={log.id} 
                                initial={{ opacity: 0, x: 20 }} 
                                animate={{ opacity: 1, x: 0 }} 
                                transition={{ delay: i * 0.05 }}
                                className="p-5 border-l-2 border-secondary/30 bg-secondary/[0.03] rounded-r-2xl relative group"
                            >
                                <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="w-1 h-1 bg-secondary rounded-full animate-ping" />
                                </div>
                                <p className="text-[11px] font-black text-white uppercase tracking-wider mb-2">{log.hf_teams?.name || "System"}</p>
                                <p className="text-xs text-white/50 leading-relaxed font-medium italic">&quot;{log.details}&quot;</p>
                                <div className="flex items-center gap-2 mt-4">
                                    <Clock size={10} className="text-secondary/40" />
                                    <span className="text-[9px] text-white/20 font-black uppercase tracking-widest">
                                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
                
                {telemetry.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-white/5 rounded-[2rem]">
                        <Terminal size={40} className="text-white/5 mb-4" />
                        <p className="text-[10px] text-white/20 font-black uppercase tracking-widest">Awaiting uplink evidence...</p>
                    </div>
                )}
            </div>

            <div className="mt-10 pt-8 border-t border-white/5 space-y-4">
                 <button className="w-full py-4 bg-white/[0.03] border border-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all">
                    <History size={16} /> Global Event Logs
                </button>
                <div className="p-4 bg-secondary/5 rounded-xl border border-secondary/10">
                    <p className="text-[9px] text-secondary/60 font-black uppercase tracking-tighter text-center">Node_Encryption: AES-256-GCM</p>
                </div>
            </div>
        </aside>

      </main>

      {/* 4. BOTTOM STATUS TICKER */}
      <footer className="h-12 bg-[#0A0A0B] border-t border-white/5 flex items-center px-12 justify-between z-50">
          <div className="flex items-center gap-10">
            <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Nodes_Active:</span>
                <span className="text-[10px] font-mono font-bold text-secondary">{teams.length}</span>
            </div>
            <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Avg_Uptime:</span>
                <span className="text-[10px] font-mono font-bold text-secondary">99.98%</span>
            </div>
            <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Sync_Status:</span>
                <span className="text-[10px] font-mono font-bold text-emerald-400">OPTIMAL</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-[10px] font-mono text-white/40 uppercase">UTC_{new Date().toISOString().slice(11, 19)}</span>
            <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
          </div>
      </footer>

      {/* Modals */}
      <TeamDetailsModal 
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedTeam(null); }}
        team={selectedTeam}
        members={selectedTeam ? members.filter(m => m.team_id === selectedTeam.id) : []}
      />

      <AuditReportModal 
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        team={selectedReportTeam}
        results={selectedReportResults}
        milestones={selectedReportMilestones}
      />

    </div>
  );
}
