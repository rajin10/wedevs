import { describe, it, expect } from "vitest";
import { demoCookieLooksValid } from "./constants";
import {
  DEMO_USER,
  encodeDemoSession,
  decodeDemoSession,
} from "./demo-session";

describe("demoCookieLooksValid", () => {
  it("accepts a real encoded demo session", () => {
    expect(demoCookieLooksValid(encodeDemoSession(DEMO_USER))).toBe(true);
  });
  it("rejects undefined / empty / garbage / missing-fields", () => {
    expect(demoCookieLooksValid(undefined)).toBe(false);
    expect(demoCookieLooksValid("")).toBe(false);
    expect(demoCookieLooksValid("!!!not-base64!!!")).toBe(false);
    const bad = Buffer.from(JSON.stringify({ foo: 1 }), "utf8").toString(
      "base64url",
    );
    expect(demoCookieLooksValid(bad)).toBe(false);
  });
  it("AGREES with decodeDemoSession for every input (no middleware/layout disagreement)", () => {
    const cases = [
      encodeDemoSession(DEMO_USER),
      undefined,
      "",
      "garbage",
      Buffer.from(JSON.stringify({ foo: 1 }), "utf8").toString("base64url"),
      Buffer.from(JSON.stringify({ id: "x", email: "e" }), "utf8").toString(
        "base64url",
      ),
    ];
    for (const c of cases) {
      expect(demoCookieLooksValid(c)).toBe(decodeDemoSession(c) !== null);
    }
  });
});
