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
    <div className={`glass-panel rim-light rounded-[2.5rem] p-8 shadow-2xl flex flex-col bg-white/[0.01] border border-white/5 ${isHorizontal ? 'w-full' : ''}`}>
       <header className="flex items-center justify-between border-b border-white/5 pb-5 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-secondary/10 rounded-xl">
              <GitBranch size={20} className="text-secondary" />
            </div>
            <span className="text-sm font-black uppercase tracking-widest text-white">GitHub Activity</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-3 px-4 py-1.5 bg-secondary/10 rounded-full border border-secondary/20">
              <div className="w-2 h-2 bg-secondary rounded-full animate-pulse shadow-[0_0_10px_#10b981]" />
              <span className="text-[10px] font-black text-secondary uppercase tracking-widest">Live Sync</span>
            </div>
          </div>
       </header>

       <div className={`${isHorizontal ? 'overflow-x-auto pb-6 custom-scrollbar' : 'space-y-5 mb-8 min-h-[400px]'}`}>
          <AnimatePresence mode="wait">
            {commits.length === 0 ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="flex flex-col items-center justify-center py-12 text-center space-y-4"
              >
                <AlertCircle size={32} className="text-white/10" />
                <p className="text-xs text-white/40 font-black uppercase tracking-widest italic">No commits found yet</p>
              </motion.div>
            ) : (
              <motion.div 
                key={page}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className={isHorizontal ? "flex gap-6 min-w-max px-2" : "space-y-5"}
              >
                {currentCommits.map((commit) => (
                  <div 
                    key={commit.id}
                    id={`commit-${commit.commit_sha}`}
                    onMouseEnter={() => onHoverCommit?.(commit.commit_sha)}
                    onMouseLeave={() => onHoverCommit?.(null)}
                    className={`group transition-all bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 rounded-2xl relative ${
                      isHorizontal ? 'w-[320px] p-6 flex flex-col justify-between h-[150px]' : 'border-l-2 border-l-white/5 hover:border-l-secondary pl-6 py-6'
                    }`}
                  >
                    {/* Neural Port - Positioned at top in horizontal mode for vertical wires */}
                    <div 
                      id={`commit-port-${commit.commit_sha}`}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        onStartWiring?.(commit.commit_sha);
                      }}
                      className={`absolute w-4 h-4 rounded-full bg-white/10 group-hover:bg-secondary transition-all cursor-crosshair z-30 border border-black shadow-[0_0_10px_rgba(255,255,255,0.1)] hover:scale-150 ${
                        isHorizontal ? 'left-1/2 -top-2 -translate-x-1/2' : 'right-4 top-1/2 -translate-y-1/2'
                      }`} 
                    >
                       <div className="absolute inset-0 rounded-full animate-ping bg-secondary/20 group-hover:block hidden" />
                    </div>
                    
                    <div className={`text-sm text-white/70 font-medium leading-relaxed tracking-tight italic ${isHorizontal ? 'line-clamp-2' : 'line-clamp-3'}`}>
                      &quot;{commit.message}&quot;
                    </div>
                    
                    <div className={`flex items-center justify-between mt-4 ${isHorizontal ? '' : ''}`}>
                       <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center">
                             <User size={12} className="text-white/40" />
                          </div>
                          <span className="text-[10px] text-white/30 font-bold uppercase truncate max-w-[100px]">Developer</span>
                       </div>
                       <div className="text-[10px] text-secondary/40 font-bold group-hover:text-secondary transition-colors uppercase border border-secondary/10 px-2 py-0.5 rounded">
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
