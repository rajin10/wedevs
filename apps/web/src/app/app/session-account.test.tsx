import { describe, it, expect } from "vitest";
import { sessionToAccount } from "@/lib/auth/account";

describe("sessionToAccount", () => {
  it("maps a session user onto the Account shape with a title-cased plan", () => {
    expect(
      sessionToAccount({
        id: "u",
        email: "a@b.c",
        name: "Ada L",
        initials: "AL",
        avatarUrl: null,
        plan: "free",
      }),
    ).toEqual({ name: "Ada L", email: "a@b.c", plan: "Free", initials: "AL" });
  });
  it("falls back to a Guest account when signed out", () => {
    expect(sessionToAccount(null)).toEqual({
      name: "Guest",
      email: "",
      plan: "free",
      initials: "G",
    });
  });
});
