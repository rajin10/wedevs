import type { SessionUser } from "./types";
import { DEMO_COOKIE } from "./constants";

// ── DEMO SESSION ──
// Used ONLY when Supabase isn't configured. This cookie is an UNSIGNED
// base64url JSON blob and is NOT a security boundary — there is no private
// user data in the app yet, so it exists purely to make the signed-in
// experience (protected /app, account chip, sign-out) reviewable end-to-end
// without a backend. The REAL gate is Supabase's signed session cookie, used
// automatically once NEXT_PUBLIC_SUPABASE_URL + _ANON_KEY are present
// (see lib/auth/config.ts + lib/auth/supabase/*). Do not add fake crypto here.
export { DEMO_COOKIE };

export const DEMO_USER: SessionUser = {
  id: "demo-user",
  email: "you@wedevs.app",
  name: "Demo User",
  initials: "DU",
  avatarUrl: null,
  plan: "free",
};

export function encodeDemoSession(user: SessionUser): string {
  return Buffer.from(JSON.stringify(user), "utf8").toString("base64url");
}

export function decodeDemoSession(raw: string | undefined): SessionUser | null {
  if (!raw) return null;
  try {
    const u = JSON.parse(
      Buffer.from(raw, "base64url").toString("utf8"),
    ) as Partial<SessionUser>;
    if (typeof u.id !== "string" || typeof u.email !== "string") return null;
    return {
      id: u.id,
      email: u.email,
      name: typeof u.name === "string" ? u.name : u.email,
      initials: typeof u.initials === "string" ? u.initials : "?",
      avatarUrl: typeof u.avatarUrl === "string" ? u.avatarUrl : null,
      plan: typeof u.plan === "string" ? u.plan : "free",
    };
  } catch {
    return null;
  }
}
