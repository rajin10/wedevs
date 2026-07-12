import { describe, it, expect, vi } from "vitest";

// cookies() is async in Next 15; stub it so importing the module is safe.
vi.mock("next/headers", () => ({
  cookies: async () => ({ getAll: () => [], setAll: () => {} }),
}));

import { getSupabaseUser } from "./server";
import { isSupabaseConfigured } from "../config";

describe("getSupabaseUser (unconfigured / demo env)", () => {
  it("returns null without throwing when Supabase env is absent", async () => {
    expect(isSupabaseConfigured()).toBe(false);
    await expect(getSupabaseUser()).resolves.toBeNull();
  });
});
