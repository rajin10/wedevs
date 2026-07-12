import { cn } from "../../lib/cn";
import { useReducedMotion } from "../../lib/use-reduced-motion";
import { LiveDot } from "../../live/LiveDot";
import type { ToastProps } from "../../types";

export type { ToastProps };

// Ported from mockup/index.html CSS 692-697 (`.toast`, `.toast.show`) + markup 1333.
export function Toast({ message, visible }: ToastProps) {
  const reduced = useReducedMotion();

  return (
    <div
      role="status"
      aria-live="polite"
      aria-hidden={!visible}
      data-visible={visible ? "true" : "false"}
      className={cn(
        // position + layout (mockup .toast 693-694)
        "fixed left-1/2 bottom-[74px] z-[210] flex items-center gap-[9px]",
        "px-4 py-[10px] rounded-full pointer-events-none",
        // neutral pill body (mockup .toast 695-696) — NO accent here
        "bg-[var(--elevated)] border border-[var(--border-2)]",
        "shadow-[var(--shadow),inset_0_1px_0_rgba(255,255,255,0.05)]",
        "text-[13px] font-semibold text-[var(--text)]",
        // horizontal centering transform is always present
        "-translate-x-1/2",
        // show/hide (mockup .toast / .toast.show 696-697)
        reduced
          ? // instant: no transition, no vertical offset
            visible
            ? "opacity-100"
            : "opacity-0"
          : cn(
              "transition-[opacity,transform] duration-200 ease-out",
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3",
            ),
      )}
    >
      <LiveDot />
      <span>{message}</span>
    </div>
  );
}
