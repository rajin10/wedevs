import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { MarketView } from "./MarketView";
import type { PluginCardData } from "../types";

const plugins: PluginCardData[] = [
  {
    id: "web-search",
    name: "Web Search",
    publisher: "Core",
    verified: true,
    desc: "Live web results with citations.",
    tags: ["Search", "Citations"],
    enabled: true,
  },
  {
    id: "notion",
    name: "Notion",
    publisher: "Notion Labs",
    desc: "Read & write pages.",
    tags: ["Productivity", "Docs"],
    enabled: false,
  },
];

describe("MarketView", () => {
  it("renders a status label that matches each plugin's enabled state", () => {
    render(
      <MarketView plugins={plugins} onToggle={vi.fn()} onConfigure={vi.fn()} />,
    );
    expect(screen.getByText("Enabled")).toBeInTheDocument();
    expect(screen.getByText("Disabled")).toBeInTheDocument();
  });

  it("fires onToggle with the plugin id and the next state", () => {
    const onToggle = vi.fn();
    render(
      <MarketView
        plugins={plugins}
        onToggle={onToggle}
        onConfigure={vi.fn()}
      />,
    );
    const card = screen
      .getByText("Notion")
      .closest('[data-testid="plugin-card"]') as HTMLElement;
    fireEvent.click(within(card).getByRole("switch"));
    expect(onToggle).toHaveBeenCalledWith("notion", true);
  });

  it("fires onConfigure with the plugin id", () => {
    const onConfigure = vi.fn();
    render(
      <MarketView
        plugins={plugins}
        onToggle={vi.fn()}
        onConfigure={onConfigure}
      />,
    );
    const card = screen
      .getByText("Web Search")
      .closest('[data-testid="plugin-card"]') as HTMLElement;
    fireEvent.click(within(card).getByRole("button", { name: /Configure/ }));
    expect(onConfigure).toHaveBeenCalledWith("web-search");
  });
});
