// components/layout/navbar.tsx
"use client";

import { Session } from "next-auth";
import { UserAvatar } from "@/components/ui/user-avatar";

export function Navbar({ session, onMenuClick }: { session: Session; onMenuClick: () => void }) {
  return (
    <header className="fixed top-0 w-full z-50 bg-[#0A0A0B]/80 backdrop-blur-xl border-b border-white/10 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
      <div className="max-w-7xl mx-auto flex justify-between items-center h-16 px-6">
        <div className="flex items-center gap-3">
          {/* Hamburger Trigger - Hidden on Desktop */}
          <button 
            onClick={onMenuClick}
            className="lg:hidden p-2 -ml-2 text-slate-400 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          
          <span className="text-xl font-black text-white uppercase tracking-wider font-mono">Hack-Flow</span>
          <span className="hidden sm:block text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-mono uppercase">Fleet CMD</span>
        </div>

        <UserAvatar image={session.user?.image} name={session.user?.name} />
      </div>
    </header>
  );
}