import "@tanstack/react-start/server-only";

import { createClient } from "@supabase/supabase-js";

import { getSupabaseAdminClient, isSupabaseConfigured } from "./settleside.storage";

// signInWithPassword mutates the client's in-memory auth state, which would
// make the shared service-role client run subsequent queries as the signed-in
// user (and hit RLS). Logins therefore use a throwaway client.
function freshAuthClient() {
  return createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export type AdminSession = {
  accessToken: string;
  expiresAt: number;
  email: string;
};

function bearerToken(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  return header.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";
}

async function verifySupabaseAdmin(token: string) {
  try {
    const { data, error } = await getSupabaseAdminClient().auth.getUser(token);

    if (error || !data.user) return null;
    if (data.user.app_metadata?.role !== "admin") return null;

    return data.user;
  } catch (error) {
    console.error("SettleSide admin token verification failed:", error);
    return null;
  }
}

export async function adminSignIn(email: string, password: string): Promise<AdminSession | null> {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await freshAuthClient().auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session || !data.user) return null;
  if (data.user.app_metadata?.role !== "admin") return null;

  return {
    accessToken: data.session.access_token,
    expiresAt: (data.session.expires_at ?? 0) * 1000,
    email: data.user.email ?? email,
  };
}

export async function isAdminAuthorized(request: Request): Promise<boolean> {
  const token = bearerToken(request);
  const staticToken = process.env.SETTLESIDE_ADMIN_TOKEN;

  // Break-glass / scripting token.
  if (staticToken && token === staticToken) return true;

  // Supabase Auth session token carrying the admin role.
  if (isSupabaseConfigured() && token) {
    const user = await verifySupabaseAdmin(token);
    if (user) return true;
  }

  // Zero-config development convenience only: no auth mechanism configured at
  // all and not in production. (The previous localhost check trusted the Host
  // header, which is forgeable, so production never bypasses.)
  if (!staticToken && !isSupabaseConfigured() && process.env.NODE_ENV !== "production") {
    return true;
  }

  return false;
}
