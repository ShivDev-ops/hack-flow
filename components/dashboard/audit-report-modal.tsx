"use client";

import React from "react";
import { X, Zap, BarChart3, MessageSquare, Target, Cpu, CheckCircle2, Circle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Team, JudgingResult, DNAMilestone } from "@/types/common";

interface AuditReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: Team | null;
  results: JudgingResult | null;
  milestones: DNAMilestone[];
}

export function AuditReportModal({ isOpen, onClose, team, results, milestones }: AuditReportModalProps) {
  if (!isOpen || !team) return null;

  const scoreFactors = [
    { label: "Alignment", value: results?.alignment_score || 0, icon: Target, color: "text-blue-400", bg: "bg-blue-400/10" },
    { label: "Execution", value: results?.execution_score || 0, icon: BarChart3, color: "text-emerald-400", bg: "bg-emerald-400/10" },
    { label: "Innovation", value: results?.innovation_score || 0, icon: Zap, color: "text-amber-400", bg: "bg-amber-400/10" },
    { label: "Technical Depth", value: results?.technical_score || 0, icon: Cpu, color: "text-purple-400", bg: "bg-purple-400/10" },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-zinc-950 border border-white/10 w-full max-w-6xl rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-10 border-b border-white/5 flex justify-between items-start bg-white/[0.02]">
            <div>
              <div className="flex items-center gap-4 mb-2">
                <div className="p-3 bg-secondary/10 rounded-2xl text-secondary border border-secondary/20">
                  <Zap size={24} className="animate-pulse" />
                </div>
                <div>
                    <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">
                        Audit_Report: <span className="text-secondary">{team.name}</span>
                    </h2>
                    <p className="text-[10px] text-white/30 font-mono uppercase mt-2 tracking-[0.3em]">Technical Evidence & Standing // Node_{team.readable_id}</p>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="text-white/20 hover:text-white p-4 rounded-full hover:bg-white/5 transition-all"><X size={32} /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar">
            
            {/* Top Row: Global Score & Factors */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-4 flex flex-col justify-center items-center bg-white/[0.02] border border-white/5 rounded-[2rem] p-10 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                    <p className="text-[11px] font-black text-white/20 uppercase tracking-[0.5em] mb-4 relative z-10">Final_Audit_Score</p>
                    <div className="text-8xl font-black text-white italic tracking-tighter relative z-10">
                        {results?.total_score || "--"}
                    </div>
                    <div className="mt-6 px-6 py-2 bg-secondary/10 border border-secondary/20 rounded-full relative z-10">
                        <span className="text-[10px] font-black text-secondary uppercase tracking-widest">Global_Standing_Verified</span>
                    </div>
                </div>

                <div className="lg:col-span-8 grid grid-cols-2 gap-6">
                    {scoreFactors.map((factor) => (
                        <div key={factor.label} className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl flex items-center justify-between group hover:border-white/10 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-xl ${factor.bg} ${factor.color}`}>
                                    <factor.icon size={20} />
                                </div>
                                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{factor.label}</span>
                            </div>
                            <div className="text-3xl font-black text-white font-data-mono">{factor.value}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* AI Technical Assessment */}
            <section className="space-y-6">
                <div className="flex items-center gap-3">
                    <MessageSquare size={16} className="text-secondary" />
                    <h3 className="text-sm font-black text-white uppercase tracking-[0.3em]">AI_Technical_Assessment</h3>
                </div>
                <div className="bg-secondary/[0.03] border border-secondary/10 p-8 rounded-[2rem] relative">
                    <div className="absolute top-0 left-10 w-px h-full bg-secondary/10" />
                    <p className="text-lg text-white/70 font-medium leading-relaxed italic pl-12 border-l-2 border-secondary/20">
                        &quot;{results?.ai_justification || "Audit pending additional technical evidence from implementation pulse."}&quot;
                    </p>
                </div>
            </section>

            {/* Implementation Pulse Detail */}
            <section className="space-y-8">
                <div className="flex justify-between items-end">
                    <div className="flex items-center gap-3">
                        <BarChart3 size={16} className="text-secondary" />
                        <h3 className="text-sm font-black text-white uppercase tracking-[0.3em]">Implementation_Pulse // DNA_Match</h3>
                    </div>
                    <div className="text-right">
                        <span className="text-[10px] font-black text-secondary uppercase tracking-widest">Completion: {team.ai_progress_score}%</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {milestones.length > 0 ? milestones.map((m) => (
                        <div key={m.id} className={`p-6 rounded-3xl border transition-all ${m.status === 'complete' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-white/[0.01] border-white/5'}`}>
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    {m.status === 'complete' ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Circle size={16} className="text-white/10" />}
                                    <h4 className="text-xs font-black text-white uppercase tracking-wider">{m.milestone_title}</h4>
                                </div>
                                <span className="text-[9px] font-mono text-white/20 font-bold">W_{m.weight}</span>
                            </div>
                            <p className="text-[11px] text-white/40 leading-relaxed italic mb-4">{m.milestone_description}</p>
                            <div className="p-3 bg-black/40 border border-white/5 rounded-xl">
                                <p className="text-[8px] text-white/20 uppercase font-black tracking-tighter mb-1">Target Evidence</p>
                                <p className="text-[10px] text-secondary/60 font-mono leading-tight uppercase">{m.verification_criteria}</p>
                            </div>
                        </div>
                    )) : (
                        <div className="col-span-2 py-10 text-center border-2 border-dashed border-white/5 rounded-3xl">
                            <p className="text-[10px] text-white/20 uppercase font-black tracking-widest">No DNA milestones synthesized</p>
                        </div>
                    )}
                </div>
            </section>

          </div>

          {/* Footer */}
          <div className="p-10 border-t border-white/5 bg-white/[0.01] flex justify-between items-center">
            <div className="flex items-center gap-4 text-[9px] font-black text-white/20 uppercase tracking-widest">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                    <span>Evidence_Locked</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                    <span>Audit_Finalized</span>
                </div>
            </div>
            <button onClick={onClose} className="px-10 py-5 bg-white text-black text-xs font-black uppercase rounded-2xl hover:bg-zinc-200 transition-all shadow-xl active:scale-95">Acknowledge_Report</button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
