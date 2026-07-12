"use client";
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/env";

// Browser client for client-component OAuth/OTP calls. Only construct behind
// an isSupabaseConfigured() check (the env vars are non-null there).
export function createSupabaseBrowserClient(): SupabaseClient {
  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL!,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
