"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { getLabSession } from "@/app/actions/lab-auth";
import { updateTaskStatus } from "@/app/actions/kanban"; 
import { Loader2 } from "lucide-react";

import { Commit, Task } from "@/types/common";
import { KanbanBoard } from "@/components/lab/dashboard/kanban-board";
import { GitFeed } from "@/components/lab/dashboard/git-feed";

export default function TerminalPage() {
  const [commits, setCommits] = useState<Commit[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [session, setSession] = useState<{ memberId: string; teamId: string; role: string } | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedCommit, setSelectedCommit] = useState<Record<string, string>>({});
  
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
        if (!activeTeamId) return;

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
    <div className="p-4 md:p-6 lg:p-8 space-y-8">
      <header>
        <h1 className="text-2xl font-black uppercase tracking-tighter italic text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
          Command Terminal
        </h1>
        <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Proof of Work & Task Management</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-3">
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
