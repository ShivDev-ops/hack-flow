"use client";

import { useState } from "react";
import { createLabTask } from "@/app/actions/tasks";
import { X, Zap, Loader2 } from "lucide-react";

export function CreateTaskModal({ isOpen, onClose, session, eventId }: { 
  isOpen: boolean, 
  onClose: () => void, 
  session: { teamId: string; role: string }, 
  eventId: string 
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ title: "", description: "", priority: "LOW" });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await createLabTask({ ...formData, teamId: session.teamId, eventId });
    if (res.success) {
      onClose();
      setFormData({ title: "", description: "", priority: "LOW" });
    } else {
      alert(res.error);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-black/60">
      <div className="w-full max-w-lg bg-zinc-900 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors">
          <X size={20} />
        </button>

        <header className="mb-8">
          <h3 className="text-xl font-black uppercase italic italic tracking-tighter flex items-center gap-2">
            <Zap size={18} className="text-emerald-500" /> Initialize_Task_Node
          </h3>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1 text-xs">Define objective parameters for the squad.</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Objective_Title</label>
            <input 
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none text-sm font-mono"
              placeholder="e.g. INTEGRATE_STRIPE_WEBHOOKS"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value.toUpperCase()})}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Protocol_Description</label>
            <textarea 
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none text-[11px] font-mono leading-relaxed"
              placeholder="DETAILED_SPECIFICATIONS..."
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            {['LOW', 'MED', 'HIGH'].map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setFormData({...formData, priority: p})}
                className={`py-3 rounded-xl text-[9px] font-black uppercase border transition-all ${
                  formData.priority === p 
                  ? 'bg-emerald-500 border-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
                  : 'bg-white/5 border-white/10 text-slate-500'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <button disabled={loading} className="w-full bg-white text-black font-black py-4 rounded-xl uppercase italic tracking-tighter hover:bg-emerald-500 transition-all flex justify-center items-center gap-2 mt-4">
            {loading ? <Loader2 className="animate-spin" size={18} /> : "Inject_Task_To_Stream"}
          </button>
        </form>
      </div>
    </div>
  );
}