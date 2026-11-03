import bcrypt from "bcryptjs";
import { createAdminClient } from "@/lib/supabase/admin";

export interface CredentialInput {
  accessId?: string | null;
  password?: string | null;
}

export interface AuthContext {
  supabase?: any;
  clientIp?: string;
  rateLimitStore?: Map<string, { count: number; firstAttempt: number }>;
}

export interface AuthResult {
  success: boolean;
  user?: {
    id: string;
    name: string;
    role: 'ORGANIZER' | 'SUPER_ADMIN' | 'AUTHENTICATED';
    eventId?: string;
    azure_ad_id?: string | null;
  };
  error?: 'RATE_LIMIT_EXCEEDED' | 'MISSING_CREDENTIALS' | 'DB_ERROR' | 'USER_NOT_FOUND' | 'ACCOUNT_SUSPENDED' | 'INVALID_PASSWORD';
  details?: string;
}

/**
 * Core credential authentication routine used by NextAuth CredentialsProvider.
 * Verifies access credentials, normalizes super admin identifiers (SUPER_ADMIN vs SUPER-ADMIN),
 * prevents suspended accounts from logging in (unless SUPER_ADMIN), and safely validates bcrypt hashes.
 */
export async function verifyCredentials(
  credentials: CredentialInput | undefined,
  context: AuthContext = {}
): Promise<AuthResult> {
  const ip = context.clientIp || 'unknown';

  // Rate limiting per IP (max 20 attempts per minute)
  const store = context.rateLimitStore || (
    ((globalThis as any).__rateLimitStore = (globalThis as any).__rateLimitStore || new Map())
  );
  const now = Date.now();
  const entry = store.get(ip) || { count: 0, firstAttempt: now };
  if (now - entry.firstAttempt > 60_000) {
    entry.count = 0;
    entry.firstAttempt = now;
  }
  entry.count += 1;
  store.set(ip, entry);
  if (entry.count > 20) {
    console.warn(`[AUTH_SECURITY] Rate limit exceeded for IP ${ip}`);
    return { success: false, error: 'RATE_LIMIT_EXCEEDED', details: `Rate limit exceeded for IP ${ip}` };
  }

  if (!credentials?.accessId || !credentials?.password) {
    return { success: false, error: 'MISSING_CREDENTIALS', details: 'Missing accessId or password' };
  }

  // Trim whitespace to prevent copy-paste issues
  const cleanAccessId = credentials.accessId.trim();
  const cleanPassword = credentials.password.trim();

  if (!cleanAccessId || !cleanPassword) {
    return { success: false, error: 'MISSING_CREDENTIALS', details: 'Empty accessId or password' };
  }

  let supabase = context.supabase;
  if (!supabase) {
    try {
      supabase = await createAdminClient();
    } catch (err: any) {
      console.error("[AUTH_DEBUG] Failed to create admin Supabase client:", err.message || err);
      return { success: false, error: 'DB_ERROR', details: err.message || String(err) };
    }
  }

  // Flexible matching for Super Admin identifiers (supports either SUPER_ADMIN or SUPER-ADMIN)
  const isSuperAdminAttempt = cleanAccessId.toUpperCase() === "SUPER_ADMIN" || cleanAccessId.toUpperCase() === "SUPER-ADMIN";

  let organizerQuery = supabase
    .from("hf_organizer_credentials")
    .select("*");

  if (isSuperAdminAttempt) {
    organizerQuery = organizerQuery.or("access_id.ilike.SUPER_ADMIN,access_id.ilike.SUPER-ADMIN");
  } else {
    organizerQuery = organizerQuery.ilike("access_id", cleanAccessId);
  }

  const { data: organizer, error } = await organizerQuery.maybeSingle();

  if (error) {
    console.error("[AUTH_DEBUG] Database connection or query error during login:", error.message || error);
    return { success: false, error: 'DB_ERROR', details: error.message || String(error) };
  }

  if (!organizer) {
    console.warn("[AUTH_DEBUG] User not found:", cleanAccessId);
    return { success: false, error: 'USER_NOT_FOUND', details: `No account found matching: ${cleanAccessId}` };
  }

  // Suspended account check (SUPER_ADMIN is exempt from suspension)
  if (!organizer.is_active && organizer.role !== "SUPER_ADMIN") {
    console.warn("[AUTH_DEBUG] Account suspended:", cleanAccessId);
    return { success: false, error: 'ACCOUNT_SUSPENDED', details: `Account ${cleanAccessId} is suspended` };
  }

  const isValid = await bcrypt.compare(cleanPassword, organizer.password_hash);
  if (!isValid) {
    console.warn("[AUTH_DEBUG] Invalid password for:", cleanAccessId);
    return { success: false, error: 'INVALID_PASSWORD', details: 'Password mismatch' };
  }

  console.log("[AUTH_DEBUG] Login successful:", organizer.access_id, "ID:", organizer.id);

  return {
    success: true,
    user: {
      id: organizer.id,
      name: organizer.access_id,
      role: organizer.role as any,
      eventId: organizer.event_id || undefined,
      azure_ad_id: organizer.azure_ad_id,
    }
  };
}
