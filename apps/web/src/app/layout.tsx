import "./globals.css";
import type { ReactNode } from "react";

export const metadata = { title: "Wedevs", description: "AI chat + code workspace" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
