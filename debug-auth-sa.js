const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const dns = require('dns');
require('dotenv').config({ path: '.env.local' });

async function checkDns(hostname) {
  return new Promise((resolve) => {
    dns.lookup(hostname, (err, address) => {
      if (err) resolve({ ok: false, error: err.code || err.message });
      else resolve({ ok: true, address });
    });
  });
}

async function run() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log("==========================================");
  console.log(" HACK-FLOW SUPER ADMIN AUTH DIAGNOSTIC");
  console.log("==========================================");
  console.log("Supabase URL:", supabaseUrl);

  if (!supabaseUrl || !serviceKey) {
    console.error("ERROR: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
    return;
  }

  // 1. DNS & Connectivity Pre-flight
  try {
    const urlObj = new URL(supabaseUrl);
    const dnsResult = await checkDns(urlObj.hostname);
    if (!dnsResult.ok) {
      console.error("\n❌ CONNECTION FAILURE: Host cannot be resolved (" + dnsResult.error + ")");
      console.error("------------------------------------------------------------------");
      console.error("WHY THIS HAPPENS:");
      console.error("1. Free-tier Supabase projects are automatically PAUSED after 7 days of inactivity.");
      console.error("2. When paused, Supabase removes the DNS records (" + urlObj.hostname + ").");
      console.error("3. HOW TO FIX: Go to your Supabase Dashboard (https://supabase.com/dashboard)");
      console.error("   and click 'Restore Project' for project: " + urlObj.hostname.split('.')[0]);
      console.error("------------------------------------------------------------------\n");
      return;
    }
    console.log("✓ DNS resolution successful (" + dnsResult.address + ")");
  } catch (e) {
    console.warn("Could not parse Supabase URL:", e.message);
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  // Parse CLI args
  const command = process.argv[2];
  const arg1 = process.argv[3];
  const arg2 = process.argv[4];

  // 2. Setting or Resetting password
  if (command === "set" || command === "reset") {
    const newPassword = arg1 || "SA_RECOVERY_2026";
    const targetId = arg2 || "SUPER_ADMIN";
    console.log(`\nSetting password for [${targetId}] to: "${newPassword}"...`);
    const hashed = await bcrypt.hash(newPassword, 10);

    const { data: existing } = await supabase
      .from("hf_organizer_credentials")
      .select("id, access_id, role")
      .or("access_id.ilike.SUPER_ADMIN,access_id.ilike.SUPER-ADMIN")
      .maybeSingle();

    if (existing) {
      const { error: updateError } = await supabase
        .from("hf_organizer_credentials")
        .update({
          access_id: targetId,
          password_hash: hashed,
          role: "SUPER_ADMIN",
          is_active: true
        })
        .eq("id", existing.id);

      if (updateError) {
        console.error("Update failed:", updateError.message);
      } else {
        console.log(`✓ Super admin record updated successfully (ID: ${existing.id}).`);
      }
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from("hf_organizer_credentials")
        .insert({
          access_id: targetId,
          password_hash: hashed,
          role: "SUPER_ADMIN",
          is_active: true
        })
        .select()
        .single();

      if (insertError) {
        console.error("Insert failed:", insertError.message);
      } else {
        console.log(`✓ Created new super admin record with ID: ${inserted.id}`);
      }
    }
    return;
  }

  // 3. Testing auth
  const testId = command || "SUPER_ADMIN";
  const testPassword = arg1;

  console.log(`\nQuerying credentials for: [${testId}]...`);
  const { data: organizer, error } = await supabase
    .from("hf_organizer_credentials")
    .select("*")
    .or("access_id.ilike.SUPER_ADMIN,access_id.ilike.SUPER-ADMIN")
    .maybeSingle();

  if (error) {
    console.error("Database query error:", error.message);
    return;
  }

  if (!organizer) {
    console.error("❌ No Super Admin record found in hf_organizer_credentials!");
    console.log("Tip: Run 'node debug-auth-sa.js set <yourPassword>' to create one.");
    return;
  }

  console.log("✓ Record found:");
  console.log("  - ID:", organizer.id);
  console.log("  - Access ID in DB:", organizer.access_id);
  console.log("  - Role:", organizer.role);
  console.log("  - Is Active:", organizer.is_active);

  if (testPassword) {
    const matches = await bcrypt.compare(testPassword, organizer.password_hash);
    console.log(`\nPassword verification for "${testPassword}":`, matches ? "✅ VALID" : "❌ INVALID PASSWORD");
  } else {
    console.log("\nTo test password verification, run: node debug-auth-sa.js <accessId> <password>");
    console.log("To set or reset the password, run: node debug-auth-sa.js set <newPassword>");
  }
}

run().catch((e) => console.error("FATAL_ERROR:", e));
