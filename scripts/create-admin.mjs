// Creates (or updates) a SettleSide admin user in Supabase Auth.
//
// Usage: node scripts/create-admin.mjs <email> <password>
//
// Reads SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from .env in the repo
// root. The user is created with app_metadata.role = "admin", which the
// server requires for /api/admin/* access.

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const [email, password] = process.argv.slice(2);

if (!email || !password) {
  console.error("Usage: node scripts/create-admin.mjs <email> <password>");
  process.exit(1);
}

if (password.length < 8) {
  console.error("Choose a password of at least 8 characters.");
  process.exit(1);
}

function readEnv() {
  const raw = readFileSync(new URL("../.env", import.meta.url), "utf8");
  return Object.fromEntries(
    raw
      .split(/\r?\n/)
      .filter((line) => line.includes("=") && !line.trim().startsWith("#"))
      .map((line) => [
        line.slice(0, line.indexOf("=")).trim(),
        line.slice(line.indexOf("=") + 1).trim(),
      ]),
  );
}

const env = readEnv();

if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env first.");
  process.exit(1);
}

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const { data, error } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  app_metadata: { role: "admin" },
});

if (error) {
  if (error.code === "email_exists") {
    // Update the existing user's password and role instead.
    const { data: list, error: listError } = await supabase.auth.admin.listUsers();
    const existing = list?.users?.find((user) => user.email?.toLowerCase() === email.toLowerCase());

    if (listError || !existing) {
      console.error("User exists but could not be loaded:", listError?.message);
      process.exit(1);
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(existing.id, {
      password,
      app_metadata: { role: "admin" },
    });

    if (updateError) {
      console.error("Failed to update existing user:", updateError.message);
      process.exit(1);
    }

    console.log(`Updated existing admin: ${email}`);
    process.exit(0);
  }

  console.error("Failed to create admin:", error.message);
  process.exit(1);
}

console.log(`Created admin: ${data.user.email} (${data.user.id})`);
