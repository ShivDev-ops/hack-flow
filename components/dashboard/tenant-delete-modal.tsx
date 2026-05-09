"use client";

import { useState } from "react";
import { ShieldAlert, Trash2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TenantDeleteModalProps {
  tenantId: string;
  accessId: string;
  onConfirm: () => void;
  onClose: () => void;
}

export function TenantDeleteModal({ accessId, onConfirm, onClose }: TenantDeleteModalProps) {
  const [confirmText, setConfirmText] = useState("");

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-md p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#050505] border border-red-500/20 w-full max-w-[480px] max-h-[90vh] overflow-y-auto rounded-[2.5rem] p-6 sm:p-10 space-y-6 sm:space-y-8 shadow-2xl relative custom-scrollbar"
      >
        <div className="flex flex-col items-center text-center">
          <div className="p-4 sm:p-5 bg-red-500/10 rounded-2xl text-red-500 mb-4 sm:mb-6 border border-red-500/20 animate-pulse">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white uppercase italic tracking-tighter leading-none">Eject_Node</h2>
          <p className="text-[10px] sm:text-[11px] text-white/40 mt-3 sm:mt-4 uppercase font-bold tracking-widest leading-relaxed">
            Permanently removing <span className="text-red-500 font-black">{accessId}</span> from the fleet registry.<br className="hidden sm:block"/>
            Type the Access ID to authorize deletion.
          </p>
        </div>

        <div className="space-y-3">
            <label className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] ml-1">Authorization_Token</label>
            <input 
              autoFocus
              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-4 sm:px-6 py-4 sm:py-5 text-sm text-center text-white focus:border-red-500/50 outline-none font-mono transition-all placeholder:text-white/5 uppercase"
              placeholder="CONFIRM_ACCESS_ID"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
            />
        </div>

        <div className="flex flex-col gap-3">
          <button 
            disabled={confirmText !== accessId}
            onClick={onConfirm}
            className="w-full bg-red-600 hover:bg-red-500 disabled:bg-white/5 disabled:text-white/10 disabled:border-transparent text-white font-black py-4 sm:py-5 rounded-[1.25rem] sm:rounded-[1.5rem] text-[10px] sm:text-[11px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-[0_0_40px_rgba(220,38,38,0.2)] active:scale-95"
          >
            <Trash2 size={16} /> Execute_Deletion
          </button>
          <button 
            onClick={onClose} 
            className="w-full py-3 sm:py-4 text-[9px] font-black text-white/20 uppercase tracking-[0.4em] hover:text-white transition-all flex items-center justify-center gap-2"
          >
            <X size={12} /> Abort_Mission
          </button>
        </div>
      </motion.div>
    </div>
  );
}
