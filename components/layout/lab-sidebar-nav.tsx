"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Terminal, 
  Network, 
  Trophy, 
  FileText, 
  ShieldAlert,
  BookOpen
} from "lucide-react";

export function LabSidebarNav() {
  const pathname = usePathname();

  const navItems = [
    { name: "Terminal", path: "/lab/dashboard/terminal", icon: Terminal },
    { name: "Objectives", path: "/lab/dashboard/kanban", icon: FileText },
    { name: "Leaderboard", path: "/lab/leaderboard", icon: Trophy },
    { name: "Mission_Specs", path: "/lab/specs", icon: FileText },
    { name: "Mission_Briefing", path: "/lab/dashboard/briefing", icon: BookOpen },
    { name: "Config-Sys", path: "/lab/dashboard/config-sys", icon: ShieldAlert },
    { name: "Sys_Setup", path: "/lab/config", icon: Network },
  ];

  return (
    <nav className="flex-1 space-y-1 px-4">
      {navItems.map((item) => {
        const isActive = pathname === item.path;
        const Icon = item.icon;
        return (
          <Link
            key={item.name}
            href={item.path}
            className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all ${
              isActive
                ? "bg-white text-black font-black"
                : "text-white/40 hover:text-white hover:bg-white/5 font-bold"
            }`}
          >
            <Icon size={16} />
            <span className="text-[10px] uppercase tracking-[0.2em] font-label-caps">
              {item.name}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
