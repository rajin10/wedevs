import "@testing-library/jest-dom/vitest";

// jsdom ships no matchMedia; ThemeProvider + useReducedMotion both call it.
// Default: light theme, motion allowed. Individual tests override window.matchMedia.
// Guarded for src/env.test.ts, which runs under a plain Node environment
// (see vitest.config.ts's environmentMatchGlobs) with no `window` at all.
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList;
}

// jsdom has no ResizeObserver; cmdk (used by CommandPalette, mounted on this
// page) observes size internally. Same shim as packages/ui/vitest.setup.ts.
if (
  typeof window !== "undefined" &&
  typeof window.ResizeObserver === "undefined"
) {
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}

// jsdom does not implement scrollIntoView; cmdk calls it when moving the
// active row via keyboard.
if (
  typeof Element !== "undefined" &&
  typeof Element.prototype.scrollIntoView !== "function"
) {
  Element.prototype.scrollIntoView = function scrollIntoView() {};
}
