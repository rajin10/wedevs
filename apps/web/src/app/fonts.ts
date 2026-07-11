import localFont from "next/font/local";

export const fontDisplay = localFont({
  variable: "--font-display",
  display: "swap",
  preload: true,
  fallback: ["Manrope", "system-ui", "sans-serif"],
  src: [
    { path: "./fonts/unbounded-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/unbounded-700.woff2", weight: "700", style: "normal" },
    { path: "./fonts/unbounded-800.woff2", weight: "800", style: "normal" },
  ],
});

export const fontSans = localFont({
  variable: "--font-sans",
  display: "swap",
  preload: true,
  fallback: ["Segoe UI", "system-ui", "-apple-system", "sans-serif"],
  src: [
    { path: "./fonts/manrope-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/manrope-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/manrope-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/manrope-700.woff2", weight: "700", style: "normal" },
    { path: "./fonts/manrope-800.woff2", weight: "800", style: "normal" },
  ],
});

export const fontMono = localFont({
  variable: "--font-mono",
  display: "swap",
  preload: false,
  fallback: ["ui-monospace", "Consolas", "monospace"],
  src: [
    {
      path: "./fonts/jetbrains-mono-400.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/jetbrains-mono-500.woff2",
      weight: "500",
      style: "normal",
    },
  ],
});
