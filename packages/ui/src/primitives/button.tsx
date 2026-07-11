import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "../lib/cn";
import type { ButtonProps } from "../types";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold " +
    "transition-colors outline-none " +
    "focus-visible:ring-2 focus-visible:ring-[var(--accent-line)] focus-visible:ring-offset-1 " +
    "focus-visible:ring-offset-[var(--bg)] " +
    "disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "rounded-[var(--radius-sm)] px-3.5 py-2 bg-[var(--primary)] text-[var(--primary-text)] hover:brightness-110",
        ghost:
          "rounded-[var(--radius-sm)] px-3.5 py-2 text-[var(--text-2)] hover:bg-[var(--hover)] hover:text-[var(--text)]",
        outline:
          "rounded-[var(--radius-sm)] px-3.5 py-2 border border-[var(--border)] text-[var(--text-2)] " +
          "hover:bg-[var(--hover)] hover:text-[var(--text)] hover:border-[var(--border-2)]",
        danger:
          "rounded-[var(--radius-sm)] px-3.5 py-2 text-[var(--error)] hover:bg-[var(--hover)]",
        icon:
          "h-[34px] w-[34px] rounded-[var(--radius-xs)] text-[var(--text-2)] " +
          "hover:bg-[var(--hover)] hover:text-[var(--text)]",
      },
    },
    defaultVariants: { variant: "primary" },
  },
);

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
