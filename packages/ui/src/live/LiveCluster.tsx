import { cn } from "../lib/cn";
import { useReducedMotion } from "../lib/use-reduced-motion";
import type { LiveClusterProps } from "../types";

export type { LiveClusterProps };

// Ported from mockup/index.html markup line 997 (`.live-cluster` with
// `.lc-main` + 3 `.lc-spark`) and CSS 648-655.
export function LiveCluster({ label, className }: LiveClusterProps) {
  const reduce = useReducedMotion();
  const spark = "absolute h-[2px] w-[2px] rounded-full bg-[var(--accent)]";

  return (
    <span
      data-live="cluster"
      className={cn("inline-flex items-center gap-1.5", className)}
    >
      <span
        aria-hidden="true"
        className="relative inline-block h-[9px] w-[9px] shrink-0 align-middle"
      >
        <i
          className={cn(
            "absolute inset-[1.5px] rounded-full bg-[var(--accent)]",
            !reduce && "animate-[live_2s_ease-in-out_infinite]",
          )}
        />
        <i
          className={cn(
            spark,
            "left-[2px] top-[-3px]",
            !reduce && "animate-[twinkle_1.4s_ease-in-out_infinite]",
          )}
        />
        <i
          className={cn(
            spark,
            "right-[-4px] top-[2px]",
            !reduce && "animate-[twinkle_1.9s_ease-in-out_0.3s_infinite]",
          )}
        />
        <i
          className={cn(
            spark,
            "bottom-[-3px] left-[1px]",
            !reduce && "animate-[twinkle_1.6s_ease-in-out_0.6s_infinite]",
          )}
        />
      </span>
      {label ? (
        <span className="text-[11px] text-[var(--text-3)]">{label}</span>
      ) : null}
    </span>
  );
}
