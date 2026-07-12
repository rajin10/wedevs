"use client";

import { Pin, X } from "lucide-react";
import { cn } from "../../lib/cn";
import { useReducedMotion } from "../../lib/use-reduced-motion";
import { Button } from "../../primitives/button";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../../primitives/tabs";
import type { InspectorProps, InspectorTab } from "../../types";
import { FilePane } from "./panes/FilePane";
import { OutputPane } from "./panes/OutputPane";
import { ModelPane } from "./panes/ModelPane";
import { ConfigPane } from "./panes/ConfigPane";

// mockup 388-393
const modeClass: Record<InspectorProps["mode"], string> = {
  closed: "w-0 overflow-hidden border-l border-[var(--border)]",
  pinned: "w-[400px] border-l border-[var(--border)]",
  float:
    "absolute inset-y-0 right-0 z-30 w-[390px] max-[680px]:w-full max-[680px]:left-0 border-l border-[var(--border-2)] shadow-[var(--shadow)]",
};

// mockup 397-399: neutral tab chip; active = --active/--text (NO accent)
const tabClass = cn(
  "rounded-[8px] px-[11px] py-1.5 text-[12.5px] font-semibold text-[var(--text-3)]",
  "data-[state=inactive]:hover:bg-[var(--hover)] data-[state=inactive]:hover:text-[var(--text-2)]",
  "data-[state=active]:bg-[var(--active)] data-[state=active]:text-[var(--text)]",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-line)]",
);

const tabs: { value: InspectorTab; label: string }[] = [
  { value: "file", label: "File" },
  { value: "output", label: "Output" },
  { value: "details", label: "Model" },
  { value: "config", label: "Setup" },
];

export function Inspector({
  mode,
  tab,
  onTabChange,
  onPin,
  onClose,
  file,
  output,
  model,
  config,
}: InspectorProps) {
  const reduced = useReducedMotion();
  return (
    <aside
      data-testid="inspector"
      data-panel={mode}
      className={cn(
        "flex flex-none flex-col overflow-hidden bg-[var(--surface)]",
        !reduced &&
          "transition-[width] duration-[240ms] ease-[cubic-bezier(0.4,0,0.2,1)]",
        modeClass[mode],
      )}
    >
      <div
        data-testid="inspector-head"
        className="flex h-14 flex-none items-center gap-2 border-b border-[var(--border)] pl-4 pr-3"
      >
        <span className="min-w-0 flex-1 truncate text-sm font-bold">
          Inspector
        </span>
        <Button
          variant="icon"
          type="button"
          aria-label="Pin open"
          onClick={onPin}
        >
          <Pin className="h-[18px] w-[18px]" />
        </Button>
        <Button
          variant="icon"
          type="button"
          aria-label="Close"
          onClick={onClose}
        >
          <X className="h-[18px] w-[18px]" />
        </Button>
      </div>

      <Tabs
        value={tab}
        onValueChange={(v) => onTabChange(v as InspectorTab)}
        className="flex min-h-0 flex-1 flex-col"
      >
        <TabsList className="flex flex-none gap-0.5 border-b border-[var(--border)] px-3 py-2">
          {tabs.map((t) => (
            <TabsTrigger
              key={t.value}
              value={t.value}
              className={tabClass}
              // Radix's own activation runs on mousedown/focus; a bare `click`
              // (e.g. programmatic dispatch, some assistive tech) needs this too.
              onClick={() => onTabChange(t.value)}
            >
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <TabsContent value="file">
            <FilePane file={file} />
          </TabsContent>
          <TabsContent value="output">
            <OutputPane output={output} />
          </TabsContent>
          <TabsContent value="details">
            <ModelPane model={model} />
          </TabsContent>
          <TabsContent value="config">
            <ConfigPane config={config} onClose={onClose} />
          </TabsContent>
        </div>
      </Tabs>
    </aside>
  );
}
