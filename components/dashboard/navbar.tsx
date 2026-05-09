"use client";

import { Search, Bell, Monitor, ShieldAlert, LogOut, Menu } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function Navbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { data: session } = useSession();
  const router = useRouter();
  const isAdmin = session?.role === 'SUPER_ADMIN';

  return (
    <nav className="h-20 border-b border-white/5 flex items-center justify-between px-4 md:px-8 bg-[#050505]/40 backdrop-blur-md sticky top-0 z-[100]">
      {/* Mobile Menu Button & Global Search */}
      <div className="flex items-center gap-4 flex-1">
        <button 
          onClick={onMenuClick}
          className="md:hidden p-2 text-slate-500 hover:text-white transition-colors"
        >
          <Menu size={20} />
        </button>
        
        <div className="relative w-full max-w-96 group hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-secondary transition-colors" size={16} />
          <input 
            type="text" 
            placeholder="Search global hack-fleet..."
            className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-[11px] text-white focus:outline-none focus:border-secondary/50 transition-all font-mono uppercase"
          />
        </div>
      </div>

      {/* Action Tray */}
      <div className="flex items-center gap-3 md:gap-6">
        {isAdmin && (
            <button 
                onClick={() => router.push("/admin/fleet-cmd")}
                className="flex items-center gap-2 px-4 py-2 bg-[#a855f7]/10 border border-[#a855f7]/30 text-[#a855f7] rounded-xl hover:bg-[#a855f7]/20 transition-all active:scale-95 group"
            >
                <ShieldAlert size={16} className="group-hover:rotate-12 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-widest font-mono">Master_Override</span>
            </button>
        )}

        <button className="text-slate-500 hover:text-white transition-colors">
          <Monitor size={18} />
        </button>
        
        <button className="text-slate-500 hover:text-white transition-colors relative">
          <Bell size={18} />
          <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-red-500 rounded-full" />
        </button>
        
        {/* Profile / Logout Container */}
        <div className="flex items-center gap-4 pl-6 border-l border-white/10">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black text-white leading-none uppercase tracking-tighter italic">{session?.user?.name || "Root_User"}</span>
            <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest mt-1">{isAdmin ? "Super_Architect" : "Node_Organizer"}</span>
          </div>
          <button 
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-9 h-9 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-white/40 hover:text-red-500 hover:bg-red-500/5 transition-all group"
          >
            <LogOut size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </nav>
  );
}
