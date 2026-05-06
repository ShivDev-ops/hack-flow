"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { getLabSession } from "@/app/actions/lab-auth";
import { updateTaskStatus } from "@/app/actions/kanban"; 
import { getTeamConfig } from "@/app/actions/lab-config";
import { Loader2, ExternalLink, Database } from "lucide-react";

import { Commit, Task } from "@/types/common";
import { KanbanBoard } from "@/components/lab/dashboard/kanban-board";
import { GitFeed } from "@/components/lab/dashboard/git-feed";
import { ObservabilityPanel } from "@/components/lab/dashboard/observability-panel";
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
  
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedCommit, setSelectedCommit] = useState<Record<string, string>>({});
  
  const obsData = useMemo(() => getSystemObservability(), []);
  const supabase = useMemo(() => createClient(), []);

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
    
    // Optional: Could add mandatory commit check here if desired

    const res = await updateTaskStatus(taskId, newStatus, eventId || "", commitToLink);
    
    if (!res.success) {
      alert(res.error); 
    } else if (session?.teamId) {
      await fetchData(session.teamId); 
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
    <div className="p-6 md:p-10 space-y-10 max-w-[1600px] mx-auto min-h-full selection:bg-secondary/30">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1.5 h-1.5 bg-secondary rounded-full pulse-emerald shadow-[0_0_10px_#4edea3]" />
            <span className="text-[9px] font-black text-secondary uppercase tracking-[0.4em] font-label-caps">Mission_Control // Operational</span>
          </div>
          <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">
            Command <span className="text-white/20">Terminal</span>
          </h1>
          <p className="text-[10px] text-white/40 uppercase tracking-[0.3em] mt-3 ml-1 font-label-caps font-bold">Proof of Work & Objective Synchronization</p>
        </div>
        
        <div className="flex items-center gap-6 bg-white/[0.02] border border-white/5 px-6 py-4 rounded-2xl rim-light shadow-xl">
           <div className="flex flex-col items-start border-r border-white/10 pr-6">
              <span className="text-[8px] font-black text-white/20 uppercase tracking-widest font-label-caps mb-1">Uplink_Status</span>
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${channelStatus === 'ONLINE' ? 'bg-secondary animate-pulse shadow-[0_0_8px_#4edea3]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'}`} />
                <span className={`text-[10px] font-black font-data-mono ${channelStatus === 'ONLINE' ? 'text-secondary' : 'text-red-500'}`}>{channelStatus}</span>
              </div>
           </div>
           <div className="flex flex-col items-end">
              <span className="text-[8px] font-black text-white/20 uppercase tracking-widest font-label-caps mb-1">Team_Node_ID</span>
              <span className="text-[11px] text-secondary font-data-mono uppercase font-black tracking-tighter">{session?.teamId?.slice(0, 12)}</span>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-3 space-y-6">
          <ObservabilityPanel obs={obsData} deploymentUrl={deploymentUrl} />
          
          {deploymentUrl && (
            <div className="glass-panel rim-light rounded-[2rem] overflow-hidden border border-white/5 bg-black/20 shadow-2xl group transition-all hover:border-blue-500/30">
              <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_#3b82f6]" />
                  <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] font-label-caps">Live_Preview</span>
                </div>
                <a 
                  href={deploymentUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[9px] font-black text-secondary uppercase hover:text-white transition-colors flex items-center gap-1 font-label-caps"
                >
                  External <ExternalLink size={10} />
                </a>
              </div>
              <div className="relative aspect-video bg-zinc-900 overflow-hidden">
                <iframe 
                  src={deploymentUrl} 
                  className="w-[1200px] h-[675px] origin-top-left scale-[0.26] md:scale-[0.23] lg:scale-[0.21] border-none pointer-events-none opacity-40 group-hover:opacity-100 transition-opacity duration-700"
                  title="Live Deployment Preview"
                />
                <div 
                  className="absolute inset-0 bg-transparent cursor-pointer" 
                  onClick={() => window.open(deploymentUrl, '_blank')}
                />
              </div>
            </div>
          )}

          <DatabaseTelemetry logs={dbLogs} />
          <GitFeed commits={commits} />
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
          />
        </div>
      </div>
    </div>
  );
}
