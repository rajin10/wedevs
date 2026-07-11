import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { TypeCaret } from "./TypeCaret";

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

describe("TypeCaret", () => {
  it("renders an accent blinking caret bar", () => {
    const { container } = render(<TypeCaret />);
    const cls = container.querySelector("span")!.getAttribute("class")!;
    expect(cls).toContain("bg-[var(--accent)]");
    expect(cls).toContain("animate-[caret");
  });

  it("keeps the accent bar but drops blinking under prefers-reduced-motion", () => {
    setMatchMedia(true);
    const { container } = render(<TypeCaret />);
    const cls = container.querySelector("span")!.getAttribute("class")!;
    expect(cls).toContain("bg-[var(--accent)]");
    expect(cls).not.toContain("animate-");
  });
});
