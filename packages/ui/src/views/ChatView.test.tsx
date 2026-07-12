import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { ChatView } from "./ChatView";
import type { ChatMessage, ComposerProps, StreamingMessage } from "../types";

function composerFixture(): ComposerProps {
  return {
    variant: "chat",
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
  };
}

const messages: ChatMessage[] = [
  { id: "u1", role: "user", time: "14:21", text: "Draft a Q3 plan." },
  {
    id: "a1",
    role: "assistant",
    model: "Atlas Pro",
    time: "14:22",
    text: "Here is the plan.",
    tool: {
      id: "t1",
      name: "Analytics · channel breakdown",
      desc: "Ran on Q2-metrics.pdf",
      done: "1.2s",
      rows: [{ label: "Paid search", value: "41%" }],
    },
  },
];

describe("ChatView", () => {
  it("right-aligns the user bubble", () => {
    render(
      <ChatView
        messages={messages}
        composer={composerFixture()}
        onOpenOutput={vi.fn()}
      />,
    );
    const bubble = screen.getByText("Draft a Q3 plan.");
    expect(bubble.closest("div.group")).toHaveClass("justify-end");
  });

  it("fires onOpenOutput with the tool id when 'Open in panel' is clicked", () => {
    const onOpenOutput = vi.fn();
    render(
      <ChatView
        messages={messages}
        composer={composerFixture()}
        onOpenOutput={onOpenOutput}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Open in panel/ }));
    expect(onOpenOutput).toHaveBeenCalledWith("t1");
  });

  it("renders the streaming reveal (StreamShimmer text + running tool + LiveCluster 'now')", () => {
    const streaming: StreamingMessage = {
      model: "Atlas Pro",
      runningTool: {
        id: "r1",
        name: "Running analytics",
        desc: "Reading Q2-metrics.pdf…",
        rows: [],
      },
      partialText: "Weighting toward paid search",
    };
    render(
      <ChatView
        messages={messages}
        streaming={streaming}
        composer={composerFixture()}
        onOpenOutput={vi.fn()}
      />,
    );
    const stream = screen.getByTestId("streaming-message");
    expect(
      within(stream).getByText("Weighting toward paid search"),
    ).toBeInTheDocument();
    expect(within(stream).getByText("Running analytics")).toBeInTheDocument();
    expect(within(stream).getByText("now")).toBeInTheDocument();
    expect(within(stream).getByTestId("stream-line")).toBeInTheDocument();
  });
});
