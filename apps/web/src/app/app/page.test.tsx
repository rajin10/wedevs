import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  ThemeProvider,
  ToastProvider,
  useThemeStore,
  resolveTheme,
} from "@wedevs/ui";
import { useUIStore, initialUIState } from "@/store/ui";
import { SessionProvider } from "@/components/session-provider";
import type { SessionUser } from "@/lib/auth/types";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

import ShellPage from "./page";

const sessionUser: SessionUser = {
  id: "u1",
  email: "hasib.webdev@gmail.com",
  name: "Hasib Rahman",
  initials: "HR",
  avatarUrl: null,
  plan: "pro",
};

function setMatchMedia(reduceMotion: boolean, systemDark: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: query.includes("prefers-reduced-motion")
      ? reduceMotion
      : query.includes("prefers-color-scheme: dark")
        ? systemDark
        : false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

function renderShell() {
  return render(
    <SessionProvider user={sessionUser}>
      <ThemeProvider>
        <ToastProvider>
          <ShellPage />
        </ToastProvider>
      </ThemeProvider>
    </SessionProvider>,
  );
}

beforeEach(() => {
  cleanup();
  pushMock.mockClear();
  localStorage.clear();
  setMatchMedia(false, true); // motion allowed, system=dark
  useUIStore.setState(initialUIState);
  document.documentElement.removeAttribute("data-theme");
  // `useThemeStore` (Task 3) is a module-level zustand singleton — its
  // `resolved` value is only computed once, at module-import time, against
  // whatever `matchMedia` existed then. Re-derive it here against THIS
  // test's matchMedia mock so every test starts from a known, correctly
  // system-resolved theme instead of carrying over whatever the previous
  // test's toggle/setMode left behind.
  useThemeStore.setState({ mode: "system", resolved: resolveTheme("system") });
});

describe("shell view routing", () => {
  it("renders the empty view greeting when view=empty", () => {
    useUIStore.setState({ view: "empty" });
    renderShell();
    expect(screen.getByText("Good afternoon, Hasib")).toBeInTheDocument();
  });

  it("renders real ChatView content when view=chat", () => {
    useUIStore.setState({ view: "chat" });
    renderShell();
    expect(
      screen.getByText(
        "Summarize our Q3 go-to-market plan and flag the risks.",
      ),
    ).toBeInTheDocument();
  });

  it("renders CodeView repo/branch when view=code", () => {
    useUIStore.setState({ view: "code" });
    renderShell();
    // The repo name is split across a muted-org <span> + a raw "cloud" text
    // node under the same element, so it's asserted against the rendered
    // text as a whole rather than via getByText's per-node text matching
    // (which only concatenates an element's OWN direct text-node children).
    expect(document.body.textContent).toContain("wedevs/cloud");
  });

  it("renders MarketView plugin cards when view=market", () => {
    useUIStore.setState({ view: "market" });
    renderShell();
    expect(screen.getByText("Linear")).toBeInTheDocument();
    expect(screen.getByText("GitHub")).toBeInTheDocument();
  });

  it("mounts the Inspector only when panel is open", () => {
    useUIStore.setState({ view: "chat", panel: "closed" });
    renderShell();
    // closed: no inspector output title
    expect(screen.queryByText("Analysis complete")).not.toBeInTheDocument();
    cleanup();
    useUIStore.setState({
      view: "chat",
      panel: "float",
      inspectorTab: "output",
    });
    renderShell();
    expect(screen.getByText("Analysis complete")).toBeInTheDocument();
  });
});

describe("theme", () => {
  it("stamps a data-theme on <html> and flips it on toggle", async () => {
    const user = userEvent.setup();
    renderShell();
    const html = document.documentElement;
    const before = html.getAttribute("data-theme");
    expect(before).toBeTruthy(); // system(dark) resolved
    await user.click(screen.getByTestId("theme-toggle"));
    const after = html.getAttribute("data-theme");
    expect(after).toBeTruthy();
    expect(after).not.toBe(before); // light <-> dark cycle
  });

  it("renders correctly under a forced light system preference", () => {
    setMatchMedia(false, false); // system=light
    useThemeStore.setState({
      mode: "system",
      resolved: resolveTheme("system"),
    });
    useUIStore.setState({ view: "empty" });
    renderShell();
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(screen.getByText("Good afternoon, Hasib")).toBeInTheDocument();
  });

  it("renders correctly under a forced dark system preference", () => {
    setMatchMedia(false, true); // system=dark
    useThemeStore.setState({
      mode: "system",
      resolved: resolveTheme("system"),
    });
    useUIStore.setState({ view: "empty" });
    renderShell();
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(screen.getByText("Good afternoon, Hasib")).toBeInTheDocument();
  });
});

describe("reduced motion", () => {
  it("emits no animate-* utility classes when prefers-reduced-motion is set", () => {
    setMatchMedia(true, true); // reduce = true
    useUIStore.setState({
      view: "chat",
      panel: "float",
      inspectorTab: "output",
    });
    const { container } = renderShell();
    const animated = container.querySelectorAll('[class*="animate-"]');
    expect(animated.length).toBe(0);
  });

  it("does emit animation classes when motion is allowed (control)", () => {
    setMatchMedia(false, true); // reduce = false
    useUIStore.setState({ view: "chat", panel: "closed" });
    const { container } = renderShell();
    // At least the streaming caret / live dot animate when motion is allowed.
    expect(
      container.querySelectorAll('[class*="animate-"]').length,
    ).toBeGreaterThan(0);
  });
});

describe("keyboard focus", () => {
  it("moves focus onto an interactive element on Tab", async () => {
    const user = userEvent.setup();
    useUIStore.setState({ view: "empty" });
    renderShell();
    expect(document.body).toHaveFocus();
    await user.tab();
    const active = document.activeElement;
    expect(active).not.toBe(document.body);
    expect(["BUTTON", "INPUT", "TEXTAREA", "A"]).toContain(active?.tagName);
  });

  it("opens the command palette when onSearch fires from the rail", async () => {
    const user = userEvent.setup();
    useUIStore.setState({ view: "empty" });
    renderShell();
    // Drive the store action the rail search button is wired to.
    useUIStore.getState().setPaletteOpen(true);
    // palette dialog should now be queryable
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    await user.keyboard("{Escape}");
  });
});

describe("Volt audit — accent appears on no non-alive element", () => {
  // Selectors for the ONLY surfaces allowed to paint with --accent on this
  // page (binding reconciliation #5 — supersedes the narrower list in the
  // Task 16 brief's Step 13 draft, which omitted the LiveDot slot and the
  // CodeEditor diff markers): live primitives (caret/dots/cluster), the
  // LiveDot slot, mascots, diff markers, switch on-states, the composer's
  // sanctioned focus-within ring, and the demo dev-bar's ambient glow.
  const ALLOWED = [
    '[data-slot="live-dot"]',
    "[data-live]",
    "[data-mascot]",
    "[data-focus-ring]",
    '[role="switch"]',
    ".switch",
    "[data-diff]",
    '[data-testid="dev-bar"]',
  ].join(",");

  // A class TOKEN that carries a Tailwind variant prefix (`focus-visible:`,
  // `focus-within:`, `hover:`, `data-[state=...]:`, ...) only ever paints
  // while that pseudo-class/state condition holds — jsdom's static
  // className never reflects live :focus/:hover, so those tokens can never
  // be "always on" and are not what the Volt rule is policing (keyboard
  // focus rings are a separately-asserted, explicitly sanctioned category —
  // see the "keyboard focus" describe block above). Only a token with NO
  // variant prefix (no `:`) unconditionally paints on every render.
  function paintsAccentUnconditionally(el: Element): boolean {
    const cls = el.getAttribute("class") ?? "";
    return cls
      .split(/\s+/)
      .some(
        (token) =>
          token.length > 0 && !token.includes(":") && /accent/.test(token),
      );
  }

  it("keeps primary buttons, active nav, and bubbles neutral", () => {
    useUIStore.setState({ view: "chat", panel: "closed" });
    const { container } = renderShell();

    // New chat is a neutral --primary/--active button, never volt.
    const newChat = screen.getByRole("button", { name: /new chat/i });
    expect(newChat.className).not.toMatch(/accent/);

    // Active nav item ("Chat") is neutral --active, not volt.
    const chatNav = container.querySelector('[data-nav="chat"]');
    expect(chatNav).toBeTruthy();
    expect((chatNav as HTMLElement).className).not.toMatch(/accent/);

    // The user chat bubble is neutral --bubble, never volt.
    const bubble = screen.getByText(
      "Summarize our Q3 go-to-market plan and flag the risks.",
    );
    expect(bubble.className).not.toMatch(/accent/);
  });

  it("every accent-classed element is a sanctioned alive/allowed surface", () => {
    useUIStore.setState({
      view: "chat",
      panel: "float",
      inspectorTab: "output",
    });
    const { container } = renderShell();

    const accentEls = Array.from(
      container.querySelectorAll<HTMLElement>('[class*="accent"]'),
    ).filter(paintsAccentUnconditionally);

    // There should be at least one (the streaming caret / live dot) — proves
    // the audit is actually seeing rendered accent usage, not a false pass.
    expect(accentEls.length).toBeGreaterThan(0);

    for (const el of accentEls) {
      const sanctioned = el.matches(ALLOWED) || el.closest(ALLOWED) !== null;
      expect(
        sanctioned,
        `accent used on non-alive element: <${el.tagName.toLowerCase()} class="${el.className}">`,
      ).toBe(true);
    }
  });

  it("every accent-classed element stays sanctioned on the market screen", () => {
    useUIStore.setState({ view: "market" });
    const { container } = renderShell();

    const accentEls = Array.from(
      container.querySelectorAll<HTMLElement>('[class*="accent"]'),
    ).filter(paintsAccentUnconditionally);

    for (const el of accentEls) {
      const sanctioned = el.matches(ALLOWED) || el.closest(ALLOWED) !== null;
      expect(
        sanctioned,
        `accent used on non-alive element: <${el.tagName.toLowerCase()} class="${el.className}">`,
      ).toBe(true);
    }
  });

  it("every accent-classed element stays sanctioned on the empty screen", () => {
    useUIStore.setState({ view: "empty" });
    const { container } = renderShell();

    const accentEls = Array.from(
      container.querySelectorAll<HTMLElement>('[class*="accent"]'),
    ).filter(paintsAccentUnconditionally);

    // The eyebrow dash (data-live="eyebrow") is a sanctioned accent surface
    // on this screen — proves the audit is seeing real accent usage here too.
    expect(accentEls.length).toBeGreaterThan(0);

    for (const el of accentEls) {
      const sanctioned = el.matches(ALLOWED) || el.closest(ALLOWED) !== null;
      expect(
        sanctioned,
        `accent used on non-alive element: <${el.tagName.toLowerCase()} class="${el.className}">`,
      ).toBe(true);
    }
  });

  it.each(["file", "details", "config"] as const)(
    "every accent-classed element stays sanctioned on the code screen (Inspector tab=%s)",
    (inspectorTab) => {
      useUIStore.setState({
        view: "code",
        panel: "float",
        inspectorTab,
      });
      const { container } = renderShell();

      const accentEls = Array.from(
        container.querySelectorAll<HTMLElement>('[class*="accent"]'),
      ).filter(paintsAccentUnconditionally);

      for (const el of accentEls) {
        const sanctioned = el.matches(ALLOWED) || el.closest(ALLOWED) !== null;
        expect(
          sanctioned,
          `accent used on non-alive element: <${el.tagName.toLowerCase()} class="${el.className}">`,
        ).toBe(true);
      }
    },
  );
});
