"use client";

import * as React from "react";
import {
  User,
  Palette,
  Boxes,
  Puzzle,
  Database,
  Keyboard,
  Sun,
  Moon,
  Monitor,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "../../primitives/dialog";
import { Switch } from "../../primitives/switch";
import { Button } from "../../primitives/button";
import { cn } from "../../lib/cn";
import type { SettingsPane, SettingsModalProps, ThemeMode } from "../../types";

export type { SettingsModalProps };

interface NavEntry {
  id: SettingsPane;
  label: string;
  icon: React.ReactNode;
}

const NAV: NavEntry[] = [
  { id: "account", label: "Account", icon: <User className="h-4 w-4" /> },
  {
    id: "appearance",
    label: "Appearance",
    icon: <Palette className="h-4 w-4" />,
  },
  { id: "models", label: "Models", icon: <Boxes className="h-4 w-4" /> },
  { id: "plugins", label: "Plugins", icon: <Puzzle className="h-4 w-4" /> },
  {
    id: "data",
    label: "Data & privacy",
    icon: <Database className="h-4 w-4" />,
  },
  { id: "keys", label: "Shortcuts", icon: <Keyboard className="h-4 w-4" /> },
];

const TITLES: Record<SettingsPane, string> = {
  account: "Account",
  appearance: "Appearance",
  models: "Models",
  plugins: "Plugins",
  data: "Data & privacy",
  keys: "Shortcuts",
};

// ── theme-preview swatches (literal-hex chrome — sanctioned, mockup 500–504) ──
type SwatchVariant = "light" | "dark" | "sys";
interface SwatchDef {
  mode: ThemeMode;
  label: string;
  icon: React.ReactNode;
  variant: SwatchVariant;
}
const SWATCHES: SwatchDef[] = [
  {
    mode: "light",
    label: "Light",
    icon: <Sun className="h-4 w-4" />,
    variant: "light",
  },
  {
    mode: "dark",
    label: "Dark",
    icon: <Moon className="h-4 w-4" />,
    variant: "dark",
  },
  {
    mode: "system",
    label: "System",
    icon: <Monitor className="h-4 w-4" />,
    variant: "sys",
  },
];

function topStyle(v: SwatchVariant): React.CSSProperties {
  if (v === "light") return { background: "#f5f6f8" };
  if (v === "dark") return { background: "#0f1113" };
  return { background: "linear-gradient(90deg,#f5f6f8 50%,#0f1113 50%)" };
}
function barStyle(v: SwatchVariant): React.CSSProperties {
  if (v === "light") return { background: "#dfe3e8" };
  if (v === "dark") return { background: "#22262b" };
  return { background: "linear-gradient(90deg,#dfe3e8 50%,#22262b 50%)" };
}
function mainStyle(v: SwatchVariant): React.CSSProperties {
  if (v === "light") return { background: "#fff", border: "1px solid #e5e8ec" };
  if (v === "dark")
    return { background: "#17191c", border: "1px solid #262a2f" };
  return { background: "linear-gradient(90deg,#fff 50%,#17191c 50%)" };
}

function ThemeSwatch({
  def,
  active,
  onPick,
}: {
  def: SwatchDef;
  active: boolean;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      data-theme-pick={def.mode}
      data-active={active}
      onClick={onPick}
      className={cn(
        "flex-1 cursor-pointer overflow-hidden rounded-xl border text-left",
        active
          ? "border-[var(--active-line)] shadow-[0_0_0_3px_var(--hover)]"
          : "border-[var(--border)]",
      )}
    >
      <div
        className="flex h-[52px] gap-[5px] p-[9px]"
        style={topStyle(def.variant)}
      >
        <div className="w-[22px] rounded" style={barStyle(def.variant)} />
        <div className="flex-1 rounded" style={mainStyle(def.variant)} />
      </div>
      <div className="flex items-center gap-[7px] border-t border-[var(--border)] px-[11px] py-[8px] text-xs font-semibold">
        {def.icon}
        {def.label}
      </div>
    </button>
  );
}

// ── segmented control (mockup .seg 491–493 / JS 1531–1534) ──
function Seg({
  options,
  value,
  onValueChange,
  ariaLabel,
}: {
  options: string[];
  value: string;
  onValueChange: (v: string) => void;
  ariaLabel: string;
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="flex gap-[3px] rounded-[10px] bg-[var(--hover)] p-[3px]"
    >
      {options.map((opt) => {
        const active = opt === value;
        return (
          <button
            key={opt}
            type="button"
            aria-pressed={active}
            onClick={() => onValueChange(opt)}
            className={cn(
              "rounded-lg px-[13px] py-[7px] text-xs font-semibold",
              active
                ? "bg-[var(--surface)] text-[var(--text)] shadow-[var(--shadow-sm)]"
                : "text-[var(--text-3)]",
            )}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

// ── row (mockup .set-row 486–490) ──
function SetRow({
  title,
  desc,
  leading,
  children,
  stacked,
}: {
  title?: string;
  desc?: string;
  leading?: React.ReactNode;
  children?: React.ReactNode;
  stacked?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex gap-4 border-b border-[var(--border)] py-4 last:border-b-0",
        stacked ? "flex-col items-stretch gap-3" : "items-center",
      )}
    >
      {leading}
      {(title || desc) && (
        <div className="flex-1">
          {title && <div className="text-sm font-semibold">{title}</div>}
          {desc && (
            <div className="mt-0.5 text-[12.5px] text-[var(--text-3)]">
              {desc}
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md border border-[var(--border)] bg-[var(--hover)] px-2 py-1 font-mono text-xs text-[var(--text-2)]">
      {children}
    </span>
  );
}

export function SettingsModal({
  open,
  onOpenChange,
  pane,
  onPaneChange,
  themeMode,
  onThemeChange,
  account,
}: SettingsModalProps) {
  // Local demo state for controls not lifted to props.
  const [accent, setAccent] = React.useState("Slate");
  const [density, setDensity] = React.useState("Cozy");
  const [reduceMotion, setReduceMotion] = React.useState(false);
  const [defaultModel, setDefaultModel] = React.useState("Atlas Pro");
  const [stream, setStream] = React.useState(true);
  const [webSearch, setWebSearch] = React.useState(true);
  const [codeInterp, setCodeInterp] = React.useState(true);
  const [notion, setNotion] = React.useState(false);
  const [history, setHistory] = React.useState(true);
  const [improve, setImprove] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex h-[min(620px,92vh)] w-full max-w-[880px] gap-0 overflow-hidden rounded-[18px] border border-[var(--border-2)] bg-[var(--surface)] p-0 shadow-[var(--shadow)]"
      >
        <DialogDescription className="sr-only">
          Workspace settings
        </DialogDescription>
        {/* sub-nav (mockup .set-nav 474–480) */}
        <nav className="flex w-[210px] flex-none flex-col gap-0.5 border-r border-[var(--border)] bg-[var(--sidebar)] px-[10px] py-4">
          <h3 className="px-[10px] pb-3 pt-1 text-[15px] font-bold">
            Settings
          </h3>
          {NAV.map((n) => {
            const active = n.id === pane;
            return (
              <button
                key={n.id}
                type="button"
                data-set={n.id}
                aria-current={active ? "page" : undefined}
                onClick={() => onPaneChange(n.id)}
                className={cn(
                  "flex items-center gap-2.5 rounded-[9px] px-[11px] py-[9px] text-[13.5px] font-medium",
                  active
                    ? "bg-[var(--active)] text-[var(--text)]"
                    : "text-[var(--text-2)] hover:bg-[var(--hover)] hover:text-[var(--text)]",
                )}
              >
                <span className="text-[var(--text-3)]">{n.icon}</span>
                {n.label}
              </button>
            );
          })}
        </nav>

        {/* main (mockup .set-main 481–485) */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex h-[56px] flex-none items-center justify-between border-b border-[var(--border)] px-5">
            <DialogTitle className="text-base font-bold">
              {TITLES[pane]}
            </DialogTitle>
            <DialogClose asChild>
              <Button variant="icon" aria-label="Close settings">
                <X className="h-[18px] w-[18px]" />
              </Button>
            </DialogClose>
          </div>

          <div className="flex-1 overflow-y-auto p-[22px]">
            {pane === "appearance" && (
              <div data-setpane="appearance">
                <SetRow
                  stacked
                  title="Theme"
                  desc="Choose how the workspace looks. System follows your OS setting."
                >
                  <div className="mt-2 flex gap-3">
                    {SWATCHES.map((s) => (
                      <ThemeSwatch
                        key={s.mode}
                        def={s}
                        active={s.mode === themeMode}
                        onPick={() => onThemeChange(s.mode)}
                      />
                    ))}
                  </div>
                </SetRow>
                <SetRow
                  title="Accent color"
                  desc="A single swappable token — used only for focus, links, and selected state."
                >
                  <Seg
                    options={["Slate", "Neutral", "Custom"]}
                    value={accent}
                    onValueChange={setAccent}
                    ariaLabel="Accent color"
                  />
                </SetRow>
                <SetRow title="Density" desc="Spacing of lists and messages.">
                  <Seg
                    options={["Compact", "Cozy"]}
                    value={density}
                    onValueChange={setDensity}
                    ariaLabel="Density"
                  />
                </SetRow>
                <SetRow
                  title="Reduce motion"
                  desc="Minimize animations and transitions."
                >
                  <Switch
                    checked={reduceMotion}
                    onCheckedChange={setReduceMotion}
                    aria-label="Reduce motion"
                  />
                </SetRow>
              </div>
            )}

            {pane === "account" && (
              <div data-setpane="account">
                <SetRow
                  leading={
                    <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[var(--active)] text-lg font-semibold">
                      {account?.initials ?? "AK"}
                    </div>
                  }
                  title={account?.name ?? "Ayesha Khan"}
                  desc={
                    account
                      ? `${account.email} · ${account.plan} workspace`
                      : "ayesha@company.com · Pro workspace"
                  }
                >
                  <Button variant="outline">Change</Button>
                </SetRow>
                <SetRow title="Display name" desc="Shown on shared chats.">
                  <Button variant="outline">Edit</Button>
                </SetRow>
                <SetRow title="Plan" desc="Pro — $30/mo · renews Aug 4.">
                  <Button variant="outline">Manage</Button>
                </SetRow>
              </div>
            )}

            {pane === "models" && (
              <div data-setpane="models">
                <SetRow title="Default model" desc="Used for new chats.">
                  <Seg
                    options={["Atlas Pro", "Atlas Air", "Nova Local"]}
                    value={defaultModel}
                    onValueChange={setDefaultModel}
                    ariaLabel="Default model"
                  />
                </SetRow>
                <SetRow
                  title="Default temperature"
                  desc="Creativity vs. determinism."
                >
                  <span className="font-mono text-[var(--text-2)]">0.7</span>
                </SetRow>
                <SetRow
                  title="Stream responses"
                  desc="Show tokens as they generate."
                >
                  <Switch
                    checked={stream}
                    onCheckedChange={setStream}
                    aria-label="Stream responses"
                  />
                </SetRow>
              </div>
            )}

            {pane === "plugins" && (
              <div data-setpane="plugins">
                <SetRow title="Web Search" desc="Core · verified">
                  <Switch
                    checked={webSearch}
                    onCheckedChange={setWebSearch}
                    aria-label="Web Search"
                  />
                </SetRow>
                <SetRow title="Code Interpreter" desc="Core · verified">
                  <Switch
                    checked={codeInterp}
                    onCheckedChange={setCodeInterp}
                    aria-label="Code Interpreter"
                  />
                </SetRow>
                <SetRow title="Notion" desc="Not connected">
                  <Switch
                    checked={notion}
                    onCheckedChange={setNotion}
                    aria-label="Notion"
                  />
                </SetRow>
                <SetRow>
                  <Button variant="outline">Browse marketplace →</Button>
                </SetRow>
              </div>
            )}

            {pane === "data" && (
              <div data-setpane="data">
                <SetRow
                  title="Chat history"
                  desc="Store conversations in your workspace."
                >
                  <Switch
                    checked={history}
                    onCheckedChange={setHistory}
                    aria-label="Chat history"
                  />
                </SetRow>
                <SetRow
                  title="Improve the model"
                  desc="Allow anonymized usage to improve quality."
                >
                  <Switch
                    checked={improve}
                    onCheckedChange={setImprove}
                    aria-label="Improve the model"
                  />
                </SetRow>
                <SetRow
                  title="Export all data"
                  desc="Download a copy of your chats & files."
                >
                  <Button variant="outline">Export</Button>
                </SetRow>
              </div>
            )}

            {pane === "keys" && (
              <div data-setpane="keys">
                <SetRow title="New chat">
                  <Kbd>⌘ N</Kbd>
                </SetRow>
                <SetRow title="Search">
                  <Kbd>⌘ K</Kbd>
                </SetRow>
                <SetRow title="Toggle sidebar">
                  <Kbd>⌘ \</Kbd>
                </SetRow>
                <SetRow title="Toggle side panel">
                  <Kbd>⌘ .</Kbd>
                </SetRow>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
