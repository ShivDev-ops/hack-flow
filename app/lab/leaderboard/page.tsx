"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { 
  Trophy, 
  Loader2, 
  Zap, 
  MessageSquare,
  BarChart3,
  Users,
  Star,
  Eye,
  Activity,
  Clock,
  Terminal,
  ShieldCheck
} from "lucide-react";
import { getLabSession } from "@/app/actions/lab-auth";
import { AuditReportModal } from "@/components/dashboard/audit-report-modal";
import { TeamDetailsModal } from "@/components/dashboard/team-details-modal";
import { motion, AnimatePresence } from "framer-motion";

interface LeaderboardTeam {
  id: string;
  name: string;
  readable_id: string;
  ai_progress_score: number;
  ai_status_summary?: string;
  showcase_audit?: boolean;
  total_score?: number;
  ai_justification?: string;
  alignment_score?: number;
  execution_score?: number;
  innovation_score?: number;
  technical_score?: number;
}

export default function ParticipantLeaderboardPage() {
  const [teams, setTeams] = useState<LeaderboardTeam[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [myTeamId, setTeamId] = useState<string | null>(null);
  const [myTeamData, setMyTeamData] = useState<any | null>(null);
  const [telemetry, setTelemetry] = useState<any[]>([]);
  
  const [selectedTeam, setSelectedTeam] = useState<any | null>(null);
  const [selectedResults, setSelectedResults] = useState<any | null>(null);
  const [selectedMilestones, setSelectedMilestones] = useState<any[]>([]);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isReportLoading, setIsReportLoading] = useState(false);

  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);

  const supabase = createClient();

  const handleViewTeam = (team: any) => {
    setSelectedTeam(team);
    setIsTeamModalOpen(true);
  };

  const handleViewReport = async (team: any) => {
    setIsReportLoading(true);
    setSelectedTeam(team);
    
    // Construct results object from team data since it's already mapped
    const results = {
      total_score: team.total_score,
      ai_justification: team.ai_justification,
      alignment_score: team.alignment_score,
      execution_score: team.execution_score,
      innovation_score: team.innovation_score,
      technical_score: team.technical_score
    };
    setSelectedResults(results);

    try {
        const { data: dna } = await supabase
          .from('hf_project_dna')
          .select('*')
          .eq('team_id', team.id)
          .order('created_at', { ascending: true });
        
        setSelectedMilestones(dna || []);
        setIsReportOpen(true);
    } catch (err) {
        console.error("REPORT_FETCH_ERROR:", err);
    } finally {
        setIsReportLoading(false);
    }
  };

  const fetchData = useCallback(async () => {
    try {
      const session = await getLabSession();
      if (!session?.teamId) return;
      setTeamId(session.teamId);

      const { data: teamData } = await supabase
        .from('hf_teams')
        .select('*')
        .eq('id', session.teamId)
        .single();

      if (!teamData) return;
      setMyTeamData(teamData);
      const eventId = teamData.event_id;

      const [teamsRes, resultsRes, telemetryRes, membersRes] = await Promise.all([
        supabase.from('hf_teams').select('*').eq('event_id', eventId).order('ai_progress_score', { ascending: false }),
        supabase.from('hf_judging_results').select('*').eq('event_id', eventId),
        supabase.from('hf_telemetry_logs').select('*, hf_teams(name)').eq('team_id', session.teamId).order('created_at', { ascending: false }).limit(15),
        supabase.from('hf_team_members').select('*').eq('team_id', session.teamId)
      ]);

      setMembers(membersRes.data || []);

      const resultsMap: Record<string, any> = {};
      resultsRes.data?.forEach((r: any) => { resultsMap[r.team_id] = r; });

      const mappedTeams: LeaderboardTeam[] = (teamsRes.data || []).map((t: any) => ({
        id: t.id,
        name: t.name,
        readable_id: t.readable_id,
        ai_progress_score: t.ai_progress_score || 0,
        ai_status_summary: t.ai_status_summary,
        showcase_audit: t.showcase_audit,
        total_score: resultsMap[t.id]?.total_score,
        ai_justification: resultsMap[t.id]?.ai_justification,
        alignment_score: resultsMap[t.id]?.alignment_score,
        execution_score: resultsMap[t.id]?.execution_score,
        innovation_score: resultsMap[t.id]?.innovation_score,
        technical_score: resultsMap[t.id]?.technical_score
      }));

      mappedTeams.sort((a, b) => {
        const scoreA = a.total_score || 0;
        const scoreB = b.total_score || 0;
        if (scoreB !== scoreA) return scoreB - scoreA;
        return b.ai_progress_score - a.ai_progress_score;
      });

      setTeams(mappedTeams);
      setTelemetry(telemetryRes.data || []);
    } catch (error) {
      console.error("DATA_FETCH_ERROR:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const top3 = useMemo(() => teams.slice(0, 3), [teams]);
  const listTeams = useMemo(() => teams.slice(3), [teams]);
  const showcasedTeams = useMemo(() => teams.filter(t => t.showcase_audit && t.total_score), [teams]);

  const [auditingId, setAuditingId] = useState<string | null>(null);
  const handleDeepAudit = async (team: any) => {
    if (!myTeamData) return;
    setAuditingId(team.id);
    try {
        const { triggerTeamReAudit } = await import("@/app/actions/lab-config");
        const res = await triggerTeamReAudit(team.id);
        if (res.success) {
            fetchData();
        } else {
            alert(`Audit Failed: ${res.error}`);
        }
    } catch (err: any) {
        alert(`Audit Error: ${err.message}`);
    } finally {
        setAuditingId(null);
    }
  };

  if (loading && teams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="animate-spin text-secondary" size={40} />
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Syncing_Global_Standings</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-[#0A0A0B] text-white font-sans overflow-hidden">
      
      {/* HEADER & SHOWCASE GALLERY */}
      <header className="p-8 md:p-12 flex flex-col gap-12 border-b border-white/5 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-secondary/10 rounded-full blur-[100px]" />
        </div>
        
        <div className="flex justify-between items-end relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-secondary/10 rounded-2xl text-secondary border border-secondary/20 shadow-[0_0_20px_rgba(78,222,163,0.1)]">
              <Trophy size={24} />
            </div>
            <div>
                <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">Global_Leaderboard</h1>
                <p className="text-[10px] text-white/30 uppercase tracking-[0.4em] font-label-caps mt-2">Real-time implementation standings & AI ranking</p>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-10">
            <div className="text-right">
                <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Avg_Implementation</p>
                <p className="text-2xl font-black text-secondary">
                    {teams.length ? Math.round(teams.reduce((acc, t) => acc + t.ai_progress_score, 0) / teams.length) : 0}%
                </p>
            </div>
            <div className="h-10 w-px bg-white/10" />
            <div className="bg-white/[0.03] border border-white/10 px-6 py-3 rounded-2xl flex items-center gap-4">
                <div className="w-2 h-2 bg-secondary rounded-full animate-pulse shadow-[0_0_10px_#4edea3]" />
                <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">Neural_Sync_Active</span>
            </div>
          </div>
        </div>

        {/* SHOWCASE GALLERY (Replacing Broadcast Node) */}
        {showcasedTeams.length > 0 && (
           <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-3">
                 <ShieldCheck size={14} className="text-secondary" />
                 <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Evidence_Showcase // Verified Technical Audits</h4>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                {showcasedTeams.map(team => (
                  <motion.div 
                    key={team.id}
                    whileHover={{ y: -4 }}
                    className="flex-shrink-0 w-72 bg-white/[0.02] border border-white/10 rounded-2xl p-5 space-y-4 hover:border-secondary/30 transition-all cursor-pointer group"
                  >
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <p className="text-[11px] font-black text-white uppercase tracking-tight truncate w-40">{team.name}</p>
                            <p className="text-[9px] text-secondary font-bold uppercase tracking-tighter">Technical_Score: {team.total_score}</p>
                        </div>
                        <div className="flex gap-1.5">
                            <button onClick={() => handleViewReport(team)} className="p-2 bg-white/5 rounded-lg hover:bg-secondary/20 transition-colors group/eye" title="View Audit Report">
                                <Eye size={12} className="group-hover/eye:text-secondary transition-colors" />
                            </button>
                        </div>
                    </div>
                    <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                        <p className="text-[10px] text-white/40 leading-relaxed italic line-clamp-2">
                           &quot;{team.ai_status_summary || "Scanning repository logic for optimized implementation patterns..."}&quot;
                        </p>
                    </div>
                  </motion.div>
                ))}
              </div>
           </div>
        )}
      </header>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* LEFT SIDE: PODIUM & LIST (70%) */}
        <div className="flex-1 p-4 md:p-12 overflow-y-auto custom-scrollbar">
            
            {/* HERO PODIUM */}
            <div className="flex flex-col md:flex-row items-center md:items-end justify-center gap-8 mb-20 min-h-[400px]">
                
                {/* RANK 02 */}
                {top3[1] && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-col items-center gap-6 w-full max-w-[256px]">
                        <div className="text-center">
                            <h3 className="text-xl font-black text-white uppercase tracking-tighter truncate w-56">{top3[1].name}</h3>
                            <p className="text-white/40 font-mono text-[10px] uppercase mt-1">Pulse: {top3[1].ai_progress_score}%</p>
                        </div>
                        <div className={`w-full h-[200px] bg-gradient-to-b from-white/10 to-transparent border-t-2 border-white/20 backdrop-blur-md rounded-t-3xl flex flex-col items-center pt-6 relative group overflow-hidden ${top3[1].id === myTeamId ? 'ring-2 ring-secondary/40' : ''}`}>
                             {top3[1].id === myTeamId && <div className="absolute top-2 right-2"><Star size={12} className="text-secondary fill-secondary" /></div>}
                             <span className="text-6xl font-black text-white/5 italic">02</span>
                             <div className="mt-auto mb-8 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                <button onClick={() => handleViewReport(top3[1])} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10" title="View Report"><Eye size={18} /></button>
                                {top3[1].id === myTeamId && <button onClick={() => handleViewTeam(myTeamData)} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10" title="View Team Details"><Users size={18} /></button>}
                             </div>
                        </div>
                    </motion.div>
                )}

                {/* RANK 01 */}
                {top3[0] && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-6 w-full max-w-[320px] order-first md:order-none">
                        <div className="text-center">
                            <div className="flex justify-center mb-2">
                                <div className="p-2 bg-amber-400/20 rounded-full border border-amber-400/30 text-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.2)]">
                                    <Trophy size={24} />
                                </div>
                            </div>
                            <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter truncate w-72">{top3[0].name}</h3>
                            <p className="text-amber-400 font-black text-xs uppercase tracking-[0.2em] mt-1">Global Standing: {top3[0].total_score || "--"}</p>
                        </div>
                        <div className={`w-full h-[300px] bg-gradient-to-b from-amber-400/20 to-transparent border-t-4 border-amber-400/50 backdrop-blur-xl rounded-t-[2.5rem] flex flex-col items-center pt-10 relative group overflow-hidden shadow-[0_-20px_100px_rgba(251,191,36,0.05)] ${top3[0].id === myTeamId ? 'ring-2 ring-secondary/40' : ''}`}>
                            {top3[0].id === myTeamId && <div className="absolute top-4 right-4"><Star size={16} className="text-secondary fill-secondary" /></div>}
                            <span className="text-8xl font-black text-amber-400/5 italic leading-none">01</span>
                            <div className="mt-auto mb-12 flex flex-col gap-3 opacity-0 group-hover:opacity-100 transition-all items-center">
                                <button onClick={() => handleViewReport(top3[0])} className="px-8 py-3 bg-amber-400 text-black rounded-xl font-black uppercase text-[10px] tracking-widest transition-all hover:bg-amber-300">
                                    View Audit Report
                                </button>
                                {top3[0].id === myTeamId && <button onClick={() => handleViewTeam(myTeamData)} className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-black uppercase text-[8px] tracking-widest border border-white/10">Team Details</button>}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* RANK 03 */}
                {top3[2] && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex flex-col items-center gap-6 w-full max-w-[256px]">
                        <div className="text-center">
                            <h3 className="text-xl font-black text-white uppercase tracking-tighter truncate w-56">{top3[2].name}</h3>
                            <p className="text-white/40 font-mono text-[10px] uppercase mt-1">Pulse: {top3[2].ai_progress_score}%</p>
                        </div>
                        <div className={`w-full h-[150px] bg-gradient-to-b from-orange-700/20 to-transparent border-t-2 border-orange-700/30 backdrop-blur-md rounded-t-3xl flex flex-col items-center pt-4 relative group overflow-hidden ${top3[2].id === myTeamId ? 'ring-2 ring-secondary/40' : ''}`}>
                             {top3[2].id === myTeamId && <div className="absolute top-2 right-2"><Star size={12} className="text-secondary fill-secondary" /></div>}
                             <span className="text-5xl font-black text-orange-700/5 italic">03</span>
                             <div className="mt-auto mb-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                <button onClick={() => handleViewReport(top3[2])} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10" title="View Report"><Eye size={16} /></button>
                                {top3[2].id === myTeamId && <button onClick={() => handleViewTeam(myTeamData)} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10" title="View Team Details"><Users size={16} /></button>}
                             </div>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* LIST SECTION */}
            <div className="bg-zinc-950/50 border border-white/5 rounded-[2.5rem] overflow-x-auto shadow-2xl custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[800px]">
                <thead className="bg-white/[0.02] text-white/20 uppercase text-[9px] font-black tracking-[0.3em] border-b border-white/5">
                    <tr>
                    <th className="px-10 py-6">Rank</th>
                    <th className="px-10 py-6">Team Designation</th>
                    <th className="px-10 py-6">Implementation</th>
                    <th className="px-10 py-6">AI Score</th>
                    <th className="px-10 py-6 text-right">Evidence</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono">
                    {listTeams.map((team, index) => {
                    const isMyTeam = team.id === myTeamId;
                    const isAudited = !!team.total_score;
                    return (
                        <tr key={team.id} className={`transition-all group ${isMyTeam ? 'bg-secondary/[0.03]' : 'hover:bg-white/[0.01]'}`}>
                        <td className="px-10 py-6">
                            <span className={`text-sm font-black italic ${isMyTeam ? 'text-secondary' : 'text-white/20'}`}>
                                #{String(index + 4).padStart(2, '0')}
                            </span>
                        </td>
                        <td className="px-10 py-6">
                            <div className="flex items-center gap-3">
                                <div className={`text-sm font-sans font-black uppercase tracking-tight transition-colors ${isMyTeam ? 'text-secondary' : 'text-white group-hover:text-secondary'}`}>
                                    {team.name}
                                </div>
                                {isMyTeam && <ShieldCheck size={12} className="text-secondary" />}
                                {team.showcase_audit && <Zap size={10} className="text-amber-400 fill-amber-400" title="Showcasing Audit" />}
                            </div>
                            <div className="text-[10px] text-white/40 mt-2 font-medium italic line-clamp-1 max-w-[300px]">
                                {team.ai_status_summary || "Establishing technical baseline..."}
                            </div>
                        </td>
                        <td className="px-10 py-6 min-w-[200px]">
                            <div className="flex items-center gap-4">
                                <div className="flex-1 bg-white/5 h-1 rounded-full overflow-hidden">
                                    <div className="bg-secondary h-full transition-all duration-1000" style={{ width: `${team.ai_progress_score}%` }} />
                                </div>
                                <span className="text-[10px] font-black text-secondary/70">{team.ai_progress_score}%</span>
                            </div>
                        </td>
                        <td className="px-10 py-6">
                            {team.total_score ? (
                                <div className="text-xl font-black text-white italic">{team.total_score}</div>
                            ) : (
                                <span className="text-[9px] text-white/10 uppercase font-bold italic">Processing...</span>
                            )}
                        </td>
                        <td className="px-10 py-6 text-right">
                            <div className="flex justify-end gap-2">
                                {isMyTeam && (
                                    <button 
                                        onClick={() => handleDeepAudit(team)}
                                        disabled={auditingId === team.id}
                                        className="p-3 bg-secondary/10 hover:bg-secondary text-secondary hover:text-black rounded-xl border border-secondary/20 transition-all"
                                        title="Run AI Audit"
                                    >
                                        {auditingId === team.id ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} fill="currentColor" />}
                                    </button>
                                )}
                                <button
                                    onClick={() => handleViewReport(team)}
                                    disabled={!isAudited || isReportLoading}
                                    className={`p-3 rounded-xl transition-all ${isAudited ? 'bg-white/5 hover:bg-white/10 text-white border border-white/5' : 'opacity-10 cursor-not-allowed'}`}
                                    title="View Audit Report"
                                >
                                    {isReportLoading && selectedTeam?.id === team.id ? <Loader2 size={16} className="animate-spin" /> : <Eye size={18} />}
                                </button>
                                {isMyTeam && (
                                    <button
                                        onClick={() => handleViewTeam(myTeamData)}
                                        className="p-3 bg-white/5 hover:bg-white/10 text-white border border-white/5 rounded-xl transition-all"
                                        title="View Team Personnel"
                                    >
                                        <Users size={18} />
                                    </button>
                                )}
                            </div>
                        </td>
                        </tr>
                    );
                    })}
                </tbody>
                </table>
                
                {teams.length === 0 && (
                    <div className="py-32 text-center">
                        <Terminal size={48} className="mx-auto text-white/5 mb-6" />
                        <p className="text-[10px] text-white/20 uppercase font-black tracking-[0.5em]">Synchronizing_Event_Network</p>
                    </div>
                )}
            </div>

        </div>

        {/* RIGHT SIDE: TEAM PULSE (30%) */}
        <aside className="w-full lg:w-80 bg-[#0e0e11] border-l border-white/5 flex flex-col p-8 overflow-hidden z-20">
             <header className="flex items-center gap-4 mb-8">
                <div className="p-2.5 bg-secondary/10 rounded-xl text-secondary">
                    <Activity size={18} />
                </div>
                <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Team_Pulse</h4>
                    <span className="text-[8px] text-white/20 font-bold uppercase tracking-widest">Node Activity</span>
                </div>
            </header>

            <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar">
                <AnimatePresence mode="popLayout">
                    {telemetry.map((log, i) => (
                        <motion.div 
                            key={log.id} 
                            initial={{ opacity: 0, x: 10 }} 
                            animate={{ opacity: 1, x: 0 }} 
                            className="p-4 border-l-2 border-secondary/20 bg-white/[0.01] rounded-r-xl"
                        >
                            <p className="text-[10px] text-white/40 leading-relaxed font-medium italic">&quot;{log.details}&quot;</p>
                            <div className="flex items-center gap-2 mt-3 text-[8px] font-black text-white/10 uppercase tracking-widest">
                                <Clock size={8} />
                                <span>{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                
                {telemetry.length === 0 && (
                    <div className="py-20 text-center border border-dashed border-white/5 rounded-2xl">
                        <p className="text-[8px] text-white/20 uppercase font-black tracking-widest">Awaiting local uplink...</p>
                    </div>
                )}
            </div>

            <div className="mt-8 pt-6 border-t border-white/5 shrink-0">
                <div className="p-4 bg-secondary/5 rounded-xl border border-secondary/10">
                    <p className="text-[8px] text-secondary/60 font-black uppercase tracking-tighter text-center italic">Continuous Integration Active</p>
                </div>
            </div>
        </aside>

      </div>

      <TeamDetailsModal 
        isOpen={isTeamModalOpen} 
        onClose={() => setIsTeamModalOpen(false)} 
        team={selectedTeam} 
        members={members} 
      />

      <AuditReportModal 
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        team={selectedTeam}
        results={selectedResults}
        milestones={selectedMilestones}
      />
    </div>
  );
}
