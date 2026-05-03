import { Search, Bell, Monitor } from "lucide-react";

export function Navbar() {
  return (
    <nav className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-black/20 backdrop-blur-md sticky top-0 z-50">
      {/* Global Search */}
      <div className="relative w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
        <input 
          type="text" 
          placeholder="Search event fleet..."
          className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-emerald-500/50 transition-all"
        />
      </div>

      {/* Action Tray */}
      <div className="flex items-center gap-6">
        <button className="text-slate-500 hover:text-white transition-colors">
          <Monitor size={20} />
        </button>
        <button className="text-slate-500 hover:text-white transition-colors relative">
          <Bell size={20} />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-black" />
        </button>
        
        {/* Profile Avatar */}
        <div className="flex items-center gap-3 pl-6 border-l border-white/10">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-700 border border-white/20 overflow-hidden">
            {/* User image would go here */}
          </div>
        </div>
      </div>
    </nav>
  );
}