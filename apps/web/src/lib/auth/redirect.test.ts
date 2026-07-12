import { describe, it, expect } from "vitest";
import { authRedirect } from "./redirect";

describe("authRedirect", () => {
  it("sends signed-out users away from /app to /login", () => {
    expect(authRedirect({ pathname: "/app", hasSession: false })).toBe(
      "/login",
    );
    expect(authRedirect({ pathname: "/app/settings", hasSession: false })).toBe(
      "/login",
    );
  });
  it("lets signed-in users into /app", () => {
    expect(authRedirect({ pathname: "/app", hasSession: true })).toBeNull();
  });
  it("sends signed-in users away from /login to /app", () => {
    expect(authRedirect({ pathname: "/login", hasSession: true })).toBe("/app");
  });
  it("lets signed-out users see /login", () => {
    expect(authRedirect({ pathname: "/login", hasSession: false })).toBeNull();
  });
  it("never touches unrelated paths", () => {
    expect(authRedirect({ pathname: "/", hasSession: false })).toBeNull();
    expect(authRedirect({ pathname: "/pricing", hasSession: true })).toBeNull();
  });
});
