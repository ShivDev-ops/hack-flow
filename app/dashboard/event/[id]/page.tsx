"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { 
  ArrowLeft, 
  Users, 
  Loader2, 
  Trophy, 
  Zap,
  BarChart3,
  FileText,
  Eye,
  Terminal,
  Activity,
  History,
  Clock
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
  
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [selectedReportTeam, setSelectedReportTeam] = useState<any | null>(null);
  const [selectedReportResults, setSelectedReportResults] = useState<any | null>(null);
  const [selectedReportMilestones, setSelectedReportMilestones] = useState<any[]>([]);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isReportLoading, setIsReportLoading] = useState(false);

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    try {
      const [eventRes, teamsRes] = await Promise.all([
        supabase.from('hf_events').select('*').eq('id', id).single(),
        supabase.from('hf_teams').select('*').eq('event_id', id).order('ai_progress_score', { ascending: false })
      ]);

      if (eventRes.error) throw eventRes.error;
      setEvent(eventRes.data);
      const teamsData = teamsRes.data || [];
      
      const teamIds = teamsData.map((t: any) => t.id);
      
      if (teamIds.length > 0) {
        const [membersRes, resultsRes, telemetryRes] = await Promise.all([
            supabase.from('hf_team_members').select('*').in('team_id', teamIds),
            supabase.from('hf_judging_results').select('*').eq('event_id', id),
            supabase.from('hf_telemetry_logs').select('*, hf_teams(name)').in('team_id', teamIds).order('created_at', { ascending: false }).limit(20)
        ]);

        const resultsMap: Record<string, JudgingResult> = {};
        resultsRes.data?.forEach((r: any) => {
            resultsMap[r.team_id] = { ...r };
        });
        
        const sortedTeams = teamsData.sort((a,b) => {
            const scoreA = resultsMap[a.id]?.total_score || 0;
            const scoreB = resultsMap[b.id]?.total_score || 0;
            if(scoreB !== scoreA) return scoreB - scoreA;
            return (b.ai_progress_score || 0) - (a.ai_progress_score || 0);
        });

        setTeams(sortedTeams);
        setJudgingResults(resultsMap);
        setMembers((membersRes.data as TeamMember[]) || []);
        setTelemetry(telemetryRes.data || []);
      } else {
        setTeams([]);
      }
    } catch (error) {
      console.error("DATA_FETCH_ERROR:", error);
    } finally {
      setLoading(false);
    }
  }, [id, supabase]);

  useEffect(() => {
    fetchData();
    const channel = supabase.channel(`event-broadcast-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hf_judging_results' }, () => fetchData())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'hf_teams' }, () => fetchData())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'hf_telemetry_logs' }, (payload) => {
        setTelemetry(current => [payload.new, ...current].slice(0,20));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchData, id, supabase]);

  const handleDeepAudit = async (team: any) => {
    if (!event) return;
    setAuditingId(team.id);
    try {
      const res = await performDeepAudit(team.id, event.id, event.problem_statement || "Build a hackathon project", event.judging_rubric);
      if (!res.success) {
        alert(`Audit Failed: ${res.error}`);
      }
    } catch (err: any) {
      console.error("AUDIT_UI_ERROR:", err);
      alert(`Critical Audit Error: ${err.message || "The AI model might be busy or quota exceeded. Please try again in 1 minute."}`);
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
      <div className="flex items-center justify-center h-screen bg-[#0A0A0B]">
        <Loader2 className="animate-spin text-secondary" size={48} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#0A0A0B] text-white font-sans">
      <header className="min-h-[96px] px-4 sm:px-6 md:px-12 z-50 flex flex-col md:flex-row justify-between items-center bg-[#0A0A0B]/80 backdrop-blur-xl border-b border-white/5 shadow-[0_0_50px_rgba(78,222,163,0.05)] py-4 gap-4 md:py-0">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <Link href="/dashboard" className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all"><ArrowLeft size={18} /></Link>
          <div className="flex flex-col"><span className="text-[10px] font-black text-secondary uppercase tracking-[0.3em]">Command</span><h2 className="text-lg font-black uppercase italic tracking-tighter leading-none">Broadcast</h2></div>
        </div>
        <div className="text-center order-first md:order-none"><h1 className="text-2xl md:text-4xl font-black uppercase italic tracking-tighter leading-none">{event?.name || "LIVE EVENT"}</h1></div>
        <div className="flex items-center gap-3"><div className="w-2 h-2 bg-secondary rounded-full animate-pulse" /><span className="text-xs font-black uppercase tracking-widest">LIVE_RANKINGS</span></div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <div className="flex-1 flex flex-col p-4 md:p-8 lg:p-12 gap-8 relative overflow-y-auto custom-scrollbar">
          <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-secondary/5 to-transparent pointer-events-none" />
          <div className="flex flex-col md:flex-row items-center md:items-end justify-center gap-4 md:gap-8 pb-6 relative z-10 min-h-[300px] md:min-h-[450px]">
            {top3[1] && <PodiumCard rank={2} team={top3[1]} onAudit={handleDeepAudit} onViewReport={handleViewReport} auditingId={auditingId} />}
            {top3[0] && <PodiumCard rank={1} team={top3[0]} onAudit={handleDeepAudit} onViewReport={handleViewReport} auditingId={auditingId} />}
            {top3[2] && <PodiumCard rank={3} team={top3[2]} onAudit={handleDeepAudit} onViewReport={handleViewReport} auditingId={auditingId} />}
          </div>
          <div className="bg-zinc-950/50 border border-white/5 rounded-[1.5rem] md:rounded-[2.5rem] overflow-x-auto shadow-2xl relative z-10">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead className="bg-white/[0.02] text-white/20 uppercase text-[9px] font-black tracking-[0.3em] border-b border-white/5">
                <tr>
                  <th className="px-6 py-5">Rank</th>
                  <th className="px-6 py-5">Team</th>
                  <th className="px-6 py-5">Pulse</th>
                  <th className="px-6 py-5">Score</th>
                  <th className="px-6 py-5 text-right">Protocol</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {runnersUp.map((team, i) => <RunnerUpRow key={team.id} team={team} rank={i+4} onAudit={handleDeepAudit} onViewReport={handleViewReport} auditingId={auditingId} />)}
              </tbody>
            </table>
          </div>
        </div>
        <aside className="w-full lg:w-[350px] bg-[#0e0e11] border-t lg:border-t-0 lg:border-l border-white/5 flex flex-col p-6 md:p-8 z-20 overflow-hidden max-h-[50vh] lg:max-h-full">
          <header className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-secondary/10 rounded-2xl text-secondary"><Activity size={18} /></div>
            <div><h4 className="text-xs font-black uppercase tracking-[0.3em]">Engineering_Pulse</h4><span className="text-[9px] text-white/20 font-bold uppercase tracking-widest">Real-time Stream</span></div>
          </header>
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
            <AnimatePresence>{telemetry.map((log) => <TelemetryCard key={log.id} log={log} />)}</AnimatePresence>
            {telemetry.length === 0 && <div className="h-full flex items-center justify-center"><p className="text-[10px] text-white/20 font-black uppercase tracking-widest">Awaiting uplink...</p></div>}
          </div>
        </aside>
      </main>

      <footer className="h-12 bg-[#0A0A0B] border-t border-white/5 flex items-center px-6 md:px-12 justify-between z-50 shrink-0">
        <div className="flex items-center gap-6"><span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Nodes: <span className="text-secondary font-mono ml-2">{teams.length}</span></span><span className="hidden sm:inline text-[10px] font-black text-white/20 uppercase tracking-widest">Sync: <span className="text-emerald-400 font-mono ml-2">OPTIMAL</span></span></div>
        <span className="text-[10px] font-mono text-white/40 uppercase">UTC_{new Date().toISOString().slice(11, 19)}</span>
      </footer>

      <TeamDetailsModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setSelectedTeam(null); }} team={selectedTeam} members={selectedTeam ? members.filter(m => m.team_id === selectedTeam.id) : []} />
      <AuditReportModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} team={selectedReportTeam} results={selectedReportResults} milestones={selectedReportMilestones} />
    </div>
  );
}

const PodiumCard = ({ rank, team, onAudit, onViewReport, auditingId }: { rank: 1 | 2 | 3, team: any, onAudit: any, onViewReport: any, auditingId: any }) => {
  const rankStyles: Record<number, any> = {
    1: { wrapper: "md:w-[400px] order-1 md:order-2", card: "h-[200px] md:h-[360px] from-amber-400/20 border-amber-400/50 rounded-t-[2.5rem]", icon: Trophy, iconBg: "bg-amber-400/20 border-amber-400/30 text-amber-400", title: "text-2xl md:text-4xl", score: "text-amber-400", rankNum: "text-7xl md:text-9xl text-amber-400/10", button: "flex-[3] bg-amber-400 text-black hover:bg-amber-300", eyeButton: "flex-1 bg-amber-400/20 text-amber-400 border-amber-400/20 hover:bg-amber-400/30" },
    2: { wrapper: "md:w-72 order-2 md:order-1", card: "h-[150px] md:h-[240px] from-white/10 border-white/20", icon: null, iconBg: "", title: "text-xl md:text-2xl", score: "text-white/40", rankNum: "text-5xl md:text-7xl text-white/10", button: "bg-white/10 hover:bg-white/20", eyeButton: "bg-white/10 hover:bg-white/20" },
    3: { wrapper: "md:w-72 order-3", card: "h-[120px] md:h-[180px] from-orange-700/20 border-orange-700/30", icon: null, iconBg: "", title: "text-xl md:text-2xl", score: "text-orange-700/60", rankNum: "text-4xl md:text-6xl text-orange-700/10", button: "text-[9px] bg-white/5 hover:bg-white/10", eyeButton: "text-[9px] bg-white/5 hover:bg-white/10" }
  };
  const styles = rankStyles[rank];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: rank * 0.1 }} className={`flex flex-col items-center gap-4 w-full ${styles.wrapper}`}>
      <div className="text-center">
        {styles.icon && <div className={`flex justify-center mb-2 p-2 rounded-full border ${styles.iconBg}`}><styles.icon size={24} /></div>}
        <h3 className={`font-black text-white uppercase tracking-tighter truncate max-w-[300px] ${styles.title}`}>{team.name}</h3>
        <p className={`font-black text-xs uppercase tracking-[0.2em] mt-1 ${styles.score}`}>{rank === 1 ? `Score: ${team.total_score || "--"}` : `Pulse: ${team.ai_progress_score}%`}</p>
      </div>
      <div className={`w-full bg-gradient-to-b backdrop-blur-md rounded-t-3xl flex flex-col items-center pt-4 relative group overflow-hidden ${styles.card}`}>
        <span className={`font-black italic ${styles.rankNum}`}>{String(rank).padStart(2, '0')}</span>
        <div className="mt-auto pb-6 w-full px-6 flex flex-col items-center gap-3">
          <div className={`flex gap-3 w-full`}>
            <button onClick={() => onViewReport(team)} className={`p-3 rounded-xl transition-all border border-white/10 ${styles.eyeButton}`}><Eye size={16} /></button>
            <button onClick={() => onAudit(team)} disabled={auditingId === team.id} className={`py-3 rounded-xl transition-all border border-white/10 text-xs font-black uppercase flex items-center justify-center gap-2 ${styles.button}`}>
              {auditingId === team.id ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />} {rank === 1 ? 'Run AI Audit' : 'Audit'}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const RunnerUpRow = ({ team, rank, onAudit, onViewReport, auditingId }: any) => {
    return (
        <tr className="transition-all hover:bg-white/[0.01] group">
            <td className="px-6 md:px-10 py-6"><span className="text-sm font-black text-white/20 italic">#{String(rank).padStart(2, '0')}</span></td>
            <td className="px-6 md:px-10 py-6">
                <div className="text-sm font-sans font-black uppercase tracking-tight group-hover:text-secondary transition-colors">{team.name}</div>
                <div className="text-[9px] text-white/10 mt-1 uppercase">Node_{team.readable_id}</div>
            </td>
            <td className="px-6 md:px-10 py-6">
                <div className="flex items-center gap-4 w-40">
                    <div className="flex-1 bg-white/5 h-1 rounded-full overflow-hidden"><div className="bg-secondary h-full" style={{ width: `${team.ai_progress_score}%` }} /></div>
                    <span className="text-[10px] font-black text-secondary/70">{team.ai_progress_score}%</span>
                </div>
            </td>
            <td className="px-6 md:px-10 py-6"><div className="text-xl font-black text-white italic">{team.total_score || '--'}</div></td>
            <td className="px-6 md:px-10 py-6 text-right">
                <div className="flex justify-end gap-2">
                    <button onClick={() => onViewReport(team)} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5"><Eye size={16} /></button>
                    <button onClick={() => onAudit(team)} disabled={auditingId === team.id} className="px-4 py-2 bg-white/5 hover:bg-secondary/20 hover:text-secondary rounded-xl border border-white/5 text-[9px] font-black uppercase">
                        {auditingId === team.id ? <Loader2 size={12} className="animate-spin" /> : "Audit"}
                    </button>
                </div>
            </td>
        </tr>
    );
};

const TelemetryCard = ({ log }: any) => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="p-5 border-l-2 border-secondary/30 bg-secondary/[0.03] rounded-r-2xl">
        <p className="text-[11px] font-black text-white uppercase tracking-wider mb-2">{log.hf_teams?.name || "System"}</p>
        <p className="text-xs text-white/50 font-medium italic">&quot;{log.details}&quot;</p>
        <div className="flex items-center gap-2 mt-4 text-[9px] text-white/20 font-black uppercase"><Clock size={10} /> {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
    </motion.div>
);
