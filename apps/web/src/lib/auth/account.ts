import type { SessionUser } from "./types";
import type { Account } from "@wedevs/ui";

// Maps the app-level SessionUser onto the @wedevs/ui Account shape the LeftRail
// chip consumes. Falls back to a neutral placeholder when signed out (the
// account chip is only rendered inside the gated /app, so this is defensive).
export function sessionToAccount(user: SessionUser | null): Account {
  if (!user) {
    return { name: "Guest", email: "", plan: "free", initials: "G" };
  }
  const plan = user.plan.charAt(0).toUpperCase() + user.plan.slice(1);
  return { name: user.name, email: user.email, plan, initials: user.initials };
}
