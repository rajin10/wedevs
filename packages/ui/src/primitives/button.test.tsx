import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "./button";

describe("Button", () => {
  it("primary is neutral: uses --primary fill, no accent background", () => {
    render(<Button>Save</Button>); // primary is the default variant
    const btn = screen.getByRole("button", { name: "Save" });
    const cls = btn.className;
    expect(cls).toContain("bg-[var(--primary)]");
    expect(cls).toContain("text-[var(--primary-text)]");
    // Volt is forbidden as a Button fill — only the focus ring may be accent.
    expect(cls).not.toContain("bg-[var(--accent)]");
    expect(cls).not.toContain("accent-soft");
  });

  it("carries a keyboard focus-visible ring using the accent-line token", () => {
    render(<Button>Go</Button>);
    const cls = screen.getByRole("button", { name: "Go" }).className;
    expect(cls).toContain("focus-visible:ring-2");
    expect(cls).toContain("focus-visible:ring-[var(--accent-line)]");
  });

  it("danger variant uses the --error token", () => {
    render(<Button variant="danger">Delete</Button>);
    const cls = screen.getByRole("button", { name: "Delete" }).className;
    expect(cls).toContain("text-[var(--error)]");
    expect(cls).not.toContain("bg-[var(--primary)]");
  });

  it("icon variant is a 34px square", () => {
    render(<Button variant="icon" aria-label="menu" />);
    const cls = screen.getByRole("button", { name: "menu" }).className;
    expect(cls).toContain("h-[34px]");
    expect(cls).toContain("w-[34px]");
  });

  it("asChild renders the child element (a link), not a button", () => {
    render(
      <Button asChild>
        <a href="/x">Link</a>
      </Button>,
    );
    const link = screen.getByRole("link", { name: "Link" });
    expect(link.tagName).toBe("A");
    expect(link.className).toContain("bg-[var(--primary)]");
  });
});
