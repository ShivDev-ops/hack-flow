"use client";

import { 
  Eye, 
  Settings, 
  FileText, 
  ArrowLeft,
  LifeBuoy, 
  History,
  Rocket
} from "lucide-react";
import Link from "next/link";
import { useParams, usePathname, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";

export function Sidebar() {
  const params = useParams();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  
  // Try to get eventId from:
  // 1. URL params (for /dashboard/event/[id] paths)
  // 2. Search params (for /dashboard/triage?event_id=...)
  // 3. Session (for logged in organizers)
  const eventId = (params?.id as string) || searchParams.get("event_id") || session?.eventId;

  const MENU_ITEMS = [
    { 
      icon: Eye, 
      label: "View", 
      href: eventId ? `/dashboard/event/${eventId}` : "#",
      active: eventId ? pathname === `/dashboard/event/${eventId}` : false
    },
    { 
      icon: FileText, 
      label: "Resources", 
      href: eventId ? `/dashboard/event/${eventId}/resources` : "#",
      active: eventId ? pathname === `/dashboard/event/${eventId}/resources` : false
    },
    { 
        icon: Rocket, 
        label: "Triage", 
        href: eventId ? `/dashboard/triage?event_id=${eventId}` : "/dashboard/triage",
        active: pathname === "/dashboard/triage"
    },
    { 
      icon: Settings, 
      label: "Config", 
      href: eventId ? `/dashboard/event/${eventId}/config` : "#",
      active: eventId ? pathname === `/dashboard/event/${eventId}/config` : false
    },
  ];

  return (
    <div className="flex flex-col h-full p-4 bg-[#050505]">
      {/* HaaS Controller Status */}
      <div className="mb-10 p-4 bg-white/5 rounded-xl border border-white/5">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-black text-white uppercase tracking-widest">Node Controller</span>
        </div>
        <p className="text-[9px] text-emerald-500/70 font-mono font-bold">EVENT_ID: {eventId?.substring(0,8) || "NO_NODE"}</p>
      </div>

      {/* Primary Navigation */}
      <nav className="flex-1 space-y-1">
        {MENU_ITEMS.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-tight transition-all ${
              item.active 
                ? "bg-white text-black" 
                : "text-slate-500 hover:text-white hover:bg-white/5"
            }`}
          >
            <item.icon size={18} />
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="pt-6 border-t border-white/5 space-y-4">
        <Link 
            href="/dashboard"
            className="flex items-center gap-3 px-4 py-3 w-full bg-zinc-900 text-white/40 hover:text-white text-[10px] font-black rounded-lg uppercase transition-all"
        >
          <ArrowLeft size={14} /> Return to Fleet
        </Link>
        
        <div className="px-2 space-y-2">
            <div className="flex items-center gap-2 text-[8px] font-bold text-white/20 uppercase tracking-widest">
                <div className="h-[1px] flex-1 bg-white/5"></div>
                Support_Link
                <div className="h-[1px] flex-1 bg-white/5"></div>
            </div>
            <button className="flex items-center gap-3 px-2 py-1 text-[9px] font-bold text-slate-600 hover:text-white uppercase transition-all">
                <LifeBuoy size={12} /> System Help
            </button>
            <button className="flex items-center gap-3 px-2 py-1 text-[9px] font-bold text-slate-600 hover:text-white uppercase transition-all">
                <History size={12} /> Sync Logs
            </button>
        </div>
      </div>
    </div>
  );
}
