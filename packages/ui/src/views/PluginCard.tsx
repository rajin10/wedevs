"use client";

import { Puzzle } from "lucide-react";
import { Switch } from "../primitives/switch";
import type { PluginCardData } from "../types";

// Ported from mockup/index.html markup 1059 and CSS 368-386. Card: top
// (neutral icon tile + name + publisher/verified), desc, tags, foot:
// <Switch> (accent on-state is internal to the primitive) -> onToggle,
// status label synced to `enabled`, Configure button -> onConfigure.
export interface PluginCardProps {
  plugin: PluginCardData;
  onToggle: (id: string, on: boolean) => void;
  onConfigure: (id: string) => void;
}

export function PluginCard({ plugin, onToggle, onConfigure }: PluginCardProps) {
  return (
    <div
      data-testid="plugin-card"
      className="flex flex-col gap-[11px] rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-sm),inset_0_1px_0_rgba(255,255,255,.03)] transition-[border-color,transform] hover:-translate-y-0.5 hover:border-[var(--border-2)]"
    >
      <div className="flex items-center gap-[11px]">
        <div className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[10px] border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-2)]">
          <Puzzle className="h-[18px] w-[18px]" />
        </div>
        <div>
          <div className="text-[14.5px] font-bold text-[var(--text)]">
            {plugin.name}
          </div>
          <div className="text-[11.5px] text-[var(--text-3)]">
            {plugin.publisher}
            {plugin.verified ? " · verified" : ""}
          </div>
        </div>
      </div>

      <div className="flex-1 text-[13px] text-[var(--text-2)]">
        {plugin.desc}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {plugin.tags.map((t) => (
          <span
            key={t}
            className="inline-flex h-5 items-center rounded-full border border-[var(--border)] px-2 text-[11px] font-medium text-[var(--text-3)]"
          >
            {t}
          </span>
        ))}
      </div>

      <div className="mt-0.5 flex items-center gap-2.5">
        <Switch
          checked={plugin.enabled}
          onCheckedChange={(on) => onToggle(plugin.id, on)}
          aria-label={`Toggle ${plugin.name}`}
        />
        <span className="text-[12px] font-semibold text-[var(--text-3)]">
          {plugin.enabled ? "Enabled" : "Disabled"}
        </span>
        <button
          type="button"
          onClick={() => onConfigure(plugin.id)}
          className="ml-auto text-[12.5px] font-semibold text-[var(--text-2)] hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-line)]"
        >
          Configure
        </button>
      </div>
    </div>
  );
}
