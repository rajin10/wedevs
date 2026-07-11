import { cn } from "../lib/cn";
import { useReducedMotion } from "../lib/use-reduced-motion";
import type { LiveDotProps } from "../types";

export type { LiveDotProps };

// Ported from mockup/index.html CSS 283-285 (`.livedot`, `@keyframes live`).
export function LiveDot({ className }: LiveDotProps) {
  const reduce = useReducedMotion();
  return (
    <span
      aria-hidden="true"
      data-slot="live-dot"
      className={cn(
        "inline-block h-[7px] w-[7px] shrink-0 rounded-full bg-[var(--accent)]",
        !reduce && "animate-[live_2s_ease-in-out_infinite]",
        className,
      )}
    />
  );
}
