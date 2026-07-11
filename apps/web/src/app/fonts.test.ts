import { describe, it, expect, vi } from "vitest";

// next/font/local is a Next build-time macro; in a plain Vitest run we stub it
// so it echoes the options back, letting us assert OUR configuration.
vi.mock("next/font/local", () => ({
  default: (opts: { variable?: string; src?: Array<{ weight?: string }> }) => ({
    className: `mock_${opts.variable ?? ""}`,
    variable: opts.variable ?? "",
    style: { fontFamily: opts.variable ?? "" },
    __opts: opts,
  }),
}));

import { fontDisplay, fontSans, fontMono } from "./fonts";

type FontProbe = {
  variable: string;
  __opts: { src: Array<{ weight?: string }> };
};
const probe = (f: unknown) => f as unknown as FontProbe;
const weights = (f: unknown) => probe(f).__opts.src.map((s) => s.weight);

describe("fonts.ts", () => {
  it("exports three families with the canonical CSS-variable names", () => {
    expect(probe(fontDisplay).variable).toBe("--font-display");
    expect(probe(fontSans).variable).toBe("--font-sans");
    expect(probe(fontMono).variable).toBe("--font-mono");
  });

  it("registers exactly the weights from the mockup inventory (line 9)", () => {
    expect(weights(fontDisplay)).toEqual(["600", "700", "800"]);
    expect(weights(fontSans)).toEqual(["400", "500", "600", "700", "800"]);
    expect(weights(fontMono)).toEqual(["400", "500"]);
  });
});
