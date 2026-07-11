import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const COLOR_SCHEME_QUERY = "(prefers-color-scheme: dark)";

interface MediaMockControl {
  /** Flip the mocked OS preference and fire the `change` event to registered listeners. */
  set: (matches: boolean) => void;
}

/** Install a controllable `window.matchMedia` mock (jsdom does not provide one). */
function mockMatchMedia(initialDark: boolean): MediaMockControl {
  const listeners = new Set<(e: MediaQueryListEvent) => void>();
  const mql = {
    matches: initialDark,
    media: COLOR_SCHEME_QUERY,
    onchange: null,
    addEventListener: (_type: string, cb: (e: MediaQueryListEvent) => void) => {
      listeners.add(cb);
    },
    removeEventListener: (
      _type: string,
      cb: (e: MediaQueryListEvent) => void,
    ) => {
      listeners.delete(cb);
    },
    addListener: (cb: (e: MediaQueryListEvent) => void) => {
      listeners.add(cb);
    },
    removeListener: (cb: (e: MediaQueryListEvent) => void) => {
      listeners.delete(cb);
    },
    dispatchEvent: () => true,
  } as unknown as MediaQueryList;

  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => mql),
  );

  return {
    set: (matches: boolean) => {
      (mql as { matches: boolean }).matches = matches;
      listeners.forEach((cb) => cb({ matches } as MediaQueryListEvent));
    },
  };
}

describe("theme store", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.resetModules();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("boots to system when nothing is persisted, resolving against the OS preference", async () => {
    mockMatchMedia(false); // OS = light; unpersisted default mode is "system", not "dark"
    const { useThemeStore } = await import("./theme");
    expect(useThemeStore.getState().mode).toBe("system");
    expect(useThemeStore.getState().resolved).toBe("light");
  });

  it("reads a persisted mode on init", async () => {
    window.localStorage.setItem("wedevs-theme", "light");
    mockMatchMedia(true);
    const { useThemeStore } = await import("./theme");
    expect(useThemeStore.getState().mode).toBe("light");
    expect(useThemeStore.getState().resolved).toBe("light");
  });

  it("setMode updates mode + resolved and persists to localStorage", async () => {
    mockMatchMedia(true);
    const { useThemeStore, THEME_STORAGE_KEY } = await import("./theme");
    useThemeStore.getState().setMode("light");
    expect(useThemeStore.getState().mode).toBe("light");
    expect(useThemeStore.getState().resolved).toBe("light");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
    expect(THEME_STORAGE_KEY).toBe("wedevs-theme");
  });

  it("toggle cycles light <-> dark (never system)", async () => {
    mockMatchMedia(true);
    const { useThemeStore } = await import("./theme");
    useThemeStore.getState().setMode("dark");
    useThemeStore.getState().toggle();
    expect(useThemeStore.getState().mode).toBe("light");
    expect(useThemeStore.getState().resolved).toBe("light");
    useThemeStore.getState().toggle();
    expect(useThemeStore.getState().mode).toBe("dark");
    expect(useThemeStore.getState().resolved).toBe("dark");
  });

  it("toggle pivots off the currently resolved theme when in system mode", async () => {
    mockMatchMedia(true); // system => dark
    const { useThemeStore } = await import("./theme");
    useThemeStore.getState().setMode("system");
    expect(useThemeStore.getState().resolved).toBe("dark");
    useThemeStore.getState().toggle(); // resolved dark -> light, leaves system mode
    expect(useThemeStore.getState().mode).toBe("light");
    expect(useThemeStore.getState().resolved).toBe("light");
  });

  it("resolves 'system' from matchMedia", async () => {
    mockMatchMedia(false); // OS = light
    const { useThemeStore } = await import("./theme");
    useThemeStore.getState().setMode("system");
    expect(useThemeStore.getState().mode).toBe("system");
    expect(useThemeStore.getState().resolved).toBe("light");
  });

  it("re-resolves when the OS scheme changes while in 'system'", async () => {
    const media = mockMatchMedia(true); // OS = dark
    const { useThemeStore } = await import("./theme");
    useThemeStore.getState().setMode("system");
    expect(useThemeStore.getState().resolved).toBe("dark");
    media.set(false); // OS flips to light -> store must re-resolve
    expect(useThemeStore.getState().resolved).toBe("light");
  });

  it("ignores OS scheme changes when mode is not 'system'", async () => {
    const media = mockMatchMedia(true);
    const { useThemeStore } = await import("./theme");
    useThemeStore.getState().setMode("dark");
    media.set(false);
    expect(useThemeStore.getState().resolved).toBe("dark");
  });
});
