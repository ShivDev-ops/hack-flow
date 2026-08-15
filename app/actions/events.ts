'use server'

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";
import { getLabSession } from "@/app/actions/lab-auth";

export async function createEventAction(
  name: string, 
  maxSize: number = 4,
  startTime?: string,
  endTime?: string,
  sheetUrl?: string
) {
  console.log(`[LINKAGE_DEBUG] createEventAction initiated for: ${name}`);
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.name) {
    console.error("[LINKAGE_DEBUG] UNAUTHORIZED: No session user name found.");
    return { success: false, error: "UNAUTHORIZED: Session expired." };
  }

  const supabase = await createClient();
  const adminSupabase = await createAdminClient();

  // 1. RESOLVE ORGANIZER PROFILE (Using Access ID which is guaranteed unique and in session.user.name)
  console.log(`[LINKAGE_DEBUG] Resolving profile for AccessID: ${session.user.name}`);
  const { data: currentProfile, error: profileError } = await adminSupabase
    .from('hf_organizer_credentials')
    .select('id, event_id, role, access_id')
    .ilike('access_id', session.user.name)
    .maybeSingle();

  if (profileError || !currentProfile) {
      console.error("[LINKAGE_DEBUG] Profile resolution failed:", profileError?.message || "User not found in DB");
      return { success: false, error: "PROFILE_NOT_FOUND: Could not identify your organizer account." };
  }

  if (currentProfile.role === 'ORGANIZER' && currentProfile.event_id) {
    console.warn(`[LINKAGE_DEBUG] Blocked: Organizer ${currentProfile.access_id} already has event ${currentProfile.event_id}`);
    return { success: false, error: "RESTRICTION_ERROR: This ID is already linked to an active node." };
  }

  // 2. INSERT EVENT
  const finalStartTime = startTime || new Date().toISOString();
  const finalEndTime = endTime || new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

  const { data: eventData, error: eventError } = await supabase
    .from('hf_events')
    .insert({
      name: name,
      start_time: finalStartTime,
      end_time: finalEndTime,
      max_members: maxSize,
      column_mapping: sheetUrl ? { '__sheet_url': sheetUrl } : {} 
    })
    .select()
    .single();

  if (eventError) {
      console.error("[LINKAGE_DEBUG] Event insertion failed:", eventError.message);
      return { success: false, error: eventError.message };
  }

  console.log(`[LINKAGE_DEBUG] Event created successfully with ID: ${eventData.id}`);

  // 3. LINK EVENT TO ORGANIZER
  console.log(`[LINKAGE_DEBUG] Linking Event ${eventData.id} to Organizer ID ${currentProfile.id} (${currentProfile.access_id})`);
  const { error: linkError } = await adminSupabase
      .from('hf_organizer_credentials')
      .update({ event_id: eventData.id })
      .eq('id', currentProfile.id);
  
  if (linkError) {
      console.error("[LINKAGE_DEBUG] CRITICAL LINK FAILURE:", linkError.message);
      return { success: false, error: "LINK_FAILURE: Event created but failed to bind to your profile. Contact support." };
  }

  console.log("[LINKAGE_DEBUG] Handshake complete. Link verified.");
  
  revalidatePath("/dashboard"); 
  return { success: true, event: eventData };
}

export async function updateEventSettingsAction(
  eventId: string, 
  settings: {
    start_time: string;
    end_time: string;
    max_team_size: number; 
    is_active: boolean;
  }
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("hf_events")
    .update({
      start_time: settings.start_time,
      end_time: settings.end_time,
      max_members: settings.max_team_size,
      is_active: settings.is_active
    })
    .eq("id", eventId);

  if (error) return { success: false, error: error.message };
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateEventMapping(eventId: string, mapping: Record<string, string>, sheetUrl?: string) {
  const supabase = await createClient();
  const finalMapping = { ...mapping };
  if (sheetUrl) finalMapping['__sheet_url'] = sheetUrl;

  const { error } = await supabase
    .from('hf_events')
    .update({ column_mapping: finalMapping })
    .eq('id', eventId);

  if (error) return { success: false, error: error.message };
  revalidatePath("/dashboard");
  return { success: true };
}

export async function getActiveEventAction() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('hf_events')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return { success: false, error: error.message };
  return { success: true, event: data };
}

export async function getEventDetails(eventId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('hf_events')
        .select('name, problem_statement, srs_document_path')
        .eq('id', eventId)
        .single();
    
    if (error) return { success: false, error: error.message };
    return { success: true, data };
}

export async function updateEventResources(formData: FormData) {
  try {
    const eventId = formData.get('eventId') as string;
    const problemStatement = formData.get('problemStatement') as string;
    const srsDocument = formData.get('srsDocument') as File | null;

    if (!eventId) return { success: false, error: "Event ID is missing." };
    
    const supabase = await createClient();
    let srsPath: string | undefined = undefined;

    if (srsDocument && srsDocument.size > 0) {
      const fileExt = srsDocument.name.split('.').pop();
      const fileName = `${eventId}-${Date.now()}.${fileExt}`;
      const filePath = `public/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('event_resources')
        .upload(filePath, srsDocument);

      if (uploadError) return { success: false, error: `Storage Error: ${uploadError.message}` };
      srsPath = filePath;
    }

    const updateData: { problem_statement: string; srs_document_path?: string } = {
      problem_statement: problemStatement
    };
    if (srsPath) updateData.srs_document_path = srsPath;

    const { error: dbError } = await supabase
      .from('hf_events')
      .update(updateData)
      .eq('id', eventId);

    if (dbError) {
      if (srsPath) await supabase.storage.from('event_resources').remove([srsPath]);
      return { success: false, error: `Database Error: ${dbError.message}` };
    }

    // Revalidate participant briefing page so lab view sees updated resources
    revalidatePath('/lab/dashboard/briefing');
    return { success: true, path: srsPath };
  } catch (err: any) {
    return { success: false, error: `A critical error occurred: ${err.message}` };
  }
}

export async function getEventForParticipant() {
  const supabase = await createClient();
  const session = await getLabSession();

  if (!session?.teamId) return { success: false, error: "Participant session not found." };

  const { data: teamData, error: teamError } = await supabase
    .from("hf_teams")
    .select("event_id")
    .eq("id", session.teamId)
    .single();

  if (teamError || !teamData) return { success: false, error: "Could not find team." };

  const { data: eventData, error: eventError } = await supabase
    .from("hf_events")
    .select("name, problem_statement, srs_document_path")
    .eq("id", teamData.event_id)
    .single();

  if (eventError || !eventData) return { success: false, error: "Could not retrieve event." };

  return { success: true, data: eventData };
}
