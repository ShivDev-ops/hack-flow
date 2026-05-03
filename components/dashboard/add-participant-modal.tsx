"use client";

import { useState } from "react";
import { X, UserPlus, Loader2, Phone, Mail, Hash, Users, User } from "lucide-react";
import { addManualParticipantAction } from "@/app/actions/ingest";

export function AddParticipantModal({ 
  isOpen, 
  onClose, 
  eventId 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  eventId: string;
}) {
  const [loading, setLoading] = useState(false);
  
  // 1. UPDATE STATE: Added 'phone' key
  const [formData, setFormData] = useState({
    name: "",
    regNo: "",
    team: "",
    email: "",
    phone: "" 
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // 2. DISPATCH: Now sending the full object including 'phone'
    const res = await addManualParticipantAction(eventId, formData);

    if (res.success) {
      onClose();
      // Reset state
      setFormData({ name: "", regNo: "", team: "", email: "", phone: "" });
    } else {
      alert("Manual Entry Failed: " + res.error);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="bg-zinc-950 border border-white/10 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
          <h2 className="text-xl font-black text-white uppercase italic tracking-tighter flex items-center gap-2">
            <UserPlus className="text-emerald-500" size={20} /> Manual Node Injection
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-4">
          {/* Name Input */}
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
              <input 
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-xs text-white focus:border-emerald-500 outline-none transition-all font-mono"
                placeholder="Ex: Shivendra Singh"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Reg No */}
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">Registration No</label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
                <input 
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-xs text-white focus:border-emerald-500 outline-none transition-all font-mono"
                  placeholder="122XXXXX"
                  value={formData.regNo}
                  onChange={(e) => setFormData({...formData, regNo: e.target.value})}
                />
              </div>
            </div>
            {/* Team Name */}
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">Team Designation</label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
                <input 
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-xs text-white focus:border-emerald-500 outline-none transition-all font-mono"
                  placeholder="Team Alpha"
                  value={formData.team}
                  onChange={(e) => setFormData({...formData, team: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">Contact Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
              <input 
                type="email"
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-xs text-white focus:border-emerald-500 outline-none transition-all font-mono"
                placeholder="admin@hackflow.io"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
          </div>

          {/* 3. NEW UI INPUT: Phone Number */}
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
              <input 
                type="tel"
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-xs text-white focus:border-emerald-500 outline-none transition-all font-mono"
                placeholder="+91 XXXXX XXXXX"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 text-black font-black py-4 rounded-xl uppercase text-[10px] flex items-center justify-center gap-2 transition-all mt-4 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <><UserPlus size={16} /> Deploy Node</>}
          </button>
        </form>
      </div>
    </div>
  );
}