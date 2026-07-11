import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { LiveCluster } from "./LiveCluster";

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

describe("LiveCluster", () => {
  it("renders a main dot plus three accent sparks (4 accent elements)", () => {
    const { container } = render(<LiveCluster />);
    expect(
      container.querySelectorAll('[class*="bg-[var(--accent)]"]').length,
    ).toBe(4);
  });

  it("renders an optional label", () => {
    render(<LiveCluster label="now" />);
    expect(screen.getByText("now")).toBeInTheDocument();
  });

  it("pulses the main dot and twinkles the sparks when motion is allowed", () => {
    const { container } = render(<LiveCluster />);
    expect(container.innerHTML).toContain("animate-[live");
    expect(container.innerHTML).toContain("animate-[twinkle");
  });

  it("is static under prefers-reduced-motion", () => {
    setMatchMedia(true);
    const { container } = render(<LiveCluster />);
    expect(container.innerHTML).not.toContain("animate-[");
  });
});
