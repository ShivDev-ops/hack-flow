"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function purgeEventAction(eventId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('hf_participants').delete().eq('event_id', eventId);
  if (error) return { success: false, error: error.message };
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/triage");
  return { success: true };
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
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function ingestParticipants(
  eventId: string, 
  url: string, 
  mapping: Record<string, string>, 
  shouldPurge: boolean,
  maxMembers: number
) {
  const supabase = await createClient();
  try {
    if (shouldPurge) await purgeEventAction(eventId);

    const sheetIdMatch = url.match(/\/d\/(.*?)(\/|$)/);
    if (!sheetIdMatch) throw new Error("Invalid Google Sheets URL");
    
    const response = await fetch(`https://docs.google.com/spreadsheets/d/${sheetIdMatch[1]}/export?format=csv`);
    if (!response.ok) throw new Error("Sheet_Inaccessible");
    
    const csvText = await response.text();
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const rows = lines.slice(1); 
    const getIdx = (key: string) => headers.indexOf(mapping[key]);

    const participants: any[] = [];

    rows.filter(row => row.trim() !== "" && row.includes(',')).forEach((row, index) => {
      const cols = row.split(',').map(c => c.trim().replace(/"/g, ''));
      const teamName = cols[getIdx('team_name')] || `UNASSIGNED_${index}`;
      
      const teamParticipants = [];

      // 1. Process Leader
      const leaderName = cols[getIdx('leader_name')];
      const leaderReg = cols[getIdx('leader_reg')];
      
      if (leaderName || leaderReg) {
        teamParticipants.push({
          event_id: eventId,
          team_name: teamName,
          full_name: leaderName || `Unknown_${index}`,
          // Fallback to random ID to prevent Upsert conflicts on empty Reg fields
          registration_no: leaderReg || `AUTO-L-${Math.random().toString(36).substring(7).toUpperCase()}`, 
          email: cols[getIdx('leader_email')] || null,
          phone_number: cols[getIdx('leader_phone')] || null,
          payment_id: cols[getIdx('payment_id')] || null,
          payment_url: cols[getIdx('payment_url')] || null,
          role: 'leader',
          is_claimed: false,
          payment_verified: false
        });
      }

      // 2. Process Members up to Max N
      for (let i = 2; i <= maxMembers; i++) {
        const mName = cols[getIdx(`m${i}_name`)];
        const mReg = cols[getIdx(`m${i}_reg`)];
        
        if (mName || mReg) {
          teamParticipants.push({
            event_id: eventId,
            team_name: teamName,
            full_name: mName || "Unnamed Member",
            registration_no: mReg || `AUTO-M-${Math.random().toString(36).substring(7).toUpperCase()}`,
            email: cols[getIdx(`m${i}_email`)] || null,
            phone_number: cols[getIdx(`m${i}_phone`)] || null,
            role: 'member',
            is_claimed: false,
            payment_verified: false
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
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function addManualParticipantAction(eventId: string, data: any) {
  const supabase = await createClient();
  const { error } = await supabase.from("hf_participants").insert({
    event_id: eventId,
    full_name: data.name,
    registration_no: data.regNo,
    team_name: data.team,
    email: data.email,
    phone_number: data.phone, 
    role: data.role || 'member',
    added_manually: true,
    is_claimed: false,
    payment_verified: false
  });

  if (error) return { success: false, error: error.code === '23505' ? "Conflict: ID already exists." : error.message };
  revalidatePath("/dashboard/triage");
  return { success: true };
}