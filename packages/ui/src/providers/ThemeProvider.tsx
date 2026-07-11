"use client";

import * as React from "react";
import { useThemeStore } from "../store/theme";
import type { ThemeState } from "../types";

export interface ThemeProviderProps {
  children: React.ReactNode;
}

const FADE_STYLE_ID = "wedevs-theme-fade";

// Ported from mockup line 558 (`transition:background-color .28s ease,border-color .28s ease,
// color .28s ease`), broadened to every element (+ fill/stroke for SVG mascots) and made
// component-agnostic so it applies to our Tailwind-classed components. Guarded so that
// prefers-reduced-motion users get no cross-fade at all.
const FADE_CSS = `@media (prefers-reduced-motion: no-preference){
  :root[data-theme-transition="on"] *,
  :root[data-theme-transition="on"] *::before,
  :root[data-theme-transition="on"] *::after{
    transition:background-color .28s ease,border-color .28s ease,color .28s ease,fill .28s ease,stroke .28s ease;
  }
}`;

export function ThemeProvider({
  children,
}: ThemeProviderProps): React.JSX.Element {
  const resolved = useThemeStore((s) => s.resolved);

  // Stamp <html data-theme> on every resolved-theme change (mockup setTheme, line 1407).
  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", resolved);
  }, [resolved]);

  // Inject the cross-fade stylesheet once, then arm transitions after the first commit
  // (so the initial theme paint does not animate).
  React.useEffect(() => {
    if (!document.getElementById(FADE_STYLE_ID)) {
      const style = document.createElement("style");
      style.id = FADE_STYLE_ID;
      style.textContent = FADE_CSS;
      document.head.appendChild(style);
    }
    document.documentElement.setAttribute("data-theme-transition", "on");
  }, []);

  return <>{children}</>;
}

/** Subscribe to the theme store (mode/resolved + setMode/toggle). */
export function useTheme(): ThemeState {
  return useThemeStore();
}
