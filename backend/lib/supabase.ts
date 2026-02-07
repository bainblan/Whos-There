import { createClient } from "@supabase/supabase-js";

export function getSupabaseForUser(accessToken: string) {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY in env");
  }
  if (!accessToken) {
    throw new Error("Missing user access token");
  }

  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}
