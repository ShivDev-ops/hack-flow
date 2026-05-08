"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GitBranch, User, Info, AlertCircle, ChevronLeft, ChevronRight, Zap } from "lucide-react";
import { Commit } from "@/types/common";

interface GitFeedProps {
  commits: Commit[];
  onHoverCommit?: (sha: string | null) => void;
  onStartWiring?: (sha: string) => void;
  layout?: 'vertical' | 'horizontal';
}

export function GitFeed({ commits, onHoverCommit, onStartWiring, layout = 'vertical' }: GitFeedProps) {
  const [page, setPage] = useState(0);
  const itemsPerPage = layout === 'horizontal' ? 10 : 5;

  const totalPages = Math.ceil(commits.length / itemsPerPage);
  const currentCommits = useMemo(() => {
    return commits.slice(page * itemsPerPage, (page * itemsPerPage) + itemsPerPage);
  }, [commits, page, itemsPerPage]);

  const jumpToLatest = () => setPage(0);

  const isHorizontal = layout === 'horizontal';

  return (
    <div className={`glass-panel rim-light rounded-[2rem] p-6 shadow-2xl flex flex-col bg-white/[0.01] border border-white/5 ${isHorizontal ? 'w-full' : ''}`}>
       <header className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-secondary/10 rounded-lg">
              <GitBranch size={16} className="text-secondary" />
            </div>
            <span className="text-[12px] font-black uppercase tracking-[0.3em] font-label-caps text-white">Neural_Link_Feed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-secondary/10 rounded-full border border-secondary/20">
              <div className="w-1.5 h-1.5 bg-secondary rounded-full animate-pulse" />
              <span className="text-[9px] font-black text-secondary uppercase tracking-widest font-label-caps">Active_Sync</span>
            </div>
          </div>
       </header>

       <div className={`${isHorizontal ? 'overflow-x-auto pb-4 custom-scrollbar' : 'space-y-4 mb-6 min-h-[400px]'}`}>
          <AnimatePresence mode="wait">
            {commits.length === 0 ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="flex flex-col items-center justify-center py-8 text-center space-y-4"
              >
                <AlertCircle size={24} className="text-white/10" />
                <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.4em] font-label-caps italic">No_Commits</p>
              </motion.div>
            ) : (
              <motion.div 
                key={page}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className={isHorizontal ? "flex gap-4 min-w-max px-2" : "space-y-4"}
              >
                {currentCommits.map((commit) => (
                  <div 
                    key={commit.id}
                    id={`commit-${commit.commit_sha}`}
                    onMouseEnter={() => onHoverCommit?.(commit.commit_sha)}
                    onMouseLeave={() => onHoverCommit?.(null)}
                    className={`group transition-all bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 rounded-2xl relative ${
                      isHorizontal ? 'w-[280px] p-4 flex flex-col justify-between h-[120px]' : 'border-l-2 border-l-white/5 hover:border-l-secondary pl-5 py-5'
                    }`}
                  >
                    {/* Neural Port - Positioned at top in horizontal mode for vertical wires */}
                    <div 
                      id={`commit-port-${commit.commit_sha}`}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        onStartWiring?.(commit.commit_sha);
                      }}
                      className={`absolute w-3 h-3 rounded-full bg-white/10 group-hover:bg-secondary transition-all cursor-crosshair z-30 border border-black shadow-[0_0_8px_rgba(255,255,255,0.1)] hover:scale-150 ${
                        isHorizontal ? 'left-1/2 -top-1.5 -translate-x-1/2' : 'right-4 top-1/2 -translate-y-1/2'
                      }`} 
                    >
                       <div className="absolute inset-0 rounded-full animate-ping bg-secondary/20 group-hover:block hidden" />
                    </div>
                    
                    <div className={`text-[12px] text-white/70 font-medium leading-relaxed font-body tracking-tight italic ${isHorizontal ? 'line-clamp-2' : 'line-clamp-3'}`}>
                      &quot;{commit.message}&quot;
                    </div>
                    
                    <div className={`flex items-center justify-between mt-3 ${isHorizontal ? '' : ''}`}>
                       <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center">
                             <User size={10} className="text-white/40" />
                          </div>
                          <span className="text-[9px] text-white/30 font-bold uppercase truncate max-w-[80px]">Developer</span>
                       </div>
                       <div className="text-[9px] text-secondary/40 font-data-mono group-hover:text-secondary transition-colors uppercase border border-secondary/10 px-1.5 py-0.5 rounded">
                        {commit.commit_sha?.slice(0, 7)}
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
       </div>
    </div>
  );
}
