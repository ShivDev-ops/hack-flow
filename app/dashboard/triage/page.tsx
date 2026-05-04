"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Search, ArrowLeft, Loader2, Rocket, ShieldCheck, ShieldAlert, Phone } from "lucide-react";
import Link from "next/link";
import { NodeDetailsModal } from "@/components/dashboard/node-details-modal";
import { promoteTeamToLab } from "@/app/actions/labs";

export default function TriagePage() {
  const [allParticipants, setAllParticipants] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [eventData, setEventData] = useState<any>(null);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLaunching, setIsLaunching] = useState<string | null>(null);
  
  const supabase = createClient();

  const fetchData = async () => {
    setLoading(true);
    const { data: pData } = await supabase.from("hf_participants").select("*").order("created_at", { ascending: false });
    const { data: eData } = await supabase.from("hf_events").select("*").order('created_at', { ascending: false }).limit(1).single();
    
    setAllParticipants(pData || []);
    setEventData(eData);

    const uniqueTeams = pData?.reduce((acc: any[], current: any) => {
      if (!acc.find(item => item.team_name === current.team_name)) acc.push(current);
      return acc;
    }, []);

    setParticipants(uniqueTeams || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleToggleVerification = async (p: any) => {
    if (p.payment_verified && !window.confirm("CONFIRM_DE_AUTH: Are you sure you want to UNVERIFY this node?")) return;
    const { error } = await supabase.from("hf_participants").update({ payment_verified: !p.payment_verified }).eq("id", p.id);
    if (!error) fetchData();
  };

  const handleQuickLaunch = async (teamName: string) => {
    const teamMembers = allParticipants.filter(p => p.team_name === teamName);
    const isVerified = teamMembers.some(m => m.payment_verified);

    if (!isVerified) {
        alert("LAUNCH_ERROR: Node verification required before initialization.");
        return;
    }

    if (!window.confirm(`INITIALIZE_HANDSHAKE: Launch ${teamName}?`)) return;

    setIsLaunching(teamName);
    const result = await promoteTeamToLab(teamName, eventData.id, teamMembers);
    
    if (result.success) {
      // Now showing both Team ID and PIN
      alert(
        `DEPLOYMENT_SUCCESSFUL\n\n` +
        `TEAM_ID: ${result.teamId}\n` +
        `ACCESS_PIN: ${result.pin}\n\n` +
        `Provide these credentials to the squad lead for Lab entry.`
      );
      fetchData();
    } else {
      alert(`CRITICAL_FAILURE: ${result.error}`);
    }
    setIsLaunching(null);
};

  const filteredTeams = participants.filter(p => 
    p.team_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.registration_no.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      <div className="bg-zinc-900/20 border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead className="bg-white/5 text-slate-500 uppercase text-[9px] font-black tracking-[0.2em] border-b border-white/5">
            <tr>
              <th className="px-6 py-5">Node / Lead ID</th>
              <th className="px-6 py-5">Team Designation</th>
              <th className="px-6 py-5">System Status</th>
              <th className="px-6 py-5 text-right">Deployment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-mono">
            {filteredTeams.map((p) => (
              <tr 
                key={p.id} 
                className="hover:bg-emerald-500/[0.03] transition-colors cursor-pointer group"
                onClick={() => setSelectedTeam(p.team_name)}
              >
                <td className="px-6 py-5">
                  <div className="text-white text-sm font-sans font-bold group-hover:text-emerald-400 uppercase tracking-tight">{p.full_name}</div>
                  <div className="flex flex-col gap-0.5 mt-1">
                    <div className="text-[10px] text-emerald-500/70">{p.registration_no}</div>
                    {p.phone_number && (
                      <div className="text-[9px] text-slate-500 font-mono flex items-center gap-1">
                        <Phone size={8} className="text-emerald-500/40" />
                        {p.phone_number}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-5 text-slate-400 text-xs uppercase font-black tracking-tighter">{p.team_name}</td>
                <td className="px-6 py-5">
                    <button 
                        onClick={(e) => { e.stopPropagation(); handleToggleVerification(p); }}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-black uppercase transition-all border ${
                            p.payment_verified 
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                            : 'bg-red-500/10 border-red-500/20 text-red-500'
                        }`}
                    >
                        {p.payment_verified ? <ShieldCheck size={12}/> : <ShieldAlert size={12}/>}
                        {p.payment_verified ? 'Verified' : 'Unverified'}
                    </button>
                </td>
                <td className="px-6 py-5 text-right" onClick={(e) => e.stopPropagation()}>
                  <button 
                    disabled={!p.payment_verified || !!isLaunching}
                    onClick={() => handleQuickLaunch(p.team_name)}
                    className={`p-3 rounded-xl transition-all ${
                      p.payment_verified 
                      ? 'bg-white/10 text-emerald-500 hover:bg-emerald-500 hover:text-black border border-white/10' 
                      : 'bg-transparent text-slate-800 border border-white/5 cursor-not-allowed'
                    }`}
                  >
                    {isLaunching === p.team_name ? <Loader2 className="animate-spin" size={18}/> : <Rocket size={18} />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-emerald-500" /></div>}
        {!loading && filteredTeams.length === 0 && (
            <div className="p-20 text-center text-slate-600 font-mono text-xs uppercase tracking-widest">No nodes detected in current sector.</div>
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