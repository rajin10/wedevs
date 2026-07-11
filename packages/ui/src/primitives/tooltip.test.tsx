import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "./tooltip";

function Harness() {
  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger>Info</TooltipTrigger>
        <TooltipContent>Helpful text</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

describe("Tooltip", () => {
  it("shows content with role=tooltip on hover", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.hover(screen.getByRole("button", { name: "Info" }));
    const tips = await screen.findAllByRole("tooltip");
    expect(tips[0]).toHaveTextContent("Helpful text");
  });
});
