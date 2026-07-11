import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "../lib/cn";

export const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root
    ref={ref}
    className={cn(
      "peer inline-flex h-[22px] w-[38px] shrink-0 items-center rounded-full " +
        "bg-[var(--border-2)] transition-colors outline-none " +
        "focus-visible:ring-2 focus-visible:ring-[var(--accent-line)] focus-visible:ring-offset-1 " +
        "focus-visible:ring-offset-[var(--bg)] " +
        "data-[state=checked]:bg-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  >
    <SwitchPrimitive.Thumb
      className={cn(
        "pointer-events-none block h-[18px] w-[18px] rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,.3)] " +
          "translate-x-[2px] transition-transform data-[state=checked]:translate-x-[18px]",
      )}
    />
  </SwitchPrimitive.Root>
));
Switch.displayName = "Switch";
