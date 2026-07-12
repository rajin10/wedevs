import { describe, it, expect } from "vitest";
import {
  DEMO_COOKIE,
  DEMO_USER,
  encodeDemoSession,
  decodeDemoSession,
} from "./demo-session";

describe("demo-session cookie", () => {
  it("exposes a stable cookie name and a demo identity", () => {
    expect(DEMO_COOKIE).toBe("wedevs_demo_session");
    expect(DEMO_USER.id).toBe("demo-user");
    expect(DEMO_USER.plan).toBe("free");
  });

  it("round-trips a user through encode → decode", () => {
    const encoded = encodeDemoSession(DEMO_USER);
    expect(typeof encoded).toBe("string");
    expect(decodeDemoSession(encoded)).toEqual(DEMO_USER);
  });

  it("returns null for undefined / empty / garbage input", () => {
    expect(decodeDemoSession(undefined)).toBeNull();
    expect(decodeDemoSession("")).toBeNull();
    expect(decodeDemoSession("!!!not-base64!!!")).toBeNull();
  });

  it("returns null when decoded JSON lacks required fields", () => {
    const bad = Buffer.from(JSON.stringify({ foo: 1 }), "utf8").toString(
      "base64url",
    );
    expect(decodeDemoSession(bad)).toBeNull();
  });
});
