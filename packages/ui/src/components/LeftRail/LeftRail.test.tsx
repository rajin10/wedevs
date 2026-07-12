import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LeftRail } from "./LeftRail";
import type { NavItem, RecentChat, Project, Account } from "../../types";

const nav: NavItem[] = [
  {
    id: "chat",
    label: "Chats",
    icon: <svg data-testid="ic-chat" />,
    kbd: undefined,
  },
  { id: "code", label: "Code", icon: <svg data-testid="ic-code" /> },
  { id: "market", label: "Plugins", icon: <svg data-testid="ic-market" /> },
];

const recents: RecentChat[] = [
  { id: "r0", title: "Q3 go-to-market plan", group: "pinned", pinned: true },
  { id: "r1", title: "Landing page copy review", group: "today" },
  { id: "r2", title: "Refactor auth middleware", group: "today" },
  { id: "r3", title: "Trip itinerary — Kyoto", group: "previous7" },
];

const projects: Project[] = [
  { id: "p1", name: "Marketing site", count: 8 },
  { id: "p2", name: "API v2", count: 14 },
];

const account: Account = {
  name: "Ayesha Khan",
  email: "ayesha@wedevs.io",
  plan: "Pro workspace",
  initials: "AK",
};

function setup(overrides: Partial<React.ComponentProps<typeof LeftRail>> = {}) {
  const props = {
    mode: "expanded" as const,
    nav,
    activeNav: "chat" as const,
    recents,
    projects,
    account,
    onNavSelect: vi.fn(),
    onNewChat: vi.fn(),
    onSearch: vi.fn(),
    onToggleCollapse: vi.fn(),
    onRenameChat: vi.fn(),
    onChatAction: vi.fn(),
    onAccountAction: vi.fn(),
    ...overrides,
  };
  const utils = render(<LeftRail {...props} />);
  return { ...utils, props };
}

describe("LeftRail", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders brand name, all nav labels, recents, and projects when expanded", () => {
    setup();
    expect(screen.getByText("Wedevs")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /new chat/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /search/i })).toBeInTheDocument();
    expect(screen.getByText("Chats")).toBeInTheDocument();
    expect(screen.getByText("Code")).toBeInTheDocument();
    expect(screen.getByText("Plugins")).toBeInTheDocument();
    expect(screen.getByText("Landing page copy review")).toBeInTheDocument();
    expect(screen.getByText("Marketing site")).toBeInTheDocument();
    expect(screen.getByText("14")).toBeInTheDocument(); // project count tag
    expect(screen.getByText("Ayesha Khan")).toBeInTheDocument();
  });

  it("renders a swappable brandLogo node when provided", () => {
    setup({
      brandLogo: <img alt="Acme" src="logo.png" data-testid="brand-img" />,
    });
    expect(screen.getByTestId("brand-img")).toBeInTheDocument();
  });

  it("renders the LiveDot logo-dot (the only accent element)", () => {
    const { container } = setup();
    expect(container.querySelector('[data-slot="live-dot"]')).toBeTruthy();
  });

  it("collapsed mode hides labels and the recents/projects list", () => {
    const { container } = setup({ mode: "collapsed" });
    // brand name + group headers + recents titles + account meta are hidden
    expect(screen.queryByText("Wedevs")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Landing page copy review"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Marketing site")).not.toBeInTheDocument();
    expect(screen.queryByText("Ayesha Khan")).not.toBeInTheDocument();
    // root carries the collapsed data attribute
    expect(container.querySelector('[data-rail="collapsed"]')).toBeTruthy();
  });

  it("active nav item uses NEUTRAL tokens, never accent", () => {
    const { container } = setup({ activeNav: "chat" });
    const active = container.querySelector('[data-nav="chat"]');
    expect(active).toHaveAttribute("data-active", "true");
    const cls = active?.getAttribute("class") ?? "";
    expect(cls).toMatch(/var\(--active\)/);
    expect(cls).not.toMatch(/accent/);
    const inactive = container.querySelector('[data-nav="code"]');
    expect(inactive).toHaveAttribute("data-active", "false");
  });

  it("fires onNavSelect with the nav key on click", async () => {
    const user = userEvent.setup();
    const { props } = setup();
    await user.click(screen.getByText("Code"));
    expect(props.onNavSelect).toHaveBeenCalledWith("code");
  });

  it("fires onNewChat and onSearch", async () => {
    const user = userEvent.setup();
    const { props } = setup();
    await user.click(screen.getByRole("button", { name: /new chat/i }));
    expect(props.onNewChat).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("button", { name: /search/i }));
    expect(props.onSearch).toHaveBeenCalledTimes(1);
  });

  it("row ⋯ menu opens and fires onChatAction with each action incl. danger delete", async () => {
    const user = userEvent.setup();
    const { props } = setup();
    // open the ⋯ menu for the "Landing page copy review" (r1) row
    const trigger = screen.getByRole("button", {
      name: /chat options for landing page copy review/i,
    });
    await user.click(trigger);
    const menu = await screen.findByRole("menu");
    await user.click(within(menu).getByRole("menuitem", { name: /^pin$/i }));
    expect(props.onChatAction).toHaveBeenCalledWith("r1", "pin");

    await user.click(trigger);
    const menu2 = await screen.findByRole("menu");
    const del = within(menu2).getByRole("menuitem", { name: /^delete$/i });
    expect(del).toHaveAttribute("data-danger", "true");
    await user.click(del);
    expect(props.onChatAction).toHaveBeenCalledWith("r1", "delete");
  });

  it("pinned rows keep the star indicator AND get the same keyboard-operable ⋯ menu", async () => {
    const user = userEvent.setup();
    const { props } = setup();
    // r0 ("Q3 go-to-market plan") is the pinned fixture row — the star
    // indicator (aria-hidden svg) must still render alongside the ChatIcon
    // and the new menu trigger's DotsIcon (3 svgs total on the row).
    const row = screen.getByText("Q3 go-to-market plan").closest("div")!;
    expect(row.querySelectorAll("svg").length).toBe(3);
    const trigger = screen.getByRole("button", {
      name: /chat options for q3 go-to-market plan/i,
    });
    expect(trigger).toBeInTheDocument();
    await user.click(trigger);
    const menu = await screen.findByRole("menu");
    await user.click(
      within(menu).getByRole("menuitem", { name: /^archive$/i }),
    );
    expect(props.onChatAction).toHaveBeenCalledWith("r0", "archive");
  });

  it("double-click a recent swaps to a rename Input; Enter commits via onRenameChat", async () => {
    const { props } = setup();
    const row = screen.getByText("Refactor auth middleware");
    fireEvent.doubleClick(row);
    const input = screen.getByRole("textbox", {
      name: /rename chat/i,
    }) as HTMLInputElement;
    expect(input.value).toBe("Refactor auth middleware");
    fireEvent.change(input, { target: { value: "Auth middleware refactor" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(props.onRenameChat).toHaveBeenCalledWith(
      "r2",
      "Auth middleware refactor",
    );
    // input is gone after commit
    expect(
      screen.queryByRole("textbox", { name: /rename chat/i }),
    ).not.toBeInTheDocument();
  });

  it("rename Escape reverts without firing onRenameChat", () => {
    const { props } = setup();
    fireEvent.doubleClick(screen.getByText("Refactor auth middleware"));
    const input = screen.getByRole("textbox", { name: /rename chat/i });
    fireEvent.change(input, { target: { value: "nope" } });
    fireEvent.keyDown(input, { key: "Escape" });
    expect(props.onRenameChat).not.toHaveBeenCalled();
    expect(screen.getByText("Refactor auth middleware")).toBeInTheDocument();
  });

  it("empty rename falls back to old title (no rename fired)", () => {
    const { props } = setup();
    fireEvent.doubleClick(screen.getByText("Refactor auth middleware"));
    const input = screen.getByRole("textbox", { name: /rename chat/i });
    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(props.onRenameChat).not.toHaveBeenCalled();
    expect(screen.getByText("Refactor auth middleware")).toBeInTheDocument();
  });

  it("collapse button fires onToggleCollapse", async () => {
    const user = userEvent.setup();
    const { props } = setup();
    await user.click(screen.getByRole("button", { name: /collapse sidebar/i }));
    expect(props.onToggleCollapse).toHaveBeenCalledTimes(1);
  });

  it("account chip menu fires onAccountAction (settings + logout)", async () => {
    const user = userEvent.setup();
    const { props } = setup();
    await user.click(
      screen.getByRole("button", { name: /account menu for ayesha khan/i }),
    );
    const menu = await screen.findByRole("menu");
    await user.click(
      within(menu).getByRole("menuitem", { name: /^settings$/i }),
    );
    expect(props.onAccountAction).toHaveBeenCalledWith("settings");

    await user.click(
      screen.getByRole("button", { name: /account menu for ayesha khan/i }),
    );
    const menu2 = await screen.findByRole("menu");
    await user.click(within(menu2).getByRole("menuitem", { name: /log out/i }));
    expect(props.onAccountAction).toHaveBeenCalledWith("logout");
  });

  it("dedicated Settings row fires onAccountAction('settings')", async () => {
    const user = userEvent.setup();
    const { props } = setup();
    await user.click(screen.getByRole("button", { name: /^settings$/i }));
    expect(props.onAccountAction).toHaveBeenCalledWith("settings");
  });
});
