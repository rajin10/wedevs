"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { cn } from "../../lib/cn";
import { Dialog, DialogContent, DialogTitle } from "../../primitives/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "../../primitives/command";
import type { CommandItem as CommandItemData } from "../../types";

export interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actions: CommandItemData[];
  recents: CommandItemData[];
  models: CommandItemData[];
}

// mockup 518–519: neutral base + active row = var(--hover)/var(--text). No accent anywhere.
const ITEM_CLASS = cn(
  "flex items-center gap-[11px] rounded-[9px] px-[11px] py-[10px]",
  "text-[13.5px] text-[var(--text-2)]",
  "data-[selected=true]:bg-[var(--hover)] data-[selected=true]:text-[var(--text)]",
);

// mockup 517: .pal-sec — applied to cmdk's [cmdk-group-heading] element.
const GROUP_CLASS = cn(
  "[&_[cmdk-group-heading]]:px-[11px] [&_[cmdk-group-heading]]:pb-[5px] [&_[cmdk-group-heading]]:pt-[9px]",
  "[&_[cmdk-group-heading]]:text-[10.5px] [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:uppercase",
  "[&_[cmdk-group-heading]]:tracking-[0.07em] [&_[cmdk-group-heading]]:text-[var(--text-3)]",
);

export function CommandPalette({
  open,
  onOpenChange,
  actions,
  recents,
  models,
}: CommandPaletteProps) {
  // mockup 1613: global ⌘K / Ctrl+K opens the palette.
  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(true);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onOpenChange]);

  function renderGroup(heading: string, items: CommandItemData[]) {
    if (items.length === 0) return null;
    return (
      <CommandGroup heading={heading} className={GROUP_CLASS}>
        {items.map((item) => (
          <CommandItem
            key={item.id}
            value={item.label}
            className={ITEM_CLASS}
            onSelect={() => {
              item.onSelect();
              onOpenChange(false);
            }}
          >
            <span className="flex-1">{item.label}</span>
            {item.kbd ? (
              <CommandShortcut className="ml-auto text-[11px] text-[var(--text-3)]">
                {item.kbd}
              </CommandShortcut>
            ) : null}
          </CommandItem>
        ))}
      </CommandGroup>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Geometry/skin overrides:
          - top-[14vh]/translate-y-0 → top-aligned like mockup .palette-wrap (padding-top:14vh)
          - max-w-[600px] → mockup .palette width:min(600px,92%)
          - p-0/gap-0/overflow-hidden → surface owns its own padding via the rows below
          - bg/border/shadow/rounded → mockup .palette elevated skin (var(--elevated), var(--border-2), var(--shadow))
          - [&>button]:hidden → hide DialogContent's auto close-X (mockup uses the "esc" hint instead) */}
      <DialogContent
        aria-describedby={undefined}
        className={cn(
          "top-[14vh] translate-y-0",
          "max-w-[600px] gap-0 overflow-hidden p-0",
          "rounded-[16px] border border-[var(--border-2)] bg-[var(--elevated)] shadow-[var(--shadow)]",
          "[&>button]:hidden",
        )}
      >
        <DialogTitle className="sr-only">Command palette</DialogTitle>
        <Command
          className="bg-transparent"
          filter={(value, search) =>
            value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0
          }
        >
          {/* mockup 512 .pal-in — search icon + input + esc hint */}
          <div className="relative flex items-center border-b border-[var(--border)]">
            <Search
              className="pointer-events-none absolute left-[17px] size-[18px] text-[var(--text-3)]"
              aria-hidden="true"
            />
            <CommandInput
              placeholder="Search chats, models, plugins, actions…"
              className="h-auto border-0 py-[15px] pl-[46px] pr-[54px] text-[16px] text-[var(--text)] placeholder:text-[var(--text-3)]"
            />
            <kbd className="absolute right-[17px] inline-flex items-center rounded-[6px] border border-[var(--border)] bg-[var(--surface-2)] px-[6px] py-[2px] text-[11px] text-[var(--text-3)]">
              esc
            </kbd>
          </div>

          {/* mockup 516 .pal-list */}
          <CommandList className="max-h-[340px] overflow-y-auto p-2">
            <CommandEmpty className="px-[11px] py-[10px] text-[13.5px] text-[var(--text-3)]">
              No results found.
            </CommandEmpty>
            {renderGroup("Actions", actions)}
            {renderGroup("Recent chats", recents)}
            {renderGroup("Models", models)}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
