import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

// Regression guard for a Tailwind v4 monorepo pitfall: Tailwind auto-detects
// only THIS app's files, so the design-system utility classes that live in the
// @wedevs/ui package (consumed as raw TS via transpilePackages) are only emitted
// if globals.css explicitly @source-scans that package. When it doesn't, every
// component renders UNSTYLED in a real browser — yet the build succeeds and every
// jsdom test still passes (jsdom applies no CSS), so nothing catches it.
// This test fails loudly if the @source directive covering packages/ui is removed.
describe("globals.css Tailwind content scanning", () => {
  const css = readFileSync(
    path.resolve(process.cwd(), "src/app/globals.css"),
    "utf8",
  );

  it("declares an @source that scans the @wedevs/ui design-system package", () => {
    expect(css).toContain("@source");
    expect(css).toMatch(/@source\s+["'][^"']*packages\/ui[^"']*["']/);
  });
});
