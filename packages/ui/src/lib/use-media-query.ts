"use client";

import { useCallback, useSyncExternalStore } from "react";

/** Below this width, a pinned Inspector reflows to a floating overlay
 * (AppShell's `.inspector-wrap` pinned->float collapse). */
export const INSPECTOR_PIN_QUERY = "(max-width: 1180px)";
/** Below this width, the LeftRail becomes an off-canvas mobile drawer. */
export const RAIL_DRAWER_QUERY = "(max-width: 900px)";

/**
 * SSR-safe media-query subscription — same `useSyncExternalStore` pattern as
 * `./use-reduced-motion.ts`. Resolves synchronously on the first client
 * render (no extra effect-triggered re-render) and reports `false` on the
 * server / before hydration.
 *
 * Single source of truth: AppShell.tsx and apps/web's shell page both need
 * the SAME breakpoint queries (AppShell for its own layout, the page for
 * computing the *effective* Inspector mode it hands to <Inspector/> — see
 * AppShell.tsx's module doc) — this hook + the exported query constants
 * above replace what used to be two hand-duplicated copies.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
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
  const getSnapshot = useCallback((): boolean => {
    if (
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    ) {
      return false;
    }
    return window.matchMedia(query).matches;
  }, [query]);
  const getServerSnapshot = useCallback((): boolean => false, []);
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
