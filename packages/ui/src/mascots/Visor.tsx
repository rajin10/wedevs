import { cn } from "../lib/cn";
import { useReducedMotion } from "../lib/use-reduced-motion";
import type { VisorProps } from "../types";

export type { VisorProps };

// Ported from mockup/index.html lines 901-913 (`.hero-bot` wrapper +
// `.visor-svg` + `.hero-shadow`) and CSS 560-571. Robot-body illustration
// hex fills (#3a3e40, #2c2f30, #0f1112, #33373a) are a fixed illustration
// palette — identical in both themes by design; only the antenna, scanline,
// body stroke (--accent-line) and hero glow (--accent-soft) are theme-alive.
export function Visor({ className }: VisorProps) {
  const reduce = useReducedMotion();
  const svgAnim = reduce ? "" : "animate-[bob_3.4s_ease-in-out_infinite]";
  const scanAnim = reduce ? "" : "animate-[scan_2.6s_ease-in-out_infinite]";
  const antAnim = reduce ? "" : "animate-[antp_1.9s_ease-in-out_infinite]";
  const shadowAnim = reduce ? "" : "animate-[hsh_3.4s_ease-in-out_infinite]";

  return (
    <div
      data-mascot="visor"
      className={cn(
        "relative mb-5 inline-flex flex-col items-center",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-1.5 left-1/2 -z-10 h-[130px] w-[210px] -translate-x-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle, var(--accent-soft), transparent 66%)",
        }}
      />
      <svg
        aria-hidden="true"
        width="118"
        height="110"
        viewBox="0 0 64 60"
        fill="none"
        className={cn(
          "[filter:drop-shadow(0_12px_22px_rgba(0,0,0,0.26))]",
          svgAnim,
        )}
      >
        <line
          x1="32"
          y1="6"
          x2="32"
          y2="14"
          stroke="var(--text-3)"
          strokeWidth="2"
        />
        <circle
          className={antAnim}
          cx="32"
          cy="4.4"
          r="2.6"
          fill="var(--accent)"
        />
        <rect x="8.5" y="24" width="4.5" height="9" rx="2.2" fill="#3a3e40" />
        <rect x="51" y="24" width="4.5" height="9" rx="2.2" fill="#3a3e40" />
        <rect
          x="12"
          y="14"
          width="40"
          height="32"
          rx="14"
          fill="#2c2f30"
          stroke="var(--accent-line)"
        />
        <rect x="18" y="25" width="28" height="11" rx="5.5" fill="#0f1112" />
        <rect
          className={scanAnim}
          x="20"
          y="27.5"
          width="8"
          height="6"
          rx="3"
          fill="var(--accent)"
        />
        <rect x="23" y="49" width="18" height="8" rx="4" fill="#33373a" />
      </svg>
      <span
        aria-hidden="true"
        className={cn(
          "mt-[5px] h-[9px] w-14 rounded-full opacity-50 [background:rgba(0,0,0,0.26)] [filter:blur(4px)]",
          shadowAnim,
        )}
      />
    </div>
  );
}
