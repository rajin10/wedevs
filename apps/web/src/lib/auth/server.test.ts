import { describe, it, expect, vi } from "vitest";
import { DEMO_USER, encodeDemoSession } from "./demo-session";

// Next.js's webpack build aliases the "server-only" marker package to a no-op
// when compiling for the server, and to the real (throwing) package when
// compiling for the client — that's what makes it a build-time guard. Vitest
// has no equivalent aliasing, so the real package throws unconditionally.
// Stub it here so this file's server-only-gated import (./server) loads
// under test; this is test-infra only and has no effect on prod builds.
vi.mock("server-only", () => ({}));

const cookieStore = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      cookieStore.has(name)
        ? { name, value: cookieStore.get(name)! }
        : undefined,
  }),
}));
const redirectMock = vi.fn((url: string) => {
  throw new Error(`REDIRECT:${url}`);
});
vi.mock("next/navigation", () => ({
  redirect: (u: string) => redirectMock(u),
}));

import { getUser, requireUser } from "./server";

describe("getUser / requireUser (demo mode)", () => {
  it("returns null when no demo cookie is set", async () => {
    cookieStore.clear();
    expect(await getUser()).toBeNull();
  });

  it("returns the demo user when the demo cookie is present", async () => {
    cookieStore.set("wedevs_demo_session", encodeDemoSession(DEMO_USER));
    expect(await getUser()).toEqual(DEMO_USER);
  });

  it("requireUser redirects to /login when signed out", async () => {
    cookieStore.clear();
    await expect(requireUser()).rejects.toThrow("REDIRECT:/login");
  });
});
