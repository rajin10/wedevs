import type { Config } from "tailwindcss";

/**
 * Font-family token mapping. The BUILD-EFFECTIVE source is the @theme block in
 * packages/config/theme.css (CSS-first Tailwind v4 pipeline via @tailwindcss/postcss).
 * This preset mirrors those three families for JS consumers (Storybook / any
 * @config-based build). Keep the two in sync.
 * Raw --font-* vars are provided at runtime by apps/web/fonts.ts (next/font/local).
 */
const preset = {
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-unbounded)", "Unbounded", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: [
          "var(--font-manrope)",
          "Manrope",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
        mono: [
          "var(--font-jetbrains-mono)",
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
      },
    },
  },
} satisfies Partial<Config>;

export default preset;
