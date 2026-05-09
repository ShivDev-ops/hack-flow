"use client";

import { useState, useEffect } from "react";
import { X, Link as LinkIcon, Loader2, ChevronRight, CheckCircle2 } from "lucide-react";
import { createEventAction } from "@/app/actions/events";
import { testSheetConnection } from "@/app/actions/ingest";
import { RegistryUplink } from "./registry-uplink";

const getLocalISOString = (date: Date) => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

export function InitEventModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [eventId, setEventId] = useState<string | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({ 
    name: "", 
    url: "", 
    max_size: 4,
    start_time: "",
    end_time: ""
  });

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      start_time: getLocalISOString(new Date()),
      end_time: getLocalISOString(new Date(Date.now() + 48 * 60 * 60 * 1000))
    }));
  }, []);

  if (!isOpen) return null;

  const handleConnect = async () => {
    setLoading(true);
    const sheetRes = await testSheetConnection(formData.url);
    if (sheetRes.success && sheetRes.headers) {
      
      const eventRes = await createEventAction(
        formData.name, 
        formData.max_size,
        new Date(formData.start_time).toISOString(),
        new Date(formData.end_time).toISOString(),
        formData.url
      );
      
      if (eventRes.success && eventRes.event) {
        setEventId(eventRes.event.id);
        setHeaders(sheetRes.headers);
        setStep(2);
      } else {
        alert(eventRes.error);
      }
    } else {
      alert(sheetRes.error);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-[16px]">
      {/* FIX: max-w-[576px] prevents Tailwind v4 from crushing the modal */}
      <div className="bg-[#050505] border border-white/10 w-full max-w-[576px] rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-[24px] md:p-[40px]">
          {step === 1 && (
            <div className="space-y-[24px]">
              <header className="space-y-[8px] flex justify-between items-start">
                <div>
                  <h2 className="text-2xl md:text-3xl font-black text-white tracking-tighter">Telemetry Config</h2>
                  <p className="text-[10px] text-[#a1a1aa] font-bold uppercase tracking-widest">Configure Fleet Capacity</p>
                </div>
                <button onClick={onClose} className="text-[#a1a1aa] hover:text-white transition-colors"><X size={20}/></button>
              </header>
              <div className="space-y-[16px] font-mono">
                <input className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-[20px] py-[16px] text-sm text-white focus:border-white/40 focus:bg-white/[0.06] outline-none transition-all" placeholder="EVENT_NAME" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                <div className="relative">
                  <LinkIcon className="absolute left-[16px] top-1/2 -translate-y-1/2 text-[#a1a1aa]" size={16} />
                  <input className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-[44px] pr-[20px] py-[16px] text-sm text-white focus:border-white/40 focus:bg-white/[0.06] outline-none transition-all" placeholder="SHEET_URL" value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} />
                </div>
                
                <div className="grid grid-cols-1 gap-[16px]">
                  <div className="space-y-[4px]">
                    <label className="text-[9px] text-[#a1a1aa] font-black uppercase ml-[4px]">Maximum Members Per Team [N]</label>
                    <input type="number" min="1" className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-[16px] py-[12px] text-white focus:border-white/40 focus:bg-white/[0.06] outline-none transition-all" value={formData.max_size || ""} onChange={e => {
                        const val = parseInt(e.target.value);
                        setFormData({...formData, max_size: isNaN(val) ? 0 : val});
                    }} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-[16px]">
                    <div className="space-y-[4px]">
                      <label className="text-[9px] text-[#a1a1aa] font-black uppercase ml-[4px]">Start Time</label>
                      <input type="datetime-local" className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-[16px] py-[12px] text-white text-[10px] focus:border-white/40 focus:bg-white/[0.06] outline-none transition-all" value={formData.start_time} onChange={e => setFormData({...formData, start_time: e.target.value})} />
                    </div>
                    <div className="space-y-[4px]">
                      <label className="text-[9px] text-[#a1a1aa] font-black uppercase ml-[4px]">End Time</label>
                      <input type="datetime-local" className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-[16px] py-[12px] text-white text-[10px] focus:border-white/40 focus:bg-white/[0.06] outline-none transition-all" value={formData.end_time} onChange={e => setFormData({...formData, end_time: e.target.value})} />
                    </div>
                  </div>
                </div>
              </div>
              <button onClick={handleConnect} disabled={loading || !formData.name || !formData.url || !formData.start_time || !formData.end_time || formData.max_size < 1} className="w-full bg-white hover:bg-zinc-200 py-[20px] rounded-2xl text-black font-black uppercase text-xs flex items-center justify-center gap-[8px] transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:active:scale-100">
                {loading ? <Loader2 className="animate-spin" /> : <>Initiate Handshake <ChevronRight /></>}
              </button>
            </div>
          )}
          {step === 2 && eventId && (
            <RegistryUplink 
              headers={headers} 
              maxMembers={formData.max_size} 
              eventId={eventId} 
              sheetUrl={formData.url} 
              onComplete={() => setStep(3)} 
            />
          )}
          {step === 3 && (
             <div className="text-center space-y-[16px] py-[40px] animate-in zoom-in duration-500">
               <CheckCircle2 size={60} className="text-white mx-auto" />
               <h2 className="text-3xl font-black text-white tracking-tighter">Node Synchronized</h2>
               <p className="text-[10px] text-[#a1a1aa] font-mono">Registry Ingestion Complete</p>
               <button onClick={onClose} className="w-full bg-white text-black font-black py-[16px] rounded-xl uppercase mt-[16px] hover:bg-zinc-200 transition-colors">Enter Fleet CMD</button>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}