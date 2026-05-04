"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { getTeamByReadableId, verifyMemberAccess } from "@/app/actions/lab-auth";
import { ShieldCheck, Loader2, ArrowRight } from "lucide-react";

export default function LabIdentityGate() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [readableId, setReadableId] = useState("");
  const [members, setMembers] = useState<any[]>([]);
  const [selectedMember, setSelectedMember] = useState("");
  
  // 4-Digit PIN State
  const [pin, setPin] = useState(["", "", "", ""]);
  const inputRefs = [
    useRef<HTMLInputElement>(null), 
    useRef<HTMLInputElement>(null), 
    useRef<HTMLInputElement>(null), 
    useRef<HTMLInputElement>(null)
  ];
  
  const router = useRouter();

  // Handlers for the visual PIN boxes
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

  // Step 1: Find the Team
  const handleFetchTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await getTeamByReadableId(readableId);
    if (res.success) {
      setMembers(res.members || []);
      setStep(2);
    } else {
      alert(res.error);
    }
    setLoading(false);
  };

  // Step 2: Validate PIN
  // Step 2: Validate PIN
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalPin = pin.join(""); 
    if (finalPin.length < 4) return;

    setLoading(true);
    const res = await verifyMemberAccess(selectedMember, finalPin);
    
    if (res.success && res.route) {
      // THIS IS THE FIX: Use the route provided by the server
      router.push(res.route); 
    } else {
      alert(res.error || "Authentication failed");
      setPin(["", "", "", ""]); 
      inputRefs[0].current?.focus();
    }
    setLoading(false);
  };

  return (
    <div className="font-body min-h-screen bg-background text-white flex items-center justify-center p-4 overflow-hidden relative">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 blur-[150px] rounded-full -z-10"></div>

      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        transition={{ duration: 0.5 }}
        className="glass p-8 sm:p-10 rounded-[2rem] max-w-md w-full relative z-10 border-t border-emerald-500/30 shadow-2xl"
      >
        <header className="text-center mb-8">
          <div className="mx-auto w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4 border border-emerald-500/20">
            <ShieldCheck className="text-emerald-500" size={24} />
          </div>
          <h1 className="text-2xl font-h1 font-bold tracking-tight">Identity_Gate</h1>
          <p className="text-white/50 text-[10px] font-mono uppercase tracking-widest mt-2">Secure Connection Required</p>
        </header>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.form 
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleFetchTeam} 
              className="space-y-6"
            >
              <div className="space-y-2">
                <label className="text-[10px] font-mono text-emerald-500 uppercase tracking-widest pl-1">Target Node ID</label>
                <input 
                  autoFocus
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white focus:border-emerald-500 focus:bg-white/10 outline-none transition-all font-mono tracking-widest placeholder:text-white/20"
                  placeholder="e.g. TEAM-7B2A"
                  value={readableId}
                  onChange={(e) => setReadableId(e.target.value.toUpperCase())}
                />
              </div>
              <button disabled={loading || !readableId} className="w-full py-4 bg-white text-black font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-emerald-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                {loading ? <Loader2 className="animate-spin" size={16} /> : "Locate Node"} <ArrowRight size={16} />
              </button>
            </motion.form>
          ) : (
            <motion.form 
              key="step2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleLogin} 
              className="space-y-8"
            >
              <div className="space-y-2">
                <label className="text-[10px] font-mono text-emerald-500 uppercase tracking-widest pl-1">Select Designation</label>
                <select 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white focus:border-emerald-500 outline-none font-mono text-sm appearance-none cursor-pointer"
                  value={selectedMember}
                  onChange={(e) => setSelectedMember(e.target.value)}
                >
                  <option value="" disabled className="bg-background text-white/50">Awaiting Selection...</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id} className="bg-background">
                      {m.role === 'LEAD' ? '[LEAD]' : '[MEMBER]'} {m.id.substring(0,8)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-mono text-emerald-500 uppercase tracking-widest pl-1 text-center block">Enter Authorization PIN</label>
                <div className="flex justify-center gap-3">
                  {pin.map((digit, index) => (
                    <input
                      key={index}
                      ref={inputRefs[index]}
                      value={digit}
                      onChange={(e) => handlePinChange(index, e.target.value)}
                      onKeyDown={(e) => handlePinKeyDown(index, e)}
                      className="w-14 h-16 bg-white/5 border border-white/10 rounded-xl text-2xl font-bold font-mono text-center focus:border-emerald-500 focus:bg-white/10 outline-none transition-colors"
                      maxLength={1}
                      type="password"
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <button disabled={loading || !selectedMember || pin.join("").length < 4} className="w-full py-4 bg-emerald-500 text-black font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-emerald-400 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.2)] disabled:opacity-50 disabled:hover:scale-100">
                  {loading ? <Loader2 className="animate-spin" size={16} /> : "Establish Connection"}
                </button>
                <button type="button" onClick={() => { setStep(1); setPin(["","","",""]); }} className="w-full py-2 text-[10px] font-mono text-white/40 uppercase tracking-widest hover:text-white transition-colors">
                  Abort & Re-target
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}