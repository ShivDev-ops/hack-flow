// app/(auth)/login/page.tsx
"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck, Lock, User } from "lucide-react";

export default function LoginPage() {
  const [view, setView] = useState<"organizer" | "participant">("organizer");
  const [accessId, setAccessId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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

  return (
    <div className="bg-[#0A0A0B] text-[#e5e2e3] font-sans selection:bg-blue-500/30 min-h-screen overflow-x-hidden relative">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/5 blur-[120px] rounded-full"></div>
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
      </div>

      <main className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-[440px] flex flex-col gap-6">
          <div className="flex flex-col items-center gap-1">
            <h1 className="text-[32px] font-extrabold tracking-tighter text-white uppercase flex items-center gap-2">
              <span className="text-blue-400">Terminal</span> HACK-FLOW
            </h1>
            <p className="font-mono text-slate-500 uppercase tracking-widest text-[10px]">Unified Mission Control Login</p>
          </div>

          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-lg p-6 flex flex-col gap-6 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>

            <div className="grid grid-cols-2 p-1 bg-black/40 rounded border border-white/5">
              <button 
                onClick={() => setView("organizer")}
                className={`py-2 rounded text-[12px] font-bold transition-all ${view === 'organizer' ? 'bg-white/5 border border-white/10 text-white' : 'text-slate-500 hover:text-white'}`}
              >
                Organizer
              </button>
              <button 
                onClick={() => setView("participant")}
                className={`py-2 rounded text-[12px] font-bold transition-all ${view === 'participant' ? 'bg-white/5 border border-white/10 text-white' : 'text-slate-500 hover:text-white'}`}
              >
                Participant
              </button>
            </div>

            {view === "organizer" ? (
              <form onSubmit={handleOrganizerLogin} className="flex flex-col gap-5">
                <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Access_Identifier</label>
                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors">
                            <User size={14} />
                        </div>
                        <input 
                            required
                            type="text" 
                            value={accessId}
                            onChange={(e) => setAccessId(e.target.value)}
                            placeholder="Enter Access ID"
                            className="w-full h-12 bg-black/40 border border-white/10 rounded px-11 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-all"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Authorization_Key</label>
                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors">
                            <Lock size={14} />
                        </div>
                        <input 
                            required
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter Password"
                            className="w-full h-12 bg-black/40 border border-white/10 rounded px-11 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-all"
                        />
                    </div>
                </div>

                <button 
                  disabled={loading}
                  type="submit"
                  className="w-full h-12 bg-blue-500 text-white font-bold text-[12px] flex items-center justify-center gap-3 rounded shadow-lg hover:brightness-110 transition-all active:scale-[0.98] disabled:opacity-50 mt-2"
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : "Establish Connection"}
                </button>

                <div className="flex items-center gap-2 mt-2">
                  <div className="h-[1px] flex-1 bg-white/10"></div>
                  <span className="font-mono text-[10px] text-slate-500 uppercase">Secure Auth Tunnel</span>
                  <div className="h-[1px] flex-1 bg-white/10"></div>
                </div>

                <button 
                  type="button"
                  onClick={() => signIn("azure-ad", { callbackUrl: "/dashboard" })}
                  className="w-full h-10 text-slate-500 hover:text-white font-mono text-[10px] uppercase transition-all"
                >
                  Enterprise Microsoft Login
                </button>
              </form>
            ) : (
              <div className="flex flex-col gap-4 py-4 text-center">
                <p className="text-slate-400 text-sm">Use your Lab ID and PIN to enter.</p>
                <button 
                    onClick={() => router.push("/lab/login")}
                    className="w-full h-12 bg-emerald-500 text-black font-bold text-[12px] rounded hover:brightness-110 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <ShieldCheck size={18} /> OPEN LAB IDENTITY GATE
                </button>
              </div>
            )}

            <div className="pt-2 border-t border-white/5 flex justify-between items-center">
              <p className="font-mono text-[10px] text-slate-500">v4.5.0-TENANT</p>
              <a className="font-mono text-[10px] text-blue-400 hover:underline uppercase" href="#">Support</a>
            </div>
          </div>
        </div>
      </main>

      <div className="fixed bottom-6 right-6 flex items-center gap-3 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="font-mono text-[10px] uppercase text-white">System Online</span>
      </div>
    </div>
  );
}
