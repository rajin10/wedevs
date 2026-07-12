import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CodeView } from "./CodeView";

const base = { repo: "wedevs/web-app", branch: "main", sync: "synced · ↑2 ↓0" };

describe("CodeView", () => {
  it("fires onAction for Run / Create PR / Commit in order", () => {
    const onAction = vi.fn();
    render(<CodeView {...base} onAction={onAction} />);
    fireEvent.click(screen.getByRole("button", { name: /Run/ }));
    fireEvent.click(screen.getByRole("button", { name: /Create PR/ }));
    fireEvent.click(screen.getByRole("button", { name: /Commit/ }));
    expect(onAction).toHaveBeenNthCalledWith(1, "run");
    expect(onAction).toHaveBeenNthCalledWith(2, "pr");
    expect(onAction).toHaveBeenNthCalledWith(3, "commit");
  });

  it("renders diff add / del / editing lines", () => {
    const { container } = render(<CodeView {...base} onAction={vi.fn()} />);
    expect(container.querySelector('[data-diff="add"]')).not.toBeNull();
    expect(container.querySelector('[data-diff="del"]')).not.toBeNull();
    expect(container.querySelector('[data-diff="editing"]')).not.toBeNull();
  });

  it("hides the file tree at <=760px via a responsive utility class", () => {
    const { container } = render(<CodeView {...base} onAction={vi.fn()} />);
    const tree = container.querySelector('[data-testid="code-tree"]');
    expect(tree).not.toBeNull();
    expect(tree?.className).toContain("max-[760px]:hidden");
  });

  it("shows the branch name in both the head button and the foot", () => {
    render(<CodeView {...base} onAction={vi.fn()} />);
    expect(screen.getAllByText("main").length).toBeGreaterThanOrEqual(2);
  });
});
