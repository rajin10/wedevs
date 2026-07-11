import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Switch } from "./switch";

describe("Switch", () => {
  it("exposes role=switch and toggles aria-checked on keyboard Space", async () => {
    const user = userEvent.setup();
    render(<Switch aria-label="tools" />);
    const sw = screen.getByRole("switch", { name: "tools" });
    expect(sw).toHaveAttribute("aria-checked", "false");
    sw.focus();
    await user.keyboard(" ");
    expect(sw).toHaveAttribute("aria-checked", "true");
  });

  it("uses the --accent token for the checked (on) fill", () => {
    render(<Switch aria-label="tools" />);
    const cls = screen.getByRole("switch", { name: "tools" }).className;
    expect(cls).toContain("data-[state=checked]:bg-[var(--accent)]");
    // off-state fill is the neutral border token
    expect(cls).toContain("bg-[var(--border-2)]");
  });

  it("has a keyboard focus-visible ring", () => {
    render(<Switch aria-label="tools" />);
    const cls = screen.getByRole("switch", { name: "tools" }).className;
    expect(cls).toContain("focus-visible:ring-[var(--accent-line)]");
  });
});
