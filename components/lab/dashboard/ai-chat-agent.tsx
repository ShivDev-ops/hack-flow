"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, Loader2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import MDEditor from "@uiw/react-md-editor";
import { neuralChatAction } from "@/app/actions/ai-tracker";

interface Message {
  role: 'user' | 'model';
  parts: string;
}

interface AIChatAgentProps {
  teamId: string;
  role: string;
}

export function AIChatAgent({ teamId, role }: AIChatAgentProps) {
  const [isOpen, setIsModalOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

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
    <div className="fixed bottom-8 right-8 z-[100] font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 w-[400px] h-[600px] glass-panel rim-light rounded-[2rem] overflow-hidden flex flex-col shadow-2xl border border-white/10 bg-[#0f172a]/95 backdrop-blur-xl"
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
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40 px-8">
                  <Sparkles size={40} className="text-secondary animate-pulse" />
                  <p className="text-sm font-medium text-white italic">
                    "Greetings {role === 'LEAD' ? 'Architect' : 'Operator'}. Technical uplink stabilized. How shall we optimize the team's trajectory?"
                  </p>
                </div>
              )}
              
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[90%] p-4 rounded-2xl text-[13px] leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-secondary text-black font-bold rounded-tr-none' 
                      : 'bg-white/5 border border-white/10 text-white/90 rounded-tl-none chat-markdown'
                  }`}>
                    {msg.role === 'user' ? (
                      msg.parts
                    ) : (
                      <div data-color-mode="dark">
                        <MDEditor.Markdown source={msg.parts} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
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
