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
          <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
            <Lightbulb size={18} />
          </div>
          <span className="text-[12px] font-black uppercase tracking-[0.3em] text-white font-label-caps">Neural_Insights</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
          <TrendingUp size={12} className="text-emerald-400" />
          <span className="text-[10px] font-bold text-white/70 uppercase tracking-tighter">Growth_Index: {progress}%</span>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Briefing Section */}
        <div className="space-y-2">
          <p className="text-[11px] font-black text-white/30 uppercase tracking-widest font-mono italic">Situation_Report</p>
          <p className="text-sm text-white/80 leading-relaxed font-medium">
            {briefing || "Uplink established. Awaiting initial technical analysis from the Architect personality..."}
          </p>
        </div>

        {/* Actionable Insights */}
        <div className="space-y-3">
          {insights.length > 0 ? (
            insights.map((insight, i) => (
              <div key={i} className="flex gap-4 p-4 bg-white/[0.03] border border-white/5 rounded-2xl group hover:bg-white/[0.05] transition-all">
                <div className={`mt-0.5 shrink-0 ${
                  insight.type === 'warning' ? 'text-red-400' : 
                  insight.type === 'reminder' ? 'text-blue-400' : 'text-amber-400'
                }`}>
                  {insight.type === 'warning' ? <AlertTriangle size={16} /> : 
                   insight.type === 'reminder' ? <Bell size={16} /> : <Lightbulb size={16} />}
                </div>
                <p className="text-[13px] text-white/70 group-hover:text-white transition-colors leading-snug">
                  {insight.text}
                </p>
              </div>
            ))
          ) : (
            <div className="py-4 text-center border-2 border-dashed border-white/5 rounded-2xl">
                <p className="text-[10px] text-white/20 uppercase font-bold tracking-tighter">Scanning_for_Technical_Gaps...</p>
            </div>
          )}
        </div>

        {/* Next Objective Focus */}
        {nextMilestone && (
          <div className="pt-4 border-t border-white/5">
            <div className="bg-secondary/10 border border-secondary/20 p-4 rounded-2xl flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[9px] font-black text-secondary uppercase tracking-[0.2em]">Priority_Target</p>
                <p className="text-sm font-bold text-white">{nextMilestone}</p>
              </div>
              <div className="h-8 w-8 rounded-full border-2 border-secondary/30 flex items-center justify-center">
                 <div className="h-4 w-4 bg-secondary rounded-full animate-pulse" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
