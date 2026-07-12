import { describe, it, expect, vi } from "vitest";

// Route handlers use next/headers cookies(); provide a mutable stub.
const jar = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    set: (name: string, value: string) => jar.set(name, value),
    delete: (name: string) => jar.delete(name),
    get: (name: string) =>
      jar.has(name) ? { name, value: jar.get(name)! } : undefined,
  }),
}));

import { POST as demoPOST } from "./demo/route";
import { POST as signoutPOST } from "./signout/route";

describe("auth route handlers (demo mode)", () => {
  it("POST /api/auth/demo sets the demo cookie and returns ok", async () => {
    jar.clear();
    const res = await demoPOST();
    expect(res.status).toBe(200);
    expect(jar.has("wedevs_demo_session")).toBe(true);
  });

  it("POST /api/auth/signout clears the demo cookie", async () => {
    jar.set("wedevs_demo_session", "x");
    const res = await signoutPOST();
    expect(res.status).toBe(200);
    expect(jar.has("wedevs_demo_session")).toBe(false);
  });
});
