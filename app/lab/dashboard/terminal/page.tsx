"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { getLabSession } from "@/app/actions/lab-auth";
import { updateTaskStatus } from "@/app/actions/kanban"; 
import { Loader2 } from "lucide-react";

import { Commit, Task } from "@/types/common";
import { KanbanBoard } from "@/components/lab/dashboard/kanban-board";
import { GitFeed } from "@/components/lab/dashboard/git-feed";
import { ObservabilityPanel } from "@/components/lab/dashboard/observability-panel";
import { getSystemObservability } from "@/lib/lab-config/observability";

export default function TerminalPage() {
  const [commits, setCommits] = useState<Commit[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [session, setSession] = useState<{ memberId: string; teamId: string; role: string } | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [channelStatus, setChannelStatus] = useState<string>("CONNECTING");
  
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedCommit, setSelectedCommit] = useState<Record<string, string>>({});
  
  const obsData = useMemo(() => getSystemObservability(), []);
  
  const supabase = useMemo(() => createClient(), []);

  const fetchData = useCallback(async (activeTeamId: string) => {
    const [commitsRes, tasksRes] = await Promise.all([
      supabase.from("repository_commits").select("*").eq("team_id", activeTeamId).order("created_at", { ascending: false }).limit(10),
      supabase.from("hf_tasks").select("*").eq("team_id", activeTeamId).order("created_at", { ascending: true })
    ]);

    setCommits(commitsRes.data || []);
    setTasks(tasksRes.data || []);
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

    // REAL-TIME UPLINK: Listen for new commits and task updates
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
      .subscribe((status) => {
        setChannelStatus(status === 'SUBSCRIBED' ? 'ONLINE' : 'ERROR');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, session?.teamId, fetchData]);

  const handleMoveTask = async (taskId: string, newStatus: string) => {
    setUpdatingId(taskId);
    
    if (newStatus === 'Verified' && session?.role !== 'LEAD') {
      alert("UNAUTHORIZED: Only the Project Lead can verify tasks.");
      setUpdatingId(null);
      return;
    }

    const commitToLink = newStatus === 'Review' ? selectedCommit[taskId] : null;
    if (newStatus === 'Review' && !commitToLink) {
      alert("CRITICAL: You must link a commit (Proof of Work) to submit for review.");
      setUpdatingId(null);
      return;
    }

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
          <ObservabilityPanel obs={obsData} />
          <GitFeed commits={commits} />
        </div>
        <div className="lg:col-span-9">
          <KanbanBoard 
            tasks={tasks}
            commits={commits}
            updatingId={updatingId}
            selectedCommit={selectedCommit}
            onMoveTask={handleMoveTask}
            onSelectCommit={(tid, sha) => setSelectedCommit(prev => ({ ...prev, [tid]: sha }))}
          />
        </div>
      </div>
    </div>
  );
}
