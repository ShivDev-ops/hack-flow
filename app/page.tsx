"use client";

import { useEffect, useState } from "react";
import { Plus, Users, Zap, Loader2 } from "lucide-react";
import { EventCard } from "@/components/dashboard/event-card";
import { InitEventModal } from "@/components/dashboard/init-event-modal";
import { createClient } from "@/lib/supabase/client";

export default function DashboardPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const supabase = createClient();

  const fetchFleetData = async () => {
    setLoading(true);
    try {
      const [eventsRes, participantsRes] = await Promise.all([
        supabase.from('hf_events').select('*').order('created_at', { ascending: false }),
        supabase.from('hf_participants').select('id, event_id, team_name')
      ]);

      setEvents(eventsRes.data || []);
      setParticipants(participantsRes.data || []);
    } catch (error) {
      console.error("DATA_SYNC_FAILURE:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFleetData();
  }, []);

  return (
    <div className="space-y-10 max-w-[1400px] mx-auto p-6 md:p-10">
      <header className="flex flex-col md:flex-row justify-between items-start gap-6">
        <div>
          <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic">
            Fleet <span className="text-emerald-500">CMD</span>
          </h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-2">
            System Status: {loading ? "Synchronizing..." : "Optimal"}
          </p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-emerald-500 text-black text-xs font-black px-8 py-4 rounded-xl hover:bg-emerald-400 transition-all shadow-[0_0_30px_rgba(16,185,129,0.15)]"
        >
          <Plus size={18} strokeWidth={3} /> INITIALIZE NEW EVENT
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {events.map((event) => {
          const eventParticipants = participants.filter(p => p.event_id === event.id);
          const uniqueTeams = new Set(eventParticipants.map(p => p.team_name)).size;

          return (
            <EventCard 
              key={event.id} 
              event={event} 
              participantCount={eventParticipants.length}
              teamCount={uniqueTeams}
            />
          );
        })}
      </div>

      <InitEventModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          fetchFleetData();
        }} 
      />
    </div>
  );
}