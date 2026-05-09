"use client";

import { useState, useEffect, useCallback } from "react";
import { Save, Clock, Users, Loader2, ArrowLeft, Shield } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { updateEventSettingsAction } from "@/app/actions/events";
import Link from "next/link";
import { Event } from "@/types/common";

export default function EventConfigPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    start_time: "",
    end_time: "",
    max_team_size: 4, 
    is_active: true,
  });

  const supabase = createClient();

  const fetchEvent = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("hf_events").select("*").eq("id", eventId).single();
    if (data) {
        setEvent(data as Event);
        const formatLocal = (dateString: string | null) => {
            if (!dateString) return "";
            const d = new Date(dateString);
            const offset = d.getTimezoneOffset() * 60000;
            return new Date(d.getTime() - offset).toISOString().slice(0, 16);
        };

        setFormData({
            start_time: formatLocal(data.start_time),
            end_time: formatLocal(data.end_time),
            max_team_size: data.max_members || 4,
            is_active: data.is_active ?? true
        });
    }
    setLoading(false);
  }, [eventId, supabase]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  const handleSave = async () => {
    setSaving(true);
    const res = await updateEventSettingsAction(eventId, {
        start_time: new Date(formData.start_time).toISOString(),
        end_time: new Date(formData.end_time).toISOString(),
        max_team_size: formData.max_team_size,
        is_active: formData.is_active
    }); 
    if (res.success) {
      alert("CONFIGURATION_COMMITTED: System parameters updated.");
      fetchEvent();
    } else {
      alert("CRITICAL_ERROR: " + res.error);
    }
    setSaving(false);
  };

  if (loading) {
    return (
        <div className="flex flex-col items-center justify-center py-32 gap-4 opacity-20">
          <Loader2 className="animate-spin text-white" size={48} />
          <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white">Syncing_Config_Data</span>
        </div>
    );
  }

  if (!event) return <div>Node not found.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <header className="flex flex-col gap-4">
        <Link href={`/dashboard/event/${eventId}/resources`} className="text-[10px] text-white/40 hover:text-white flex items-center gap-2 uppercase font-black transition-all w-fit tracking-widest">
            <ArrowLeft size={12} /> Return_to_Mission
        </Link>
        <div className="flex items-center gap-4">
            <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                <Shield className="text-white" size={24} />
            </div>
            <div>
                <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">
                    Telemetry <span className="text-white/20">Config</span>
                </h1>
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-2">Node: {event.name} // ID: {event.id.substring(0,8)}</p>
            </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass-panel rim-light p-8 rounded-[2rem] space-y-8">
            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Temporal_Parameters</h3>
            
            <div className="space-y-6">
                <div className="space-y-2">
                    <label className="text-[9px] font-bold text-white/60 uppercase ml-1 tracking-widest">Launch Sequence (Start)</label>
                    <div className="relative">
                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={14} />
                        <input 
                            type="datetime-local"
                            className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-[11px] text-white focus:border-white/40 outline-none font-data-mono transition-all"
                            value={formData.start_time}
                            onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[9px] font-bold text-white/60 uppercase ml-1 tracking-widest">End Sequence (Lock)</label>
                    <div className="relative">
                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={14} />
                        <input 
                            type="datetime-local"
                            className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-[11px] text-white focus:border-white/40 outline-none font-data-mono transition-all"
                            value={formData.end_time}
                            onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                        />
                    </div>
                </div>
            </div>
        </div>

        <div className="glass-panel rim-light p-8 rounded-[2rem] space-y-8 flex flex-col">
            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Capacity_&_Status</h3>
            
            <div className="space-y-6 flex-1">
                <div className="space-y-2">
                    <label className="text-[9px] font-bold text-white/60 uppercase ml-1 tracking-widest">Max Team Size</label>
                    <div className="relative">
                        <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                        <input 
                            type="number"
                            min="1"
                            className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-[11px] text-white focus:border-white/40 outline-none font-data-mono transition-all"
                            value={formData.max_team_size}
                            onChange={(e) => setFormData({...formData, max_team_size: parseInt(e.target.value) || 0})}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[9px] font-bold text-white/60 uppercase ml-1 tracking-widest">System Status</label>
                    <button 
                        onClick={() => setFormData({...formData, is_active: !formData.is_active})}
                        className={`w-full flex items-center justify-between p-5 rounded-2xl border transition-all ${
                        formData.is_active 
                        ? 'bg-white/5 border-white/20 text-white' 
                        : 'bg-black border-white/10 text-white/20'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${formData.is_active ? 'bg-secondary animate-pulse shadow-[0_0_10px_#4edea3]' : 'bg-white/10'}`} />
                            <span className="text-[10px] font-black uppercase tracking-widest">{formData.is_active ? 'STABLE / LIVE' : 'OFFLINE / LOCKED'}</span>
                        </div>
                        <div className={`w-10 h-5 rounded-full relative transition-colors ${formData.is_active ? 'bg-secondary' : 'bg-white/10'}`}>
                            <div className={`absolute top-1 w-3 h-3 rounded-full transition-all ${formData.is_active ? 'right-1 bg-black' : 'left-1 bg-white/40'}`} />
                        </div>
                    </button>
                </div>
            </div>

            <button 
                onClick={handleSave}
                disabled={saving || !formData.start_time || !formData.end_time || formData.max_team_size < 1}
                className="w-full bg-white hover:bg-zinc-200 disabled:opacity-20 text-black font-black py-5 rounded-2xl uppercase text-xs flex items-center justify-center gap-3 transition-all shadow-xl active:scale-95 mt-auto"
            >
                {saving ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18} /> Commit Configuration</>}
            </button>
        </div>
      </div>

      <div className="p-8 bg-white/[0.01] border border-white/5 rounded-[2rem] flex items-start gap-6">
        <div className="p-3 bg-white/5 rounded-xl text-white/40">
            <Shield size={20} />
        </div>
        <div className="space-y-2">
            <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Protocol Warning</h4>
            <p className="text-[10px] text-white/40 leading-relaxed uppercase tracking-wider font-medium">Changing temporal parameters will affect mission timers across all participant nodes. Ensure all squad leads are notified before committing terminal changes.</p>
        </div>
      </div>
    </div>
  );
}
