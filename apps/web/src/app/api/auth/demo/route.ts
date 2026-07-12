import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  DEMO_COOKIE,
  DEMO_USER,
  encodeDemoSession,
} from "@/lib/auth/demo-session";

const THIRTY_DAYS = 60 * 60 * 24 * 30;

// Demo sign-in: sets the (unsigned, non-security-boundary) demo cookie so the
// signed-in experience is reachable without a backend. Replaced by real
// Supabase OTP/OAuth once configured — the /login page calls this only in
// demo mode.
export async function POST() {
  const store = await cookies();
  store.set(DEMO_COOKIE, encodeDemoSession(DEMO_USER), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: THIRTY_DAYS,
  });
  return NextResponse.json({ ok: true });
}
