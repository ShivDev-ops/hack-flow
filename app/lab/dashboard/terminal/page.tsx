"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { getLabSession } from "@/app/actions/lab-auth";
import { updateTaskStatus, deleteTaskAction } from "@/app/actions/kanban"; 
import { getTeamConfig } from "@/app/actions/lab-config";
import { generateArchitectBroadcast } from "@/app/actions/ai-tracker";
import { Loader2, ExternalLink, Database, Activity as ActivityIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Commit, Task } from "@/types/common";
import { KanbanBoard } from "@/components/lab/dashboard/kanban-board";
import { GitFeed } from "@/components/lab/dashboard/git-feed";
import { ObservabilityPanel } from "@/components/lab/dashboard/observability-panel";
import { NeuralLinkOverlay } from "@/components/lab/dashboard/neural-link-overlay";
import { AIInsightPanel } from "@/components/lab/dashboard/ai-insight-panel";
import { ArchitectBroadcast } from "@/components/lab/dashboard/architect-broadcast";
import { getSystemObservability } from "@/lib/lab-config/observability";

interface TelemetryLog {
  id: string;
  action_type: string;
  table_name: string;
  details: string;
  created_at: string;
}

function DatabaseTelemetry({ logs }: { logs: TelemetryLog[] }) {
  // Filter out Architect Broadcasts from regular list to keep it clean
  const filteredLogs = logs.filter(log => log.action_type !== 'ARCHITECT_BROADCAST');
  return (
    <div className="glass-panel rim-light rounded-[2.5rem] p-8 shadow-2xl bg-white/[0.01] border border-white/5">
      <header className="flex items-center gap-4 border-b border-white/5 pb-5 mb-6">
        <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-400">
          <Database size={20} />
        </div>
        <span className="text-sm font-black uppercase tracking-widest text-white">Recent Activity</span>
      </header>
      
      <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-3">
        {logs.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <p className="text-xs text-white/20 font-bold uppercase tracking-widest italic">Awaiting connection...</p>
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center gap-4 group hover:bg-white/[0.04] transition-all">
              <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest shrink-0 ${
                log.action_type === 'INSERT' ? 'bg-emerald-500/20 text-emerald-400' : 
                log.action_type === 'UPDATE' ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'
              }`}>
                {log.action_type}
              </span>
              <span className="text-sm text-white/60 truncate font-medium flex-1 italic">
                {log.details}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function TerminalPage() {
  const [commits, setCommits] = useState<Commit[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [dbLogs, setDbLogs] = useState<TelemetryLog[]>([]);
  const [aiInsights, setAIInsights] = useState<any>(null);
  const [teamData, setTeamData] = useState<any>(null);
  const [session, setSession] = useState<{ memberId: string; teamId: string; role: string } | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);
  const [deploymentUrl, setDeploymentUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [channelStatus, setChannelStatus] = useState<string>("CONNECTING");
  
  // NEURAL LINK STATE
  const [isWiring, setIsWiring] = useState<string | null>(null);
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);
  const [hoveredCommitSha, setHoveredCommitSha] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);

  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedCommit, setSelectedCommit] = useState<Record<string, string>>({});
  
  const obsData = useMemo(() => getSystemObservability(), []);
  const supabase = useMemo(() => createClient(), []);

  // Neural Link Handlers
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isWiring) setMousePos({ x: e.clientX, y: e.clientY });
    };

    const handleGlobalMouseUp = (e: MouseEvent) => {
      if (isWiring) {
        const elements = document.elementsFromPoint(e.clientX, e.clientY);
        const taskEl = elements.find(el => el.id.startsWith('task-card-'));
        
        if (taskEl) {
          const taskId = taskEl.id.replace('task-card-', '');
          setSelectedCommit(prev => ({ ...prev, [taskId]: isWiring }));
        }
        setIsWiring(null);
      }
    };

    if (isWiring) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isWiring]);

  const fetchData = useCallback(async (activeTeamId: string) => {
    const [commitsRes, tasksRes, telemetryRes, teamRes] = await Promise.all([
      supabase.from("repository_commits").select("*").eq("team_id", activeTeamId).order("created_at", { ascending: false }).limit(10),
      supabase.from("hf_tasks").select("*").eq("team_id", activeTeamId).order("created_at", { ascending: true }),
      supabase.from("hf_telemetry_logs").select("*").eq("team_id", activeTeamId).order("created_at", { ascending: false }).limit(20),
      supabase.from("hf_teams").select("*").eq("id", activeTeamId).single()
    ]);

    setCommits(commitsRes.data || []);
    setTasks(tasksRes.data || []);
    setDbLogs(telemetryRes.data || []);
    setTeamData(teamRes.data);

    // EXTRACT LATEST AI INSIGHT FROM TELEMETRY
    const latestInsightLog = telemetryRes.data?.find(log => log.action_type === "AI_INSIGHT");
    if (latestInsightLog) {
        try {
            setAIInsights(JSON.parse(latestInsightLog.details));
        } catch (e) {
            console.error("Failed to parse AI insight details", e);
        }
    }
  }, [supabase]);

  // 1. INITIALIZATION: Fetch Session and Team Metadata
  useEffect(() => {
    const init = async () => {
      try {
        const sessionData = await getLabSession();
        if (!sessionData || !sessionData.teamId) {
          setLoading(false);
          return;
        }
        setSession(sessionData);

        const activeTeamId = sessionData.teamId;

        const [configRes, teamDataRes] = await Promise.all([
            getTeamConfig(activeTeamId),
            supabase.from("hf_teams").select("event_id").eq("id", activeTeamId).single()
        ]);

        if (configRes.success && configRes.config) {
          setDeploymentUrl(configRes.config.deployment_url);
        }

        if (teamDataRes.data) {
            setEventId(teamDataRes.data.event_id);
        }

        await fetchData(activeTeamId);

        // SYSTEM TELEMETRY: Log terminal access if no logs exist
        const { count } = await supabase.from("hf_telemetry_logs").select('*', { count: 'exact', head: true }).eq("team_id", activeTeamId);
        if (count === 0) {
          await supabase.from("hf_telemetry_logs").insert({
            team_id: activeTeamId,
            action_type: "SYSTEM",
            table_name: "hf_terminal",
            details: "Neural Uplink Established: Terminal Online"
          });
          fetchData(activeTeamId);
        }
      } catch (error) {
        console.error("Terminal initialization failed:", error);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [supabase, fetchData]);

  // 2. REAL-TIME UPLINK: Managed in its own effect for stability
  useEffect(() => {
    if (!session?.teamId) return;

    const activeTeamId = session.teamId;

    const channel = supabase
      .channel(`terminal-sync-${activeTeamId}`)
      .on(
        'postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'repository_commits', filter: `team_id=eq.${activeTeamId}` },
        () => fetchData(activeTeamId)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'hf_tasks', filter: `team_id=eq.${activeTeamId}` },
        () => fetchData(activeTeamId)
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'hf_telemetry_logs', filter: `team_id=eq.${activeTeamId}` },
        () => fetchData(activeTeamId)
      )
      .subscribe((status: string) => {
        setChannelStatus(status === 'SUBSCRIBED' ? 'ONLINE' : 'ERROR');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, session?.teamId, fetchData]);

  // 3. ARCHITECT TRIGGER: Automated coaching generation
  useEffect(() => {
    if (session?.teamId && eventId) {
        const trigger = async () => {
            const res = await generateArchitectBroadcast(session.teamId, eventId);
            if (res.success && !res.skipped) {
                fetchData(session.teamId);
            }
        };
        trigger();
        const interval = setInterval(trigger, 15 * 60 * 1000); // Check every 15m
        return () => clearInterval(interval);
    }
  }, [session?.teamId, eventId, fetchData]);

  const latestBroadcast = dbLogs.find(log => log.action_type === 'ARCHITECT_BROADCAST')?.details || null;

  const handleMoveTask = async (taskId: string, newStatus: string) => {
    setUpdatingId(taskId);
    
    // SECURITY: Only Leads can move tasks to 'Verified' (Completed)
    if (newStatus === 'Verified' && session?.role !== 'LEAD') {
      alert("UNAUTHORIZED: Only the Project Lead can finalize objectives.");
      setUpdatingId(null);
      return;
    }

    // TELEMETRY: Link commit if moving to Verified
    const commitToLink = newStatus === 'Verified' ? selectedCommit[taskId] : null;
    
    const res = await updateTaskStatus(taskId, newStatus, eventId || "", commitToLink);
    
    if (!res.success) {
      alert(res.error); 
    } else if (session?.teamId) {
      await fetchData(session.teamId); 
    }
    
    setUpdatingId(null);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    setUpdatingId(taskId);
    const res = await deleteTaskAction(taskId, eventId || "");
    if (!res.success) alert(res.error);
    else if (session?.teamId) fetchData(session.teamId);
    setUpdatingId(null);
  };

  const handleRemoveLink = async (taskId: string) => {
    setUpdatingId(taskId);
    const res = await updateTaskStatus(taskId, tasks.find(t => t.id === taskId)?.status || 'Todo', eventId || "", null);
    if (res.success && session?.teamId) {
      await fetchData(session.teamId);
      setSelectedCommit(prev => {
        const next = { ...prev };
        delete next[taskId];
        return next;
      });
    }
    setUpdatingId(null);
  };

  if (loading && !session) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-secondary" size={48} />
        <p className="text-xs font-black uppercase tracking-widest text-white/40">Syncing System</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-12 space-y-12 max-w-[1500px] mx-auto min-h-full selection:bg-secondary/30 relative">
      
      {/* PROACTIVE AGENT BROADCAST */}
      <AnimatePresence>
        {latestBroadcast && (
          <ArchitectBroadcast message={latestBroadcast} />
        )}
      </AnimatePresence>

      <header className="flex flex-col gap-8 relative z-10 border-b border-white/5 pb-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
           <ObservabilityPanel obs={obsData} deploymentUrl={deploymentUrl} />
           <h1 className="text-5xl font-black text-white uppercase italic tracking-tighter leading-none order-first md:order-last">
            Mission <span className="text-white/20">Hub</span>
          </h1>
        </div>
      </header>

      {/* MISSION OBSERVABILITY: Preview & Pulse */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 items-start relative z-10">
        
        {/* LIVE PREVIEW (Main Center Stage) */}
        <div className="xl:col-span-8 space-y-10">
          {deploymentUrl ? (
            <div className="glass-panel rim-light rounded-[3rem] overflow-hidden border border-white/5 bg-black/40 shadow-2xl group transition-all hover:border-blue-500/30">
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_10px_#3b82f6]" />
                  <span className="text-xs font-black text-white/60 uppercase tracking-widest">Live Application Preview</span>
                </div>
                <a 
                  href={deploymentUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs font-black text-secondary uppercase hover:text-white transition-colors flex items-center gap-2 tracking-widest"
                >
                  Open in New Tab <ExternalLink size={14} />
                </a>
              </div>
              <div className="relative h-[650px] bg-zinc-900/50 overflow-hidden">
                <iframe 
                  src={deploymentUrl} 
                  className="w-full h-[150%] origin-top-left border-none pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity duration-700"
                  title="Live Deployment Preview"
                />
                <div 
                  className="absolute inset-0 bg-transparent cursor-pointer" 
                  onClick={() => window.open(deploymentUrl, '_blank')}
                />
              </div>
            </div>
          ) : (
            <div className="glass-panel rim-light rounded-[3rem] h-[650px] flex flex-col items-center justify-center border border-white/5 bg-white/[0.01]">
                <div className="p-8 bg-white/5 rounded-3xl mb-6">
                    <ExternalLink size={48} className="text-white/10" />
                </div>
                <p className="text-lg font-black text-white/20 uppercase tracking-widest">Waiting for link...</p>
                <p className="text-xs text-white/10 mt-3 font-medium uppercase italic">Configure your deployment URL in Settings to activate stream</p>
            </div>
          )}
        </div>

        {/* AUDIT PULSE (Sidebar) */}
        <div className="xl:col-span-4 space-y-10">
           <AIInsightPanel 
              briefing={aiInsights?.briefing || teamData?.ai_status_summary || null}
              insights={aiInsights?.insights || []}
              nextMilestone={aiInsights?.next_milestone || null}
              progress={teamData?.ai_progress_score || 0}
            />
           <DatabaseTelemetry logs={dbLogs} />
        </div>
      </div>
    </div>
  );
}
