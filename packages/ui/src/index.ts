export * from "./types";

export { cn } from "./lib/cn";
export { useReducedMotion } from "./lib/use-reduced-motion";
export type { ClassValue } from "clsx";

export { useThemeStore, resolveTheme, THEME_STORAGE_KEY } from "./store/theme";
export { ThemeProvider, useTheme } from "./providers/ThemeProvider";
export type { ThemeProviderProps } from "./providers/ThemeProvider";
export { ToastProvider, useToast } from "./providers/ToastProvider";
export type { ToastContextValue } from "./providers/ToastProvider";

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

// components
export { CommandPalette } from "./components/CommandPalette/CommandPalette";
export type { CommandPaletteProps } from "./components/CommandPalette/CommandPalette";
export { Composer } from "./components/Composer/Composer";
export { Inspector } from "./components/Inspector/Inspector";
export { LeftRail } from "./components/LeftRail/LeftRail";
export type { LeftRailProps } from "./components/LeftRail/LeftRail";
export { SettingsModal } from "./components/SettingsModal/SettingsModal";
export type { SettingsModalProps } from "./components/SettingsModal/SettingsModal";
export { TopBar } from "./components/TopBar/TopBar";
export { ModelSelector } from "./components/TopBar/ModelSelector";
// NOTE: ModelOption / AgentOption / ModelSelectorProps / TopBarProps are
// already re-exported via `export * from "./types"` above — re-exporting
// them again here would collide (duplicate export of the same binding).
export { Toast } from "./components/Toast/Toast";
// NOTE: ToastProps is already re-exported via `export * from "./types"`
// above (same pattern as ModelSelectorProps/TopBarProps) — re-exporting it
// again here would collide (duplicate export of the same binding).

// mascots
export { Robo } from "./mascots/Robo";
export type { RoboProps } from "./mascots/Robo";
export { Visor } from "./mascots/Visor";
export type { VisorProps } from "./mascots/Visor";

// live primitives
export { LiveDot } from "./live/LiveDot";
export type { LiveDotProps } from "./live/LiveDot";
export { LiveCluster } from "./live/LiveCluster";
export type { LiveClusterProps } from "./live/LiveCluster";
export { StreamShimmer } from "./live/StreamShimmer";
export type { StreamShimmerProps } from "./live/StreamShimmer";
export { TypeCaret } from "./live/TypeCaret";
export type { TypeCaretProps } from "./live/TypeCaret";

// views (main-column bodies)
// NOTE: the view/data prop types (EmptyViewProps, ChatViewProps, ChatMessage,
// StreamingMessage, ToolCardData, CodeViewProps, MarketViewProps,
// PluginCardData) are already re-exported via `export * from "./types"`
// above — not duplicated here.
export { EmptyView } from "./views/EmptyView";
export { ChatView } from "./views/ChatView";
export { Thread } from "./views/Thread";
export { Message } from "./views/Message";
export { ToolCard } from "./views/ToolCard";
export { CodeView } from "./views/CodeView";
export { CodeEditor } from "./views/CodeEditor";
export { MarketView } from "./views/MarketView";
export { PluginCard } from "./views/PluginCard";
export type { ThreadProps } from "./views/Thread";
export type { MessageProps } from "./views/Message";
export type { ToolCardProps } from "./views/ToolCard";
export type { PluginCardProps } from "./views/PluginCard";
