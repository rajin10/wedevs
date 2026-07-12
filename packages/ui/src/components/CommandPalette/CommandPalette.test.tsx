import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CommandPalette } from "./CommandPalette";
import type { CommandItem } from "../../types";

function makeItem(
  id: string,
  label: string,
  group: CommandItem["group"],
  kbd?: string,
): CommandItem {
  return { id, label, group, kbd, onSelect: vi.fn() };
}

function setup(
  overrides: Partial<React.ComponentProps<typeof CommandPalette>> = {},
) {
  const actions = [
    makeItem("new-chat", "New chat", "actions", "⌘N"),
    makeItem("open-settings", "Open settings", "actions"),
  ];
  const recents = [
    makeItem("c1", "Q3 go-to-market plan", "recent"),
    makeItem("c2", "Landing page copy review", "recent"),
  ];
  const models = [makeItem("m1", "Switch to Atlas Air", "models")];
  const onOpenChange = vi.fn();
  const utils = render(
    <CommandPalette
      open
      onOpenChange={onOpenChange}
      actions={actions}
      recents={recents}
      models={models}
      {...overrides}
    />,
  );
  return { ...utils, actions, recents, models, onOpenChange };
}

describe("CommandPalette", () => {
  it("does not render palette content when open is false", () => {
    render(
      <CommandPalette
        open={false}
        onOpenChange={vi.fn()}
        actions={[makeItem("a", "New chat", "actions")]}
        recents={[]}
        models={[]}
      />,
    );
    expect(
      screen.queryByPlaceholderText(/search chats/i),
    ).not.toBeInTheDocument();
  });

  it("renders the search input, esc hint, and all three groups in order", () => {
    setup();
    expect(
      screen.getByPlaceholderText(/search chats, models, plugins, actions/i),
    ).toBeInTheDocument();
    expect(screen.getByText("esc")).toBeInTheDocument();

    const headings = screen
      .getAllByText(/^(Actions|Recent chats|Models)$/)
      .map((el) => el.textContent);
    expect(headings).toEqual(["Actions", "Recent chats", "Models"]);
  });

  it("filters items as the user types in the search input", () => {
    setup();
    const input = screen.getByPlaceholderText(/search chats/i);
    fireEvent.change(input, { target: { value: "settings" } });

    expect(screen.getByText("Open settings")).toBeInTheDocument();
    expect(screen.queryByText("New chat")).not.toBeInTheDocument();
    expect(screen.queryByText("Q3 go-to-market plan")).not.toBeInTheDocument();
  });

  it("moves the active row with arrow keys and fires the selected item's onSelect on Enter", () => {
    const { actions } = setup();
    const input = screen.getByPlaceholderText(/search chats/i);

    // cmdk auto-selects the first option; ArrowDown advances to the second ("Open settings").
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(actions[1]!.onSelect).toHaveBeenCalledTimes(1);
    expect(actions[0]!.onSelect).not.toHaveBeenCalled();
  });

  it("closes (onOpenChange(false)) after an item is selected", () => {
    const { actions, onOpenChange } = setup();
    const input = screen.getByPlaceholderText(/search chats/i);
    fireEvent.keyDown(input, { key: "Enter" }); // fires first option
    expect(actions[0]!.onSelect).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("opens on the global ⌘K / Ctrl+K shortcut", () => {
    const onOpenChange = vi.fn();
    render(
      <CommandPalette
        open={false}
        onOpenChange={onOpenChange}
        actions={[makeItem("a", "New chat", "actions")]}
        recents={[]}
        models={[]}
      />,
    );
    fireEvent.keyDown(document, { key: "k", metaKey: true });
    expect(onOpenChange).toHaveBeenCalledWith(true);

    onOpenChange.mockClear();
    fireEvent.keyDown(document, { key: "k", ctrlKey: true });
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it("active rows use the neutral --hover token and never --accent", () => {
    setup();
    const options = screen.getAllByRole("option");
    expect(options.length).toBeGreaterThan(0);
    for (const opt of options) {
      expect(opt.className).toContain("data-[selected=true]:bg-[var(--hover)]");
      expect(opt.className).not.toMatch(/accent/);
    }
  });
});
