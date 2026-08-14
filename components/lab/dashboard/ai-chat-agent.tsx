"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, Loader2, Sparkles, PlusCircle, Link2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import MDEditor from "@uiw/react-md-editor";
import { createClient } from "@/lib/supabase/client";
import { neuralChatAction, getChatHistory } from "@/app/actions/ai-tracker";
import { bulkAddTasksAction, linkCommitToTaskAction } from "@/app/actions/kanban";

interface Message {
  role: 'user' | 'model';
  parts: string;
}

interface AIChatAgentProps {
  teamId: string;
  eventId: string;
  role: string;
}

export function AIChatAgent({ teamId, eventId, role }: AIChatAgentProps) {
  const [isOpen, setIsModalOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [hasNewSystemMessage, setHasNewSystemMessage] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const supabase = useRef(createClient());
  const isOpenRef = useRef(isOpen);

  // Sync ref with state
  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  // LOAD CHAT HISTORY
  useEffect(() => {
    async function loadHistory() {
      if (!teamId) return;
      setIsHistoryLoading(true);
      const res = await getChatHistory(teamId);
      if (res.success && res.history.length > 0) {
        setMessages(res.history as Message[]);
      }
      setIsHistoryLoading(false);
    }
    loadHistory();
  }, [teamId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // REAL-TIME SYSTEM NOTIFICATIONS
  useEffect(() => {
    if (!teamId) return;

    // Use a unique suffix to avoid "already subscribed" errors on re-renders/Fast Refresh
    const channelId = `chat-notifications-${teamId}-${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase.current
      .channel(channelId)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'hf_telemetry_logs', 
          filter: `team_id=eq.${teamId}` 
        },
        (payload) => {
          if (payload.new.action_type === 'ROADMAP_READY') {
            const systemMsg = payload.new.details;
            setMessages(prev => [...prev, { role: 'model', parts: `### SYSTEM_UPLINK: ROADMAP_READY\n\n${systemMsg}` }]);
            if (!isOpenRef.current) setHasNewSystemMessage(true);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.current.removeChannel(channel);
    };
  }, [teamId]);

  useEffect(() => {
    if (isOpen) setHasNewSystemMessage(false);
  }, [isOpen]);

  const handleAction = async (msgIndex: number, action: any) => {
    setIsActionLoading(`${msgIndex}-${action.type}`);
    let res: any;

    if (action.type === 'ADD_TASK') {
        res = await bulkAddTasksAction(teamId, eventId, [action.payload]);
    } else if (action.type === 'LINK_COMMIT') {
        res = await linkCommitToTaskAction(teamId, action.payload.taskId, action.payload.commitSha);
    }

    if (res?.success) {
      setMessages(prev => {
        const next = [...prev];
        const confirmation = action.type === 'ADD_TASK' ? "Objective added to board." : "Neural Link established.";
        next[msgIndex] = { 
          ...next[msgIndex], 
          parts: next[msgIndex].parts.split("ACTION_PROTOCOL:")[0].trim() + `\n\n> ### ✅ SYSTEM_UPDATE\n> **${confirmation}**` 
        };
        return next;
      });
    } else {
      alert("System sync failed: " + (res?.error || "Unknown error"));
    }
    setIsActionLoading(null);
  };

  const handleBulkAdd = async (msgIndex: number, actions: any[]) => {
    setIsActionLoading(msgIndex.toString());
    const tasks = actions.filter(a => a.type === 'ADD_TASK').map(a => a.payload);
    const res = await bulkAddTasksAction(teamId, eventId, tasks);
    if (res.success) {
      setMessages(prev => {
        const next = [...prev];
        next[msgIndex] = { 
          ...next[msgIndex], 
          parts: next[msgIndex].parts.split("ACTION_PROTOCOL:")[0].trim() + "\n\n> ### ✅ SYSTEM_UPDATE\n> **Objectives successfully added to board.**" 
        };
        return next;
      });
    } else {
      alert("System sync failed: " + res.error);
    }
    setIsActionLoading(null);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: 'user', parts: userMessage }]);
    setIsLoading(true);

    try {
      const res = await neuralChatAction(teamId, role, messages, userMessage);
      if (res.success && res.response) {
        setMessages(prev => [...prev, { role: 'model', parts: res.response! }]);
      } else {
        setMessages(prev => [...prev, { role: 'model', parts: "Uplink failure. Please retry command." }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'model', parts: "Critical error in neural network." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[9999] font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 w-[calc(100vw-4rem)] sm:w-[400px] h-[70vh] sm:h-[600px] glass-panel rim-light rounded-[2rem] overflow-hidden flex flex-col shadow-2xl border border-white/10 bg-[#0f172a]/95 backdrop-blur-xl"
          >
            {/* Header */}
            <header className="p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary/10 rounded-lg text-secondary">
                  <Bot size={20} />
                </div>
                <div>
                  <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-white leading-none">Neural_Link_Agent</h3>
                  <p className="text-[10px] text-white/40 uppercase font-bold tracking-tighter mt-1">Uplink: Active | Role: {role}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/40 hover:text-white"
              >
                <X size={20} />
              </button>
            </header>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar scroll-smooth"
            >
              {isHistoryLoading ? (
                <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-40">
                   <Loader2 size={24} className="animate-spin text-secondary" />
                   <p className="text-[10px] font-black uppercase tracking-widest">Retrieving_Neural_Logs...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40 px-8">
                  <Sparkles size={40} className="text-secondary animate-pulse" />
                  <p className="text-sm font-medium text-white italic">
                    "Greetings {role === 'LEAD' ? 'Architect' : 'Operator'}. Technical uplink stabilized. How shall we optimize the team's trajectory?"
                  </p>
                </div>
              ) : null}
              
              {!isHistoryLoading && messages.map((msg, i) => {
                const hasAction = msg.role === 'model' && msg.parts.includes("ACTION_PROTOCOL:");
                const displayParts = hasAction ? msg.parts.split("ACTION_PROTOCOL:")[0].trim() : msg.parts;
                let actions: any[] = [];
                if (hasAction) {
                  try {
                    const rawActionText = msg.parts.split("ACTION_PROTOCOL:")[1];
                    // Robust extraction: Find the first '[' and the last ']' to isolate the JSON array
                    const jsonStart = rawActionText.indexOf("[");
                    const jsonEnd = rawActionText.lastIndexOf("]");
                    if (jsonStart !== -1 && jsonEnd !== -1) {
                      actions = JSON.parse(rawActionText.substring(jsonStart, jsonEnd + 1));
                    }
                  } catch (e) {
                    console.error("Action parse failed", e);
                  }
                }

                return (
                  <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} gap-2`}>
                    <div className={`max-w-[90%] p-4 rounded-2xl text-[13px] leading-relaxed shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-secondary text-black font-bold rounded-tr-none' 
                        : 'bg-white/5 border border-white/10 text-white/90 rounded-tl-none chat-markdown'
                    }`}>
                      {msg.role === 'user' ? (
                        displayParts
                      ) : (
                        <div data-color-mode="dark">
                          <MDEditor.Markdown source={displayParts} />
                        </div>
                      )}
                    </div>
                    
                    {hasAction && actions.length > 0 && (
                      <div className="flex flex-wrap gap-2 ml-4">
                        {actions.map((action, actionIdx) => {
                          const isLoadingAction = isActionLoading === `${i}-${action.type}`;
                          const isBulkAdd = actions.length > 1 && action.type === 'ADD_TASK';
                          
                          if (isBulkAdd && actionIdx > 0) return null; // Only show one button for multiple tasks

                          return (
                            <button
                              key={actionIdx}
                              onClick={() => isBulkAdd ? handleBulkAdd(i, actions) : handleAction(i, action)}
                              disabled={!!isActionLoading}
                              className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                                action.type === 'ADD_TASK' 
                                  ? 'bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-black border-emerald-500/20' 
                                  : 'bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-black border-blue-500/20'
                              }`}
                            >
                              {isLoadingAction ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : action.type === 'ADD_TASK' ? (
                                <PlusCircle size={14} />
                              ) : (
                                <Link2 size={14} />
                              )}
                              {action.type === 'ADD_TASK' 
                                ? `Initialize_Objectives (${actions.filter(a => a.type === 'ADD_TASK').length})` 
                                : `Link_Telemetry: ${action.payload.commitSha.substring(0,7)}`
                              }
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/10 p-4 rounded-2xl rounded-tl-none">
                    <Loader2 size={16} className="animate-spin text-secondary" />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-6 border-t border-white/10 bg-white/[0.01]">
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Inquiry command..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm text-white placeholder:text-white/20 outline-none focus:border-secondary/40 transition-colors"
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-secondary hover:text-white disabled:opacity-20 transition-colors"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsModalOpen(!isOpen)}
        className={`h-14 w-14 rounded-full flex items-center justify-center shadow-2xl transition-all ${
          isOpen ? 'bg-white text-black' : 'bg-secondary text-black animate-bounce'
        }`}
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
        
        {!isOpen && (
           <div className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full border-2 border-[#0f172a] flex items-center justify-center">
              <div className="h-1.5 w-1.5 bg-white rounded-full animate-ping" />
           </div>
        )}
      </motion.button>
    </div>
  );
}
