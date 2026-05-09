"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";

/**
 * Helper to verify if the requester is a SUPER_ADMIN
 */
async function verifySuperAdmin() {
  const session = await getServerSession(authOptions);
  if (session?.role !== "SUPER_ADMIN") {
    throw new Error("UNAUTHORIZED: Super Admin access required.");
  }
}

/**
 * Email Transporter Configuration
 */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendCredentialsEmail(email: string, accessId: string, rawPass: string) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.warn("[MAIL_WARN] SMTP not configured. Skipping email dispatch.");
    return false;
  }

  const mailOptions = {
    from: `"Hack-Flow System" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "HACK-FLOW: Organizer Mission Credentials",
    html: `
      <div style="font-family: monospace; background-color: #0a0a0b; color: #e5e2e3; padding: 40px; border-radius: 12px; border: 1px solid #424754;">
        <h2 style="color: #a855f7; text-transform: uppercase; letter-spacing: 2px;">Registry Uplink Established</h2>
        <p style="font-size: 12px; color: #a1a1aa; text-transform: uppercase; margin-bottom: 24px;">Organizer Mission Credentials</p>
        
        <div style="background-color: rgba(255,255,255,0.05); padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <label style="font-size: 10px; color: #a855f7; text-transform: uppercase;">Access Identifier</label>
          <div style="font-size: 20px; font-weight: bold; margin-top: 4px;">${accessId}</div>
        </div>

        <div style="background-color: rgba(255,255,255,0.05); padding: 20px; border-radius: 8px; margin-bottom: 24px;">
          <label style="font-size: 10px; color: #a855f7; text-transform: uppercase;">Authorization Key</label>
          <div style="font-size: 20px; font-weight: bold; margin-top: 4px;">${rawPass}</div>
        </div>

        <p style="font-size: 11px; color: #ef4444; text-transform: uppercase; font-weight: bold;">
          CRITICAL: Secure these credentials immediately. They provide full access to your mission node.
        </p>
        
        <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 32px 0;" />
        <p style="font-size: 10px; color: #52525b;">© 2026 Hack-Flow Global Control</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (err) {
    console.error("[MAIL_ERROR]:", err);
    return false;
  }
}

export async function getFleetTelemetry() {
  try {
    await verifySuperAdmin();
    const supabase = await createAdminClient();
    
    const { data: tenants, error: tenantsError } = await supabase
      .from("hf_organizer_credentials")
      .select("*, event:hf_events(id, name, is_active)")
      .order("created_at", { ascending: false });

    if (tenantsError) throw tenantsError;

    const { count: participantCount, error: partError } = await supabase
      .from("hf_participants")
      .select("id", { count: 'exact', head: true });

    if (partError) throw partError;

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

    const { data: logs, error: logsError } = await supabase
      .from("hf_api_telemetry")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    if (logsError) throw logsError;

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

export async function generateOrganizerCredentialsAction(recipientEmail?: string) {
  try {
    await verifySuperAdmin();
    const supabase = await createAdminClient();

    const accessId = `HACK-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const rawPass = Math.random().toString(36).substring(2, 10);
    const hashedPass = await bcrypt.hash(rawPass, 10);

    const { error } = await supabase.from("hf_organizer_credentials").insert({
      access_id: accessId,
      password_hash: hashedPass,
      role: 'ORGANIZER',
      is_active: true
    });

    if (error) throw error;

    let emailSent = false;
    if (recipientEmail) {
      emailSent = await sendCredentialsEmail(recipientEmail, accessId, rawPass);
    }

    return { success: true, accessId, rawPass, emailSent };

  } catch (error: any) {
    console.error("[GEN_CREDS_ERROR]:", error.message);
    return { success: false, error: error.message };
  }
}

export async function resetOrganizerPasswordAction(id: string, accessId: string, recipientEmail?: string) {
  try {
    await verifySuperAdmin();
    const supabase = await createAdminClient();

    const rawPass = Math.random().toString(36).substring(2, 10);
    const hashedPass = await bcrypt.hash(rawPass, 10);
    
    const { error } = await supabase
        .from("hf_organizer_credentials")
        .update({ password_hash: hashedPass })
        .eq("id", id);
    
    if (error) throw error;

    let emailSent = false;
    if (recipientEmail) {
      emailSent = await sendCredentialsEmail(recipientEmail, accessId, rawPass);
    }

    return { success: true, rawPass, emailSent };

  } catch (error: any) {
    console.error("[RESET_PASS_ERROR]:", error.message);
    return { success: false, error: error.message };
  }
}

export async function toggleTenantStatusAction(id: string, currentStatus: boolean) {
  try {
    await verifySuperAdmin();
    const supabase = await createAdminClient();

    const { error } = await supabase
      .from("hf_organizer_credentials")
      .update({ is_active: !currentStatus })
      .eq("id", id);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteTenantAction(id: string) {
  try {
    await verifySuperAdmin();
    const supabase = await createAdminClient();

    const { error } = await supabase
      .from("hf_organizer_credentials")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error("[DELETE_TENANT_ERROR]:", error.message);
    return { success: false, error: error.message };
  }
}
