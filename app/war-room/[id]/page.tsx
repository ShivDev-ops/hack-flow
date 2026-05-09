"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ParticleBackground } from "@/components/ui/particle-background";
import { Zap, Activity, Trophy, ShieldCheck, Clock, Box, Rocket, Terminal, Radio, Network, MessageSquare } from "lucide-react";
import { Team, Commit, Task, Event } from "@/types/common";
import { evaluateCommitVibe } from "@/app/actions/ai-tracker";

interface ExtendedTeam extends Team {
  last_commit_at?: string;
}

interface MemeAlert {
    teamName: string;
    message: string;
    commentary: string;
    gifUrl: string;
    vibe: string;
}

/**
 * UI/UX PRO MAX FEATURE: GLOBAL_WAR_ROOM
 * A high-octane, real-time spectator dashboard for event halls and big screens.
 */
export default function GlobalWarRoom() {
  const params = useParams();
  const eventId = params.id as string;
  
  const [teams, setTeams] = useState<ExtendedTeam[]>([]);
  const [eventData, setEventData] = useState<Event | null>(null);
  const [ticker, setTicker] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeNodes, setActiveNodes] = useState(0);
  const [memeAlert, setMemeAlert] = useState<MemeAlert | null>(null);

  const supabase = useMemo(() => createClient(), []);

  const triggerMemePulse = useCallback(async (teamName: string, commitMsg: string) => {
    try {
        const vibeRes = await evaluateCommitVibe(teamName, commitMsg);
        if (vibeRes) {
            // Fetch GIF from Giphy Public Beta Key
            const giphyUrl = `https://api.giphy.com/v1/gifs/search?api_key=dc6zaTOxFJmzC&q=${encodeURIComponent(vibeRes.searchTerm)}&limit=1&rating=g`;
            const gifRes = await fetch(giphyUrl);
            const gifData = await gifRes.json();
            const imageUrl = gifData.data?.[0]?.images?.original?.url || "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJtYnB4Z2x4Z2x4Z2x4Z2x4Z2x4Z2x4Z2x4Z2x4Z2x4Z2x4JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/3o7TKSjPqcKGRZaSyc/giphy.gif";

            setMemeAlert({
                teamName,
                message: commitMsg,
                commentary: vibeRes.commentary,
                gifUrl: imageUrl,
                vibe: vibeRes.vibe
            });

            // Auto-dismiss
            setTimeout(() => setMemeAlert(null), 8000);
        }
    } catch (err) {
        console.error("MEME_PULSE_FAIL:", err);
    }
  }, []);

  const fetchBaseData = useCallback(async () => {
    try {
      const [eventRes, teamsRes, commitsRes] = await Promise.all([
        supabase.from("hf_events").select("*").eq("id", eventId).single(),
        supabase.from("hf_teams").select("*").eq("event_id", eventId),
        supabase.from("repository_commits").select("*").order("created_at", { ascending: false }).limit(20)
      ]);

      if (eventRes.data) setEventData(eventRes.data as Event);
      
      if (teamsRes.data) {
          const teamList = teamsRes.data as Team[];
          const teamIds = new Set(teamList.map(t => t.id));
          
          // Enriched with last commit from the recent list (if any)
          const enrichedTeams = teamList.map(team => {
              const lastCommit = commitsRes.data?.find(c => c.team_id === team.id);
              return { ...team, last_commit_at: lastCommit?.created_at };
          });
          setTeams(enrichedTeams);

          // Initial Ticker
          const filteredCommits = (commitsRes.data || []).filter(c => teamIds.has(c.team_id));
          setTicker(filteredCommits.map(c => {
              const team = teamList.find(t => t.id === c.team_id);
              return `${team?.name || 'NODE'} pushed logic: "${c.message.substring(0,40)}..."`;
          }));
      }
    } catch (err) {
      console.error("WAR_ROOM_SYNC_FAIL:", err);
    } finally {
      setLoading(false);
    }
  }, [eventId, supabase]);

  useEffect(() => {
    fetchBaseData();

    // REAL-TIME HANDSHAKE: Listening to the entire event fleet
    const channel = supabase
      .channel(`global-war-room-${eventId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'repository_commits' }, payload => {
        const commit = payload.new as Commit;
        setTeams(prev => {
            const isRelevant = prev.some(t => t.id === commit.team_id);
            if (!isRelevant) return prev;
            
            const updated = prev.map(t => t.id === commit.team_id ? { ...t, last_commit_at: commit.created_at } : t);
            const team = prev.find(t => t.id === commit.team_id);
            
            setTicker(current => [
                `${team?.name || 'NODE'} deployed fresh logic update.`, 
                ...current.slice(0, 14)
            ]);

            // TRIGGER MEME PULSE
            if (team) triggerMemePulse(team.name, commit.message);
            
            return updated;
        });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'hf_tasks' }, payload => {
        const task = payload.new as Task;
        setTeams(prev => {
            const isRelevant = prev.some(t => t.id === task.team_id);
            if (!isRelevant) return prev;
            
            if (task.status === 'Verified') {
                const team = prev.find(t => t.id === task.team_id);
                setTicker(current => [
                    `CRITICAL_SUCCESS: ${team?.name} verified objective: ${task.title}`, 
                    ...current.slice(0, 14)
                ]);
            }
            return prev;
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, supabase, fetchBaseData]);

  // Recalculate active nodes every minute
  useEffect(() => {
    const calc = () => {
        const now = Date.now();
        const active = teams.filter(t => t.last_commit_at && (now - new Date(t.last_commit_at).getTime() < 30 * 60 * 1000)).length;
        setActiveNodes(active);
    };
    calc();
    const interval = setInterval(calc, 60000);
    return () => clearInterval(interval);
  }, [teams]);

  const getStatusColor = (lastCommit?: string) => {
    if (!lastCommit) return 'bg-white/5 border-white/5 text-white/10 opacity-40';
    const diff = Date.now() - new Date(lastCommit).getTime();
    if (diff < 5 * 60 * 1000) return 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_40px_rgba(16,185,129,0.2)] scale-105 z-20'; // < 5m
    if (diff < 30 * 60 * 1000) return 'bg-amber-500/10 border-amber-500/40 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.1)]'; // < 30m
    return 'bg-red-500/5 border-red-500/10 text-red-500/30 grayscale'; // > 30m
  };

  if (loading) return (
    <div className="min-h-screen bg-[#020203] flex flex-col items-center justify-center gap-6">
        <Loader2 className="animate-spin text-secondary" size={64} />
        <p className="font-black uppercase tracking-[0.6em] text-white/40 animate-pulse text-xs">Synchronizing War Room</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020203] text-white overflow-hidden flex flex-col relative font-sans selection:bg-secondary/30">
      <ParticleBackground />
      
      {/* HEADER: ELITE_STATUS_BAR */}
      <header className="p-8 md:p-12 flex flex-col lg:flex-row justify-between items-center z-10 border-b border-white/5 bg-black/60 backdrop-blur-2xl gap-8 shadow-2xl">
        <div className="space-y-3 text-center lg:text-left">
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-5">
                <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase leading-none">{eventData?.name || "Global_Sintra"}</h1>
                <div className="px-6 py-2 bg-secondary text-black text-[11px] font-black uppercase rounded-full animate-pulse shadow-[0_0_30px_#10b981] flex items-center gap-2">
                   <div className="size-2 bg-black rounded-full" />
                   LIVE_FLEET_CONNECTED
                </div>
            </div>
            <div className="flex items-center justify-center lg:justify-start gap-4 font-mono text-[10px] font-black text-white/30 uppercase tracking-[0.5em] ml-1">
                <span>Sector: ALPHA-9</span>
                <div className="w-1 h-1 bg-white/20 rounded-full" />
                <span>Protocol: HF-KRNL-V4.5</span>
            </div>
        </div>

        <div className="flex flex-wrap justify-center gap-8 md:gap-12">
            <StatBox icon={<Activity size={20} className="text-secondary" />} label="Fleet Nodes" value={teams.length} />
            <StatBox icon={<Zap size={20} className="text-blue-400" />} label="Hot Signal" value={activeNodes} />
            <StatBox icon={<Trophy size={20} className="text-amber-400" />} label="High Pulse" value={(Math.max(...teams.map(t => t.ai_progress_score || 0), 0)) + "%"} />
        </div>
      </header>

      {/* MEME ALERT OVERLAY */}
      <AnimatePresence>
        {memeAlert && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 100 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.1, transition: { duration: 0.3 } }}
            className="fixed inset-0 z-[500] flex items-center justify-center p-6 sm:p-12 pointer-events-none"
          >
            <div className={`glass-panel border-2 ${
                memeAlert.vibe === 'BULK' ? 'border-red-500/40 shadow-[0_0_100px_#ef444444]' :
                memeAlert.vibe === 'FRANTIC' ? 'border-amber-500/40 shadow-[0_0_100px_#f59e0b44]' :
                'border-secondary/40 shadow-[0_0_100px_#10b98144]'
            } rounded-[4rem] p-10 md:p-16 max-w-5xl w-full bg-black/90 backdrop-blur-3xl relative overflow-hidden pointer-events-auto`}>
              
              <div className="absolute top-0 right-0 p-12 opacity-5">
                 <Rocket size={300} className="rotate-12" />
              </div>

              <div className="flex flex-col lg:flex-row gap-12 relative z-10">
                <div className="lg:w-1/2 space-y-8 flex flex-col justify-center">
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.3em] ${
                                memeAlert.vibe === 'BULK' ? 'bg-red-500/20 text-red-400' :
                                memeAlert.vibe === 'FRANTIC' ? 'bg-amber-500/20 text-amber-400' :
                                'bg-secondary/20 text-secondary'
                            }`}>
                                VIBE_CHECK: {memeAlert.vibe}
                            </span>
                            <div className="h-px flex-1 bg-white/10"></div>
                        </div>
                        <h2 className="text-5xl md:text-7xl font-black text-white uppercase italic tracking-tighter leading-none">
                            {memeAlert.teamName}
                        </h2>
                    </div>

                    <div className="bg-white/5 border border-white/10 p-8 rounded-[2rem] space-y-4">
                        <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">Architect_Commentary</p>
                        <p className="text-xl md:text-2xl font-bold text-white leading-relaxed italic">
                            &quot;{memeAlert.commentary}&quot;
                        </p>
                    </div>

                    <div className="flex items-center gap-4 text-white/40 font-mono text-[10px] uppercase tracking-[0.2em]">
                        <MessageSquare size={14} />
                        <span className="truncate max-w-xs">{memeAlert.message}</span>
                    </div>
                </div>

                <div className="lg:w-1/2 relative group">
                    <div className="absolute -inset-4 bg-gradient-to-br from-white/10 to-transparent rounded-[3rem] blur-xl group-hover:opacity-100 transition-opacity opacity-50" />
                    <img 
                        src={memeAlert.gifUrl} 
                        alt="Reactive Meme" 
                        className="w-full aspect-video object-cover rounded-[2.5rem] relative border border-white/20 shadow-2xl"
                    />
                    <div className="absolute bottom-6 right-6 px-4 py-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-[9px] font-black text-white/60 uppercase tracking-widest">
                        Source: GIPHY_LIVE
                    </div>
                </div>
              </div>

              {/* SCANNING LINE */}
              <div className="absolute inset-0 pointer-events-none animate-scan opacity-20 border-y border-white/5" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN: THE_NODE_GRID */}
      <main className="flex-1 p-8 md:p-16 overflow-y-auto custom-scrollbar z-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-6 md:gap-10">
            <AnimatePresence mode="popLayout">
                {teams.map((team) => (
                    <motion.div 
                        key={team.id}
                        layout
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`aspect-square rounded-[2.5rem] border-2 p-6 flex flex-col items-center justify-center text-center gap-5 transition-all duration-1000 ${getStatusColor(team.last_commit_at)}`}
                    >
                        <div className="relative group/node">
                            <div className="p-4 bg-white/5 rounded-2xl group-hover/node:scale-110 transition-transform">
                                <Network size={32} className="opacity-40" />
                            </div>
                            {team.last_commit_at && (Date.now() - new Date(team.last_commit_at).getTime() < 5 * 60 * 1000) && (
                                <div className="absolute inset-0 bg-emerald-500/40 blur-2xl animate-pulse rounded-full -z-10" />
                            )}
                        </div>
                        <div className="space-y-1 w-full">
                            <h3 className="text-sm md:text-base font-black uppercase italic leading-none truncate px-2">{team.name}</h3>
                            <p className="text-[8px] font-black uppercase tracking-[0.3em] opacity-40 font-mono">ID_{team.id.slice(0,6)}</p>
                        </div>
                        <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mt-1 border border-white/5">
                             <div className="h-full bg-current transition-all duration-1000" style={{ width: `${team.ai_progress_score || 0}%` }} />
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
      </main>

      {/* FOOTER: THE_MISSION_TICKER */}
      <footer className="h-24 bg-black border-t border-white/5 flex items-center z-10 relative overflow-hidden shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
         <div className="flex items-center px-12 border-r border-white/10 bg-black z-20 h-full gap-6">
            <div className="size-3.5 bg-secondary rounded-full animate-pulse shadow-[0_0_15px_#10b981]" />
            <span className="font-black uppercase tracking-[0.5em] text-sm whitespace-nowrap">Global_Event_Feed</span>
         </div>
         <div className="flex-1 overflow-hidden relative bg-[#050505]">
            <div className="flex gap-32 animate-marquee whitespace-nowrap items-center h-full">
                {ticker.length === 0 ? (
                   <span className="text-sm font-bold uppercase tracking-widest text-white/10 italic">Radio Silence... No recent telemetry detected in sector.</span>
                ) : (
                  <>
                    {ticker.map((msg, i) => (
                        <span key={i} className="text-base font-black uppercase tracking-widest text-white/50 italic flex items-center gap-4">
                            <div className="size-1.5 bg-white/20 rounded-full" /> {msg}
                        </span>
                    ))}
                    {/* Duplicate for seamless loop */}
                    {ticker.map((msg, i) => (
                        <span key={`dup-${i}`} className="text-base font-black uppercase tracking-widest text-white/50 italic flex items-center gap-4">
                            <div className="size-1.5 bg-white/20 rounded-full" /> {msg}
                        </span>
                    ))}
                  </>
                )}
            </div>
         </div>
         </footer>
         </div>
         );
         }


function StatBox({ icon, label, value }: { icon: any, label: string, value: any }) {
    return (
        <div className="flex items-center gap-5 bg-white/[0.03] border border-white/5 px-8 py-5 rounded-[2rem] shadow-xl hover:bg-white/[0.05] transition-all">
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">{icon}</div>
            <div>
                <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-1">{label}</p>
                <p className="text-3xl font-black italic text-white tracking-tighter leading-none">{value}</p>
            </div>
        </div>
    );
}

function Loader2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}
