import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/auth/config";
import { DEMO_COOKIE } from "@/lib/auth/constants"; // Buffer-free — Edge-safe
import { authRedirect } from "@/lib/auth/redirect";

// Edge middleware — must not import Node Buffer/crypto. It only needs to know
// whether a session EXISTS, then apply the pure authRedirect decision.
// Demo mode: presence of the demo cookie. Supabase mode: refresh + getUser.
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isSupabaseConfigured()) {
    try {
      const { updateSupabaseSession } =
        await import("@/lib/auth/supabase/middleware");
      const { res, hasSession } = await updateSupabaseSession(req);
      const to = authRedirect({ pathname, hasSession });
      if (to) return NextResponse.redirect(new URL(to, req.url));
      return res; // carries refreshed auth cookies
    } catch (error) {
      // A transient Supabase outage / malformed cookie must not 500 every
      // gated request or trap the user in a redirect loop. Degrade to
      // "let the request through" — requireUser() remains the authoritative
      // server-side gate.
      console.error("middleware: updateSupabaseSession failed", error);
      return NextResponse.next();
    }
  }

  const hasSession = req.cookies.has(DEMO_COOKIE);
  const to = authRedirect({ pathname, hasSession });
  if (to) return NextResponse.redirect(new URL(to, req.url));
  return NextResponse.next();
}

export const config = {
  // Gate the app shell and the login page (for the signed-in → /app bounce).
  matcher: ["/app/:path*", "/login"],
};
