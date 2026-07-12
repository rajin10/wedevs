"use client";
import * as React from "react";
import {
  AppShell,
  LeftRail,
  TopBar,
  ModelSelector,
  Inspector,
  CommandPalette,
  SettingsModal,
  EmptyView,
  ChatView,
  CodeView,
  MarketView,
  useTheme,
  useToast,
} from "@wedevs/ui";
import type {
  ComposerProps,
  ModelSelectorProps,
  CommandItem,
  InspectorTab,
  PanelMode,
} from "@wedevs/ui";
import { useUIStore } from "@/store/ui";
import * as fx from "./fixtures";

type JumpPreset =
  | "empty"
  | "chat"
  | "code"
  | "market"
  | "file"
  | "inspect"
  | "settings"
  | "selector";

/**
 * SSR-safe media-query subscription mirroring AppShell's own internal
 * `useMediaQuery` (Task 14, AppShell.tsx). AppShell is an opaque geometry
 * component and never reaches into the `inspector` node it's given, so this
 * page must independently compute the SAME "pinned -> overlay below 1180px"
 * reflow AppShell applies to its `.inspector-wrap` container, and pass that
 * *effective* mode into <Inspector/> so the component's own internal width
 * classing (`modeClass` in Inspector.tsx) stays in sync with the wrapper
 * geometry AppShell renders around it (binding reconciliation #3).
 */
function useMediaQuery(query: string): boolean {
  const subscribe = React.useCallback(
    (onChange: () => void): (() => void) => {
      if (
        typeof window === "undefined" ||
        typeof window.matchMedia !== "function"
      ) {
        return () => {};
      }
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query],
  );
  const getSnapshot = React.useCallback((): boolean => {
    if (
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    )
      return false;
    return window.matchMedia(query).matches;
  }, [query]);
  const getServerSnapshot = React.useCallback((): boolean => false, []);
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export default function ShellPage() {
  const s = useUIStore();
  const theme = useTheme();
  const toast = useToast();

  // Same breakpoint AppShell.tsx uses for the pinned -> float reflow.
  const belowPin = useMediaQuery("(max-width: 1180px)");
  const effectivePanel: PanelMode =
    s.panel === "pinned" && belowPin ? "float" : s.panel;

  // ----- shared selector config -----
  const selector: ModelSelectorProps = {
    models: fx.models,
    agents: fx.agents,
    selectedModelId: s.selectedModelId,
    onSelectModel: s.setSelectedModel,
  };

  // ----- composer (shared by empty + chat views) -----
  const composer: ComposerProps = {
    variant: s.view === "empty" ? "empty" : "chat",
    value: s.composerValue,
    onChange: s.setComposerValue,
    onSubmit: () => {
      if (s.composerValue.trim() === "") return;
      toast.show("Message sent");
      s.setComposerValue("");
    },
    attachments: s.attach ? s.attachments : [],
    attachOpen: s.attachOpen,
    onAttach: s.toggleAttach,
    onRemoveAttachment: s.removeAttachment,
    toolsOn: s.toolsOn,
    onToggleTools: s.toggleTools,
    onVoice: () => toast.show("Voice input (demo)"),
    agentPill: <ModelSelector variant="pill" {...selector} />,
    dragging: s.dragging,
    toolCount: 4,
  };

  // ----- command palette items -----
  const paletteActions: CommandItem[] = [
    {
      id: "new",
      label: "New chat",
      kbd: "⌘N",
      group: "actions",
      onSelect: () => {
        s.newChat();
        s.setPaletteOpen(false);
      },
    },
    {
      id: "code",
      label: "Open Code",
      group: "actions",
      onSelect: () => {
        s.selectNav("code");
        s.setPaletteOpen(false);
      },
    },
    {
      id: "settings",
      label: "Settings",
      kbd: "⌘,",
      group: "actions",
      onSelect: () => {
        s.setSettingsOpen(true);
        s.setPaletteOpen(false);
      },
    },
  ];
  const paletteRecents: CommandItem[] = fx.recents.slice(0, 3).map((r) => ({
    id: r.id,
    label: r.title,
    group: "recent",
    onSelect: () => {
      s.selectNav("chat");
      s.setPaletteOpen(false);
    },
  }));
  const paletteModels: CommandItem[] = fx.models.slice(0, 3).map((m) => ({
    id: m.id,
    label: m.name,
    group: "models",
    onSelect: () => {
      s.setSelectedModel(m.id);
      s.setPaletteOpen(false);
    },
  }));

  // ----- jump() presets (mockup 1537-1549) for the demo dev-bar -----
  function jump(preset: JumpPreset) {
    switch (preset) {
      case "empty":
        s.newChat();
        break;
      case "chat":
        s.setView("chat");
        s.setPanel("closed");
        s.setAttach(false);
        s.setActiveNav("chat");
        break;
      case "code":
        s.selectNav("code");
        break;
      case "market":
        s.selectNav("market");
        break;
      case "file":
        s.setView("chat");
        s.setActiveNav("chat");
        s.setAttach(true);
        s.openInspector("file");
        break;
      case "inspect":
        s.setView("chat");
        s.setActiveNav("chat");
        s.openInspector("output");
        break;
      case "settings":
        s.setSettingsOpen(true);
        s.setSettingsPane("appearance");
        break;
      case "selector":
        s.setView("chat");
        s.setActiveNav("chat");
        break;
    }
  }

  // ----- main-column body per view -----
  function renderMain() {
    switch (s.view) {
      case "empty":
        return (
          <EmptyView
            greeting={fx.greeting}
            starters={fx.starters}
            composer={composer}
          />
        );
      case "chat":
        return (
          <ChatView
            messages={fx.messages}
            streaming={fx.streaming}
            composer={composer}
            onOpenOutput={() => s.openInspector("output")}
          />
        );
      case "code":
        return (
          <CodeView
            repo={fx.codeMeta.repo}
            branch={fx.codeMeta.branch}
            sync={fx.codeMeta.sync}
            onAction={(a) =>
              toast.show(
                a === "run"
                  ? "Build started · running…"
                  : a === "pr"
                    ? "Pull request opened → #128"
                    : "Committed to main · 3 files",
              )
            }
          />
        );
      case "market":
        return (
          <MarketView
            plugins={fx.plugins}
            onToggle={(_id, on) =>
              toast.show(on ? "Plugin enabled" : "Plugin disabled")
            }
            onConfigure={() => s.openInspector("config")}
          />
        );
    }
  }

  const leftRail = (
    <LeftRail
      mode={s.rail}
      nav={fx.nav}
      activeNav={s.activeNav}
      recents={fx.recents}
      projects={fx.projects}
      account={fx.account}
      onNavSelect={s.selectNav}
      onNewChat={s.newChat}
      onSearch={() => s.setPaletteOpen(true)}
      onToggleCollapse={s.toggleRail}
      onRenameChat={() => {}}
      onChatAction={() => {}}
      onAccountAction={(action) => {
        if (action === "settings") s.setSettingsOpen(true);
        else if (action === "logout") toast.show("Signed out (demo)");
      }}
    />
  );

  const topBar = (
    <TopBar
      title={s.title}
      onTitleChange={s.setTitle}
      selector={{ ...selector, variant: "topbar" }}
      panel={s.panel}
      onPanelToggle={s.togglePanel}
      onPanelPin={s.pinPanel}
      onShare={() => toast.show("Link copied to clipboard")}
      onChatMenu={() => {}}
      onRailOpen={() => s.setRail("open")}
    />
  );

  const inspector =
    s.panel === "closed" ? undefined : (
      <Inspector
        mode={effectivePanel}
        tab={s.inspectorTab}
        onTabChange={(t: InspectorTab) => s.setInspectorTab(t)}
        onPin={s.pinPanel}
        onClose={() => s.setPanel("closed")}
        file={fx.filePreview}
        output={fx.outputData}
        model={fx.modelDetails}
        config={fx.pluginConfig}
      />
    );

  const jumps: JumpPreset[] = [
    "empty",
    "chat",
    "code",
    "file",
    "inspect",
    "market",
    "selector",
    "settings",
  ];

  return (
    <>
      <AppShell
        view={s.view}
        panel={s.panel}
        rail={s.rail}
        onPanelChange={s.setPanel}
        onRailChange={s.setRail}
        leftRail={leftRail}
        topBar={topBar}
        main={renderMain()}
        inspector={inspector}
        dragging={s.dragging}
      />

      <CommandPalette
        open={s.paletteOpen}
        onOpenChange={s.setPaletteOpen}
        actions={paletteActions}
        recents={paletteRecents}
        models={paletteModels}
      />

      <SettingsModal
        open={s.settingsOpen}
        onOpenChange={s.setSettingsOpen}
        pane={s.settingsPane}
        onPaneChange={s.setSettingsPane}
        themeMode={theme.mode}
        onThemeChange={theme.setMode}
      />

      {/* demo dev-bar — the one accent-glow-allowed surface (mock-dev-bar). */}
      <div
        data-testid="dev-bar"
        className="fixed bottom-3 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-[var(--radius)] border border-[--accent-line] bg-[--elevated] px-2 py-1.5 shadow-[var(--shadow)] shadow-[0_0_24px_var(--accent-soft)]"
      >
        {jumps.map((k) => (
          <button
            key={k}
            type="button"
            data-jump={k}
            onClick={() => jump(k)}
            className="rounded-[var(--radius-xs)] px-2 py-1 text-xs text-[--text-2] hover:bg-[--hover] hover:text-[--text] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[--accent-line]"
          >
            {k}
          </button>
        ))}
        <button
          type="button"
          data-testid="theme-toggle"
          onClick={theme.toggle}
          className="ml-1 rounded-[var(--radius-xs)] border border-[--border] px-2 py-1 text-xs text-[--text] hover:bg-[--hover] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[--accent-line]"
        >
          Theme: {theme.resolved}
        </button>
      </div>
    </>
  );
}
