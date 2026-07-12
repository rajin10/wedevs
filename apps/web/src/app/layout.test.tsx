import type { ReactNode } from "react";
import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

// Stub next/font so each family exposes a deterministic, greppable variable className.
vi.mock("next/font/local", () => ({
  default: (opts: { variable?: string }) => ({
    className: `cls_${(opts.variable ?? "").replace(/-/g, "")}`,
    variable: `var_${(opts.variable ?? "").replace(/-/g, "")}`,
    style: {},
  }),
}));

// Isolate the layout from Task 3's client providers: passthrough that renders children.
vi.mock("@wedevs/ui", () => ({
  ThemeProvider: ({ children }: { children: ReactNode }) => children,
  ToastProvider: ({ children }: { children: ReactNode }) => children,
}));

import RootLayout from "./layout";

const html = renderToStaticMarkup(
  <RootLayout>
    <div id="child">hi</div>
  </RootLayout>,
);

describe("RootLayout font wiring", () => {
  it("applies all three next/font variable classNames to <html>", () => {
    expect(html).toContain("var_fontdisplay");
    expect(html).toContain("var_fontsans");
    expect(html).toContain("var_fontmono");
  });

  it("renders its children", () => {
    expect(html).toContain('id="child"');
  });

  it("emits NO external Google Fonts request", () => {
    expect(html).not.toContain("fonts.googleapis.com");
    expect(html).not.toContain("fonts.gstatic.com");
    expect(html).not.toMatch(/<link[^>]+fonts\.google/i);
  });
});

describe("anti-FOUC theme script", () => {
  it("renders a blocking inline <head> script that stamps data-theme from the persisted mode", () => {
    expect(html).toContain("<script");
    expect(html).toContain("wedevs-theme");
    expect(html).toContain("data-theme");
    expect(html).toContain("prefers-color-scheme: dark");
  });

  it("resolves and stamps data-theme synchronously in a browser-like DOM", () => {
    const KEY = "wedevs-theme";
    // Extract the exact script text RootLayout emitted (not a hand-copied
    // duplicate) so this test exercises the real blocking script.
    const match = /<script[^>]*>([\s\S]*?)<\/script>/.exec(html);
    expect(match).not.toBeNull();
    const script = match![1]!;

    // explicit "dark" mode persisted, even though the OS prefers light —
    // the script must honor the STORED mode, not the OS.
    window.localStorage.setItem(KEY, "dark");
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = ((query: string) => ({
      matches: false, // OS prefers light
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;
    document.documentElement.removeAttribute("data-theme");

    // Exercising the exact blocking script string emitted into <head>.
    (0, eval)(script);

    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");

    window.localStorage.removeItem(KEY);
    window.matchMedia = originalMatchMedia;
    document.documentElement.removeAttribute("data-theme");
  });
});
