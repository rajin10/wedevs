"use client";

import * as React from "react";
import type { AppShellProps, PanelMode } from "../../types";
import {
  useMediaQuery,
  INSPECTOR_PIN_QUERY,
  RAIL_DRAWER_QUERY,
} from "../../lib/use-media-query";
import "./AppShell.css";

export type { AppShellProps };

/** First focusable element inside a container — used to move focus into the
 * rail when the mobile drawer opens. */
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

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
  // deterministically unit-testable via a `matchMedia` mock. Shared with
  // apps/web's shell page via packages/ui's lib/use-media-query (single
  // source of truth for both query strings).
  const belowPin = useMediaQuery(INSPECTOR_PIN_QUERY); // pinned -> overlay
  const belowDrawer = useMediaQuery(RAIL_DRAWER_QUERY); // rail -> drawer

  // A pinned Inspector reflows to a floating overlay on narrow viewports.
  const effectivePanel: PanelMode =
    panel === "pinned" && belowPin ? "float" : panel;

  // Conditionally mounted (not kept at width:0) so "closed hides Inspector"
  // is assertable in jsdom, which doesn't compute stylesheet layout.
  const showInspector = effectivePanel !== "closed" && inspector != null;

  // NOTE: the drag-active file-drop banner is Composer's own DropOverlay
  // (Composer.tsx) — AppShell used to render a second, overlapping "Drop
  // files to attach" banner here. Removed to avoid the duplicate; `dragging`
  // is still accepted/plumbed through as `data-dragging` in case other
  // chrome (CSS, e2e, future components) wants to key off drag-active state.
  const dragActive = dragging && view === "chat";

  const isDrawerOpen = belowDrawer && rail === "open";
  const railWrapRef = React.useRef<HTMLDivElement>(null);

  const closeRail = React.useCallback((): void => {
    if (rail === "open") onRailChange("collapsed");
  }, [rail, onRailChange]);

  const onKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>): void => {
      if (e.key !== "Escape") return;
      if (effectivePanel === "float") {
        onPanelChange("closed");
      } else if (isDrawerOpen) {
        onRailChange("collapsed");
      }
    },
    [effectivePanel, onPanelChange, isDrawerOpen, onRailChange],
  );

  // Move focus into the rail when the mobile drawer opens, so keyboard users
  // land somewhere useful instead of on a scrim/background element.
  React.useEffect(() => {
    if (!isDrawerOpen) return;
    const target =
      railWrapRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    target?.focus();
  }, [isDrawerOpen]);

  return (
    <div
      className="app"
      data-testid="app-shell"
      data-view={view}
      data-panel={effectivePanel}
      data-rail={rail}
      data-drawer={belowDrawer ? "1" : "0"}
      data-dragging={dragActive ? "1" : "0"}
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

      <div className="rail-wrap" ref={railWrapRef}>
        {leftRail}
      </div>

      {/* background content is inert while the drawer is open, so it isn't
          tab-reachable behind the scrim */}
      <div className="workspace" inert={isDrawerOpen || undefined}>
        {topBar}
        <div className="body">
          <main className="main">{main}</main>
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
