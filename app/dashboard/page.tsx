"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Plus, Users, Loader2, LayoutGrid, Archive } from "lucide-react";
import { EventCard } from "@/components/dashboard/event-card";
import { InitEventModal } from "@/components/dashboard/init-event-modal";
import { createClient } from "@/lib/supabase/client";

import { Event, Participant } from "@/types/common";

export default function DashboardPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [participantData, setParticipantData] = useState<Pick<Participant, 'id' | 'event_id' | 'team_name'>[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const supabase = useMemo(() => createClient(), []);

  /**
   * Fetches the entire fleet's telemetry.
   * Calculates metrics for both participants and unique teams.
   */
  const fetchFleetStatus = useCallback(async () => {
    setLoading(true);
    try {
      // Parallel execution for optimal load speed
      const [eventsRes, participantsRes] = await Promise.all([
        supabase
          .from('hf_events')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('hf_participants')
          .select('id, event_id, team_name')
      ]);

      if (eventsRes.error) throw eventsRes.error;
      
      setEvents(eventsRes.data || []);
      setParticipantData(participantsRes.data || []);
    } catch (error: unknown) {
      console.error("TELEMETRY_SYNC_ERROR:", error instanceof Error ? error.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    // Avoid synchronous setState in effect
    const init = async () => {
      await fetchFleetStatus();
    };
    init();
  }, [fetchFleetStatus]);

  // Global Stat Calculation
  const totalParticipants = participantData.length;

  return (
    <div className="space-y-12 max-w-[1440px] mx-auto p-6 md:p-10 bg-background min-h-screen selection:bg-secondary/30">
      {/* Welcome Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic leading-none">
            Welcome back, <span className="text-secondary font-black">Admin</span>
          </h1>
          <p className="text-[10px] text-white/40 font-bold uppercase tracking-[0.4em] mt-3 ml-1 font-label-caps">
            System_Status: <span className="text-secondary">Stable</span> {" // "} Node_Handshake: <span className="text-secondary">Verified</span>
          </p>
        </div>
        <div className="flex items-center gap-4 bg-white/[0.02] border border-white/5 px-6 py-3 rounded-2xl rim-light">
          <div className="w-2 h-2 bg-secondary rounded-full pulse-emerald" />
          <span className="text-[9px] font-black text-white/60 uppercase tracking-widest font-data-mono">Uptime: 99.99%</span>
        </div>
      </header>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel rim-light p-8 rounded-3xl shadow-xl group hover:border-secondary/30 transition-all duration-500">
          <p className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2 font-label-caps">
            <Users size={12} className="text-secondary" /> Total Registry Nodes
          </p>
          <h2 className="text-5xl font-black text-white mt-4 tracking-tighter font-data-mono">
            {loading ? <Loader2 className="animate-spin text-white/10" size={32} /> : totalParticipants.toLocaleString()}
          </h2>
        </div>
        
        <div className="glass-panel rim-light p-8 rounded-3xl md:col-span-2 flex justify-between items-center shadow-xl group hover:border-secondary/30 transition-all duration-500">
          <div className="space-y-2">
            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest font-label-caps">Protocol Tier</p>
            <h2 className="text-3xl font-black text-secondary uppercase italic tracking-tighter">Student Organization</h2>
          </div>
          <button className="bg-white/5 hover:bg-white/10 text-white text-[10px] font-black px-6 py-4 rounded-2xl border border-white/10 uppercase transition-all tracking-[0.2em] font-label-caps active:scale-95 shadow-lg">
            Upgrade Capacity
          </button>
        </div>
      </div>

      {/* Command Action Bar */}
      <div className="flex flex-col md:flex-row justify-between items-end border-b border-white/5 pb-4 gap-6">
        <div className="flex gap-8 text-[11px] font-black uppercase tracking-[0.2em] font-label-caps">
          <button className="flex items-center gap-2 text-white border-b-2 border-secondary pb-4 transition-all">
            <LayoutGrid size={14} /> Fleet Overview
          </button>
          <button className="flex items-center gap-2 text-white/20 pb-4 hover:text-white/60 transition-all">
            <Archive size={14} /> Archived Nodes
          </button>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-3 bg-secondary text-black text-xs font-black px-10 py-5 rounded-[1.5rem] hover:bg-[#5affb4] hover:scale-[1.02] active:scale-[0.98] transition-all mb-2 shadow-[0_0_40px_rgba(78,222,163,0.15)] font-label-caps tracking-widest uppercase"
        >
          <Plus size={20} strokeWidth={4} /> Initialize_New_Event
        </button>
      </div>

      {/* Node Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4 opacity-20">
          <Loader2 className="animate-spin text-white" size={48} />
          <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white font-label-caps">Syncing_Fleet_Data</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.length > 0 ? (
            events.map((event) => {
              // Calculate counts for this specific event
              const eventParticipants = participantData.filter(p => p.event_id === event.id);
              const teamCount = new Set(eventParticipants.map(p => p.team_name)).size;

              return (
                <EventCard 
                  key={event.id} 
                  event={event} 
                  participantCount={eventParticipants.length}
                  teamCount={teamCount}
                />
              );
            })
          ) : (
            <div className="col-span-full py-32 text-center border-2 border-dashed border-white/5 rounded-[3rem] bg-white/[0.01]">
              <p className="text-white/20 font-data-mono text-sm uppercase tracking-[0.3em]">No active nodes detected in current sector.</p>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <InitEventModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          fetchFleetStatus(); // Refresh data after modal closes
        }} 
      />
    </div>
  );
}