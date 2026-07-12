import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import {
  DEMO_COOKIE,
  DEMO_USER,
  encodeDemoSession,
  demoCookieOptions,
} from "@/lib/auth/demo-session";
import { isSupabaseConfigured } from "@/lib/auth/config";

// Only allow same-origin, relative redirects — prevents an open redirect via
// ?next= (e.g. ?next=https://evil or ?next=//evil would otherwise send the
// browser off-site because `new URL(absolute, base)` ignores the base).
function safeNext(raw: string | null, origin: string): string {
  if (
    !raw ||
    !raw.startsWith("/") ||
    raw.startsWith("//") ||
    raw.startsWith("/\\")
  ) {
    return "/app";
  }
  try {
    const u = new URL(raw, origin);
    if (u.origin !== origin) return "/app";
    return u.pathname + u.search + u.hash;
  } catch {
    return "/app";
  }
}

// OAuth / OTP return leg. Supabase mode: exchange the `?code` for a session,
// then redirect. Demo mode: no real provider, so set the demo cookie and
// continue — keeps the flow whole.
export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl;
  const next = safeNext(searchParams.get("next"), origin);

  if (isSupabaseConfigured()) {
    const code = searchParams.get("code");
    if (!code) {
      // Provider reported failure (?error=...) instead of returning a code.
      return NextResponse.redirect(new URL("/login?error=auth", origin));
    }
    const { createSupabaseServerClient } =
      await import("@/lib/auth/supabase/server");
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(new URL("/login?error=auth", origin));
    }
    return NextResponse.redirect(new URL(next, origin));
  }

  const store = await cookies();
  store.set(DEMO_COOKIE, encodeDemoSession(DEMO_USER), demoCookieOptions);
  return NextResponse.redirect(new URL(next, origin));
}
