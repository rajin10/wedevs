import { cn } from "../lib/cn";
import { useReducedMotion } from "../lib/use-reduced-motion";
import type { StreamShimmerProps } from "../types";

export type { StreamShimmerProps };

// Ported from mockup/index.html CSS 574-578 (`.stream-shimmer`,
// `@keyframes txtshim`). Deliberately NEUTRAL — a gray --text-3 -> --text
// loading sweep, never accent. This is the one live/* primitive that must
// NOT paint with --accent.
export function StreamShimmer({ text, className }: StreamShimmerProps) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <span className={cn("text-[var(--text)]", className)}>{text}</span>;
  }

  return (
    <span
      className={cn(
        "bg-[length:220%_100%] bg-clip-text text-transparent",
        "[background-image:linear-gradient(100deg,var(--text-3)_30%,var(--text)_50%,var(--text-3)_70%)]",
        "animate-[txtshim_2.4s_linear_infinite]",
        className,
      )}
    >
      {text}
    </span>
  );
}
