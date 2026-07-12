import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/env";
import { isSupabaseConfigured } from "../config";
import type { SessionUser } from "../types";

// Cookie-bound server client. Only call when isSupabaseConfigured() is true;
// the non-null assertions on the env vars are safe under that guard.
export async function createSupabaseServerClient(): Promise<SupabaseClient> {
  const store = await cookies();
  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL!,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => store.getAll(),
        setAll: (toSet) => {
          try {
            toSet.forEach(({ name, value, options }) =>
              store.set(name, value, options),
            );
          } catch {
            // called from a Server Component render — safe to ignore; the
            // middleware refresh path is what actually persists cookies.
          }
        },
      },
    },
  );
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

// Maps the verified Supabase user onto SessionUser. Returns null (never throws)
// when Supabase isn't configured or there is no active session.
export async function getSupabaseUser(): Promise<SessionUser | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  const u = data.user;
  const meta = (u.user_metadata ?? {}) as Record<string, unknown>;
  const name =
    (typeof meta.full_name === "string" && meta.full_name) ||
    (typeof meta.name === "string" && meta.name) ||
    (u.email ? u.email.split("@")[0]! : "User");
  return {
    id: u.id,
    email: u.email ?? "",
    name,
    initials: initialsOf(name),
    avatarUrl: typeof meta.avatar_url === "string" ? meta.avatar_url : null,
    plan: "free",
  };
}
