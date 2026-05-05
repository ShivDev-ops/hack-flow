"use client";

import { motion } from "framer-motion";

interface MissionControlProps {
  healthPercentage: number;
}

export function MissionControl({ healthPercentage }: MissionControlProps) {
  return (
    <div className="col-span-1 lg:col-span-2 bg-[#1e293b]/50 border border-[#1e293b] p-6 rounded-2xl shadow-xl flex flex-col justify-center">
      <div className="flex justify-between items-end mb-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tighter italic text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Mission Control</h1>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Overall Project Health</p>
        </div>
        <span className="text-2xl font-black text-emerald-500">{healthPercentage}%</span>
      </div>
      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${healthPercentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-full bg-emerald-500 shadow-[0_0_15px_#10b981]"
        />
      </div>
    </div>
  );
}
