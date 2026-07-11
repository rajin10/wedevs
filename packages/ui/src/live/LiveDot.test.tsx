import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { LiveDot } from "./LiveDot";

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

describe("LiveDot", () => {
  it("renders an accent-keyed pulsing dot", () => {
    const { container } = render(<LiveDot />);
    const dot = container.querySelector("span")!;
    expect(dot.getAttribute("class")).toContain("bg-[var(--accent)]");
    expect(dot.getAttribute("class")).toContain("animate-[live");
  });

  it("keeps the accent fill but drops animation under prefers-reduced-motion", () => {
    setMatchMedia(true);
    const { container } = render(<LiveDot />);
    const cls = container.querySelector("span")!.getAttribute("class")!;
    expect(cls).toContain("bg-[var(--accent)]");
    expect(cls).not.toContain("animate-");
  });
});
