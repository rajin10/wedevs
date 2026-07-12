import { Robo } from "../mascots/Robo";
import { LiveCluster } from "../live/LiveCluster";
import { LiveDot } from "../live/LiveDot";
import { StreamShimmer } from "../live/StreamShimmer";
import { TypeCaret } from "../live/TypeCaret";
import { Message } from "./Message";
import type { ChatMessage, StreamingMessage } from "../types";

// Ported from mockup/index.html CSS 226-230 (thread/thread-inner) + streaming
// block markup 993-1005. The streaming row substitutes the mockup's `.loader`
// donut with the sanctioned `<LiveDot/>` (accent-allowed liveness cue),
// pairs `<LiveCluster/>` beside the name, and reveals `partialText` via the
// NEUTRAL `<StreamShimmer/>` + accent `<TypeCaret/>`.
export interface ThreadProps {
  messages: ChatMessage[];
  streaming?: StreamingMessage;
  onOpenOutput: (id: string) => void;
}

export function Thread({ messages, streaming, onOpenOutput }: ThreadProps) {
  return (
    <div className="flex-1 overflow-y-auto px-6 pb-2 pt-[26px]">
      <div className="mx-auto flex max-w-[768px] flex-col gap-[26px]">
        {messages.map((m) => (
          <Message key={m.id} message={m} onOpenOutput={onOpenOutput} />
        ))}

        {streaming ? (
          <div
            className="relative flex gap-3.5"
            data-testid="streaming-message"
          >
            <div
              className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-[9px]"
              style={{
                background:
                  "radial-gradient(circle at 50% 34%,#34393b,#1d2021)",
              }}
            >
              <Robo size={22} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-[5px] flex items-center gap-2 text-[12.5px] font-bold text-[var(--text-2)]">
                {streaming.model} <LiveCluster />{" "}
                <span
                  className="text-[11px] font-medium text-[var(--text-3)]"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  now
                </span>
              </div>

              {streaming.runningTool ? (
                <div className="mt-3 flex items-center gap-[11px] rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] px-[13px] py-2.5">
                  <LiveDot />
                  <div>
                    <div className="text-[13px] font-semibold text-[var(--text)]">
                      {streaming.runningTool.name}
                    </div>
                    <div className="text-[11.5px] text-[var(--text-3)]">
                      {streaming.runningTool.desc}
                    </div>
                  </div>
                  {streaming.runningTool.done ? (
                    <span
                      className="ml-auto text-[11px] text-[var(--text-3)]"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      {streaming.runningTool.done}
                    </span>
                  ) : null}
                </div>
              ) : null}

              <p className="mt-3 text-[14.5px]" data-testid="stream-line">
                <StreamShimmer text={streaming.partialText} />
                <TypeCaret />
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
