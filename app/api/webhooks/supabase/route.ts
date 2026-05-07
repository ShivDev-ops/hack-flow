import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

/**
 * API Route: /api/webhooks/supabase
 * Description: Receives real-time database change events from team Supabase instances.
 */

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const teamId = req.headers.get("x-team-id");

    if (!teamId) {
      return NextResponse.json({ error: "MISSING_TEAM_ID_HEADER" }, { status: 400 });
    }

    const supabase = await createAdminClient();

    // 1. Verify Team exists (Check both Readable ID and UUID for robustness)
    const { data: team, error: teamError } = await supabase
      .from("hf_teams")
      .select("id")
      .or(`readable_id.eq.${teamId.toUpperCase()},id.eq.${teamId}`)
      .maybeSingle();

    if (teamError || !team) {
      console.error("[SUPABASE_WEBHOOK_LOOKUP_FAIL]:", teamId);
      return NextResponse.json({ error: "TEAM_NOT_FOUND" }, { status: 404 });
    }

    // 2. Parse the Supabase Webhook payload
    // Supabase sends: { type: 'INSERT', table: 'users', record: { ... }, old_record: { ... }, schema: 'public' }
    const { type, table, record, schema } = payload;

    const logEntry = {
      team_id: team.id,
      action_type: type, // INSERT, UPDATE, DELETE
      table_name: table,
      schema_name: schema,
      details: JSON.stringify(record || {}),
      created_at: new Date().toISOString()
    };

    // 3. Insert into our centralized telemetry logs
    // NOTE: Requires a new table 'hf_telemetry_logs'
    const { error: insertError } = await supabase
      .from("hf_telemetry_logs")
      .insert(logEntry);

    if (insertError) {
      console.error("[SUPABASE_WEBHOOK_ERROR]:", insertError.message);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "An unexpected server error occurred.";
    console.error("[SUPABASE_WEBHOOK_CRITICAL]:", errorMessage);
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}
