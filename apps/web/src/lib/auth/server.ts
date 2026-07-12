import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { SessionUser } from "./types";
import { isSupabaseConfigured } from "./config";
import { DEMO_COOKIE, decodeDemoSession } from "./demo-session";

// The provider switch. When Supabase is configured, read the verified user via
// the SSR client (imported lazily so the package stays out of the demo bundle);
// otherwise read the demo cookie. Returns null when signed out — never throws.
export async function getUser(): Promise<SessionUser | null> {
  if (isSupabaseConfigured()) {
    const { getSupabaseUser } = await import("./supabase/server");
    return getSupabaseUser();
  }
  const store = await cookies();
  return decodeDemoSession(store.get(DEMO_COOKIE)?.value);
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}
