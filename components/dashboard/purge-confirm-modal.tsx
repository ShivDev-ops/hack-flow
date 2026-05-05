"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";

export function PurgeConfirmModal({ eventName, onConfirm, onClose }: { 
  eventName: string, onConfirm: () => void, onClose: () => void 
}) {
  const [confirmText, setConfirmText] = useState("");

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md p-[16px] animate-in fade-in duration-200">
      {/* FIX: max-w-[448px] prevents the Tailwind v4 width collapse */}
      <div className="bg-[#050505] border border-red-500/20 w-full max-w-[448px] rounded-3xl p-[32px] space-y-[24px] shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center">
          <div className="p-[16px] bg-red-500/10 rounded-full text-red-500 mb-[16px] animate-pulse">
            <AlertTriangle size={32} />
          </div>
          <h2 className="text-xl font-black text-white uppercase tracking-tighter">Critical Purge Protocol</h2>
          <p className="text-xs text-[#a1a1aa] mt-[8px]">
            Wiping all nodes for <span className="text-white font-bold">{eventName}</span>.<br/>
            Type event name to confirm.
          </p>
        </div>

        <input 
          className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-[16px] py-[16px] text-sm text-center text-white focus:border-red-500/50 outline-none font-mono transition-colors"
          placeholder="CONFIRM_EVENT_NAME"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
        />

        <div className="flex gap-[12px]">
          <button 
            onClick={onClose} 
            className="flex-1 py-[16px] text-[10px] font-black text-[#a1a1aa] uppercase hover:text-white transition-colors"
          >
            Abort
          </button>
          <button 
            disabled={confirmText !== eventName}
            onClick={onConfirm}
            className="flex-1 bg-red-600 hover:bg-red-500 disabled:bg-white/5 disabled:text-[#a1a1aa] disabled:opacity-50 text-white font-black py-[16px] rounded-xl text-[10px] uppercase transition-all"
          >
            Confirm Purge
          </button>
        </div>
      </div>
    </div>
  );
}