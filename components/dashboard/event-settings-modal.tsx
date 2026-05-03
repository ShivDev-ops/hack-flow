"use client";

import { useState } from "react";
import { X, Save, Loader2, Users, Code, Globe, Clock } from "lucide-react";
import { updateEventSettingsAction } from "@/app/actions/events";

export function EventSettingsModal({ event, isOpen, onClose }: { event: any, isOpen: boolean, onClose: () => void }) {
  const [loading, setLoading] = useState(false);

  // 1. STATE INITIALIZATION: Add max_team_size to the initial state
  const [formData, setFormData] = useState({
    start_time: event.start_time ? new Date(event.start_time).toISOString().slice(0, 16) : "",
    primary_repo_url: event.primary_repo_url || "",
    gateway_endpoint_url: event.gateway_endpoint_url || "",
    max_team_size: event.max_team_size || 4, // Your snippet here
  });

  if (!isOpen) return null;

  // 2. SAVE LOGIC: Use the updated handleSave with the server action
  const handleSave = async () => {
    setLoading(true);
    const res = await updateEventSettingsAction(event.id, formData); // Your snippet here
    if (res.success) {
      onClose();
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
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
            Telemetry_Config // {event.event_name}
          </span>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">Launch Sequence</label>
              <div className="relative">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
                <input 
                  type="datetime-local"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-xs text-white focus:border-emerald-500 outline-none font-mono transition-all"
                  value={formData.start_time}
                  onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                />
              </div>
            </div>

            {/* 3. THE UI INPUT: Adding the field for Max Team Size */}
            <div className="space-y-2">
              <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">Max Team Size</label>
              <div className="relative">
                <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
                <input 
                  type="number"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-xs text-white focus:border-emerald-500 outline-none font-mono transition-all"
                  placeholder="4"
                  value={formData.max_team_size}
                  onChange={(e) => setFormData({...formData, max_team_size: parseInt(e.target.value) || 1})}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">Primary GitHub Node</label>
              <div className="relative">
                <Code className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
                <input 
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-xs text-white focus:border-emerald-500 outline-none font-mono transition-all"
                  placeholder="github.com/your-org/repo"
                  value={formData.primary_repo_url}
                  onChange={(e) => setFormData({...formData, primary_repo_url: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">API Gateway Entry</label>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
                <input 
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-xs text-white focus:border-emerald-500 outline-none font-mono transition-all"
                  placeholder="https://api.yourdomain.com"
                  value={formData.gateway_endpoint_url}
                  onChange={(e) => setFormData({...formData, gateway_endpoint_url: e.target.value})}
                />
              </div>
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