"use client";

import { Lightbulb, Bell, AlertTriangle, TrendingUp } from "lucide-react";

interface Insight {
  type: "suggestion" | "reminder" | "warning";
  text: string;
}

interface AIInsightPanelProps {
  briefing: string | null;
  insights: Insight[];
  nextMilestone: string | null;
  progress: number;
}

export function AIInsightPanel({ briefing, insights, nextMilestone, progress }: AIInsightPanelProps) {
  return (
    <div className="glass-panel rim-light rounded-[2rem] overflow-hidden border border-white/5 bg-white/[0.01] shadow-2xl">
      <header className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-400">
            <Lightbulb size={20} />
          </div>
          <span className="text-sm font-black uppercase tracking-widest text-white">AI Assistant</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-1.5 bg-white/5 rounded-full border border-white/10">
          <TrendingUp size={14} className="text-emerald-400" />
          <span className="text-xs font-bold text-white/70 uppercase tracking-tight">Progress: {progress}%</span>
        </div>
      </header>

      <div className="p-6 space-y-8">
        {/* Briefing Section */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-white/30 uppercase tracking-widest italic">Project Summary</p>
          <p className="text-base text-white/80 leading-relaxed font-medium">
            {briefing || "Awaiting technical analysis..."}
          </p>
        </div>

        {/* Actionable Insights */}
        <div className="space-y-4">
          {insights.length > 0 ? (
            insights.map((insight, i) => (
              <div key={i} className="flex gap-4 p-5 bg-white/[0.03] border border-white/5 rounded-2xl group hover:bg-white/[0.05] transition-all">
                <div className={`mt-0.5 shrink-0 ${
                  insight.type === 'warning' ? 'text-red-400' : 
                  insight.type === 'reminder' ? 'text-blue-400' : 'text-amber-400'
                }`}>
                  {insight.type === 'warning' ? <AlertTriangle size={18} /> : 
                   insight.type === 'reminder' ? <Bell size={18} /> : <Lightbulb size={18} />}
                </div>
                <p className="text-sm text-white/70 group-hover:text-white transition-colors leading-relaxed">
                  {insight.text}
                </p>
              </div>
            ))
          ) : (
            <div className="py-6 text-center border-2 border-dashed border-white/5 rounded-3xl">
                <p className="text-xs text-white/20 font-bold tracking-widest">Analyzing project status...</p>
            </div>
          )}
        </div>

        {/* Next Objective Focus */}
        {nextMilestone && (
          <div className="pt-6 border-t border-white/5">
            <div className="bg-secondary/10 border border-secondary/20 p-5 rounded-[1.5rem] flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-secondary uppercase tracking-[0.3em]">Next Step</p>
                <p className="text-base font-bold text-white">{nextMilestone}</p>
              </div>
              <div className="h-10 w-10 rounded-full border-2 border-secondary/30 flex items-center justify-center">
                 <div className="h-5 w-5 bg-secondary rounded-full animate-pulse shadow-[0_0_10px_#10b981]" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
