"use client";

import { useState } from "react";
import { X, Save, Loader2, Users, Code, Globe, Clock } from "lucide-react";
import { updateEventSettingsAction } from "@/app/actions/events";

export function EventSettingsModal({ event, isOpen, onClose }: { event: any, isOpen: boolean, onClose: () => void }) {
  const [loading, setLoading] = useState(false);

  // 1. STATE INITIALIZATION: Add max_team_size, start_time, end_time, and is_active
  const [formData, setFormData] = useState({
    start_time: event.start_time ? new Date(event.start_time).toISOString().slice(0, 16) : "",
    end_time: event.end_time ? new Date(event.end_time).toISOString().slice(0, 16) : "",
    max_team_size: event.max_members || 4, 
    is_active: event.is_active ?? true,
  });

  if (!isOpen) return null;

  // 2. SAVE LOGIC: Use the updated handleSave with the server action
  const handleSave = async () => {
    setLoading(true);
    const res = await updateEventSettingsAction(event.id, {
        start_time: new Date(formData.start_time).toISOString(),
        end_time: new Date(formData.end_time).toISOString(),
        max_team_size: formData.max_team_size,
        is_active: formData.is_active
    }); 
    if (res.success) {
      onClose();
      window.location.reload();
    } else {
      alert("Config Failure: " + res.error);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <div className="bg-zinc-950 border border-white/10 w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/5 bg-white/[0.02]">
          <span className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${formData.is_active ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'}`} />
            Telemetry_Config // {event.name}
          </span>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">Launch Sequence (Start)</label>
              <div className="relative">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
                <input 
                  type="datetime-local"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-[10px] text-white focus:border-emerald-500 outline-none font-mono transition-all"
                  value={formData.start_time}
                  onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">End Sequence (Lock)</label>
              <div className="relative">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
                <input 
                  type="datetime-local"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-[10px] text-white focus:border-emerald-500 outline-none font-mono transition-all"
                  value={formData.end_time}
                  onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">Max Team Size</label>
              <div className="relative">
                <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
                <input 
                  type="number"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-[10px] text-white focus:border-emerald-500 outline-none font-mono transition-all"
                  placeholder="4"
                  value={formData.max_team_size}
                  onChange={(e) => setFormData({...formData, max_team_size: parseInt(e.target.value) || 1})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">System Status</label>
              <button 
                onClick={() => setFormData({...formData, is_active: !formData.is_active})}
                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                  formData.is_active 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                  : 'bg-red-500/10 border-red-500/20 text-red-500'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${formData.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                  <span className="text-[10px] font-black uppercase tracking-widest">{formData.is_active ? 'Live' : 'Offline'}</span>
                </div>
                <div className={`w-10 h-5 rounded-full relative transition-colors ${formData.is_active ? 'bg-emerald-500' : 'bg-zinc-800'}`}>
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${formData.is_active ? 'right-1' : 'left-1'}`} />
                </div>
              </button>
            </div>
          </div>

          <button 
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 text-white font-black py-4 rounded-xl uppercase text-[10px] flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <><Save size={16} /> Commit Configuration</>}
          </button>
        </div>
      </div>
    </div>
  );
}