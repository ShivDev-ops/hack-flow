"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion"; 
import Link from "next/link";
import { 
  Terminal, Activity, ShieldCheck, Network, 
  Rocket, Menu, X, Zap, 
  Users, Laptop
} from "lucide-react";
import { ParticleBackground } from "@/components/ui/particle-background";

/**
 * UI/UX PRO MAX REFINE: HACK-FLOW LANDING
 * Focus: Optimized Scale, Visual Balance, Professional Hierarchy
 * Style: Clean Cyber / Tactical Minimal
 */

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const animProps = {
    initial: { opacity: 0, y: 15 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const }
  };

  return (
    <div className="font-sans selection:bg-secondary/30 min-h-screen bg-[#020203] text-white overflow-x-hidden relative">
      
      {/* INTERACTIVE BACKGROUND ENGINE */}
      <ParticleBackground />

      {/* AMBIENT BACKGROUND */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-5%] left-1/4 w-[500px] h-[500px] bg-secondary/5 blur-[120px] rounded-full animate-pulse opacity-40"></div>
        <div className="absolute bottom-[-5%] right-1/4 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full opacity-20"></div>
        <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
      </div>

      {/* NAV: SLICK_COMMAND_BAR */}
      <nav className={`fixed top-0 w-full z-[100] transition-all duration-500 ${isScrolled ? "py-3" : "py-6"}`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className={`px-6 py-3.5 rounded-2xl flex justify-between items-center border border-white/5 transition-all duration-500 ${isScrolled ? "bg-black/60 backdrop-blur-2xl shadow-xl scale-[0.99]" : "bg-transparent"}`}>
            
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-2.5 h-2.5 bg-secondary rounded-full shadow-[0_0_15px_#10b981]"></div>
              <span className="font-bold tracking-tighter text-xl uppercase group-hover:text-secondary transition-colors italic">Hack-Flow</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex gap-10 items-center font-bold text-[10px] uppercase tracking-widest text-white/30">
              <Link href="/dashboard" className="hover:text-white transition-all">Overview</Link>
              <Link href="#features" className="hover:text-white transition-all">Logic</Link>
              <Link href="#pricing" className="hover:text-white transition-all">Tiers</Link>
            </div>

            {/* Tactical Actions */}
            <div className="hidden lg:flex gap-4 items-center">
              <Link href="/login" className="px-5 py-2 text-[10px] font-bold uppercase tracking-widest text-white/50 hover:text-white transition-all">Organizer</Link>
              <Link href="/dashboard" className="px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest bg-secondary text-black rounded-xl hover:bg-[#5affb4] transition-all shadow-[0_0_20px_rgba(16,185,129,0.15)]">Launch Node</Link>
            </div>

            <button className="lg:hidden text-white p-2" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Flyout */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="lg:hidden absolute top-full left-0 w-full px-6 pt-3">
              <div className="bg-[#0A0A0B] border border-white/10 rounded-3xl p-6 flex flex-col gap-4 font-bold text-[11px] uppercase tracking-widest shadow-2xl">
                <Link href="/dashboard" className="py-3 px-4 rounded-xl hover:bg-white/5" onClick={() => setIsMobileMenuOpen(false)}>Dashboard</Link>
                <Link href="#features" className="py-3 px-4 rounded-xl hover:bg-white/5" onClick={() => setIsMobileMenuOpen(false)}>Features</Link>
                <Link href="#pricing" className="py-3 px-4 rounded-xl hover:bg-white/5" onClick={() => setIsMobileMenuOpen(false)}>Tiers</Link>
                <div className="h-px bg-white/5 mx-4 my-1"></div>
                <Link href="/login" className="py-3 px-4 text-white/40">Organizer</Link>
                <Link href="/dashboard" className="py-4 bg-secondary text-black rounded-2xl text-center">Launch Node</Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <main>
        {/* HERO: OPTIMIZED_SCALE */}
        <section className="relative pt-48 pb-24 px-6 flex flex-col items-center justify-center min-h-[85vh] text-center">
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-full max-w-6xl h-[600px] bg-secondary/5 blur-[140px] rounded-full -z-10 pointer-events-none"></div>
          
          <div className="max-w-4xl mx-auto space-y-8">
            <motion.div {...animProps}>
              <div className="inline-flex items-center gap-2.5 px-4 py-1.5 bg-white/[0.03] backdrop-blur-md rounded-full border border-white/10 mb-2 shadow-lg">
                <Zap size={12} className="text-secondary fill-secondary" />
                <span className="font-bold text-[10px] uppercase tracking-[0.3em] text-white/60">Mission Control // v4.5</span>
              </div>
            </motion.div>

            <motion.h1 {...animProps} className="text-5xl sm:text-6xl lg:text-[100px] font-black tracking-tighter leading-[0.95] uppercase italic text-white flex flex-col items-center">
              <span>Powerful</span>
              <span className="text-gradient">Hackathons.</span>
            </motion.h1>

            <motion.p {...animProps} className="text-lg md:text-xl text-white/40 max-w-2xl mx-auto leading-relaxed font-medium uppercase tracking-tight italic">
              Deploy high-octane engineering infrastructure in minutes. Track every pulse, verify every commit, scale your vision.
            </motion.p>

            <motion.div {...animProps} className="flex flex-col sm:flex-row gap-5 justify-center items-center pt-8">
              <Link href="/dashboard" className="w-full sm:w-auto px-10 py-5 bg-white text-black font-black text-[11px] uppercase tracking-[0.2em] rounded-2xl flex items-center justify-center gap-3 hover:bg-secondary transition-all hover:scale-105 shadow-xl active:scale-95">
                <Users size={18} /> Organizer Center
              </Link>
              <Link href="/lab/login" className="w-full sm:w-auto px-10 py-5 bg-white/[0.03] border border-white/10 text-white font-black text-[11px] uppercase tracking-[0.2em] rounded-2xl flex items-center justify-center gap-3 hover:bg-white/10 transition-all backdrop-blur-md active:scale-95">
                <Laptop size={18} /> For Participants
              </Link>
            </motion.div>
          </div>
        </section>

        {/* FEATURES: REBUILT_SYMMETRICAL_BENTO */}
        <section id="features" className="py-24 sm:py-32 px-6 max-w-7xl mx-auto space-y-16 sm:space-y-24">
          <div className="space-y-4 text-center lg:text-left">
            <span className="font-bold text-[11px] text-secondary uppercase tracking-[0.4em] block">Tactical Engine</span>
            <h2 className="text-3xl sm:text-5xl font-black italic tracking-tighter uppercase leading-none">Engineered for scale.</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {/* ROW 1 */}
            <motion.div {...animProps} className="bg-white/[0.02] border border-white/5 p-8 sm:p-12 rounded-[2.5rem] relative overflow-hidden group hover:border-secondary/30 transition-all duration-700 shadow-xl flex flex-col justify-between h-full min-h-[320px]">
              <div>
                <Terminal className="text-secondary mb-6" size={32} />
                <h3 className="text-2xl sm:text-3xl font-black uppercase italic mb-4">Zero-Config Onboarding</h3>
                <p className="text-sm sm:text-base text-white/40 leading-relaxed font-medium uppercase tracking-tight italic">
                  Link your source and let our system handle the mapping. No manual entry, just instant mission-ready datasets.
                </p>
              </div>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-secondary to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </motion.div>

            <motion.div {...animProps} className="bg-white/[0.02] border border-white/5 p-8 sm:p-12 rounded-[2.5rem] relative overflow-hidden group hover:border-primary/30 transition-all duration-700 shadow-xl flex flex-col justify-between h-full min-h-[320px]">
              <div>
                <Activity className="text-primary mb-6" size={32} />
                <h3 className="text-2xl sm:text-3xl font-black uppercase italic mb-4">Live Engineering Pulse</h3>
                <p className="text-sm sm:text-base text-white/40 leading-relaxed font-medium uppercase tracking-tight italic">
                  Monitor every single GitHub commit and deployment health in real-time as it happens across your entire fleet.
                </p>
              </div>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </motion.div>

            {/* ROW 2 */}
            <motion.div {...animProps} className="bg-white/[0.02] border border-white/5 p-8 sm:p-12 rounded-[2.5rem] relative overflow-hidden group hover:border-white/20 transition-all duration-700 shadow-xl flex flex-col justify-between h-full min-h-[320px]">
              <div>
                <ShieldCheck className="text-white mb-6" size={32} />
                <h3 className="text-2xl sm:text-3xl font-black uppercase italic mb-4">Verified Proof of Work</h3>
                <p className="text-sm sm:text-base text-white/40 leading-relaxed font-medium uppercase tracking-tight italic">
                  Enforce accountability. Every task completion requires a verified GitHub commit hash for automated validation.
                </p>
              </div>
            </motion.div>

            <motion.div {...animProps} className="bg-white/[0.02] border border-white/5 p-8 sm:p-12 rounded-[2.5rem] relative overflow-hidden group hover:border-emerald-500/20 transition-all duration-700 shadow-xl flex flex-col justify-between h-full min-h-[320px]">
              <div>
                <Network className="text-secondary mb-6" size={32} />
                <h3 className="text-2xl sm:text-3xl font-black uppercase italic mb-4">Legacy Data Uplink</h3>
                <p className="text-sm sm:text-base text-white/40 leading-relaxed font-medium uppercase tracking-tight italic">
                  Automatically sync winning projects and team scores to the University Hub. Build long-term reputations.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* PRICING: REFINED_TIERS */}
        <section id="pricing" className="py-32 px-6 max-w-7xl mx-auto space-y-20">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase leading-none">Simple Pricing.</h2>
            <p className="text-white/20 font-bold text-[11px] uppercase tracking-[0.5em]">Transparent resource allocation for every event</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <TierCard 
              name="Student Club" 
              price="Free" 
              desc="Perfect for campus meetups and local hackathons."
              accent="white"
              active={true}
            />
            <TierCard 
              name="Department" 
              price="$299" 
              desc="Full observability and AI judging for larger events."
              accent="primary"
            />
            <TierCard 
              name="University" 
              price="Custom" 
              desc="Dedicated city-wide infrastructure and support."
              accent="secondary"
            />
          </div>
        </section>
      </main>

      {/* FOOTER: CLEAN_TACTICAL */}
      <footer className="py-20 px-6 border-t border-white/5 bg-[#010102]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-12">
          <div className="space-y-6">
            <div className="font-bold text-2xl uppercase italic flex items-center gap-3 group">
               <div className="size-2.5 bg-secondary rounded-full"></div>
               Hack-Flow
            </div>
            <p className="text-white/20 font-bold text-[10px] uppercase tracking-[0.3em] max-w-sm leading-loose">
              Infrastructure by University Project Hub. <br/>
              Built for performance engineering.
            </p>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-12 font-bold text-[10px] uppercase tracking-widest text-white/30">
             <div className="space-y-3 flex flex-col">
                <span className="text-white/10 mb-2 font-black">Product</span>
                <Link href="#" className="hover:text-secondary transition-colors italic">Docs</Link>
                <Link href="#" className="hover:text-secondary transition-colors italic">API</Link>
             </div>
             <div className="space-y-3 flex flex-col">
                <span className="text-white/10 mb-2 font-black">Security</span>
                <Link href="#" className="hover:text-secondary transition-colors italic">Privacy</Link>
                <Link href="#" className="hover:text-secondary transition-colors italic">Audit</Link>
             </div>
             <div className="space-y-3 flex flex-col col-span-2 lg:col-span-1">
                <span className="text-white/10 mb-2 font-black">Status</span>
                <div className="flex items-center gap-2 text-secondary italic">
                   <div className="size-1.5 bg-secondary rounded-full animate-pulse shadow-[0_0_10px_#10b981]"></div>
                   Nominal
                </div>
             </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-24 pt-10 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 text-[9px] font-black text-white/10 uppercase tracking-[0.5em]">
           <span>© 2026 Hack-Flow Protocol.</span>
           <span className="italic italic">End-to-End Encryption Enabled</span>
        </div>
      </footer>
    </div>
  );
}

function TierCard({ name, price, desc, accent, active }: { name: string, price: string, desc: string, accent: string, active?: boolean }) {
  const colorClass = accent === 'secondary' ? 'text-secondary border-secondary/30' : accent === 'primary' ? 'text-primary border-primary/30' : 'text-white border-white/20';

  return (
    <div className={`bg-white/[0.02] p-10 rounded-[3rem] border ${colorClass} relative flex flex-col shadow-2xl transition-all duration-700 hover:scale-[1.02] hover:bg-white/[0.04]`}>
      {active && <div className="absolute -top-3.5 right-10 bg-white text-black px-5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest italic shadow-lg">Current Protocol</div>}
      <h3 className={`text-xl font-black uppercase tracking-[0.3em] mb-6 italic`}>{name}</h3>
      <div className="flex items-baseline gap-2 mb-8">
        <span className="text-5xl font-black italic tracking-tighter">{price}</span>
        {price !== "Custom" && <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest italic">/ Mission</span>}
      </div>
      <p className="text-white/40 text-sm font-bold uppercase tracking-tight italic leading-relaxed mb-12">{desc}</p>
      <button className={`mt-auto w-full py-4.5 bg-white/5 hover:bg-white/10 ${accent === 'secondary' ? 'border-secondary/40 text-secondary' : 'border-white/10 text-white/60'} border font-black uppercase tracking-[0.3em] text-[10px] rounded-2xl transition-all active:scale-95`}>
         Get Started
      </button>
    </div>
  );
}
