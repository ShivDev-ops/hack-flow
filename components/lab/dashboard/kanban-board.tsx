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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {statuses.map((status) => {
        const columnTasks = tasks.filter(t => t.status === status);
        const isTodo = status === 'Todo';
        const isActive = status === 'Progress';
        const isReview = status === 'Review';
        
        const title = isTodo ? "To-Do" : isActive ? "Active" : "Verified";
        const dotColor = isTodo ? "bg-slate-500" : isActive ? "bg-amber-500" : "bg-emerald-500";

        return (
          <div key={status} className="bg-[#1e293b]/30 border border-[#1e293b] rounded-2xl p-4 flex flex-col min-h-[500px]">
            <div className="text-[10px] font-black uppercase text-slate-400 mb-4 flex items-center justify-between tracking-widest border-b border-[#1e293b] pb-3">
              <span className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${dotColor} ${isActive ? 'animate-pulse shadow-[0_0_8px_#f59e0b]' : ''}`} />
                  {title}
              </span>
              <span className="bg-[#1e293b] px-2 py-1 rounded text-white">{columnTasks.length}</span>
            </div>
            
            <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-1">
              <AnimatePresence>
                {columnTasks.map((task) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={task.id} 
                    className="p-4 bg-[#0f172a] border border-[#1e293b] rounded-xl space-y-3 hover:border-emerald-500/50 transition-colors shadow-lg relative group overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent to-transparent group-hover:from-emerald-500/50 transition-all" />
                    
                    <h4 className="text-xs font-bold text-white/90 leading-tight">{task.title}</h4>
                    <p className="text-[10px] text-slate-500 line-clamp-2">{task.description}</p>
                    
                    <div className="pt-2 flex flex-col gap-2">
                      {isTodo && (
                        <button 
                          onClick={() => onMoveTask(task.id, 'Progress')}
                          disabled={updatingId === task.id}
                          className="w-full py-2 bg-[#1e293b] hover:bg-emerald-500 hover:text-black text-[9px] font-black uppercase text-white rounded transition-colors"
                        >
                          {updatingId === task.id ? "..." : "Start Task"}
                        </button>
                      )}

                      {isActive && (
                        <div className="space-y-2 bg-[#1e293b]/50 p-2 rounded-lg border border-[#1e293b]">
                          <div className="text-[8px] uppercase text-emerald-500 font-bold mb-1">Proof of Work</div>
                          <select 
                            className="w-full bg-[#0f172a] border border-[#1e293b] rounded p-1.5 text-[9px] text-white outline-none focus:border-emerald-500 cursor-pointer"
                            onChange={(e) => onSelectCommit(task.id, e.target.value)}
                            value={selectedCommit[task.id] || ""}
                          >
                            <option value="" disabled>Select recent commit...</option>
                            {commits.map(c => (
                              <option key={c.commit_sha} value={c.commit_sha}>
                                {c.commit_sha.substring(0,7)}: {c.message.substring(0,20)}...
                              </option>
                            ))}
                          </select>
                          <button 
                            onClick={() => onMoveTask(task.id, 'Review')}
                            disabled={updatingId === task.id || !selectedCommit[task.id]}
                            className="w-full py-1.5 bg-amber-500/20 text-amber-500 hover:bg-amber-500 hover:text-black text-[9px] font-black uppercase rounded transition-all disabled:opacity-30"
                          >
                             {updatingId === task.id ? "..." : "Link & Complete"}
                          </button>
                        </div>
                      )}

                      {isReview && (
                        <div className="flex flex-col gap-2 border-t border-[#1e293b] pt-2 mt-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] text-emerald-500 font-black uppercase flex items-center gap-1">
                                <CheckCircle2 size={12} /> Verified
                            </span>
                            {task.commit_sha && (
                              <a href="#" className="flex items-center gap-1 text-[9px] font-mono bg-[#1e293b] px-2 py-1 rounded hover:bg-white/10 text-white transition-colors">
                                <GitBranch size={10}/> {task.commit_sha.substring(0,7)}
                              </a>
                            )}
                          </div>
                          <div className="text-[8px] uppercase text-slate-500">+10 Accountability Score</div>
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
