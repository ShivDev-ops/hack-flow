"use client";

import { useState } from "react";
import { X, Link as LinkIcon, Loader2, ChevronRight, CheckCircle2 } from "lucide-react";
import { createEventAction } from "@/app/actions/events";
import { testSheetConnection } from "@/app/actions/ingest";
import { RegistryUplink } from "./registry-uplink";

export function InitEventModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [eventId, setEventId] = useState<string | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  // Removed min_size from state
  const [formData, setFormData] = useState({ name: "", url: "", pin: "", max_size: 4 });

  if (!isOpen) return null;

  const handleConnect = async () => {
    setLoading(true);
    const sheetRes = await testSheetConnection(formData.url);
    if (sheetRes.success && sheetRes.headers) {
      // Only passing name, pin, and max_size
      const eventRes = await createEventAction(formData.name, formData.pin, formData.max_size);
      if (eventRes.success && eventRes.event) {
        setEventId(eventRes.event.id);
        setHeaders(sheetRes.headers);
        setStep(2);
      } else alert(eventRes.error);
    } else alert(sheetRes.error);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <div className="bg-zinc-950 border border-white/10 w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 md:p-10">
          {step === 1 && (
            <div className="space-y-6">
              <header className="space-y-2 flex justify-between items-start">
                <div>
                  <h2 className="text-2xl md:text-3xl font-black text-white uppercase italic tracking-tighter">Telemetry Config</h2>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Configure Fleet Capacity</p>
                </div>
                <button onClick={onClose} className="text-slate-500 hover:text-white"><X size={20}/></button>
              </header>
              <div className="space-y-4 font-mono">
                <input className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-sm text-white" placeholder="EVENT_NAME" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                <div className="relative">
                  <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-5 py-4 text-sm text-white" placeholder="SHEET_URL" value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} />
                </div>
                <input className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-sm text-white" type="password" placeholder="ADMIN_PIN" maxLength={6} value={formData.pin} onChange={e => setFormData({...formData, pin: e.target.value})} />
                
                {/* Simplified to only ask for Max Capacity */}
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-500 font-black uppercase ml-1">Maximum Members Per Team [N]</label>
                  <input type="number" min="1" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white" value={formData.max_size} onChange={e => setFormData({...formData, max_size: parseInt(e.target.value)})} />
                </div>
              </div>
              <button onClick={handleConnect} disabled={loading || !formData.name || !formData.url} className="w-full bg-blue-600 hover:bg-blue-500 py-5 rounded-2xl text-white font-black uppercase text-xs flex items-center justify-center gap-2 transition-all">
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
             <div className="text-center space-y-4 py-10 animate-in zoom-in duration-500">
               <CheckCircle2 size={60} className="text-emerald-500 mx-auto" />
               <h2 className="text-3xl font-black text-white uppercase italic">Node Synchronized</h2>
               <p className="text-[10px] text-emerald-500 font-mono">Registry Ingestion Complete</p>
               <button onClick={() => { onClose(); window.location.reload(); }} className="w-full bg-white text-black font-black py-4 rounded-xl uppercase mt-4 hover:bg-zinc-200">Enter Fleet CMD</button>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}