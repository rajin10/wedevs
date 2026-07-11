import * as React from "react";
import { Command as CommandPrimitive } from "cmdk";
import { Search } from "lucide-react";
import { cn } from "../lib/cn";

export const Command = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn(
      "flex h-full w-full flex-col overflow-hidden rounded-[16px] bg-[var(--elevated)] text-[var(--text)]",
      className,
    )}
    {...props}
  />
));
Command.displayName = "Command";

export const CommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
  <div className="flex items-center gap-[11px] border-b border-[var(--border)] px-[17px] py-[15px]">
    <Search className="h-4 w-4 shrink-0 text-[var(--text-3)]" />
    <CommandPrimitive.Input
      ref={ref}
      className={cn(
        "flex-1 bg-transparent text-base outline-none placeholder:text-[var(--text-3)] disabled:opacity-50",
        className,
      )}
      {...props}
    />
  </div>
));
CommandInput.displayName = "CommandInput";

export const CommandList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn("max-h-[340px] overflow-y-auto p-2", className)}
    {...props}
  />
));
CommandList.displayName = "CommandList";

export const CommandEmpty = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>((props, ref) => (
  <CommandPrimitive.Empty
    ref={ref}
    className="py-6 text-center text-sm text-[var(--text-3)]"
    {...props}
  />
));
CommandEmpty.displayName = "CommandEmpty";

export const CommandGroup = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    className={cn(
      "[&_[cmdk-group-heading]]:px-[11px] [&_[cmdk-group-heading]]:pb-[5px] [&_[cmdk-group-heading]]:pt-[9px] " +
        "[&_[cmdk-group-heading]]:text-[10.5px] [&_[cmdk-group-heading]]:font-bold " +
        "[&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.07em] " +
        "[&_[cmdk-group-heading]]:text-[var(--text-3)]",
      className,
    )}
    {...props}
  />
));
CommandGroup.displayName = "CommandGroup";

export const CommandSeparator = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Separator
    ref={ref}
    className={cn("mx-1 my-1 h-px bg-[var(--border)]", className)}
    {...props}
  />
));
CommandSeparator.displayName = "CommandSeparator";

export const CommandItem = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      "flex cursor-pointer select-none items-center gap-[11px] rounded-[9px] px-[11px] py-2.5 " +
        "text-[13.5px] text-[var(--text-2)] outline-none " +
        "data-[selected=true]:bg-[var(--hover)] data-[selected=true]:text-[var(--text)]",
      className,
    )}
    {...props}
  />
));
CommandItem.displayName = "CommandItem";

export function CommandShortcut({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "ml-auto font-mono text-[11px] text-[var(--text-3)]",
        className,
      )}
      {...props}
    />
  );
}
