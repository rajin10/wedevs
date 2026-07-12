import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { DEMO_COOKIE } from "@/lib/auth/demo-session";
import { isSupabaseConfigured } from "@/lib/auth/config";

// Clears the session in whichever mode is active. Demo: drop the demo cookie.
// Supabase: sign out (which clears its auth cookies via the SSR client).
export async function POST() {
  const store = await cookies();
  store.delete(DEMO_COOKIE);
  if (isSupabaseConfigured()) {
    const { createSupabaseServerClient } =
      await import("@/lib/auth/supabase/server");
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }
  return NextResponse.json({ ok: true });
}
