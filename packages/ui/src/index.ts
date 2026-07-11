export * from "./types";

export { cn } from "./lib/cn";
export { useReducedMotion } from "./lib/use-reduced-motion";
export type { ClassValue } from "clsx";

export { useThemeStore, resolveTheme, THEME_STORAGE_KEY } from "./store/theme";
export { ThemeProvider, useTheme } from "./providers/ThemeProvider";
export type { ThemeProviderProps } from "./providers/ThemeProvider";

// primitives
export * from "./primitives/button";
export * from "./primitives/input";
export * from "./primitives/dialog";
export * from "./primitives/dropdown-menu";
export * from "./primitives/popover";
export * from "./primitives/tabs";
export * from "./primitives/switch";
export * from "./primitives/tooltip";
// NOTE: command.tsx's cmdk `CommandItem` component name collides with the
// canonical `CommandItem` domain type in ./types (command-palette row data,
// consumed by CommandPaletteProps). The type wins the unaliased barrel name
// since it's the public contract external consumers (e.g. apps/web) import;
// within the package, the component is imported directly via a relative
// path (see Task 10/11's CommandPalette), so aliasing it here is safe.
export {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandSeparator,
  CommandItem as CommandRowItem,
  CommandShortcut,
} from "./primitives/command";
