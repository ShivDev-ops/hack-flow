"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GitBranch, Plus, CheckCircle2, Bug, Zap, XCircle, Trash2, Eye } from "lucide-react";
import { Task, Commit } from "@/types/common";
import { CreateTaskModal } from "../create-task-modal";

interface KanbanBoardProps {
  tasks: Task[];
  commits: Commit[];
  updatingId: string | null;
  selectedCommit: Record<string, string>;
  teamId: string;
  eventId: string;
  userRole?: string;
  onMoveTask: (taskId: string, newStatus: string, reason?: string) => void;
  onSelectCommit: (taskId: string, commitSha: string) => void;
  onRefresh: () => void;
  onHoverTask?: (taskId: string | null) => void;
  onRemoveLink?: (taskId: string) => void;
  onDeleteTask?: (taskId: string) => void;
}

export function KanbanBoard({ 
  tasks, 
  commits, 
  updatingId, 
  selectedCommit, 
  teamId,
  eventId,
  userRole,
  onMoveTask,
  onSelectCommit,
  onRefresh,
  onHoverTask,
  onRemoveLink,
  onDeleteTask
}: KanbanBoardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const columnRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isLead = userRole === 'LEAD';
  
  const columns = [
    { id: 'Todo', title: 'To Do', color: 'bg-white/20', icon: <Plus size={14}/> },
    { id: 'Progress', title: 'In Progress', color: 'bg-secondary', icon: <Zap size={14}/> },
    { id: 'Review', title: 'Review', color: 'bg-amber-400', icon: <Eye size={14}/> },
    { id: 'Verified', title: 'Completed', color: 'bg-blue-400', icon: <CheckCircle2 size={14}/> },
    { id: 'Bugs', title: 'Issues', color: 'bg-red-500', icon: <Bug size={14}/> }
  ];

  const handleDragEnd = (event: any, info: any, task: Task) => {
    setActiveDragId(null);
    const point = info.point;
    
    // Find which column the pointer is currently over
    let targetColId = null;
    
    Object.entries(columnRefs.current).forEach(([id, el]) => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (
        point.x >= rect.left && 
        point.x <= rect.right && 
        point.y >= rect.top && 
        point.y <= rect.bottom
      ) {
        targetColId = id;
      }
    });

    // If dropped in "middle" (no column match) or same column, it will naturally return via layout prop
    if (targetColId && targetColId !== task.status) {
      if (targetColId === 'Todo' && task.status === 'Review' && isLead) {
          const reason = prompt("Enter rejection reason:");
          if (reason !== null) onMoveTask(task.id, targetColId, reason);
      } else {
          onMoveTask(task.id, targetColId);
      }
    }
  };

  return (
    <>
      <div ref={containerRef} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
        {columns.map((col) => {
          const columnTasks = tasks.filter(t => t.status === col.id);
          const isTodo = col.id === 'Todo';
          const isReview = col.id === 'Review';
          const isActive = col.id === 'Progress';
          
          // PRIORITY STACKING: Keep column on top if a card is being dragged or UPDATED within it
          const isDraggingInThisCol = columnTasks.some(t => t.id === activeDragId);
          const isUpdatingInThisCol = columnTasks.some(t => t.id === updatingId);
          const hasPriority = isDraggingInThisCol || isUpdatingInThisCol;

          return (
            <div 
              key={col.id} 
              ref={el => { columnRefs.current[col.id] = el; }}
              className={`glass-panel rim-light rounded-[2.5rem] p-6 flex flex-col min-h-[600px] bg-white/[0.01] border border-white/5 transition-all group ${activeDragId ? 'border-white/10' : ''} ${hasPriority ? 'z-50' : 'z-10'}`}
            >
              <header className="text-sm font-black uppercase text-white/40 mb-8 flex items-center justify-between tracking-widest border-b border-white/5 pb-6">
                <span className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${col.color} ${isActive ? 'animate-pulse shadow-[0_0_10px_#4edea3]' : ''}`} />
                    {col.title}
                </span>
                <div className="flex items-center gap-4 min-w-[24px] justify-end">
                  <span className="bg-white/5 px-3 py-1 rounded-full text-white/60 font-bold text-xs group-hover:opacity-0 transition-all">{columnTasks.length}</span>
                  {isTodo && (
                    <button 
                      onClick={() => setIsModalOpen(true)}
                      className="absolute p-2.5 bg-white text-black rounded-xl hover:bg-zinc-200 transition-all active:scale-90 opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 shadow-2xl z-20"
                    >
                      <Plus size={18} />
                    </button>
                  )}
                </div>
              </header>
              
              <div className="space-y-5 flex-1">
                <AnimatePresence mode="popLayout">
                  {columnTasks.map((task) => (
                      <motion.div 
                        layout
                        drag
                        dragConstraints={containerRef}
                        dragElastic={0.02}
                        dragTransition={{ bounceStiffness: 1000, bounceDamping: 40 }}
                        onDragStart={() => setActiveDragId(task.id)}
                        onDragEnd={(e, info) => handleDragEnd(e, info, task)}
                        onMouseEnter={() => onHoverTask?.(task.id)}
                        onMouseLeave={() => onHoverTask?.(null)}
                        whileDrag={{ 
                          scale: 0.8, 
                          zIndex: 10000, 
                          cursor: "grabbing", 
                          boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
                          opacity: 0.9 
                        }}
                        key={task.id} 
                        id={`task-card-${task.id}`}
                        className={`p-6 bg-zinc-950 border border-white/10 rounded-3xl space-y-6 shadow-2xl relative group/card cursor-grab active:cursor-grabbing transition-shadow hover:shadow-white/5 ${activeDragId === task.id ? 'opacity-50 border-secondary' : 'z-20'}`}
                      >
                        <div className={`absolute top-0 left-0 w-2 h-full opacity-40 ${col.color}`} />
                        
                        {/* NEURAL PORT - Target point for Wires */}
                        <div 
                          id={`task-port-${task.id}`}
                          className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white/10 group-hover/card:bg-secondary/40 transition-all z-30 border border-white/5 flex items-center justify-center hover:scale-125" 
                        >
                           <div className="w-1.5 h-1.5 rounded-full bg-white/40 group-hover/card:bg-secondary" />
                        </div>
                      
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-2 pointer-events-none flex-1">
                          {task.title?.includes("[PHASE") ? (
                            <div className="flex flex-col gap-2">
                               <div className="flex items-center gap-2">
                                  <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest border ${
                                    task.title?.includes("PHASE 1") ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                                    task.title?.includes("PHASE 2") ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                                    "bg-purple-500/10 text-purple-400 border-purple-500/20"
                                  }`}>
                                    {task.title?.match(/\[PHASE \d\]/)?.[0].replace(/[\[\]]/g, "")}
                                  </span>
                               </div>
                               <h4 className="text-lg font-black text-white leading-tight uppercase tracking-tight italic">
                                 {task.title?.replace(/\[PHASE \d\]\s*/, "")}
                               </h4>
                            </div>
                          ) : (
                            <h4 className="text-lg font-black text-white leading-tight uppercase tracking-tight italic">{task.title}</h4>
                          )}
                          <p className="text-sm text-white/40 font-medium leading-relaxed line-clamp-3 italic">{task.description}</p>
                        </div>
                        <div className="flex flex-col gap-3">
                          {task.commit_sha && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); onRemoveLink?.(task.id); }}
                              className="p-2 text-white/10 hover:text-red-500 transition-colors z-30 bg-black/40 rounded-xl border border-white/5"
                              title="Remove commit link"
                            >
                              <XCircle size={18} />
                            </button>
                          )}
                          <button 
                            onClick={(e) => { e.stopPropagation(); onDeleteTask?.(task.id); }}
                            className="p-2 text-white/10 hover:text-red-500 transition-colors z-30 bg-black/40 rounded-xl border border-white/5"
                            title="Delete Task"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="pt-2 space-y-4">
                        {isReview && isLead && (
                             <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const reason = prompt("Enter rejection reason:");
                                    if (reason !== null) onMoveTask(task.id, 'Todo', reason);
                                }}
                                className="w-full py-3 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 font-black text-[11px] rounded-xl border border-red-500/20 transition-all uppercase tracking-widest mb-2"
                             >
                                Needs Changes
                             </button>
                        )}

                        {task.status === 'Progress' && (
                          <div className="space-y-3 bg-white/[0.03] p-4 rounded-2xl border border-white/5">
                            <select 
                              style={{ colorScheme: 'dark' }}
                              className="w-full bg-black/60 border border-white/5 rounded-xl p-3.5 text-xs text-white/60 outline-none focus:border-secondary/50 cursor-pointer font-bold appearance-none"
                              onChange={(e) => onSelectCommit(task.id, e.target.value)}
                              value={selectedCommit[task.id] || ""}
                              onPointerDown={e => e.stopPropagation()}
                            >
                              <option value="" disabled>Attach GitHub commit...</option>
                              {commits.map(c => (
                                <option key={c.commit_sha} value={c.commit_sha}>
                                  {c.commit_sha.substring(0,7)}: {c.message.substring(0,24)}...
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        <div className="flex items-center justify-between pointer-events-none">
                           {task.commit_sha ? (
                             <div className="flex items-center gap-2 text-xs font-bold text-secondary/60 uppercase">
                                <GitBranch size={14}/> {task.commit_sha.substring(0,7)}
                             </div>
                           ) : <div/>}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {columnTasks.length === 0 && (
                  <div className="h-32 flex flex-col items-center justify-center opacity-[0.03] group-hover:opacity-20 transition-opacity border-2 border-dashed border-white/20 rounded-[2.5rem] pointer-events-none">
                    <Plus size={40} className="mb-3" />
                    <span className="text-xs font-black uppercase tracking-widest">Add Task</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <CreateTaskModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        teamId={teamId}
        eventId={eventId}
        onSuccess={onRefresh}
      />
    </>
  );
}



