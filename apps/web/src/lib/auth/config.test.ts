import { describe, it, expect } from "vitest";
import { isSupabaseConfigured } from "./config";

describe("isSupabaseConfigured", () => {
  it("is false in the test env (no Supabase vars set) → demo mode", () => {
    expect(isSupabaseConfigured()).toBe(false);
  });
});
