import { env } from "@/env";

// The single seam that decides demo-vs-real auth. Real Supabase auth activates
// only when BOTH the URL and the anon key are present. Everything else in the
// auth layer branches on this — never on env vars directly.
export function isSupabaseConfigured(): boolean {
  return Boolean(
    env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
