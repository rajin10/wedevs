"use client";

import * as React from "react";
import {
  Paperclip,
  Settings2,
  Mic,
  Send,
  X,
  Upload,
  ImageIcon,
  FileText,
} from "lucide-react";
import { cn } from "../../lib/cn";
import { useReducedMotion } from "../../lib/use-reduced-motion";
import type { Attachment, ComposerProps } from "../../types";

// mockup 919/1018 — agent name lives inside the agentPill node, so both
// variants use one generic placeholder.
const PLACEHOLDER = "Message Wedevs…  (⏎ to send, ⇧⏎ for a new line)";
const FOOT_NOTE = "Wedevs can make mistakes — verify important info.";

// mockup 334-335 — 36px neutral icon button.
const cbtn =
  "grid h-9 w-9 flex-none place-items-center rounded-[10px] text-[var(--text-2)] hover:bg-[var(--hover)] hover:text-[var(--text)]";

// mockup 318-328 — one attachment chip. Neutral surface; the ONLY Volt is the
// live upload progress bar (.chip-prog, line 328).
function Chip({
  attachment,
  onRemove,
}: {
  attachment: Attachment;
  onRemove: (id: string) => void;
}) {
  const Icon = attachment.kind === "image" ? ImageIcon : FileText;
  const progress =
    typeof attachment.progress === "number"
      ? Math.max(0, Math.min(100, attachment.progress))
      : null;
  return (
    <div className="relative flex max-w-[230px] items-center gap-[9px] rounded-[11px] border border-[var(--border)] bg-[var(--surface-2)] py-2 pl-2 pr-2.5">
      <span className="grid h-[34px] w-[34px] flex-none place-items-center overflow-hidden rounded-[7px] bg-[var(--hover)] text-[var(--text-2)]">
        <Icon className="h-[18px] w-[18px]" strokeWidth={1.7} />
      </span>
      <span className="min-w-0 leading-[1.3]">
        <span className="block truncate text-[12.5px] font-semibold">
          {attachment.name}
        </span>
        <span className="block text-[11px] text-[var(--text-3)]">
          {attachment.sub}
        </span>
      </span>
      <button
        type="button"
        aria-label={`Remove ${attachment.name}`}
        onClick={() => onRemove(attachment.id)}
        className="grid h-5 w-5 flex-none place-items-center rounded-[6px] text-[var(--text-3)] hover:bg-[var(--active)] hover:text-[var(--text)]"
      >
        <X className="h-3.5 w-3.5" />
      </button>
      {progress !== null ? (
        <span
          data-testid="chip-progress"
          data-live="progress"
          className="absolute bottom-0 left-0 h-0.5 rounded-[2px] bg-[var(--accent)]"
          style={{ width: `${progress}%` }}
        />
      ) : null}
    </div>
  );
}

// mockup 346-349 & markup 1011 — Volt drop overlay for the active drag state.
// The fade-in is dropped under prefers-reduced-motion.
function DropOverlay({ reduced }: { reduced: boolean }) {
  const [shown, setShown] = React.useState(reduced);
  React.useEffect(() => {
    if (reduced) {
      setShown(true);
      return;
    }
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, [reduced]);
  return (
    <div
      data-testid="drop-overlay"
      data-live="drag"
      className={cn(
        "absolute inset-x-6 inset-y-2 z-[5] flex flex-col items-center justify-center gap-2.5",
        "rounded-[18px] border-2 border-dashed border-[var(--accent-line)] bg-[var(--accent-soft)]",
        "font-semibold text-[var(--accent)] backdrop-blur-[2px]",
        !reduced && "transition-opacity duration-200 ease-out",
      )}
      style={{ opacity: shown ? 1 : 0 }}
    >
      <Upload className="h-[30px] w-[30px]" strokeWidth={1.6} />
      Drop files to attach
    </div>
  );
}

export function Composer({
  variant,
  value,
  onChange,
  onSubmit,
  attachments,
  attachOpen,
  onAttach,
  onRemoveAttachment,
  toolsOn,
  onToggleTools,
  onVoice,
  agentPill,
  dragging = false,
  toolCount = 0,
}: ComposerProps) {
  const reduced = useReducedMotion();
  const taRef = React.useRef<HTMLTextAreaElement>(null);

  // Autogrow: reset to auto, then grow to content (capped by max-h-[40vh]).
  React.useLayoutEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Guard against IME composition (e.g. Japanese/Chinese/Korean input
    // methods): the Enter that confirms a composed character must not also
    // submit the message. `keyCode === 229` is the legacy fallback some
    // browsers still report during composition.
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
    // Enter (also Ctrl/Cmd+Enter) submits; Shift+Enter inserts a newline.
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  }

  const trayOpen = attachOpen || attachments.length > 0;

  return (
    <div
      data-testid="composer"
      data-variant={variant}
      className={cn(
        "relative w-full px-6 pb-5",
        variant === "empty" ? "mx-auto max-w-[680px] pt-0" : "pt-2",
      )}
    >
      {dragging ? <DropOverlay reduced={reduced} /> : null}

      <div className="mx-auto max-w-[768px]">
        {/* mockup 312-314/657-658 — card shell + sanctioned focus-within Volt ring */}
        <div
          data-focus-ring
          className={cn(
            "overflow-hidden rounded-[18px] border border-[var(--border-2)] bg-[var(--surface)] shadow-[var(--shadow-sm)]",
            "focus-within:border-[var(--accent-line)] focus-within:shadow-[0_0_0_3px_var(--accent-soft)]",
            !reduced && "transition-[border-color,box-shadow] duration-150",
          )}
        >
          {/* mockup 316-317 — attachment tray */}
          {trayOpen ? (
            <div
              data-testid="attachment-tray"
              className="flex flex-wrap gap-[9px] px-3.5 pb-0.5 pt-3"
            >
              {attachments.map((a) => (
                <Chip key={a.id} attachment={a} onRemove={onRemoveAttachment} />
              ))}
            </div>
          ) : null}

          {/* mockup 331-333/633-634 — autogrow textarea */}
          <textarea
            ref={taRef}
            rows={1}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={PLACEHOLDER}
            aria-label="Message"
            className={cn(
              "block w-full resize-none overflow-y-auto bg-transparent px-[15px] pb-1.5 pt-[13px]",
              "leading-[1.55] text-[var(--text)] outline-none placeholder:text-[var(--text-3)]",
              "max-h-[40vh]",
              variant === "empty" ? "min-h-[52px]" : "min-h-[26px]",
            )}
          />

          {/* mockup 635-641 — toolbar */}
          <div className="flex items-center gap-2 px-2.5 pb-[9px]">
            <div className="flex min-w-0 flex-1 items-center gap-[5px]">
              <button
                type="button"
                aria-label="Attach files"
                title="Attach"
                onClick={onAttach}
                className={cbtn}
              >
                <Paperclip className="h-[18px] w-[18px]" />
              </button>
              <button
                type="button"
                aria-label="Tools and plugins"
                aria-pressed={toolsOn}
                data-live={toolsOn ? "toggle" : undefined}
                title="Tools & plugins"
                onClick={onToggleTools}
                className={cn(
                  "inline-flex h-9 flex-none items-center gap-1.5 rounded-[10px] px-2 text-[13px] font-semibold",
                  toolsOn
                    ? // mockup 336 (.cbtn.on) — sanctioned on-state liveness Volt
                      "bg-[var(--accent-soft)] text-[var(--accent)]"
                    : "text-[var(--text-2)] hover:bg-[var(--hover)] hover:text-[var(--text)]",
                )}
              >
                <Settings2 className="h-[18px] w-[18px]" />
                {toolsOn && toolCount > 0 ? (
                  <span data-testid="tool-count">{toolCount}</span>
                ) : null}
              </button>
              {/* mockup 924/1023 + 638 — injected Task-8 pill (rendered, never built) */}
              <span className="ml-[3px] inline-flex min-w-0">{agentPill}</span>
            </div>

            <div className="flex flex-none items-center gap-[5px]">
              {/* mockup 641 — ⏎ hint */}
              <span className="mr-0.5 select-none font-mono text-[11px] text-[var(--text-3)] opacity-75">
                ⏎ send
              </span>
              <button
                type="button"
                aria-label="Voice input"
                title="Voice input"
                onClick={onVoice}
                className={cbtn}
              >
                <Mic className="h-[18px] w-[18px]" />
              </button>
              {/* mockup 337-338 — NEUTRAL send (--primary/--primary-text), never Volt */}
              <button
                type="button"
                aria-label="Send message"
                title="Send"
                onClick={onSubmit}
                className="grid h-9 w-9 flex-none place-items-center rounded-[10px] bg-[var(--primary)] text-[var(--primary-text)] hover:brightness-110"
              >
                <Send className="h-[18px] w-[18px]" />
              </button>
            </div>
          </div>
        </div>

        {/* mockup 340-343 — footer (empty = centered note; chat = tools count + note) */}
        <div
          className={cn(
            "mt-[9px] flex items-center gap-2.5 px-1 text-[11.5px] text-[var(--text-3)]",
            variant === "empty" && "justify-center",
          )}
        >
          {variant === "chat" && toolsOn && toolCount > 0 ? (
            <>
              <span>
                {toolCount} {toolCount === 1 ? "tool" : "tools"} enabled
              </span>
              <span className="h-[3px] w-[3px] rounded-full bg-[var(--text-3)]" />
            </>
          ) : null}
          <span>{FOOT_NOTE}</span>
        </div>
      </div>
    </div>
  );
}
