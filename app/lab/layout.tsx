"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Terminal, 
  Network, 
  Trophy, 
  FileText, 
  LogOut, 
  Menu,
  Zap,
  ShieldAlert
} from "lucide-react";
import { getLabSession } from "@/app/actions/lab-auth";

export default function LabLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // If they are on the login or lobby page, don't show the heavy navigation
  const isAuthOrLobby = pathname === "/lab/login" || pathname === "/lab/lobby";

  useEffect(() => {
    const fetchSession = async () => {
      const data = await getLabSession();
      setSession(data);
    };
    fetchSession();
  }, []);

  const handleLogout = () => {
    document.cookie = "lab_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    router.push("/lab/login");
  };

  const navItems = [
    { name: "Terminal", path: "/lab/terminal", icon: Terminal },
    { name: "Sys_Config", path: "/lab/config", icon: Network },
    { name: "Leaderboard", path: "/lab/leaderboard", icon: Trophy },
    { name: "Mission_Specs", path: "/lab/specs", icon: FileText },
  ];

  if (isAuthOrLobby) {
    return <div className="bg-[#0A0A0B] min-h-screen">{children}</div>;
  }

  return (
    <div className="flex h-screen bg-[#0A0A0B] text-white font-mono overflow-hidden">
      
      {/* SIDEBAR (Desktop) */}
      <aside className="hidden md:flex flex-col w-64 border-r border-white/5 bg-zinc-950 shadow-2xl z-20">
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
            <span className="font-black tracking-tighter text-lg uppercase italic">Hack-Flow</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            const Icon = item.icon;
            return (
              <Link 
                key={item.name} 
                href={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive 
                    ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" 
                    : "text-slate-500 hover:bg-white/5 hover:text-white border border-transparent"
                }`}
              >
                <Icon size={16} />
                <span className="text-[10px] font-bold uppercase tracking-widest">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-500/70 hover:bg-red-500/10 hover:text-red-500 rounded-xl transition-colors border border-transparent hover:border-red-500/20"
          >
            <LogOut size={16} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Terminate_Link</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col relative">
        
        {/* TOP NAVBAR */}
        <header className="h-16 border-b border-white/5 bg-zinc-950/50 backdrop-blur-md flex items-center justify-between px-4 md:px-6 z-10">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-slate-400" onClick={() => setIsMobileOpen(!isMobileOpen)}>
              <Menu size={20} />
            </button>
            <div className="text-[10px] text-slate-500 uppercase tracking-widest hidden sm:flex items-center gap-2">
              <Zap size={12} className="text-emerald-500" /> 
              Uplink_Secured // Node: {session?.teamId ? session.teamId.substring(0,8) : "UNKNOWN"}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full flex items-center gap-2">
                <ShieldAlert size={12} className="text-emerald-500" />
                <span className="text-[9px] font-black uppercase text-white tracking-widest">{session?.role || "SPECTATOR"}</span>
             </div>
          </div>
        </header>

        {/* PAGE CONTENT CONTAINER */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          {children}
        </main>
      </div>

      {/* MOBILE OVERLAY (Simple implementation) */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/90 backdrop-blur-sm p-6 flex flex-col">
          {/* Duplicate the sidebar nav links here for mobile, omitted for brevity */}
          <button onClick={() => setIsMobileOpen(false)} className="text-emerald-500 text-xs mb-8 uppercase font-bold tracking-widest">{"< Return"}</button>
          <nav className="flex-1 space-y-4">
             {navItems.map((item) => (
                <Link 
                  key={item.name} href={item.path} onClick={() => setIsMobileOpen(false)}
                  className="block text-xl font-bold uppercase text-white hover:text-emerald-500 transition-colors"
                >{item.name}</Link>
             ))}
          </nav>
        </div>
      )}
    </div>
  );
}