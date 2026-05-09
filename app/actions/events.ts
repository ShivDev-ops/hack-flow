'use server'

import { createClient } from "@/lib/supabase/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";
import { getLabSession } from "@/app/actions/lab-auth";

/**
 * PHASE 1: Create the Event Node
 * Updated to remove pin and include optional startTime and endTime.
 */
export async function createEventAction(
  name: string, 
  maxSize: number = 4,
  startTime?: string,
  endTime?: string,
  sheetUrl?: string
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return { success: false, error: "UNAUTHORIZED: Please log in to initialize a node." };
  }

  const supabase = await createClient();

  // 1. ENFORCE ONE-EVENT RULE FOR ORGANIZERS
  if (session.role === 'ORGANIZER' && session.eventId) {
    return { success: false, error: "RESTRICTION_ERROR: This ID is already linked to an active node." };
  }

  // Defaults
  const finalStartTime = startTime || new Date().toISOString();
  const finalEndTime = endTime || new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
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

  if (error) return { success: false, error: error.message };

  // 2. LINK TO ORGANIZER CREDENTIALS
  if (session.role === 'ORGANIZER') {
    const { error: linkError } = await supabase
        .from('hf_organizer_credentials')
        .update({ event_id: data.id })
        .eq('id', session.user.id);
    
    if (linkError) {
        console.error("LINK_ERROR:", linkError);
        // We might want to handle this more gracefully, but for now, log it.
    }
  }
  
  revalidatePath("/dashboard"); 
  return { success: true, event: data };
}

/**
 * PHASE 2: Update Settings
 */
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
  
  // Store the sheet URL inside the mapping object with a reserved key for zero-step background sync
  const finalMapping = { ...mapping };
  if (sheetUrl) {
    finalMapping['__sheet_url'] = sheetUrl;
  }

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

    console.log("ACTION: updateEventResources called for eventId:", eventId);

    if (!eventId) {
      console.error("VALIDATION_ERROR: Event ID is missing from form data.");
      return { success: false, error: "Event ID is missing." };
    }
    
    const supabase = await createClient();
    let srsPath: string | undefined = undefined;

    // 1. Handle File Upload to Supabase Storage if a file is present
    if (srsDocument && srsDocument.size > 0) {
      console.log(`ACTION: File detected: ${srsDocument.name}, Size: ${srsDocument.size}`);
      const fileExt = srsDocument.name.split('.').pop();
      const fileName = `${eventId}-${Date.now()}.${fileExt}`;
      const filePath = `public/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('event_resources')
        .upload(filePath, srsDocument);

      if (uploadError) {
        console.error("SUPABASE_STORAGE_ERROR:", uploadError);
        return { success: false, error: `Storage Error: ${uploadError.message}` };
      }
      srsPath = filePath;
      console.log(`ACTION: File successfully uploaded to path: ${srsPath}`);
    }

    // 2. Update the Database
    const updateData: { problem_statement: string; srs_document_path?: string } = {
      problem_statement: problemStatement
    };
    // Only include the path in the update if a new file was actually uploaded
    if (srsPath) {
      updateData.srs_document_path = srsPath;
    }

    console.log("ACTION: Updating hf_events table with data:", updateData);
    const { error: dbError } = await supabase
      .from('hf_events')
      .update(updateData)
      .eq('id', eventId);

    if (dbError) {
      console.error("SUPABASE_DB_ERROR:", dbError);
      // If DB update fails, attempt to roll back the file upload to prevent orphaned files
      if (srsPath) {
        console.log(`ACTION: Rolling back file upload from ${srsPath}`);
        await supabase.storage.from('event_resources').remove([srsPath]);
      }
      return { success: false, error: `Database Error: ${dbError.message}` };
    }

    console.log("ACTION: Successfully updated event resources.");
    revalidatePath(`/dashboard/event/${eventId}/resources`);
    return { success: true, path: srsPath };

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "An unexpected server error occurred.";
    console.error("CRITICAL_ACTION_ERROR in updateEventResources:", err);
    return { success: false, error: `A critical server error occurred: ${errorMessage}` };
    }
    }

    export async function getEventForParticipant() {
    const supabase = await createClient();
    const session = await getLabSession();

    if (!session?.teamId) {
    return { success: false, error: "Participant session not found." };
    }

    // 1. Get the team's event_id
    const { data: teamData, error: teamError } = await supabase
    .from("hf_teams")
    .select("event_id")
    .eq("id", session.teamId)
    .single();

    if (teamError || !teamData) {
    return { success: false, error: "Could not find the participant's team." };
    }

    // 2. Use the event_id to get the event resources
    const { data: eventData, error: eventError } = await supabase
    .from("hf_events")
    .select("name, problem_statement, srs_document_path")
    .eq("id", teamData.event_id)
    .single();

    if (eventError || !eventData) {
    return { success: false, error: "Could not retrieve event resources." };
    }

    return { success: true, data: eventData };
    }