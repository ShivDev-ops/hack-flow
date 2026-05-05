"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getLabSession } from "@/app/actions/lab-auth";
import { updateTaskStatus } from "@/app/actions/kanban";
import { Task } from "@/types/common";
import { Loader2 } from "lucide-react";

export default function ConfigSysPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [session, setSession] = useState<{ memberId: string; teamId: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [commitUrl, setCommitUrl] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  const supabase = createClient();

  const fetchTasks = async (teamId: string) => {
    const { data } = await supabase.from("hf_tasks").select("*").eq("team_id", teamId);
    setTasks(data || []);
  };

  useEffect(() => {
    const init = async () => {
      try {
        const sessionData = await getLabSession();
        if (!sessionData || !sessionData.teamId) return;
        setSession(sessionData as any);
        await fetchTasks(sessionData.teamId);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [supabase]);

  const handleStatusChange = async (taskId: string, newStatus: string, eventId: string, sha: string | null = null) => {
    setUpdating(taskId);
    const res = await updateTaskStatus(taskId, newStatus, eventId, sha);
    if (res.success) {
      await fetchTasks(session!.teamId);
      setCommitUrl("");
    } else {
      alert(res.error);
    }
    setUpdating(null);
  };

  if (loading) {
    return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-secondary" size={40} /></div>;
  }

  // Filter tasks into their respective columns
  const backlog = tasks.filter(t => t.status === 'Todo');
  const inProgress = tasks.filter(t => t.status === 'Progress');
  const review = tasks.filter(t => t.status === 'Review');
  const verified = tasks.filter(t => t.status === 'Verified');

  return (
    <div className="p-4 md:p-lg pb-12 flex flex-col xl:flex-row gap-lg min-h-full">
      
      {/* SIDEBAR METRICS (25%) */}
      <section className="w-full xl:w-1/4 flex flex-col gap-lg">
        <div className="glass-panel rim-light p-md rounded-lg space-y-md">
          <h4 className="font-label-caps text-on-surface-variant flex items-center gap-sm">
            <span className="material-symbols-outlined text-sm">analytics</span>
            SYSTEM_METRICS
          </h4>
          <div className="space-y-sm">
            <div className="flex justify-between items-center bg-white/5 p-sm rounded border border-white/5">
              <span className="font-data-mono text-xs text-on-surface-variant">DB_LATENCY</span>
              <span className="font-data-mono text-xs text-secondary">12ms</span>
            </div>
            <div className="flex justify-between items-center bg-white/5 p-sm rounded border border-white/5">
              <span className="font-data-mono text-xs text-on-surface-variant">TASKS_TOTAL</span>
              <span className="px-2 py-[2px] bg-black text-[9px] border border-secondary text-secondary rounded font-bold uppercase">{tasks.length}</span>
            </div>
            <div className="flex justify-between items-center bg-white/5 p-sm rounded border border-white/5">
              <span className="font-data-mono text-xs text-on-surface-variant">COMPLETION</span>
              <div className="w-20 h-1 bg-surface-container-highest rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary to-secondary" style={{ width: `${tasks.length ? (verified.length / tasks.length) * 100 : 0}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-panel rim-light p-md rounded-lg h-96 flex flex-col">
          <h4 className="font-label-caps text-on-surface-variant flex items-center gap-sm mb-md">
            <span className="material-symbols-outlined text-sm">history</span>
            RECENT_COMMITS
          </h4>
          <div className="flex-1 overflow-y-auto space-y-md pr-2 custom-scrollbar">
            {verified.length === 0 && <p className="text-xs text-slate-500 font-data-mono">No verified commits yet.</p>}
            {verified.map(task => (
              <div key={task.id} className="space-y-1">
                <div className="flex justify-between items-start">
                  <span className="font-data-mono text-[10px] text-primary truncate max-w-[120px]">
                    {task.commit_sha || `#${task.id.substring(0,6)}`}
                  </span>
                </div>
                <p className="font-body-main text-xs text-white line-clamp-2">{task.title}</p>
                <p className="font-data-mono text-[9px] text-on-surface-variant">Verified Node Entry</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* KANBAN BOARD (75%) */}
      <section className="w-full xl:w-3/4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md">
        
        {/* BACKLOG */}
        <div className="flex flex-col gap-md">
          <div className="flex items-center justify-between px-sm">
            <h5 className="font-label-caps text-xs text-white">BACKLOG</h5>
            <span className="bg-surface-container-high px-2 py-[2px] rounded text-[10px] font-bold">{backlog.length}</span>
          </div>
          {backlog.map(task => (
            <div key={task.id} className="glass-panel rim-light p-md rounded-lg space-y-md">
              <div className="flex items-start justify-between">
                <span className="px-2 py-1 bg-primary/10 text-primary text-[9px] font-bold rounded">PENDING</span>
              </div>
              <h6 className="font-h3 text-sm text-white">{task.title}</h6>
              <p className="text-xs text-on-surface-variant line-clamp-2">{task.description}</p>
              <button 
                disabled={updating === task.id}
                onClick={() => handleStatusChange(task.id, "Progress", task.event_id)}
                className="w-full py-2 bg-white/5 hover:bg-white/10 text-white font-label-caps text-[10px] rounded flex items-center justify-center gap-2 border border-white/5 transition-all"
              >
                {updating === task.id ? <Loader2 size={12} className="animate-spin" /> : "START WORK"}
              </button>
            </div>
          ))}
        </div>

        {/* IN PROGRESS */}
        <div className="flex flex-col gap-md">
          <div className="flex items-center justify-between px-sm">
            <h5 className="font-label-caps text-xs text-white">IN_PROGRESS</h5>
            <span className="bg-primary/20 text-primary px-2 py-[2px] rounded text-[10px] font-bold border border-primary/30">{inProgress.length}</span>
          </div>
          {inProgress.map(task => (
            <div key={task.id} className="glass-panel border-primary/30 bg-primary/5 p-md rounded-lg space-y-md glow-blue">
              <div className="flex items-start justify-between">
                <span className="px-2 py-1 bg-secondary/10 text-secondary text-[9px] font-bold rounded">ACTIVE</span>
              </div>
              <h6 className="font-h3 text-sm text-white">{task.title}</h6>
              <div className="w-full h-1 bg-surface-container-highest rounded-full overflow-hidden">
                <div className="h-full bg-secondary w-[50%]"></div>
              </div>
              <button 
                disabled={updating === task.id}
                onClick={() => handleStatusChange(task.id, "Review", task.event_id)}
                className="w-full py-2 bg-white/5 hover:bg-primary/20 text-primary font-label-caps text-[10px] rounded border border-primary/30 transition-all"
              >
                REQUEST REVIEW
              </button>
            </div>
          ))}
        </div>

        {/* REVIEW */}
        <div className="flex flex-col gap-md">
          <div className="flex items-center justify-between px-sm">
            <h5 className="font-label-caps text-xs text-white">REVIEW</h5>
            <span className="bg-surface-container-high px-2 py-[2px] rounded text-[10px] font-bold">{review.length}</span>
          </div>
          {review.map(task => (
             <div key={task.id} className="glass-panel rim-light p-md rounded-lg border-dashed border-primary/30 flex flex-col items-center justify-center gap-sm text-center py-lg relative">
              <span className="material-symbols-outlined text-primary text-2xl opacity-50">assignment_turned_in</span>
              <p className="font-label-caps text-[10px] text-on-surface-variant line-clamp-1">{task.title}</p>
              
              <div className="w-full mt-md space-y-sm">
                <input 
                  value={commitUrl}
                  onChange={(e) => setCommitUrl(e.target.value)}
                  className="w-full bg-surface-container-lowest border-none border-b border-outline focus:border-secondary text-[10px] font-data-mono h-8 px-2 text-white outline-none" 
                  placeholder="PASTE_COMMIT_URL_TO_VERIFY" 
                />
                <button 
                  disabled={updating === task.id || !commitUrl}
                  onClick={() => handleStatusChange(task.id, "Verified", task.event_id, commitUrl)}
                  className="w-full py-2 bg-secondary/10 hover:bg-secondary/20 text-secondary disabled:opacity-50 font-label-caps text-[9px] border border-secondary/30 rounded uppercase"
                >
                  {updating === task.id ? "VERIFYING..." : "FINALIZE_WORK"}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* VERIFIED DONE */}
        <div className="flex flex-col gap-md">
          <div className="flex items-center justify-between px-sm">
            <h5 className="font-label-caps text-xs text-white">VERIFIED_DONE</h5>
            <span className="bg-secondary/20 text-secondary px-2 py-[2px] rounded text-[10px] font-bold border border-secondary/30">{verified.length}</span>
          </div>
          {verified.map(task => (
            <div key={task.id} className="glass-panel rim-light p-md rounded-lg opacity-80 border-secondary/20 space-y-md grayscale-[0.5] hover:grayscale-0 transition-all">
              <div className="flex items-start justify-between">
                <span className="px-2 py-1 bg-white/5 text-on-surface-variant text-[9px] font-bold rounded">SUCCESS</span>
                <span className="material-symbols-outlined text-secondary text-sm">check_circle</span>
              </div>
              <h6 className="font-h3 text-sm text-white line-clamp-1">{task.title}</h6>
              <div className="space-y-xs">
                <p className="font-label-caps text-[8px] text-on-surface-variant">VERIFIED_BY_COMMIT</p>
                <input 
                  className="w-full bg-black/40 border border-secondary/20 rounded p-1 text-[9px] font-data-mono text-secondary outline-none" 
                  readOnly 
                  type="text" 
                  value={task.commit_sha || "MANUAL_OVERRIDE"} 
                />
              </div>
            </div>
          ))}
        </div>

      </section>
    </div>
  );
}