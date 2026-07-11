import { cn } from "../lib/cn";
import { useReducedMotion } from "../lib/use-reduced-motion";
import type { RoboProps } from "../types";

export type { RoboProps };

// Ported from mockup/index.html lines 961/995 (`.who.bot` avatar) and CSS
// 76-80 (`.eye` blink, `.ant` antenna pulse). Robot-body illustration hex
// fills (#6e756d, #f2f4ee, #17191a) are a fixed illustration palette — the
// mascot looks identical in both themes by design; only the eyes/antenna
// (--accent) are theme-alive.
export function Robo({ size = 30, className }: RoboProps) {
  const reduce = useReducedMotion();
  const antClass = reduce
    ? undefined
    : "animate-[antp_1.9s_ease-in-out_infinite]";
  const eyeClass = reduce
    ? undefined
    : "[transform-box:fill-box] [transform-origin:center] animate-[blinkeye_4.6s_infinite]";

  return (
    <svg
      role="img"
      aria-label="Robo"
      data-mascot="robo"
      width={size}
      height={size}
      viewBox="0 0 64 60"
      fill="none"
      className={cn("shrink-0 overflow-visible", className)}
    >
      <line x1="32" y1="9" x2="32" y2="15" stroke="#6e756d" strokeWidth="2.4" />
      <circle
        className={antClass}
        cx="32"
        cy="6"
        r="3.2"
        fill="var(--accent)"
      />
      <rect x="14" y="15" width="36" height="29" rx="12" fill="#f2f4ee" />
      <rect x="20" y="23" width="24" height="13" rx="6.5" fill="#17191a" />
      <circle
        className={eyeClass}
        cx="27.5"
        cy="29.5"
        r="2.6"
        fill="var(--accent)"
      />
      <circle
        className={eyeClass}
        cx="36.5"
        cy="29.5"
        r="2.6"
        fill="var(--accent)"
      />
    </svg>
  );
}
