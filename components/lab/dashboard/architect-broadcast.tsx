"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Terminal as TerminalIcon } from "lucide-react";

interface ArchitectBroadcastProps {
  message: string | null;
}

/**
 * UI/UX PRO MAX COMPONENT: ARCHITECT_BROADCAST
 * High-impact proactive AI coaching UI with typing effects and cyberpunk alerts.
 */
export function ArchitectBroadcast({ message }: ArchitectBroadcastProps) {
  const [displayText, setDisplayText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (message) {
      setIsTyping(true);
      setDisplayText("");
      let i = 0;
      const interval = setInterval(() => {
        setDisplayText(message.substring(0, i));
        i++;
        if (i > message.length) {
          clearInterval(interval);
          setIsTyping(false);
        }
      }, 40);
      return () => clearInterval(interval);
    }
  }, [message]);

  if (!message) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: -40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="relative overflow-hidden rounded-[2.5rem] border border-amber-500/20 bg-[#0A0A0B]/80 backdrop-blur-2xl p-8 md:p-10 shadow-[0_0_80px_rgba(245,158,11,0.1)] group mb-10"
    >
      {/* Decorative Glitch Background */}
      <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
        <TerminalIcon size={160} className="text-amber-500 rotate-12" />
      </div>

      <div className="flex flex-col md:flex-row items-start gap-8 relative z-10">
        <div className="p-5 bg-amber-500/10 rounded-3xl border border-amber-500/30 animate-pulse shadow-[0_0_30px_rgba(245,158,11,0.2)] shrink-0">
          <Zap size={32} className="text-amber-400" />
        </div>
        
        <div className="flex-1 space-y-6">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="text-[11px] font-black text-amber-500 uppercase tracking-[0.5em] font-mono">Incoming_Transmission</span>
              <div className="h-px w-16 bg-amber-500/20 hidden sm:block"></div>
            </div>
            <div className="flex items-center gap-3">
               <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest font-mono">Secure_Uplink: ESTABLISHED</span>
               <div className="size-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]" />
            </div>
          </header>

          <p className="text-2xl md:text-3xl font-black text-white italic tracking-tighter leading-tight uppercase max-w-4xl">
            {displayText}
            {isTyping && <span className="inline-block w-2.5 h-8 bg-amber-500 ml-2 animate-pulse align-middle" />}
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <div className="flex items-center gap-2.5 px-4 py-1.5 bg-amber-500/10 rounded-full border border-amber-500/20">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-ping" />
              <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em]">Priority_Tactical_Advice</span>
            </div>
            <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest font-mono italic">Source: ARCHITECT_PROTOCOL_V4.5</span>
          </div>
        </div>
      </div>

      {/* Scaning Line Animation */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[2.5rem]">
         <div className="w-full h-[1px] bg-amber-500/20 absolute top-0 animate-scan" />
      </div>
    </motion.div>
  );
}
