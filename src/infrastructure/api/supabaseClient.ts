import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Single point of contact with Supabase. Nothing outside `infrastructure/`
 * should import `@supabase/supabase-js` directly (see docs/ARCHITECTURE.md).
 *
 * SECURITY: only the anon/public key belongs here. The service-role key must
 * NEVER be used in frontend/desktop code — it lives only in Edge Functions /
 * server-side contexts (see docs/SECURITY.md).
 */
let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!client) {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
      throw new Error(
        "Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Set them in a .env file (see .env.example)."
      );
    }

    client = createClient(url, anonKey);
  }
  return client;
}
