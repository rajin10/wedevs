import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

function Hello({ name }: { name: string }) {
  return <button type="button">Hello {name}</button>;
}

describe("jsdom + RTL harness", () => {
  it("renders a React component and queries it by role", () => {
    render(<Hello name="Wedevs" />);
    const button = screen.getByRole("button", { name: "Hello Wedevs" });
    expect(button).toBeInTheDocument();
  });

  it("unmounts between tests (cleanup wired)", () => {
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
