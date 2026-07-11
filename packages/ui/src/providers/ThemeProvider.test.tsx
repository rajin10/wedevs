import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, act, cleanup } from "@testing-library/react";
import { ThemeProvider, useTheme } from "./ThemeProvider";
import { useThemeStore } from "../store/theme";

const themeAttr = (): string | null =>
  document.documentElement.getAttribute("data-theme");

describe("ThemeProvider", () => {
  beforeEach(() => {
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.removeAttribute("data-theme-transition");
    document.getElementById("wedevs-theme-fade")?.remove();
    act(() => {
      useThemeStore.getState().setMode("dark");
    });
  });
  afterEach(() => cleanup());

  it("stamps the resolved theme onto <html data-theme>", () => {
    render(<ThemeProvider>hi</ThemeProvider>);
    expect(themeAttr()).toBe("dark");
  });

  it("updates data-theme when the mode changes", () => {
    render(<ThemeProvider>hi</ThemeProvider>);
    expect(themeAttr()).toBe("dark");
    act(() => {
      useThemeStore.getState().setMode("light");
    });
    expect(themeAttr()).toBe("light");
  });

  it("arms the cross-fade transition attribute after mount", () => {
    render(<ThemeProvider>hi</ThemeProvider>);
    expect(document.documentElement.getAttribute("data-theme-transition")).toBe(
      "on",
    );
  });

  it("injects a reduced-motion-guarded cross-fade stylesheet (mockup line 558)", () => {
    render(<ThemeProvider>hi</ThemeProvider>);
    const style = document.getElementById("wedevs-theme-fade");
    expect(style).not.toBeNull();
    expect(style?.textContent).toContain(
      "prefers-reduced-motion: no-preference",
    );
    expect(style?.textContent).toContain("background-color .28s ease");
  });

  it("exposes the live store through useTheme()", () => {
    let seen: string | undefined;
    function Probe(): null {
      seen = useTheme().resolved;
      return null;
    }
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(seen).toBe("dark");
  });
});
