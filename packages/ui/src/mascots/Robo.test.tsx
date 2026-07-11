import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { Robo } from "./Robo";

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

describe("Robo", () => {
  it("renders an svg with three accent-filled circles (antenna + two eyes)", () => {
    const { container } = render(<Robo />);
    expect(container.querySelector("svg")).not.toBeNull();
    expect(
      container.querySelectorAll('circle[fill="var(--accent)"]').length,
    ).toBe(3);
  });

  it("defaults to size 30 and forwards the size prop", () => {
    const { container } = render(<Robo size={48} />);
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("width")).toBe("48");
    expect(svg.getAttribute("height")).toBe("48");
  });

  it("uses non-accent illustration colors for neck and face", () => {
    const { container } = render(<Robo />);
    expect(container.querySelector('line[stroke="#6e756d"]')).not.toBeNull();
    expect(container.querySelector('rect[fill="#17191a"]')).not.toBeNull();
  });

  it("animates antenna and eyes when motion is allowed", () => {
    const { container } = render(<Robo />);
    const ant = container.querySelector('circle[cx="32"][cy="6"]')!;
    expect(ant.getAttribute("class")).toContain("animate-[antp");
    const eye = container.querySelector('circle[cx="27.5"]')!;
    expect(eye.getAttribute("class")).toContain("animate-[blinkeye");
  });

  it("renders static (no animation classes) under prefers-reduced-motion", () => {
    setMatchMedia(true);
    const { container } = render(<Robo />);
    expect(container.innerHTML).not.toContain("animate-[");
  });
});
