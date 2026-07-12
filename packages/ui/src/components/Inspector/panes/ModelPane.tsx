"use client";

import * as React from "react";
import { Boxes, Search, Code2 } from "lucide-react";
import { Switch } from "../../../primitives/switch";
import type { ModelDetails } from "../../../types";

function EyebrowSm({ label }: { label: string }) {
  return (
    <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-3)]">
      <span className="h-0.5 w-4 flex-none rounded-[2px] bg-[var(--accent)]" />
      {label}
    </div>
  );
}

function Range({
  value,
  min,
  max,
}: {
  value: number;
  min: number;
  max: number;
}) {
  const span = max - min || 1;
  const pct = Math.max(0, Math.min(100, ((value - min) / span) * 100));
  return (
    <div className="relative h-[5px] rounded-[3px] bg-[var(--border-2)]">
      <div
        data-testid="range-fill"
        className="absolute inset-y-0 left-0 rounded-[3px] bg-[var(--accent)]"
        style={{ width: `${pct}%` }}
      />
      <span
        className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--border-2)] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.3)]"
        style={{ left: `${pct}%` }}
      />
    </div>
  );
}

const toolIcons = [Search, Code2];

export function ModelPane({ model }: { model?: ModelDetails }) {
  const [tools, setTools] = React.useState(model?.tools ?? []);
  React.useEffect(() => {
    setTools(model?.tools ?? []);
  }, [model]);

  if (!model) {
    return (
      <p className="text-[13px] text-[var(--text-3)]">No model selected.</p>
    );
  }
  return (
    <div>
      <EyebrowSm label="Model" />
      <div className="mb-3.5 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] p-3.5">
        <h4 className="mb-2.5 flex items-center gap-2 text-[13px] font-semibold">
          <span className="grid h-[22px] w-[22px] place-items-center rounded-[7px] bg-[var(--hover)] text-[var(--text-2)]">
            <Boxes className="h-[15px] w-[15px]" />
          </span>
          {model.name}
        </h4>
        <p className="text-[13px] text-[var(--text-2)]">{model.sub}</p>
      </div>
      {model.params.map((param) => (
        <div key={param.label} className="mb-3.5">
          <div className="mb-[7px] flex justify-between text-[12.5px]">
            <span>{param.label}</span>
            <span className="font-mono font-bold">
              {param.value.toLocaleString("en-US")}
            </span>
          </div>
          <Range value={param.value} min={param.min} max={param.max} />
        </div>
      ))}
      <div className="mt-4 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] p-3.5">
        <h4 className="mb-2.5 text-[13px] font-semibold">Enabled tools</h4>
        {tools.map((tool, i) => {
          const Icon = toolIcons[i % toolIcons.length]!;
          return (
            <div
              key={tool.label}
              className="flex items-center gap-2.5 border-b border-[var(--border)] py-[9px] last:border-b-0"
            >
              <Icon className="h-4 w-4 text-[var(--text-3)]" />
              <span className="flex-1 text-[13px] font-medium">
                {tool.label}
              </span>
              <Switch
                checked={tool.on}
                aria-label={tool.label}
                onCheckedChange={(on) =>
                  setTools((prev) =>
                    prev.map((t, idx) => (idx === i ? { ...t, on } : t)),
                  )
                }
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
