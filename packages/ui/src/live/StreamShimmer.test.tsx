import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { StreamShimmer } from "./StreamShimmer";

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

describe("StreamShimmer", () => {
  it("renders the provided text", () => {
    render(<StreamShimmer text="Thinking through the plan" />);
    expect(screen.getByText("Thinking through the plan")).toBeInTheDocument();
  });

  it("is neutral: never paints with the accent token", () => {
    const { container } = render(<StreamShimmer text="Working" />);
    expect(container.innerHTML).not.toContain("accent");
  });

  it("uses a gray gradient text sweep when motion is allowed", () => {
    render(<StreamShimmer text="Working" />);
    const cls = screen.getByText("Working").getAttribute("class")!;
    expect(cls).toContain("bg-clip-text");
    // Task 2's ported keyframe is named `txtshim` (mockup calls it
    // `shimmer` informally; the real @keyframes name in keyframes.css is
    // `txtshim` — see keyframes.css header comment).
    expect(cls).toContain("animate-[txtshim");
  });

  it("renders plain static text under prefers-reduced-motion", () => {
    setMatchMedia(true);
    const { container } = render(<StreamShimmer text="Working" />);
    expect(container.innerHTML).not.toContain("animate-");
    expect(screen.getByText("Working").getAttribute("class")).not.toContain(
      "bg-clip-text",
    );
  });
});
