"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Search, ArrowLeft, Loader2, UserPlus, X } from "lucide-react";
import Link from "next/link";
import { NodeDetailsModal } from "@/components/dashboard/node-details-modal";

export default function RegistryPage() {
  const [allParticipants, setAllParticipants] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [eventData, setEventData] = useState<any>(null);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const supabase = createClient();

  const fetchData = async () => {
    setLoading(true);
    const { data: pData } = await supabase
      .from("hf_participants")
      .select("*")
      .order("created_at", { ascending: false });
      
    const { data: eData } = await supabase
      .from("hf_events")
      .select("*")
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    setAllParticipants(pData || []);
    setEventData(eData);

    const uniqueTeams = pData?.reduce((acc: any[], current: any) => {
      if (!acc.find(item => item.team_name === current.team_name)) {
        acc.push(current);
      }
      return acc;
    }, []);

    setParticipants(uniqueTeams || []);
    setLoading(false);
  };

  useEffect(() => { 
    fetchData(); 
  }, []);

  const filteredTeams = participants.filter(p => 
    p.team_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.registration_no.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const recommendations = searchTerm.length > 0 
    ? participants.filter(p => p.team_name.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 5)
    : [];

  const handleToggle = async (p: any) => {
    if (p.payment_verified && !window.confirm("Are you sure you want to UNVERIFY this node?")) {
      return;
    }
    await supabase.from("hf_participants").update({ payment_verified: !p.payment_verified }).eq("id", p.id);
    fetchData();
  };

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-[1400px] mx-auto min-h-screen bg-black">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="w-full md:w-auto">
          <Link href="/dashboard" className="text-[10px] text-slate-500 hover:text-emerald-500 flex items-center gap-1 uppercase font-black mb-4 transition-all w-fit">
            <ArrowLeft size={12} /> Return to Fleet CMD
          </Link>
          <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter">
            Registry <span className="text-emerald-500">Triage</span>
          </h1>
        </div>
        
        <div className="relative w-full md:w-96 group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors">
            <Search size={16} />
          </div>
          <input 
            type="text"
            placeholder="SEARCH_FLEET_NODES..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-xs text-white font-mono focus:border-emerald-500 outline-none transition-all shadow-inner"
            value={searchTerm}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          {showSuggestions && recommendations.length > 0 && (
            <div className="absolute top-full left-0 w-full mt-2 bg-zinc-950 border border-white/10 rounded-2xl overflow-hidden z-[60] shadow-2xl animate-in fade-in slide-in-from-top-2">
              <div className="p-2 border-b border-white/5 bg-white/5 text-[8px] font-black text-slate-500 uppercase tracking-widest">Suggested_Nodes</div>
              {recommendations.map(rec => (
                <button 
                  key={rec.id}
                  className="w-full text-left px-4 py-3 text-[10px] text-white hover:bg-emerald-500 hover:text-black transition-all flex justify-between items-center font-mono uppercase"
                  onClick={() => {
                    setSelectedTeam(rec.team_name);
                    setSearchTerm("");
                  }}
                >
                  {rec.team_name} <span className="opacity-50 text-[8px]">{rec.registration_no}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <div className="bg-zinc-900/20 border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead className="bg-white/5 text-slate-500 uppercase text-[9px] font-black tracking-[0.2em] border-b border-white/5">
            <tr><th className="px-6 py-5">Node / Lead ID</th><th className="px-6 py-5">Team Designation</th><th className="px-6 py-5 text-right">Verification Status</th></tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-mono">
            {filteredTeams.map((p) => (
              <tr 
                key={p.id} 
                onClick={() => setSelectedTeam(p.team_name)}
                className="hover:bg-emerald-500/[0.03] transition-colors cursor-pointer group"
              >
                <td className="px-6 py-5">
                  <div className="text-white text-sm font-sans font-bold group-hover:text-emerald-400 transition-colors uppercase tracking-tight">{p.full_name}</div>
                  <div className="text-[10px] text-emerald-500/70">{p.registration_no}</div>
                </td>
                <td className="px-6 py-5 text-slate-400 text-xs uppercase font-black tracking-tighter">{p.team_name}</td>
                <td className="px-6 py-5 text-right" onClick={(e) => e.stopPropagation()}>
                  <button 
                    onClick={() => handleToggle(p)}
                    className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase border transition-all ${
                      p.payment_verified 
                      ? 'bg-emerald-500 border-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
                      : 'bg-transparent border-white/10 text-slate-600 hover:text-white'
                    }`}
                  >
                    {p.payment_verified ? 'Verified' : 'Unverified'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {loading && (
          <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-emerald-500" /></div>
        )}
      </div>

      <NodeDetailsModal 
        isOpen={!!selectedTeam}
        onClose={() => { setSelectedTeam(null); fetchData(); }}
        teamMembers={allParticipants.filter(p => p.team_name === selectedTeam)}
        event={eventData}
      />
    </div>
  );
}