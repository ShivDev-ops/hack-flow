"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { getTeamByReadableId, verifyMemberAccess } from "@/app/actions/lab-auth";
import { ShieldCheck, Loader2, ArrowRight } from "lucide-react";

export default function LabIdentityGate() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [readableId, setReadableId] = useState("");
  const [members, setMembers] = useState<{ id: string; role: string; user_id: string | null }[]>([]);
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
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalPin = pin.join(""); 
    if (finalPin.length < 4) return;

    setLoading(true);
    const res = await verifyMemberAccess(selectedMember, finalPin);
    
    if (res.success && res.route) {
      router.push(res.route); 
    } else {
      alert(res.error || "Authentication failed");
      setPin(["", "", "", ""]); 
      inputRefs[0].current?.focus();
    }
    setLoading(false);
  };

  return (
    <div className="font-body min-h-screen bg-background text-white flex items-center justify-center p-6 overflow-hidden relative selection:bg-secondary/30">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-secondary/10 blur-[150px] rounded-full -z-10"></div>

      <div className="glass-panel rim-light p-10 md:p-12 rounded-[3rem] max-w-[480px] w-full relative z-10 shadow-[0_0_80px_rgba(0,0,0,0.6)] animate-in fade-in zoom-in-95 duration-500">
        <header className="text-center mb-10">
          <div className="mx-auto w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center mb-6 border border-secondary/20 rim-light pulse-emerald">
            <ShieldCheck className="text-secondary" size={32} />
          </div>
          <h1 className="text-3xl font-black tracking-tighter uppercase italic leading-none">Identity_Gate</h1>
          <p className="text-white/40 text-[10px] font-data-mono uppercase tracking-[0.4em] mt-4 font-bold">Secure_Connection_Required</p>
        </header>

        {step === 1 ? (
          <form onSubmit={handleFetchTeam} className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black font-label-caps text-secondary uppercase tracking-[0.3em] ml-1">Target_Node_ID</label>
              <div className="relative group">
                <input 
                  autoFocus
                  style={{ colorScheme: 'dark' }}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-5 text-white focus:border-secondary/50 outline-none transition-all font-data-mono tracking-widest placeholder:text-white/10 group-hover:border-white/20 text-sm uppercase"
                  placeholder="TEAM-XXXX"
                  value={readableId}
                  onChange={(e) => setReadableId(e.target.value.toUpperCase())}
                />
              </div>
            </div>
            <button disabled={loading || !readableId} className="w-full py-5 bg-white text-black font-black uppercase tracking-[0.3em] text-xs rounded-2xl hover:bg-zinc-200 transition-all flex items-center justify-center gap-3 disabled:opacity-50 font-label-caps active:scale-95 shadow-xl">
              {loading ? <Loader2 className="animate-spin" size={18} /> : <>Locate_Node <ArrowRight size={18} /></>}
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-10">
            <div className="space-y-3">
              <label className="text-[10px] font-black font-label-caps text-secondary uppercase tracking-[0.3em] ml-1">Select_Designation</label>
              <div className="relative group">
                <select 
                  style={{ colorScheme: 'dark' }}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-5 text-white focus:border-secondary/50 outline-none font-data-mono text-xs appearance-none cursor-pointer group-hover:border-white/20 transition-all"
                  value={selectedMember}
                  onChange={(e) => setSelectedMember(e.target.value)}
                >
                  <option value="" disabled className="bg-zinc-900 text-white/40 font-data-mono">AWAITING_SELECTION...</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id} className="bg-zinc-900 font-data-mono uppercase">
                      {m.role === 'LEAD' ? '[LEAD]' : '[MEMBER]'} {m.id.substring(0,12)}
                    </option>
                  ))}
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-white/20">
                  <ArrowRight size={14} className="rotate-90" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black font-label-caps text-secondary uppercase tracking-[0.3em] ml-1 text-center block">Authorization_PIN</label>
              <div className="flex justify-center gap-4">
                {pin.map((digit, index) => (
                  <input
                    key={index}
                    ref={inputRefs[index]}
                    value={digit}
                    onChange={(e) => handlePinChange(index, e.target.value)}
                    onKeyDown={(e) => handlePinKeyDown(index, e)}
                    className="w-16 h-20 bg-black/40 border border-white/10 rounded-2xl text-3xl font-black font-data-mono text-center focus:border-secondary/50 outline-none transition-all hover:border-white/20 text-secondary"
                    maxLength={1}
                    type="password"
                  />
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <button disabled={loading || !selectedMember || pin.join("").length < 4} className="w-full py-5 bg-secondary text-black font-black uppercase tracking-[0.3em] text-xs rounded-2xl hover:bg-[#5affb4] hover:scale-[1.02] transition-all flex items-center justify-center gap-3 shadow-[0_0_40px_rgba(78,222,163,0.3)] disabled:opacity-50 disabled:bg-white/5 disabled:text-white/20 font-label-caps active:scale-95">
                {loading ? <Loader2 className="animate-spin" size={18} /> : "Establish_Connection"}
              </button>
              <button type="button" onClick={() => { setStep(1); setPin(["","","",""]); }} className="w-full py-2 text-[9px] font-data-mono text-white/20 uppercase tracking-[0.4em] hover:text-white transition-all font-bold">
                Abort_&_Re_Target
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}