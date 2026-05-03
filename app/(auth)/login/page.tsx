// app/(auth)/login/page.tsx
"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function LoginPage() {
  const [view, setView] = useState<"organizer" | "participant">("organizer");

  return (
    <div className="bg-[#0A0A0B] text-[#e5e2e3] font-sans selection:bg-blue-500/30 min-h-screen overflow-x-hidden relative">
      {/* Hero Background Visual */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/5 blur-[120px] rounded-full"></div>
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
      </div>

      <main className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-[440px] flex flex-col gap-6">
          {/* Branding */}
          <div className="flex flex-col items-center gap-1">
            <h1 className="text-[32px] font-extrabold tracking-tighter text-white uppercase flex items-center gap-2">
              <span className="text-blue-400">Terminal</span> HACK-FLOW
            </h1>
            <p className="font-mono text-slate-500 uppercase tracking-widest text-[10px]">Unified Mission Control Login</p>
          </div>

          {/* Auth Card */}
          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-lg p-6 flex flex-col gap-6 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>

            {/* Tab Navigation */}
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
              <div className="flex flex-col gap-4">
                <button 
                  onClick={() => signIn("azure-ad", { callbackUrl: "/dashboard" })}
                  className="w-full h-12 bg-blue-500 text-white font-bold text-[12px] flex items-center justify-center gap-3 rounded shadow-lg hover:brightness-110 transition-all active:scale-[0.98]"
                >
                  Continue with Microsoft
                </button>
                <button 
                  onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
                  className="w-full h-12 bg-[#2a2a2b] border border-white/10 text-white font-bold text-[12px] flex items-center justify-center gap-3 rounded hover:bg-white/5 transition-all active:scale-[0.98]"
                >
                  Continue with GitHub
                </button>
                <button 
                  onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                  className="w-full h-12 bg-[#2a2a2b] border border-white/10 text-white font-bold text-[12px] flex items-center justify-center gap-3 rounded hover:bg-white/5 transition-all active:scale-[0.98]"
                >
                  Continue with Google
                </button>
                <div className="flex items-center gap-2 mt-2">
                  <div className="h-[1px] flex-1 bg-white/10"></div>
                  <span className="font-mono text-[10px] text-slate-500 uppercase">Secure Enterprise Tunnel</span>
                  <div className="h-[1px] flex-1 bg-white/10"></div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4 py-4 text-center">
                <p className="text-slate-400 text-sm">Participant PIN entry coming soon.</p>
                <button className="w-full h-12 bg-emerald-500 text-black font-bold text-[12px] rounded opacity-50 cursor-not-allowed">
                  JOIN LAB
                </button>
              </div>
            )}

            <div className="pt-2 border-t border-white/5 flex justify-between items-center">
              <p className="font-mono text-[10px] text-slate-500">v4.2.0-STABLE</p>
              <a className="font-mono text-[10px] text-blue-400 hover:underline uppercase" href="#">Support</a>
            </div>
          </div>
        </div>
      </main>

      {/* System Status Footer */}
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