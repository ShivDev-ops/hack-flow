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
import { getLabSession, destroyLabSession } from "@/app/actions/lab-auth";

export default function LabLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<{ teamId?: string; role?: string } | null>(null);
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

  const handleLogout = async () => {
    await destroyLabSession();
    router.push("/lab/login");
  };

  const navItems = [
    { name: "Terminal", path: "/lab/dashboard/terminal", icon: Terminal },
    { name: "Config-Sys", path: "/lab/dashboard/config-sys", icon: ShieldAlert },
    { name: "Sys_Setup", path: "/lab/config", icon: Network },
    { name: "Leaderboard", path: "/lab/leaderboard", icon: Trophy },
    { name: "Mission_Specs", path: "/lab/specs", icon: FileText },
  ];

  if (isAuthOrLobby) {
    return <div className="bg-background min-h-screen font-body-main">{children}</div>;
  }

  return (
    <div className="flex h-screen bg-background text-on-surface font-body-main overflow-hidden selection:bg-primary/30">
      
      {/* SIDEBAR (Desktop) */}
      <aside className="hidden md:flex flex-col w-64 border-r border-white/10 bg-slate-950/90 shadow-2xl z-20">
        <div className="p-md mb-lg">
          <p className="font-label-caps text-on-surface-variant text-[10px] mb-1">CURRENT_LAB</p>
          <div className="flex items-center gap-sm">
            <span className="material-symbols-outlined text-secondary pulse-emerald" style={{fontSize: '18px'}}>sensors</span>
            <h3 className="font-h3 text-lg text-white uppercase">Hack-Flow</h3>
          </div>
        </div>

        <nav className="flex-1 space-y-sm px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            const Icon = item.icon;
            return (
              <Link 
                key={item.name} 
                href={item.path}
                className={`flex items-center gap-md px-md py-sm transition-all border-r-2 ${
                  isActive 
                    ? "bg-primary/10 text-primary border-primary" 
                    : "text-on-surface-variant hover:bg-white/5 border-transparent"
                }`}
              >
                <Icon size={18} />
                <span className="font-label-caps tracking-widest">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="pt-lg border-t border-white/5 pb-6">
          <div className="px-md mb-md">
            <p className="font-label-caps text-on-surface-variant text-[10px] mb-xs">OPERATOR</p>
            <div className="flex items-center gap-sm">
              <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                {session?.role === 'LEAD' ? 'LD' : 'MB'}
              </div>
              <div>
                <p className="font-data-mono text-xs text-white">Node: {session?.teamId ? session.teamId.substring(0,8) : "UNKNOWN"}</p>
                <p className="font-data-mono text-[9px] text-secondary">PRIVILEGED_ACCESS</p>
              </div>
            </div>
          </div>
          <div className="px-4">
             <button 
                onClick={handleLogout}
                className="w-full py-sm bg-red-500/10 hover:bg-red-500/20 text-red-400 font-label-caps text-xs border border-red-500/10 rounded transition-all flex items-center justify-center gap-2"
              >
                <LogOut size={14} /> TERMINATE_LINK
              </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col relative">
        {/* TOP NAVBAR */}
        <header className="h-16 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl flex items-center justify-between px-md z-10">
          <div className="flex items-center gap-md">
            <button className="md:hidden text-slate-400" onClick={() => setIsMobileOpen(!isMobileOpen)}>
              <Menu size={20} />
            </button>
            <div className="hidden md:flex items-center gap-sm font-data-mono text-xs text-on-surface-variant">
              <span className="w-2 h-2 rounded-full bg-secondary pulse-emerald"></span>
              SYSTEM_STABLE
            </div>
          </div>
          
          <div className="flex items-center gap-md">
            <div className="px-md py-1 glass-panel border-primary/20 rounded-full flex items-center gap-sm">
              <span className="font-data-mono text-primary text-sm font-bold">UPLINK_SECURED</span>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT CONTAINER */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#0a0a0a]">
          {children}
        </main>
      </div>

      {/* MOBILE OVERLAY */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/95 backdrop-blur-md p-6 flex flex-col">
          <button onClick={() => setIsMobileOpen(false)} className="text-secondary text-xs mb-8 font-label-caps tracking-widest">{"< RETURN"}</button>
          <nav className="flex-1 space-y-6">
             {navItems.map((item) => (
                <Link 
                  key={item.name} href={item.path} onClick={() => setIsMobileOpen(false)}
                  className="block text-xl font-label-caps text-white hover:text-primary transition-colors"
                >{item.name}</Link>
             ))}
          </nav>
        </div>
      )}
    </div>
  );
}