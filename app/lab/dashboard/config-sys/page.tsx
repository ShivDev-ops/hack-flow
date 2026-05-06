"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getLabSession } from "@/app/actions/lab-auth";
import { updateTaskStatus } from "@/app/actions/kanban";
import { Task } from "@/types/common";
import { Loader2, Zap, Shield, CheckCircle2 } from "lucide-react";

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

  const backlog = tasks.filter(t => t.status === 'Todo');
  const inProgress = tasks.filter(t => t.status === 'Progress');
  const review = tasks.filter(t => t.status === 'Review');
  const verified = tasks.filter(t => t.status === 'Verified');

  return (
    <div className="p-6 md:p-10 space-y-10 max-w-[1800px] mx-auto min-h-full selection:bg-secondary/30 font-body-main">
      
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/5 pb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 bg-secondary rounded-full pulse-emerald shadow-[0_0_10px_#4edea3]" />
            <span className="text-[11px] font-black text-secondary uppercase tracking-[0.4em] font-label-caps">System_Validator // Monitoring</span>
          </div>
          <h1 className="text-5xl font-black text-white uppercase italic tracking-tighter leading-none">
            Config <span className="text-white/20">System</span>
          </h1>
        </div>
      </header>

      <div className="flex flex-col xl:flex-row gap-10">
        
        {/* SIDEBAR METRICS */}
        <section className="w-full xl:w-1/4 flex flex-col gap-8">
          <div className="glass-panel rim-light p-8 rounded-[2rem] space-y-6 bg-white/[0.01]">
            <h4 className="font-label-caps text-sm font-black text-white/40 flex items-center gap-3 tracking-[0.2em] uppercase">
              <Zap size={18} className="text-secondary" /> System_Metrics
            </h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-black/40 p-6 rounded-2xl border border-white/5">
                <span className="font-data-mono text-[12px] text-white/40 uppercase tracking-widest">Objectives</span>
                <span className="px-4 py-1.5 bg-secondary/10 text-[12px] border border-secondary/20 text-secondary rounded-full font-black font-data-mono">{tasks.length}</span>
              </div>
              <div className="space-y-4 bg-black/40 p-6 rounded-2xl border border-white/5">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-data-mono text-[12px] text-white/40 uppercase tracking-widest">Completion</span>
                  <span className="font-data-mono text-[12px] text-secondary font-black">{tasks.length ? Math.round((verified.length / tasks.length) * 100) : 0}%</span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-secondary pulse-emerald" style={{ width: `${tasks.length ? (verified.length / tasks.length) * 100 : 0}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel rim-light p-8 rounded-[2rem] h-[600px] flex flex-col bg-white/[0.01]">
            <h4 className="font-label-caps text-sm font-black text-white/40 flex items-center gap-3 tracking-[0.2em] uppercase mb-6">
              <CheckCircle2 size={18} className="text-secondary" /> Verified_Feed
            </h4>
            <div className="flex-1 overflow-y-auto space-y-6 custom-scrollbar">
              {verified.map(task => (
                <div key={task.id} className="space-y-1 group border-l-2 border-white/5 pl-5 hover:border-secondary transition-colors pb-4">
                  <p className="text-sm text-white font-black uppercase tracking-tight line-clamp-1">{task.title}</p>
                  <span className="text-[11px] font-data-mono text-secondary/40 block truncate">{task.commit_sha?.slice(0, 12) || "MANUAL_ENTRY"}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* COMPACT KANBAN */}
        <section className="w-full xl:w-3/4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* BACKLOG */}
          <div className="flex flex-col gap-6">
            <h5 className="font-label-caps text-[12px] font-black tracking-[0.3em] uppercase text-white/40 px-3">Backlog ({backlog.length})</h5>
            {backlog.map(task => (
              <div key={task.id} className="glass-panel rim-light p-6 rounded-2xl space-y-5 bg-white/[0.01] border-white/5 hover:border-white/20 transition-all shadow-xl">
                <h6 className="font-black text-[15px] text-white uppercase tracking-tight">{task.title}</h6>
                <p className="text-[13px] text-white/40 line-clamp-2 leading-relaxed">{task.description}</p>
                <button 
                  disabled={updating === task.id}
                  onClick={() => handleStatusChange(task.id, "Progress", task.event_id)}
                  className="w-full py-4 bg-white/5 hover:bg-secondary hover:text-black text-white font-black text-[11px] rounded-xl flex items-center justify-center gap-3 border border-white/5 transition-all tracking-widest uppercase"
                >
                  {updating === task.id ? <Loader2 size={16} className="animate-spin" /> : "Init_Work"}
                </button>
              </div>
            ))}
          </div>

          {/* PROGRESS */}
          <div className="flex flex-col gap-6">
             <h5 className="font-label-caps text-[12px] font-black tracking-[0.3em] uppercase text-secondary px-3">Active ({inProgress.length})</h5>
            {inProgress.map(task => (
              <div key={task.id} className="glass-panel border-secondary/20 bg-secondary/[0.02] p-6 rounded-2xl space-y-5 shadow-[0_0_40px_rgba(78,222,163,0.06)]">
                <h6 className="font-black text-[15px] text-white uppercase tracking-tight">{task.title}</h6>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-secondary pulse-emerald w-[60%]"></div>
                </div>
                <button 
                  disabled={updating === task.id}
                  onClick={() => handleStatusChange(task.id, "Review", task.event_id)}
                  className="w-full py-4 bg-secondary/10 hover:bg-secondary text-secondary hover:text-black font-black text-[11px] rounded-xl border border-secondary/20 transition-all tracking-widest uppercase"
                >
                  Request_Sync
                </button>
              </div>
            ))}
          </div>

          {/* REVIEW */}
          <div className="flex flex-col gap-6">
             <h5 className="font-label-caps text-[12px] font-black tracking-[0.3em] uppercase text-amber-500 px-3">Review ({review.length})</h5>
            {review.map(task => (
               <div key={task.id} className="glass-panel rim-light p-6 rounded-2xl border-dashed border-amber-500/20 bg-amber-500/[0.01] flex flex-col items-center justify-center gap-5 text-center py-10 relative">
                <div className="p-4 bg-amber-500/10 rounded-full">
                  <Shield size={24} className="text-amber-500 opacity-50" />
                </div>
                <p className="font-black text-[12px] text-white uppercase tracking-widest line-clamp-1">{task.title}</p>
                <div className="w-full mt-2 space-y-4">
                  <input 
                    style={{ colorScheme: 'dark' }}
                    value={commitUrl}
                    onChange={(e) => setCommitUrl(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-4 px-5 text-[12px] font-data-mono text-white outline-none focus:border-secondary/50 transition-all placeholder:text-white/10" 
                    placeholder="COMMIT_SHA" 
                  />
                  <button 
                    disabled={updating === task.id || !commitUrl}
                    onClick={() => handleStatusChange(task.id, "Verified", task.event_id, commitUrl)}
                    className="w-full py-4 bg-secondary text-black hover:bg-[#5affb4] font-black text-[11px] rounded-xl uppercase tracking-widest transition-all shadow-lg"
                  >
                    Finalize_Verify
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* VERIFIED */}
          <div className="flex flex-col gap-6">
             <h5 className="font-label-caps text-[12px] font-black tracking-[0.3em] uppercase text-blue-400 px-3">Verified ({verified.length})</h5>
            {verified.map(task => (
              <div key={task.id} className="glass-panel rim-light p-6 rounded-2xl opacity-60 border-secondary/10 space-y-5 bg-white/[0.01] group hover:opacity-100 transition-all">
                <div className="flex items-center justify-between">
                  <h6 className="font-black text-[15px] text-white uppercase tracking-tight line-clamp-1">{task.title}</h6>
                  <CheckCircle2 className="text-secondary" size={18} />
                </div>
                <div className="w-full bg-black/60 border border-secondary/20 rounded-lg p-3 text-[11px] font-data-mono text-secondary truncate uppercase tracking-tighter">
                  {task.commit_sha || "MANUAL_OVERRIDE"}
                </div>
              </div>
            ))}
          </div>

        </section>
      </div>
    </div>
  );
}
