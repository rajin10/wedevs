# Supabase — going from demo auth to real auth

Wedevs auth is **credential-gated**. With no Supabase env vars set, the app runs
in **demo-session mode**: one-click sign-in, a demo account, protected `/app`,
and working sign-out — all real behavior, no backend. The moment the two public
env vars are present, the exact same UI switches to **real Supabase auth**
(Email magic-link + Google + GitHub) with zero code changes.

This is decided by one seam: [`apps/web/src/lib/auth/config.ts`](../apps/web/src/lib/auth/config.ts)
(`isSupabaseConfigured()` → true when `NEXT_PUBLIC_SUPABASE_URL` **and**
`NEXT_PUBLIC_SUPABASE_ANON_KEY` are both set).

## One-time setup (~5 minutes)

1. **Create a free project** at <https://supabase.com> → New project. Pick a
   region near the VPS. Wait for it to finish provisioning.
2. **Copy the keys** from Project Settings → API:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key (secret) → `SUPABASE_SERVICE_ROLE_KEY`
3. **Set them on the server.** On the VPS, add the three vars to
   `/opt/wedevs/.env` and redeploy (or `docker compose up -d`). For local dev,
   put them in `apps/web/.env.local` (see [`apps/web/.env.example`](../apps/web/.env.example)).
4. **Enable the providers** in Authentication → Providers: turn on **Email**
   (magic link), **Google**, and **GitHub**. For Google/GitHub, create an OAuth
   app in each provider's console and paste the client id/secret into Supabase.
5. **Set the redirect URLs** in Authentication → URL Configuration → Redirect
   URLs. Add:
   - `http://187.127.178.219/auth/callback` (current live IP)
   - `http://localhost:3000/auth/callback` (local dev)
   - the production hostname's `/auth/callback` once a domain is attached
   - `wedevs://auth/callback` later, for the desktop app (Phase 10)
6. **Apply the schema.** Run [`migrations/0001_profiles.sql`](./migrations/0001_profiles.sql)
   in the Supabase SQL editor (or `supabase db push` if using the CLI). It
   creates `public.profiles` with owner-only RLS and an on-signup trigger that
   inserts a profile row for every new user.

That's it — reload `/app` and sign-in now uses real Supabase. No rebuild of the
app code is required beyond picking up the new env vars.

## What each piece maps to in the code

| Setup step       | Code that consumes it                                                     |
| ---------------- | ------------------------------------------------------------------------- |
| URL + anon key   | `apps/web/src/lib/auth/supabase/{server,client,middleware}.ts`            |
| service role key | reserved for admin/trigger tasks (server-only)                            |
| Email magic link | `signInWithOtp` in `apps/web/src/app/login/page.tsx`                      |
| Google / GitHub  | `signInWithOAuth` → returns via `apps/web/src/app/auth/callback/route.ts` |
| profiles trigger | `migrations/0001_profiles.sql`                                            |
| session gate     | `middleware.ts` + `requireUser()` in `apps/web/src/app/app/layout.tsx`    |

## Security notes

- The **demo cookie is not a security boundary** — it's an unsigned marker used
  only when Supabase is absent, and there is no private data behind it yet. The
  real boundary is Supabase's signed session cookie, refreshed by the SSR
  middleware helper on every request.
- The `service_role` key is **secret** — server-only, never shipped to the
  client, never committed. Keep it in `/opt/wedevs/.env` / `.env.local` only.
