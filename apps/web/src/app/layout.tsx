import "./globals.css";
import type { ReactNode } from "react";
import { ThemeProvider, ToastProvider } from "@wedevs/ui";
import { fontDisplay, fontSans, fontMono } from "./fonts";

export const metadata = {
  title: "Wedevs",
  description: "AI chat + code workspace",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${fontDisplay.variable} ${fontSans.variable} ${fontMono.variable}`}
      suppressHydrationWarning
    >
      <body>
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
