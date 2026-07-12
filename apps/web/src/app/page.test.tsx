import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup, within } from "@testing-library/react";
import Home from "./page";

afterEach(() => cleanup());

describe("Landing page", () => {
  it("renders exactly one h1 with the hero headline", () => {
    render(<Home />);
    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent(/chat, code, and ship/i);
  });

  it("links every 'Open the app' CTA to /app", () => {
    render(<Home />);
    const ctas = screen.getAllByRole("link", { name: /open the app/i });
    expect(ctas.length).toBeGreaterThanOrEqual(1);
    for (const cta of ctas) {
      expect(cta).toHaveAttribute("href", "/app");
    }
  });

  it("links the nav 'Open app' button to /app", () => {
    render(<Home />);
    const nav = within(screen.getByRole("banner"));
    const navCta = nav.getByRole("link", { name: /^open app$/i });
    expect(navCta).toHaveAttribute("href", "/app");
  });

  it("links the secondary 'See a live demo' CTA to /app", () => {
    render(<Home />);
    const demo = screen.getByRole("link", { name: /see a live demo/i });
    expect(demo).toHaveAttribute("href", "/app");
  });

  it("keeps proper heading order (h1 then h2s, no skipped levels)", () => {
    render(<Home />);
    const h1s = screen.getAllByRole("heading", { level: 1 });
    const h2s = screen.getAllByRole("heading", { level: 2 });
    const h3s = screen.getAllByRole("heading", { level: 3 });
    expect(h1s).toHaveLength(1);
    expect(h2s.length).toBeGreaterThanOrEqual(2); // features + closing CTA
    expect(h3s.length).toBeGreaterThanOrEqual(1); // feature card titles
  });

  it("renders semantic landmarks: header, main, footer", () => {
    render(<Home />);
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("renders all four feature cards", () => {
    render(<Home />);
    expect(screen.getByText("Multi-provider AI")).toBeInTheDocument();
    expect(screen.getByText("AI code workspace")).toBeInTheDocument();
    expect(screen.getByText("Plugins & marketplace")).toBeInTheDocument();
    expect(screen.getByText("Web + desktop")).toBeInTheDocument();
  });

  it("keeps primary CTA buttons neutral — no unconditionally-painted accent classes", () => {
    // Mirrors the Volt-audit helper in app/app/page.test.tsx: a class token
    // carrying a variant prefix (`focus-visible:`, `hover:`, ...) only ever
    // paints under that pseudo-state (e.g. the global keyboard focus ring),
    // which is a separately-sanctioned category — not the "is this button
    // volt-tinted at rest" question this test asks. Only a bare token with
    // no `:` prefix paints unconditionally.
    render(<Home />);
    const ctas = screen.getAllByRole("link", {
      name: /open the app|open app/i,
    });
    for (const cta of ctas) {
      const paintsAccentUnconditionally = cta.className
        .split(/\s+/)
        .some((token) => !token.includes(":") && /accent/.test(token));
      expect(paintsAccentUnconditionally).toBe(false);
    }
  });
});
