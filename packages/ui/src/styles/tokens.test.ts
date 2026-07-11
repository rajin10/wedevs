import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, it, expect } from "vitest";

// packages/ui/src/styles/tokens.test.ts -> ../../../config/theme.css == packages/config/theme.css
// Resolved via path.resolve (not `new URL(relative, import.meta.url)`): under the jsdom test
// environment on Windows, the global URL implementation mis-resolves multi-level "../"
// traversal against a file:// URL with a drive letter, silently rebasing to
// http://localhost:3000/ instead of walking up the filesystem. path.resolve avoids that parser
// entirely and is not affected by the bug.
const here = path.dirname(fileURLToPath(import.meta.url));
const cssPath = path.resolve(here, "../../../config/theme.css");
const css = readFileSync(cssPath, "utf8");

/** Every semantic token that must be declared in each theme block. */
const TOKENS = [
  "--bg",
  "--surface",
  "--surface-2",
  "--sidebar",
  "--elevated",
  "--sink",
  "--text",
  "--text-2",
  "--text-3",
  "--border",
  "--border-2",
  "--hover",
  "--active",
  "--active-line",
  "--bubble",
  "--primary",
  "--primary-text",
  "--accent",
  "--accent-text",
  "--accent-soft",
  "--accent-line",
  "--success",
  "--warning",
  "--error",
  "--shadow",
  "--shadow-sm",
  "--radius",
  "--radius-sm",
  "--radius-xs",
];

/** Grab the flat declaration body of a token block (blocks contain no nested braces). */
function block(re: RegExp, label: string): string {
  const m = css.match(re);
  if (!m) throw new Error(`theme block not found: ${label}`);
  return m[1];
}

// The first `:root{ ... }` in the file is the light base (it precedes the @media/[data-theme] blocks).
const lightBase = block(/:root\s*\{([^{}]*)\}/, "light :root base");
const darkMedia = block(
  /@media \(prefers-color-scheme: dark\)\s*\{\s*:root\s*\{([^{}]*)\}/,
  "@media dark",
);
const lightAttr = block(
  /:root\[data-theme="light"\]\s*\{([^{}]*)\}/,
  '[data-theme="light"]',
);
const darkAttr = block(
  /:root\[data-theme="dark"\]\s*\{([^{}]*)\}/,
  '[data-theme="dark"]',
);

// `--accent\s*:` matches only the exact `--accent:` decl, never `--accent-soft:` etc. (a hyphen follows).
const declares = (text: string, token: string): boolean =>
  new RegExp(`${token}\\s*:`).test(text);

describe("theme tokens — full coverage in every theme mechanism", () => {
  const blocks: Record<string, string> = {
    "light (:root base)": lightBase,
    "dark (@media prefers-color-scheme)": darkMedia,
    'light ([data-theme="light"])': lightAttr,
    'dark ([data-theme="dark"])': darkAttr,
  };

  for (const [name, text] of Object.entries(blocks)) {
    for (const token of TOKENS) {
      it(`${name} declares ${token}`, () => {
        expect(declares(text, token)).toBe(true);
      });
    }
  }
});

describe("accent hue is exact per theme", () => {
  it("dark accent = #9EFB25 (both dark mechanisms)", () => {
    expect(/--accent\s*:\s*#9EFB25/i.test(darkMedia)).toBe(true);
    expect(/--accent\s*:\s*#9EFB25/i.test(darkAttr)).toBe(true);
  });
  it("light accent = #5A9310 (both light mechanisms)", () => {
    expect(/--accent\s*:\s*#5A9310/i.test(lightBase)).toBe(true);
    expect(/--accent\s*:\s*#5A9310/i.test(lightAttr)).toBe(true);
  });
});

describe("mockup gaps + leak guards", () => {
  it("--sink is defined in all four blocks (mockup 619/621 regression)", () => {
    expect(declares(lightBase, "--sink")).toBe(true);
    expect(declares(darkMedia, "--sink")).toBe(true);
    expect(declares(lightAttr, "--sink")).toBe(true);
    expect(declares(darkAttr, "--sink")).toBe(true);
  });
  it("no Volt (#9efb25) leaks into a light block", () => {
    expect(/#9efb25/i.test(lightBase)).toBe(false);
    expect(/#9efb25/i.test(lightAttr)).toBe(false);
  });
});
