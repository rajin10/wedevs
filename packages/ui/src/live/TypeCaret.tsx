import { cn } from "../lib/cn";
import { useReducedMotion } from "../lib/use-reduced-motion";
import type { TypeCaretProps } from "../types";

export type { TypeCaretProps };

// Ported from mockup/index.html CSS 289-290 (`.type-caret`).
export function TypeCaret({ className }: TypeCaretProps) {
  const reduce = useReducedMotion();
  return (
    <span
      aria-hidden="true"
      data-live="caret"
      className={cn(
        "ml-px inline-block h-[1.05em] w-[7px] rounded-[1px] bg-[var(--accent)] align-[-2px]",
        !reduce && "animate-[caret_1s_steps(2)_infinite]",
        className,
      )}
    />
  );
}
