"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { cn } from "../lib/cn";
import { PluginCard } from "./PluginCard";
import type { MarketViewProps } from "../types";

const FILTERS = [
  "All",
  "Installed",
  "Search",
  "Dev tools",
  "Data",
  "Productivity",
] as const;

// Ported from mockup/index.html markup 1042-1066 and CSS 352-367. Scroll
// column: `.market-head` (title, sub, search-box input [display-only — no
// callback in the contract, so uncontrolled with aria-label], filter pills
// with LOCAL active state) -> responsive `.market-grid` of <PluginCard/>.
export function MarketView({
  plugins,
  onToggle,
  onConfigure,
}: MarketViewProps) {
  const [active, setActive] = useState<string>("All");

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="mx-auto w-full max-w-[1000px] px-[26px] pb-4 pt-[26px]">
        <div className="text-[22px] font-bold tracking-[-.01em]">
          Plugins &amp; tools
        </div>
        <div className="mt-1 text-[var(--text-2)]">
          Extend your models with connectors, tools, and data sources.
        </div>
        <div className="mt-[18px] flex flex-wrap gap-2.5">
          <div className="flex min-w-[200px] flex-1 items-center gap-[9px] rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 py-[9px] focus-within:border-[var(--accent-line)]">
            <Search className="h-4 w-4 text-[var(--text-3)]" />
            <input
              aria-label="Search plugins"
              placeholder="Search plugins…"
              className="flex-1 border-none bg-transparent text-[var(--text)] outline-none placeholder:text-[var(--text-3)]"
            />
          </div>
          <div className="flex flex-wrap gap-[7px]">
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={active === f}
                onClick={() => setActive(f)}
                className={cn(
                  "rounded-full border px-[13px] py-2 text-[13px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-line)]",
                  active === f
                    ? "border-[var(--border-2)] bg-[var(--active)] text-[var(--text)]"
                    : "border-[var(--border)] text-[var(--text-2)] hover:bg-[var(--hover)] hover:text-[var(--text)]",
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-[1000px] grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3.5 px-[26px] pb-10 pt-1.5">
        {plugins.map((p) => (
          <PluginCard
            key={p.id}
            plugin={p}
            onToggle={onToggle}
            onConfigure={onConfigure}
          />
        ))}
      </div>
    </section>
  );
}
