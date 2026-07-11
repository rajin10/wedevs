import { describe, it, expect } from "vitest";
import { formatBytes } from "./format-bytes";

describe("formatBytes", () => {
  it("formats zero", () => expect(formatBytes(0)).toBe("0 B"));
  it("formats bytes", () => expect(formatBytes(512)).toBe("512 B"));
  it("formats kilobytes", () => expect(formatBytes(1024)).toBe("1 KB"));
  it("formats megabytes with one decimal", () => expect(formatBytes(1_258_291)).toBe("1.2 MB"));
  it("formats gigabytes", () => expect(formatBytes(3_221_225_472)).toBe("3 GB"));
});
