// Single source of truth for the app-facing authenticated user. Both the demo
// path and the Supabase path map into this shape; the shell maps it onto the
// @wedevs/ui `Account` type at the render boundary.
export interface SessionUser {
  id: string;
  email: string;
  name: string;
  initials: string;
  avatarUrl: string | null;
  plan: string; // 'free' | 'pro' | ...
}
