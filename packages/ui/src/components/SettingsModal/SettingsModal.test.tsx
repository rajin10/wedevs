import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { SettingsModal } from "./SettingsModal";
import type { SettingsPane } from "../../types";
import type { ThemeMode } from "../../store/theme";

function setup(
  overrides: Partial<React.ComponentProps<typeof SettingsModal>> = {},
) {
  const props = {
    open: true,
    onOpenChange: vi.fn(),
    pane: "appearance" as SettingsPane,
    onPaneChange: vi.fn(),
    themeMode: "dark" as ThemeMode,
    onThemeChange: vi.fn(),
    ...overrides,
  };
  render(<SettingsModal {...props} />);
  return props;
}

describe("SettingsModal", () => {
  it("renders nothing when open is false", () => {
    setup({ open: false });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("renders the modal with the current pane title", () => {
    setup({ pane: "appearance" });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Appearance" }),
    ).toBeInTheDocument();
  });

  it("shows the Data & privacy title when pane is data", () => {
    setup({ pane: "data" });
    expect(
      screen.getByRole("heading", { level: 2, name: "Data & privacy" }),
    ).toBeInTheDocument();
  });

  it("fires onPaneChange when a sub-nav item is clicked", () => {
    const props = setup({ pane: "appearance" });
    fireEvent.click(screen.getByRole("button", { name: "Models" }));
    expect(props.onPaneChange).toHaveBeenCalledWith("models");
  });

  it("marks the active pane nav item with aria-current", () => {
    setup({ pane: "appearance" });
    expect(screen.getByRole("button", { name: "Appearance" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("button", { name: "Models" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("fires onThemeChange when a theme swatch is picked", () => {
    const props = setup({ pane: "appearance", themeMode: "dark" });
    fireEvent.click(screen.getByRole("button", { name: "Light" }));
    expect(props.onThemeChange).toHaveBeenCalledWith("light");
  });

  it("styles the active theme swatch with --active-line and never with accent", () => {
    setup({ pane: "appearance", themeMode: "dark" });
    const active = screen.getByRole("button", { name: "Dark" });
    expect(active).toHaveAttribute("data-active", "true");
    expect(active.className).toMatch(/active-line/);
    expect(active.className).not.toMatch(/accent/);
    const inactive = screen.getByRole("button", { name: "Light" });
    expect(inactive).toHaveAttribute("data-active", "false");
  });

  it("swaps the active segmented button on click", () => {
    setup({ pane: "appearance" });
    const group = screen.getByRole("group", { name: "Accent color" });
    const slate = within(group).getByRole("button", { name: "Slate" });
    const neutral = within(group).getByRole("button", { name: "Neutral" });
    expect(slate).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(neutral);
    expect(neutral).toHaveAttribute("aria-pressed", "true");
    expect(slate).toHaveAttribute("aria-pressed", "false");
  });

  it("flips the reduce-motion switch when toggled", () => {
    setup({ pane: "appearance" });
    const sw = screen.getByRole("switch", { name: "Reduce motion" });
    expect(sw).toHaveAttribute("aria-checked", "false");
    fireEvent.click(sw);
    expect(sw).toHaveAttribute("aria-checked", "true");
  });

  it("requests close when the header close button is clicked", () => {
    const props = setup({ pane: "appearance" });
    fireEvent.click(screen.getByRole("button", { name: "Close settings" }));
    expect(props.onOpenChange).toHaveBeenCalledWith(false);
  });
});
