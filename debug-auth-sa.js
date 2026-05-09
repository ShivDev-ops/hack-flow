const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

async function debugAuth(id, pass) {
  console.log(`\n--- DEBUGGING AUTH FOR ${id} ---`);
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const { data: organizer, error } = await supabase
    .from("hf_organizer_credentials")
    .select("*")
    .ilike("access_id", id) 
    .maybeSingle();

  if (error) {
    console.error("DB_ERROR:", error.message);
    return;
  }

  if (!organizer) {
    console.error("USER_NOT_FOUND");
    return;
  }

  console.log("USER_FOUND:", { id: organizer.id, role: organizer.role, active: organizer.is_active });

  const isValid = await bcrypt.compare(pass, organizer.password_hash);
  console.log("BCRYPT_RESULT:", isValid);
}

debugAuth("SUPER_ADMIN", "SA_RECOVERY_2026");
