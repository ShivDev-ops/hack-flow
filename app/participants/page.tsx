"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion"; 
import { Terminal, Activity, GitBranch, Rocket, ChevronRight } from "lucide-react";

export default function ParticipantLanding() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const animProps = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }
  };

  return (
    <div className="font-body selection:bg-secondary/30 min-h-screen bg-background text-white overflow-x-hidden">
      
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-[100] transition-all duration-500 ${isScrolled ? 'bg-background/80 backdrop-blur-md shadow-lg' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="glass-panel rim-light px-6 py-4 rounded-full flex justify-between items-center shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 bg-secondary rounded-full pulse-emerald shadow-[0_0_10px_#4edea3]"></div>
              <span className="font-label-caps font-bold tracking-[0.1em] text-lg sm:text-xl uppercase italic">Hack-Flow <span className="text-secondary text-sm">Lab</span></span>
            </div>
            <a 
              href="/lab/login" 
              className="px-6 py-2.5 text-[10px] font-label-caps font-black border border-secondary/30 text-secondary rounded-full hover:bg-secondary hover:text-black transition-all flex items-center gap-2 uppercase tracking-widest active:scale-95"
            >
              Access Node <ChevronRight size={14} />
            </a>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="relative pt-48 pb-32 px-4 sm:px-6 flex flex-col items-center justify-center min-h-[90vh]">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-secondary/10 blur-[120px] rounded-full -z-10"></div>
          
          <div className="max-w-4xl mx-auto text-center space-y-10">
            <motion.div {...animProps}>
              <div className="inline-flex items-center gap-3 px-4 py-1.5 glass-panel rounded-full border border-secondary/30 mb-6 bg-secondary/5">
                <div className="w-1.5 h-1.5 bg-secondary rounded-full animate-pulse" />
                <span className="font-data-mono text-[10px] uppercase tracking-[0.4em] text-secondary">Participant_Protocol_Active</span>
              </div>
            </motion.div>

            <motion.h1 {...animProps} className="text-6xl sm:text-8xl font-black tracking-tighter leading-[0.9] uppercase italic">
              Forge the Future.<br/> <span className="text-secondary">Deploy Logic.</span>
            </motion.h1>

            <motion.p {...animProps} className="text-xl text-white/40 max-w-2xl mx-auto leading-relaxed font-medium">
              Enter the high-density engineering terminal. Sync your GitHub, track real-time telemetry, and lock in your objectives before the countdown hits zero.
            </motion.p>

            <motion.div {...animProps} className="pt-10 flex justify-center">
              <a 
                href="/lab/login" 
                className="group px-10 py-5 bg-secondary text-black font-black text-xs uppercase tracking-[0.3em] rounded-[1.5rem] flex items-center gap-3 hover:bg-[#5affb4] hover:scale-105 transition-all shadow-[0_0_40px_rgba(78,222,163,0.3)] font-label-caps active:scale-95"
              >
                Initialize_Connection <Rocket size={20} className="group-hover:translate-x-1 transition-transform" />
              </a>
            </motion.div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="py-24 px-4 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div {...animProps} className="glass-panel rim-light p-10 rounded-[2.5rem] hover:border-secondary/30 transition-all duration-500 group">
              <div className="p-4 bg-secondary/5 rounded-2xl w-fit mb-8 group-hover:bg-secondary/10 transition-colors">
                <GitBranch className="text-secondary" size={32} />
              </div>
              <h3 className="text-xl font-black font-label-caps uppercase tracking-tight mb-3 text-white">Live Git Sync</h3>
              <p className="text-sm text-white/30 leading-relaxed font-medium">Connect your commits directly to your task board. Prove your contribution in real-time through verified telemetry.</p>
            </motion.div>

            <motion.div {...animProps} transition={{ delay: 0.1, duration: 0.6 }} className="glass-panel rim-light p-10 rounded-[2.5rem] hover:border-secondary/30 transition-all duration-500 group">
              <div className="p-4 bg-secondary/5 rounded-2xl w-fit mb-8 group-hover:bg-secondary/10 transition-colors">
                <Terminal className="text-secondary" size={32} />
              </div>
              <h3 className="text-xl font-black font-label-caps uppercase tracking-tight mb-3 text-white">Kanban Matrix</h3>
              <p className="text-sm text-white/30 leading-relaxed font-medium">High-speed task tracking. Move objectives from Todo to Review with hard-locked deadlines and automated verification.</p>
            </motion.div>

            <motion.div {...animProps} transition={{ delay: 0.2, duration: 0.6 }} className="glass-panel rim-light p-10 rounded-[2.5rem] hover:border-secondary/30 transition-all duration-500 group">
              <div className="p-4 bg-secondary/5 rounded-2xl w-fit mb-8 group-hover:bg-secondary/10 transition-colors">
                <Activity className="text-secondary" size={32} />
              </div>
              <h3 className="text-xl font-black font-label-caps uppercase tracking-tight mb-3 text-white">Squad Telemetry</h3>
              <p className="text-sm text-white/30 leading-relaxed font-medium">Monitor your team&apos;s objective completion rate and active deployment status instantly via the unified mission control.</p>
            </motion.div>
          </div>
        </section>
      </main>
    </div>
  );
}