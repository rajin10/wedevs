import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

import LoginPage from "./login/page";

afterEach(() => {
  cleanup();
  pushMock.mockClear();
});

describe("Login page", () => {
  it("renders exactly one h1 sign-in heading", () => {
    render(<LoginPage />);
    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent(/sign in to wedevs/i);
  });

  it("renders a labeled email input", () => {
    render(<LoginPage />);
    const input = screen.getByLabelText(/email/i);
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("type", "email");
  });

  it("renders the three sign-in buttons", () => {
    render(<LoginPage />);
    expect(
      screen.getByRole("button", { name: /continue with email/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /continue with google/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /continue with github/i }),
    ).toBeInTheDocument();
  });

  it("routes to /app when 'Continue with email' is submitted", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);
    await user.type(screen.getByLabelText(/email/i), "demo@wedevs.cloud");
    await user.click(
      screen.getByRole("button", { name: /continue with email/i }),
    );
    expect(pushMock).toHaveBeenCalledWith("/app");
  });

  it("routes to /app via the Google OAuth demo button", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);
    await user.click(
      screen.getByRole("button", { name: /continue with google/i }),
    );
    expect(pushMock).toHaveBeenCalledWith("/app");
  });

  it("routes to /app via the GitHub OAuth demo button", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);
    await user.click(
      screen.getByRole("button", { name: /continue with github/i }),
    );
    expect(pushMock).toHaveBeenCalledWith("/app");
  });

  it("links the 'Skip — explore the demo' path to /app", () => {
    render(<LoginPage />);
    const skip = screen.getByRole("link", { name: /skip.*explore the demo/i });
    expect(skip).toHaveAttribute("href", "/app");
  });

  it("links the wordmark back to the landing page", () => {
    render(<LoginPage />);
    const home = screen.getByRole("link", { name: /wedevs/i });
    expect(home).toHaveAttribute("href", "/");
  });
});
