import type * as React from "react";

// ── theme (store + provider live in their own files; these TYPES are shared) ──
export type ThemeMode = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";
export interface ThemeState {
  mode: ThemeMode;
  resolved: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
}

// ── domain enums ──
export type ViewMode = "empty" | "chat" | "market" | "code";
export type PanelMode = "closed" | "float" | "pinned";
export type RailMode = "expanded" | "collapsed" | "open";
export type InspectorTab = "file" | "output" | "details" | "config";
export type NavKey = "chat" | "code" | "market";
export type RecentGroup = "pinned" | "today" | "previous7" | "projects";
export type ChatRowAction = "pin" | "rename" | "archive" | "delete";
export type AccountAction = "profile" | "settings" | "upgrade" | "logout";
export type SettingsPane =
  "account" | "appearance" | "models" | "plugins" | "data" | "keys";

// ── data shapes ──
export interface NavItem {
  id: NavKey;
  label: string;
  icon: React.ReactNode;
  kbd?: string;
}
export interface RecentChat {
  id: string;
  title: string;
  group: RecentGroup;
  pinned?: boolean;
}
export interface Project {
  id: string;
  name: string;
  count: number;
}
export interface Account {
  name: string;
  email: string;
  plan: string;
  initials: string;
}
export interface ModelOption {
  id: string;
  name: string;
  group: "frontier" | "fast" | "local";
  sub?: string;
  tags: string[];
}
export interface AgentOption {
  id: string;
  name: string;
  persona: string;
  specialty: string;
}
export interface Attachment {
  id: string;
  name: string;
  sub: string;
  kind: "image" | "doc";
  progress?: number;
}
export interface CommandItem {
  id: string;
  label: string;
  kbd?: string;
  group: "actions" | "recent" | "models";
  onSelect: () => void;
}

// ── Inspector pane payloads ──
export interface FilePreviewData {
  name: string;
  size: string;
  dims: string;
  src?: string;
}
export interface OutputKV {
  label: string;
  value: string;
}
export interface OutputData {
  title: string;
  percent: number;
  rows: OutputKV[];
}
export interface ModelParam {
  label: string;
  value: number;
  min: number;
  max: number;
}
export interface ModelDetails {
  name: string;
  sub: string;
  params: ModelParam[];
  tools: { label: string; on: boolean }[];
}
export interface PluginConfigData {
  name: string;
  publisher: string;
  connected: boolean;
  permissions: { label: string; on: boolean }[];
}

// ── primitive prop types (re-skinned shadcn) ──
export type ButtonVariant = "primary" | "ghost" | "outline" | "danger" | "icon";
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  asChild?: boolean;
}

// ── live primitives + mascots ──
export interface LiveDotProps {
  className?: string;
}
export interface LiveClusterProps {
  label?: string;
  className?: string;
}
export interface StreamShimmerProps {
  text: string;
  className?: string;
}
export interface TypeCaretProps {
  className?: string;
}
export interface RoboProps {
  size?: number;
  className?: string;
}
export interface VisorProps {
  className?: string;
}

// ── component props (one component per file; props come from here) ──
export interface AppShellProps {
  view: ViewMode;
  panel: PanelMode;
  rail: RailMode;
  onPanelChange: (panel: PanelMode) => void;
  onRailChange: (rail: RailMode) => void;
  leftRail: React.ReactNode;
  topBar: React.ReactNode;
  main: React.ReactNode;
  inspector?: React.ReactNode;
  dragging?: boolean;
}
export interface LeftRailProps {
  mode: RailMode;
  nav: NavItem[];
  activeNav: NavKey;
  recents: RecentChat[];
  projects: Project[];
  account: Account;
  brandLogo?: React.ReactNode;
  onNavSelect: (id: NavKey) => void;
  onNewChat: () => void;
  onSearch: () => void;
  onToggleCollapse: () => void;
  onRenameChat: (id: string, title: string) => void;
  onChatAction: (id: string, action: ChatRowAction) => void;
  onAccountAction: (action: AccountAction) => void;
}
export interface ModelSelectorProps {
  models: ModelOption[];
  agents: AgentOption[];
  selectedModelId: string;
  onSelectModel: (id: string) => void;
  variant?: "topbar" | "pill";
}
export interface TopBarProps {
  title: string;
  onTitleChange: (title: string) => void;
  selector: ModelSelectorProps;
  panel: PanelMode;
  onPanelToggle: () => void;
  onPanelPin: () => void;
  onShare: () => void;
  onChatMenu: () => void;
  onRailOpen: () => void;
}
export interface ComposerProps {
  variant: "empty" | "chat";
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  attachments: Attachment[];
  attachOpen: boolean;
  onAttach: () => void;
  onRemoveAttachment: (id: string) => void;
  toolsOn: boolean;
  onToggleTools: () => void;
  onVoice: () => void;
  agentPill: React.ReactNode;
  dragging?: boolean;
  toolCount?: number;
}
export interface InspectorProps {
  mode: PanelMode;
  tab: InspectorTab;
  onTabChange: (tab: InspectorTab) => void;
  onPin: () => void;
  onClose: () => void;
  file?: FilePreviewData;
  output?: OutputData;
  model?: ModelDetails;
  config?: PluginConfigData;
}
export interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actions: CommandItem[];
  recents: CommandItem[];
  models: CommandItem[];
}
export interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pane: SettingsPane;
  onPaneChange: (pane: SettingsPane) => void;
  themeMode: ThemeMode;
  onThemeChange: (mode: ThemeMode) => void;
}
export interface ToastProps {
  message: string | null;
  visible: boolean;
}

// ── views (main-column bodies) ──
export interface ToolCardData {
  id: string;
  name: string;
  desc: string;
  done?: string;
  rows: OutputKV[];
}
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  model?: string;
  time: string;
  text: string;
  attachments?: Attachment[];
  tool?: ToolCardData;
}
export interface StreamingMessage {
  model: string;
  runningTool?: ToolCardData;
  partialText: string;
}
export interface EmptyViewProps {
  greeting: string;
  starters: string[];
  composer: ComposerProps;
}
export interface ChatViewProps {
  messages: ChatMessage[];
  streaming?: StreamingMessage;
  composer: ComposerProps;
  onOpenOutput: (id: string) => void;
}
export interface CodeViewProps {
  repo: string;
  branch: string;
  sync: string;
  onAction: (a: "run" | "pr" | "commit") => void;
}
export interface PluginCardData {
  id: string;
  name: string;
  publisher: string;
  verified?: boolean;
  desc: string;
  tags: string[];
  enabled: boolean;
}
export interface MarketViewProps {
  plugins: PluginCardData[];
  onToggle: (id: string, on: boolean) => void;
  onConfigure: (id: string) => void;
}
