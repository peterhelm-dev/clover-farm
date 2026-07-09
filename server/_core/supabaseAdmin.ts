import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { ENV } from "./env";

let _admin: SupabaseClient | null = null;
let _auth: SupabaseClient | null = null;

/**
 * Service-role client: bypasses RLS. Use only in trusted server code
 * (storage uploads, admin operations) — never expose this key to the client.
 * Created lazily so importing this module doesn't crash when Supabase env
 * vars aren't set yet (e.g. in unit tests unrelated to storage/auth).
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (!_admin) {
    if (!ENV.supabaseUrl) throw new Error("SUPABASE_URL is not configured");
    _admin = createClient(
      ENV.supabaseUrl,
      ENV.supabaseServiceRoleKey || ENV.supabaseAnonKey,
      { auth: { persistSession: false } }
    );
  }
  return _admin;
}

/** Anon-key client, used only to validate user-issued JWTs via auth.getUser(). */
export function getSupabaseAuthClient(): SupabaseClient {
  if (!_auth) {
    if (!ENV.supabaseUrl) throw new Error("SUPABASE_URL is not configured");
    _auth = createClient(ENV.supabaseUrl, ENV.supabaseAnonKey, {
      auth: { persistSession: false },
    });
  }
  return _auth;
}
