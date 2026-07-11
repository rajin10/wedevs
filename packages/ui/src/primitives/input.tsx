import * as React from "react";
import { cn } from "../lib/cn";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "flex h-9 w-full rounded-[var(--radius-xs)] border border-[var(--border)] " +
          "bg-[var(--surface)] px-3 py-1 text-sm text-[var(--text)] " +
          "placeholder:text-[var(--text-3)] outline-none transition-colors " +
          "focus-visible:border-[var(--accent-line)] focus-visible:ring-2 focus-visible:ring-[var(--accent-line)] " +
          "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
