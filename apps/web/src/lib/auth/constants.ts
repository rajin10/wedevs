// Demo-session cookie name. Lives in its own Buffer-free module so the Edge
// middleware can import it without pulling in demo-session.ts's Node Buffer
// usage (Edge runtime has no Buffer). See demo-session.ts for the full note.
export const DEMO_COOKIE = "wedevs_demo_session";

// Edge-safe (Buffer-free) structural check of the demo cookie, mirroring
// decodeDemoSession's id+email validation so the middleware (which cannot use
// Node's Buffer on the Edge runtime) agrees with the server-side getUser()
// decode. Without this, a present-but-undecodable cookie makes middleware and
// the layout's requireUser() disagree and loop /app<->/login. Uses atob (a Web
// API available on Edge), converting base64url -> base64 (+ padding) first.
export function demoCookieLooksValid(value: string | undefined): boolean {
  if (!value) return false;
  try {
    const b64 = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const u = JSON.parse(atob(padded)) as { id?: unknown; email?: unknown };
    return typeof u.id === "string" && typeof u.email === "string";
  } catch {
    return false;
  }
}
