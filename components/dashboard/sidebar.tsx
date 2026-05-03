import { 
  LayoutDashboard, 
  Rss, 
  Terminal, 
  FileText, 
  Settings, 
  ChevronUp, 
  LifeBuoy, 
  History 
} from "lucide-react";
import Link from "next/link";

const MENU_ITEMS = [
  { icon: LayoutDashboard, label: "Overview", href: "/dashboard", active: true },
  { icon: Rss, label: "Live Feed", href: "/dashboard/feed" },
  { icon: Terminal, label: "Terminal", href: "/dashboard/terminal" },
  { icon: FileText, label: "Resources", href: "/dashboard/resources" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

export function Sidebar() {
  return (
    <div className="flex flex-col h-full p-4">
      {/* HaaS Controller Status */}
      <div className="mb-10 p-4 bg-white/5 rounded-xl border border-white/5">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-black text-white uppercase tracking-widest">HaaS Controller</span>
        </div>
        <p className="text-[9px] text-emerald-500/70 font-mono font-bold">V0.42-STABLE</p>
      </div>

      {/* Primary Navigation */}
      <nav className="flex-1 space-y-1">
        {MENU_ITEMS.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-tight transition-all ${
              item.active 
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
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
        <button className="w-full bg-zinc-800 text-white text-[10px] font-black py-3 rounded-lg uppercase hover:bg-zinc-700 transition-all">
          Upgrade Node
        </button>
        
        <div className="space-y-1">
          <button className="flex items-center gap-3 px-4 py-2 text-[10px] font-bold text-slate-500 hover:text-white uppercase">
            <LifeBuoy size={14} /> Support
          </button>
          <button className="flex items-center gap-3 px-4 py-2 text-[10px] font-bold text-slate-500 hover:text-white uppercase">
            <History size={14} /> Logs
          </button>
        </div>
      </div>
    </div>
  );
}