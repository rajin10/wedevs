import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  DEMO_COOKIE,
  DEMO_USER,
  encodeDemoSession,
  demoCookieOptions,
} from "@/lib/auth/demo-session";

// Demo sign-in: sets the (unsigned, non-security-boundary) demo cookie so the
// signed-in experience is reachable without a backend. Replaced by real
// Supabase OTP/OAuth once configured — the /login page calls this only in
// demo mode.
export async function POST() {
  const store = await cookies();
  store.set(DEMO_COOKIE, encodeDemoSession(DEMO_USER), demoCookieOptions);
  return NextResponse.json({ ok: true });
}
