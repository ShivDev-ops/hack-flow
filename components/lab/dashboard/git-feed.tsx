"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GitBranch, User, Info, AlertCircle, ChevronLeft, ChevronRight, Zap } from "lucide-react";
import { Commit } from "@/types/common";

interface GitFeedProps {
  commits: Commit[];
  onHoverCommit?: (sha: string | null) => void;
  onStartWiring?: (sha: string) => void;
}

export function GitFeed({ commits, onHoverCommit, onStartWiring }: GitFeedProps) {
  const [page, setPage] = useState(0);
  const itemsPerPage = 5;

  const totalPages = Math.ceil(commits.length / itemsPerPage);
  const currentCommits = useMemo(() => {
    return commits.slice(page * itemsPerPage, (page * itemsPerPage) + itemsPerPage);
  }, [commits, page]);

  const jumpToLatest = () => setPage(0);

  return (
    <div className="glass-panel rim-light rounded-[2rem] p-6 sm:p-8 shadow-2xl flex flex-col bg-white/[0.01] border border-white/5">
       <header className="flex items-center justify-between border-b border-white/5 pb-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-secondary/10 rounded-lg">
              <GitBranch size={20} className="text-secondary" />
            </div>
            <span className="text-[13px] font-black uppercase tracking-[0.3em] font-label-caps text-white">Live_Git_Feed</span>
          </div>
          <div className="flex items-center gap-2">
            {commits.length > 5 && (
              <button 
                onClick={jumpToLatest}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-all active:scale-90"
                title="Jump to Latest"
              >
                <Zap size={14} fill="currentColor" />
              </button>
            )}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-secondary/10 rounded-full border border-secondary/20">
              <div className="w-1.5 h-1.5 bg-secondary rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-secondary uppercase tracking-widest font-label-caps">Syncing</span>
            </div>
          </div>
       </header>

       <div className="space-y-4 mb-6 min-h-[400px]">
          <AnimatePresence mode="wait">
            {commits.length === 0 ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="flex flex-col items-center justify-center py-12 text-center space-y-4"
              >
                <div className="p-4 bg-white/5 rounded-full border border-white/10">
                  <AlertCircle size={28} className="text-white/10" />
                </div>
                <div className="space-y-1">
                  <p className="text-[12px] text-white/40 font-black uppercase tracking-[0.4em] font-label-caps italic">
                    No_Commits_Detected
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key={page}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-4"
              >
                {currentCommits.map((commit) => (
                  <div 
                    key={commit.id}
                    id={`commit-${commit.commit_sha}`}
                    onMouseEnter={() => onHoverCommit?.(commit.commit_sha)}
                    onMouseLeave={() => onHoverCommit?.(null)}
                    className="group border-l-2 border-white/5 hover:border-secondary pl-5 py-5 transition-all bg-white/[0.01] hover:bg-white/[0.03] rounded-r-2xl relative"
                  >
                    {/* Neural Port for Wire System */}
                    <div 
                      id={`commit-port-${commit.commit_sha}`}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        onStartWiring?.(commit.commit_sha);
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white/10 group-hover:bg-secondary transition-all cursor-crosshair z-30 border border-black shadow-[0_0_8px_rgba(255,255,255,0.1)] hover:scale-150" 
                    />
                    
                    <div className="text-[13px] text-white/80 font-medium line-clamp-2 leading-relaxed font-body tracking-tight italic">
                      &quot;{commit.message}&quot;
                    </div>
                    <div className="flex items-center justify-end mt-3">
                      <div className="text-[10px] text-secondary/40 font-data-mono group-hover:text-secondary transition-colors uppercase border border-secondary/10 px-1.5 py-0.5 rounded">
                        {commit.commit_sha?.slice(0, 7)}
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
       </div>

       {/* Pagination Controls */}
       {totalPages > 1 && (
         <div className="flex items-center justify-between border-t border-white/5 pt-4 mb-6">
            <button 
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
              className="flex items-center gap-2 text-[11px] font-black text-white/30 hover:text-white disabled:opacity-20 uppercase tracking-widest transition-all"
            >
              <ChevronLeft size={16} /> Prev
            </button>
            <span className="text-[12px] font-black text-white font-data-mono opacity-40 uppercase">
              {page + 1} / {totalPages}
            </span>
            <button 
              disabled={page === totalPages - 1}
              onClick={() => setPage(p => p + 1)}
              className="flex items-center gap-2 text-[11px] font-black text-white/30 hover:text-white disabled:opacity-20 uppercase tracking-widest transition-all"
            >
              Next <ChevronRight size={16} />
            </button>
         </div>
       )}

       {/* Tactical Tip Section */}
       <footer className="mt-auto">
          <div className="p-4 bg-secondary/5 border border-secondary/10 rounded-2xl flex gap-3 group hover:bg-secondary/10 transition-colors">
            <div className="shrink-0 mt-0.5">
              <Info size={16} className="text-secondary animate-pulse" />
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-black text-secondary uppercase tracking-[0.2em] font-label-caps">Neural_Uplink</p>
              <p className="text-[12px] text-white/40 leading-relaxed font-medium">
                Pushed a commit? Drag a neural wire from your active objective to a commit node above to establish synchronization.
              </p>
            </div>
          </div>
       </footer>
    </div>
  );
}
