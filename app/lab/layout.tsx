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
  ShieldAlert,
  Clock,
  BookOpen
} from "lucide-react";
import { getLabSession, destroyLabSession } from "@/app/actions/lab-auth";
import { getActiveEventAction } from "@/app/actions/events";
import { Event } from "@/types/common";

import { LabSidebarNav } from "@/components/layout/lab-sidebar-nav";
import { AIChatAgent } from "@/components/lab/dashboard/ai-chat-agent";

const navItems = [
  { name: "Terminal", path: "/lab/dashboard/terminal", icon: Terminal },
  { name: "Config-Sys", path: "/lab/dashboard/config-sys", icon: ShieldAlert },
  { name: "Sys_Setup", path: "/lab/config", icon: Network },
  { name: "Leaderboard", path: "/lab/leaderboard", icon: Trophy },
  { name: "Mission_Specs", path: "/lab/specs", icon: FileText },
  { name: "Mission_Briefing", path: "/lab/dashboard/briefing", icon: BookOpen },
];

export default function LabLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<{ teamId?: string; role?: string } | null>(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>("00:00:00");
  const [activeEvent, setActiveEvent] = useState<Event | null>(null);

  // If they are on the login or lobby page, don't show the heavy navigation
  const isAuthOrLobby = pathname === "/lab/login" || pathname === "/lab/lobby";

  useEffect(() => {
    const fetchSession = async () => {
      const data = await getLabSession();
      setSession(data);
      
      const eventRes = await getActiveEventAction();
      if (eventRes.success && eventRes.event) {
        setActiveEvent(eventRes.event);
      }
    };
    fetchSession();
  }, []);

  // Real-time Countdown logic
  useEffect(() => {
    if (!activeEvent?.end_time) return;

    const timer = setInterval(() => {
      const end = new Date(activeEvent.end_time!).getTime();
      const now = new Date().getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft("00:00:00");
        clearInterval(timer);
        return;
      }

      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(
        `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [activeEvent]);

  const handleLogout = async () => {
    await destroyLabSession();
    router.push("/lab/login");
  };

  if (isAuthOrLobby) {
    return <div className="bg-background min-h-screen font-body-main">{children}</div>;
  }

  return (
    <div className="flex h-screen bg-background text-on-surface font-body-main overflow-hidden selection:bg-primary/30">
      
      {/* SIDEBAR (Desktop) */}
      <aside className="hidden md:flex flex-col w-64 border-r border-white/5 bg-zinc-950 z-20 overflow-y-auto custom-scrollbar">
        <div className="p-8 mb-8 border-b border-white/5 bg-white/[0.01]">
          <p className="font-label-caps text-white/20 text-[9px] mb-2 tracking-[0.3em]">HACK_FLOW // CORE</p>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-secondary rounded-full pulse-emerald shadow-[0_0_8px_#4edea3]" />
            <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">LAB_SYSTEM</h3>
          </div>
        </div>

        {/* MISSION TIMER */}
        <div className="px-6 mb-10 shrink-0">
          <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl rim-light shadow-inner group hover:bg-white/[0.04] transition-all">
            <div className="flex items-center gap-2 mb-3">
              <Clock size={12} className="text-secondary animate-pulse" />
              <span className="text-[9px] font-black text-secondary uppercase tracking-[0.2em] font-label-caps">Mission_Remaining</span>
            </div>
            <div className="text-3xl font-black text-white font-data-mono tracking-tighter tabular-nums">
              {timeLeft}
            </div>
          </div>
        </div>

        <LabSidebarNav />

        <div className="mt-auto pt-8 border-t border-white/5 pb-10 bg-white/[0.01] shrink-0">
          <div className="px-8 mb-6">
            <p className="text-[9px] font-black text-white/20 uppercase tracking-widest font-label-caps mb-3">AUTHORIZED_NODE</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-xs font-black text-secondary">
                {session?.role === 'LEAD' ? 'LD' : 'MB'}
              </div>
              <div>
                <p className="text-[11px] font-black text-white font-data-mono uppercase tracking-tighter">{session?.teamId ? session.teamId.substring(0,12) : "ANON_NODE"}</p>
                <p className="text-[9px] font-bold text-secondary uppercase tracking-widest font-label-caps">Access_Verified</p>
              </div>
            </div>
          </div>
          <div className="px-6">
             <button 
                onClick={handleLogout}
                className="w-full py-4 bg-red-500/5 hover:bg-red-500/10 text-red-500 font-black text-[10px] uppercase tracking-[0.2em] border border-red-500/10 rounded-xl transition-all flex items-center justify-center gap-2 font-label-caps active:scale-95"
              >
                <LogOut size={14} /> TERMINATE_UPLINK
              </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col relative">
        {/* TOP NAVBAR */}
        <header className="h-16 border-b border-white/5 bg-zinc-950/80 backdrop-blur-xl flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-6">
            <button className="md:hidden text-white/40 hover:text-white" onClick={() => setIsMobileOpen(!isMobileOpen)}>
              <Menu size={20} />
            </button>
            <div className="hidden md:flex items-center gap-3 font-data-mono text-[10px] font-black text-white/40 uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary pulse-emerald shadow-[0_0_8px_#4edea3]"></span>
              System_Integrity: 100%
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="px-4 py-1.5 bg-white text-black rounded-full flex items-center gap-2">
              <Zap size={10} fill="currentColor" />
              <span className="text-[9px] font-black uppercase tracking-widest font-label-caps">Node_Connected</span>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT CONTAINER */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#050505]">
          {children}
        </main>

        {/* PERSISTENT AI CHAT AGENT (Runs in background across pages) */}
        {session?.teamId && session?.role && (
          <AIChatAgent 
            teamId={session.teamId} 
            role={session.role as string} 
          />
        )}
      </div>

      {/* MOBILE OVERLAY */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/95 backdrop-blur-md p-6 flex flex-col overflow-y-auto">
          <button onClick={() => setIsMobileOpen(false)} className="text-secondary text-xs mb-8 font-label-caps tracking-widest font-black uppercase tracking-[0.3em] shrink-0 text-left">{"< ABORT_RETURN"}</button>
          <nav className="flex-1 space-y-6">
             {navItems.map((item) => (
                <Link 
                  key={item.name} href={item.path} onClick={() => setIsMobileOpen(false)}
                  className="block text-2xl font-black font-label-caps text-white hover:text-secondary transition-colors uppercase italic italic tracking-tighter"
                >{item.name}</Link>
             ))}
          </nav>
          <div className="mt-auto pb-10">
             <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-4">Mission_Timer</div>
             <div className="text-4xl font-black text-white font-data-mono tabular-nums">{timeLeft}</div>
          </div>
        </div>
      )}
    </div>
  );
}