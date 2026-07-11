import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { Visor } from "./Visor";

function setMatchMedia(reduce: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: reduce && query.includes("reduce"),
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

beforeEach(() => setMatchMedia(false));
afterEach(() => cleanup());

describe("Visor", () => {
  it("paints antenna + scanline with accent and the body with accent-line stroke", () => {
    const { container } = render(<Visor />);
    expect(
      container.querySelector('circle[fill="var(--accent)"]'),
    ).not.toBeNull();
    expect(
      container.querySelector('rect[fill="var(--accent)"]'),
    ).not.toBeNull();
    expect(
      container.querySelector('rect[stroke="var(--accent-line)"]'),
    ).not.toBeNull();
  });

  it("renders an accent-soft hero glow", () => {
    const { container } = render(<Visor />);
    const glow = Array.from(container.querySelectorAll("span")).find((s) =>
      (s.getAttribute("style") ?? "").includes("var(--accent-soft)"),
    );
    expect(glow).toBeDefined();
  });

  it("bobs the svg and animates the scanline when motion is allowed", () => {
    const { container } = render(<Visor />);
    expect(container.querySelector("svg")!.getAttribute("class")).toContain(
      "animate-[bob",
    );
    expect(
      container
        .querySelector('rect[fill="var(--accent)"]')!
        .getAttribute("class"),
    ).toContain("animate-[scan");
  });

  it("is static under prefers-reduced-motion", () => {
    setMatchMedia(true);
    const { container } = render(<Visor />);
    expect(container.innerHTML).not.toContain("animate-[");
  });
});
