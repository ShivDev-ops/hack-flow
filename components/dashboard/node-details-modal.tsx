"use client";

import Image from "next/image";
import { useState } from "react";
import { X, UserPlus, Phone, Users, ShieldAlert, Loader2, CreditCard, ExternalLink, Zap, Shield } from "lucide-react";
import { addManualParticipantAction } from "@/app/actions/ingest";

import { Participant, Event } from "@/types/common";

export function NodeDetailsModal({ 
  isOpen, 
  onClose, 
  teamMembers, 
  event 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  teamMembers: Participant[], 
  event: Event | null 
}) {
  const [loading, setLoading] = useState(false);
  const [newMember, setNewMember] = useState({ name: "", regNo: "", email: "", phone: "" });

  if (!isOpen || !teamMembers[0]) return null;

  const currentSize = teamMembers.length; // Current number of members in team[cite: 5]
  const maxLimit = event?.max_members || 4; // Maximum allowed team size[cite: 5]
  const isFull = currentSize >= maxLimit; // Sector capacity check[cite: 5]

  // Extract shared financial metadata from the primary team node[cite: 5]
  const transactionId = teamMembers[0].payment_id;
  const transactionUrl = teamMembers[0].payment_url;

  // Utility to convert Google Drive share links to direct image URLs
  const getDirectDriveUrl = (url: string | null) => {
    if (!url) return "";
    const driveMatch = url.match(/(?:\/d\/|id=)([\w-]+)/);
    if (driveMatch && url.includes("drive.google.com")) {
      return `https://drive.google.com/thumbnail?id=${driveMatch[1]}&sz=w1000`;
    }
    return url;
  };

  const previewUrl = getDirectDriveUrl(transactionUrl);

  const handleAddMember = async () => {
    if (!event) return;
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
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 animate-in fade-in duration-300">
      <div className="glass-panel rim-light w-full max-w-6xl rounded-[3rem] overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.8)] flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Tactical Header */}
        <div className="p-10 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-2 bg-secondary pulse-emerald rounded-full" />
              <span className="text-[10px] font-black text-secondary uppercase tracking-[0.4em] font-label-caps">Sector_Node_Detailed_View</span>
            </div>
            <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">
              Team: <span className="text-secondary">{teamMembers[0].team_name}</span>
            </h2>
            <div className="flex items-center gap-6 mt-4">
               <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest flex items-center gap-2 font-label-caps">
                <Users size={12} className="text-secondary" /> {currentSize} / {maxLimit} Nodes_Online
              </p>
              {transactionId && (
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest flex items-center gap-2 font-label-caps">
                  <CreditCard size={12} className="text-secondary" /> TXID: <span className="text-white font-data-mono">{transactionId}</span>
                </p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-white/20 hover:text-white p-4 rounded-full hover:bg-white/5 transition-all hover:rotate-90 duration-300"><X size={28} /></button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-white/5 overflow-hidden flex-1">
          
          {/* COLUMN 1: Active Roster */}
          <div className="p-10 overflow-y-auto space-y-8 lg:col-span-1 custom-scrollbar bg-black/20">
            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] font-label-caps flex items-center gap-2">
              <Zap size={12} className="text-secondary" /> Active_Personnel
            </h3>
            <div className="space-y-4">
              {teamMembers.map((m: Participant) => (
                <div key={m.id} className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl space-y-3 group hover:border-secondary/30 transition-all hover:bg-white/[0.04]">
                  <div className="flex justify-between items-start">
                    <p className="text-white font-bold text-sm uppercase leading-none tracking-tight group-hover:text-secondary transition-colors">{m.full_name}</p>
                    <span className="text-[8px] font-black text-white/20 bg-white/5 px-2 py-1 rounded uppercase tracking-widest font-label-caps group-hover:text-secondary/60 transition-colors">{m.role}</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <p className="text-[10px] text-secondary font-data-mono uppercase">{m.registration_no}</p>
                    {m.phone_number && (
                      <div className="flex items-center gap-2 text-[9px] text-white/40 font-data-mono">
                        <Phone size={10} className="text-secondary/40" />
                        {m.phone_number}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* COLUMN 2: Financial Telemetry */}
          <div className="p-10 bg-white/[0.01] lg:col-span-1 overflow-y-auto custom-scrollbar">
             <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] font-label-caps mb-8 flex items-center gap-2">
               <Shield size={12} className="text-secondary" /> Financial_Verification
             </h3>
             <div className="space-y-6">
                <div className="p-6 bg-black/40 border border-white/10 rounded-2xl space-y-2">
                   <p className="text-[9px] text-white/20 font-black uppercase tracking-widest font-label-caps">Transaction_ID</p>
                   <p className="text-xs text-white font-data-mono break-all uppercase tracking-tighter">{transactionId || "NO_TRANSACTION_ID_FOUND"}</p>
                </div>
                {transactionUrl ? (
                  <div className="space-y-4">
                    <p className="text-[9px] text-white/20 font-black uppercase tracking-widest ml-1 font-label-caps">Payment_Proof_Capture</p>
                    <div className="relative group rounded-3xl overflow-hidden border border-white/10 bg-black">
                      <Image 
                        src={previewUrl} 
                        alt="Payment Screenshot" 
                        width={600}
                        height={400}
                        className="w-full h-auto object-cover opacity-60 group-hover:opacity-100 transition-all duration-700 group-hover:scale-105"
                      />
                      <a 
                        href={transactionUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]"
                      >
                        <ExternalLink size={32} className="text-white" />
                      </a>
                    </div>
                    <a 
                      href={transactionUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 text-[9px] font-black text-secondary uppercase tracking-[0.2em] hover:text-[#5affb4] transition-colors font-label-caps"
                    >
                      Open_Original_Resolution <ExternalLink size={10} />
                    </a>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-16 bg-white/[0.02] border border-white/5 border-dashed rounded-3xl opacity-40 gap-4">
                    <ShieldAlert size={32} className="text-white/20" />
                    <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] text-center font-label-caps">No_Telemetry_Capture</span>
                  </div>
                )}
             </div>
          </div>

          {/* COLUMN 3: Manual Injection */}
          <div className="p-10 bg-white/[0.03] lg:col-span-1">
            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] font-label-caps mb-8 flex items-center gap-2">
              <UserPlus size={12} className="text-secondary" /> Manual_Node_Injection
            </h3>
            {isFull ? (
              <div className="bg-red-500/5 border border-red-500/10 p-10 rounded-[2rem] flex flex-col items-center text-center gap-6">
                <div className="p-4 bg-red-500/10 rounded-full">
                  <ShieldAlert className="text-red-500" size={32} />
                </div>
                <p className="text-[11px] font-black text-red-500 uppercase tracking-widest leading-relaxed font-label-caps">
                  Sector Capacity Reached.<br/><span className="text-[9px] opacity-60">Max allocation of {maxLimit} nodes deployed.</span>
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-3">
                  {['NAME', 'REG_ID', 'PHONE', 'EMAIL'].map((field) => (
                    <input 
                      key={field}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-[11px] text-white focus:border-secondary/50 outline-none font-data-mono transition-all hover:border-white/20" 
                      placeholder={field} 
                      value={field === 'NAME' ? newMember.name : field === 'REG_ID' ? newMember.regNo : field === 'PHONE' ? newMember.phone : newMember.email} 
                      onChange={e => {
                        const val = e.target.value;
                        if (field === 'NAME') setNewMember({...newMember, name: val});
                        else if (field === 'REG_ID') setNewMember({...newMember, regNo: val});
                        else if (field === 'PHONE') setNewMember({...newMember, phone: val});
                        else setNewMember({...newMember, email: val});
                      }} 
                    />
                  ))}
                </div>
                <button 
                  onClick={handleAddMember}
                  disabled={loading || !newMember.name || !newMember.regNo}
                  className="w-full bg-secondary text-black font-black py-5 rounded-[1.5rem] uppercase text-[11px] tracking-[0.2em] flex items-center justify-center gap-3 mt-6 hover:bg-[#5affb4] transition-all shadow-[0_0_30px_rgba(78,222,163,0.2)] active:scale-95 font-label-caps"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : <><UserPlus size={20} /> Deploy_Member</>}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}