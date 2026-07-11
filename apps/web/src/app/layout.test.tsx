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
