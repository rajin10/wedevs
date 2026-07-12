"use client";
import { createContext, useContext, type ReactNode } from "react";
import type { SessionUser } from "@/lib/auth/types";

// Server layout fetches the user (getUser) and hands it to the client tree
// through this provider so the account chip renders the right identity on
// first paint (no flash), in both demo and Supabase modes.
const SessionContext = createContext<SessionUser | null>(null);

export function SessionProvider({
  user,
  children,
}: {
  user: SessionUser | null;
  children: ReactNode;
}) {
  return (
    <SessionContext.Provider value={user}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionUser | null {
  return useContext(SessionContext);
}
