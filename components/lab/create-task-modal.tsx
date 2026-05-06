"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Loader2, Zap } from "lucide-react";
import { createTaskAction } from "@/app/actions/kanban";

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  eventId: string;
  onSuccess: () => void;
}

export function CreateTaskModal({ isOpen, onClose, teamId, eventId, onSuccess }: CreateTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    const res = await createTaskAction(teamId, eventId, title, description);
    setLoading(false);

    if (res.success) {
      setTitle("");
      setDescription("");
      onSuccess();
      onClose();
    } else {
      alert("Error creating task: " + res.error);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/95 backdrop-blur-md p-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-zinc-950 border border-white/10 w-full max-w-[500px] rounded-[2rem] overflow-hidden shadow-2xl flex flex-col"
          >
            <header className="p-8 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary/10 rounded-lg">
                  <Plus size={18} className="text-secondary" />
                </div>
                <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">New_Objective</h2>
              </div>
              <button onClick={onClose} className="text-white/20 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </header>

            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              <div className="space-y-4 text-left">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest font-label-caps ml-1">Title</label>
                  <input 
                    autoFocus
                    required
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-sm text-white focus:border-secondary/50 outline-none font-body transition-all placeholder:text-white/5"
                    placeholder="E.g. Implement User Authentication"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest font-label-caps ml-1">Description</label>
                  <textarea 
                    rows={4}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-sm text-white focus:border-secondary/50 outline-none font-body transition-all placeholder:text-white/5 resize-none"
                    placeholder="Briefly describe the objective..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  type="submit"
                  disabled={loading || !title.trim()}
                  className="w-full bg-white text-black font-black py-5 rounded-xl uppercase text-[11px] tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all disabled:opacity-50 active:scale-95"
                >
                  {loading ? <Loader2 className="animate-spin" size={16} /> : <Zap size={14} fill="currentColor" />}
                  Deploy_Objective
                </button>
                <button 
                  type="button"
                  onClick={onClose}
                  className="w-full bg-transparent border border-white/10 text-white/60 font-black py-4 rounded-xl uppercase text-[10px] tracking-widest hover:bg-white/5 hover:text-white transition-all active:scale-95"
                >
                  Abort
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
