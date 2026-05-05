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
    <div className="p-6 md:p-10 space-y-10 max-w-[1600px] mx-auto min-h-full selection:bg-secondary/30">
      
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1.5 h-1.5 bg-secondary rounded-full pulse-emerald shadow-[0_0_10px_#4edea3]" />
            <span className="text-[9px] font-black text-secondary uppercase tracking-[0.4em] font-label-caps">System_Validator // Monitoring</span>
          </div>
          <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">
            Config <span className="text-white/20">System</span>
          </h1>
          <p className="text-[10px] text-white/40 uppercase tracking-[0.3em] mt-3 ml-1 font-label-caps font-bold">Project Lead Verification & Registry Monitoring</p>
        </div>
      </header>

      <div className="flex flex-col xl:flex-row gap-10">
        
        {/* SIDEBAR METRICS (25%) */}
        <section className="w-full xl:w-1/4 flex flex-col gap-8">
          <div className="glass-panel rim-light p-8 rounded-[2rem] space-y-6 bg-white/[0.01]">
            <h4 className="font-label-caps text-xs font-black text-white/40 flex items-center gap-3 tracking-[0.2em] uppercase">
              <Zap size={14} className="text-secondary" /> System_Metrics
            </h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-black/40 p-5 rounded-2xl border border-white/5">
                <span className="font-data-mono text-[10px] text-white/40 uppercase tracking-widest">Latency</span>
                <span className="font-data-mono text-[11px] text-secondary font-black">12ms</span>
              </div>
              <div className="flex justify-between items-center bg-black/40 p-5 rounded-2xl border border-white/5">
                <span className="font-data-mono text-[10px] text-white/40 uppercase tracking-widest">Tasks_Total</span>
                <span className="px-3 py-1 bg-secondary/10 text-[10px] border border-secondary/20 text-secondary rounded-full font-black font-data-mono">{tasks.length}</span>
              </div>
              <div className="space-y-3 bg-black/40 p-5 rounded-2xl border border-white/5">
                <div className="flex justify-between items-center">
                  <span className="font-data-mono text-[10px] text-white/40 uppercase tracking-widest">Completion</span>
                  <span className="font-data-mono text-[10px] text-secondary font-black">{tasks.length ? Math.round((verified.length / tasks.length) * 100) : 0}%</span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-secondary pulse-emerald shadow-[0_0_8px_#4edea3]" style={{ width: `${tasks.length ? (verified.length / tasks.length) * 100 : 0}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel rim-light p-8 rounded-[2rem] h-[500px] flex flex-col bg-white/[0.01]">
            <h4 className="font-label-caps text-xs font-black text-white/40 flex items-center gap-3 tracking-[0.2em] uppercase mb-6">
              <Loader2 size={14} className="text-primary" /> Verified_Feed
            </h4>
            <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
              {verified.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center opacity-20 py-20 italic">
                  <span className="text-[10px] uppercase font-data-mono tracking-[0.3em]">No_Verified_Nodes</span>
                </div>
              )}
              {verified.map(task => (
                <div key={task.id} className="space-y-3 group border-l border-white/5 pl-4 hover:border-secondary transition-colors">
                  <div className="flex justify-between items-start">
                    <span className="font-data-mono text-[9px] text-secondary truncate max-w-[140px] uppercase tracking-tighter">
                      {task.commit_sha?.slice(0, 12) || `#${task.id.substring(0,8)}`}
                    </span>
                  </div>
                  <p className="font-body-main text-xs text-white font-medium line-clamp-2 leading-snug">{task.title}</p>
                  <p className="font-label-caps text-[8px] text-white/20 font-black tracking-widest uppercase italic">Verified_Node_Entry</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* KANBAN BOARD (75%) */}
        <section className="w-full xl:w-3/4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* BACKLOG */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between px-2 text-white/40">
              <h5 className="font-label-caps text-[10px] font-black tracking-[0.3em] uppercase">Backlog</h5>
              <span className="bg-white/5 px-3 py-1 rounded-full text-[9px] font-black font-data-mono">{backlog.length}</span>
            </div>
            {backlog.map(task => (
              <div key={task.id} className="glass-panel rim-light p-6 rounded-2xl space-y-4 bg-white/[0.01] border-white/5 hover:border-white/20 transition-all">
                <div className="flex items-start justify-between">
                  <span className="px-2 py-1 bg-white/5 text-white/40 text-[8px] font-black rounded uppercase tracking-widest font-label-caps">Status: Idle</span>
                </div>
                <h6 className="font-black text-sm text-white uppercase tracking-tight">{task.title}</h6>
                <p className="text-[11px] text-white/40 line-clamp-2 leading-relaxed">{task.description}</p>
                <button 
                  disabled={updating === task.id}
                  onClick={() => handleStatusChange(task.id, "Progress", task.event_id)}
                  className="w-full py-3 bg-white/5 hover:bg-secondary hover:text-black text-white font-black font-label-caps text-[9px] rounded-xl flex items-center justify-center gap-2 border border-white/5 transition-all tracking-widest uppercase active:scale-95"
                >
                  {updating === task.id ? <Loader2 size={12} className="animate-spin" /> : "Init_Work"}
                </button>
              </div>
            ))}
          </div>

          {/* IN PROGRESS */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between px-2 text-white/40">
              <h5 className="font-label-caps text-[10px] font-black tracking-[0.3em] uppercase">In_Progress</h5>
              <span className="bg-secondary/10 text-secondary border border-secondary/20 px-3 py-1 rounded-full text-[9px] font-black font-data-mono">{inProgress.length}</span>
            </div>
            {inProgress.map(task => (
              <div key={task.id} className="glass-panel border-secondary/20 bg-secondary/[0.02] p-6 rounded-2xl space-y-4 shadow-[0_0_30px_rgba(78,222,163,0.05)]">
                <div className="flex items-start justify-between">
                  <span className="px-2 py-1 bg-secondary/10 text-secondary text-[8px] font-black rounded uppercase tracking-widest font-label-caps animate-pulse">Status: Active</span>
                </div>
                <h6 className="font-black text-sm text-white uppercase tracking-tight">{task.title}</h6>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-secondary pulse-emerald w-[60%]"></div>
                </div>
                <button 
                  disabled={updating === task.id}
                  onClick={() => handleStatusChange(task.id, "Review", task.event_id)}
                  className="w-full py-3 bg-secondary/10 hover:bg-secondary text-secondary hover:text-black font-black font-label-caps text-[9px] rounded-xl border border-secondary/20 transition-all tracking-widest uppercase active:scale-95"
                >
                  Request_Sync
                </button>
              </div>
            ))}
          </div>

          {/* REVIEW */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between px-2 text-white/40">
              <h5 className="font-label-caps text-[10px] font-black tracking-[0.3em] uppercase">Review</h5>
              <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-3 py-1 rounded-full text-[9px] font-black font-data-mono">{review.length}</span>
            </div>
            {review.map(task => (
               <div key={task.id} className="glass-panel rim-light p-6 rounded-2xl border-dashed border-amber-500/20 bg-amber-500/[0.01] flex flex-col items-center justify-center gap-4 text-center py-8 relative">
                <div className="p-3 bg-amber-500/10 rounded-full">
                  <Shield size={20} className="text-amber-500 opacity-50" />
                </div>
                <p className="font-black text-[10px] text-white uppercase tracking-widest line-clamp-1 font-label-caps">{task.title}</p>
                
                <div className="w-full mt-2 space-y-3">
                  <div className="relative group">
                    <input 
                      style={{ colorScheme: 'dark' }}
                      value={commitUrl}
                      onChange={(e) => setCommitUrl(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-[10px] font-data-mono text-white outline-none focus:border-secondary/50 transition-all placeholder:text-white/10" 
                      placeholder="COMMIT_SHA_OR_URL" 
                    />
                  </div>
                  <button 
                    disabled={updating === task.id || !commitUrl}
                    onClick={() => handleStatusChange(task.id, "Verified", task.event_id, commitUrl)}
                    className="w-full py-3 bg-secondary text-black hover:bg-[#5affb4] disabled:opacity-30 disabled:bg-white/5 disabled:text-white/20 font-black font-label-caps text-[9px] rounded-xl uppercase tracking-widest transition-all shadow-lg active:scale-95"
                  >
                    {updating === task.id ? "Verifying..." : "Finalize_Verify"}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* VERIFIED DONE */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between px-2 text-white/40">
              <h5 className="font-label-caps text-[10px] font-black tracking-[0.3em] uppercase">Verified</h5>
              <span className="bg-secondary/10 text-secondary border border-secondary/20 px-3 py-1 rounded-full text-[9px] font-black font-data-mono">{verified.length}</span>
            </div>
            {verified.map(task => (
              <div key={task.id} className="glass-panel rim-light p-6 rounded-2xl opacity-60 border-secondary/10 space-y-4 bg-white/[0.01] group hover:opacity-100 transition-all">
                <div className="flex items-start justify-between">
                  <span className="px-2 py-1 bg-secondary/10 text-secondary text-[8px] font-black rounded uppercase tracking-widest font-label-caps">Status: Success</span>
                  <CheckCircle2 className="text-secondary" size={14} />
                </div>
                <h6 className="font-black text-sm text-white uppercase tracking-tight line-clamp-1">{task.title}</h6>
                <div className="space-y-2">
                  <p className="font-label-caps text-[8px] text-white/20 font-black tracking-widest uppercase">Verified_By_Telemetry</p>
                  <div className="w-full bg-black/60 border border-secondary/20 rounded-lg p-2.5 text-[9px] font-data-mono text-secondary truncate uppercase tracking-tighter">
                    {task.commit_sha || "MANUAL_OVERRIDE"}
                  </div>
                </div>
              </div>
            ))}
          </div>

        </section>
      </div>
    </div>
  );
}