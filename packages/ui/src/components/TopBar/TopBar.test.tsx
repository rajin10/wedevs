import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TopBar } from "./TopBar";
import type { ModelSelectorProps, TopBarProps } from "../../types";

// TopBar renders ModelSelector (Radix Popover); keep the same jsdom shims.
beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
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
  if (typeof window.ResizeObserver === "undefined") {
    window.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
  }
});

const selector: ModelSelectorProps = {
  models: [
    {
      id: "atlas-pro",
      name: "Atlas Pro",
      group: "frontier",
      sub: "Deepest reasoning.",
      tags: ["Reasoning"],
    },
  ],
  agents: [
    {
      id: "writer",
      name: "Writer",
      persona: "Long-form drafting",
      specialty: "Atlas Pro + web search",
    },
  ],
  selectedModelId: "atlas-pro",
  onSelectModel: vi.fn(),
};

function setup(overrides: Partial<TopBarProps> = {}) {
  const props: TopBarProps = {
    title: "Q3 go-to-market plan",
    onTitleChange: vi.fn(),
    selector,
    panel: "closed",
    onPanelToggle: vi.fn(),
    onPanelPin: vi.fn(),
    onShare: vi.fn(),
    onChatMenu: vi.fn(),
    onRailOpen: vi.fn(),
    ...overrides,
  };
  const utils = render(<TopBar {...props} />);
  return { ...utils, props };
}

describe("TopBar", () => {
  it("renders the title and the topbar model selector", () => {
    setup();
    expect(screen.getByText("Q3 go-to-market plan")).toBeInTheDocument();
    expect(screen.getByText("Atlas Pro")).toBeInTheDocument();
    expect(screen.getByText("· frontier")).toBeInTheDocument();
  });

  it("fires the chrome callbacks (rail / share / toggle / menu)", () => {
    const { props } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    expect(props.onRailOpen).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Share" }));
    expect(props.onShare).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Toggle inspector" }));
    expect(props.onPanelToggle).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "More" }));
    expect(props.onChatMenu).toHaveBeenCalledTimes(1);
  });

  it("the panel toggle reflects state and the pin button appears only when open", () => {
    const { props, rerender } = setup({ panel: "closed" });
    expect(
      screen.getByRole("button", { name: "Toggle inspector" }),
    ).toHaveAttribute("aria-pressed", "false");
    expect(
      screen.queryByRole("button", { name: "Pin inspector" }),
    ).not.toBeInTheDocument();

    rerender(<TopBar {...props} panel="float" />);
    expect(
      screen.getByRole("button", { name: "Toggle inspector" }),
    ).toHaveAttribute("aria-pressed", "true");
    const pin = screen.getByRole("button", { name: "Pin inspector" });
    expect(pin).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(pin);
    expect(props.onPanelPin).toHaveBeenCalledTimes(1);

    rerender(<TopBar {...props} panel="pinned" />);
    expect(
      screen.getByRole("button", { name: "Pin inspector" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("commits a trimmed title on Enter", () => {
    const { props } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Rename session" }));
    const input = screen.getByRole("textbox", { name: "Session title" });
    fireEvent.change(input, { target: { value: "  Launch plan  " } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(props.onTitleChange).toHaveBeenCalledWith("Launch plan");
  });

  it("reverts on Escape without calling onTitleChange", () => {
    const { props } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Rename session" }));
    const input = screen.getByRole("textbox", { name: "Session title" });
    fireEvent.change(input, { target: { value: "Changed" } });
    fireEvent.keyDown(input, { key: "Escape" });
    expect(props.onTitleChange).not.toHaveBeenCalled();
    expect(screen.getByText("Q3 go-to-market plan")).toBeInTheDocument();
  });

  it("commits on blur", () => {
    const { props } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Rename session" }));
    const input = screen.getByRole("textbox", { name: "Session title" });
    fireEvent.change(input, { target: { value: "Blurred title" } });
    fireEvent.blur(input);
    expect(props.onTitleChange).toHaveBeenCalledWith("Blurred title");
  });

  it("empty rename falls back to old title (no-op — onTitleChange not fired)", () => {
    const { props } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Rename session" }));
    const input = screen.getByRole("textbox", { name: "Session title" });
    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(props.onTitleChange).not.toHaveBeenCalled();
    expect(screen.getByText("Q3 go-to-market plan")).toBeInTheDocument();
  });

  it("re-committing the same (unchanged) title is a no-op — onTitleChange not fired", () => {
    const { props } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Rename session" }));
    const input = screen.getByRole("textbox", { name: "Session title" });
    fireEvent.change(input, { target: { value: "Q3 go-to-market plan" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(props.onTitleChange).not.toHaveBeenCalled();
  });
});
