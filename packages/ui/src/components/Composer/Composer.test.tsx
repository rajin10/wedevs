import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Composer } from "./Composer";
import type { Attachment } from "../../types";

// jsdom has no matchMedia; useReducedMotion reads it.
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

const FOOT_NOTE = "Wedevs can make mistakes — verify important info.";

const attachments: Attachment[] = [
  {
    id: "a1",
    name: "dashboard-hero.png",
    sub: "1.2 MB · uploading…",
    kind: "image",
    progress: 66,
  },
  { id: "a2", name: "spec-v3.docx", sub: "88 KB", kind: "doc" },
];

function renderComposer(
  overrides: Partial<React.ComponentProps<typeof Composer>> = {},
) {
  const props = {
    variant: "chat" as const,
    value: "",
    onChange: vi.fn(),
    onSubmit: vi.fn(),
    attachments: [] as Attachment[],
    attachOpen: false,
    onAttach: vi.fn(),
    onRemoveAttachment: vi.fn(),
    toolsOn: false,
    onToggleTools: vi.fn(),
    onVoice: vi.fn(),
    agentPill: <button type="button">Atlas Pro</button>,
    dragging: false,
    toolCount: 0,
    ...overrides,
  };
  const utils = render(<Composer {...props} />);
  return { ...utils, props };
}

describe("Composer", () => {
  it("renders the injected agentPill node (does not build its own selector)", () => {
    renderComposer({ agentPill: <span data-testid="pill">Atlas Pro</span> });
    expect(screen.getByTestId("pill")).toBeInTheDocument();
  });

  it("typing in the textarea calls onChange with the new value", async () => {
    const user = userEvent.setup();
    const { props } = renderComposer();
    await user.type(screen.getByRole("textbox"), "H");
    expect(props.onChange).toHaveBeenCalledWith("H");
  });

  it("Enter submits, Shift+Enter does not", async () => {
    const user = userEvent.setup();
    const { props } = renderComposer();
    screen.getByRole("textbox").focus();
    await user.keyboard("{Enter}");
    expect(props.onSubmit).toHaveBeenCalledTimes(1);
    await user.keyboard("{Shift>}{Enter}{/Shift}");
    expect(props.onSubmit).toHaveBeenCalledTimes(1);
  });

  it("Enter during IME composition does not submit (isComposing)", () => {
    const { props } = renderComposer();
    const textarea = screen.getByRole("textbox");
    fireEvent.keyDown(textarea, { key: "Enter", isComposing: true });
    expect(props.onSubmit).not.toHaveBeenCalled();
  });

  it("Enter with the legacy IME keyCode 229 does not submit", () => {
    const { props } = renderComposer();
    const textarea = screen.getByRole("textbox");
    fireEvent.keyDown(textarea, { key: "Enter", keyCode: 229 });
    expect(props.onSubmit).not.toHaveBeenCalled();
  });

  it("Ctrl+Enter also submits", async () => {
    const user = userEvent.setup();
    const { props } = renderComposer();
    screen.getByRole("textbox").focus();
    await user.keyboard("{Control>}{Enter}{/Control}");
    expect(props.onSubmit).toHaveBeenCalledTimes(1);
  });

  it("clicking the send button calls onSubmit", async () => {
    const user = userEvent.setup();
    const { props } = renderComposer({ value: "hi" });
    await user.click(screen.getByRole("button", { name: "Send message" }));
    expect(props.onSubmit).toHaveBeenCalledTimes(1);
  });

  it("attach, tools, and voice buttons fire their callbacks", async () => {
    const user = userEvent.setup();
    const { props } = renderComposer();
    await user.click(screen.getByRole("button", { name: "Attach files" }));
    expect(props.onAttach).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("button", { name: "Tools and plugins" }));
    expect(props.onToggleTools).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("button", { name: "Voice input" }));
    expect(props.onVoice).toHaveBeenCalledTimes(1);
  });

  it("renders attachment chips and removing one calls onRemoveAttachment with its id", async () => {
    const user = userEvent.setup();
    const { props } = renderComposer({ attachments, attachOpen: true });
    expect(screen.getByText("dashboard-hero.png")).toBeInTheDocument();
    expect(screen.getByText("spec-v3.docx")).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Remove dashboard-hero.png" }),
    );
    expect(props.onRemoveAttachment).toHaveBeenCalledWith("a1");
  });

  it("shows the tray when attachOpen is true even with no attachments, and hides it otherwise", () => {
    const { rerender, props } = renderComposer({ attachOpen: false });
    expect(screen.queryByTestId("attachment-tray")).not.toBeInTheDocument();
    rerender(<Composer {...props} attachOpen />);
    expect(screen.getByTestId("attachment-tray")).toBeInTheDocument();
  });

  it("shows the drop overlay only when dragging is true", () => {
    const { rerender, props } = renderComposer({ dragging: false });
    expect(screen.queryByTestId("drop-overlay")).not.toBeInTheDocument();
    rerender(<Composer {...props} dragging />);
    expect(screen.getByTestId("drop-overlay")).toBeInTheDocument();
    expect(screen.getByText("Drop files to attach")).toBeInTheDocument();
  });

  it("empty variant renders a taller textarea and a centered foot", () => {
    renderComposer({ variant: "empty" });
    expect(screen.getByRole("textbox").className).toContain("min-h-[52px]");
    expect(screen.getByTestId("composer")).toHaveAttribute(
      "data-variant",
      "empty",
    );
    expect(screen.getByText(FOOT_NOTE)).toBeInTheDocument();
  });

  it("chat variant shows the enabled-tools count in the foot when tools are on", () => {
    renderComposer({ variant: "chat", toolsOn: true, toolCount: 2 });
    expect(screen.getByText("2 tools enabled")).toBeInTheDocument();
    expect(screen.getByTestId("tool-count")).toHaveTextContent("2");
  });

  it("stays brand-compliant: send is neutral; only the focus ring + tools on-state are Volt", () => {
    renderComposer({ toolsOn: true, toolCount: 2 });

    const send = screen.getByRole("button", { name: "Send message" });
    expect(send.className).toContain("var(--primary)");
    expect(send.className).not.toContain("--accent");

    const ring = screen
      .getByTestId("composer")
      .querySelector("[data-focus-ring]");
    expect(ring?.className).toContain(
      "focus-within:border-[var(--accent-line)]",
    );

    // tools on-state = sanctioned liveness Volt
    const tools = screen.getByRole("button", { name: "Tools and plugins" });
    expect(tools.className).toContain("var(--accent)");
  });
});
