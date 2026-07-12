import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EmptyView } from "./EmptyView";
import type { ComposerProps } from "../types";

function composerFixture(
  overrides: Partial<ComposerProps> = {},
): ComposerProps {
  return {
    variant: "empty",
    value: "",
    onChange: vi.fn(),
    onSubmit: vi.fn(),
    attachments: [],
    attachOpen: false,
    onAttach: vi.fn(),
    onRemoveAttachment: vi.fn(),
    toolsOn: false,
    onToggleTools: vi.fn(),
    onVoice: vi.fn(),
    agentPill: <span>Atlas Pro</span>,
    ...overrides,
  };
}

describe("EmptyView", () => {
  it("renders the greeting heading, starter buttons and a composer textbox", () => {
    render(
      <EmptyView
        greeting="Good afternoon, Ayesha."
        starters={["Draft a launch announcement", "Review this pull request"]}
        composer={composerFixture()}
      />,
    );
    expect(
      screen.getByRole("heading", { name: "Good afternoon, Ayesha." }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Draft a launch announcement/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Review this pull request/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("clicking a starter fills the composer via onChange", () => {
    const onChange = vi.fn();
    render(
      <EmptyView
        greeting="Hi"
        starters={["Analyze a CSV of sales data"]}
        composer={composerFixture({ onChange })}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: /Analyze a CSV of sales data/ }),
    );
    expect(onChange).toHaveBeenCalledWith("Analyze a CSV of sales data");
  });
});
