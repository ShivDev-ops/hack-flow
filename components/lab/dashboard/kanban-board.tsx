"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, GitBranch } from "lucide-react";
import { Task, Commit } from "@/types/common";

interface KanbanBoardProps {
  tasks: Task[];
  commits: Commit[];
  updatingId: string | null;
  selectedCommit: Record<string, string>;
  onMoveTask: (taskId: string, newStatus: string) => void;
  onSelectCommit: (taskId: string, commitSha: string) => void;
}

export function KanbanBoard({ 
  tasks, 
  commits, 
  updatingId, 
  selectedCommit, 
  onMoveTask,
  onSelectCommit
}: KanbanBoardProps) {
  const statuses = ['Todo', 'Progress', 'Review'];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {statuses.map((status) => {
        const columnTasks = tasks.filter(t => t.status === status);
        const isTodo = status === 'Todo';
        const isActive = status === 'Progress';
        const isReview = status === 'Review';
        
        const title = isTodo ? "Backlog" : isActive ? "Active_Work" : "Awaiting_Verification";
        const dotColor = isTodo ? "bg-white/20" : isActive ? "bg-secondary" : "bg-amber-500";

        return (
          <div key={status} className="glass-panel rim-light rounded-[2rem] p-6 flex flex-col min-h-[600px] bg-white/[0.01]">
            <div className="text-[10px] font-black uppercase text-white/40 mb-6 flex items-center justify-between tracking-[0.3em] font-label-caps border-b border-white/5 pb-5">
              <span className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${dotColor} ${isActive ? 'animate-pulse shadow-[0_0_10px_#4edea3]' : ''}`} />
                  {title}
              </span>
              <span className="bg-white/5 px-3 py-1 rounded-full text-white/60 font-data-mono text-[9px]">{columnTasks.length}</span>
            </div>
            
            <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-1">
              <AnimatePresence mode="popLayout">
                {columnTasks.map((task) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={task.id} 
                    className="p-6 bg-black/40 border border-white/10 rounded-2xl space-y-4 hover:border-secondary/40 transition-all shadow-xl relative group overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-secondary/0 group-hover:bg-secondary/40 transition-all" />
                    
                    <h4 className="text-sm font-black text-white leading-tight uppercase tracking-tight">{task.title}</h4>
                    <p className="text-[11px] text-white/40 font-medium leading-relaxed line-clamp-2">{task.description}</p>
                    
                    <div className="pt-2">
                      {isTodo && (
                        <button 
                          onClick={() => onMoveTask(task.id, 'Progress')}
                          disabled={updatingId === task.id}
                          className="w-full py-3 bg-white/5 hover:bg-secondary hover:text-black text-[10px] font-black uppercase tracking-widest text-white rounded-xl transition-all font-label-caps active:scale-95 disabled:opacity-30"
                        >
                          {updatingId === task.id ? "Initializing..." : "Start_Objective"}
                        </button>
                      )}

                      {isActive && (
                        <div className="space-y-4 bg-secondary/5 p-4 rounded-xl border border-secondary/10">
                          <div className="text-[9px] uppercase text-secondary font-black tracking-widest font-label-caps flex items-center gap-2">
                            <GitBranch size={12} /> Proof_of_Work
                          </div>
                          <select 
                            style={{ colorScheme: 'dark' }}
                            className="w-full bg-black/60 border border-white/10 rounded-lg p-3 text-[10px] text-white outline-none focus:border-secondary/50 cursor-pointer font-data-mono transition-all appearance-none"
                            onChange={(e) => onSelectCommit(task.id, e.target.value)}
                            value={selectedCommit[task.id] || ""}
                          >
                            <option value="" disabled className="text-white/20">Select commit telemetry...</option>
                            {commits.map(c => (
                              <option key={c.commit_sha} value={c.commit_sha} className="bg-zinc-900">
                                {c.commit_sha.substring(0,7)}: {c.message.substring(0,24)}...
                              </option>
                            ))}
                          </select>
                          <button 
                            onClick={() => onMoveTask(task.id, 'Review')}
                            disabled={updatingId === task.id || !selectedCommit[task.id]}
                            className="w-full py-3 bg-secondary text-black hover:bg-[#5affb4] text-[10px] font-black uppercase tracking-widest rounded-xl transition-all font-label-caps shadow-lg active:scale-95 disabled:opacity-30 disabled:bg-white/10 disabled:text-white/20"
                          >
                             {updatingId === task.id ? "Syncing..." : "Submit_Telemetery"}
                          </button>
                        </div>
                      )}

                      {isReview && (
                        <div className="flex flex-col gap-3 border-t border-white/5 pt-4 mt-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-amber-500 font-black uppercase flex items-center gap-2 tracking-widest font-label-caps">
                                <Loader2 size={12} className="animate-spin" /> Pending_Verify
                            </span>
                            {task.commit_sha && (
                              <div className="flex items-center gap-2 text-[9px] font-data-mono bg-white/5 px-3 py-1.5 rounded-lg text-secondary border border-white/5">
                                <GitBranch size={10}/> {task.commit_sha.substring(0,7)}
                              </div>
                            )}
                          </div>
                          <p className="text-[8px] uppercase text-white/20 font-bold tracking-[0.2em] font-label-caps">Awaiting Project Lead validation</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        );
      })}
    </div>
  );
}
