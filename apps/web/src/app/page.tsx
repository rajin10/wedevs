"use client";

// Marketing landing page — the public front door at `/`. The authed
// workspace lives at `/app` (see ./app/page.tsx) and is untouched by this
// file. Client boundary is required here (not just "nice to have"): LiveDot
// and Visor (imported below) call `useReducedMotion`, a hook, internally —
// same reason packages/ui/src/views/EmptyView.tsx (which also renders
// Visor) carries "use client". Hooks cannot run inside a Server Component's
// render pass, so any file rendering these two must cross the client
// boundary itself.
import Link from "next/link";
import { Button, LiveDot, Visor } from "@wedevs/ui";
import { Cpu, GitPullRequest, Blocks, MonitorSmartphone } from "lucide-react";

const FEATURES = [
  {
    icon: Cpu,
    title: "Multi-provider AI",
    body: "Claude is the default, plus OpenAI and local Ollama models — switch providers mid-conversation without losing context.",
  },
  {
    icon: GitPullRequest,
    title: "AI code workspace",
    body: "Proposes diffs and opens pull requests for review. Wedevs never runs code blindly — you approve every change before it ships.",
  },
  {
    icon: Blocks,
    title: "Plugins & marketplace",
    body: "Connect Linear, GitHub, and the tools your team already runs on — or build and publish your own plugin.",
  },
  {
    icon: MonitorSmartphone,
    title: "Web + desktop",
    body: "One workspace everywhere: a fast web app today, and a native desktop build powered by Tauri.",
  },
] as const;

export default function Home() {
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--bg)]">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between px-5 py-4 sm:px-8">
          <div className="flex items-center gap-2.5">
            <div
              aria-hidden="true"
              className="grid h-7 w-7 flex-none place-items-center rounded-[var(--radius-xs)] border border-[var(--border)] bg-[var(--primary)] font-[var(--font-display)] text-xs font-extrabold text-[var(--primary-text)]"
            >
              W
            </div>
            <span className="flex items-center whitespace-nowrap font-[var(--font-display)] text-[15px] font-bold tracking-[-0.01em] text-[var(--text)]">
              Wedevs
              <LiveDot className="ml-[6px]" />
            </span>
          </div>
          <Button asChild variant="primary">
            <Link href="/app">Open app</Link>
          </Button>
        </div>
      </header>

      <main>
        {/* ---- HERO ---- */}
        <section className="mx-auto max-w-[1100px] px-5 pb-16 pt-14 sm:px-8 sm:pb-24 sm:pt-20">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
            <div>
              <div className="mb-5 inline-flex items-center gap-[9px] text-[11px] font-bold uppercase tracking-[.18em] text-[var(--text-3)]">
                <span
                  data-live="eyebrow"
                  aria-hidden="true"
                  className="h-0.5 w-5 rounded-sm bg-[var(--accent)]"
                />
                AI chat + code workspace
              </div>

              <h1 className="mb-5 max-w-[560px] font-[var(--font-display)] text-[38px] font-bold leading-[1.1] tracking-[-0.02em] text-[var(--text)] sm:text-[48px] lg:text-[52px]">
                Chat, code, and ship — in one AI workspace.
              </h1>

              <p className="mb-8 max-w-[520px] text-[16px] leading-relaxed text-[var(--text-2)] sm:text-[17px]">
                Multi-provider AI — Claude, OpenAI, and local models — paired
                with an AI code workspace that proposes diffs and pull requests
                instead of running code blindly.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  asChild
                  variant="primary"
                  className="px-5 py-2.5 text-[15px]"
                >
                  <Link href="/app">Open the app</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="px-5 py-2.5 text-[15px]"
                >
                  <Link href="/app">See a live demo</Link>
                </Button>
              </div>
            </div>

            <div className="relative flex justify-center lg:justify-end">
              <span
                aria-hidden="true"
                data-live="hero-glow"
                className="pointer-events-none absolute inset-0 -z-10"
                style={{
                  background:
                    "radial-gradient(circle at 50% 35%, var(--accent-soft), transparent 68%)",
                }}
              />
              <div className="w-full max-w-[360px] rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-8 py-12 shadow-[var(--shadow)]">
                <div className="flex flex-col items-center text-center">
                  <Visor />
                  <p className="mt-1 flex items-center gap-1.5 text-[13px] font-medium text-[var(--text-2)]">
                    <LiveDot />
                    Wedevs is online — Claude · Sonnet
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---- FEATURES ---- */}
        <section
          aria-labelledby="features-heading"
          className="border-t border-[var(--border)] bg-[var(--surface)]"
        >
          <div className="mx-auto max-w-[1100px] px-5 py-16 sm:px-8 sm:py-20">
            <h2
              id="features-heading"
              className="mb-2.5 font-[var(--font-display)] text-[26px] font-bold tracking-[-0.01em] text-[var(--text)] sm:text-[30px]"
            >
              Everything for a real dev workflow
            </h2>
            <p className="mb-10 max-w-[520px] text-[15px] text-[var(--text-2)]">
              One workspace that talks, codes, and connects to the tools you
              already use.
            </p>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] p-5"
                >
                  <div className="mb-4 grid h-9 w-9 place-items-center rounded-[var(--radius-xs)] border border-[var(--border)] bg-[var(--bg)] text-[var(--text-2)]">
                    <f.icon size={18} strokeWidth={1.75} aria-hidden="true" />
                  </div>
                  <h3 className="mb-1.5 text-[15px] font-bold text-[var(--text)]">
                    {f.title}
                  </h3>
                  <p className="text-[13.5px] leading-relaxed text-[var(--text-2)]">
                    {f.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---- CLOSING CTA ---- */}
        <section className="border-t border-[var(--border)]">
          <div className="mx-auto flex max-w-[1100px] flex-col items-center gap-5 px-5 py-16 text-center sm:px-8 sm:py-20">
            <h2 className="max-w-[560px] font-[var(--font-display)] text-[26px] font-bold leading-[1.2] tracking-[-0.01em] text-[var(--text)] sm:text-[32px]">
              Bring your own model. Ship real code.
            </h2>
            <p className="max-w-[480px] text-[15px] text-[var(--text-2)]">
              Wedevs is free to start — open the app and pick up right where the
              demo left off.
            </p>
            <Button
              asChild
              variant="primary"
              className="px-5 py-2.5 text-[15px]"
            >
              <Link href="/app">Open the app</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--border)]">
        <div className="mx-auto flex max-w-[1100px] flex-col items-center justify-between gap-3 px-5 py-8 text-[13px] text-[var(--text-3)] sm:flex-row sm:px-8">
          <span>&copy; 2026 Wedevs</span>
          <nav aria-label="Footer" className="flex items-center gap-5">
            <Link href="/app" className="hover:text-[var(--text)]">
              Open app
            </Link>
            <a
              href="mailto:hello@wedevs.cloud"
              className="hover:text-[var(--text)]"
            >
              Contact
            </a>
          </nav>
        </div>
      </footer>
    </>
  );
}
