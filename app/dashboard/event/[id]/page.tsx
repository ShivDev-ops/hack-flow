"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { 
  Search, 
  Terminal, 
  Bell, 
  LayoutDashboard, 
  Users, 
  Settings, 
  ExternalLink, 
  BarChart2, 
  CheckCircle,
  Trophy,
  Loader2,
  Save,
  Clock,
  Zap,
  Activity,
  ArrowRight
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { Event, Team, TeamMember, Task } from "@/types/common";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";

interface JudgingResult {
  team_id: string;
  alignment_score: number;
  execution_score: number;
  innovation_score: number;
  technical_score: number;
  total_score: number;
  ai_justification: string;
}

export default function JudgingPortalPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { data: session } = useSession();

  const [viewMode, setViewMode] = useState<"SCORING" | "LEADERBOARD">("SCORING");
  const [event, setEvent] = useState<Event | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Scoring State
  const [scores, setScores] = useState({
    innovation: 0,
    technicality: 0,
    pitch: 0
  });
  const [notes, setNotes] = useState("");
  const [judgingResults, setJudgingResults] = useState<Record<string, JudgingResult>>({});
  const [teamTasks, setTeamTasks] = useState<Record<string, Task[]>>({});

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    try {
      const [eventRes, teamsRes, resultsRes, tasksRes] = await Promise.all([
        supabase.from('hf_events').select('*').eq('id', id).single(),
        supabase.from('hf_teams').select('*').eq('event_id', id).order('name', { ascending: true }),
        supabase.from('hf_judging_results').select('*').eq('event_id', id),
        supabase.from('hf_tasks').select('*').eq('event_id', id)
      ]);

      if (eventRes.error) throw eventRes.error;
      setEvent(eventRes.data as Event);
      setTeams(teamsRes.data || []);

      const resultsMap: Record<string, JudgingResult> = {};
      resultsRes.data?.forEach((r: any) => {
        resultsMap[r.team_id] = r;
      });
      setJudgingResults(resultsMap);

      const tasksMap: Record<string, Task[]> = {};
      tasksRes.data?.forEach((t: any) => {
        if (!tasksMap[t.team_id]) tasksMap[t.team_id] = [];
        tasksMap[t.team_id].push(t);
      });
      setTeamTasks(tasksMap);

      if (teamsRes.data?.[0] && !selectedTeamId) {
        setSelectedTeamId(teamsRes.data[0].id);
      }
    } catch (error) {
      console.error("DATA_FETCH_ERROR:", error);
    } finally {
      setLoading(false);
    }
  }, [id, supabase, selectedTeamId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const selectedTeam = useMemo(() => teams.find(t => t.id === selectedTeamId), [teams, selectedTeamId]);

  useEffect(() => {
    if (selectedTeamId && judgingResults[selectedTeamId]) {
      const r = judgingResults[selectedTeamId];
      setScores({
        innovation: r.innovation_score,
        technicality: r.technical_score,
        pitch: r.alignment_score
      });
      setNotes(r.ai_justification || "");
    } else {
      setScores({ innovation: 0, technicality: 0, pitch: 0 });
      setNotes("");
    }
  }, [selectedTeamId, judgingResults]);

  const handleSaveScore = async () => {
    if (!selectedTeamId) return;
    setSaving(true);
    const total = scores.innovation + scores.technicality + scores.pitch;
    
    const payload = {
        team_id: selectedTeamId,
        event_id: id,
        innovation_score: scores.innovation,
        technical_score: scores.technicality,
        alignment_score: scores.pitch,
        execution_score: scores.technicality, // Mapping for now
        total_score: total,
        ai_justification: notes
    };

    const { error } = await supabase.from('hf_judging_results').upsert(payload, { onConflict: 'team_id' });
    
    if (error) {
        alert("SAVE_ERROR: " + error.message);
    } else {
        await fetchData();
        alert("SCORE_COMMITTED: Registry updated.");
    }
    setSaving(false);
  };

  const filteredTeams = teams.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const leaderboardTeams = useMemo(() => {
    return [...teams].sort((a, b) => {
        const scoreA = judgingResults[a.id]?.total_score || 0;
        const scoreB = judgingResults[b.id]?.total_score || 0;
        return scoreB - scoreA;
    });
  }, [teams, judgingResults]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#131314]">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  return (
    <div className="bg-[#131314] text-[#e5e2e3] font-sans selection:bg-primary/30 min-h-screen flex flex-col overflow-hidden">
      {/* TopAppBar */}
      <header className="fixed top-0 left-64 right-0 z-50 bg-[#0A0A0B]/80 backdrop-blur-xl border-b border-white/10 flex justify-between items-center px-6 h-16 shadow-2xl">
        <div className="flex items-center gap-6">
          <span className="text-xl font-black tracking-tighter text-white uppercase">{event?.name || "HACK-FLOW"}</span>
          <div className="h-6 w-px bg-white/10 hidden md:block"></div>
          <span className="font-mono text-[10px] text-primary uppercase tracking-[0.2em] hidden md:block italic">Evaluation_Mode: Global_Sintra_2026</span>
        </div>
        
        <div className="flex bg-[#0e0e0f] p-1 rounded-xl border border-white/5">
          <button 
            onClick={() => setViewMode("SCORING")}
            className={`px-6 py-1.5 font-bold text-[10px] uppercase tracking-widest rounded-lg transition-all ${viewMode === 'SCORING' ? 'bg-primary text-black' : 'text-white/40 hover:text-white'}`}
          >
            SCORING
          </button>
          <button 
            onClick={() => setViewMode("LEADERBOARD")}
            className={`px-6 py-1.5 font-bold text-[10px] uppercase tracking-widest rounded-lg transition-all ${viewMode === 'LEADERBOARD' ? 'bg-primary text-black' : 'text-white/40 hover:text-white'}`}
          >
            LEADERBOARD
          </button>
        </div>

        <div className="flex items-center gap-6">
          <button className="text-white/40 hover:text-primary transition-colors cursor-pointer"><Terminal size={18}/></button>
          <button className="text-white/40 hover:text-primary transition-colors cursor-pointer relative">
            <Bell size={18}/>
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-[#0A0A0B]" />
          </button>
          <div className="flex items-center gap-4 border-l border-white/10 pl-6">
            <div className="h-8 w-8 rounded-full border border-primary/50 overflow-hidden bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">SA</div>
            <button className="bg-primary text-black px-6 py-2.5 font-bold text-[10px] uppercase tracking-widest rounded-xl shadow-lg hover:shadow-primary/20 active:opacity-80 transition-all">
                Submit Final Scores
            </button>
          </div>
        </div>
      </header>

      {/* Main Canvas */}
      <main className="flex-1 mt-16 flex overflow-hidden">
        {viewMode === "SCORING" ? (
          <>
            {/* Left Pane: Team List */}
            <section className="w-[320px] border-r border-white/5 flex flex-col bg-[#0e0e0f]/50">
              <div className="p-6 border-b border-white/5">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={14} />
                  <input 
                    className="w-full bg-[#0A0A0B] border border-white/10 focus:border-primary outline-none text-white font-mono text-[11px] pl-10 h-11 rounded-xl uppercase" 
                    placeholder="SEARCH TEAMS..." 
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                {filteredTeams.map((team) => (
                  <div 
                    key={team.id}
                    onClick={() => setSelectedTeamId(team.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer group relative overflow-hidden ${selectedTeamId === team.id ? 'bg-[#201f20] border-primary/40 shadow-2xl' : 'bg-transparent border-white/5 hover:border-white/20'}`}
                  >
                    {selectedTeamId === team.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>}
                    <div className="flex justify-between items-start mb-2">
                      <span className={`font-mono text-[9px] tracking-widest uppercase ${selectedTeamId === team.id ? 'text-primary' : 'text-white/20'}`}>ID_{team.readable_id || team.id.slice(0,5)}</span>
                      <div className="flex items-center gap-1.5">
                        {judgingResults[team.id] ? (
                           <>
                            <CheckCircle size={10} className="text-amber-500" />
                            <span className="font-bold text-[9px] text-amber-500 uppercase">Scored</span>
                           </>
                        ) : (
                           <>
                            <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
                            <span className="font-bold text-[9px] text-secondary uppercase tracking-widest">Pending</span>
                           </>
                        )}
                      </div>
                    </div>
                    <h4 className={`font-black text-sm uppercase italic transition-colors ${selectedTeamId === team.id ? 'text-white' : 'text-white/60 group-hover:text-white'}`}>{team.name}</h4>
                    <p className="text-white/20 text-[10px] line-clamp-1 uppercase tracking-tight mt-1">{team.ai_status_summary || "Implementation in progress..."}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Right Pane: Detail & Scoring */}
            <section className="flex-1 flex flex-col overflow-y-auto custom-scrollbar bg-[#131314] pb-16">
              {selectedTeam ? (
                <>
                  {/* Detail Header */}
                  <div className="p-10 border-b border-white/5 bg-gradient-to-b from-primary/5 to-transparent">
                    <div className="flex justify-between items-end">
                      <div>
                        <div className="flex items-center gap-4 mb-3">
                          <h2 className="text-5xl font-black text-white italic tracking-tighter uppercase">{selectedTeam.name}</h2>
                          <span className="bg-primary/20 text-primary text-[10px] px-3 py-1 rounded-lg font-mono font-bold tracking-widest border border-primary/30 uppercase">Node_Active</span>
                        </div>
                        <p className="text-white/40 text-sm max-w-2xl leading-relaxed font-medium uppercase tracking-tight italic">
                          {selectedTeam.ai_status_summary || "Full-scale decentralized architecture implementation focusing on performance and security metrics."}
                        </p>
                      </div>
                      <button className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-6 py-4 rounded-2xl border border-white/10 transition-all font-bold text-[10px] uppercase tracking-[0.2em]">
                        <ExternalLink size={14} /> VIEW DEPLOYED APP
                      </button>
                    </div>
                  </div>

                  <div className="p-10 grid grid-cols-12 gap-8">
                    {/* Health Snapshot */}
                    <div className="col-span-12 bg-white/[0.02] border border-white/5 p-8 rounded-[2rem] rim-light shadow-2xl">
                      <h3 className="text-[10px] font-black text-white/40 mb-8 flex items-center gap-2 uppercase tracking-[0.4em]">
                        <BarChart2 size={14} className="text-primary" /> PROJECT_HEALTH_TELEMETRY
                      </h3>
                      <div className="grid grid-cols-3 gap-12">
                        <div>
                          <span className="block text-[9px] font-bold text-white/20 mb-2 uppercase tracking-widest">TOTAL COMMITS</span>
                          <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black text-white italic tracking-tighter">{selectedTeam.total_commits || 0}</span>
                            <span className="text-secondary text-[10px] font-mono font-bold">+12%</span>
                          </div>
                        </div>
                        <div>
                          <span className="block text-[9px] font-bold text-white/20 mb-2 uppercase tracking-widest">PROGRESS PULSE</span>
                          <div className="flex flex-col gap-2">
                            <div className="flex items-baseline gap-2">
                              <span className="text-4xl font-black text-white italic tracking-tighter">{selectedTeam.ai_progress_score}%</span>
                              <span className="text-secondary text-[9px] font-bold uppercase tracking-widest">STABLE</span>
                            </div>
                            <div className="h-4 flex items-end gap-1">
                                {[20, 40, 60, 100, 80, 30, 50, 90, 70, 40].map((h, i) => (
                                    <div key={i} className="flex-1 bg-secondary/20 rounded-t-sm" style={{ height: `${h}%` }}></div>
                                ))}
                            </div>
                          </div>
                        </div>
                        <div>
                          <span className="block text-[9px] font-bold text-white/20 mb-2 uppercase tracking-widest">TASK COMPLETION</span>
                          <div className="flex items-center gap-4 h-10">
                            <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-1000" style={{ width: `${selectedTeam.ai_progress_score}%` }}></div>
                            </div>
                            <span className="text-white font-mono text-sm font-bold">{selectedTeam.ai_progress_score}%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Weighted Matrix */}
                    <div className="col-span-8 space-y-8">
                      <div className="bg-white/[0.02] border border-white/5 p-8 rounded-[2rem] space-y-10 shadow-xl">
                        <div className="flex items-center justify-between">
                          <h3 className="text-[10px] font-black text-white uppercase tracking-[0.4em]">WEIGHTED SCORING MATRIX</h3>
                          <span className="text-[9px] font-mono text-white/20 uppercase tracking-widest font-bold italic">Config: 33%_BALANCED_SPLIT</span>
                        </div>
                        
                        <div className="space-y-10">
                          <Slider label="INNOVATION" value={scores.innovation} onChange={(v) => setScores({...scores, innovation: v})} />
                          <Slider label="TECHNICALITY" value={scores.technicality} onChange={(v) => setScores({...scores, technicality: v})} />
                          <Slider label="PITCH & PRESENTATION" value={scores.pitch} onChange={(v) => setScores({...scores, pitch: v})} />
                        </div>
                      </div>

                      <div className="bg-white/[0.02] border border-white/5 p-8 rounded-[2rem] shadow-xl">
                        <label className="text-[10px] font-black text-white/40 block mb-6 uppercase tracking-[0.4em]">Confidential_Evaluator_Logs</label>
                        <textarea 
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          className="w-full h-40 bg-[#0A0A0B]/50 border border-white/5 rounded-2xl font-medium text-sm text-white p-6 focus:border-primary outline-none transition-all custom-scrollbar uppercase tracking-tight" 
                          placeholder="ENTER CONFIDENTIAL FEEDBACK HERE..." 
                        />
                      </div>
                    </div>

                    {/* Total Score Display */}
                    <div className="col-span-4 flex flex-col gap-8">
                      <div className="bg-white/[0.02] border border-white/10 p-12 rounded-[3rem] flex flex-col items-center justify-center text-center aspect-square shadow-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                        <span className="font-mono text-[10px] font-black text-white/20 mb-6 uppercase tracking-[0.3em]">AGGREGATED_SCORE</span>
                        <div className="relative">
                          <span className="text-8xl font-black leading-none text-transparent bg-clip-text bg-gradient-to-br from-primary via-white to-secondary italic tracking-tighter">
                            {(scores.innovation + scores.technicality + scores.pitch).toFixed(1)}
                          </span>
                          <span className="absolute -top-4 -right-10 text-primary/30 font-mono font-black text-xl">/30</span>
                        </div>
                        <div className="mt-12 flex flex-col gap-4 w-full relative z-10">
                          <button 
                            onClick={handleSaveScore}
                            disabled={saving}
                            className="w-full py-5 bg-primary text-black font-black text-[11px] uppercase tracking-[0.2em] rounded-2xl shadow-[0_0_50px_rgba(173,198,255,0.2)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                          >
                            {saving ? <Loader2 className="animate-spin" size={18}/> : <><Save size={18}/> Commit_Score_to_Node</>}
                          </button>
                          <p className="text-[9px] font-mono text-white/20 uppercase font-bold tracking-widest">Uplink: ACTIVE // LOCK_STATUS: AUTO</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center opacity-20 gap-4">
                    <LayoutDashboard size={64} />
                    <p className="text-[10px] font-black uppercase tracking-[0.5em]">Awaiting_Node_Selection</p>
                </div>
              )}
            </section>
          </>
        ) : (
          /* Leaderboard Mode */
          <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar bg-[#131314] p-10 space-y-16">
            <div className="max-w-6xl mx-auto w-full space-y-16">
              {/* Podium */}
              <div className="flex flex-col md:flex-row justify-center items-center md:items-end gap-12 pt-10">
                {/* Silver */}
                {leaderboardTeams[1] && <PodiumItem team={leaderboardTeams[1]} rank={2} score={judgingResults[leaderboardTeams[1].id]?.total_score || 0} />}
                {/* Gold */}
                {leaderboardTeams[0] && <PodiumItem team={leaderboardTeams[0]} rank={1} score={judgingResults[leaderboardTeams[0].id]?.total_score || 0} />}
                {/* Bronze */}
                {leaderboardTeams[2] && <PodiumItem team={leaderboardTeams[2]} rank={3} score={judgingResults[leaderboardTeams[2].id]?.total_score || 0} />}
              </div>

              {/* Rankings Table */}
              <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl">
                <table className="w-full border-collapse">
                  <thead className="bg-white/[0.03] font-mono text-[10px] text-white/20 uppercase tracking-[0.3em] text-left">
                    <tr>
                      <th className="px-10 py-6">Rank</th>
                      <th className="px-10 py-6">Team Entity</th>
                      <th className="px-10 py-6">Mission Status</th>
                      <th className="px-10 py-6">Health Index</th>
                      <th className="px-10 py-6 text-right">Aggregate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-sans">
                    {leaderboardTeams.slice(3).map((team, index) => (
                      <tr key={team.id} className="hover:bg-white/[0.02] transition-colors group cursor-pointer" onClick={() => { setSelectedTeamId(team.id); setViewMode("SCORING"); }}>
                        <td className="px-10 py-6 font-mono text-primary font-bold text-sm tracking-widest italic">#{String(index + 4).padStart(2, '0')}</td>
                        <td className="px-10 py-6">
                            <span className="text-white font-black uppercase italic text-sm tracking-tight group-hover:text-primary transition-colors">{team.name}</span>
                            <div className="text-[9px] text-white/20 mt-1 uppercase font-mono tracking-widest italic">Node_{team.readable_id || "SYS"}</div>
                        </td>
                        <td className="px-10 py-6 text-[10px] text-white/40 uppercase font-bold italic tracking-tight">{team.ai_status_summary || "Standard Protocol"}</td>
                        <td className="px-10 py-6">
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${team.ai_progress_score > 70 ? 'bg-secondary/10 text-secondary border-secondary/20 shadow-[0_0_10px_#4edea333]' : 'bg-white/5 text-white/40 border-white/10'}`}>
                            {team.ai_progress_score > 70 ? 'OPTIMIZED' : 'NOMINAL'}
                          </span>
                        </td>
                        <td className="px-10 py-6 text-right font-black text-white italic text-xl tracking-tighter">
                            {(judgingResults[team.id]?.total_score || 0).toFixed(1)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-64 right-0 border-t border-white/5 bg-[#0A0A0B]/80 backdrop-blur-md flex justify-between items-center px-10 h-10 z-40">
        <div className="flex items-center gap-10">
          <span className="font-mono text-[9px] text-white/20 uppercase font-bold tracking-widest">© 2026 HACK-FLOW // MISSION CONTROL</span>
          <div className="flex items-center gap-3">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse shadow-[0_0_5px_#4edea3]"></span>
            <span className="font-mono text-[9px] text-secondary font-black tracking-widest uppercase">UPTIME_99.99%_STABLE</span>
          </div>
        </div>
        <div className="flex items-center gap-10 font-mono text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">
          <a className="hover:text-primary transition-colors" href="#">API_DOCS</a>
          <a className="hover:text-primary transition-colors" href="#">NETWORK_STATUS</a>
          <span className="text-white/10 italic">HF-KRNL-V4.5</span>
        </div>
      </footer>
    </div>
  );
}

function Slider({ label, value, onChange }: { label: string, value: number, onChange: (v: number) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end">
        <label className="text-[10px] font-black text-white/60 uppercase tracking-widest italic">{label}</label>
        <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-primary italic tracking-tighter">{value.toFixed(1)}</span>
            <span className="text-[10px] text-white/20 font-mono">/10</span>
        </div>
      </div>
      <input 
        className="w-full h-1 bg-white/5 rounded-full appearance-none cursor-pointer accent-primary hover:accent-white transition-all shadow-[inset_0_0_5px_rgba(0,0,0,0.5)]" 
        max="10" min="0" step="0.5" 
        type="range" 
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </div>
  );
}

function PodiumItem({ team, rank, score }: { team: Team, rank: 1 | 2 | 3, score: number }) {
  const isGold = rank === 1;
  const isSilver = rank === 2;
  const isBronze = rank === 3;

  return (
    <div className={`flex flex-col items-center group ${isGold ? 'order-1 md:order-2' : isSilver ? 'order-2 md:order-1' : 'order-3'}`}>
      <div className="relative mb-6">
        {isGold && <div className="absolute -top-12 left-1/2 -translate-x-1/2 text-amber-500 animate-bounce"><Trophy size={48} /></div>}
        <div className={`w-28 h-28 rounded-full border-4 flex items-center justify-center text-4xl font-black italic shadow-2xl transition-all duration-700 group-hover:scale-110 ${isGold ? 'border-amber-400 bg-amber-400/10 text-amber-400' : isSilver ? 'border-slate-400 bg-slate-400/10 text-slate-400' : 'border-orange-800 bg-orange-800/10 text-orange-800'}`}>
            {team.name.charAt(0)}
        </div>
      </div>
      <div className={`w-48 transition-all duration-700 rounded-t-[2.5rem] flex flex-col items-center justify-end p-8 ${isGold ? 'h-72 bg-gradient-to-t from-amber-400/20 to-transparent border border-amber-400/30 shadow-[0_0_50px_rgba(251,191,36,0.1)] group-hover:h-80' : isSilver ? 'h-56 bg-white/5 border border-white/10 group-hover:h-64' : 'h-40 bg-white/5 border border-white/10 group-hover:h-48'}`}>
        <span className={`text-7xl font-black leading-none mb-2 italic ${isGold ? 'text-amber-400' : isSilver ? 'text-slate-400' : 'text-orange-800'}`}>{rank}</span>
        <p className="text-[11px] font-black text-white text-center uppercase tracking-[0.2em] italic truncate w-full">{team.name}</p>
        <p className={`text-[10px] font-bold mt-2 ${isGold ? 'text-amber-400' : 'text-white/40'}`}>{(score || 0).toFixed(1)} PTS</p>
      </div>
    </div>
  );
}
