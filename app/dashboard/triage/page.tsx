"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Search, ArrowLeft, Loader2, Rocket, ShieldCheck, ShieldAlert, Phone, RefreshCw } from "lucide-react";
import Link from "next/link";
import { NodeDetailsModal } from "@/components/dashboard/node-details-modal";
import { promoteTeamToLab } from "@/app/actions/labs";
import { syncEventAction } from "@/app/actions/ingest";
import { Participant, Event } from "@/types/common";

export default function TriagePage() {
  const [allParticipants, setAllParticipants] = useState<Participant[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [eventData, setEventData] = useState<Event | null>(null);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLaunching, setIsLaunching] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const supabase = useMemo(() => createClient(), []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: pData } = await supabase.from("hf_participants").select("*").order("created_at", { ascending: false });
    const { data: eData } = await supabase.from("hf_events").select("*").order('created_at', { ascending: false }).limit(1).single();
    
    setAllParticipants((pData as Participant[]) || []);
    setEventData(eData as Event);

    // Only show teams where participants are NOT claimed yet
    const unclaimedParticipants = (pData as Participant[])?.filter(p => !p.is_claimed) || [];

    const uniqueTeams = unclaimedParticipants.reduce((acc: Participant[], current: Participant) => {
      if (!acc.find(item => item.team_name === current.team_name)) acc.push(current);
      return acc;
    }, []);

    setParticipants(uniqueTeams || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { 
    const init = async () => {
      await fetchData();
    };
    init();
  }, [fetchData]);

  const handleSync = async () => {
    if (!eventData) return;
    setIsSyncing(true);
    const res = await syncEventAction(eventData.id);
    if (res.success) {
      await fetchData();
    } else {
      alert("SYNC_ERROR: " + res.error);
    }
    setIsSyncing(false);
  };

  const handleToggleVerification = async (p: Participant) => {
    if (p.payment_verified && !window.confirm("CONFIRM_DE_AUTH: Are you sure you want to UNVERIFY this node?")) return;
    const { error } = await supabase.from("hf_participants").update({ payment_verified: !p.payment_verified }).eq("id", p.id);
    if (!error) await fetchData();
  };

  const handleQuickLaunch = async (teamName: string) => {
    if (!eventData) return;
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
      alert(
        `DEPLOYMENT_SUCCESSFUL\n\n` +
        `TEAM_ID: ${result.teamId}\n` +
        `ACCESS_PIN: ${result.pin}\n\n` +
        `Provide these credentials to the squad lead for Lab entry.`
      );
      await fetchData();
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
    <div className="p-4 md:p-8 space-y-8 max-w-[1440px] mx-auto min-h-screen bg-background selection:bg-secondary/30">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="w-full md:w-auto">
          <Link href="/dashboard" className="text-[10px] text-white/40 hover:text-secondary flex items-center gap-2 uppercase font-black mb-4 transition-all w-fit font-label-caps tracking-widest">
            <ArrowLeft size={12} /> Return_to_Fleet_CMD
          </Link>
          <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">
            Registry <span className="text-white/20">Triage</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-96 group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-secondary transition-colors">
              <Search size={16} />
            </div>
            <input 
              type="text"
              placeholder="SEARCH_FLEET_NODES..."
              className="w-full bg-white/[0.02] border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-[11px] text-white font-data-mono focus:border-secondary/50 outline-none transition-all shadow-inner group-hover:border-white/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button 
            onClick={handleSync}
            disabled={isSyncing || loading}
            className="flex items-center gap-2 px-6 py-4 bg-white/[0.02] border border-white/10 rounded-2xl text-[10px] font-black text-white uppercase tracking-[0.2em] font-label-caps hover:bg-secondary hover:text-black hover:border-secondary transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <RefreshCw size={14} className={isSyncing ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"} />
            {isSyncing ? "Syncing..." : "Sync_Registry"}
          </button>
        </div>
      </header>

      <div className="glass-panel rim-light rounded-[2rem] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white/[0.02] text-white/40 uppercase text-[9px] font-black tracking-[0.3em] border-b border-white/5 font-label-caps">
              <tr>
                <th className="px-8 py-6">Node / Lead ID</th>
                <th className="px-8 py-6">Team Designation</th>
                <th className="px-8 py-6">System Status</th>
                <th className="px-8 py-6 text-right">Deployment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-data-mono">
              {filteredTeams.map((p) => (
                <tr 
                  key={p.id} 
                  className="hover:bg-white/[0.02] transition-colors cursor-pointer group/row"
                  onClick={() => setSelectedTeam(p.team_name)}
                >
                  <td className="px-8 py-6">
                    <div className="text-white text-sm font-sans font-bold group-hover/row:text-secondary transition-colors uppercase tracking-tight">{p.full_name}</div>
                    <div className="flex flex-col gap-1 mt-2">
                      <div className="text-[10px] text-white/40">{p.registration_no}</div>
                      {p.phone_number && (
                        <div className="text-[9px] text-white/20 flex items-center gap-1.5">
                          <Phone size={10} className="text-secondary/50" />
                          {p.phone_number}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-white/60 text-xs uppercase font-black tracking-tighter">{p.team_name}</td>
                  <td className="px-8 py-6">
                      <button 
                          onClick={(e) => { e.stopPropagation(); handleToggleVerification(p); }}
                          className={`flex items-center gap-2 px-4 py-2 rounded-full text-[9px] font-black uppercase transition-all border font-label-caps tracking-widest ${
                              p.payment_verified 
                              ? 'bg-secondary text-black border-transparent shadow-[0_0_15px_rgba(78,222,163,0.3)]' 
                              : 'bg-black/40 text-white/40 border-white/10 hover:border-white/30 hover:text-white'
                          }`}
                      >
                          {p.payment_verified ? <ShieldCheck size={12} strokeWidth={3}/> : <ShieldAlert size={12} strokeWidth={3}/>}
                          {p.payment_verified ? 'Verified' : 'Unverified'}
                      </button>
                  </td>
                  <td className="px-8 py-6 text-right" onClick={(e) => e.stopPropagation()}>
                    <button 
                      disabled={!p.payment_verified || !!isLaunching}
                      onClick={() => handleQuickLaunch(p.team_name)}
                      className={`p-4 rounded-2xl transition-all duration-300 ${
                        p.payment_verified 
                        ? 'bg-white/5 text-secondary hover:bg-secondary hover:text-black border border-white/10 shadow-lg active:scale-95' 
                        : 'bg-transparent text-white/5 border border-white/5 cursor-not-allowed'
                      }`}
                    >
                      {isLaunching === p.team_name ? <Loader2 className="animate-spin" size={20}/> : <Rocket size={20} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {loading && <div className="p-32 flex justify-center"><Loader2 className="animate-spin text-secondary" size={32} /></div>}
        {!loading && filteredTeams.length === 0 && (
            <div className="p-32 text-center text-white/20 font-data-mono text-xs uppercase tracking-[0.4em]">No_nodes_detected_in_current_sector.</div>
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