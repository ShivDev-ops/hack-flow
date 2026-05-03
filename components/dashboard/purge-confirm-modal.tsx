"use client";

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";

export function PurgeConfirmModal({ eventName, onConfirm, onClose }: { 
  eventName: string, onConfirm: () => void, onClose: () => void 
}) {
  const [confirmText, setConfirmText] = useState("");

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-md p-4">
      <div className="bg-zinc-950 border border-red-500/20 w-full max-w-md rounded-3xl p-8 space-y-6 shadow-2xl">
        <div className="flex flex-col items-center text-center">
          <div className="p-4 bg-red-500/10 rounded-full text-red-500 mb-4 animate-pulse">
            <AlertTriangle size={32} />
          </div>
          <h2 className="text-xl font-black text-white uppercase italic">Critical Purge Protocol</h2>
          <p className="text-xs text-slate-500 mt-2">
            Wiping all nodes for <span className="text-white font-bold">{eventName}</span>.
            Type event name to confirm.
          </p>
        </div>

        <input 
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-sm text-center text-white focus:border-red-500 outline-none font-mono"
          placeholder="CONFIRM_EVENT_NAME"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
        />

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-4 text-[10px] font-black text-slate-500 uppercase">Abort</button>
          <button 
            disabled={confirmText !== eventName}
            onClick={onConfirm}
            className="flex-1 bg-red-600 disabled:bg-zinc-900 text-white font-black py-4 rounded-xl text-[10px] uppercase shadow-lg shadow-red-600/20"
          >
            Confirm Purge
          </button>
        </div>
      </div>
    </div>
  );
}