"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion"; 
import Link from "next/link";
import { 
  Terminal, Activity, ShieldCheck, Network, 
  Rocket, Radio, Menu, X 
} from "lucide-react";

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  
  // Handling PIN Input
  const [pin, setPin] = useState(["", "", "", ""]);
  const inputRefs = [
    useRef<HTMLInputElement>(null), 
    useRef<HTMLInputElement>(null), 
    useRef<HTMLInputElement>(null), 
    useRef<HTMLInputElement>(null)
  ];

  // Scroll effect for navbar
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
    if (value && index < 3) inputRefs[index + 1].current?.focus();
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  // Reusable inline animation config to keep JSX clean
  const animProps = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const } // <-- Add 'as const' here
};
  return (
    <div className="font-body selection:bg-secondary/30 min-h-screen bg-background text-white overflow-x-hidden">
      
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-[100] transition-all duration-300 ${isScrolled ? "backdrop-blur-md bg-background/50" : ""}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 mt-2 sm:mt-4">
          <div className="glass px-4 sm:px-6 py-3 rounded-full flex justify-between items-center">
            
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 bg-secondary rounded-full pulse-emerald"></div>
              <span className="font-mono font-bold tracking-tighter text-lg sm:text-xl uppercase italic">Hack-Flow</span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex gap-8 items-center font-mono text-xs uppercase tracking-widest text-white/60">
              <Link href="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link>
              <Link href="#features" className="hover:text-primary transition-colors">Architecture</Link>
              <Link href="#labs" className="hover:text-primary transition-colors">Labs</Link>
              <Link href="#pricing" className="hover:text-primary transition-colors">Pricing</Link>
            </div>

            {/* Actions */}
            <div className="hidden md:flex gap-4 items-center">
              <Link href="/login" className="px-5 py-2 text-xs font-mono border border-white/20 rounded-full hover:bg-white/10 transition-all">Sign In</Link>
              <Link href="/dashboard" className="px-5 py-2 text-xs font-mono bg-secondary text-black font-bold rounded-full hover:opacity-90 transition-all">Create Event</Link>
            </div>

            {/* Mobile Toggle */}
            <button className="md:hidden text-white/80 p-2" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {isMobileMenuOpen && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="md:hidden absolute top-full left-0 w-full px-4 pb-4">
            <div className="glass-dark rounded-2xl p-4 flex flex-col gap-4 font-mono text-sm uppercase tracking-widest text-center">
              <Link href="/dashboard" className="py-2 hover:text-primary" onClick={() => setIsMobileMenuOpen(false)}>Dashboard</Link>
              <Link href="#features" className="py-2 hover:text-primary" onClick={() => setIsMobileMenuOpen(false)}>Architecture</Link>
              <Link href="#pricing" className="py-2 hover:text-primary" onClick={() => setIsMobileMenuOpen(false)}>Pricing</Link>
              <hr className="border-white/10" />
              <Link href="/login" className="py-2 text-white/60">Sign In</Link>
              <Link href="/dashboard" className="py-3 bg-secondary text-black rounded-xl font-bold">Create Event</Link>
            </div>
          </motion.div>
        )}
      </nav>

      <main>
        {/* Hero Section */}
        <section className="relative pt-40 sm:pt-48 pb-24 sm:pb-32 px-4 sm:px-6 overflow-hidden flex flex-col items-center justify-center min-h-[90vh]">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[100vw] sm:w-[800px] h-[400px] sm:h-[500px] bg-primary/10 blur-[120px] rounded-full -z-10 opacity-50"></div>
          
          <div className="max-w-5xl mx-auto text-center space-y-6 sm:space-y-8">
            <motion.div {...animProps}>
              <div className="inline-flex items-center gap-2 px-3 py-1 glass rounded-full border border-white/10 mb-4 mx-auto">
                <span className="font-mono text-[9px] sm:text-[10px] uppercase tracking-widest text-secondary">System Ready: Protocol 15.0</span>
              </div>
            </motion.div>

            <motion.h1 {...animProps} className="text-5xl sm:text-6xl md:text-8xl font-h1 font-extrabold tracking-tight leading-[1] text-gradient">
              The Mission Control for Your Next Hackathon.
            </motion.h1>

            <motion.p {...animProps} className="text-base sm:text-lg md:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed px-4">
              A high-performance HaaS (Hackathon-as-a-Service) platform that automates registration, tracks real-time engineering pulses, and builds student reputations.
            </motion.p>

            <motion.div {...animProps} className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8 w-full sm:w-auto px-4">
              <Link href="/dashboard" className="w-full sm:w-auto group px-8 py-4 bg-secondary text-black font-bold text-xs sm:text-sm uppercase tracking-widest rounded-lg flex justify-center items-center gap-3 hover:scale-105 transition-transform">
                Launch a Hackathon <Rocket size={18} />
              </Link>
              <button onClick={() => setIsPinModalOpen(true)} className="w-full sm:w-auto px-8 py-4 glass border border-white/10 text-white font-bold text-xs sm:text-sm uppercase tracking-widest rounded-lg flex justify-center items-center gap-3 hover:bg-white/10 transition-all">
                Join Active Lab <Radio size={18} />
              </button>
            </motion.div>
          </div>
        </section>

        {/* Features Bento Grid */}
        <section id="features" className="py-24 px-4 sm:px-6 max-w-7xl mx-auto">
          <div className="mb-12 sm:mb-16">
            <span className="font-mono text-[10px] sm:text-xs text-primary uppercase tracking-[0.3em]">Core Infrastructure</span>
            <h2 className="text-3xl sm:text-4xl font-h1 font-bold mt-2">Built for Technical Excellence.</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div {...animProps} className="md:col-span-2 glass p-8 sm:p-10 rounded-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 font-mono text-[8px] sm:text-[10px] text-white/20">TECH_HOOK: DYNAMIC_INDEX_MAPPING</div>
              <Terminal className="text-primary mb-6" size={40} />
              <h3 className="text-xl sm:text-2xl font-bold mb-4">Zero-Config Onboarding</h3>
              <p className="text-sm sm:text-base text-white/50 leading-relaxed">Link your Google Sheet and let our AI-powered mapping handle the rest. No more manual data entry. We parse complex schemas into structured relational datasets instantly.</p>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </motion.div>

            <motion.div {...animProps} className="md:col-span-2 glass p-8 sm:p-10 rounded-2xl relative overflow-hidden group border-secondary/20">
              <div className="absolute top-0 right-0 p-4 font-mono text-[8px] sm:text-[10px] text-white/20">TECH_HOOK: LABS_OBSERVABILITY</div>
              <Activity className="text-secondary mb-6" size={40} />
              <h3 className="text-xl sm:text-2xl font-bold mb-4">Engineering Pulse</h3>
              <p className="text-sm sm:text-base text-white/50 leading-relaxed">Monitor live GitHub commits, database health, and deployment status from a single dashboard. Real-time observability ensures your event runs as smooth as your production code.</p>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-secondary to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </motion.div>

            <motion.div {...animProps} className="md:col-span-2 glass p-8 sm:p-10 rounded-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 font-mono text-[8px] sm:text-[10px] text-white/20">TECH_HOOK: COMMIT_TO_TASK</div>
              <ShieldCheck className="text-white mb-6" size={40} />
              <h3 className="text-xl sm:text-2xl font-bold mb-4">Proof of Work</h3>
              <p className="text-sm sm:text-base text-white/50 leading-relaxed">Enforce accountability. Every task completion requires a verified GitHub commit link. Our validator confirms code changes before marking milestones as complete.</p>
            </motion.div>

            <motion.div {...animProps} className="md:col-span-2 glass p-8 sm:p-10 rounded-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 font-mono text-[8px] sm:text-[10px] text-white/20">TECH_HOOK: BRIDGE_API_V2</div>
              <Network className="text-primary mb-6" size={40} />
              <h3 className="text-xl sm:text-2xl font-bold mb-4">Hub Integration</h3>
              <p className="text-sm sm:text-base text-white/50 leading-relaxed">Bridge the gap. Move winning projects and student scores to the University Project Hub permanently. Persistent talent profiles that survive beyond the weekend.</p>
            </motion.div>
          </div>
        </section>

        {/* Pricing Section (Simplified for brevity but responsive) */}
        <section id="pricing" className="py-24 px-4 sm:px-6 max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-h1 font-bold">Scaling with Your Ambition.</h2>
            <p className="text-white/50 mt-4 text-sm sm:text-base">Simple, mission-critical pricing for every level of event.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="glass p-8 rounded-2xl border-secondary/30 relative flex flex-col">
              <div className="absolute -top-3 right-8 bg-secondary text-black px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-bold font-mono uppercase">Current Protocol</div>
              <h3 className="text-lg sm:text-xl font-bold font-mono uppercase tracking-widest text-secondary">Student Club</h3>
              <div className="text-3xl sm:text-4xl font-bold my-4">Free</div>
              <p className="text-white/50 text-xs sm:text-sm mb-8">Perfect for small campus meetups and technical workshops.</p>
              <button className="mt-auto w-full py-3 bg-secondary text-black font-bold uppercase tracking-widest text-[10px] sm:text-xs rounded-lg">Active Protocol</button>
            </div>

            <div className="glass p-8 rounded-2xl border-white/5 flex flex-col hover:border-primary/40 transition-colors">
              <h3 className="text-lg sm:text-xl font-bold font-mono uppercase tracking-widest text-primary">Department</h3>
              <div className="text-3xl sm:text-4xl font-bold my-4">$299<span className="text-sm sm:text-lg text-white/30 font-normal">/event</span></div>
              <p className="text-white/50 text-xs sm:text-sm mb-8">Standard for department-wide hackathons and career fairs.</p>
              <button className="mt-auto w-full py-3 glass border border-white/10 text-white font-bold uppercase tracking-widest text-[10px] sm:text-xs rounded-lg">Upgrade Now</button>
            </div>

            <div className="glass p-8 rounded-2xl border-white/5 flex flex-col hover:border-white/20 transition-colors">
              <h3 className="text-lg sm:text-xl font-bold font-mono uppercase tracking-widest">University</h3>
              <div className="text-3xl sm:text-4xl font-bold my-4">Custom</div>
              <p className="text-white/50 text-xs sm:text-sm mb-8">Enterprise-grade infrastructure for city-wide initiatives.</p>
              <button className="mt-auto w-full py-3 glass border border-white/10 text-white font-bold uppercase tracking-widest text-[10px] sm:text-xs rounded-lg">Contact Sales</button>
            </div>
          </div>
        </section>
      </main>

      {/* PIN Modal */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsPinModalOpen(false)}></div>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass p-8 sm:p-10 rounded-2xl max-w-md w-full relative space-y-8 text-center z-10">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold font-h1">Access Active Lab</h3>
              <p className="text-white/40 text-xs sm:text-sm mt-2">Enter the 4-digit mission code provided by your event lead.</p>
            </div>
            <div className="flex justify-center gap-3 sm:gap-4">
              {pin.map((digit, index) => (
                <input
                  key={index}
                  ref={inputRefs[index]}
                  value={digit}
                  onChange={(e) => handlePinChange(index, e.target.value)}
                  onKeyDown={(e) => handlePinKeyDown(index, e)}
                  className="w-14 h-16 sm:w-16 sm:h-20 bg-white/5 border border-white/10 rounded-xl text-3xl sm:text-4xl font-bold text-center focus:border-secondary focus:ring-0 focus:outline-none"
                  maxLength={1}
                  type="text"
                />
              ))}
            </div>
            <button className="w-full py-4 bg-secondary text-black font-bold uppercase tracking-widest rounded-lg text-xs sm:text-sm">Initialize Link</button>
          </motion.div>
        </div>
      )}

      {/* Footer */}
      <footer className="py-12 sm:py-20 px-4 sm:px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left space-y-4">
            <div className="font-mono font-bold text-xl sm:text-2xl uppercase italic">Hack-Flow</div>
            <p className="text-white/40 text-xs sm:text-sm max-w-sm">Part of the University Project Hub Ecosystem.</p>
          </div>
          <div className="text-[9px] sm:text-[10px] font-mono text-white/20 uppercase tracking-widest text-center md:text-right">
            © 2024 Hack-Flow Protocol. <br className="md:hidden" /> Mission Control Secured.
          </div>
        </div>
      </footer>
    </div>
  );
}