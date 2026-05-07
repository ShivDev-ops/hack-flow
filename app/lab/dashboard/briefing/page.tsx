import { getEventForParticipant } from "@/app/actions/events";
import { Book, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { BriefingClientView } from "@/components/lab/dashboard/briefing-client-view";

async function MissionBriefingPage() {
  const { success, data, error } = await getEventForParticipant();

  if (!success || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <div className="p-4 bg-red-500/10 rounded-full mb-4"><AlertTriangle className="text-red-500" size={32} /></div>
        <h2 className="text-xl font-bold text-white">Could Not Load Briefing</h2>
        <p className="text-red-400 max-w-sm">{error || "An unknown error occurred while fetching the event data for your team."}</p>
        <Link href="/lab/dashboard/terminal" className="mt-6 bg-white/10 px-4 py-2 rounded-lg text-sm hover:bg-white/20 transition-colors">
            Return to Terminal
        </Link>
      </div>
    )
  }

  const getSrsDownloadUrl = () => {
    if (!data.srs_document_path) return null;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) return null;
    return `${supabaseUrl}/storage/v1/object/public/event_resources/${data.srs_document_path}`;
  };

  const srsDownloadUrl = getSrsDownloadUrl();

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-[1200px] mx-auto min-h-full">
      <header className="flex items-center gap-4 border-b border-white/10 pb-6">
        <div className="p-3 bg-secondary/10 rounded-lg text-secondary">
          <Book size={24} />
        </div>
        <div>
            <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter">Mission_Briefing</h1>
            <p className="text-white/40">Event: {data.name}</p>
        </div>
      </header>

      <BriefingClientView 
        problemStatement={data.problem_statement}
        srsDocumentPath={data.srs_document_path}
        srsDownloadUrl={srsDownloadUrl}
      />
    </div>
  );
}

export default MissionBriefingPage;
