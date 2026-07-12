import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Toast } from "./Toast";

// matchMedia stub so useReducedMotion() works under jsdom.
function stubMatchMedia(reduced: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: reduced && query.includes("prefers-reduced-motion"),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  });
}

describe("Toast (low-level pill)", () => {
  beforeEach(() => stubMatchMedia(false));

  it("renders the message and exposes a polite status region", () => {
    render(<Toast message="Saved" visible={true} />);
    const region = screen.getByRole("status");
    expect(region).toHaveTextContent("Saved");
    expect(region).toHaveAttribute("aria-live", "polite");
  });

  it("reflects visibility via data-visible and aria-hidden", () => {
    const { rerender } = render(<Toast message="Saved" visible={false} />);
    // hidden: true — the region is intentionally aria-hidden while not visible,
    // which the default getByRole query excludes; we still need to grab it to
    // assert on the very attributes that make it hidden.
    const region = screen.getByRole("status", { hidden: true });
    expect(region).toHaveAttribute("data-visible", "false");
    expect(region).toHaveAttribute("aria-hidden", "true");
    rerender(<Toast message="Saved" visible={true} />);
    expect(region).toHaveAttribute("data-visible", "true");
    expect(region).toHaveAttribute("aria-hidden", "false");
  });

  it("paints the pill body with the neutral --elevated surface, not accent", () => {
    render(<Toast message="Saved" visible={true} />);
    const region = screen.getByRole("status");
    // body is neutral
    expect(region.className).toContain("bg-[var(--elevated)]");
    expect(region.className).toContain("border-[var(--border-2)]");
    // body must NOT be volt-tinted anywhere on the root element
    expect(region.className).not.toContain("--accent");
  });

  it("puts the accent LiveDot inside the pill (the only volt element)", () => {
    const { container } = render(<Toast message="Saved" visible={true} />);
    const region = screen.getByRole("status");
    // LiveDot (Task 6) paints bg-[var(--accent)]; it must live inside the pill.
    const dot = region.querySelector('[class*="--accent"]');
    expect(dot).not.toBeNull();
    // and it precedes the message text node's span
    expect(container.querySelector('[class*="--accent"]')).toBe(dot);
  });

  it("uses a 200ms opacity+transform transition when motion is allowed", () => {
    render(<Toast message="Saved" visible={true} />);
    expect(screen.getByRole("status").className).toContain("duration-200");
  });

  it("drops the transition under prefers-reduced-motion", () => {
    stubMatchMedia(true);
    render(<Toast message="Saved" visible={true} />);
    expect(screen.getByRole("status").className).not.toContain("duration-200");
  });
});
