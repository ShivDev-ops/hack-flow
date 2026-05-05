"use client";

import { motion, AnimatePresence } from "framer-motion";
import { GitBranch, User } from "lucide-react";
import { Commit } from "@/types/common";

interface GitFeedProps {
  commits: Commit[];
}

export function GitFeed({ commits }: GitFeedProps) {
  return (
    <div className="glass-panel rim-light rounded-[2rem] p-8 shadow-2xl h-full flex flex-col bg-white/[0.01]">
       <header className="flex items-center gap-3 text-white border-b border-white/5 pb-6 mb-6">
          <div className="p-2 bg-secondary/10 rounded-lg">
            <GitBranch size={18} className="text-secondary" />
          </div>
          <span className="text-[11px] font-black uppercase tracking-[0.3em] font-label-caps">Live_Git_Feed</span>
       </header>
       <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2">
          <AnimatePresence mode="popLayout">
            {commits.length === 0 && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="text-[10px] text-white/20 text-center py-20 italic uppercase tracking-[0.4em] font-data-mono"
              >
                No_Commits_Detected
              </motion.div>
            )}
            {commits.map((commit, i) => (
              <motion.div 
                key={commit.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: i * 0.05, ease: "easeOut" }}
                className="group border-l-2 border-white/5 hover:border-secondary pl-4 py-3 transition-all bg-white/[0.01] hover:bg-white/[0.03] rounded-r-2xl"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center shrink-0 border border-white/5">
                    <User size={10} className="text-white/40" />
                  </div>
                  <div className="text-[10px] text-secondary font-black truncate font-label-caps tracking-widest">@{commit.author_handle}</div>
                </div>
                <div className="text-[12px] text-white font-medium line-clamp-2 leading-snug">{commit.message}</div>
                <div className="flex items-center justify-between mt-3">
                   <div className="text-[8px] text-white/20 uppercase font-data-mono tracking-widest">
                    {new Date(commit.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="text-[8px] text-secondary/40 font-data-mono group-hover:text-secondary transition-colors uppercase">
                    {commit.commit_sha?.slice(0, 7)}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
       </div>
    </div>
  );
}
