"use client";

import * as React from "react";
import type { AppShellProps, PanelMode } from "../../types";
import "./AppShell.css";

export type { AppShellProps };

/**
 * SSR-safe media-query subscription — same `useSyncExternalStore` pattern as
 * `../../lib/use-reduced-motion.ts`. Resolves synchronously on the first
 * client render (no extra effect-triggered re-render) and reports `false`
 * on the server / before hydration.
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
    ) {
      return false;
    }
    return window.matchMedia(query).matches;
  }, [query]);
  const getServerSnapshot = React.useCallback((): boolean => false, []);
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

function DropIcon(): React.ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      width="30"
      height="30"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M7 10l5 5 5-5M12 15V3" />
    </svg>
  );
}

/**
 * AppShell — the Adaptive Canvas. Owns shell *geometry* only: a left rail
 * slot, a top bar spanning main+inspector, a fluid main column, and a right
 * Inspector that floats or pins. `leftRail`/`topBar`/`main`/`inspector` are
 * opaque `React.ReactNode`s produced by Tasks 8/9/12/13-14 — AppShell never
 * reaches into a child's internal classes or state. The mobile rail drawer
 * and the Inspector's pinned/float/sheet container are AppShell's OWN
 * `.rail-wrap` / `.inspector-wrap` wrappers, keyed off data-* attributes
 * AppShell itself stamps (see AppShell.css for why).
 */
export function AppShell(props: AppShellProps) {
  const {
    view,
    panel,
    rail,
    onPanelChange,
    onRailChange,
    leftRail,
    topBar,
    main,
    inspector,
    dragging = false,
  } = props;

  // Breakpoints are read in JS (not CSS media queries) so the collapses are
  // deterministically unit-testable via a `matchMedia` mock.
  const belowPin = useMediaQuery("(max-width: 1180px)"); // pinned -> overlay
  const belowDrawer = useMediaQuery("(max-width: 900px)"); // rail -> drawer

  // A pinned Inspector reflows to a floating overlay on narrow viewports.
  const effectivePanel: PanelMode =
    panel === "pinned" && belowPin ? "float" : panel;

  // Conditionally mounted (not kept at width:0) so "closed hides Inspector"
  // is assertable in jsdom, which doesn't compute stylesheet layout.
  const showInspector = effectivePanel !== "closed" && inspector != null;
  const showDrop = dragging && view === "chat";

  const closeRail = React.useCallback((): void => {
    if (rail === "open") onRailChange("collapsed");
  }, [rail, onRailChange]);

  const onKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>): void => {
      if (e.key === "Escape" && effectivePanel === "float") {
        onPanelChange("closed");
      }
    },
    [effectivePanel, onPanelChange],
  );

  return (
    <div
      className="app"
      data-testid="app-shell"
      data-view={view}
      data-panel={effectivePanel}
      data-rail={rail}
      data-drawer={belowDrawer ? "1" : "0"}
      data-dragging={showDrop ? "1" : "0"}
      onKeyDown={onKeyDown}
    >
      {/* mobile rail drawer scrim — AppShell-owned; LeftRail's own internals
          and its 266<->60 collapse (Task 8) are untouched */}
      <div
        className="rail-scrim"
        data-testid="rail-scrim"
        aria-hidden="true"
        onClick={closeRail}
      />

      <div className="rail-wrap">{leftRail}</div>

      <div className="workspace">
        {topBar}
        <div className="body">
          <main className="main">
            {main}
            {showDrop ? (
              <div className="drop" role="presentation" data-testid="file-drop">
                <DropIcon />
                <span>Drop files to attach</span>
              </div>
            ) : null}
          </main>
          {showInspector ? (
            <div className="inspector-wrap" data-panel={effectivePanel}>
              {inspector}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
