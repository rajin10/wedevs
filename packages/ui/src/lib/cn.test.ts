import { describe, it, expect } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("joins class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("includes classes conditionally", () => {
    const active = true;
    const disabled = false;
    expect(cn("base", active && "is-active", disabled && "is-disabled")).toBe(
      "base is-active",
    );
  });

  it("ignores falsy values", () => {
    expect(cn("base", null, undefined, false, 0, "")).toBe("base");
  });

  it("supports object and array inputs", () => {
    expect(cn("base", ["x", { y: true, z: false }])).toBe("base x y");
  });

  it("dedupes conflicting tailwind utilities so the last wins", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("keeps non-conflicting tailwind utilities", () => {
    expect(cn("px-2", "py-4")).toBe("px-2 py-4");
  });

  it("resolves conflicts that arrive via array/object inputs", () => {
    expect(cn(["text-sm", { "text-lg": true }])).toBe("text-lg");
  });
});
