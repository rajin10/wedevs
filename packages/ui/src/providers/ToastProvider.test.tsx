import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { ToastProvider, useToast } from "./ToastProvider";

function stubMatchMedia() {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: false,
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

// Test harness: a consumer that fires show() with a caller-chosen message.
function Trigger({ msg }: { msg: string }) {
  const { show } = useToast();
  return <button onClick={() => show(msg)}>show {msg}</button>;
}

describe("ToastProvider / useToast", () => {
  beforeEach(() => {
    stubMatchMedia();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("useToast throws outside a ToastProvider", () => {
    expect(() => render(<Trigger msg="x" />)).toThrow(
      /useToast must be used within a ToastProvider/,
    );
  });

  it("show(msg) sets the message and makes the pill visible", () => {
    render(
      <ToastProvider>
        <Trigger msg="Saved" />
      </ToastProvider>,
    );
    const region = screen.getByRole("status", { hidden: true });
    expect(region).toHaveAttribute("data-visible", "false");

    fireEvent.click(screen.getByRole("button"));

    expect(region).toHaveAttribute("data-visible", "true");
    expect(region).toHaveTextContent("Saved");
  });

  it("auto-dismisses after 2200ms", () => {
    render(
      <ToastProvider>
        <Trigger msg="Saved" />
      </ToastProvider>,
    );
    const region = screen.getByRole("status", { hidden: true });

    fireEvent.click(screen.getByRole("button"));
    expect(region).toHaveAttribute("data-visible", "true");

    act(() => {
      vi.advanceTimersByTime(2199);
    });
    expect(region).toHaveAttribute("data-visible", "true"); // still up at 2199ms

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(region).toHaveAttribute("data-visible", "false"); // gone at 2200ms
  });

  it("a second show replaces the pending dismiss timer", () => {
    render(
      <ToastProvider>
        <Trigger msg="First" />
      </ToastProvider>,
    );
    const region = screen.getByRole("status", { hidden: true });
    const button = screen.getByRole("button");

    fireEvent.click(button); // t=0, timer would fire at t=2200
    act(() => {
      vi.advanceTimersByTime(1000); // t=1000
    });
    fireEvent.click(button); // second show at t=1000 → clears old timer, new fires at t=3200

    act(() => {
      vi.advanceTimersByTime(1500); // t=2500 (past original 2200)
    });
    // If the first timer had survived, the pill would be hidden. It must still be visible.
    expect(region).toHaveAttribute("data-visible", "true");
    expect(region).toHaveTextContent("First");

    act(() => {
      vi.advanceTimersByTime(700); // t=3200 → new timer fires
    });
    expect(region).toHaveAttribute("data-visible", "false");
  });

  it("the pill's dot uses accent (LiveDot) while the body stays neutral --elevated", () => {
    render(
      <ToastProvider>
        <Trigger msg="Saved" />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByRole("button"));
    const region = screen.getByRole("status", { hidden: true });
    expect(region.className).toContain("bg-[var(--elevated)]"); // neutral body
    expect(region.className).not.toContain("--accent"); // no volt on body
    expect(region.querySelector('[class*="--accent"]')).not.toBeNull(); // accent LiveDot inside
  });
});
