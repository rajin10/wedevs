"use client";

import { create } from "zustand";
import type { ThemeMode, ResolvedTheme, ThemeState } from "../types";

/** localStorage key holding the user's ThemeMode choice. */
export const THEME_STORAGE_KEY = "wedevs-theme";

const COLOR_SCHEME_QUERY = "(prefers-color-scheme: dark)";

/**
 * Unpersisted default is "system" (NOT "dark"). With nothing in
 * localStorage the store resolves against the OS preference via
 * matchMedia — e.g. under a forced-light system it resolves "light".
 */
const DEFAULT_MODE: ThemeMode = "system";

function canUseDom(): boolean {
  return typeof window !== "undefined";
}

/** True when the OS currently prefers a dark color scheme. */
function systemPrefersDark(): boolean {
  if (!canUseDom() || typeof window.matchMedia !== "function") {
    // No signal available (SSR / no matchMedia) — fall back to dark so the
    // first paint is never unexpectedly lighter than the OS could want.
    return true;
  }
  return window.matchMedia(COLOR_SCHEME_QUERY).matches;
}

/** Resolve a ThemeMode to the concrete theme that should render. */
export function resolveTheme(mode: ThemeMode): ResolvedTheme {
  if (mode === "system") {
    return systemPrefersDark() ? "dark" : "light";
  }
  return mode;
}

function readStoredMode(): ThemeMode {
  if (!canUseDom()) return DEFAULT_MODE;
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
  } catch {
    /* localStorage unavailable (e.g. privacy mode) — fall through to default */
  }
  return DEFAULT_MODE;
}

function persistMode(mode: ThemeMode): void {
  if (!canUseDom()) return;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    /* storage write blocked — non-fatal, in-memory state still updates */
  }
}

const initialMode = readStoredMode();

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: initialMode,
  resolved: resolveTheme(initialMode),
  setMode: (mode) => {
    persistMode(mode);
    set({ mode, resolved: resolveTheme(mode) });
  },
  toggle: () => {
    // Pivot off the currently rendered theme, flip, and leave "system".
    const next: ResolvedTheme = get().resolved === "dark" ? "light" : "dark";
    persistMode(next);
    set({ mode: next, resolved: next });
  },
}));

// Keep "system" mode live: re-resolve whenever the OS scheme changes.
if (canUseDom() && typeof window.matchMedia === "function") {
  const mql = window.matchMedia(COLOR_SCHEME_QUERY);
  const onSystemChange = (): void => {
    if (useThemeStore.getState().mode === "system") {
      useThemeStore.setState({ resolved: resolveTheme("system") });
    }
  };
  if (typeof mql.addEventListener === "function") {
    mql.addEventListener("change", onSystemChange);
  } else if (typeof mql.addListener === "function") {
    mql.addListener(onSystemChange); // Safari < 14 fallback
  }
}
