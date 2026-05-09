"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { getTeamByReadableId, verifyMemberAccess } from "@/app/actions/lab-auth";
import { ShieldCheck, Loader2, ArrowRight, ChevronRight } from "lucide-react";
import { ParticleBackground } from "@/components/ui/particle-background";
import { motion } from "framer-motion";

export default function LabIdentityGate() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [readableId, setReadableId] = useState("");
  const [members, setMembers] = useState<any[]>([]);
  const [selectedMember, setSelectedMember] = useState("");
  
  // 6-Digit PIN State
  const [pin, setPin] = useState(["", "", "", "", "", ""]);
  const inputRefs = [
    useRef<HTMLInputElement>(null), 
    useRef<HTMLInputElement>(null), 
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
    if (value && index < 5) inputRefs[index + 1].current?.focus();
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
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalPin = pin.join(""); 
    if (finalPin.length < 6) return;

    setLoading(true);
    const res = await verifyMemberAccess(selectedMember, finalPin);
    
    if (res.success && res.route) {
      router.push(res.route); 
    } else {
      alert(res.error || "Authentication failed");
      setPin(["", "", "", "", "", ""]); 
      inputRefs[0].current?.focus();
    }
    setLoading(false);
  };

  const animProps = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }
  };

  return (
    <div className="font-sans min-h-screen bg-[#020203] text-white flex items-center justify-center p-6 overflow-hidden relative selection:bg-secondary/30">
      
      {/* INTERACTIVE BACKGROUND ENGINE */}
      <ParticleBackground />

      {/* AMBIENT GLOW */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-secondary/5 blur-[150px] rounded-full -z-10 opacity-40"></div>

      <motion.div {...animProps} className="glass-panel rim-light p-10 md:p-14 rounded-[3.5rem] max-w-[520px] w-full relative z-10 shadow-2xl bg-black/40 backdrop-blur-xl border border-white/10">
        <header className="text-center mb-12">
          <div className="mx-auto w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center mb-6 border border-secondary/20 rim-light pulse-emerald">
            <ShieldCheck className="text-secondary" size={32} />
          </div>
          <h1 className="text-4xl font-black tracking-tighter uppercase italic leading-none">Identity_Gate</h1>
          <p className="text-white/30 text-[10px] font-bold uppercase tracking-[0.4em] mt-4 italic">Authorized Mission Entry Required</p>
        </header>

        {step === 1 ? (
          <form onSubmit={handleFetchTeam} className="space-y-8">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-secondary uppercase tracking-[0.3em] ml-1">Target_Node_ID</label>
              <div className="relative group">
                <input 
                  autoFocus
                  style={{ colorScheme: 'dark' }}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white focus:border-secondary/50 outline-none transition-all font-mono tracking-[0.2em] placeholder:text-white/5 group-hover:border-white/20 text-lg uppercase"
                  placeholder="XXXXXX"
                  value={readableId}
                  onChange={(e) => setReadableId(e.target.value.toUpperCase())}
                />
              </div>
            </div>
            <button disabled={loading || !readableId} className="w-full py-6 bg-white text-black font-black uppercase tracking-[0.3em] text-xs rounded-2xl hover:bg-[#10b981] hover:text-white transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95 shadow-2xl">
              {loading ? <Loader2 className="animate-spin" size={20} /> : <>Locate_Node <ArrowRight size={20} /></>}
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-12">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-secondary uppercase tracking-[0.3em] ml-1">Select_Designation</label>
              <div className="relative group">
                <select 
                  style={{ colorScheme: 'dark' }}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white focus:border-secondary/50 outline-none font-mono text-sm appearance-none cursor-pointer group-hover:border-white/20 transition-all uppercase"
                  value={selectedMember}
                  onChange={(e) => setSelectedMember(e.target.value)}
                >
                  <option value="" disabled className="bg-[#0A0A0B] text-white/20">AWAITING_SELECTION...</option>
                  {members.map(m => {
                    const participantName = m.name || "Unknown Participant";
                    const isLead = m.role === 'LEAD';
                    return (
                      <option key={m.id} value={m.id} className="bg-[#0A0A0B] text-white">
                        {isLead ? '[LEAD] ' : ''}{participantName}
                      </option>
                    );
                  })}
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-white/20">
                  <ArrowRight size={16} className="rotate-90" />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <label className="text-[10px] font-black text-secondary uppercase tracking-[0.3em] ml-1 text-center block">Authorization_PIN</label>
              <div className="flex justify-center gap-3 sm:gap-4">
                {pin.map((digit, index) => (
                  <input
                    key={index}
                    ref={inputRefs[index]}
                    value={digit}
                    onChange={(e) => handlePinChange(index, e.target.value)}
                    onKeyDown={(e) => handlePinKeyDown(index, e)}
                    className="w-11 h-16 sm:w-14 sm:h-20 bg-white/5 border border-white/10 rounded-2xl text-3xl font-black font-mono text-center focus:border-secondary/50 outline-none transition-all hover:bg-white/10 text-secondary"
                    maxLength={1}
                    type="password"
                  />
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <button disabled={loading || !selectedMember || pin.join("").length < 6} className="w-full py-6 bg-secondary text-black font-black uppercase tracking-[0.3em] text-xs rounded-2xl hover:bg-[#5affb4] hover:scale-[1.02] transition-all flex items-center justify-center gap-3 shadow-[0_0_50px_rgba(16,185,129,0.2)] disabled:opacity-20 active:scale-95">
                {loading ? <Loader2 className="animate-spin" size={20} /> : <>Initialize_Connection <ChevronRight size={18}/></>}
              </button>
              <button type="button" onClick={() => { setStep(1); setPin(["","","","","",""]); }} className="w-full py-3 text-[10px] font-black text-white/20 uppercase tracking-[0.4em] hover:text-white transition-all italic">
                Abort_&_Re_Target
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
