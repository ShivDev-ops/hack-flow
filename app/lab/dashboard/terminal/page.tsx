"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { getLabSession } from "@/app/actions/lab-auth";
import { updateTaskStatus, deleteTaskAction } from "@/app/actions/kanban"; 
import { getTeamConfig } from "@/app/actions/lab-config";
import { Loader2, ExternalLink, Database } from "lucide-react";

import { Commit, Task } from "@/types/common";
import { KanbanBoard } from "@/components/lab/dashboard/kanban-board";
import { GitFeed } from "@/components/lab/dashboard/git-feed";
import { ObservabilityPanel } from "@/components/lab/dashboard/observability-panel";
import { NeuralLinkOverlay } from "@/components/lab/dashboard/neural-link-overlay";
import { getSystemObservability } from "@/lib/lab-config/observability";

interface TelemetryLog {
  id: string;
  action_type: string;
  table_name: string;
  details: string;
  created_at: string;
}

function DatabaseTelemetry({ logs }: { logs: TelemetryLog[] }) {
  return (
    <div className="glass-panel rim-light rounded-[2rem] p-6 shadow-2xl bg-white/[0.01] border border-white/5">
      <header className="flex items-center gap-3 border-b border-white/5 pb-4 mb-4">
        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
          <Database size={16} />
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white font-label-caps">DB_Audit_Pulse</span>
      </header>
      
      <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
        {logs.length === 0 ? (
          <div className="py-10 text-center space-y-2">
            <p className="text-[9px] text-white/20 font-black uppercase tracking-widest font-mono italic">Waiting_for_Uplink...</p>
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="p-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-2 group hover:bg-white/[0.04] transition-all">
              <div className="flex justify-between items-center">
                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter ${
                  log.action_type === 'INSERT' ? 'bg-emerald-500/20 text-emerald-400' : 
                  log.action_type === 'UPDATE' ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {log.action_type}
                </span>
                <span className="text-[8px] text-white/20 font-mono">
                  {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black text-white/60 uppercase font-mono tracking-widest">{log.table_name}</span>
                <span className="text-[10px] text-white/40 truncate font-mono italic">
                  {log.details.length > 40 ? log.details.substring(0, 40) + "..." : log.details}
                </span>
              </div>
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
    const [commitsRes, tasksRes, telemetryRes] = await Promise.all([
      supabase.from("repository_commits").select("*").eq("team_id", activeTeamId).order("created_at", { ascending: false }).limit(10),
      supabase.from("hf_tasks").select("*").eq("team_id", activeTeamId).order("created_at", { ascending: true }),
      supabase.from("hf_telemetry_logs").select("*").eq("team_id", activeTeamId).order("created_at", { ascending: false }).limit(10)
    ]);

    setCommits(commitsRes.data || []);
    setTasks(tasksRes.data || []);
    setDbLogs(telemetryRes.data || []);
  }, [supabase]);

  useEffect(() => {
    const init = async () => {
      try {
        const sessionData = await getLabSession();
        if (!sessionData) {
          setLoading(false);
          return;
        }
        setSession(sessionData);

        const activeTeamId = sessionData.teamId;
        if (!activeTeamId) {
          setLoading(false);
          return;
        }

        const configRes = await getTeamConfig(activeTeamId);
        if (configRes.success && configRes.config) {
          setDeploymentUrl(configRes.config.deployment_url);
        }

        const { data: teamData } = await supabase.from("hf_teams").select("event_id").eq("id", activeTeamId).single();
        if (teamData) setEventId(teamData.event_id);

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

  useEffect(() => {
    if (!session?.teamId) return;

    const activeTeamId = session.teamId;

    // REAL-TIME UPLINK: Listen for new commits, task updates, and telemetry
    const channel = supabase
      .channel(`team-${activeTeamId}`)
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
      .subscribe((status) => {
        setChannelStatus(status === 'SUBSCRIBED' ? 'ONLINE' : 'ERROR');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, session?.teamId, fetchData]);

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
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-[1800px] mx-auto min-h-full selection:bg-secondary/30 relative overflow-x-hidden">
      {!isMobile && (
        <NeuralLinkOverlay 
          tasks={tasks} 
          activeTeamId={session?.teamId || ""} 
          isWiring={isWiring} 
          hoveredTaskId={hoveredTaskId}
          hoveredCommitSha={hoveredCommitSha}
          mousePos={mousePos} 
        />
      )}
      
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10 border-b border-white/5 pb-8">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1.5 h-1.5 bg-secondary rounded-full pulse-emerald shadow-[0_0_10px_#4edea3]" />
              <span className="text-[9px] font-black text-secondary uppercase tracking-[0.4em] font-label-caps">Mission_Control // Operational</span>
            </div>
            <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">
              Command <span className="text-white/20">Terminal</span>
            </h1>
          </div>

          <div className="flex items-center gap-4 px-6 py-3 bg-white/[0.02] border border-white/5 rounded-2xl rim-light shadow-xl">
             <div className="flex flex-col items-start border-r border-white/10 pr-6">
                <span className="text-[7px] font-black text-white/20 uppercase tracking-widest font-label-caps mb-1">Uplink_Status</span>
                <div className="flex items-center gap-2">
                  <div className={`w-1 h-1 rounded-full ${channelStatus === 'ONLINE' ? 'bg-secondary animate-pulse shadow-[0_0_8px_#4edea3]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'}`} />
                  <span className={`text-[9px] font-black font-data-mono ${channelStatus === 'ONLINE' ? 'text-secondary' : 'text-red-500'}`}>{channelStatus}</span>
                </div>
             </div>
             <div className="flex flex-col items-end">
                <span className="text-[7px] font-black text-white/20 uppercase tracking-widest font-label-caps mb-1">Registry_Pulse</span>
                <span className="text-[10px] text-secondary font-data-mono uppercase font-black tracking-tighter">{session?.teamId?.slice(0, 8)}</span>
             </div>
          </div>
        </div>
      </header>

      {/* MAIN WORKSPACE: Commits & Kanban side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-3">
          <GitFeed 
            commits={commits} 
            onHoverCommit={(sha) => setHoveredCommitSha(sha)}
            onStartWiring={(sha) => {
              setIsWiring(sha);
              // Capture initial mouse position to prevent wire jump
              const e = window.event as MouseEvent;
              if (e) setMousePos({ x: e.clientX, y: e.clientY });
            }}
          />
        </div>
        <div className="lg:col-span-9">
          <KanbanBoard 
            tasks={tasks}
            commits={commits}
            updatingId={updatingId}
            selectedCommit={selectedCommit}
            teamId={session?.teamId || ""}
            eventId={eventId || ""}
            onMoveTask={handleMoveTask}
            onSelectCommit={(tid, sha) => setSelectedCommit(prev => ({ ...prev, [tid]: sha }))}
            onRefresh={() => session?.teamId && fetchData(session.teamId)}
            onHoverTask={(tid) => setHoveredTaskId(tid)}
            onRemoveLink={handleRemoveLink}
            onDeleteTask={handleDeleteTask}
          />
        </div>
      </div>

      {/* FOOTER PANELS: Preview & Database Pulse */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-8 border-t border-white/5">
        <div className="lg:col-span-8">
           {deploymentUrl && (
            <div className="glass-panel rim-light rounded-[2rem] overflow-hidden border border-white/5 bg-black/20 shadow-2xl group transition-all hover:border-blue-500/30">
              <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_#3b82f6]" />
                  <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] font-label-caps">Live_Preview_Uplink</span>
                </div>
                <a 
                  href={deploymentUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[9px] font-black text-secondary uppercase hover:text-white transition-colors flex items-center gap-1 font-label-caps"
                >
                  Launch_External <ExternalLink size={10} />
                </a>
              </div>
              <div className="relative h-[400px] bg-zinc-900 overflow-hidden">
                <iframe 
                  src={deploymentUrl} 
                  className="w-full h-[150%] origin-top-left border-none pointer-events-none opacity-40 group-hover:opacity-100 transition-opacity duration-700"
                  title="Live Deployment Preview"
                />
                <div 
                  className="absolute inset-0 bg-transparent cursor-pointer" 
                  onClick={() => window.open(deploymentUrl, '_blank')}
                />
              </div>
            </div>
          )}
        </div>
        <div className="lg:col-span-4 space-y-8">
           <ObservabilityPanel obs={obsData} deploymentUrl={deploymentUrl} />
           <DatabaseTelemetry logs={dbLogs} />
        </div>
      </div>
    </div>
  );
}
