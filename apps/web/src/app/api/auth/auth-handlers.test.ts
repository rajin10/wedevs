import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

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
import { GET as callbackGET } from "../../auth/callback/route";

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

describe("callback GET (demo mode)", () => {
  it("redirects to a same-origin ?next path and sets the demo cookie", async () => {
    jar.clear();
    const req = new NextRequest(
      new URL("http://localhost/auth/callback?next=/app/settings"),
    );
    const res = await callbackGET(req);
    expect(res.status).toBe(307);
    const location = res.headers.get("location")!;
    expect(location.endsWith("/app/settings")).toBe(true);
    expect(jar.has("wedevs_demo_session")).toBe(true);
  });

  it("does NOT redirect off-site for an absolute ?next (open redirect)", async () => {
    jar.clear();
    const req = new NextRequest(
      new URL("http://localhost/auth/callback?next=https://evil.example"),
    );
    const res = await callbackGET(req);
    const location = new URL(res.headers.get("location")!);
    expect(location.origin).toBe("http://localhost");
    expect(location.pathname).toBe("/app");
  });

  it("does NOT redirect off-site for a protocol-relative ?next (//evil)", async () => {
    jar.clear();
    const req = new NextRequest(
      new URL("http://localhost/auth/callback?next=//evil.example"),
    );
    const res = await callbackGET(req);
    const location = new URL(res.headers.get("location")!);
    expect(location.origin).toBe("http://localhost");
    expect(location.pathname).toBe("/app");
  });
});
