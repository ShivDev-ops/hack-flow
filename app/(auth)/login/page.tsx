"use client";

import { signIn } from "next-auth/react";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, ShieldCheck, Lock, User, ChevronRight, Info, Eye, EyeOff } from "lucide-react";

function LoginContent() {
  const [view, setView] = useState<"organizer" | "participant">("organizer");
  const [accessId, setAccessId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  useEffect(() => {
    if (error === "AccessDenied") {
      alert("ACCESS_DENIED: This Microsoft account is not linked to any organizer profile. Please login with your credentials first and link it in the dashboard.");
    }
  }, [error]);

  const handleOrganizerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const res = await signIn("credentials", {
      accessId,
      password,
      redirect: false
    });

    if (res?.error) {
      alert("INVALID_CREDENTIALS: Access Denied.");
    } else {
      router.push("/dashboard");
    }
    setLoading(false);
  };

  const animProps = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }
  };

  return (
    <div className="font-body selection:bg-secondary/30 min-h-screen bg-background text-white overflow-x-hidden relative flex flex-col justify-center items-center p-4 sm:p-6">
      
      {/* Background Decor */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/5 blur-[120px] rounded-full"></div>
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
      </div>

      <motion.div {...animProps} className="relative z-10 w-full max-w-[480px] space-y-8">
        
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3">
            <div className="w-2.5 h-2.5 bg-secondary rounded-full pulse-emerald"></div>
            <span className="font-mono font-bold tracking-tighter text-2xl uppercase italic">Hack-Flow</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-h1 font-extrabold tracking-tight text-white uppercase">
            Mission Control
          </h1>
          <p className="font-mono text-white/40 uppercase tracking-widest text-[10px]">
            System Authentication Protocol v15.4
          </p>
        </div>

        {/* Main Auth Container */}
        <div className="glass p-6 sm:p-10 rounded-[2rem] border border-white/10 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-secondary/50 to-transparent"></div>
          
          {/* View Toggle */}
          <div className="grid grid-cols-2 p-1.5 bg-white/5 rounded-2xl border border-white/5 mb-8">
            <button 
              onClick={() => setView("organizer")}
              className={`py-3 rounded-xl text-xs font-bold font-mono uppercase tracking-widest transition-all ${view === 'organizer' ? 'bg-white/10 border border-white/10 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
            >
              Organizer
            </button>
            <button 
              onClick={() => setView("participant")}
              className={`py-3 rounded-xl text-xs font-bold font-mono uppercase tracking-widest transition-all ${view === 'participant' ? 'bg-white/10 border border-white/10 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
            >
              Participant
            </button>
          </div>

          {view === "organizer" ? (
            <form onSubmit={handleOrganizerLogin} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Access_Identifier</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-secondary transition-colors">
                      <User size={16} />
                    </div>
                    <input 
                      required
                      type="text" 
                      value={accessId}
                      onChange={(e) => setAccessId(e.target.value)}
                      placeholder="ENTER_ACCESS_ID"
                      className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-12 text-sm text-white placeholder:text-white/10 focus:outline-none focus:border-secondary/50 focus:bg-white/10 transition-all font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Authorization_Key</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-secondary transition-colors">
                      <Lock size={16} />
                    </div>
                    <input 
                      required
                      type={showPassword ? "text" : "password"} 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-12 text-sm text-white placeholder:text-white/10 focus:outline-none focus:border-secondary/50 focus:bg-white/10 transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors p-1"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              <button 
                disabled={loading}
                type="submit"
                className="w-full h-14 bg-secondary text-black font-bold text-xs sm:text-sm uppercase tracking-widest flex items-center justify-center gap-3 rounded-2xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <>Initialize Connection <ChevronRight size={18} /></>}
              </button>

              <div className="flex items-center gap-4 py-2">
                <div className="h-[1px] flex-1 bg-white/5"></div>
                <span className="font-mono text-[9px] text-white/20 uppercase tracking-[0.3em] whitespace-nowrap">Secondary Uplink</span>
                <div className="h-[1px] flex-1 bg-white/5"></div>
              </div>

              <button 
                type="button"
                onClick={() => signIn("azure-ad", { callbackUrl: "/dashboard" })}
                className="w-full h-12 text-white/40 hover:text-white font-mono text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-3 border border-white/10 rounded-2xl hover:bg-white/5 group"
              >
                <div className="w-1.5 h-1.5 bg-white/20 rounded-full group-hover:bg-secondary transition-colors"></div>
                Login via Microsoft
              </button>
            </form>
          ) : (
            <div className="flex flex-col gap-8 py-4 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-4">
                <div className="w-20 h-20 bg-secondary/10 text-secondary rounded-full flex items-center justify-center mx-auto border border-secondary/20 shadow-[0_0_40px_rgba(78,222,163,0.1)]">
                  <ShieldCheck size={40} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold font-h1 uppercase italic">Identity Verification Required</h3>
                  <p className="text-white/50 text-sm leading-relaxed max-w-[280px] mx-auto">
                    Use your assigned Lab ID and 4-digit PIN to establish an identity bridge.
                  </p>
                </div>
              </div>
              
              <button 
                  onClick={() => router.push("/lab/login")}
                  className="w-full h-14 bg-white text-black font-bold text-xs sm:text-sm uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl"
              >
                Open Identity Gate <ChevronRight size={18} />
              </button>

              <div className="flex items-center gap-2 justify-center text-white/20">
                <Info size={12} />
                <span className="text-[9px] font-mono uppercase tracking-widest">Protocol strictly enforced</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-4">
          <p className="font-mono text-[10px] text-white/20 uppercase tracking-widest">© 2024 HACK-FLOW CORE</p>
          <div className="flex gap-6">
            <a href="#" className="font-mono text-[10px] text-secondary hover:text-white transition-colors uppercase tracking-widest">Support_Portal</a>
            <a href="/" className="font-mono text-[10px] text-white/40 hover:text-white transition-colors uppercase tracking-widest">Return_Base</a>
          </div>
        </div>
      </motion.div>

      {/* System Status Indicator */}
      <div className="fixed bottom-6 right-6 hidden sm:flex items-center gap-3 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 z-50">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
        </span>
        <span className="font-mono text-[10px] uppercase text-white/60 tracking-widest font-bold">System Online</span>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-secondary" size={48} />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
