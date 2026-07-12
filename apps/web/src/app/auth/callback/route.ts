import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import {
  DEMO_COOKIE,
  DEMO_USER,
  encodeDemoSession,
} from "@/lib/auth/demo-session";
import { isSupabaseConfigured } from "@/lib/auth/config";

const THIRTY_DAYS = 60 * 60 * 24 * 30;

// OAuth / OTP return leg. Supabase mode: exchange the `?code` for a session,
// which persists auth cookies, then redirect. Demo mode: there is no real
// provider, so just set the demo cookie and continue — keeps the flow whole.
export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl;
  const next = searchParams.get("next") ?? "/app";

  if (isSupabaseConfigured()) {
    const code = searchParams.get("code");
    if (code) {
      const { createSupabaseServerClient } =
        await import("@/lib/auth/supabase/server");
      const supabase = await createSupabaseServerClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        return NextResponse.redirect(new URL("/login?error=auth", origin));
      }
    }
    return NextResponse.redirect(new URL(next, origin));
  }

  const store = await cookies();
  store.set(DEMO_COOKIE, encodeDemoSession(DEMO_USER), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: THIRTY_DAYS,
  });
  return NextResponse.redirect(new URL(next, origin));
}
