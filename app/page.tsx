"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion"; 
import Link from "next/link";
import { 
  Terminal, Activity, ShieldCheck, Network, 
  Rocket, Radio, Menu, X, ChevronRight, Zap, 
  Globe, Cpu, BarChart3, Lock, Users, Laptop
} from "lucide-react";

/**
 * UI/UX PRO MAX REFINE: HACK-FLOW LANDING
 * Focus: Balanced Typography, Simplified Copy, Enhanced Readability
 * Style: Clean Cyber / Premium Dark
 */

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  
  // Handling 6-Digit PIN Input
  const [pin, setPin] = useState(["", "", "", "", "", ""]);
  const inputRefs = [
    useRef<HTMLInputElement>(null), 
    useRef<HTMLInputElement>(null), 
    useRef<HTMLInputElement>(null), 
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ];

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handlePinChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    if (value && index < 5) inputRefs[index + 1].current?.focus();
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const animProps = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }
  };

  return (
    <div className="font-sans selection:bg-secondary/30 min-h-screen bg-[#020203] text-white overflow-x-hidden relative">
      
      {/* AMBIENT BACKGROUND */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-1/4 w-[600px] h-[600px] bg-secondary/10 blur-[140px] rounded-full animate-pulse opacity-50"></div>
        <div className="absolute bottom-[-10%] right-1/4 w-[600px] h-[600px] bg-primary/10 blur-[140px] rounded-full opacity-30"></div>
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      </div>

      {/* NAV: SLICK_COMMAND_BAR */}
      <nav className={`fixed top-0 w-full z-[100] transition-all duration-500 ${isScrolled ? "py-4" : "py-8"}`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className={`px-8 py-4 rounded-3xl flex justify-between items-center border border-white/5 transition-all duration-500 ${isScrolled ? "bg-black/60 backdrop-blur-2xl shadow-2xl scale-[0.98]" : "bg-transparent"}`}>
            
            <Link href="/" className="flex items-center gap-4 group">
              <div className="w-3 h-3 bg-secondary rounded-full shadow-[0_0_20px_#10b981]"></div>
              <span className="font-bold tracking-tighter text-2xl uppercase group-hover:text-secondary transition-colors italic">Hack-Flow</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex gap-12 items-center font-bold text-xs uppercase tracking-widest text-white/40">
              <Link href="/dashboard" className="hover:text-white transition-all">Command Center</Link>
              <Link href="#features" className="hover:text-white transition-all">Features</Link>
              <Link href="#pricing" className="hover:text-white transition-all">Pricing</Link>
            </div>

            {/* Tactical Actions */}
            <div className="hidden lg:flex gap-4 items-center">
              <Link href="/login" className="px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-white/60 hover:text-white transition-all">Organizer</Link>
              <Link href="/dashboard" className="px-8 py-3 text-xs font-bold uppercase tracking-widest bg-secondary text-black rounded-2xl hover:bg-[#5affb4] hover:scale-105 transition-all shadow-[0_0_30px_rgba(16,185,129,0.2)]">Launch Now</Link>
            </div>

            <button className="lg:hidden text-white p-2" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>

        {/* Mobile Flyout */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="lg:hidden absolute top-full left-0 w-full px-6 pt-4">
              <div className="bg-[#0A0A0B] border border-white/10 rounded-[2.5rem] p-8 flex flex-col gap-6 font-bold text-sm uppercase tracking-widest shadow-2xl">
                <Link href="/dashboard" className="py-4 border-b border-white/5" onClick={() => setIsMobileMenuOpen(false)}>Dashboard</Link>
                <Link href="#features" className="py-4 border-b border-white/5" onClick={() => setIsMobileMenuOpen(false)}>Features</Link>
                <Link href="#pricing" className="py-4 border-b border-white/5" onClick={() => setIsMobileMenuOpen(false)}>Pricing</Link>
                <div className="flex flex-col gap-4 pt-4">
                    <Link href="/login" className="py-4 text-white/40 text-center uppercase">Organizer</Link>
                    <Link href="/dashboard" className="py-5 bg-secondary text-black rounded-[1.5rem] text-center shadow-lg">Launch Node</Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <main>
        {/* HERO: HIGH_IMPACT_CLARITY */}
        <section className="relative pt-64 pb-32 px-6 flex flex-col items-center justify-center min-h-[90vh] text-center">
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[700px] bg-secondary/5 blur-[160px] rounded-full -z-10 pointer-events-none"></div>
          
          <div className="max-w-4xl mx-auto space-y-10">
            <motion.div {...animProps}>
              <div className="inline-flex items-center gap-3 px-6 py-2 bg-white/[0.04] backdrop-blur-md rounded-full border border-white/10 mb-4 shadow-xl">
                <Zap size={14} className="text-secondary fill-secondary" />
                <span className="font-bold text-[11px] uppercase tracking-[0.3em] text-white/80">Mission Ready // Protocol 4.5</span>
              </div>
            </motion.div>

            <motion.h1 {...animProps} className="text-5xl sm:text-7xl lg:text-9xl font-black tracking-tighter leading-[0.9] uppercase italic">
              Automate Your <br/>
              <span className="text-gradient">Hackathon.</span>
            </motion.h1>

            <motion.p {...animProps} className="text-xl md:text-3xl text-white/60 max-w-2xl mx-auto leading-relaxed font-medium uppercase tracking-tight italic">
              The mission control for high-octane engineering events. Track every pulse, verify every commit, and scale your vision.
            </motion.p>

            <motion.div {...animProps} className="flex flex-col sm:flex-row gap-8 justify-center items-center pt-8">
              <Link href="/dashboard" className="w-full sm:w-auto px-12 py-7 bg-white text-black font-black text-base uppercase tracking-[0.2em] rounded-3xl flex items-center justify-center gap-4 hover:bg-secondary transition-all hover:scale-105 shadow-2xl active:scale-95">
                <Users size={24} /> Organizer Portal
              </Link>
              <button onClick={() => setIsPinModalOpen(true)} className="w-full sm:w-auto px-12 py-7 bg-white/[0.04] border border-white/10 text-white font-black text-base uppercase tracking-[0.2em] rounded-3xl flex items-center justify-center gap-4 hover:bg-white/10 transition-all backdrop-blur-md active:scale-95">
                <Laptop size={24} /> For Participants
              </button>
            </motion.div>
          </div>
        </section>

        {/* FEATURES: CLEAN_BENTO_GRID */}
        <section id="features" className="py-40 px-6 max-w-7xl mx-auto space-y-24">
          <div className="space-y-6 text-center lg:text-left">
            <span className="font-bold text-sm text-secondary uppercase tracking-[0.4em] block">Core Capabilities</span>
            <h2 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase leading-[0.9]">Engineered for high-end scale.</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 auto-rows-[300px]">
            <motion.div {...animProps} className="md:col-span-8 bg-white/[0.02] border border-white/5 p-12 rounded-[3rem] relative overflow-hidden group hover:border-secondary/30 transition-all duration-700 shadow-2xl">
              <div className="absolute top-0 right-0 p-8 font-mono text-[10px] text-white/10 uppercase tracking-[0.4em] font-black">MODULE: 01</div>
              <Terminal className="text-secondary mb-10" size={40} />
              <h3 className="text-3xl font-black uppercase italic mb-6">Automated Onboarding</h3>
              <p className="text-xl text-white/50 leading-relaxed max-w-lg font-medium uppercase tracking-tight italic">Link your Google Sheet and let our system handle the mapping. No manual data entry, just instant mission-ready datasets.</p>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-secondary to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </motion.div>

            <motion.div {...animProps} className="md:col-span-4 bg-white/[0.02] border border-white/5 p-12 rounded-[3rem] relative overflow-hidden group hover:border-primary/30 transition-all duration-700 shadow-2xl">
              <Activity className="text-primary mb-10" size={40} />
              <h3 className="text-3xl font-black uppercase italic mb-6">Live Pulse</h3>
              <p className="text-base text-white/40 leading-relaxed font-bold uppercase tracking-widest italic">Monitor every single GitHub commit and deployment health in real-time as it happens.</p>
            </motion.div>

            <motion.div {...animProps} className="md:col-span-4 bg-white/[0.02] border border-white/5 p-12 rounded-[3rem] relative overflow-hidden group hover:border-white/20 transition-all duration-700 shadow-2xl">
              <ShieldCheck className="text-white mb-10" size={40} />
              <h3 className="text-3xl font-black uppercase italic mb-6">Verified</h3>
              <p className="text-base text-white/40 leading-relaxed font-bold uppercase tracking-widest italic">Ensure accountability. Every completed task must be verified by a unique commit hash.</p>
            </motion.div>

            <motion.div {...animProps} className="md:col-span-8 bg-white/[0.02] border border-white/5 p-12 rounded-[3rem] relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-700 shadow-2xl">
              <div className="absolute top-0 right-0 p-8 font-mono text-[10px] text-white/10 uppercase tracking-[0.4em] font-black">MODULE: 04</div>
              <Network className="text-secondary mb-10" size={40} />
              <h3 className="text-3xl font-black uppercase italic mb-6">Legacy Integration</h3>
              <p className="text-xl text-white/50 leading-relaxed max-w-lg font-medium uppercase tracking-tight italic">Automatically sync winning projects and team scores to the Hub. Build long-term reputations for your engineers.</p>
            </motion.div>
          </div>
        </section>

        {/* PRICING: CLEAN_TIERS */}
        <section id="pricing" className="py-40 px-6 max-w-7xl mx-auto space-y-24">
          <div className="text-center space-y-6">
            <h2 className="text-5xl md:text-8xl font-black italic tracking-tighter uppercase leading-none">Simple Pricing.</h2>
            <p className="text-white/30 font-bold text-base uppercase tracking-[0.5em]">Transparent resource allocation for every mission</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
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

      {/* FOOTER: MINIMAL_TACTICAL */}
      <footer className="py-24 px-6 border-t border-white/5 bg-[#010102]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-16">
          <div className="space-y-8">
            <div className="font-bold text-4xl uppercase italic flex items-center gap-4 group">
               <div className="size-3 bg-secondary rounded-full"></div>
               Hack-Flow
            </div>
            <p className="text-white/30 font-bold text-xs uppercase tracking-[0.3em] max-w-sm leading-loose">
              Infrastructure by University Project Hub. <br/>
              Built for performance engineering.
            </p>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-16 font-bold text-xs uppercase tracking-widest text-white/40">
             <div className="space-y-4 flex flex-col">
                <span className="text-white/20 mb-2 font-black">Product</span>
                <Link href="#" className="hover:text-secondary transition-colors italic">Documentation</Link>
                <Link href="#" className="hover:text-secondary transition-colors italic">API_Uplink</Link>
             </div>
             <div className="space-y-4 flex flex-col">
                <span className="text-white/20 mb-2 font-black">Company</span>
                <Link href="#" className="hover:text-secondary transition-colors italic">Privacy</Link>
                <Link href="#" className="hover:text-secondary transition-colors italic">Security</Link>
             </div>
             <div className="space-y-4 flex flex-col col-span-2 lg:col-span-1">
                <span className="text-white/20 mb-2 font-black">Status</span>
                <div className="flex items-center gap-3 text-secondary italic">
                   <div className="size-2 bg-secondary rounded-full animate-pulse shadow-[0_0_10px_#10b981]"></div>
                   System_Nominal
                </div>
             </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-32 pt-12 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-6 text-[11px] font-black text-white/10 uppercase tracking-[0.6em]">
           <span>© 2026 Hack-Flow Protocol.</span>
           <span className="italic">Authorized Access Only</span>
        </div>
      </footer>

      {/* AUTH_GATE: PIN MODAL */}
      <AnimatePresence>
        {isPinModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/98 backdrop-blur-xl">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-[#0A0A0B] border border-white/10 p-12 md:p-16 rounded-[4.5rem] max-w-lg w-full relative space-y-16 text-center z-10 shadow-2xl shadow-emerald-900/10"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-center gap-4">
                   <div className="size-3 bg-secondary rounded-full animate-pulse shadow-[0_0_20px_#10b981]"></div>
                   <span className="font-bold text-[14px] uppercase tracking-[0.4em] text-white/40">Identity Check</span>
                </div>
                <h3 className="text-4xl font-black uppercase italic tracking-tighter">Enter Lab Code</h3>
                <p className="text-white/40 text-[12px] font-bold uppercase tracking-widest leading-relaxed px-8">Please provide the 6-digit access token provided by your team lead.</p>
              </div>

              <div className="flex justify-center gap-3 sm:gap-4">
                {pin.map((digit, index) => (
                  <input
                    key={index}
                    ref={inputRefs[index]}
                    value={digit}
                    onChange={(e) => handlePinChange(index, e.target.value)}
                    onKeyDown={(e) => handlePinKeyDown(index, e)}
                    className="w-12 h-16 sm:w-16 sm:h-24 bg-white/5 border border-white/10 rounded-[1.8rem] text-4xl font-black text-center focus:border-secondary focus:ring-0 focus:outline-none transition-all hover:bg-white/10 text-secondary"
                    maxLength={1}
                    type="password"
                  />
                ))}
              </div>

              <div className="space-y-6 pt-4">
                <button 
                  disabled={pin.join("").length < 6}
                  onClick={() => { window.location.href = "/lab/login"; }}
                  className="w-full py-7 bg-secondary text-black font-black uppercase tracking-[0.3em] rounded-[2rem] text-base disabled:opacity-20 shadow-[0_0_50px_rgba(16,185,129,0.2)] hover:bg-[#5affb4] transition-all active:scale-95"
                >
                  Verify & Enter
                </button>
                <button 
                  onClick={() => { setIsPinModalOpen(false); setPin(["","","","","",""]); }}
                  className="w-full py-2 text-[11px] font-black text-white/20 uppercase tracking-[0.4em] hover:text-white transition-all italic"
                >
                  Return to Base
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TierCard({ name, price, desc, accent, active }: { name: string, price: string, desc: string, accent: string, active?: boolean }) {
  const colorClass = accent === 'secondary' ? 'text-secondary border-secondary/30' : accent === 'primary' ? 'text-primary border-primary/30' : 'text-white border-white/20';

  return (
    <div className={`bg-white/[0.02] p-14 rounded-[4rem] border ${colorClass} relative flex flex-col shadow-2xl transition-all duration-700 hover:scale-[1.03] hover:bg-white/[0.04]`}>
      {active && <div className="absolute -top-5 right-14 bg-white text-black px-8 py-2 rounded-full text-[11px] font-black uppercase tracking-widest italic shadow-lg">Active Protocol</div>}
      <h3 className={`text-2xl font-black uppercase tracking-[0.3em] mb-8 italic`}>{name}</h3>
      <div className="flex items-baseline gap-3 mb-10">
        <span className="text-7xl font-black italic tracking-tighter">{price}</span>
        {price !== "Custom" && <span className="text-[12px] font-bold text-white/20 uppercase tracking-widest italic">/ Mission</span>}
      </div>
      <p className="text-white/40 text-base font-bold uppercase tracking-tight italic leading-relaxed mb-14">{desc}</p>
      <button className={`mt-auto w-full py-6 ${accent === 'secondary' ? 'bg-secondary text-black shadow-[0_0_30px_#10b98133]' : 'bg-white/5 text-white/60'} font-black uppercase tracking-[0.3em] text-xs rounded-[2rem] transition-all active:scale-95`}>
         Get Started
      </button>
    </div>
  );
}
