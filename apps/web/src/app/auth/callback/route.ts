import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import {
  DEMO_COOKIE,
  DEMO_USER,
  encodeDemoSession,
  demoCookieOptions,
} from "@/lib/auth/demo-session";
import { isSupabaseConfigured } from "@/lib/auth/config";

// Resolve ?next= to a SAME-ORIGIN URL object. Returns a URL (never a string)
// so callers pass it straight to NextResponse.redirect() with NO second
// `new URL(next, origin)` parse — that re-parse was itself the bypass: a
// value like "/.//evil" normalizes to pathname "//evil", which a second parse
// treats as protocol-relative and sends off-site. We also reject any resolved
// pathname that begins with "//" as defense-in-depth. Falls back to /app.
function safeNextUrl(raw: string | null, origin: string): URL {
  const fallback = new URL("/app", origin);
  if (
    !raw ||
    !raw.startsWith("/") ||
    raw.startsWith("//") ||
    raw.startsWith("/\\")
  ) {
    return fallback;
  }
  try {
    const u = new URL(raw, origin);
    if (u.origin !== origin) return fallback;
    if (u.pathname.startsWith("//")) return fallback; // dot-segment → network-path ref
    return u;
  } catch {
    return fallback;
  }
}

// OAuth / OTP return leg. Supabase mode: exchange the `?code` for a session,
// then redirect. Demo mode: no real provider, so set the demo cookie and
// continue — keeps the flow whole.
export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl;
  const nextUrl = safeNextUrl(searchParams.get("next"), origin);

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
    return NextResponse.redirect(nextUrl);
  }

  const store = await cookies();
  store.set(DEMO_COOKIE, encodeDemoSession(DEMO_USER), demoCookieOptions);
  return NextResponse.redirect(nextUrl);
}
