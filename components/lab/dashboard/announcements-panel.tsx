"use client";

import { AlertTriangle } from "lucide-react";

interface AnnouncementsPanelProps {
  announcements: string[];
}

export function AnnouncementsPanel({ announcements }: AnnouncementsPanelProps) {
  return (
    <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 shadow-xl">
       <header className="flex items-center gap-2 text-amber-500 mb-3">
          <AlertTriangle size={16} />
          <span className="text-xs font-black uppercase tracking-widest">Announcements</span>
       </header>
       <div className="space-y-2">
          {announcements.map((ann, i) => (
            <p key={i} className="text-[10px] text-amber-500/80 leading-relaxed font-sans">
              &quot;{ann}&quot;
            </p>
          ))}
       </div>
    </div>
  );
}
