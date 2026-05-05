"use client";

import { useState, useEffect } from "react";
import { X, Save, Clock, Users, Loader2 } from "lucide-react";
import { updateEventSettingsAction } from "@/app/actions/events";
import { Event } from "@/types/common";

export function EventSettingsModal({ event, isOpen, onClose }: { event: Event, isOpen: boolean, onClose: () => void }) {
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    start_time: "",
    end_time: "",
    max_team_size: event.max_members || 4, 
    is_active: event.is_active ?? true,
  });

  useEffect(() => {
    const formatLocal = (dateString: string | null) => {
      if (!dateString) return "";
      const d = new Date(dateString);
      const offset = d.getTimezoneOffset() * 60000;
      return new Date(d.getTime() - offset).toISOString().slice(0, 16);
    };

    setFormData(prev => ({
      ...prev,
      start_time: formatLocal(event.start_time),
      end_time: formatLocal(event.end_time)
    }));
  }, [event]);

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-md p-[16px]">
      {/* FIX: max-w-[576px] strictly controls width */}
      <div className="bg-[#050505] border border-white/10 w-full max-w-[576px] rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-[24px] border-b border-white/5 bg-white/[0.02]">
          <span className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-[8px]">
            <div className={`w-[6px] h-[6px] rounded-full ${formData.is_active ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'bg-white/20'}`} />
            Telemetry_Config // {event.name}
          </span>
          <button onClick={onClose} className="text-[#a1a1aa] hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-[32px] space-y-[24px]">
          <div className="grid grid-cols-2 gap-[16px]">
            <div className="space-y-[8px]">
              <label className="text-[9px] font-bold text-[#a1a1aa] uppercase ml-[4px]">Launch Sequence (Start)</label>
              <div className="relative">
                <Clock className="absolute left-[16px] top-1/2 -translate-y-1/2 text-[#a1a1aa]" size={14} />
                <input 
                  type="datetime-local"
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-[40px] pr-[16px] py-[12px] text-[10px] text-white focus:border-white/40 focus:bg-white/[0.06] outline-none font-mono transition-all"
                  value={formData.start_time}
                  onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-[8px]">
              <label className="text-[9px] font-bold text-[#a1a1aa] uppercase ml-[4px]">End Sequence (Lock)</label>
              <div className="relative">
                <Clock className="absolute left-[16px] top-1/2 -translate-y-1/2 text-[#a1a1aa]" size={14} />
                <input 
                  type="datetime-local"
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-[40px] pr-[16px] py-[12px] text-[10px] text-white focus:border-white/40 focus:bg-white/[0.06] outline-none font-mono transition-all"
                  value={formData.end_time}
                  onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="space-y-[16px]">
            <div className="space-y-[8px]">
              <label className="text-[9px] font-bold text-[#a1a1aa] uppercase ml-[4px]">Max Team Size</label>
              <div className="relative">
                <Users className="absolute left-[16px] top-1/2 -translate-y-1/2 text-[#a1a1aa]" size={14} />
                <input 
                  type="number"
                  min="1"
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-[40px] pr-[16px] py-[12px] text-[10px] text-white focus:border-white/40 focus:bg-white/[0.06] outline-none font-mono transition-all"
                  placeholder="4"
                  value={formData.max_team_size || ""}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setFormData({...formData, max_team_size: isNaN(val) ? 0 : val})
                  }}
                />
              </div>
            </div>

            <div className="space-y-[8px]">
              <label className="text-[9px] font-bold text-[#a1a1aa] uppercase ml-[4px]">System Status</label>
              <button 
                onClick={() => setFormData({...formData, is_active: !formData.is_active})}
                className={`w-full flex items-center justify-between p-[16px] rounded-xl border transition-all ${
                  formData.is_active 
                  ? 'bg-white/[0.05] border-white/30 text-white' 
                  : 'bg-black border-white/10 text-[#a1a1aa]'
                }`}
              >
                <div className="flex items-center gap-[8px]">
                  <div className={`w-[8px] h-[8px] rounded-full ${formData.is_active ? 'bg-white animate-pulse' : 'bg-[#a1a1aa]'}`} />
                  <span className="text-[10px] font-black uppercase tracking-widest">{formData.is_active ? 'Live' : 'Offline'}</span>
                </div>
                <div className={`w-[40px] h-[20px] rounded-full relative transition-colors ${formData.is_active ? 'bg-white' : 'bg-white/10'}`}>
                  <div className={`absolute top-[4px] w-[12px] h-[12px] rounded-full transition-all ${formData.is_active ? 'right-[4px] bg-black' : 'left-[4px] bg-[#a1a1aa]'}`} />
                </div>
              </button>
            </div>
          </div>

          <button 
            onClick={handleSave}
            disabled={loading || !formData.start_time || !formData.end_time || formData.max_team_size < 1}
            className="w-full bg-white hover:bg-zinc-200 disabled:bg-white/10 disabled:text-[#a1a1aa] disabled:opacity-50 text-black font-black py-[16px] rounded-xl uppercase text-[10px] flex items-center justify-center gap-[8px] transition-all shadow-lg active:scale-95 disabled:active:scale-100"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <><Save size={16} /> Commit Configuration</>}
          </button>
        </div>
      </div>
    </div>
  );
}