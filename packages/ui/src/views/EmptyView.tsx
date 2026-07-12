"use client";

import { Sparkles } from "lucide-react";
import { Visor } from "../mascots/Visor";
import { Composer } from "../components/Composer/Composer";
import { cn } from "../lib/cn";
import type { EmptyViewProps } from "../types";

// Ported from mockup/index.html markup 895-944 and CSS 212-219/560-572/632-634.
// Visor (Task 6) already renders the full `.hero-bot` structure internally
// (accent-soft glow + bob-animated svg + hero-shadow) — we render it bare
// rather than re-wrapping it, to avoid a doubled glow/shadow.
export function EmptyView({ greeting, starters, composer }: EmptyViewProps) {
  return (
    <section className="flex flex-1 items-center justify-center overflow-y-auto px-6 py-8">
      <div className="flex w-full max-w-[680px] flex-col items-center text-center">
        <Visor />

        {/* eyebrow — dash rendered NEUTRAL per brand rule (mockup 215 tints it
            accent; we deviate to --border-2 since it is not interactive/alive) */}
        <div className="mb-2 inline-flex items-center gap-[9px] text-[11px] font-bold uppercase tracking-[.18em] text-[var(--text-3)]">
          <span className="h-0.5 w-5 rounded-sm bg-[var(--border-2)]" /> New
          session
        </div>

        <h1 className="mb-2.5 font-[var(--font-display)] text-[34px] font-bold leading-[1.15] tracking-[-.02em] text-[var(--text)] max-[680px]:text-[27px]">
          {greeting}
        </h1>
        <p className="mb-7 text-[15px] text-[var(--text-2)]">
          Pick a model, drop in files, or start from a suggestion.
        </p>

        <div className="mx-0 mb-[22px] mt-0.5 w-full max-w-[640px]">
          <Composer {...composer} />
        </div>

        <div className="mb-[26px] flex max-w-[560px] flex-wrap justify-center gap-2.5">
          {starters.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => composer.onChange(s)}
              className={cn(
                "flex items-center gap-[9px] rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-3.5 py-[11px] text-left text-[13px] font-medium text-[var(--text)]",
                "transition-colors hover:border-[var(--border-2)] hover:bg-[var(--hover)]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-line)]",
              )}
            >
              <Sparkles className="h-4 w-4 shrink-0 text-[var(--text-3)]" /> {s}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
