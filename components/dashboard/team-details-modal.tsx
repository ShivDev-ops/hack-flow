"use client";

import { X, User, ShieldCheck, ShieldAlert, Star, Users } from "lucide-react";
import { Team, TeamMember } from "@/types/common";

export function TeamDetailsModal({ 
  isOpen, 
  onClose, 
  team, 
  members 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  team: Team | null, 
  members: TeamMember[] 
}) {
  if (!isOpen || !team) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4">
      <div className="bg-zinc-950 border border-white/10 w-full max-w-4xl rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">
                Team: <span className="text-emerald-500">{team.name}</span>
              </h2>
              <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">Active</span>
            </div>
            <p className="text-[10px] text-slate-500 font-mono uppercase mt-2 tracking-widest">Registry_ID: {team.readable_id || team.id}</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white p-3 rounded-full hover:bg-white/5 transition-all"><X size={24} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          
          {/* Members Section */}
          <section className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <Users size={12} className="text-emerald-500" /> Deployed Personnel
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {members.map((member) => (
                <div key={member.id} className="bg-white/5 border border-white/5 p-6 rounded-3xl space-y-4 hover:border-emerald-500/30 transition-all group">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                        {member.role === 'LEAD' ? <Star size={18} className="text-emerald-500" /> : <User size={18} className="text-emerald-500" />}
                      </div>
                      <div>
                        <p className="text-white font-bold text-sm uppercase tracking-tight">{member.name || (member.role === 'LEAD' ? 'Team Lead' : 'Specialist')}</p>
                        <p className="text-[10px] text-slate-500 font-mono uppercase">{member.user_id || 'UPLINK_PENDING'}</p>
                      </div>
                    </div>
                    {member.is_verified ? (
                      <div className="flex items-center gap-1 text-[8px] font-black text-emerald-500 uppercase bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                        <ShieldCheck size={10} /> Verified
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-[8px] font-black text-red-500 uppercase bg-red-500/10 px-2 py-1 rounded border border-red-500/20">
                        <ShieldAlert size={10} /> Unverified
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div className="bg-black/40 rounded-xl p-3 border border-white/5">
                       <p className="text-[8px] text-slate-600 font-black uppercase mb-1">Status</p>
                       <p className="text-[10px] text-white font-bold uppercase">{member.is_verified ? 'Authorized' : 'Pending'}</p>
                    </div>
                    <div className="bg-black/40 rounded-xl p-3 border border-white/5">
                       <p className="text-[8px] text-slate-600 font-black uppercase mb-1">Access_Tier</p>
                       <p className="text-[10px] text-white font-bold uppercase">{member.role === 'LEAD' ? 'Level_4' : 'Level_2'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Technical Metadata (Placeholders for now as per schema) */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
             <div className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Deployment Stats</h3>
                <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 space-y-4">
                   <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 uppercase font-black">Sync_Status</span>
                      <span className="text-emerald-500 font-mono uppercase">Optimal</span>
                   </div>
                   <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 uppercase font-black">Lab_Environment</span>
                      <span className="text-white font-mono uppercase">Docker_Container_A1</span>
                   </div>
                   <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 uppercase font-black">Last_Handshake</span>
                      <span className="text-slate-400 font-mono uppercase">2m ago</span>
                   </div>
                </div>
             </div>
             <div className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Resource Allocation</h3>
                <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 space-y-4">
                   <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full w-[65%]" />
                   </div>
                   <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                      <span className="text-slate-500">Project Progress</span>
                      <span className="text-emerald-500">65%</span>
                   </div>
                </div>
             </div>
          </section>
        </div>

        {/* Footer Actions */}
        <div className="p-8 border-t border-white/5 bg-white/[0.01] flex justify-end gap-3">
          <button onClick={onClose} className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase hover:bg-white/5 rounded-2xl transition-all">Close Console</button>
          <button className="px-8 py-4 bg-emerald-500 text-black text-[10px] font-black uppercase rounded-2xl hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/10">Modify Permissions</button>
        </div>
      </div>
    </div>
  );
}
