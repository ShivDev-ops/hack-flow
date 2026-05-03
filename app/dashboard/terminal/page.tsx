// app/dashboard/terminal/page.tsx
import { createClient } from "@/lib/supabase/server";
import { Terminal as TerminalIcon, Cpu, ShieldCheck } from "lucide-react";

export default async function TerminalPage() {
  const supabase = await createClient();

  // Fetch the 15 most recent registry actions
  const { data: logs } = await supabase
    .from("hf_participants")
    .select("full_name, created_at, is_claimed, team_name")
    .order("created_at", { ascending: false })
    .limit(15);

  return (
    <div className="h-[calc(100vh-160px)] flex flex-col space-y-6 font-mono">
      <header className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <TerminalIcon className="text-emerald-500" size={20} />
          <h1 className="text-xl font-black text-white uppercase italic tracking-tighter">
            HaaS_Terminal_V0.42
          </h1>
        </div>
        <div className="flex gap-4 text-[10px] text-slate-500 uppercase font-bold">
          <span className="flex items-center gap-1"><Cpu size={12} /> CPU: 12%</span>
          <span className="flex items-center gap-1 text-emerald-500"><ShieldCheck size={12} /> SECURE_LINK: ACTIVE</span>
        </div>
      </header>

      <div className="flex-1 bg-black/40 border border-white/5 rounded-2xl p-6 text-[11px] overflow-y-auto custom-scrollbar relative">
        <div className="space-y-2">
          <p className="text-emerald-500/50">-- SYSTEM INITIALIZED --</p>
          <p className="text-slate-500">Connecting to Registry_Ingestion_Engine...</p>
          
          {logs?.map((log, i) => (
            <div key={i} className="flex gap-4 group">
              <span className="text-slate-700">[{new Date(log.created_at).toLocaleTimeString()}]</span>
              <span className={log.is_claimed ? "text-emerald-400" : "text-amber-500"}>
                {log.is_claimed ? "[IDENTITY_CLAIMED]" : "[NODE_INGESTED]"}
              </span>
              <span className="text-white uppercase tracking-tight">
                {log.full_name} <span className="text-slate-600">//</span> {log.team_name}
              </span>
            </div>
          ))}
          
          <div className="flex items-center gap-2 mt-6 pt-6 border-t border-white/5">
            <span className="text-emerald-500 animate-pulse font-bold">{">"}</span>
            <input 
              className="bg-transparent border-none outline-none text-white w-full placeholder:text-slate-800" 
              placeholder="System is listening for commands..."
            />
          </div>
        </div>
      </div>

      <footer className="text-[9px] text-slate-700 uppercase font-black flex justify-between tracking-[0.3em]">
        <span>Buffer: Clear</span>
        <span>Latent: 14ms</span>
        <span>Status: Nominal</span>
      </footer>
    </div>
  );
}