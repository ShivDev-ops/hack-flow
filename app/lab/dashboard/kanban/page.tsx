"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { getLabSession } from "@/app/actions/lab-auth";
import { updateTaskStatus, deleteTaskAction } from "@/app/actions/kanban"; 
import { Loader2 } from "lucide-react";

import { Commit, Task } from "@/types/common";
import { KanbanBoard } from "@/components/lab/dashboard/kanban-board";
import { GitFeed } from "@/components/lab/dashboard/git-feed";
import { NeuralLinkOverlay } from "@/components/lab/dashboard/neural-link-overlay";
import { ObservabilityPanel } from "@/components/lab/dashboard/observability-panel";
import { getSystemObservability } from "@/lib/lab-config/observability";
import { AIChatAgent } from "@/components/lab/dashboard/ai-chat-agent";

export default function KanbanPage() {
  const [commits, setCommits] = useState<Commit[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [session, setSession] = useState<{ memberId: string; teamId: string; role: string } | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
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
    const [commitsRes, tasksRes] = await Promise.all([
      supabase.from("repository_commits").select("*").eq("team_id", activeTeamId).order("created_at", { ascending: false }).limit(20),
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
        console.error("Initialization failed:", error);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [supabase, fetchData]);

  const handleMoveTask = async (taskId: string, newStatus: string) => {
    setUpdatingId(taskId);
    if (newStatus === 'Verified' && session?.role !== 'LEAD') {
      alert("UNAUTHORIZED: Only the Project Lead can finalize objectives.");
      setUpdatingId(null);
      return;
    }

    const commitToLink = newStatus === 'Verified' ? selectedCommit[taskId] : null;
    const res = await updateTaskStatus(taskId, newStatus, eventId || "", commitToLink);
    
    if (!res.success) alert(res.error); 
    else if (session?.teamId) await fetchData(session.teamId); 
    
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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
      
      <header className="flex flex-col gap-6 relative z-10 border-b border-white/5 pb-8">
        <ObservabilityPanel obs={obsData} deploymentUrl={null} />
        <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">
          Mission <span className="text-white/20">Objectives</span>
        </h1>
      </header>

      <div className="space-y-12 relative z-10">
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

        <GitFeed 
            commits={commits} 
            layout="horizontal"
            onHoverCommit={(sha) => setHoveredCommitSha(sha)}
            onStartWiring={(sha) => {
              setIsWiring(sha);
              const e = window.event as MouseEvent;
              if (e) setMousePos({ x: e.clientX, y: e.clientY });
            }}
        />
      </div>

      {session?.teamId && <AIChatAgent teamId={session.teamId} role={session.role} />}
    </div>
  );
}
