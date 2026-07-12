"use client";
import { create } from "zustand";
import type {
  ViewMode,
  PanelMode,
  RailMode,
  InspectorTab,
  NavKey,
  SettingsPane,
  Attachment,
} from "@wedevs/ui";

export interface UIState {
  view: ViewMode;
  panel: PanelMode;
  rail: RailMode;
  attach: boolean;
  dragging: boolean;
  activeNav: NavKey;
  title: string;
  selectedModelId: string;
  composerValue: string;
  attachments: Attachment[];
  attachOpen: boolean;
  toolsOn: boolean;
  inspectorTab: InspectorTab;
  paletteOpen: boolean;
  settingsOpen: boolean;
  settingsPane: SettingsPane;

  setView: (view: ViewMode) => void;
  setPanel: (panel: PanelMode) => void;
  setRail: (rail: RailMode) => void;
  setAttach: (attach: boolean) => void;
  setDragging: (dragging: boolean) => void;
  setActiveNav: (nav: NavKey) => void;
  setTitle: (title: string) => void;
  setSelectedModel: (id: string) => void;
  setComposerValue: (value: string) => void;
  removeAttachment: (id: string) => void;
  toggleAttach: () => void;
  toggleTools: () => void;
  setInspectorTab: (tab: InspectorTab) => void;
  setPaletteOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  setSettingsPane: (pane: SettingsPane) => void;

  // composed transitions (ported from mockup)
  togglePanel: () => void; // closed <-> float          (mockup 1422)
  pinPanel: () => void; // pinned <-> float           (mockup 1426)
  toggleRail: () => void; // collapsed <-> expanded     (mockup 1455)
  openInspector: (tab: InspectorTab) => void; // (mockup 1485)
  newChat: () => void; // (mockup 1583)
  selectNav: (nav: NavKey) => void; // nav -> view (mockup 1584/1585/1586)
}

export const initialUIState: Pick<
  UIState,
  | "view"
  | "panel"
  | "rail"
  | "attach"
  | "dragging"
  | "activeNav"
  | "title"
  | "selectedModelId"
  | "composerValue"
  | "attachments"
  | "attachOpen"
  | "toolsOn"
  | "inspectorTab"
  | "paletteOpen"
  | "settingsOpen"
  | "settingsPane"
> = {
  view: "empty",
  panel: "closed",
  rail: "expanded",
  attach: false,
  dragging: false,
  activeNav: "chat",
  title: "Q3 go-to-market analysis",
  selectedModelId: "opus-4",
  composerValue: "",
  // Two demo attachments seeded so the `file` screen has a populated tray
  // (mockup data-attach="1").
  attachments: [
    {
      id: "a1",
      name: "q3-forecast.xlsx",
      sub: "Spreadsheet · 240 KB",
      kind: "doc",
    },
    { id: "a2", name: "channel-mix.png", sub: "Image · 1.2 MB", kind: "image" },
  ],
  attachOpen: false,
  toolsOn: false,
  inspectorTab: "output",
  paletteOpen: false,
  settingsOpen: false,
  settingsPane: "appearance",
};

export const useUIStore = create<UIState>((set) => ({
  ...initialUIState,

  setView: (view) => set({ view }),
  setPanel: (panel) => set({ panel }),
  setRail: (rail) => set({ rail }),
  setAttach: (attach) => set({ attach }),
  setDragging: (dragging) => set({ dragging }),
  setActiveNav: (activeNav) => set({ activeNav }),
  setTitle: (title) => set({ title }),
  setSelectedModel: (selectedModelId) => set({ selectedModelId }),
  setComposerValue: (composerValue) => set({ composerValue }),
  removeAttachment: (id) =>
    set((s) => ({ attachments: s.attachments.filter((a) => a.id !== id) })),
  toggleAttach: () => set((s) => ({ attach: !s.attach })),
  toggleTools: () => set((s) => ({ toolsOn: !s.toolsOn })),
  setInspectorTab: (inspectorTab) => set({ inspectorTab }),
  setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
  setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
  setSettingsPane: (settingsPane) => set({ settingsPane }),

  // closed <-> float (mockup panelToggle, 1422)
  togglePanel: () =>
    set((s) => ({ panel: s.panel === "closed" ? "float" : "closed" })),
  // pinned <-> float (mockup panelPin, 1426)
  pinPanel: () =>
    set((s) => ({ panel: s.panel === "pinned" ? "float" : "pinned" })),
  // collapsed <-> expanded, desktop branch (mockup railToggle, 1457)
  toggleRail: () =>
    set((s) => ({ rail: s.rail === "collapsed" ? "expanded" : "collapsed" })),
  // (mockup openInspector, 1485)
  openInspector: (tab) =>
    set((s) => ({
      inspectorTab: tab,
      panel: s.panel === "closed" ? "float" : s.panel,
    })),
  // (mockup new-chat handler, 1583)
  newChat: () =>
    set({
      view: "empty",
      panel: "closed",
      attach: false,
      activeNav: "chat",
      composerValue: "",
    }),
  // nav -> view (mockup chat/code/market handlers, 1584-1586)
  selectNav: (nav) =>
    set({
      activeNav: nav,
      view: nav === "code" ? "code" : nav === "market" ? "market" : "chat",
      panel: "closed",
    }),
}));
