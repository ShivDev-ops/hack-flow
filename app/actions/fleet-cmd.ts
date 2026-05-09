"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export async function getFleetTelemetry() {
  const supabase = await createAdminClient();
  
  try {
    // 1. Fetch tenants with basic event info
    const { data: tenants, error: tenantsError } = await supabase
      .from("hf_organizer_credentials")
      .select("*, event:hf_events(id, name, is_active)")
      .order("created_at", { ascending: false });

    if (tenantsError) throw tenantsError;

    // 2. Fetch Global Participant Count (Highly Efficient)
    const { count: participantCount, error: partError } = await supabase
      .from("hf_participants")
      .select("id", { count: 'exact', head: true });

    if (partError) throw partError;

    // 3. Fetch aggregated telemetry using a single query
    // Since we can't do GROUP BY in PostgREST easily, we fetch restricted columns 
    // and aggregate on the server to keep the client payload small.
    const { data: telemetry, error: telemetryError } = await supabase
      .from("hf_api_telemetry")
      .select("event_id, tokens_consumed");

    if (telemetryError) throw telemetryError;

    const usageMap: Record<string, number> = {};
    let totalTokens = 0;
    
    telemetry.forEach(row => {
      usageMap[row.event_id] = (usageMap[row.event_id] || 0) + row.tokens_consumed;
      totalTokens += row.tokens_consumed;
    });

    // 4. Fetch latest logs (Only 10)
    const { data: logs, error: logsError } = await supabase
      .from("hf_api_telemetry")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    if (logsError) throw logsError;

    // 5. Fetch all events for the KPI summary
    const { data: events, error: eventsError } = await supabase
      .from("hf_events")
      .select("id, is_active");

    if (eventsError) throw eventsError;

    return {
      success: true,
      data: {
        tenants,
        events,
        usageMap,
        totalTokens,
        participantCount: participantCount || 0,
        logs: logs || []
      }
    };

  } catch (error: any) {
    console.error("[TELEMETRY_ACTION_ERROR]:", error.message);
    return { success: false, error: error.message };
  }
}
