import type { Config } from "tailwindcss";

// Phase 1: font-family utilities resolve to the self-hosted next/font CSS
// variables set on <html> by apps/web/src/app/fonts.ts. Mirror of the CSS
// `@theme inline` block in apps/web/src/app/globals.css.
const preset = {
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "var(--font-sans)", "sans-serif"],
        sans: ["var(--font-sans)", "Segoe UI", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "Consolas", "monospace"],
      },
    },
  },
} satisfies Partial<Config>;

export default preset;
