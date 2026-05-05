"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { 
  ArrowLeft, 
  Users, 
  ShieldCheck, 
  ShieldAlert, 
  Loader2, 
  Trophy, 
  User, 
  Search,
  LayoutGrid,
  List,
  Eye,
  Settings,
  MoreVertical
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { TeamDetailsModal } from "@/components/dashboard/team-details-modal";
import { Event, Team, TeamMember } from "@/types/common";

export default function EventViewPage() {
  const params = useParams();
  const id = params.id as string;
  const [event, setEvent] = useState<Event | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [eventRes, teamsRes, membersRes] = await Promise.all([
        supabase.from('hf_events').select('*').eq('id', id).single(),
        supabase.from('hf_teams').select('*').eq('event_id', id).order('created_at', { ascending: false }),
        supabase.from('hf_team_members').select('*')
      ]);

      if (eventRes.error) throw eventRes.error;
      
      setEvent(eventRes.data as Event);
      setTeams((teamsRes.data as Team[]) || []);
      
      // Filter members for the teams we fetched
      const teamIds = ((teamsRes.data as Team[]) || []).map(t => t.id);
      const filteredMembers = ((membersRes.data as TeamMember[]) || []).filter(m => teamIds.includes(m.team_id));
      setMembers(filteredMembers);
    } catch (error: unknown) {
      console.error("DATA_FETCH_ERROR:", error instanceof Error ? error.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [id, supabase]);

  useEffect(() => {
    const init = async () => {
      await fetchData();
    };
    init();
  }, [fetchData]);

  const filteredTeams = teams.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.readable_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && !event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-black">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white">Loading_Event_Telemetry</span>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-black">
        <ShieldAlert className="text-red-500" size={40} />
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white">Event_Not_Found</span>
        <Link href="/dashboard" className="text-emerald-500 text-xs font-black uppercase mt-4 hover:underline">Return to Fleet CMD</Link>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-10 max-w-[1400px] mx-auto min-h-screen bg-black">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="w-full md:w-auto">
          <Link href="/dashboard" className="text-[10px] text-slate-500 hover:text-emerald-500 flex items-center gap-1 uppercase font-black mb-4 transition-all w-fit">
            <ArrowLeft size={12} /> Fleet Overview
          </Link>
          <div className="flex items-center gap-4">
            <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter">
              {event.name} <span className="text-emerald-500">Telemetry</span>
            </h1>
            <div className={`px-3 py-1 rounded text-[9px] font-black uppercase tracking-widest ${event.is_active ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-zinc-800 text-slate-500 border border-white/5'}`}>
              {event.is_active ? 'Live' : 'Offline'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
           <div className="relative flex-1 md:w-80 group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors">
              <Search size={16} />
            </div>
            <input 
              type="text"
              placeholder="SEARCH_TEAMS..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-xs text-white font-mono focus:border-emerald-500 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex bg-white/5 border border-white/10 rounded-xl p-1">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-emerald-500 text-black' : 'text-slate-500 hover:text-white'}`}
            >
              <LayoutGrid size={18} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-emerald-500 text-black' : 'text-slate-500 hover:text-white'}`}
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-zinc-900/40 border border-white/5 p-6 rounded-3xl backdrop-blur-sm shadow-xl">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <Users size={12} className="text-emerald-500" /> Total Active Teams
          </p>
          <h2 className="text-4xl font-black text-white mt-2 tracking-tight">{teams.length}</h2>
        </div>
        <div className="bg-zinc-900/40 border border-white/5 p-6 rounded-3xl backdrop-blur-sm shadow-xl">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <User size={12} className="text-emerald-500" /> Total Verified Members
          </p>
          <h2 className="text-4xl font-black text-white mt-2 tracking-tight">{members.length}</h2>
        </div>
        <div className="bg-emerald-500/5 border border-emerald-500/20 p-6 rounded-3xl backdrop-blur-sm shadow-xl md:col-span-2 flex justify-between items-center">
          <div>
            <p className="text-[10px] font-black text-emerald-500/70 uppercase tracking-widest">System Protocol</p>
            <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Lab Synchronization Active</h2>
          </div>
          <Trophy size={32} className="text-emerald-500 opacity-50" />
        </div>
      </div>

      {/* Main Content */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredTeams.map((team) => {
            const teamMembers = members.filter(m => m.team_id === team.id);
            return (
              <div key={team.id} className="bg-zinc-900/20 border border-white/5 rounded-[2rem] p-8 space-y-6 hover:border-emerald-500/40 transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="text-slate-500 hover:text-white transition-colors"><MoreVertical size={20} /></button>
                </div>

                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter group-hover:text-emerald-500 transition-colors">
                      {team.name}
                    </h3>
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono uppercase mt-1">ID: {team.readable_id || team.id.slice(0, 8)}</p>
                </div>

                <div className="space-y-3">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Active Roster</p>
                  <div className="space-y-2">
                    {teamMembers.length > 0 ? (
                      teamMembers.map((member) => (
                        <div key={member.id} className="flex items-center justify-between bg-white/5 border border-white/5 p-3 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                              <User size={14} className="text-emerald-500" />
                            </div>
                            <div>
                              <p className="text-[11px] font-bold text-white uppercase">{member.role === 'LEAD' ? 'Lead' : 'Member'}</p>
                              <p className="text-[9px] text-slate-500 font-mono truncate max-w-[120px]">{member.user_id || 'ID_NOT_LINKED'}</p>
                            </div>
                          </div>
                          {member.is_verified ? <ShieldCheck size={14} className="text-emerald-500" /> : <ShieldAlert size={14} className="text-red-500" />}
                        </div>
                      ))
                    ) : (
                      <div className="py-4 text-center border border-dashed border-white/5 rounded-xl">
                        <p className="text-[10px] text-slate-600 uppercase font-mono tracking-widest">No members deployed</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex gap-2">
                   <button 
                    onClick={() => { setSelectedTeam(team); setIsModalOpen(true); }}
                    className="flex-1 bg-white/5 hover:bg-emerald-500 hover:text-black text-[10px] font-black text-slate-300 py-3 rounded-xl uppercase transition-all flex items-center justify-center gap-2"
                  >
                    <Eye size={14} /> View Details
                  </button>
                  <button className="bg-white/5 hover:bg-white/10 text-slate-300 p-3 rounded-xl transition-all">
                    <Settings size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-zinc-900/20 border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white/5 text-slate-500 uppercase text-[9px] font-black tracking-[0.2em] border-b border-white/5">
              <tr>
                <th className="px-8 py-6">Team Designation</th>
                <th className="px-8 py-6">Readable ID</th>
                <th className="px-8 py-6">Active Nodes</th>
                <th className="px-8 py-6">Status</th>
                <th className="px-8 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {filteredTeams.map((team) => {
                const teamMembers = members.filter(m => m.team_id === team.id);
                return (
                  <tr key={team.id} className="hover:bg-emerald-500/[0.03] transition-colors group">
                    <td className="px-8 py-6">
                      <div className="text-white text-sm font-sans font-bold group-hover:text-emerald-400 uppercase tracking-tight">{team.name}</div>
                    </td>
                    <td className="px-8 py-6 text-emerald-500/70 text-xs uppercase font-black">{team.readable_id || team.id.slice(0, 8)}</td>
                    <td className="px-8 py-6 text-slate-400 text-xs uppercase font-black">
                      <div className="flex -space-x-2">
                        {teamMembers.map((m) => (
                          <div key={m.id} className="w-8 h-8 rounded-full bg-zinc-800 border-2 border-black flex items-center justify-center text-emerald-500" title={m.role}>
                            <User size={14} />
                          </div>
                        ))}
                        {teamMembers.length === 0 && <span className="text-slate-700">None</span>}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                        <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-3 py-1 rounded-full text-[9px] font-black uppercase">Active</span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2">
                         <button 
                          onClick={() => { setSelectedTeam(team); setIsModalOpen(true); }}
                          className="p-2 bg-white/5 hover:bg-emerald-500 hover:text-black rounded-lg transition-all text-slate-400"
                        >
                           <Eye size={16} />
                         </button>
                         <button className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-all text-slate-400">
                           <Settings size={16} />
                         </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {filteredTeams.length === 0 && !loading && (
        <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[3rem]">
          <p className="text-slate-500 font-mono text-sm uppercase tracking-widest">No teams matched current search parameters.</p>
        </div>
      )}

      <TeamDetailsModal 
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedTeam(null); }}
        team={selectedTeam}
        members={selectedTeam ? members.filter(m => m.team_id === selectedTeam.id) : []}
      />
    </div>
  );
}