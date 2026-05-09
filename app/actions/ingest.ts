"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Participant } from "@/types/common";

export async function purgeEventAction(eventId: string) {
  const supabase = await createAdminClient();
  
  try {
      // 1. Get all teams linked to this event
      const { data: teams } = await supabase.from('hf_teams').select('id').eq('event_id', eventId);
      
      if (teams && teams.length > 0) {
        const teamIds = teams.map(t => t.id);

        // 2. Cascade delete all team-dependent data
        await Promise.all([
            supabase.from('hf_team_members').delete().in('team_id', teamIds),
            supabase.from('hf_tasks').delete().in('team_id', teamIds),
            supabase.from('hf_project_dna').delete().in('team_id', teamIds),
            supabase.from('hf_telemetry_logs').delete().in('team_id', teamIds),
            supabase.from('hf_judging_results').delete().in('team_id', teamIds),
            supabase.from('hf_chat_messages').delete().in('team_id', teamIds),
        ]);

        // 3. Delete the teams themselves
        await supabase.from('hf_teams').delete().in('id', teamIds);
      }

      // 4. Delete API telemetry for this event
      await supabase.from('hf_api_telemetry').delete().eq('event_id', eventId);

      // 5. Delete staging participants
      await supabase.from('hf_participants').delete().eq('event_id', eventId);
      
      // 6. Delete the Event record itself
      const { error: eventDeleteError } = await supabase.from('hf_events').delete().eq('id', eventId);
      
      if (eventDeleteError) throw eventDeleteError;
      
      revalidatePath("/dashboard");
      revalidatePath("/dashboard/triage");
      return { success: true };
  } catch (err: any) {
      console.error("[DEEP_PURGE_FAILURE]:", err);
      return { success: false, error: err.message };
  }
}

export async function testSheetConnection(url: string) {
  try {
    const sheetIdMatch = url.match(/\/d\/(.*?)(\/|$)/);
    if (!sheetIdMatch) return { success: false, error: "Invalid Google Sheets URL format." };
    const sheetId = sheetIdMatch[1];
    const response = await fetch(`https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`);
    if (!response.ok) return { success: false, error: "Access Denied: Ensure sheet is public." };
    const csvText = await response.text();
    const headers = csvText.split('\n')[0].split(',').map(h => h.trim().replace(/"/g, ''));
    return { success: true, headers };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function ingestParticipants(
  eventId: string, 
  url: string, 
  mapping: Record<string, string>, 
  shouldPurge: boolean,
  maxMembers: number
) {
  const supabase = await createAdminClient();
  try {
    if (shouldPurge) await purgeEventAction(eventId);

    const sheetIdMatch = url.match(/\/d\/(.*?)(\/|$)/);
    if (!sheetIdMatch) throw new Error("Invalid Google Sheets URL");
    
    const response = await fetch(`https://docs.google.com/spreadsheets/d/${sheetIdMatch[1]}/export?format=csv`);
    if (!response.ok) throw new Error("Sheet_Inaccessible");
    
    const csvText = await response.text();
    const lines = csvText.split(/\r?\n/);
    
    // Robust CSV Parser for quoted values
    const parseCSVLine = (line: string) => {
      const result = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result.map(v => v.replace(/^"|"$/g, ''));
    };

    const headers = parseCSVLine(lines[0]);
    const rows = lines.slice(1); 
    const getIdx = (key: string) => {
      const headerName = mapping[key];
      if (!headerName) return -1;
      return headers.indexOf(headerName);
    };

    const participants: Omit<Participant, 'id' | 'created_at'>[] = []; // Keeping typed list for consistency

    rows.filter(row => row.trim() !== "").forEach((row, index) => {
      const cols = parseCSVLine(row);
      const teamNameIdx = getIdx('team_name');
      const teamName = teamNameIdx !== -1 ? cols[teamNameIdx] : `UNASSIGNED_${index}`;
      
      const teamParticipants: Omit<Participant, 'id' | 'created_at'>[] = [];

      // 1. Process Leader
      const lNameIdx = getIdx('leader_name');
      const lRegIdx = getIdx('leader_reg');
      const lEmailIdx = getIdx('leader_email');
      const lPhoneIdx = getIdx('leader_phone');
      const pIdIdx = getIdx('payment_id');
      const pUrlIdx = getIdx('payment_url');

      const leaderName = lNameIdx !== -1 ? cols[lNameIdx] : null;
      const leaderReg = lRegIdx !== -1 ? cols[lRegIdx] : null;
      
      if (leaderName || leaderReg) {
        teamParticipants.push({
          event_id: eventId,
          team_name: teamName,
          full_name: leaderName || `Unknown_${index}`,
          registration_no: leaderReg || `AUTO-L-${Math.random().toString(36).substring(7).toUpperCase()}`, 
          email: lEmailIdx !== -1 ? cols[lEmailIdx] : null,
          phone_number: lPhoneIdx !== -1 ? cols[lPhoneIdx] : null,
          payment_id: pIdIdx !== -1 ? cols[pIdIdx] : null,
          payment_url: pUrlIdx !== -1 ? cols[pUrlIdx] : null,
          role: 'leader',
          is_claimed: false,
          payment_verified: false
        });
      }

      // 2. Process Members up to Max N
      for (let i = 2; i <= maxMembers; i++) {
        const mNameIdx = getIdx(`m${i}_name`);
        const mRegIdx = getIdx(`m${i}_reg`);
        const mEmailIdx = getIdx(`m${i}_email`);
        const mPhoneIdx = getIdx(`m${i}_phone`);

        const mName = mNameIdx !== -1 ? cols[mNameIdx] : null;
        const mReg = mRegIdx !== -1 ? cols[mRegIdx] : null;
        
        if (mName || mReg) {
          teamParticipants.push({
            event_id: eventId,
            team_name: teamName,
            full_name: mName || "Unnamed Member",
            registration_no: mReg || `AUTO-M-${Math.random().toString(36).substring(7).toUpperCase()}`,
            email: mEmailIdx !== -1 ? cols[mEmailIdx] : null,
            phone_number: mPhoneIdx !== -1 ? cols[mPhoneIdx] : null,
            role: 'member',
            is_claimed: false,
            payment_verified: false,
            payment_id: null,
            payment_url: null
          });
        }
      }

      // 3. NO MINIMUM CONSTRAINT
      if (teamParticipants.length > 0) {
        participants.push(...teamParticipants);
      }
    });

    // 4. In-Memory Deduplication
    const uniqueParticipants = participants.filter((p, index, self) =>
      p.registration_no && index === self.findIndex((t) => t.registration_no === p.registration_no)
    );

    // 5. The Upsert Logic (Prevents crashes on repeated syncs)
    if (uniqueParticipants.length > 0) {
        const { error: insertError } = await supabase.from('hf_participants').upsert(
            uniqueParticipants, 
            { onConflict: 'registration_no' }
        );
        if (insertError) throw new Error(insertError.message);
    }

    revalidatePath("/dashboard/triage");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function addManualParticipantAction(eventId: string, data: Record<string, string>) {
  const supabase = await createClient();
  const { error } = await supabase.from("hf_participants").insert({
    event_id: eventId,
    full_name: data.name,
    registration_no: data.regNo,
    team_name: data.team,
    email: data.email,
    phone_number: data.phone, 
    role: (data.role as 'leader' | 'member') || 'member',
    is_claimed: false,
    payment_verified: false
  });

  if (error) return { success: false, error: error.code === '23505' ? "Conflict: ID already exists." : error.message };
  revalidatePath("/dashboard/triage");
  return { success: true };
}

export async function syncEventAction(eventId: string) {
  const supabase = await createAdminClient();
  
  try {
    const { data: event, error: eventError } = await supabase
      .from('hf_events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventError || !event) throw new Error("Event_Not_Found");

    const mapping = event.column_mapping as Record<string, string>;
    const sheetUrl = mapping?.['__sheet_url'];

    if (!sheetUrl) throw new Error("No_Sheet_Uplink_Configured");

    // Remove internal key
    const cleanMapping = { ...mapping };
    delete cleanMapping['__sheet_url'];

    const res = await ingestParticipants(
      eventId, 
      sheetUrl, 
      cleanMapping, 
      false, 
      event.max_members
    );

    return res;
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
