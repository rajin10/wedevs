import { Copy, RotateCcw, ThumbsDown, ThumbsUp } from "lucide-react";
import { Robo } from "../mascots/Robo";
import { ToolCard } from "./ToolCard";
import type { ChatMessage } from "../types";

// Ported from mockup/index.html markup 950-991 and CSS 231-268. User role is
// a right-aligned neutral `--bubble` bubble; assistant role is a Robo avatar
// + name/time + text + optional ToolCard + hover-revealed action row.
// Neutral throughout except focus rings.
export interface MessageProps {
  message: ChatMessage;
  onOpenOutput: (id: string) => void;
}

const ACTIONS = [
  { Icon: Copy, label: "Copy" },
  { Icon: RotateCcw, label: "Retry" },
  { Icon: ThumbsUp, label: "Good" },
  { Icon: ThumbsDown, label: "Bad" },
] as const;

export function Message({ message, onOpenOutput }: MessageProps) {
  if (message.role === "user") {
    return (
      <div className="group relative flex justify-end gap-3.5">
        <div className="max-w-[80%] flex-[0_1_auto]">
          <div className="rounded-[16px_16px_5px_16px] border border-[var(--border)] bg-[var(--bubble)] px-[15px] py-3 text-[var(--text)]">
            {message.text}
          </div>
          {message.attachments?.length ? (
            <div className="mt-[9px] flex flex-wrap justify-end gap-2">
              {message.attachments.map((a) => (
                <div
                  key={a.id}
                  className="flex max-w-[230px] items-center gap-[9px] rounded-[11px] border border-[var(--border)] bg-[var(--surface-2)] py-2 pl-2 pr-2.5 text-[12.5px] font-semibold text-[var(--text)]"
                >
                  <span className="truncate">{a.name}</span>
                  <span className="shrink-0 text-[11px] font-medium text-[var(--text-3)]">
                    {a.sub}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="group relative flex gap-3.5">
      <div
        className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-[9px]"
        style={{
          background: "radial-gradient(circle at 50% 34%,#34393b,#1d2021)",
        }}
      >
        <Robo size={22} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-[5px] flex items-center gap-2 text-[12.5px] font-bold text-[var(--text-2)]">
          {message.model ?? "Assistant"}{" "}
          <span
            className="text-[11px] font-medium text-[var(--text-3)]"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {message.time}
          </span>
        </div>
        <div className="text-[14.5px] text-[var(--text)] [&_p]:mb-2.5 [&_p:last-child]:mb-0">
          {message.text.split("\n\n").map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
        {message.tool ? (
          <ToolCard tool={message.tool} onOpenOutput={onOpenOutput} />
        ) : null}
        <div className="mt-2 flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          {ACTIONS.map(({ Icon, label }) => (
            <button
              key={label}
              type="button"
              title={label}
              aria-label={label}
              className="grid h-7 w-7 place-items-center rounded-[7px] text-[var(--text-3)] hover:bg-[var(--hover)] hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-line)]"
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
