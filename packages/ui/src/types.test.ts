import { describe, it, expect } from "vitest";
import type {
  ViewMode,
  PanelMode,
  RailMode,
  InspectorTab,
  NavKey,
  ThemeMode,
  NavItem,
  RecentChat,
  Project,
  Account,
  ModelOption,
  AgentOption,
  Attachment,
  CommandItem,
  ModelSelectorProps,
  TopBarProps,
  ComposerProps,
  InspectorProps,
  AppShellProps,
  LeftRailProps,
  CommandPaletteProps,
  SettingsModalProps,
  ChatMessage,
  PluginCardData,
} from "./types";

describe("shared types", () => {
  it("expose the canonical domain + prop shapes", () => {
    const view: ViewMode = "chat";
    const panel: PanelMode = "pinned";
    const rail: RailMode = "expanded";
    const tab: InspectorTab = "file";
    const nav: NavKey = "chat";
    const mode: ThemeMode = "system";

    const model: ModelOption = {
      id: "m1",
      name: "Opus 4",
      group: "frontier",
      sub: "200K",
      tags: ["reasoning", "vision"],
    };
    const agent: AgentOption = {
      id: "a1",
      name: "Atlas",
      persona: "Planner",
      specialty: "Research",
    };
    const att: Attachment = {
      id: "f1",
      name: "q3.xlsx",
      sub: "Spreadsheet · 240 KB",
      kind: "doc",
    };
    const item: NavItem = { id: "chat", label: "Chats", icon: null };
    const recent: RecentChat = { id: "c1", title: "Hi", group: "today" };
    const project: Project = { id: "p1", name: "Wedevs", count: 3 };
    const account: Account = {
      name: "Rajin",
      email: "r@x.co",
      plan: "free",
      initials: "R",
    };
    const cmd: CommandItem = {
      id: "x",
      label: "New chat",
      group: "actions",
      onSelect: () => {},
    };
    const msg: ChatMessage = {
      id: "1",
      role: "user",
      time: "now",
      text: "hey",
    };
    const plugin: PluginCardData = {
      id: "p",
      name: "GH",
      publisher: "wedevs",
      desc: "d",
      tags: [],
      enabled: true,
    };

    const selector: ModelSelectorProps = {
      models: [model],
      agents: [agent],
      selectedModelId: "m1",
      onSelectModel: () => {},
    };
    const topbar: TopBarProps = {
      title: "T",
      onTitleChange: () => {},
      selector,
      panel,
      onPanelToggle: () => {},
      onPanelPin: () => {},
      onShare: () => {},
      onChatMenu: () => {},
      onRailOpen: () => {},
    };
    const composer: ComposerProps = {
      variant: "chat",
      value: "",
      onChange: () => {},
      onSubmit: () => {},
      attachments: [att],
      attachOpen: false,
      onAttach: () => {},
      onRemoveAttachment: () => {},
      toolsOn: false,
      onToggleTools: () => {},
      onVoice: () => {},
      agentPill: null,
    };
    const inspector: InspectorProps = {
      mode: panel,
      tab,
      onTabChange: () => {},
      onPin: () => {},
      onClose: () => {},
    };
    const shell: AppShellProps = {
      view,
      panel,
      rail,
      onPanelChange: () => {},
      onRailChange: () => {},
      leftRail: null,
      topBar: null,
      main: null,
    };
    const leftRail: LeftRailProps = {
      mode: rail,
      nav: [item],
      activeNav: nav,
      recents: [recent],
      projects: [project],
      account,
      onNavSelect: () => {},
      onNewChat: () => {},
      onSearch: () => {},
      onToggleCollapse: () => {},
      onRenameChat: () => {},
      onChatAction: () => {},
      onAccountAction: () => {},
    };
    const palette: CommandPaletteProps = {
      open: false,
      onOpenChange: () => {},
      actions: [cmd],
      recents: [],
      models: [],
    };
    const settings: SettingsModalProps = {
      open: false,
      onOpenChange: () => {},
      pane: "appearance",
      onPaneChange: () => {},
      themeMode: mode,
      onThemeChange: () => {},
    };

    expect([view, panel, rail, tab, nav, mode]).toHaveLength(6);
    expect([
      model,
      agent,
      att,
      item,
      recent,
      project,
      account,
      cmd,
      msg,
      plugin,
    ]).toHaveLength(10);
    expect([
      selector,
      topbar,
      composer,
      inspector,
      shell,
      leftRail,
      palette,
      settings,
    ]).toHaveLength(8);
  });
});
