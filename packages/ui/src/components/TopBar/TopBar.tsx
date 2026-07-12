"use client";

import * as React from "react";
import {
  Menu,
  Share2,
  PanelRight,
  Pin,
  MoreHorizontal,
  Pencil,
} from "lucide-react";
import { cn } from "../../lib/cn";
import { Button } from "../../primitives/button";
import { ModelSelector } from "./ModelSelector";
import type { TopBarProps } from "../../types";

export function TopBar({
  title,
  onTitleChange,
  selector,
  panel,
  onPanelToggle,
  onPanelPin,
  onShare,
  onChatMenu,
  onRailOpen,
}: TopBarProps) {
  const open = panel !== "closed";
  const pinned = panel === "pinned";

  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(title);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // keep the draft aligned with upstream title changes while not editing
  React.useEffect(() => {
    if (!editing) setDraft(title);
  }, [title, editing]);

  // focus + select the field when edit mode opens
  React.useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const startEdit = () => {
    setDraft(title);
    setEditing(true);
  };
  // mockup 1471-1473: done(value.trim() || old)
  const commit = () => {
    onTitleChange(draft.trim() || title);
    setEditing(false);
  };
  const cancel = () => {
    setDraft(title);
    setEditing(false);
  };

  return (
    <header className="flex h-14 flex-none items-center gap-2.5 border-b border-[var(--border)] bg-[var(--bg)] px-3.5">
      {/* mockup 807-809: rail-open hamburger */}
      <Button
        variant="icon"
        type="button"
        aria-label="Open menu"
        onClick={onRailOpen}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* mockup 811-817: model/agent selector */}
      <ModelSelector variant="topbar" {...selector} />

      {/* mockup 875-880: center inline-editable session title */}
      <div className="flex min-w-0 flex-1 justify-center">
        {editing ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commit();
              } else if (e.key === "Escape") {
                e.preventDefault();
                cancel();
              }
            }}
            onBlur={commit}
            aria-label="Session title"
            className="min-w-0 max-w-full rounded-md border border-[var(--accent-line)] bg-[var(--surface)] px-[7px] py-0.5 text-sm text-[var(--text)] outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={startEdit}
            onDoubleClick={startEdit}
            aria-label="Rename session"
            className={cn(
              "group inline-flex max-w-full cursor-text items-center gap-2 rounded-[var(--radius-xs)] px-2.5 py-1.5 text-sm font-medium text-[var(--text-2)]",
              "hover:bg-[var(--hover)] hover:text-[var(--text)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-line)]",
            )}
          >
            <span className="truncate">{title}</span>
            <Pencil className="h-3.5 w-3.5 flex-none text-[var(--text-3)] opacity-0 group-hover:opacity-100" />
          </button>
        )}
      </div>

      {/* mockup 882-891: right-hand action cluster */}
      <div className="flex flex-none items-center gap-1">
        <Button
          variant="outline"
          type="button"
          onClick={onShare}
          className="gap-[7px] px-3 py-[7px] text-[13px] font-semibold"
        >
          <Share2 className="h-4 w-4" />
          <span>Share</span>
        </Button>

        <Button
          variant="icon"
          type="button"
          aria-label="Toggle inspector"
          aria-pressed={open}
          onClick={onPanelToggle}
          className={cn(open && "bg-[var(--active)] text-[var(--text)]")}
        >
          <PanelRight className="h-5 w-5" />
        </Button>

        {open && (
          <Button
            variant="icon"
            type="button"
            aria-label="Pin inspector"
            aria-pressed={pinned}
            onClick={onPanelPin}
            className={cn(pinned && "bg-[var(--active)] text-[var(--text)]")}
          >
            <Pin className="h-[18px] w-[18px]" />
          </Button>
        )}

        <Button
          variant="icon"
          type="button"
          aria-label="More"
          onClick={onChatMenu}
        >
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
