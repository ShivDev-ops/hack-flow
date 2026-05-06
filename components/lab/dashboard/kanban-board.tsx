"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GitBranch, Plus, CheckCircle2, Bug, Zap, XCircle, Trash2 } from "lucide-react";
import { Task, Commit } from "@/types/common";
import { CreateTaskModal } from "../create-task-modal";

interface KanbanBoardProps {
  tasks: Task[];
  commits: Commit[];
  updatingId: string | null;
  selectedCommit: Record<string, string>;
  teamId: string;
  eventId: string;
  onMoveTask: (taskId: string, newStatus: string) => void;
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
  
  const columns = [
    { id: 'Todo', title: 'To-Do', color: 'bg-white/20', icon: <Plus size={12}/> },
    { id: 'Progress', title: 'Active_Work', color: 'bg-secondary', icon: <Zap size={12}/> },
    { id: 'Verified', title: 'Completed', color: 'bg-blue-400', icon: <CheckCircle2 size={12}/> },
    { id: 'Bugs', title: 'Bugs', color: 'bg-red-500', icon: <Bug size={12}/> }
  ];

  const handleDragEnd = (event: any, info: any, task: Task) => {
    setActiveDragId(null);
    const point = info.point;
    
    // Find which column the pointer is currently over
    let targetColId = task.status;
    
    Object.entries(columnRefs.current).forEach(([id, el]) => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (
        point.x >= rect.left && 
        point.x <= rect.right && 
        point.y >= rect.top && 
        point.y <= rect.bottom
      ) {
        targetColId = id as any;
      }
    });

    if (targetColId !== task.status) {
      onMoveTask(task.id, targetColId);
    }
  };

  return (
    <>
      <div ref={containerRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {columns.map((col) => {
          const columnTasks = tasks.filter(t => t.status === col.id);
          const isTodo = col.id === 'Todo';
          const isActive = col.id === 'Progress';
          
          // PRIORITY STACKING: Keep column on top if a card is being dragged or UPDATED within it
          const isDraggingInThisCol = columnTasks.some(t => t.id === activeDragId);
          const isUpdatingInThisCol = columnTasks.some(t => t.id === updatingId);
          const hasPriority = isDraggingInThisCol || isUpdatingInThisCol;

          return (
            <div 
              key={col.id} 
              ref={el => { columnRefs.current[col.id] = el; }}
              className={`glass-panel rim-light rounded-[2rem] p-5 flex flex-col min-h-[600px] bg-white/[0.01] border border-white/5 transition-all group ${activeDragId ? 'border-white/10' : ''} ${hasPriority ? 'z-50' : 'z-10'}`}
            >
              <header className="text-[10px] font-black uppercase text-white/40 mb-6 flex items-center justify-between tracking-[0.3em] font-label-caps border-b border-white/5 pb-5">
                <span className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${col.color} ${isActive ? 'animate-pulse shadow-[0_0_10px_#4edea3]' : ''}`} />
                    {col.title}
                </span>
                <div className="flex items-center gap-3 min-w-[24px] justify-end">
                  <span className="bg-white/5 px-2.5 py-1 rounded-full text-white/60 font-data-mono text-[9px] group-hover:opacity-0 transition-all">{columnTasks.length}</span>
                  {isTodo && (
                    <button 
                      onClick={() => setIsModalOpen(true)}
                      className="absolute p-1.5 bg-white text-black rounded-lg hover:bg-zinc-200 transition-all active:scale-90 opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 shadow-xl z-20"
                    >
                      <Plus size={14} />
                    </button>
                  )}
                </div>
              </header>
              
              <div className="space-y-4 flex-1">
                <AnimatePresence mode="popLayout">
                  {columnTasks.map((task) => (
                      <motion.div 
                        layout
                        drag
                        dragConstraints={containerRef}
                        dragElastic={0.05}
                        dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
                        onDragStart={() => setActiveDragId(task.id)}
                        onDragEnd={(e, info) => handleDragEnd(e, info, task)}
                        onMouseEnter={() => onHoverTask?.(task.id)}
                        onMouseLeave={() => onHoverTask?.(null)}
                        whileDrag={{ scale: 1.02, zIndex: 10000, cursor: "grabbing", boxShadow: "0 20px 40px rgba(0,0,0,0.4)" }}
                        key={task.id} 
                        id={`task-card-${task.id}`}
                        className={`p-5 bg-zinc-950 border border-white/10 rounded-2xl space-y-4 shadow-2xl relative group/card cursor-grab active:cursor-grabbing transition-shadow hover:shadow-white/5 ${activeDragId === task.id ? 'opacity-50 border-secondary' : 'z-20'}`}
                      >
                        <div className={`absolute top-0 left-0 w-1 h-full opacity-40 ${col.color}`} />
                        
                        {/* NEURAL PORT - Target point for Wires */}
                        <div 
                          id={`task-port-${task.id}`}
                          className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white/10 group-hover/card:bg-secondary/40 transition-all z-30 border border-white/5 flex items-center justify-center hover:scale-125" 
                        >
                           <div className="w-1 h-1 rounded-full bg-white/40 group-hover/card:bg-secondary" />
                        </div>
                      
                      <div className="flex justify-between items-start gap-3">
                        <div className="space-y-1 pointer-events-none">
                          <h4 className="text-[13px] font-black text-white leading-tight uppercase tracking-tight font-body italic">{task.title}</h4>
                          <p className="text-[10px] text-white/30 font-medium leading-relaxed line-clamp-3 uppercase tracking-tight">{task.description}</p>
                        </div>
                        <div className="flex flex-col gap-2">
                          {task.commit_sha && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); onRemoveLink?.(task.id); }}
                              className="p-1 text-white/10 hover:text-red-500 transition-colors z-30 bg-black/40 rounded-lg border border-white/5"
                              title="Disconnect Neural Link"
                            >
                              <XCircle size={14} />
                            </button>
                          )}
                          <button 
                            onClick={(e) => { e.stopPropagation(); onDeleteTask?.(task.id); }}
                            className="p-1 text-white/10 hover:text-red-500 transition-colors z-30 bg-black/40 rounded-lg border border-white/5"
                            title="Delete Objective"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="pt-2 space-y-3">
                        {task.status === 'Progress' && (
                          <div className="space-y-3 bg-white/[0.03] p-3 rounded-xl border border-white/5">
                            <select 
                              style={{ colorScheme: 'dark' }}
                              className="w-full bg-black/60 border border-white/5 rounded-lg p-2.5 text-[9px] text-white/60 outline-none focus:border-secondary/50 cursor-pointer font-data-mono appearance-none"
                              onChange={(e) => onSelectCommit(task.id, e.target.value)}
                              value={selectedCommit[task.id] || ""}
                              onPointerDown={e => e.stopPropagation()}
                            >
                              <option value="" disabled>Link telemetry...</option>
                              {commits.map(c => (
                                <option key={c.commit_sha} value={c.commit_sha}>
                                  {c.commit_sha.substring(0,7)}: {c.message.substring(0,18)}...
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        <div className="flex items-center justify-between pointer-events-none">
                           {task.commit_sha ? (
                             <div className="flex items-center gap-1.5 text-[8px] font-data-mono text-secondary/60 uppercase">
                                <GitBranch size={10}/> {task.commit_sha.substring(0,7)}
                             </div>
                           ) : <div/>}
                           <div className="text-[8px] text-white/10 font-mono italic">
                             {new Date(task.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                           </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {columnTasks.length === 0 && (
                  <div className="h-24 flex flex-col items-center justify-center opacity-[0.03] group-hover:opacity-20 transition-opacity border-2 border-dashed border-white/20 rounded-3xl pointer-events-none">
                    <Plus size={24} className="mb-2" />
                    <span className="text-[9px] font-black uppercase tracking-widest font-mono">Drop_Objective</span>
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



