"use client";

import { useState } from "react";
import { X, UserPlus, Phone, Users, ShieldAlert, Loader2, CreditCard, ExternalLink } from "lucide-react";
import { addManualParticipantAction } from "@/app/actions/ingest";

export function NodeDetailsModal({ 
  isOpen, 
  onClose, 
  teamMembers, 
  event 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  teamMembers: any[], 
  event: any 
}) {
  const [loading, setLoading] = useState(false);
  const [newMember, setNewMember] = useState({ name: "", regNo: "", email: "", phone: "" });

  if (!isOpen || !teamMembers[0]) return null;

  const currentSize = teamMembers.length; // Current number of members in team[cite: 5]
  const maxLimit = event?.max_team_size || 4; // Maximum allowed team size[cite: 5]
  const isFull = currentSize >= maxLimit; // Sector capacity check[cite: 5]

  // Extract shared financial metadata from the primary team node[cite: 5]
  const transactionId = teamMembers[0].payment_id;
  const transactionUrl = teamMembers[0].payment_url;

  const handleAddMember = async () => {
    setLoading(true);
    // Manually inject a new member node into the current team[cite: 6]
    const res = await addManualParticipantAction(event.id, {
      name: newMember.name,
      regNo: newMember.regNo,
      team: teamMembers[0].team_name,
      email: newMember.email,
      phone: newMember.phone,
      role: 'member'
    });
    
    if (res.success) {
      setNewMember({ name: "", regNo: "", email: "", phone: "" });
      onClose(); // Triggers a re-fetch in the triage parent
    } else {
      alert(res.error);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4">
      <div className="bg-zinc-950 border border-white/10 w-full max-w-5xl rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Tactical Header */}
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
          <div>
            <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">
              Team: <span className="text-emerald-500">{teamMembers[0].team_name}</span>
            </h2>
            <div className="flex items-center gap-4 mt-3">
               <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
                <Users size={12} className="text-emerald-500" /> {currentSize} / {maxLimit} Nodes Active
              </p>
              {transactionId && (
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
                  <CreditCard size={12} className="text-emerald-500" /> TXID: <span className="text-white font-mono uppercase">{transactionId}</span>
                </p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white p-3 rounded-full hover:bg-white/5 transition-all"><X size={24} /></button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-white/5 overflow-hidden flex-1">
          
          {/* COLUMN 1: Active Roster */}
          <div className="p-8 overflow-y-auto space-y-6 lg:col-span-1 custom-scrollbar">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Personnel</h3>
            {teamMembers.map((m: any) => (
              <div key={m.id} className="bg-white/5 border border-white/5 p-5 rounded-2xl space-y-2 group hover:border-emerald-500/30 transition-all">
                <div className="flex justify-between items-start">
                  <p className="text-white font-bold text-sm uppercase leading-none tracking-tight">{m.full_name}</p>
                  <span className="text-[8px] font-black text-slate-500 bg-white/5 px-2 py-1 rounded uppercase tracking-tighter group-hover:text-emerald-400 transition-colors">{m.role}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-[10px] text-emerald-500 font-mono uppercase">{m.registration_no}</p>
                  {m.phone_number && (
                    <div className="flex items-center gap-1 text-[9px] text-slate-500 font-mono">
                      <Phone size={10} className="text-emerald-500/50" />
                      {m.phone_number}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* COLUMN 2: Financial Telemetry */}
          <div className="p-8 bg-white/[0.01] lg:col-span-1 overflow-y-auto custom-scrollbar">
             <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Financial Verification</h3>
             <div className="space-y-4">
                <div className="p-6 bg-black border border-white/10 rounded-2xl space-y-2">
                   <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Transaction_ID</p>
                   <p className="text-xs text-white font-mono break-all uppercase">{transactionId || "NO_TRANSACTION_ID_FOUND"}</p>
                </div>
                {transactionUrl ? (
                  <div className="space-y-3">
                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest ml-1">Payment_Proof</p>
                    <div className="relative group rounded-2xl overflow-hidden border border-white/10 bg-black">
                      <img 
                        src={transactionUrl} 
                        alt="Payment Screenshot" 
                        className="w-full h-auto object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                        onError={(e: any) => {
                          e.target.onerror = null;
                          e.target.src = "https://placehold.co/600x400/000000/10b981?text=INVALID_IMAGE_URL";
                        }}
                      />
                      <a 
                        href={transactionUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ExternalLink size={24} className="text-white" />
                      </a>
                    </div>
                    <a 
                      href={transactionUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 text-[8px] font-black text-emerald-500 uppercase tracking-widest hover:text-emerald-400 transition-colors"
                    >
                      Open Original <ExternalLink size={10} />
                    </a>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-10 bg-white/5 border border-white/10 rounded-2xl opacity-50 gap-4">
                    <ShieldAlert size={28} className="text-slate-500" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">No Screenshot Available</span>
                  </div>
                )}
             </div>
          </div>

          {/* COLUMN 3: Manual Injection */}
          <div className="p-8 bg-white/[0.02] lg:col-span-1">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Inject New Member</h3>
            {isFull ? (
              <div className="bg-red-500/5 border border-red-500/10 p-8 rounded-3xl flex flex-col items-center text-center gap-4">
                <ShieldAlert className="text-red-500" size={32} />
                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest leading-relaxed">
                  Sector Capacity Reached.<br/>Max allocation of {maxLimit} nodes deployed.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <input className="w-full bg-black border border-white/10 rounded-xl p-4 text-[10px] text-white focus:border-emerald-500 outline-none font-mono uppercase" placeholder="NAME" value={newMember.name} onChange={e => setNewMember({...newMember, name: e.target.value})} />
                <input className="w-full bg-black border border-white/10 rounded-xl p-4 text-[10px] text-white focus:border-emerald-500 outline-none font-mono uppercase" placeholder="REG_ID" value={newMember.regNo} onChange={e => setNewMember({...newMember, regNo: e.target.value})} />
                <input className="w-full bg-black border border-white/10 rounded-xl p-4 text-[10px] text-white focus:border-emerald-500 outline-none font-mono uppercase" placeholder="PHONE" value={newMember.phone} onChange={e => setNewMember({...newMember, phone: e.target.value})} />
                <input className="w-full bg-black border border-white/10 rounded-xl p-4 text-[10px] text-white focus:border-emerald-500 outline-none font-mono uppercase" placeholder="EMAIL" value={newMember.email} onChange={e => setNewMember({...newMember, email: e.target.value})} />
                <button 
                  onClick={handleAddMember}
                  disabled={loading || !newMember.name || !newMember.regNo}
                  className="w-full bg-emerald-500 text-black font-black py-5 rounded-2xl uppercase text-[10px] flex items-center justify-center gap-2 mt-4 hover:bg-emerald-400 transition-all shadow-lg"
                >
                  {loading ? <Loader2 className="animate-spin" size={16} /> : <><UserPlus size={16} /> Deploy Member</>}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}