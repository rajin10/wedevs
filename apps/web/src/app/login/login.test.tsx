import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

import LoginPage from "./page";

describe("LoginPage demo flow", () => {
  beforeEach(() => {
    push.mockClear();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, json: async () => ({ ok: true }) })),
    );
  });

  it("email submit posts to /api/auth/demo then routes to /app", async () => {
    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "a@b.c" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /continue with email/i }),
    );
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/auth/demo",
        expect.objectContaining({ method: "POST" }),
      );
      expect(push).toHaveBeenCalledWith("/app");
    });
  });
});
