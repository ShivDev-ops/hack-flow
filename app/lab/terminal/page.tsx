"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getLabSession } from "@/app/actions/lab-auth"; // <-- Add this line
import { 
  LayoutGrid, 
  GitBranch, 
  Terminal, 
  Activity, 
  CheckCircle2, 
  Loader2, 
  Clock, 
  Zap 
} from "lucide-react";

export default function LabDashboard() {
  const [commits, setCommits] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const supabase = createClient();

  // UNIFIED INITIALIZATION PROTOCOL
  useEffect(() => {
    const initializeTerminal = async () => {
      try {
        // 1. Fetch Session from Server
        const sessionData = await getLabSession();
        
        if (!sessionData) {
          console.error("[CRITICAL] No session data returned from getLabSession()");
          setLoading(false);
          return;
        }

        setSession(sessionData);

        // 2. Safely extract the Team ID (Handling both naming conventions)
        const activeTeamId = sessionData.teamId || sessionData.team_id;

        if (!activeTeamId) {
          console.error("[CRITICAL] Session found, but missing Team ID:", sessionData);
          setLoading(false);
          return;
        }

        // 3. Fetch Supabase Telemetry
        const [commitsRes, tasksRes] = await Promise.all([
          supabase
            .from("repository_commits")
            .select("*")
            .eq("team_id", activeTeamId)
            .order("created_at", { ascending: false })
            .limit(10),
          supabase
            .from("hf_tasks")
            .select("*")
            .eq("team_id", activeTeamId)
            .order("created_at", { ascending: true })
        ]);

        setCommits(commitsRes.data || []);
        setTasks(tasksRes.data || []);

      } catch (error) {
        console.error("[SYSTEM ERROR] Terminal initialization failed:", error);
      } finally {
        // 4. ALWAYS turn off the loading spinner, even if it crashes
        setLoading(false);
      }
    };

    initializeTerminal();
    
    // Optional: Setup your interval refresh here if needed
    // const interval = setInterval(initializeTerminal, 15000);
    // return () => clearInterval(interval);
  }, []);

  // 2. FETCH LIVE TELEMETRY (COMMITS & TASKS)
  const fetchData = async () => {
    if (!session?.teamId) return;

    // Fetch Git Feed
    const { data: commitData } = await supabase
      .from("repository_commits")
      .select("*")
      .eq("team_id", session.teamId)
      .order("created_at", { ascending: false })
      .limit(10);

    // Fetch Tasks for Kanban
    const { data: taskData } = await supabase
      .from("hf_tasks")
      .select("*")
      .eq("team_id", session.teamId)
      .order("created_at", { ascending: true });

    setCommits(commitData || []);
    setTasks(taskData || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000); // Auto-refresh every 15s
    return () => clearInterval(interval);
  }, [session]);

  if (loading && !session) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-500" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white font-mono p-4 md:p-6 grid grid-cols-12 gap-6">
      
      {/* COLUMN 1: SQUAD TELEMETRY & GIT FEED */}
      <div className="col-span-12 lg:col-span-3 space-y-6">
        <div className="p-6 bg-zinc-950 border border-white/5 rounded-3xl space-y-6 shadow-2xl">
          <header className="flex items-center gap-2 text-emerald-500 border-b border-white/5 pb-4">
            <Activity size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest">Team_Telemetry</span>
          </header>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                <span className="text-[9px] text-slate-500 uppercase font-black">Designation</span>
                <span className="text-[10px] text-emerald-400 font-bold italic">{session?.role || "UNKNOWN"}</span>
            </div>
            
            <div className="pt-2">
              <div className="flex justify-between text-[8px] uppercase font-black text-slate-500 mb-2 italic">
                <span>Objective_Completion</span>
                <span>{tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'Review').length / tasks.length) * 100) : 0}%</span>
              </div>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-1000 shadow-[0_0_10px_rgba(16,185,129,0.5)]" 
                  style={{ width: `${tasks.length > 0 ? (tasks.filter(t => t.status === 'Review').length / tasks.length) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-zinc-950 border border-white/5 rounded-3xl flex-1 shadow-2xl">
          <header className="flex items-center gap-2 text-white border-b border-white/5 pb-4 mb-4">
            <GitBranch size={18} className="text-emerald-500" />
            <span className="text-[10px] font-black uppercase tracking-widest">Git_Feed</span>
          </header>
          <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
            {commits.map((commit) => (
              <div key={commit.id} className="group border-l-2 border-white/5 hover:border-emerald-500/50 pl-3 py-1 transition-colors">
                <div className="text-[10px] text-white font-bold italic truncate group-hover:text-emerald-400">{commit.message}</div>
                <div className="text-[8px] text-slate-600 uppercase mt-1">
                   @{commit.author_handle} // {new Date(commit.created_at).toLocaleTimeString()}
                </div>
              </div>
            ))}
            {commits.length === 0 && (
              <div className="text-[9px] text-slate-800 uppercase italic text-center py-10">Waiting for first push...</div>
            )}
          </div>
        </div>
      </div>

      {/* COLUMN 2 & 3: KANBAN GRID */}
      <div className="col-span-12 lg:col-span-9 space-y-6">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end p-2 gap-4">
          <div>
            <h2 className="text-4xl font-black italic tracking-tighter uppercase leading-none">Task_Mission_Control</h2>
            <p className="text-[10px] text-slate-500 mt-2 uppercase tracking-widest flex items-center gap-2">
                <Zap size={10} className="text-emerald-500" /> System_Status: Nominal // Live_Sync: Enabled
            </p>
          </div>
          <button className="bg-emerald-500 text-black px-8 py-3 rounded-xl text-[10px] font-black uppercase italic hover:bg-emerald-400 hover:scale-105 transition-all shadow-lg shadow-emerald-500/10">
            Initialize_Task
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {['Todo', 'Progress', 'Review'].map(status => (
            <div key={status} className="bg-zinc-950/40 border border-white/5 rounded-[2.5rem] p-6 min-h-[700px] backdrop-blur-sm">
              <div className="text-[10px] font-black uppercase text-slate-500 mb-8 flex items-center justify-between tracking-[0.2em]">
                <span className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${status === 'Progress' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-800'}`} />
                    {status}
                </span>
                <span className="text-[8px] bg-white/5 px-2 py-0.5 rounded-md">{tasks.filter(t => t.status === status).length}</span>
              </div>
              
              <div className="space-y-4">
                {tasks.filter(t => t.status === status).map(task => (
                  <div 
                    key={task.id} 
                    className="p-5 bg-white/[0.02] border border-white/5 rounded-3xl space-y-4 group hover:bg-white/[0.04] hover:border-emerald-500/30 transition-all cursor-pointer"
                  >
                    <div className="flex justify-between items-start">
                        <h4 className="text-xs font-bold uppercase italic text-white group-hover:text-emerald-400 transition-colors leading-tight">{task.title}</h4>
                        {task.priority === 'HIGH' && <div className="w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.5)]" />}
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed uppercase">{task.description}</p>
                    
                    {status === 'Review' && (
                        <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                            <span className="text-[8px] text-emerald-500 font-black uppercase flex items-center gap-1">
                                <CheckCircle2 size={10} /> Verified_Work
                            </span>
                        </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}