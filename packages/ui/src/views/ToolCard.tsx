"use client";

import { BarChart3, ExternalLink } from "lucide-react";
import type { ToolCardData } from "../types";

// Ported from mockup/index.html markup 969-981 and CSS 253-268. Neutral card
// — no accent anywhere.
export interface ToolCardProps {
  tool: ToolCardData;
  onOpenOutput: (id: string) => void;
}

export function ToolCard({ tool, onOpenOutput }: ToolCardProps) {
  return (
    <div className="mt-3 overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-sm),inset_0_1px_0_rgba(255,255,255,.03)]">
      <div className="flex items-center gap-2.5 border-b border-[var(--border)] bg-[var(--surface-2)] px-[13px] py-2.5">
        <div className="grid h-[26px] w-[26px] shrink-0 place-items-center rounded-[7px] bg-[var(--hover)] text-[var(--text-2)]">
          <BarChart3 className="h-[15px] w-[15px]" />
        </div>
        <div className="min-w-0">
          <div className="text-[13px] font-bold text-[var(--text)]">
            {tool.name}
          </div>
          <div className="text-[11.5px] text-[var(--text-3)]">
            {tool.desc}
            {tool.done ? (
              <>
                {" · "}
                <span className="text-[var(--success)]">✓ {tool.done}</span>
              </>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          onClick={() => onOpenOutput(tool.id)}
          className="ml-auto flex shrink-0 items-center gap-1.5 rounded-lg border border-[var(--border)] px-[11px] py-1.5 text-[12px] font-semibold text-[var(--text-2)] transition-colors hover:border-[var(--border-2)] hover:bg-[var(--hover)] hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-line)]"
        >
          <ExternalLink className="h-[13px] w-[13px]" /> Open in panel
        </button>
      </div>
      <div className="p-[13px]">
        {tool.rows.map((row, i) => (
          <div
            key={`${row.label}-${i}`}
            className="flex justify-between border-b border-[var(--border)] py-[7px] text-[13px] last:border-b-0"
          >
            <span className="text-[var(--text-3)]">{row.label}</span>
            <span className="font-semibold text-[var(--text)]">
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
