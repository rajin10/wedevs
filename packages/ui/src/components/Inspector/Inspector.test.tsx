import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Inspector } from "./Inspector";
import type {
  FilePreviewData,
  OutputData,
  ModelDetails,
  PluginConfigData,
} from "../../types";

// jsdom has no matchMedia; useReducedMotion (and Radix) read it.
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
});

const file: FilePreviewData = {
  name: "dashboard-hero.png",
  size: "1.2 MB",
  dims: "2400×1350",
};
const output: OutputData = {
  title: "Analytics",
  percent: 100,
  rows: [
    { label: "Paid search", value: "41%" },
    { label: "Partner channel", value: "27%" },
  ],
};
const model: ModelDetails = {
  name: "Atlas Pro",
  sub: "Frontier model — deepest reasoning.",
  params: [
    { label: "Temperature", value: 0.7, min: 0, max: 2 },
    { label: "Max output tokens", value: 4096, min: 0, max: 8192 },
  ],
  tools: [
    { label: "Web Search", on: true },
    { label: "Code Interpreter", on: true },
  ],
};
const config: PluginConfigData = {
  name: "Notion",
  publisher: "Notion Labs",
  connected: false,
  permissions: [
    { label: "Read pages & databases", on: true },
    { label: "Write & edit content", on: false },
  ],
};

function renderInspector(
  overrides: Partial<React.ComponentProps<typeof Inspector>> = {},
) {
  const props = {
    mode: "pinned" as const,
    tab: "file" as const,
    onTabChange: vi.fn(),
    onPin: vi.fn(),
    onClose: vi.fn(),
    file,
    output,
    model,
    config,
    ...overrides,
  };
  const utils = render(<Inspector {...props} />);
  return { ...utils, props };
}

describe("Inspector", () => {
  it("renders the header title and all four tabs", () => {
    renderInspector();
    expect(screen.getByText("Inspector")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "File" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Output" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Model" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Setup" })).toBeInTheDocument();
  });

  it("fires onTabChange with the tab key when a tab is clicked", () => {
    const { props } = renderInspector();
    fireEvent.click(screen.getByRole("tab", { name: "Output" }));
    expect(props.onTabChange).toHaveBeenCalledWith("output");
    fireEvent.click(screen.getByRole("tab", { name: "Model" }));
    expect(props.onTabChange).toHaveBeenCalledWith("details");
    fireEvent.click(screen.getByRole("tab", { name: "Setup" }));
    expect(props.onTabChange).toHaveBeenCalledWith("config");
  });

  it("the tab prop controls which pane is shown", () => {
    const { rerender, props } = renderInspector({ tab: "file" });
    expect(screen.getByText("dashboard-hero.png")).toBeInTheDocument();
    rerender(<Inspector {...props} tab="output" />);
    expect(screen.getByText("Channel breakdown")).toBeInTheDocument();
    rerender(<Inspector {...props} tab="details" />);
    expect(screen.getByText("Atlas Pro")).toBeInTheDocument();
    rerender(<Inspector {...props} tab="config" />);
    expect(screen.getByText("API key")).toBeInTheDocument();
  });

  it("fires onPin and onClose from the header buttons", () => {
    const { props } = renderInspector();
    fireEvent.click(screen.getByRole("button", { name: /pin/i }));
    expect(props.onPin).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("reveal-key toggles the API key input between password and text", () => {
    renderInspector({ tab: "config" });
    const input = screen.getByDisplayValue("ntn_5f8a92c4e1b7");
    expect(input).toHaveAttribute("type", "password");
    const revealBtn = screen.getByRole("button", { name: "Show" });
    fireEvent.click(revealBtn);
    expect(input).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: "Hide" })).toBeInTheDocument();
  });

  it("connect updates local config state to connected", () => {
    renderInspector({ tab: "config" });
    expect(screen.getByText("Notion Labs · not connected")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /connect account/i }));
    expect(screen.getByText("Notion Labs · connected")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /connected/i }),
    ).toBeInTheDocument();
  });

  it("Cancel and Save both call onClose", () => {
    const { props } = renderInspector({ tab: "config" });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(props.onClose).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(props.onClose).toHaveBeenCalledTimes(2);
  });

  it("output ring and model range-fill use --accent; on-tools render checked", () => {
    const { rerender, props } = renderInspector({ tab: "output" });
    const ring = screen.getByTestId("ring");
    expect(ring.getAttribute("style")).toContain("var(--accent)");
    expect(ring.getAttribute("style")).toContain("100%");

    rerender(<Inspector {...props} tab="details" />);
    const fills = screen.getAllByTestId("range-fill");
    expect(fills.length).toBe(2);
    expect(fills[0]!.className).toContain("var(--accent)");
    // Temperature 0.7 of [0,2] => 35%
    expect(fills[0]!.getAttribute("style")).toContain("35%");
    const switches = screen.getAllByRole("switch");
    expect(switches[0]).toHaveAttribute("data-state", "checked");
  });

  it("renders neutral header/tabs (no accent leak on chrome)", () => {
    renderInspector();
    const head = screen.getByTestId("inspector-head");
    expect(head.className).not.toContain("var(--accent)");
    const activeTab = screen.getByRole("tab", { name: "File" });
    // active tab uses neutral --active / --text, never accent
    expect(activeTab.className).not.toContain("var(--accent)");
  });

  it("renders all three PanelMode widths", () => {
    const base = {
      tab: "file" as const,
      onTabChange: vi.fn(),
      onPin: vi.fn(),
      onClose: vi.fn(),
      file,
    };
    const { rerender } = render(<Inspector {...base} mode="closed" />);
    let aside = screen.getByTestId("inspector");
    expect(aside).toHaveAttribute("data-panel", "closed");
    expect(aside.className).toContain("w-0");

    rerender(<Inspector {...base} mode="pinned" />);
    aside = screen.getByTestId("inspector");
    expect(aside).toHaveAttribute("data-panel", "pinned");
    expect(aside.className).toContain("w-[400px]");

    rerender(<Inspector {...base} mode="float" />);
    aside = screen.getByTestId("inspector");
    expect(aside).toHaveAttribute("data-panel", "float");
    expect(aside.className).toContain("w-[390px]");
    expect(aside.className).toContain("absolute");
  });
});
