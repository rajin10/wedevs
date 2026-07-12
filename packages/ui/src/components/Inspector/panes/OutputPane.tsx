"use client";

import { BarChart3, RotateCw, Copy } from "lucide-react";
import { Button } from "../../../primitives/button";
import type { OutputData } from "../../../types";

function EyebrowSm({ label }: { label: string }) {
  return (
    <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-3)]">
      <span className="h-0.5 w-4 flex-none rounded-[2px] bg-[var(--accent)]" />
      {label}
    </div>
  );
}

const miniBtn =
  "flex h-auto items-center gap-[7px] rounded-[9px] border border-[var(--border)] px-3 py-2 text-[12.5px] font-semibold text-[var(--text-2)] hover:bg-[var(--hover)] hover:text-[var(--text)] hover:border-[var(--border-2)]";

// mockup 294-296: conic accent donut, inset surface disc on top
function Ring({ percent }: { percent: number }) {
  const p = Math.max(0, Math.min(100, percent));
  return (
    <span
      data-testid="ring"
      className="relative h-4 w-4 flex-none rounded-full"
      style={{
        background: `conic-gradient(var(--accent) ${p}%, var(--border-2) 0)`,
      }}
    >
      <span className="absolute inset-[3px] rounded-full bg-[var(--surface)]" />
    </span>
  );
}

export function OutputPane({ output }: { output?: OutputData }) {
  if (!output) {
    return (
      <p className="text-[13px] text-[var(--text-3)]">No plugin output yet.</p>
    );
  }
  return (
    <div>
      <EyebrowSm label="Plugin output" />
      <div className="mb-3.5 flex items-center gap-[11px] rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] px-[13px] py-2.5">
        <Ring percent={output.percent} />
        <div>
          <div className="text-[13px] font-semibold">{output.title}</div>
          <div className="text-[11.5px] text-[var(--text-3)]">
            Completed · {output.rows.length} channels
          </div>
        </div>
      </div>
      <div className="mb-3.5 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] p-3.5">
        <h4 className="mb-2.5 flex items-center gap-2 text-[13px] font-semibold">
          <span className="grid h-[22px] w-[22px] place-items-center rounded-[7px] bg-[var(--hover)] text-[var(--text-2)]">
            <BarChart3 className="h-[15px] w-[15px]" />
          </span>
          Channel breakdown
        </h4>
        {output.rows.map((row) => (
          <div
            key={row.label}
            className="flex justify-between border-b border-[var(--border)] py-[7px] text-[13px] last:border-b-0"
          >
            <span className="text-[var(--text-3)]">{row.label}</span>
            <span className="font-semibold">{row.value}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Button variant="outline" className={miniBtn} type="button">
          <RotateCw className="h-4 w-4" /> Re-run
        </Button>
        <Button variant="outline" className={miniBtn} type="button">
          <Copy className="h-4 w-4" /> Copy JSON
        </Button>
      </div>
    </div>
  );
}
