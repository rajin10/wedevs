import { describe, it, expect } from "vitest";

describe("env", () => {
  it("provides GIT_SHA with a default", async () => {
    const { env } = await import("./env");
    expect(typeof env.GIT_SHA).toBe("string");
  });
});
