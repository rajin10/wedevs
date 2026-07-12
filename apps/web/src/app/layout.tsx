import "./globals.css";
import type { ReactNode } from "react";
import { ThemeProvider, ToastProvider } from "@wedevs/ui";
import { fontDisplay, fontSans, fontMono } from "./fonts";

export const metadata = {
  title: "Wedevs",
  description: "AI chat + code workspace",
};

// Blocking anti-FOUC theme script. Runs synchronously in <head>, before
// hydration/first paint, so <html data-theme> is stamped correctly even
// when the persisted mode differs from the OS preference (otherwise the
// page briefly paints the OS-preferred theme, then flips once
// ThemeProvider's effect runs post-hydration). Intentionally duplicates
// (rather than imports) the storage-key + resolution logic from
// packages/ui/src/store/theme.ts (THEME_STORAGE_KEY / resolveTheme) — this
// has to run before any application JS module, including @wedevs/ui, has
// loaded, so it can't depend on that module.
const THEME_INIT_SCRIPT = `(function(){try{var k="wedevs-theme";var s=localStorage.getItem(k);var m=(s==="light"||s==="dark"||s==="system")?s:"system";var r=m==="system"?(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):m;document.documentElement.setAttribute("data-theme",r);}catch(e){}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${fontDisplay.variable} ${fontSans.variable} ${fontMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Blocking anti-FOUC script must run inline, before hydration. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
