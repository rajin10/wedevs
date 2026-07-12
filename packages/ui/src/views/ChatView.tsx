import { Composer } from "../components/Composer/Composer";
import { Thread } from "./Thread";
import type { ChatViewProps } from "../types";

// Ported from mockup/index.html CSS 227 (`.view-chat` column) + composer-wrap
// 308-311 / markup 1009-1013. Column: <Thread/> (flex-1 scroll) over a
// pinned composer region (768px inner).
export function ChatView({
  messages,
  streaming,
  composer,
  onOpenOutput,
}: ChatViewProps) {
  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <Thread
        messages={messages}
        streaming={streaming}
        onOpenOutput={onOpenOutput}
      />
      <div className="relative z-[1] shrink-0 px-6 pb-5 pt-2">
        <div className="mx-auto max-w-[768px]">
          <Composer {...composer} />
        </div>
      </div>
    </section>
  );
}
