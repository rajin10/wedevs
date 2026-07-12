import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ModelSelector } from "./ModelSelector";
import type { ModelOption, AgentOption, ModelSelectorProps } from "../../types";

// Radix Popover (popper) + user-event need these jsdom shims.
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
  const proto = Element.prototype as unknown as {
    hasPointerCapture?: (id: number) => boolean;
    setPointerCapture?: (id: number) => void;
    releasePointerCapture?: (id: number) => void;
    scrollIntoView?: () => void;
  };
  proto.hasPointerCapture ||= () => false;
  proto.setPointerCapture ||= () => {};
  proto.releasePointerCapture ||= () => {};
  proto.scrollIntoView ||= () => {};
});

const models: ModelOption[] = [
  {
    id: "atlas-pro",
    name: "Atlas Pro",
    group: "frontier",
    sub: "Deepest reasoning for complex, multi-step work.",
    tags: ["Reasoning", "Vision", "Long context", "Tools"],
  },
  {
    id: "atlas-air",
    name: "Atlas Air",
    group: "fast",
    sub: "Snappy responses for everyday tasks & drafts.",
    tags: ["Speed", "Vision", "Tools"],
  },
  {
    id: "nova-local",
    name: "Nova Local",
    group: "local",
    sub: "Runs on your machine — private, offline-capable.",
    tags: ["Private", "Offline"],
  },
];

const agents: AgentOption[] = [
  {
    id: "writer",
    name: "Writer",
    persona: "Long-form drafting",
    specialty: "Atlas Pro + web search",
  },
  {
    id: "coder",
    name: "Coder",
    persona: "Code + repo tools",
    specialty: "Atlas Pro + sandbox",
  },
  {
    id: "analyst",
    name: "Analyst",
    persona: "Data & charts",
    specialty: "Atlas Pro + code interpreter",
  },
];

function setup(overrides: Partial<ModelSelectorProps> = {}) {
  const props: ModelSelectorProps = {
    models,
    agents,
    selectedModelId: "atlas-pro",
    onSelectModel: vi.fn(),
    variant: "topbar",
    ...overrides,
  };
  const utils = render(<ModelSelector {...props} />);
  return { ...utils, props };
}

describe("ModelSelector", () => {
  it("topbar trigger shows the selected model name and its group", () => {
    setup();
    expect(screen.getByText("Atlas Pro")).toBeInTheDocument();
    expect(screen.getByText("· frontier")).toBeInTheDocument();
  });

  it("opens the popover and renders models grouped by tier", () => {
    setup();
    // while closed there is exactly one button: the trigger
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText("Frontier")).toBeInTheDocument();
    expect(screen.getByText("Fast")).toBeInTheDocument();
    expect(screen.getByText("Local")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /atlas air/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /nova local/i }),
    ).toBeInTheDocument();
    // selected row renders its capability chips
    expect(screen.getByText("Reasoning")).toBeInTheDocument();
    expect(screen.getByText("Long context")).toBeInTheDocument();
  });

  it("fires onSelectModel with the model id when a row is clicked", () => {
    const { props } = setup();
    fireEvent.click(screen.getByRole("button")); // open
    fireEvent.click(screen.getByRole("button", { name: /atlas air/i }));
    expect(props.onSelectModel).toHaveBeenCalledWith("atlas-air");
  });

  it("switching to the Agents tab reveals the agents", () => {
    setup();
    fireEvent.click(screen.getByRole("button")); // open
    fireEvent.click(screen.getByRole("tab", { name: "Agents" }));
    expect(screen.getByRole("button", { name: /writer/i })).toBeInTheDocument();
    expect(screen.getByText("Long-form drafting")).toBeInTheDocument();
    expect(screen.getByText("Atlas Pro + web search")).toBeInTheDocument();
  });

  it("selecting an agent fires onSelectModel with the agent id", () => {
    const { props } = setup();
    fireEvent.click(screen.getByRole("button")); // open
    fireEvent.click(screen.getByRole("tab", { name: "Agents" }));
    fireEvent.click(screen.getByRole("button", { name: /coder/i }));
    expect(props.onSelectModel).toHaveBeenCalledWith("coder");
  });

  it("filters rows as the user types in the search box", async () => {
    const user = userEvent.setup();
    setup();
    fireEvent.click(screen.getByRole("button")); // open
    const search = screen.getByRole("textbox", {
      name: /search models and agents/i,
    });
    await user.type(search, "air");
    expect(
      screen.getByRole("button", { name: /atlas air/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /nova local/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Local")).not.toBeInTheDocument();
  });

  it("pill variant renders the compact rounded pill trigger", () => {
    setup({ variant: "pill" });
    const trigger = screen.getByRole("button");
    expect(trigger).toHaveTextContent("Atlas Pro");
    expect(trigger.className).toContain("rounded-full");
  });
});
