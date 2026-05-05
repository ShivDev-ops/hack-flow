"use client";

import { motion, AnimatePresence } from "framer-motion";
import { GitBranch, User } from "lucide-react";
import { Commit } from "@/types/common";

interface GitFeedProps {
  commits: Commit[];
}

export function GitFeed({ commits }: GitFeedProps) {
  return (
    <div className="bg-[#1e293b]/50 border border-[#1e293b] rounded-2xl p-5 shadow-xl">
       <header className="flex items-center gap-2 text-white border-b border-white/5 pb-4 mb-4">
          <GitBranch size={16} className="text-emerald-500" />
          <span className="text-xs font-black uppercase tracking-widest">Live Git Feed</span>
       </header>
       <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
          <AnimatePresence>
            {commits.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] text-slate-500 text-center py-8 italic uppercase">No commits detected</motion.div>
            )}
            {commits.map((commit, i) => (
              <motion.div 
                key={commit.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="group border-l-2 border-white/5 hover:border-emerald-500 pl-3 py-2 transition-all bg-white/[0.01] hover:bg-white/[0.03] rounded-r-lg"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-4 h-4 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
                    <User size={10} className="text-slate-300" />
                  </div>
                  <div className="text-[9px] text-emerald-400 font-bold truncate">@{commit.author_handle}</div>
                </div>
                <div className="text-[11px] text-white/90 font-medium line-clamp-2">{commit.message}</div>
                <div className="text-[8px] text-slate-500 uppercase mt-2">
                  {new Date(commit.created_at).toLocaleTimeString()}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
       </div>
    </div>
  );
}
