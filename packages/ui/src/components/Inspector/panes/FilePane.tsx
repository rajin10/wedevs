"use client";

import { ImageIcon, Download, ZoomIn } from "lucide-react";
import { Button } from "../../../primitives/button";
import type { FilePreviewData } from "../../../types";

function EyebrowSm({ label }: { label: string }) {
  return (
    <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-3)]">
      <span
        data-live="eyebrow"
        className="h-0.5 w-4 flex-none rounded-[2px] bg-[var(--accent)]"
      />
      {label}
    </div>
  );
}

const miniBtn =
  "flex h-auto items-center gap-[7px] rounded-[9px] border border-[var(--border)] px-3 py-2 text-[12.5px] font-semibold text-[var(--text-2)] hover:bg-[var(--hover)] hover:text-[var(--text)] hover:border-[var(--border-2)]";

export function FilePane({ file }: { file?: FilePreviewData }) {
  if (!file) {
    return (
      <p className="text-[13px] text-[var(--text-3)]">No file selected.</p>
    );
  }
  return (
    <div>
      <EyebrowSm label="Preview" />
      <div className="mb-3.5 grid h-[200px] place-items-center overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[linear-gradient(135deg,#5a6472,#2f363f)] text-white/50">
        {file.src ? (
          <img
            src={file.src}
            alt={file.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <ImageIcon className="h-[34px] w-[34px]" strokeWidth={1.6} />
        )}
      </div>
      <div className="mb-4 flex flex-col gap-px">
        <span className="font-bold">{file.name}</span>
        <span className="font-mono text-xs text-[var(--text-3)]">
          {file.size} · {file.dims}
        </span>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" className={miniBtn} type="button">
          <Download className="h-4 w-4" /> Download
        </Button>
        <Button variant="outline" className={miniBtn} type="button">
          <ZoomIn className="h-4 w-4" /> Zoom
        </Button>
      </div>
    </div>
  );
}
