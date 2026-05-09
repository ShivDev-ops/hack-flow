"use client";

import { Book, FileText, Loader2 } from "lucide-react";
import MDEditor from "@uiw/react-md-editor";
import { createClient } from "@/lib/supabase/client";

interface MissionBriefingProps {
  problemStatement: string | null;
  srsDocumentPath: string | null;
}

export function MissionBriefing({ problemStatement, srsDocumentPath }: MissionBriefingProps) {
  
  const getSrsDownloadUrl = () => {
    if (!srsDocumentPath) return null;
    const supabase = createClient();
    const { data } = supabase.storage.from("event_resources").getPublicUrl(srsDocumentPath);
    return data.publicUrl;
  };
  
  if (!problemStatement && !srsDocumentPath) {
    return (
      <div className="glass-panel rim-light rounded-[2.5rem] p-12 text-center bg-white/[0.01] border border-white/5">
        <Loader2 className="animate-spin text-white/20 mx-auto mb-6" size={32} />
        <p className="text-sm text-white/30 font-bold uppercase tracking-widest italic">Waiting for project briefing...</p>
      </div>
    );
  }

  return (
    <div className="glass-panel rim-light rounded-[2.5rem] p-8 md:p-12 space-y-10 bg-white/[0.01] border border-white/5 shadow-2xl">
      <header className="flex items-center gap-4">
        <div className="p-2.5 bg-secondary/10 rounded-xl text-secondary">
          <Book size={24} />
        </div>
        <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Project Briefing</h2>
      </header>

      {problemStatement && (
        <div className="prose prose-invert prose-base md:prose-lg max-w-none bg-black/40 p-8 rounded-[2rem] border border-white/5 shadow-inner" data-color-mode="dark">
            <MDEditor.Markdown source={problemStatement} />
        </div>
      )}

      {srsDocumentPath && (
        <a 
          href={getSrsDownloadUrl() || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 px-8 py-4 bg-secondary text-black rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-[#5affb4] transition-all shadow-xl active:scale-95"
        >
          <FileText size={18} />
          View Requirements Document (SRS)
        </a>
      )}
    </div>
  );
}
