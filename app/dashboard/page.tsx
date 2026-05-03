"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Users, Loader2, LayoutGrid, Archive } from "lucide-react";
import { EventCard } from "@/components/dashboard/event-card";
import { InitEventModal } from "@/components/dashboard/init-event-modal";
import { createClient } from "@/lib/supabase/client";

export default function DashboardPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [participantData, setParticipantData] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const supabase = createClient();

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
    } catch (error: any) {
      console.error("TELEMETRY_SYNC_ERROR:", error.message);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchFleetStatus();
  }, [fetchFleetStatus]);

  // Global Stat Calculation
  const totalParticipants = participantData.length;

  return (
    <div className="space-y-10 max-w-[1400px] mx-auto p-6 md:p-10">
      {/* Welcome Header */}
      <header>
        <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic">
          Welcome back, <span className="text-emerald-500 font-black">Admin</span>
        </h1>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-2 ml-1">
          System_Status: <span className="text-emerald-500">Stable</span> // Node_Handshake: <span className="text-emerald-500">Verified</span>
        </p>
      </header>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-zinc-900/40 border border-white/5 p-6 rounded-2xl backdrop-blur-sm shadow-xl">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <Users size={12} className="text-emerald-500" /> Total Registry Nodes
          </p>
          <h2 className="text-4xl font-black text-white mt-2 tracking-tight">
            {loading ? <Loader2 className="animate-spin text-zinc-700" size={24} /> : totalParticipants.toLocaleString()}
          </h2>
        </div>
        
        <div className="bg-zinc-900/40 border border-white/5 p-6 rounded-2xl backdrop-blur-sm md:col-span-2 flex justify-between items-center shadow-xl">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Protocol Tier</p>
            <h2 className="text-2xl font-black text-emerald-400 uppercase italic tracking-tighter">Student Organization</h2>
          </div>
          <button className="bg-white/5 hover:bg-white/10 text-white text-[10px] font-black px-6 py-3 rounded-xl border border-white/10 uppercase transition-all tracking-widest">
            Upgrade Capacity
          </button>
        </div>
      </div>

      {/* Command Action Bar */}
      <div className="flex flex-col md:flex-row justify-between items-end border-b border-white/5 pb-4 gap-4">
        <div className="flex gap-8 text-[11px] font-black uppercase tracking-[0.2em]">
          <button className="flex items-center gap-2 text-white border-b-2 border-emerald-500 pb-4">
            <LayoutGrid size={14} /> Fleet Overview
          </button>
          <button className="flex items-center gap-2 text-slate-600 pb-4 hover:text-slate-400 transition-colors">
            <Archive size={14} /> Archived Nodes
          </button>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-emerald-500 text-black text-xs font-black px-8 py-4 rounded-xl hover:bg-emerald-400 hover:scale-[1.02] active:scale-[0.98] transition-all mb-2 shadow-[0_0_30px_rgba(16,185,129,0.15)]"
        >
          <Plus size={18} strokeWidth={3} /> INITIALIZE NEW EVENT
        </button>
      </div>

      {/* Node Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-20">
          <Loader2 className="animate-spin text-white" size={40} />
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white">Syncing_Fleet_Data</span>
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
            <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
              <p className="text-slate-500 font-mono text-sm uppercase tracking-widest">No active nodes detected in current sector.</p>
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