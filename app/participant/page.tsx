"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion"; 
import Link from "next/link";
import { Terminal, Activity, GitBranch, Rocket, ShieldCheck, ChevronRight } from "lucide-react";

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
    <div className="font-body selection:bg-emerald-500/30 min-h-screen bg-background text-white overflow-x-hidden">
      
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-[100] transition-all duration-300 ${isScrolled ? 'bg-background/80 backdrop-blur-sm shadow-lg' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 mt-2 sm:mt-4">
          <div className="glass px-4 sm:px-6 py-3 rounded-full flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
              <span className="font-mono font-bold tracking-tighter text-lg sm:text-xl uppercase italic">Hack-Flow <span className="text-emerald-500 text-sm">Lab</span></span>
            </div>
            <a 
              href="/lab/login" 
              className="px-5 py-2 text-xs font-mono border border-emerald-500/50 text-emerald-500 rounded-full hover:bg-emerald-500/10 transition-all flex items-center gap-2"
            >
              Access Node <ChevronRight size={14} />
            </a>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="relative pt-40 pb-24 px-4 sm:px-6 flex flex-col items-center justify-center min-h-[80vh]">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-emerald-500/10 blur-[120px] rounded-full -z-10"></div>
          
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <motion.div {...animProps}>
              <div className="inline-flex items-center gap-2 px-3 py-1 glass rounded-full border border-emerald-500/30 mb-4">
                <span className="font-mono text-[10px] uppercase tracking-widest text-emerald-500">Participant Protocol Active</span>
              </div>
            </motion.div>

            <motion.h1 {...animProps} className="text-5xl sm:text-7xl font-h1 font-extrabold tracking-tight leading-[1.1]">
              Forge the Future.<br/> <span className="text-emerald-500 italic">Deploy the Logic.</span>
            </motion.h1>

            <motion.p {...animProps} className="text-lg text-white/60 max-w-2xl mx-auto leading-relaxed">
              Enter the high-density engineering terminal. Sync your GitHub, track real-time telemetry, and lock in your hackathon tasks before the countdown hits zero.
            </motion.p>

            <motion.div {...animProps} className="pt-8 flex justify-center">
              <a 
                href="/lab/login" 
                className="group px-8 py-4 bg-emerald-500 text-black font-bold text-sm uppercase tracking-widest rounded-lg flex items-center gap-3 hover:bg-emerald-400 hover:scale-105 transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)]"
              >
                Initialize Connection <Rocket size={18} className="group-hover:translate-x-1 transition-transform" />
              </a>
            </motion.div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="py-12 px-4 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div {...animProps} className="glass p-8 rounded-2xl border-t border-emerald-500/20 hover:border-emerald-500/50 transition-colors">
              <GitBranch className="text-emerald-500 mb-6" size={32} />
              <h3 className="text-xl font-bold font-mono uppercase tracking-tight mb-2">Live Git Sync</h3>
              <p className="text-sm text-white/50 leading-relaxed">Connect your commits directly to your task board. Prove your work in real-time.</p>
            </motion.div>
            <motion.div {...animProps} transition={{ delay: 0.1, duration: 0.6 }} className="glass p-8 rounded-2xl border-t border-emerald-500/20 hover:border-emerald-500/50 transition-colors">
              <Terminal className="text-emerald-500 mb-6" size={32} />
              <h3 className="text-xl font-bold font-mono uppercase tracking-tight mb-2">Kanban Matrix</h3>
              <p className="text-sm text-white/50 leading-relaxed">High-speed task tracking. Move objectives from Todo to Review with hard-locked deadlines.</p>
            </motion.div>
            <motion.div {...animProps} transition={{ delay: 0.2, duration: 0.6 }} className="glass p-8 rounded-2xl border-t border-emerald-500/20 hover:border-emerald-500/50 transition-colors">
              <Activity className="text-emerald-500 mb-6" size={32} />
              <h3 className="text-xl font-bold font-mono uppercase tracking-tight mb-2">Squad Telemetry</h3>
              <p className="text-sm text-white/50 leading-relaxed">Monitor your team's objective completion rate and active deployment status instantly.</p>
            </motion.div>
          </div>
        </section>
      </main>
    </div>
  );
}