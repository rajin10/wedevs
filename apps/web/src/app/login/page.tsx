"use client";

// Public sign-in page — the middle leg of the flow: landing (`/`) -> login
// (`/login`) -> workspace (`/app`). It works in TWO modes off one seam
// (isSupabaseConfigured):
//   • Demo mode (no Supabase env): every action establishes a demo session by
//     POSTing /api/auth/demo, then routes to /app — the flow is reviewable
//     end-to-end with no backend and no dead ends.
//   • Supabase mode: email → signInWithOtp (magic link); Google/GitHub →
//     signInWithOAuth (provider redirect, returns via /auth/callback).

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Input, LiveDot } from "@wedevs/ui";
import { Github } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/auth/config";

// Simple inline, brand-neutral glyph (no lucide equivalent for Google).
// Monochrome via `currentColor` — no hardcoded hex, inherits the outline
// button's text color/tokens in both themes.
function GoogleGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      aria-hidden="true"
      className="shrink-0"
    >
      <path
        fill="currentColor"
        d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.2s2.7-6.2 6-6.2c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3 14.7 2 12 2 6.9 2 2.8 6.1 2.8 11.2S6.9 20.4 12 20.4c6.9 0 9.5-4.8 9.5-7.3 0-.5 0-.9-.1-1.2H12Z"
      />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  async function establishDemoSession() {
    await fetch("/api/auth/demo", { method: "POST" });
    router.push("/app");
  }

  async function handleEmailSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isSupabaseConfigured()) {
      const { createSupabaseBrowserClient } =
        await import("@/lib/auth/supabase/client");
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      setSent(true);
      return;
    }
    await establishDemoSession();
  }

  async function handleOAuth(provider: "google" | "github") {
    if (isSupabaseConfigured()) {
      const { createSupabaseBrowserClient } =
        await import("@/lib/auth/supabase/client");
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      return; // provider performs its own redirect
    }
    await establishDemoSession();
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-[var(--bg)] px-5 py-12">
      <Link
        href="/"
        className="inline-flex items-center gap-2.5 rounded-[var(--radius-xs)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-line)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
      >
        <span
          aria-hidden="true"
          className="grid h-7 w-7 flex-none place-items-center rounded-[var(--radius-xs)] border border-[var(--border)] bg-[var(--primary)] font-[var(--font-display)] text-xs font-extrabold text-[var(--primary-text)]"
        >
          W
        </span>
        <span className="flex items-center whitespace-nowrap font-[var(--font-display)] text-[15px] font-bold tracking-[-0.01em] text-[var(--text)]">
          Wedevs
          <LiveDot className="ml-[6px]" />
        </span>
      </Link>

      <div className="w-full max-w-[420px] rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-7 shadow-[var(--shadow)] sm:p-8">
        <div className="mb-5 inline-flex items-center gap-[9px] text-[11px] font-bold uppercase tracking-[.18em] text-[var(--text-3)]">
          <span
            aria-hidden="true"
            className="h-0.5 w-5 rounded-sm bg-[var(--accent)]"
          />
          Welcome back
        </div>

        <h1 className="mb-1.5 font-[var(--font-display)] text-[26px] font-bold tracking-[-0.01em] text-[var(--text)]">
          Sign in to Wedevs
        </h1>
        <p className="mb-6 text-[14px] leading-relaxed text-[var(--text-2)]">
          Pick up right where you left off — no account required for the demo.
        </p>

        {sent && (
          <p className="mb-4 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[13px] text-[var(--text-2)]">
            Check your email for a magic link to finish signing in.
          </p>
        )}

        <form onSubmit={handleEmailSubmit} className="flex flex-col gap-2">
          <label
            htmlFor="email"
            className="text-[13px] font-medium text-[var(--text-2)]"
          >
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button type="submit" variant="primary" className="mt-3 w-full">
            Continue with email
          </Button>
        </form>

        <div className="my-6 flex items-center gap-3 text-[11px] font-medium uppercase tracking-[.1em] text-[var(--text-3)]">
          <span className="h-px flex-1 bg-[var(--border)]" aria-hidden="true" />
          <span>or</span>
          <span className="h-px flex-1 bg-[var(--border)]" aria-hidden="true" />
        </div>

        <div className="flex flex-col gap-2.5">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => handleOAuth("google")}
          >
            <GoogleGlyph />
            Continue with Google
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => handleOAuth("github")}
          >
            <Github size={16} strokeWidth={1.75} aria-hidden="true" />
            Continue with GitHub
          </Button>
        </div>
        <p className="mt-3 text-center text-[12px] leading-snug text-[var(--text-3)]">
          Google/GitHub sign-in activates once Supabase is connected — for now
          it drops you straight into the demo.
        </p>

        <p className="mt-6 text-center text-[13px] text-[var(--text-2)]">
          <Link
            href="/app"
            className="font-medium text-[var(--text)] underline decoration-[var(--border-2)] underline-offset-4 hover:decoration-[var(--text-2)]"
          >
            Skip — explore the demo →
          </Link>
        </p>
      </div>

      <p className="max-w-[420px] px-2 text-center text-[12px] leading-relaxed text-[var(--text-3)]">
        By continuing, you agree to Wedevs&apos; Terms of Service and Privacy
        Policy.
      </p>
    </main>
  );
}
