import type { ReactNode } from "react";
import { requireUser } from "@/lib/auth/server";
import { SessionProvider } from "@/components/session-provider";

// Server layout for the gated workspace. This is the AUTHORITATIVE server-side
// gate: requireUser() redirects to /login when there is no session, so /app is
// protected even if the edge middleware fails open (e.g. a transient Supabase
// error makes middleware fall through). It also gives the client shell the
// right account identity on first paint (no flash). Using requireUser (not
// getUser) here is deliberate defense-in-depth — middleware is the fast first
// gate, this is the real one. Makes /app dynamic, correct for an authed surface.
export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  return <SessionProvider user={user}>{children}</SessionProvider>;
}
