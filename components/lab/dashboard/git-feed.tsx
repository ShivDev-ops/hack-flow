"use client";

import { motion, AnimatePresence } from "framer-motion";
import { GitBranch, User, Info, AlertCircle } from "lucide-react";
import { Commit } from "@/types/common";

interface GitFeedProps {
  commits: Commit[];
}

export function GitFeed({ commits }: GitFeedProps) {
  return (
    <div className="glass-panel rim-light rounded-[2rem] p-6 sm:p-8 shadow-2xl h-full flex flex-col bg-white/[0.01]">
       <header className="flex items-center justify-between border-b border-white/5 pb-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-secondary/10 rounded-lg">
              <GitBranch size={18} className="text-secondary" />
            </div>
            <span className="text-[11px] font-black uppercase tracking-[0.3em] font-label-caps text-white">Live_Git_Feed</span>
          </div>
          {commits.length > 0 && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-secondary/10 rounded-full border border-secondary/20">
              <div className="w-1 h-1 bg-secondary rounded-full animate-pulse" />
              <span className="text-[8px] font-black text-secondary uppercase tracking-widest font-label-caps">Syncing</span>
            </div>
          )}
       </header>

       <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2 mb-6">
          <AnimatePresence mode="popLayout">
            {commits.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="flex flex-col items-center justify-center py-12 text-center space-y-4"
              >
                <div className="p-4 bg-white/5 rounded-full border border-white/10">
                  <AlertCircle size={24} className="text-white/10" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.4em] font-label-caps italic">
                    No_Commits_Detected
                  </p>
                  <p className="text-[9px] text-white/20 uppercase tracking-widest leading-relaxed max-w-[200px] font-medium">
                    Telemetry uplink waiting for initial handshake.
                  </p>
                </div>
              </motion.div>
            ) : (
              commits.map((commit, i) => (
                <motion.div 
                  key={commit.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ delay: i * 0.05, ease: "easeOut" }}
                  className="group border-l-2 border-white/5 hover:border-secondary pl-4 py-4 transition-all bg-white/[0.01] hover:bg-white/[0.03] rounded-r-2xl"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center shrink-0 border border-white/5">
                      <User size={10} className="text-white/40" />
                    </div>
                    <div className="text-[10px] text-secondary font-black truncate font-label-caps tracking-widest uppercase">
                      @{commit.author_handle}
                    </div>
                  </div>
                  <div className="text-[12px] text-white/90 font-medium line-clamp-2 leading-relaxed font-body tracking-tight italic">
                    &quot;{commit.message}&quot;
                  </div>
                  <div className="flex items-center justify-between mt-4">
                     <div className="text-[8px] text-white/20 uppercase font-data-mono tracking-widest flex items-center gap-1.5">
                      <div className="w-1 h-1 bg-white/10 rounded-full" />
                      {new Date(commit.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="text-[8px] text-secondary/40 font-data-mono group-hover:text-secondary transition-colors uppercase border border-secondary/10 px-1.5 py-0.5 rounded">
                      {commit.commit_sha?.slice(0, 7)}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
       </div>

       {/* Tactical Tip Section */}
       <footer className="mt-auto">
          <div className="p-4 bg-secondary/5 border border-secondary/10 rounded-2xl flex gap-3 group hover:bg-secondary/10 transition-colors">
            <div className="shrink-0 mt-0.5">
              <Info size={14} className="text-secondary animate-pulse" />
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-black text-secondary uppercase tracking-[0.2em] font-label-caps">Tactical_Tip</p>
              <p className="text-[10px] text-white/40 leading-relaxed font-medium">
                Pushed a commit but don&apos;t see it? Ensure your Webhook is active. GitHub only streams <span className="text-white/60 underline decoration-secondary/30">future events</span> after setup.
              </p>
            </div>
          </div>
       </footer>
    </div>
  );
}
