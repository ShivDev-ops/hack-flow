// components/layout/sidebar.tsx
"use client";

import { LayoutDashboard, Activity, Terminal, Settings, X } from "lucide-react";

interface SidebarProps {
  role: "organiser" | "participant";
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ role, isOpen, onClose }: SidebarProps) {
  const isOrg = role === "organiser";

  return (
    <>
      {/* Mobile Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] transition-opacity duration-300 lg:hidden ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Drawer Sidebar */}
      <aside className={`
        fixed left-0 top-0 bottom-0 z-[70] w-72 bg-[#0A0A0B] border-r border-white/10 flex flex-col py-6 transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:left-6 lg:top-24 lg:bottom-10 lg:w-64 lg:rounded-2xl lg:border lg:shadow-2xl lg:bg-[#111118]/90 lg:backdrop-blur-2xl
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        {/* Mobile Close Button - Using the 'X' icon */}
        <button onClick={onClose} className="lg:hidden absolute top-4 right-4 text-slate-500 hover:text-white">
          <X size={20} />
        </button>

        <div className="px-6 mb-8 flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full animate-pulse ${isOrg ? 'bg-emerald-400' : 'bg-blue-400'}`} />
          <p className="font-mono text-[10px] text-white tracking-widest uppercase">
            {isOrg ? "HaaS Controller" : "Participant Node"}
          </p>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <a href="/dashboard" className="flex items-center gap-3 bg-blue-500/10 text-blue-400 border-l-4 border-blue-500 px-4 py-3 rounded-r-lg group">
            <LayoutDashboard size={18} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Overview</span>
          </a>
          
          {isOrg && (
            <a href="/dashboard/triage" className="flex items-center gap-3 text-slate-500 px-4 py-3 hover:bg-white/5 hover:text-white rounded-lg transition-all">
              <Activity size={18} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Triage Feed</span>
            </a>
          )}
          
          <a href="/dashboard/terminal" className="flex items-center gap-3 text-slate-500 px-4 py-3 hover:bg-white/5 hover:text-white rounded-lg transition-all">
            <Terminal size={18} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Terminal</span>
          </a>
        </nav>
      </aside>
    </>
  );
}