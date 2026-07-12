import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AppShell } from "./AppShell";
import type { AppShellProps } from "./AppShell";

// jsdom has no matchMedia. Simulate a viewport width: a "(max-width: N)" query
// matches when the simulated width is <= N.
function installMatchMedia(viewportWidth: number): void {
  window.matchMedia = vi.fn().mockImplementation((query: string) => {
    const m = /max-width:\s*(\d+)/.exec(query);
    const matches = m ? viewportWidth <= Number(m[1]) : false;
    return {
      matches,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };
  }) as unknown as typeof window.matchMedia;
}

function baseProps(overrides: Partial<AppShellProps> = {}): AppShellProps {
  return {
    view: "chat",
    panel: "closed",
    rail: "expanded",
    onPanelChange: vi.fn(),
    onRailChange: vi.fn(),
    leftRail: <div data-testid="left-rail">rail</div>,
    topBar: <div data-testid="top-bar">top</div>,
    main: <div data-testid="main-slot">main</div>,
    inspector: <div data-testid="inspector-slot">inspector</div>,
    ...overrides,
  };
}

describe("AppShell", () => {
  beforeEach(() => {
    installMatchMedia(1400); // desktop by default
  });

  it("renders the leftRail, topBar and main slots", () => {
    render(<AppShell {...baseProps()} />);
    expect(screen.getByTestId("left-rail")).toBeInTheDocument();
    expect(screen.getByTestId("top-bar")).toBeInTheDocument();
    expect(screen.getByTestId("main-slot")).toBeInTheDocument();
  });

  it("renders slots in DOM order: leftRail, topBar, main, inspector", () => {
    render(<AppShell {...baseProps({ panel: "float" })} />);
    const ids = ["left-rail", "top-bar", "main-slot", "inspector-slot"];
    const nodes = ids.map((id) => screen.getByTestId(id));
    for (let i = 0; i < nodes.length - 1; i++) {
      // noUncheckedIndexedAccess: i/i+1 are always in-bounds here, so a
      // non-null assertion (not `any`) is the correct, minimal fix.
      const rel = nodes[i]!.compareDocumentPosition(nodes[i + 1]!);
      expect(rel & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }
  });

  it.each(["empty", "chat", "market", "code"] as const)(
    "stamps data-view=%s and renders the given main slot",
    (view) => {
      render(
        <AppShell
          {...baseProps({
            view,
            main: <div data-testid={`body-${view}`}>{view}</div>,
          })}
        />,
      );
      expect(screen.getByTestId("app-shell")).toHaveAttribute(
        "data-view",
        view,
      );
      expect(screen.getByTestId(`body-${view}`)).toBeInTheDocument();
    },
  );

  it("panel=closed hides the Inspector (not mounted)", () => {
    render(<AppShell {...baseProps({ panel: "closed" })} />);
    expect(screen.queryByTestId("inspector-slot")).not.toBeInTheDocument();
    expect(screen.getByTestId("app-shell")).toHaveAttribute(
      "data-panel",
      "closed",
    );
  });

  it("panel=float mounts the Inspector as an overlay", () => {
    render(<AppShell {...baseProps({ panel: "float" })} />);
    expect(screen.getByTestId("inspector-slot")).toBeInTheDocument();
    expect(screen.getByTestId("app-shell")).toHaveAttribute(
      "data-panel",
      "float",
    );
  });

  it("panel=pinned on a wide viewport reflows as a real column", () => {
    installMatchMedia(1400);
    render(<AppShell {...baseProps({ panel: "pinned" })} />);
    expect(screen.getByTestId("app-shell")).toHaveAttribute(
      "data-panel",
      "pinned",
    );
    expect(screen.getByTestId("inspector-slot")).toBeInTheDocument();
  });

  it("pinned Inspector becomes an overlay below 1180px", () => {
    installMatchMedia(1100);
    render(<AppShell {...baseProps({ panel: "pinned" })} />);
    // effectivePanel collapses pinned -> float
    expect(screen.getByTestId("app-shell")).toHaveAttribute(
      "data-panel",
      "float",
    );
  });

  it("rail becomes a drawer with a scrim below 900px", () => {
    installMatchMedia(880);
    render(<AppShell {...baseProps({ rail: "open" })} />);
    const shell = screen.getByTestId("app-shell");
    expect(shell).toHaveAttribute("data-drawer", "1");
    expect(shell).toHaveAttribute("data-rail", "open");
    expect(screen.getByTestId("rail-scrim")).toBeInTheDocument();
  });

  it("stays desktop (no drawer) at 1000px", () => {
    installMatchMedia(1000);
    render(<AppShell {...baseProps({ rail: "collapsed" })} />);
    const shell = screen.getByTestId("app-shell");
    expect(shell).toHaveAttribute("data-drawer", "0");
    expect(shell).toHaveAttribute("data-rail", "collapsed");
  });

  it.each(["expanded", "collapsed", "open"] as const)(
    "stamps data-rail=%s from the prop",
    (rail) => {
      render(<AppShell {...baseProps({ rail })} />);
      expect(screen.getByTestId("app-shell")).toHaveAttribute(
        "data-rail",
        rail,
      );
    },
  );

  it("stamps data-dragging from the dragging+view state but renders no drop banner of its own (Composer owns that overlay)", () => {
    const { rerender } = render(
      <AppShell {...baseProps({ view: "chat", dragging: true })} />,
    );
    expect(screen.getByTestId("app-shell")).toHaveAttribute(
      "data-dragging",
      "1",
    );
    expect(screen.queryByTestId("file-drop")).not.toBeInTheDocument();
    expect(screen.queryByText("Drop files to attach")).not.toBeInTheDocument();

    rerender(<AppShell {...baseProps({ view: "market", dragging: true })} />);
    expect(screen.getByTestId("app-shell")).toHaveAttribute(
      "data-dragging",
      "0",
    );

    rerender(<AppShell {...baseProps({ view: "chat", dragging: false })} />);
    expect(screen.getByTestId("app-shell")).toHaveAttribute(
      "data-dragging",
      "0",
    );
  });

  it("clicking the scrim closes the rail drawer", () => {
    installMatchMedia(880);
    const onRailChange = vi.fn();
    render(<AppShell {...baseProps({ rail: "open", onRailChange })} />);
    fireEvent.click(screen.getByTestId("rail-scrim"));
    expect(onRailChange).toHaveBeenCalledWith("collapsed");
  });

  it("Escape closes a floating Inspector", () => {
    const onPanelChange = vi.fn();
    render(<AppShell {...baseProps({ panel: "float", onPanelChange })} />);
    fireEvent.keyDown(screen.getByTestId("app-shell"), { key: "Escape" });
    expect(onPanelChange).toHaveBeenCalledWith("closed");
  });

  it("Escape does nothing when no overlay is open", () => {
    const onPanelChange = vi.fn();
    render(<AppShell {...baseProps({ panel: "pinned", onPanelChange })} />);
    installMatchMedia(1400);
    fireEvent.keyDown(screen.getByTestId("app-shell"), { key: "Escape" });
    expect(onPanelChange).not.toHaveBeenCalled();
  });

  describe("mobile rail drawer focus management", () => {
    it("Escape closes the drawer when it's open", () => {
      installMatchMedia(880);
      const onRailChange = vi.fn();
      render(<AppShell {...baseProps({ rail: "open", onRailChange })} />);
      fireEvent.keyDown(screen.getByTestId("app-shell"), { key: "Escape" });
      expect(onRailChange).toHaveBeenCalledWith("collapsed");
    });

    it("moves focus into the rail when the drawer opens", () => {
      installMatchMedia(880);
      render(
        <AppShell
          {...baseProps({
            rail: "open",
            leftRail: (
              <div data-testid="left-rail">
                <button type="button">first focusable</button>
              </div>
            ),
          })}
        />,
      );
      expect(screen.getByText("first focusable")).toHaveFocus();
    });

    it("marks .workspace inert while the drawer is open, and not otherwise", () => {
      installMatchMedia(880);
      const { container, rerender } = render(
        <AppShell {...baseProps({ rail: "open" })} />,
      );
      const workspace = container.querySelector(".workspace");
      expect(workspace).toHaveAttribute("inert");

      rerender(<AppShell {...baseProps({ rail: "collapsed" })} />);
      expect(container.querySelector(".workspace")).not.toHaveAttribute(
        "inert",
      );
    });
  });
});
