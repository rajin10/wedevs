// Demo-session cookie name. Lives in its own Buffer-free module so the Edge
// middleware can import it without pulling in demo-session.ts's Node Buffer
// usage (Edge runtime has no Buffer). See demo-session.ts for the full note.
export const DEMO_COOKIE = "wedevs_demo_session";
