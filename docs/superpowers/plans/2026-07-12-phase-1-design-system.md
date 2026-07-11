# Phase 1 — Design System & Adaptive Canvas Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-create every mockup screen (empty, chat, code, marketplace, settings, selector, inspector) as real, themeable, accessible React components living in `packages/ui`, driven by a single token source and assembled into `apps/web`.

**Architecture:** All shell components are ported one-file-per-component from `mockup/index.html` into `packages/ui/src/components/**` (plus re-skinned shadcn primitives, mascots, and "live" primitives), each with a typed prop interface from the shared contract. The design tokens are the single source of truth in a Tailwind v4 `@theme` CSS block in `packages/config/theme.css` (light base + dark via `@media (prefers-color-scheme: dark)` **and** `:root[data-theme="…"]`); theme selection is a Zustand store + `ThemeProvider` in `packages/ui` that stamps `data-theme` on `<html>` and persists to `localStorage`. Components are tested with Vitest + `@testing-library/react` in jsdom (co-located `*.test.tsx`), then composed into `apps/web` where self-hosted `next/font/local` fonts and the providers are wired at the root layout, and a shell page renders every screen in both themes.

**Tech Stack (Phase 1 pins):**

- React `^19.0.0`, react-dom `^19.0.0` (peer + dev in `packages/ui`); Next.js `15.5.x` (`apps/web`)
- Tailwind CSS `4.3.x` (v4, CSS-first `@theme`) + `@tailwindcss/postcss`; `tw-animate-css@^1.4.0`
- Radix via shadcn: `react-dialog@^1.1.19`, `react-dropdown-menu@^2.1.20`, `react-popover@^1.1.19`, `react-tabs@^1.1.17`, `react-switch@^1.3.3`, `react-tooltip@^1.2.12`, `react-slot@^1.3.0`, `react-visually-hidden@^1.2.7`
- `class-variance-authority@^0.7.1`, `clsx@^2.1.1`, `tailwind-merge@^3.6.0` (v3 for Tailwind v4), `lucide-react@^1.24.0`, `cmdk@^1.1.1`, `motion@^12.42.2` (import from `motion/react`)
- `zustand@^5.0.14` (theme store in `packages/ui`; panel/composer UI state in `apps/web`)
- Test: `vitest@^2.1.0`, `@testing-library/react@^16.3.2`, `@testing-library/jest-dom@^6.9.1`, `jsdom@^29.1.1`
- TypeScript `5.9.x` strict; internal deps `workspace:*`; consumed as raw TS via `transpilePackages`

---

## Global Constraints

_Every task's requirements implicitly include this section._

- **Tokens are the single source of truth.** The canonical `@theme` block lives in `packages/config/theme.css` (imported by `apps/web/src/app/globals.css` alongside `@import "tailwindcss"`). Every token from the mockup is ported: surfaces `--bg --surface --surface-2 --sidebar --elevated`; text `--text --text-2 --text-3`; lines/washes `--border --border-2 --hover --active --active-line --bubble`; neutral fills `--primary --primary-text`; the one brand token `--accent` (+ `--accent-text --accent-soft --accent-line`); state `--success --warning --error`; `--shadow --shadow-sm`; `--radius(14px) --radius-sm(10px) --radius-xs(8px)`. Components consume tokens via Tailwind utilities / CSS vars — **never hardcode hex**, except the two mockup-sanctioned literal-hex zones: the settings theme-preview swatches (`.tp`, mockup 494–504) and the code syntax `.tok-*` colors (mockup editor, non-tokenized by design).
- **`--accent` (Volt) exact values:** dark `#9EFB25`, light `#5A9310` (brand memory, authoritative; the mockup's older light `#4e8f12` is superseded). `--accent-text` dark `#16200A` / light `#FFFFFF`.
- **Resolve the mockup's `--sink` gap** (used at mockup 619/621 but never defined): add a real `--sink` code-surface token = dark `#1C1E1F`, light a darker-than-`--bg` value; distinct from `--bg`.
- **Brand rule "Neutral = interactive · Volt = alive" (enforced in every task's review).** `--accent`/`--accent-soft`/`--accent-line` may appear **only** on: streaming caret (`TypeCaret`), live/presence dots (`LiveDot`, `LiveCluster`), mascot eyes/antenna/scanline (`Robo`, `Visor`), the sidebar `logo-dot`, toggle/switch **on-state** fill, the composer **focus ring** (`:focus-within` → `--accent-line` border + `--accent-soft` glow, mockup 314/658), keyboard **focus rings**, and the mock-dev-bar's ambient glow. **Everything else is neutral:** hover (`--hover`), active/selected (`--active`/`--active-line`), primary buttons New chat & Send (`--primary`/`--primary-text`), user bubble, agent pill, active nav/tab.
- **Accessibility (mandatory acceptance).** Keep Radix a11y intact; every interactive element is keyboard-operable with a visible focus ring; `prefers-reduced-motion: reduce` disables ALL animation — components read a `useReducedMotion()` hook or a CSS `@media (prefers-reduced-motion)` guard and render static equivalents.
- **Every shell component is its own file in `packages/ui`** with a typed prop interface taken **verbatim** from the Canonical Interfaces contract below. Named exports only, re-exported from `packages/ui/src/index.ts`. No `any`; TypeScript strict; `tsc --noEmit` clean. Add `"jsx": "react-jsx"` to `packages/ui/tsconfig.json`.
- **`packages/ui/src/types.ts` is the SINGLE SOURCE OF TRUTH for all shared domain types, data types, AND component prop interfaces.** It is created first (Task 0). Every task **imports** its types from `types.ts` and **never redefines** them. Where any task body's inline type differs from `types.ts` / the Canonical Interfaces section, **`types.ts` governs** and the task must be reconciled to it during implementation (see Pre-flight Reconciliations).
- **Both light and dark must render** correctly for every component (verified via test + the `apps/web` shell page).
- **Responsive breakpoints (exact, from mockup 709–729):** `1180px` (pinned Inspector → overlay-only), `900px` (LeftRail → fixed off-canvas drawer + hamburger + scrim), `760px` (code file-tree hidden), `680px` (Inspector full-screen sheet, topbar title hidden, share label hidden). Maps to the spec tiers: ≥1280 all three regions; 1024–1280 inspector overlay-only; 768–1024 rail→drawer/inspector→sheet; <768 single column full-screen sheets.
- **Port markup/styles from `mockup/index.html`** (cite line ranges per task); honor the "later polish layer wins" rule; do NOT port dead-code CSS (`.brand-mark` 109–111, unused `.stream/.dots/.caret/.shimmer/.spinner` 270–293).
- **Tests via the established pattern:** copy `packages/shared`'s harness but `environment: "jsdom"`, `include: ["src/**/*.test.{ts,tsx}"]`, setup file `import "@testing-library/jest-dom/vitest"`; co-locate `*.test.tsx`; `describe/it/expect` from `"vitest"` + `render/screen` from `@testing-library/react`.
- **Internal deps `workspace:*`**; no new native build scripts (existing `allowBuilds` unchanged). **Conventional Commits** per task (`feat(ui): …`, `chore(config): …`, `test(ui): …`).

---

## Canonical Interfaces (the governing contract)

Every component's props and every shared type come from here, defined once in `packages/ui/src/types.ts` (Task 0). Tasks import these — they do not redefine them.

```ts
// packages/ui/src/lib/cn.ts
import type { ClassValue } from "clsx";
export function cn(...inputs: ClassValue[]): string; // clsx() piped through twMerge()
// packages/ui/src/lib/use-reduced-motion.ts
export function useReducedMotion(): boolean;

// theme (store/theme.ts + providers/ThemeProvider.tsx) — ThemeMode/ResolvedTheme live in types.ts
export type ThemeMode = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";
export interface ThemeState {
  mode: ThemeMode;
  resolved: ResolvedTheme;
  setMode: (m: ThemeMode) => void;
  toggle: () => void;
}
export function useThemeStore(): ThemeState; // zustand bound store
export interface ThemeProviderProps {
  children: React.ReactNode;
}
export function ThemeProvider(props: ThemeProviderProps): JSX.Element; // stamps <html data-theme>
export function useTheme(): ThemeState;
export interface ToastContextValue {
  show: (message: string) => void;
} // pill, 2200ms auto-dismiss
export function ToastProvider(props: {
  children: React.ReactNode;
}): JSX.Element;
export function useToast(): ToastContextValue;

// packages/ui/src/types.ts — CANONICAL shared domain/data/prop types
export type ViewMode = "empty" | "chat" | "market" | "code";
export type PanelMode = "closed" | "float" | "pinned";
export type RailMode = "expanded" | "collapsed" | "open";
export type InspectorTab = "file" | "output" | "details" | "config";
export type NavKey = "chat" | "code" | "market";
export type RecentGroup = "pinned" | "today" | "previous7" | "projects";
export type ChatRowAction = "pin" | "rename" | "archive" | "delete";
export type AccountAction = "profile" | "settings" | "upgrade" | "logout";
export type SettingsPane =
  "account" | "appearance" | "models" | "plugins" | "data" | "keys";

export interface NavItem {
  id: NavKey;
  label: string;
  icon: React.ReactNode;
  kbd?: string;
}
export interface RecentChat {
  id: string;
  title: string;
  group: RecentGroup;
  pinned?: boolean;
}
export interface Project {
  id: string;
  name: string;
  count: number;
}
export interface Account {
  name: string;
  email: string;
  plan: string;
  initials: string;
}
export interface ModelOption {
  id: string;
  name: string;
  group: "frontier" | "fast" | "local";
  sub?: string;
  tags: string[];
}
export interface AgentOption {
  id: string;
  name: string;
  persona: string;
  specialty: string;
}
export interface Attachment {
  id: string;
  name: string;
  sub: string;
  kind: "image" | "doc";
  progress?: number;
}
export interface CommandItem {
  id: string;
  label: string;
  kbd?: string;
  group: "actions" | "recent" | "models";
  onSelect: () => void;
}

// Inspector pane payloads
export interface FilePreviewData {
  name: string;
  size: string;
  dims: string;
  src?: string;
}
export interface OutputKV {
  label: string;
  value: string;
}
export interface OutputData {
  title: string;
  percent: number;
  rows: OutputKV[];
}
export interface ModelParam {
  label: string;
  value: number;
  min: number;
  max: number;
}
export interface ModelDetails {
  name: string;
  sub: string;
  params: ModelParam[];
  tools: { label: string; on: boolean }[];
}
export interface PluginConfigData {
  name: string;
  publisher: string;
  connected: boolean;
  permissions: { label: string; on: boolean }[];
}

// primitives — re-skinned shadcn. Canonical Button variants (no "accent" variant exists):
export type ButtonVariant = "primary" | "ghost" | "outline" | "danger" | "icon";
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  asChild?: boolean;
}
// Input, Dialog, DropdownMenu, Popover, Tabs, Switch, Tooltip, Command keep Radix prop shapes.
// Switch on-state fill = --accent (allowed "on-toggle" liveness).

// live/ — the ONLY components (besides focus/mascots) permitted to paint with --accent
export interface LiveDotProps {
  className?: string;
} // renders data-slot="live-dot"
export interface LiveClusterProps {
  label?: string;
  className?: string;
}
export interface StreamShimmerProps {
  text: string;
  className?: string;
} // NEUTRAL gray sweep
export interface TypeCaretProps {
  className?: string;
}
export interface RoboProps {
  size?: number;
  className?: string;
} // default 30
export interface VisorProps {
  className?: string;
}

// components/ — one file each, props verbatim from here
export interface AppShellProps {
  view: ViewMode;
  panel: PanelMode;
  rail: RailMode;
  onPanelChange: (panel: PanelMode) => void;
  onRailChange: (rail: RailMode) => void;
  leftRail: React.ReactNode;
  topBar: React.ReactNode;
  main: React.ReactNode;
  inspector?: React.ReactNode;
  dragging?: boolean;
}
export interface LeftRailProps {
  mode: RailMode;
  nav: NavItem[];
  activeNav: NavKey;
  recents: RecentChat[];
  projects: Project[];
  account: Account;
  brandLogo?: React.ReactNode;
  onNavSelect: (id: NavKey) => void;
  onNewChat: () => void;
  onSearch: () => void;
  onToggleCollapse: () => void;
  onRenameChat: (id: string, title: string) => void;
  onChatAction: (id: string, action: ChatRowAction) => void;
  onAccountAction: (action: AccountAction) => void;
}
export interface ModelSelectorProps {
  models: ModelOption[];
  agents: AgentOption[];
  selectedModelId: string;
  onSelectModel: (id: string) => void;
  variant?: "topbar" | "pill";
}
export interface TopBarProps {
  title: string;
  onTitleChange: (title: string) => void;
  selector: ModelSelectorProps;
  panel: PanelMode;
  onPanelToggle: () => void;
  onPanelPin: () => void;
  onShare: () => void;
  onChatMenu: () => void;
  onRailOpen: () => void;
}
export interface ComposerProps {
  variant: "empty" | "chat";
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  attachments: Attachment[];
  attachOpen: boolean;
  onAttach: () => void;
  onRemoveAttachment: (id: string) => void;
  toolsOn: boolean;
  onToggleTools: () => void;
  onVoice: () => void;
  agentPill: React.ReactNode;
  dragging?: boolean;
  toolCount?: number;
}
export interface InspectorProps {
  mode: PanelMode;
  tab: InspectorTab;
  onTabChange: (tab: InspectorTab) => void;
  onPin: () => void;
  onClose: () => void;
  file?: FilePreviewData;
  output?: OutputData;
  model?: ModelDetails;
  config?: PluginConfigData;
}
export interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actions: CommandItem[];
  recents: CommandItem[];
  models: CommandItem[];
}
export interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pane: SettingsPane;
  onPaneChange: (pane: SettingsPane) => void;
  themeMode: ThemeMode;
  onThemeChange: (mode: ThemeMode) => void;
}
export interface ToastProps {
  message: string | null;
  visible: boolean;
}

// views/ — main-column bodies
export interface EmptyViewProps {
  greeting: string;
  starters: string[];
  composer: ComposerProps;
}
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  model?: string;
  time: string;
  text: string;
  attachments?: Attachment[];
  tool?: ToolCardData;
}
export interface ToolCardData {
  id: string;
  name: string;
  desc: string;
  done?: string;
  rows: OutputKV[];
}
export interface StreamingMessage {
  model: string;
  runningTool?: ToolCardData;
  partialText: string;
}
export interface ChatViewProps {
  messages: ChatMessage[];
  streaming?: StreamingMessage;
  composer: ComposerProps;
  onOpenOutput: (id: string) => void;
}
export interface CodeViewProps {
  repo: string;
  branch: string;
  sync: string;
  onAction: (a: "run" | "pr" | "commit") => void;
}
export interface PluginCardData {
  id: string;
  name: string;
  publisher: string;
  verified?: boolean;
  desc: string;
  tags: string[];
  enabled: boolean;
}
export interface MarketViewProps {
  plugins: PluginCardData[];
  onToggle: (id: string, on: boolean) => void;
  onConfigure: (id: string) => void;
}
```

---

## Pre-flight Reconciliations (apply during execution)

An adversarial critique of the task drafts surfaced 34 findings. The `types.ts`-as-single-source rule (Task 0 + the Global Constraint above) resolves the large cluster of interface/type mismatches: **every component imports its props and data types from `types.ts` and never redefines them.** The remaining task-specific reconciliations below MUST be applied when the affected task is implemented; each task's reviewer is given the relevant item.

- **Task 2 (tokens/keyframes):** keyframe names are `blinkeye` and `txtshim` (nicknames blink/shimmer). Also **port the mockup's global `:focus-visible` ring** (mockup line 85, an `--accent-line` outline) into `theme.css`/`globals.css` so every native `<button>` shows a keyboard focus ring.
- **Task 3 (theme store):** the unpersisted **default mode is `system`** (so the acceptance test under a forced light system preference resolves `light`). Update the store default + its tests accordingly.
- **Task 5 (primitives):** use `tailwind-merge@^3` (matches Task 1); do **not** downgrade to ^2.6.
- **Task 6 (mascots/live):** use the real keyframe names `animate-[blinkeye_…]` / `animate-[txtshim_…]` (not `blink`/`shimmer`); fix the Step-2 keyframe-presence checklist and the tests. Emit stable Volt-audit markers: `data-slot="live-dot"` on `LiveDot`, `data-live` on `LiveCluster`/`TypeCaret`, `data-mascot` on `Robo`/`Visor` — Task 7's LeftRail test and Task 16's Volt-audit rely on these.
- **Task 4 (fonts):** Task 4 OWNS `apps/web/src/app/fonts.ts` + the layout font wiring via `next/font/local`, exporting `fontDisplay`/`fontSans`/`fontMono`. **Task 16 must NOT recreate `fonts.ts` or switch to `next/font/google`** — it only adds the `ToastProvider` wrap. Reconcile to one weight set.
- **Task 7 (LeftRail):** the Step-3 implementation must show the FINAL correct code (remove the knowingly-wrong `onChatAction(chat.id,'pin') && undefined` line and delete the follow-up Step 3b). The logo dot uses `<LiveDot/>` (which now emits `data-slot="live-dot"`).
- **Task 15 (AppShell):** the responsive geometry (900px rail→drawer, 680px inspector full-screen sheet) must target the **actual classes/attributes the ported components emit** — either give `LeftRail`/`Inspector` roots the semantic hook classes (`rail`, `inspector`, `title-wrap`, `code-tree`, …) the AppShell CSS references, or move the drawer/sheet geometry into the components. Verify the 1180/900/680 collapses in a real render, not only via jsdom data-attribute assertions.
- **Task 16 (wiring/acceptance):** wire `TopBar`/`Composer` via the canonical props (`selector: ModelSelectorProps`, `agentPill: <ModelSelector variant="pill"/>`); build fixtures to the canonical `ModelOption`/`AgentOption`/`Attachment` shapes; do not recreate fonts.ts. The Volt-audit ALLOWED set keys off the markers from Task 6/Composer.
- **Minor:** the mockup `.loader/.spinner` (`spin` keyframe) is intentionally replaced by `LiveDot`; either wire the dev-bar to `mockglow` or drop the unused keyframe — no component may reference an undefined `spin`/`.loader` keyframe.

---

### Task 1: packages/ui test harness, deps, and cn() util

This is an **infrastructure-only** task. It does **not** port any markup from `mockup/index.html` (that begins in later tasks). It establishes the `@wedevs/ui` package so a fresh subagent can build components against a working **jsdom + Vitest + React Testing Library** harness, with all Phase 1 runtime dependencies pinned in `package.json`, plus the two foundational utilities every component consumes: `cn()` (Tailwind‑v4‑aware class merge) and `useReducedMotion()` (the `prefers-reduced-motion` hook mandated by the global accessibility constraint).

**Brand rule note:** this task produces no visual output and paints nothing, so the "Neutral = interactive · Volt = alive" (`--accent`) rule has no surface here. `useReducedMotion()` is the mechanism later "alive" components (`TypeCaret`, `LiveDot`, `Robo`, `Visor`, theme cross‑fade, `StreamShimmer`) use to render static equivalents under `prefers-reduced-motion: reduce`.

---

#### Files

**Modify**

- `packages/ui/package.json` — add runtime `dependencies`, `peerDependencies` (react, react-dom), `devDependencies` (react, react-dom, testing-library set, jsdom, `@vitejs/plugin-react`, vitest, types), and a `"test": "vitest run"` script.
- `packages/ui/tsconfig.json` — add `"compilerOptions": { "jsx": "react-jsx" }`.
- `packages/ui/src/index.ts` — replace the placeholder const with the real barrel (re‑exports `cn`, `useReducedMotion`).

**Create**

- `packages/ui/vitest.config.ts` — `environment: "jsdom"`, `@vitejs/plugin-react`, `include: ["src/**/*.test.{ts,tsx}"]`, setup file.
- `packages/ui/vitest.setup.ts` — `import "@testing-library/jest-dom/vitest"` + RTL `cleanup` on `afterEach`.
- `packages/ui/src/lib/cn.ts` — `cn(...inputs)`.
- `packages/ui/src/lib/cn.test.ts` — conditional inclusion + Tailwind conflict dedupe.
- `packages/ui/src/lib/use-reduced-motion.ts` — `useReducedMotion()`.
- `packages/ui/src/smoke.test.tsx` — one RTL/jsdom render smoke proving `render`/`screen`/`getByRole`/`toBeInTheDocument`.

**Verify only (no edit expected)**

- `packages/ui/eslint.config.js` — already `export default preset;` from `@wedevs/config/eslint`; the typescript-eslint preset disables `no-undef` for TS/TSX and `@typescript-eslint/parser` auto‑enables JSX for `.tsx`, so no React override is required. A step below confirms `eslint .` is clean; only touch this file if that step fails.

---

#### Interfaces

**Consumes** (from Phase 0 baseline — already present in the repo, confirmed):

- `@wedevs/config` `tsconfig.base.json` (strict, `noUncheckedIndexedAccess`, `moduleResolution: "Bundler"`, `noEmit`), extended by `packages/ui/tsconfig.json`.
- `@wedevs/config/eslint` preset (flat config: `js.recommended` + `tseslint.recommended` + `prettier`, ignores `dist/.next/.turbo/coverage`).
- `packages/shared` Vitest harness as the **template** — copy it but flip `environment` to `"jsdom"` and widen `include` to `src/**/*.test.{ts,tsx}` and add a setup file. Reference (`packages/shared/vitest.config.ts`):
  ```ts
  import { defineConfig } from "vitest/config";
  export default defineConfig({
    test: { environment: "node", include: ["src/**/*.test.ts"] },
  });
  ```
  And the shared test style (`packages/shared/src/format-bytes.test.ts`) — explicit `import { describe, it, expect } from "vitest";` (this repo runs with `globals: false`).

**Produces** (exact signatures — canonical, do not rename):

```ts
// packages/ui/src/lib/cn.ts
import type { ClassValue } from "clsx";
export function cn(...inputs: ClassValue[]): string; // clsx() piped through twMerge()

// packages/ui/src/lib/use-reduced-motion.ts
export function useReducedMotion(): boolean; // subscribes to (prefers-reduced-motion: reduce)
```

Plus a working `vitest run` harness for `@wedevs/ui`: React 19 components render in jsdom via `@testing-library/react`, with `@testing-library/jest-dom` matchers (`toBeInTheDocument`, etc.).

---

#### Pinned dependency versions (the Phase 1 dependency map for `@wedevs/ui`)

Add **all** of these now (later tasks consume them; the deliverable requires them pinned in this task). Versions are React‑19‑ and Tailwind‑v4‑compatible and match the workspace (React `19.2.7`, Vitest `2.1.9`, Tailwind `^4`).

`dependencies` (shipped runtime):

| package                         | version    |
| ------------------------------- | ---------- |
| `@radix-ui/react-dialog`        | `^1.1.4`   |
| `@radix-ui/react-dropdown-menu` | `^2.1.4`   |
| `@radix-ui/react-popover`       | `^1.1.4`   |
| `@radix-ui/react-tabs`          | `^1.1.2`   |
| `@radix-ui/react-switch`        | `^1.1.2`   |
| `@radix-ui/react-tooltip`       | `^1.1.6`   |
| `@radix-ui/react-slot`          | `^1.1.1`   |
| `class-variance-authority`      | `^0.7.1`   |
| `clsx`                          | `^2.1.1`   |
| `tailwind-merge`                | `^3.0.0`   |
| `lucide-react`                  | `^0.469.0` |
| `cmdk`                          | `^1.0.4`   |
| `motion`                        | `^11.15.0` |
| `zustand`                       | `^5.0.2`   |
| `tw-animate-css`                | `^1.0.0`   |

`peerDependencies`:

| package     | version   |
| ----------- | --------- |
| `react`     | `^19.0.0` |
| `react-dom` | `^19.0.0` |

`devDependencies` (add to the existing three — keep `@wedevs/config`, `eslint`, `typescript`):

| package                       | version   |
| ----------------------------- | --------- |
| `react`                       | `^19.0.0` |
| `react-dom`                   | `^19.0.0` |
| `@types/react`                | `^19.0.0` |
| `@types/react-dom`            | `^19.0.0` |
| `@testing-library/react`      | `^16.1.0` |
| `@testing-library/jest-dom`   | `^6.6.3`  |
| `@testing-library/user-event` | `^14.5.2` |
| `jsdom`                       | `^25.0.1` |
| `@vitejs/plugin-react`        | `^4.3.4`  |
| `vitest`                      | `^2.1.0`  |

> `.npmrc` has `auto-install-peers=true` and `strict-peer-dependencies=false`, so adding Radix packages as `dependencies` will not error on peer mismatches. No package here has a native postinstall build, so `pnpm-workspace.yaml`'s `allowBuilds` list is unchanged (global constraint honored).

---

#### Steps

- [ ] **Step 1: Rewrite `packages/ui/package.json` with all deps + test script.** Replace the file entirely with:

  ```json
  {
    "name": "@wedevs/ui",
    "version": "0.0.0",
    "private": true,
    "type": "module",
    "main": "./src/index.ts",
    "types": "./src/index.ts",
    "scripts": {
      "lint": "eslint .",
      "typecheck": "tsc --noEmit",
      "test": "vitest run"
    },
    "dependencies": {
      "@radix-ui/react-dialog": "^1.1.4",
      "@radix-ui/react-dropdown-menu": "^2.1.4",
      "@radix-ui/react-popover": "^1.1.4",
      "@radix-ui/react-tabs": "^1.1.2",
      "@radix-ui/react-switch": "^1.1.2",
      "@radix-ui/react-tooltip": "^1.1.6",
      "@radix-ui/react-slot": "^1.1.1",
      "class-variance-authority": "^0.7.1",
      "clsx": "^2.1.1",
      "tailwind-merge": "^3.0.0",
      "lucide-react": "^0.469.0",
      "cmdk": "^1.0.4",
      "motion": "^11.15.0",
      "zustand": "^5.0.2",
      "tw-animate-css": "^1.0.0"
    },
    "peerDependencies": {
      "react": "^19.0.0",
      "react-dom": "^19.0.0"
    },
    "devDependencies": {
      "@wedevs/config": "workspace:*",
      "@types/react": "^19.0.0",
      "@types/react-dom": "^19.0.0",
      "@testing-library/react": "^16.1.0",
      "@testing-library/jest-dom": "^6.6.3",
      "@testing-library/user-event": "^14.5.2",
      "@vitejs/plugin-react": "^4.3.4",
      "jsdom": "^25.0.1",
      "react": "^19.0.0",
      "react-dom": "^19.0.0",
      "eslint": "^9.12.0",
      "typescript": "^5.6.0",
      "vitest": "^2.1.0"
    }
  }
  ```

- [ ] **Step 2: Install from the workspace root.** Run:

  ```bash
  pnpm install
  ```

  Expected: install completes with `Done in …`; no `ERR_PNPM` errors. Peer‑dependency warnings are acceptable (strict peers are off). If pnpm reports it "ignored build scripts", that is fine — none of these packages need a build.

- [ ] **Step 3: Add `jsx` to `packages/ui/tsconfig.json`.** Replace the file with:

  ```json
  {
    "extends": "@wedevs/config/tsconfig.base.json",
    "compilerOptions": { "jsx": "react-jsx" },
    "include": ["src"]
  }
  ```

  (Only `src` is type‑checked, matching `@wedevs/shared`; `vitest.config.ts`/`vitest.setup.ts` live at the package root and are exercised by Vitest/ESLint, not `tsc`.)

- [ ] **Step 4: Create `packages/ui/vitest.setup.ts`.** Registers jest‑dom matchers on Vitest's `expect` and auto‑unmounts React trees between tests (required because we run `globals: false`, so RTL's built‑in `afterEach` auto‑cleanup does not fire):

  ```ts
  import "@testing-library/jest-dom/vitest";
  import { afterEach } from "vitest";
  import { cleanup } from "@testing-library/react";

  afterEach(() => {
    cleanup();
  });
  ```

- [ ] **Step 5: Create `packages/ui/vitest.config.ts`.** jsdom environment, React plugin (so `.tsx`/JSX transforms and Fast‑Refresh‑style transform work under Vitest), broadened include, and the setup file:

  ```ts
  import { defineConfig } from "vitest/config";
  import react from "@vitejs/plugin-react";

  export default defineConfig({
    plugins: [react()],
    test: {
      environment: "jsdom",
      globals: false,
      setupFiles: ["./vitest.setup.ts"],
      include: ["src/**/*.test.{ts,tsx}"],
    },
  });
  ```

- [ ] **Step 6: Write the failing `cn` test first (TDD).** Create `packages/ui/src/lib/cn.test.ts`:

  ```ts
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
  ```

- [ ] **Step 7: Run the `cn` test and watch it FAIL (module missing).** Run:

  ```bash
  pnpm --filter @wedevs/ui test
  ```

  Expected: failure — Vitest cannot resolve `./cn` (e.g. `Failed to resolve import "./cn"` / `Cannot find module`). This confirms the test is wired to the harness before the implementation exists.

- [ ] **Step 8: Implement `packages/ui/src/lib/cn.ts`.** Exact code:

  ```ts
  import { clsx, type ClassValue } from "clsx";
  import { twMerge } from "tailwind-merge";

  export function cn(...inputs: ClassValue[]): string {
    return twMerge(clsx(inputs));
  }
  ```

- [ ] **Step 9: Re-run and watch the `cn` test PASS.** Run:

  ```bash
  pnpm --filter @wedevs/ui test
  ```

  Expected: `cn.test.ts` reports **7 passed**. (The smoke test does not exist yet, so this run shows 1 test file, 7 tests.)

- [ ] **Step 10: Implement `packages/ui/src/lib/use-reduced-motion.ts`.** SSR‑safe subscription to the media query via `useSyncExternalStore` (no state‑update‑on‑unmount hazards, correct with React 19 concurrency). Exact code:

  ```ts
  import { useSyncExternalStore } from "react";

  const QUERY = "(prefers-reduced-motion: reduce)";

  function subscribe(onChange: () => void): () => void {
    if (
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    ) {
      return () => {};
    }
    const mql = window.matchMedia(QUERY);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }

  function getSnapshot(): boolean {
    if (
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    ) {
      return false;
    }
    return window.matchMedia(QUERY).matches;
  }

  function getServerSnapshot(): boolean {
    return false;
  }

  export function useReducedMotion(): boolean {
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  }
  ```

- [ ] **Step 11: Write the jsdom + RTL smoke test.** Create `packages/ui/src/smoke.test.tsx`. It defines a throwaway component inline (no source file needed) and proves `render`, `screen`, role queries, and the jest‑dom `toBeInTheDocument` matcher all work under jsdom:

  ```tsx
  import { describe, it, expect } from "vitest";
  import { render, screen } from "@testing-library/react";

  function Hello({ name }: { name: string }) {
    return <button type="button">Hello {name}</button>;
  }

  describe("jsdom + RTL harness", () => {
    it("renders a React component and queries it by role", () => {
      render(<Hello name="Wedevs" />);
      const button = screen.getByRole("button", { name: "Hello Wedevs" });
      expect(button).toBeInTheDocument();
    });

    it("unmounts between tests (cleanup wired)", () => {
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });
  });
  ```

  (The second assertion passes only if `cleanup()` from `vitest.setup.ts` ran after the first test — it proves the setup file is loaded and auto‑cleanup works.)

- [ ] **Step 12: Run the full suite and watch everything PASS.** Run:

  ```bash
  pnpm --filter @wedevs/ui test
  ```

  Expected output includes:

  ```
   ✓ src/lib/cn.test.ts (7)
   ✓ src/smoke.test.tsx (2)

   Test Files  2 passed (2)
        Tests  9 passed (9)
  ```

- [ ] **Step 13: Replace the barrel `packages/ui/src/index.ts`.** Swap the placeholder const for the real re‑exports:

  ```ts
  export { cn } from "./lib/cn";
  export { useReducedMotion } from "./lib/use-reduced-motion";
  export type { ClassValue } from "clsx";
  ```

  (Later tasks append component/type/provider exports to this barrel; the `ClassValue` re‑export lets consumers type `cn` arguments without importing `clsx` directly.)

- [ ] **Step 14: Typecheck clean.** Run:

  ```bash
  pnpm --filter @wedevs/ui typecheck
  ```

  Expected: `tsc --noEmit` prints **nothing** and exits 0. (Strict mode, `noUncheckedIndexedAccess`, React‑19 `@types/react` all satisfied by the code above.)

- [ ] **Step 15: Confirm `eslint.config.js` needs no change and lint is clean.** The existing `packages/ui/eslint.config.js` is `import preset from "@wedevs/config/eslint"; export default preset;`. Run:

  ```bash
  pnpm --filter @wedevs/ui lint
  ```

  Expected: `eslint .` prints **nothing** and exits 0. If (and only if) it reports a `no-undef` on `window` or a JSX parse error, add a browser‑globals override by replacing the file with:

  ```js
  import preset from "@wedevs/config/eslint";

  export default [
    ...preset,
    {
      languageOptions: {
        globals: { window: "readonly", document: "readonly" },
      },
    },
  ];
  ```

  (Normally unnecessary: typescript-eslint's recommended config disables `no-undef` for typed files and `@typescript-eslint/parser` enables JSX automatically for `.tsx`.)

- [ ] **Step 16: Full package gate (all three checks together).** Run:

  ```bash
  pnpm --filter @wedevs/ui test && pnpm --filter @wedevs/ui typecheck && pnpm --filter @wedevs/ui lint
  ```

  Expected: 9 tests pass, typecheck silent exit 0, lint silent exit 0.

- [ ] **Step 17: Commit — deps + harness.** Conventional Commit for the infrastructure:

  ```bash
  git add packages/ui/package.json packages/ui/tsconfig.json packages/ui/vitest.config.ts packages/ui/vitest.setup.ts pnpm-lock.yaml
  git commit -m "chore(ui): add Phase 1 deps and jsdom Vitest + RTL harness"
  ```

  Expected: commit succeeds; Husky `commit-msg` (commitlint) passes because the header follows Conventional Commits.

- [ ] **Step 18: Commit — cn + useReducedMotion + barrel + tests.** Second Conventional Commit for the utilities:
  ```bash
  git add packages/ui/src/lib/cn.ts packages/ui/src/lib/cn.test.ts packages/ui/src/lib/use-reduced-motion.ts packages/ui/src/smoke.test.tsx packages/ui/src/index.ts
  git commit -m "feat(ui): add cn() class merge and useReducedMotion hook"
  ```
  Expected: commit succeeds; lint‑staged runs eslint/prettier on the staged files with no failures.

---

#### Definition of done

- `pnpm --filter @wedevs/ui test` runs under **jsdom** and reports **2 files / 9 tests passed**: `cn.test.ts` proves conditional inclusion and Tailwind‑v4 conflict dedupe (`cn("p-2","p-4") === "p-4"`), and `smoke.test.tsx` proves `render` + `screen` + `getByRole` + `toBeInTheDocument` work, with `cleanup` verified between tests.
- `packages/ui/src/lib/cn.ts` exports `cn(...inputs: ClassValue[]): string` = `twMerge(clsx(inputs))`; `use-reduced-motion.ts` exports `useReducedMotion(): boolean` subscribing to `(prefers-reduced-motion: reduce)`; both re‑exported from `src/index.ts`.
- `packages/ui/package.json` pins the full Phase 1 dependency map (Radix set, `class-variance-authority`, `clsx`, `tailwind-merge@^3`, `lucide-react`, `cmdk`, `motion`, `zustand`, `tw-animate-css`), declares `react`/`react-dom` as peer **and** dev deps, and has a `"test": "vitest run"` script.
- `packages/ui/tsconfig.json` sets `"jsx": "react-jsx"`; `pnpm --filter @wedevs/ui typecheck` (`tsc --noEmit`) and `pnpm --filter @wedevs/ui lint` (`eslint .`) both exit 0 with no output.
- No `allowBuilds` change; internal dep uses `workspace:*`; two Conventional Commits landed (`chore(ui): …`, `feat(ui): …`). No `--accent`/Volt surface exists in this infra task, so the brand rule is trivially satisfied.

---

### Task 1B: Shared domain types — `packages/ui/src/types.ts`

Create the single canonical home for **all** Phase 1 shared types: domain enums, data shapes, and every component prop interface. Every later task imports its types from here and never redefines them — this is what keeps `ModelOption`, `AgentOption`, `Attachment`, `ComposerProps`, `TopBarProps`, `ModelSelectorProps`, `InspectorProps`, etc. consistent across the ~30 files that touch them. This runs **immediately after Task 1** (it needs `react`/`@types/react` and the Vitest harness that Task 1 installs) and **before Task 2**, so Task 3's theme store and every component can import from `../types` / `../../types`.

This task has no visual/mockup surface — it is pure type declarations lifted verbatim from the plan's **Canonical Interfaces** section. Function/const _values_ (`cn`, `ThemeProvider`, `useThemeStore`, `ToastProvider`, the primitives, live components, mascots) are implemented by their own tasks; only their **types** that cross file boundaries live here.

---

**Files:**

- Create: `packages/ui/src/types.ts`
- Modify: `packages/ui/src/index.ts` (add `export * from "./types";`)
- Test: `packages/ui/src/types.test.ts`

**Interfaces:**

- Consumes: `react` (for `React.ReactNode`, `React.ButtonHTMLAttributes`) — installed in Task 1.
- Produces: every type in the Canonical Interfaces `types.ts` block (domain enums, data shapes, `ThemeMode`/`ResolvedTheme`/`ThemeState`, and all `*Props` component interfaces). Later tasks import these.

---

- [ ] **Step 1: Write the failing test.** Create `packages/ui/src/types.test.ts`. Because types are compile-time only, the test both (a) proves the module imports and (b) constructs a representative object of each major type so `tsc` checks the shapes.

```ts
import { describe, it, expect } from "vitest";
import type {
  ViewMode,
  PanelMode,
  RailMode,
  InspectorTab,
  NavKey,
  ThemeMode,
  NavItem,
  RecentChat,
  Project,
  Account,
  ModelOption,
  AgentOption,
  Attachment,
  CommandItem,
  ModelSelectorProps,
  TopBarProps,
  ComposerProps,
  InspectorProps,
  AppShellProps,
  LeftRailProps,
  CommandPaletteProps,
  SettingsModalProps,
  ChatMessage,
  PluginCardData,
} from "./types";

describe("shared types", () => {
  it("expose the canonical domain + prop shapes", () => {
    const view: ViewMode = "chat";
    const panel: PanelMode = "pinned";
    const rail: RailMode = "expanded";
    const tab: InspectorTab = "file";
    const nav: NavKey = "chat";
    const mode: ThemeMode = "system";

    const model: ModelOption = {
      id: "m1",
      name: "Opus 4",
      group: "frontier",
      sub: "200K",
      tags: ["reasoning", "vision"],
    };
    const agent: AgentOption = {
      id: "a1",
      name: "Atlas",
      persona: "Planner",
      specialty: "Research",
    };
    const att: Attachment = {
      id: "f1",
      name: "q3.xlsx",
      sub: "Spreadsheet · 240 KB",
      kind: "doc",
    };
    const item: NavItem = { id: "chat", label: "Chats", icon: null };
    const recent: RecentChat = { id: "c1", title: "Hi", group: "today" };
    const project: Project = { id: "p1", name: "Wedevs", count: 3 };
    const account: Account = {
      name: "Rajin",
      email: "r@x.co",
      plan: "free",
      initials: "R",
    };
    const cmd: CommandItem = {
      id: "x",
      label: "New chat",
      group: "actions",
      onSelect: () => {},
    };
    const msg: ChatMessage = {
      id: "1",
      role: "user",
      time: "now",
      text: "hey",
    };
    const plugin: PluginCardData = {
      id: "p",
      name: "GH",
      publisher: "wedevs",
      desc: "d",
      tags: [],
      enabled: true,
    };

    const selector: ModelSelectorProps = {
      models: [model],
      agents: [agent],
      selectedModelId: "m1",
      onSelectModel: () => {},
    };
    const topbar: TopBarProps = {
      title: "T",
      onTitleChange: () => {},
      selector,
      panel,
      onPanelToggle: () => {},
      onPanelPin: () => {},
      onShare: () => {},
      onChatMenu: () => {},
      onRailOpen: () => {},
    };
    const composer: ComposerProps = {
      variant: "chat",
      value: "",
      onChange: () => {},
      onSubmit: () => {},
      attachments: [att],
      attachOpen: false,
      onAttach: () => {},
      onRemoveAttachment: () => {},
      toolsOn: false,
      onToggleTools: () => {},
      onVoice: () => {},
      agentPill: null,
    };
    const inspector: InspectorProps = {
      mode: panel,
      tab,
      onTabChange: () => {},
      onPin: () => {},
      onClose: () => {},
    };
    const shell: AppShellProps = {
      view,
      panel,
      rail,
      onPanelChange: () => {},
      onRailChange: () => {},
      leftRail: null,
      topBar: null,
      main: null,
    };
    const leftRail: LeftRailProps = {
      mode: rail,
      nav: [item],
      activeNav: nav,
      recents: [recent],
      projects: [project],
      account,
      onNavSelect: () => {},
      onNewChat: () => {},
      onSearch: () => {},
      onToggleCollapse: () => {},
      onRenameChat: () => {},
      onChatAction: () => {},
      onAccountAction: () => {},
    };
    const palette: CommandPaletteProps = {
      open: false,
      onOpenChange: () => {},
      actions: [cmd],
      recents: [],
      models: [],
    };
    const settings: SettingsModalProps = {
      open: false,
      onOpenChange: () => {},
      pane: "appearance",
      onPaneChange: () => {},
      themeMode: mode,
      onThemeChange: () => {},
    };

    expect([view, panel, rail, tab, nav, mode]).toHaveLength(6);
    expect([
      model,
      agent,
      att,
      item,
      recent,
      project,
      account,
      cmd,
      msg,
      plugin,
    ]).toHaveLength(10);
    expect([
      selector,
      topbar,
      composer,
      inspector,
      shell,
      leftRail,
      palette,
      settings,
    ]).toHaveLength(8);
  });
});
```

- [ ] **Step 2: Run the test to confirm it fails.**

Run: `pnpm --filter @wedevs/ui test`
Expected: FAIL — `Cannot find module './types'` (types.ts does not exist yet).

- [ ] **Step 3: Create `packages/ui/src/types.ts`** with the complete canonical type set (verbatim from the plan's Canonical Interfaces).

```ts
import type * as React from "react";

// ── theme (store + provider live in their own files; these TYPES are shared) ──
export type ThemeMode = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";
export interface ThemeState {
  mode: ThemeMode;
  resolved: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
}

// ── domain enums ──
export type ViewMode = "empty" | "chat" | "market" | "code";
export type PanelMode = "closed" | "float" | "pinned";
export type RailMode = "expanded" | "collapsed" | "open";
export type InspectorTab = "file" | "output" | "details" | "config";
export type NavKey = "chat" | "code" | "market";
export type RecentGroup = "pinned" | "today" | "previous7" | "projects";
export type ChatRowAction = "pin" | "rename" | "archive" | "delete";
export type AccountAction = "profile" | "settings" | "upgrade" | "logout";
export type SettingsPane =
  "account" | "appearance" | "models" | "plugins" | "data" | "keys";

// ── data shapes ──
export interface NavItem {
  id: NavKey;
  label: string;
  icon: React.ReactNode;
  kbd?: string;
}
export interface RecentChat {
  id: string;
  title: string;
  group: RecentGroup;
  pinned?: boolean;
}
export interface Project {
  id: string;
  name: string;
  count: number;
}
export interface Account {
  name: string;
  email: string;
  plan: string;
  initials: string;
}
export interface ModelOption {
  id: string;
  name: string;
  group: "frontier" | "fast" | "local";
  sub?: string;
  tags: string[];
}
export interface AgentOption {
  id: string;
  name: string;
  persona: string;
  specialty: string;
}
export interface Attachment {
  id: string;
  name: string;
  sub: string;
  kind: "image" | "doc";
  progress?: number;
}
export interface CommandItem {
  id: string;
  label: string;
  kbd?: string;
  group: "actions" | "recent" | "models";
  onSelect: () => void;
}

// ── Inspector pane payloads ──
export interface FilePreviewData {
  name: string;
  size: string;
  dims: string;
  src?: string;
}
export interface OutputKV {
  label: string;
  value: string;
}
export interface OutputData {
  title: string;
  percent: number;
  rows: OutputKV[];
}
export interface ModelParam {
  label: string;
  value: number;
  min: number;
  max: number;
}
export interface ModelDetails {
  name: string;
  sub: string;
  params: ModelParam[];
  tools: { label: string; on: boolean }[];
}
export interface PluginConfigData {
  name: string;
  publisher: string;
  connected: boolean;
  permissions: { label: string; on: boolean }[];
}

// ── primitive prop types (re-skinned shadcn) ──
export type ButtonVariant = "primary" | "ghost" | "outline" | "danger" | "icon";
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  asChild?: boolean;
}

// ── live primitives + mascots ──
export interface LiveDotProps {
  className?: string;
}
export interface LiveClusterProps {
  label?: string;
  className?: string;
}
export interface StreamShimmerProps {
  text: string;
  className?: string;
}
export interface TypeCaretProps {
  className?: string;
}
export interface RoboProps {
  size?: number;
  className?: string;
}
export interface VisorProps {
  className?: string;
}

// ── component props (one component per file; props come from here) ──
export interface AppShellProps {
  view: ViewMode;
  panel: PanelMode;
  rail: RailMode;
  onPanelChange: (panel: PanelMode) => void;
  onRailChange: (rail: RailMode) => void;
  leftRail: React.ReactNode;
  topBar: React.ReactNode;
  main: React.ReactNode;
  inspector?: React.ReactNode;
  dragging?: boolean;
}
export interface LeftRailProps {
  mode: RailMode;
  nav: NavItem[];
  activeNav: NavKey;
  recents: RecentChat[];
  projects: Project[];
  account: Account;
  brandLogo?: React.ReactNode;
  onNavSelect: (id: NavKey) => void;
  onNewChat: () => void;
  onSearch: () => void;
  onToggleCollapse: () => void;
  onRenameChat: (id: string, title: string) => void;
  onChatAction: (id: string, action: ChatRowAction) => void;
  onAccountAction: (action: AccountAction) => void;
}
export interface ModelSelectorProps {
  models: ModelOption[];
  agents: AgentOption[];
  selectedModelId: string;
  onSelectModel: (id: string) => void;
  variant?: "topbar" | "pill";
}
export interface TopBarProps {
  title: string;
  onTitleChange: (title: string) => void;
  selector: ModelSelectorProps;
  panel: PanelMode;
  onPanelToggle: () => void;
  onPanelPin: () => void;
  onShare: () => void;
  onChatMenu: () => void;
  onRailOpen: () => void;
}
export interface ComposerProps {
  variant: "empty" | "chat";
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  attachments: Attachment[];
  attachOpen: boolean;
  onAttach: () => void;
  onRemoveAttachment: (id: string) => void;
  toolsOn: boolean;
  onToggleTools: () => void;
  onVoice: () => void;
  agentPill: React.ReactNode;
  dragging?: boolean;
  toolCount?: number;
}
export interface InspectorProps {
  mode: PanelMode;
  tab: InspectorTab;
  onTabChange: (tab: InspectorTab) => void;
  onPin: () => void;
  onClose: () => void;
  file?: FilePreviewData;
  output?: OutputData;
  model?: ModelDetails;
  config?: PluginConfigData;
}
export interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actions: CommandItem[];
  recents: CommandItem[];
  models: CommandItem[];
}
export interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pane: SettingsPane;
  onPaneChange: (pane: SettingsPane) => void;
  themeMode: ThemeMode;
  onThemeChange: (mode: ThemeMode) => void;
}
export interface ToastProps {
  message: string | null;
  visible: boolean;
}

// ── views (main-column bodies) ──
export interface ToolCardData {
  id: string;
  name: string;
  desc: string;
  done?: string;
  rows: OutputKV[];
}
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  model?: string;
  time: string;
  text: string;
  attachments?: Attachment[];
  tool?: ToolCardData;
}
export interface StreamingMessage {
  model: string;
  runningTool?: ToolCardData;
  partialText: string;
}
export interface EmptyViewProps {
  greeting: string;
  starters: string[];
  composer: ComposerProps;
}
export interface ChatViewProps {
  messages: ChatMessage[];
  streaming?: StreamingMessage;
  composer: ComposerProps;
  onOpenOutput: (id: string) => void;
}
export interface CodeViewProps {
  repo: string;
  branch: string;
  sync: string;
  onAction: (a: "run" | "pr" | "commit") => void;
}
export interface PluginCardData {
  id: string;
  name: string;
  publisher: string;
  verified?: boolean;
  desc: string;
  tags: string[];
  enabled: boolean;
}
export interface MarketViewProps {
  plugins: PluginCardData[];
  onToggle: (id: string, on: boolean) => void;
  onConfigure: (id: string) => void;
}
```

- [ ] **Step 4: Wire the barrel.** In `packages/ui/src/index.ts`, add near the top:

```ts
export * from "./types";
```

- [ ] **Step 5: Run the test + typecheck to confirm green.**

Run: `pnpm --filter @wedevs/ui test`
Expected: PASS (1 test).
Run: `pnpm --filter @wedevs/ui typecheck` (or `pnpm exec tsc --noEmit -p packages/ui/tsconfig.json`)
Expected: no type errors.

- [ ] **Step 6: Commit.**

```bash
git add packages/ui/src/types.ts packages/ui/src/types.test.ts packages/ui/src/index.ts
git commit -m "feat(ui): add canonical shared types (types.ts) as Phase 1 type source"
```

**Definition of Done:** `packages/ui/src/types.ts` exports the full canonical type set; the barrel re-exports it; the type-shape test passes and `tsc --noEmit` is clean. Every subsequent task imports its domain/data/prop types from `@wedevs/ui` (or `../types`) and never redefines them.

---

### Task 2: Port all tokens into a Tailwind v4 @theme (light base + dark) and wire keyframes

Establishes the single source of truth for the Wedevs design system: the canonical token set (Graphite × Volt) as CSS custom properties that flip per theme through **both** `@media (prefers-color-scheme)` **and** `:root[data-theme]`, mapped to Tailwind v4 utilities via `@theme inline`, plus the custom animation keyframes and the `.28s` theme cross-fade. A fresh agent executes this with zero prior context — every value is spelled out below.

**Visual source of truth:** `d:/Rajin/Wedevs.cloud/mockup/index.html`

- Tokens: `:root` light base **19–30**, `@media(prefers-color-scheme:dark)` **31–42**, `:root[data-theme="light"]` **43–53**, `:root[data-theme="dark"]` **54–64**.
- Keyframes: `blinkeye` **78**, `antp` **80**, `bob` **565**, `scan` **567**, `hsh` **571**, `mockglow` **556–557**, `txtshim` **578**, `twinkle` **655**, `caret` **278**.
- Cross-fade selector list: **558**. `--sink` used-but-undefined at **619/621** (this task resolves that gap).

**Authoritative deviations from the mockup** (brand memory, current as of 2026-07-12 — these OVERRIDE the mockup's older values):

- light `--accent` = `#5A9310` (mockup had `#4e8f12`), `--accent-text` = `#ffffff`, recompute `--accent-soft`/`--accent-line` from `90,147,16`.
- dark `--accent` = `#9EFB25`, `--accent-text` = `#16200a`.
- NEW `--sink` code-surface token: dark `#1C1E1F`, light `#e7e8e1` (distinct from `--bg #f2f3ef` and `--sidebar #ecede6`).

**Prerequisite (consumed):** Task 1 harness — `packages/ui` already has `vitest.config.ts` (`environment:"jsdom"`, `include:["src/**/*.test.{ts,tsx}"]`), `vitest.setup.ts` (`import "@testing-library/jest-dom/vitest"`), a `"test": "vitest run"` script, and vitest/RTL/jsdom devDeps. If `pnpm --filter @wedevs/ui test` errors that vitest is missing, Task 1 has not landed — stop and flag it; do not re-create the harness here.

---

**Files:**

- CREATE `packages/config/theme.css` — canonical token blocks (4 raw blocks) + `@theme inline` utility mapping.
- MODIFY `packages/config/package.json` — add `"./theme.css": "./theme.css"` to `exports`.
- MODIFY `packages/config/tailwind.preset.ts` — `fontFamily` display/sans/mono mapping (mirror of theme.css `--font-*`).
- CREATE `packages/ui/src/styles/keyframes.css` — 9 keyframes + `.28s` cross-fade rule + `prefers-reduced-motion` backstop.
- MODIFY `packages/ui/package.json` — add `exports["./styles/keyframes.css"]`.
- CREATE `packages/ui/src/styles/tokens.test.ts` — parses `theme.css` text, asserts token coverage in both themes.
- MODIFY `apps/web/src/app/globals.css` — `@import` chain (tailwindcss + theme.css + tw-animate-css + keyframes.css) + a base layer binding body to tokens.
- MODIFY `apps/web/package.json` — add `tw-animate-css` devDependency (needed for the `@import` to resolve).

**Interfaces:**

- **Consumes:** Task 1 harness (ui vitest jsdom + `test` script). No exported TS symbols from the contract are consumed by this task.
- **Produces:** the full token set as CSS variables/`@theme` (no TS surface). Downstream tasks consume these tokens via Tailwind utilities (`bg-bg`, `text-text-2`, `border-border`, `bg-accent`, `text-primary-text`, `rounded-xl/lg/md`, `shadow-xl/lg`, `font-display/sans/mono`) and raw `var(--token)` in ported mockup CSS. Keyframe animation-names produced: `bob`, `blinkeye`, `antp`, `scan`, `hsh`, `twinkle`, `caret`, `txtshim`, `mockglow`.
  - **Name map for downstream authors** (task nickname → real CSS animation-name): _blink_ → `blinkeye`; _shimmer_ → `txtshim`. Use the real names in `animation:` shorthands.

---

- [ ] **Step 1: Write the failing token test.** Create `packages/ui/src/styles/tokens.test.ts` with EXACTLY this content. It reads `packages/config/theme.css` from disk (resolved relative to this test file) and asserts every token resolves in each of the four theme blocks, the accent hex per theme, the `--sink` regression, and that no Volt hex leaks into a light block.

```ts
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";

// packages/ui/src/styles/tokens.test.ts -> ../../../config/theme.css == packages/config/theme.css
const cssPath = fileURLToPath(
  new URL("../../../config/theme.css", import.meta.url),
);
const css = readFileSync(cssPath, "utf8");

/** Every semantic token that must be declared in each theme block. */
const TOKENS = [
  "--bg",
  "--surface",
  "--surface-2",
  "--sidebar",
  "--elevated",
  "--sink",
  "--text",
  "--text-2",
  "--text-3",
  "--border",
  "--border-2",
  "--hover",
  "--active",
  "--active-line",
  "--bubble",
  "--primary",
  "--primary-text",
  "--accent",
  "--accent-text",
  "--accent-soft",
  "--accent-line",
  "--success",
  "--warning",
  "--error",
  "--shadow",
  "--shadow-sm",
  "--radius",
  "--radius-sm",
  "--radius-xs",
];

/** Grab the flat declaration body of a token block (blocks contain no nested braces). */
function block(re: RegExp, label: string): string {
  const m = css.match(re);
  if (!m) throw new Error(`theme block not found: ${label}`);
  return m[1];
}

// The first `:root{ ... }` in the file is the light base (it precedes the @media/[data-theme] blocks).
const lightBase = block(/:root\s*\{([^{}]*)\}/, "light :root base");
const darkMedia = block(
  /@media \(prefers-color-scheme: dark\)\s*\{\s*:root\s*\{([^{}]*)\}/,
  "@media dark",
);
const lightAttr = block(
  /:root\[data-theme="light"\]\s*\{([^{}]*)\}/,
  '[data-theme="light"]',
);
const darkAttr = block(
  /:root\[data-theme="dark"\]\s*\{([^{}]*)\}/,
  '[data-theme="dark"]',
);

// `--accent\s*:` matches only the exact `--accent:` decl, never `--accent-soft:` etc. (a hyphen follows).
const declares = (text: string, token: string): boolean =>
  new RegExp(`${token}\\s*:`).test(text);

describe("theme tokens — full coverage in every theme mechanism", () => {
  const blocks: Record<string, string> = {
    "light (:root base)": lightBase,
    "dark (@media prefers-color-scheme)": darkMedia,
    'light ([data-theme="light"])': lightAttr,
    'dark ([data-theme="dark"])': darkAttr,
  };

  for (const [name, text] of Object.entries(blocks)) {
    for (const token of TOKENS) {
      it(`${name} declares ${token}`, () => {
        expect(declares(text, token)).toBe(true);
      });
    }
  }
});

describe("accent hue is exact per theme", () => {
  it("dark accent = #9EFB25 (both dark mechanisms)", () => {
    expect(/--accent\s*:\s*#9EFB25/i.test(darkMedia)).toBe(true);
    expect(/--accent\s*:\s*#9EFB25/i.test(darkAttr)).toBe(true);
  });
  it("light accent = #5A9310 (both light mechanisms)", () => {
    expect(/--accent\s*:\s*#5A9310/i.test(lightBase)).toBe(true);
    expect(/--accent\s*:\s*#5A9310/i.test(lightAttr)).toBe(true);
  });
});

describe("mockup gaps + leak guards", () => {
  it("--sink is defined in all four blocks (mockup 619/621 regression)", () => {
    expect(declares(lightBase, "--sink")).toBe(true);
    expect(declares(darkMedia, "--sink")).toBe(true);
    expect(declares(lightAttr, "--sink")).toBe(true);
    expect(declares(darkAttr, "--sink")).toBe(true);
  });
  it("no Volt (#9efb25) leaks into a light block", () => {
    expect(/#9efb25/i.test(lightBase)).toBe(false);
    expect(/#9efb25/i.test(lightAttr)).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test — expect RED.** `theme.css` does not exist yet, so `readFileSync` throws during module load.
  - Command: `pnpm --filter @wedevs/ui exec vitest run src/styles/tokens.test.ts`
  - Expected: the suite fails to collect with an error like `ENOENT: no such file or directory, open '...packages/config/theme.css'`. This is the intended RED.

- [ ] **Step 3: Export `theme.css` from the config package.** In `packages/config/package.json`, add the `theme.css` subpath to the existing `exports` map (so `@import "@wedevs/config/theme.css"` resolves). Add this key alongside the existing entries:

```json
"./theme.css": "./theme.css"
```

Resulting `exports` object:

```json
"exports": {
  "./tsconfig.base.json": "./tsconfig.base.json",
  "./eslint": "./eslint.preset.js",
  "./prettier": "./prettier.config.js",
  "./tailwind": "./tailwind.preset.ts",
  "./theme.css": "./theme.css"
}
```

- [ ] **Step 4: Write the canonical `theme.css`.** Create `packages/config/theme.css` with EXACTLY this content. Four raw token blocks (light base `:root`, `@media` dark, `[data-theme="light"]`, `[data-theme="dark"]`) carry the mockup names verbatim; `@theme inline` maps them to Tailwind v4 utilities so overriding a raw var at runtime flips the utility too.

```css
/* ============================================================
   Wedevs canonical design tokens — Graphite × Volt.
   SINGLE SOURCE OF TRUTH. Raw semantic vars (mockup names) live in
   :root and flip per theme via BOTH prefers-color-scheme AND
   [data-theme]; @theme inline maps them to Tailwind v4 utilities.
   Ported from mockup/index.html :root 19-30 / @media 31-42 /
   [data-theme="light"] 43-53 / [data-theme="dark"] 54-64.
   Authoritative deviations (2026-07-12):
     light --accent #5A9310 (was #4e8f12), --accent-text #ffffff
     dark  --accent #9EFB25,               --accent-text #16200a
     NEW   --sink code-surface (mockup left it undefined @619/621)
   ============================================================ */

/* ---- LIGHT (base) ---- */
:root {
  --bg: #f2f3ef;
  --surface: #fdfdfb;
  --surface-2: #f2f3ee;
  --sidebar: #ecede6;
  --elevated: #ffffff;
  --sink: #e7e8e1;
  --text: #21262a;
  --text-2: #5b625c;
  --text-3: #9aa096;
  --border: rgba(0, 0, 0, 0.09);
  --border-2: rgba(0, 0, 0, 0.14);
  --hover: rgba(0, 0, 0, 0.045);
  --active: rgba(0, 0, 0, 0.06);
  --active-line: rgba(0, 0, 0, 0.18);
  --bubble: rgba(0, 0, 0, 0.05);
  --primary: #21262a;
  --primary-text: #fdfdfb;
  --accent: #5a9310;
  --accent-text: #ffffff;
  --accent-soft: rgba(90, 147, 16, 0.12);
  --accent-line: rgba(90, 147, 16, 0.5);
  --success: #1f9d61;
  --warning: #b7791f;
  --error: #d6493d;
  --shadow: 0 12px 40px rgba(30, 45, 15, 0.14);
  --shadow-sm: 0 2px 8px rgba(30, 45, 15, 0.08);
  --radius: 14px;
  --radius-sm: 10px;
  --radius-xs: 8px;
}
/* ---- DARK (system preference) ---- */
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #252728;
    --surface: #2c2f30;
    --surface-2: #33373a;
    --sidebar: #1b1d1e;
    --elevated: #33373a;
    --sink: #1c1e1f;
    --text: #f2f4ee;
    --text-2: #a6ada4;
    --text-3: #6e756d;
    --border: rgba(255, 255, 255, 0.08);
    --border-2: rgba(255, 255, 255, 0.14);
    --hover: rgba(255, 255, 255, 0.05);
    --active: rgba(255, 255, 255, 0.08);
    --active-line: rgba(255, 255, 255, 0.18);
    --bubble: rgba(255, 255, 255, 0.06);
    --primary: #f2f4ee;
    --primary-text: #1b1d1e;
    --accent: #9efb25;
    --accent-text: #16200a;
    --accent-soft: rgba(158, 251, 37, 0.12);
    --accent-line: rgba(158, 251, 37, 0.4);
    --success: #5fe87b;
    --warning: #e0a53d;
    --error: #ff6b5e;
    --shadow: 0 16px 50px rgba(0, 0, 0, 0.5);
    --shadow-sm: 0 2px 10px rgba(0, 0, 0, 0.4);
    --radius: 14px;
    --radius-sm: 10px;
    --radius-xs: 8px;
  }
}
/* ---- EXPLICIT [data-theme] overrides (ThemeProvider stamps <html data-theme>; wins over @media) ---- */
:root[data-theme="light"] {
  --bg: #f2f3ef;
  --surface: #fdfdfb;
  --surface-2: #f2f3ee;
  --sidebar: #ecede6;
  --elevated: #ffffff;
  --sink: #e7e8e1;
  --text: #21262a;
  --text-2: #5b625c;
  --text-3: #9aa096;
  --border: rgba(0, 0, 0, 0.09);
  --border-2: rgba(0, 0, 0, 0.14);
  --hover: rgba(0, 0, 0, 0.045);
  --active: rgba(0, 0, 0, 0.06);
  --active-line: rgba(0, 0, 0, 0.18);
  --bubble: rgba(0, 0, 0, 0.05);
  --primary: #21262a;
  --primary-text: #fdfdfb;
  --accent: #5a9310;
  --accent-text: #ffffff;
  --accent-soft: rgba(90, 147, 16, 0.12);
  --accent-line: rgba(90, 147, 16, 0.5);
  --success: #1f9d61;
  --warning: #b7791f;
  --error: #d6493d;
  --shadow: 0 12px 40px rgba(30, 45, 15, 0.14);
  --shadow-sm: 0 2px 8px rgba(30, 45, 15, 0.08);
  --radius: 14px;
  --radius-sm: 10px;
  --radius-xs: 8px;
}
:root[data-theme="dark"] {
  --bg: #252728;
  --surface: #2c2f30;
  --surface-2: #33373a;
  --sidebar: #1b1d1e;
  --elevated: #33373a;
  --sink: #1c1e1f;
  --text: #f2f4ee;
  --text-2: #a6ada4;
  --text-3: #6e756d;
  --border: rgba(255, 255, 255, 0.08);
  --border-2: rgba(255, 255, 255, 0.14);
  --hover: rgba(255, 255, 255, 0.05);
  --active: rgba(255, 255, 255, 0.08);
  --active-line: rgba(255, 255, 255, 0.18);
  --bubble: rgba(255, 255, 255, 0.06);
  --primary: #f2f4ee;
  --primary-text: #1b1d1e;
  --accent: #9efb25;
  --accent-text: #16200a;
  --accent-soft: rgba(158, 251, 37, 0.12);
  --accent-line: rgba(158, 251, 37, 0.4);
  --success: #5fe87b;
  --warning: #e0a53d;
  --error: #ff6b5e;
  --shadow: 0 16px 50px rgba(0, 0, 0, 0.5);
  --shadow-sm: 0 2px 10px rgba(0, 0, 0, 0.4);
  --radius: 14px;
  --radius-sm: 10px;
  --radius-xs: 8px;
}

/* ---- Tailwind v4 utility mapping. `inline` emits utilities that reference the raw
        var directly (e.g. background-color:var(--bg)), so a runtime override of the
        raw var flips the generated utility too. ---- */
@theme inline {
  /* surfaces */
  --color-bg: var(--bg);
  --color-surface: var(--surface);
  --color-surface-2: var(--surface-2);
  --color-sidebar: var(--sidebar);
  --color-elevated: var(--elevated);
  --color-sink: var(--sink);
  /* text */
  --color-text: var(--text);
  --color-text-2: var(--text-2);
  --color-text-3: var(--text-3);
  /* lines + washes */
  --color-border: var(--border);
  --color-border-2: var(--border-2);
  --color-hover: var(--hover);
  --color-active: var(--active);
  --color-active-line: var(--active-line);
  --color-bubble: var(--bubble);
  /* neutral interactive fills */
  --color-primary: var(--primary);
  --color-primary-text: var(--primary-text);
  /* the one brand hue (Volt) — allowed only on alive/focus surfaces per brand rule */
  --color-accent: var(--accent);
  --color-accent-text: var(--accent-text);
  --color-accent-soft: var(--accent-soft);
  --color-accent-line: var(--accent-line);
  /* state */
  --color-success: var(--success);
  --color-warning: var(--warning);
  --color-error: var(--error);
  /* radii — NON-colliding Tailwind names so raw --radius-sm/--radius-xs stay intact:
       rounded-xl = --radius (14px) · rounded-lg = --radius-sm (10px) · rounded-md = --radius-xs (8px) */
  --radius-xl: var(--radius);
  --radius-lg: var(--radius-sm);
  --radius-md: var(--radius-xs);
  /* shadows — non-colliding names: shadow-xl = --shadow · shadow-lg = --shadow-sm */
  --shadow-xl: var(--shadow);
  --shadow-lg: var(--shadow-sm);
  /* fonts (mirrored in tailwind.preset.ts; raw --font-* provided by apps/web/fonts.ts) */
  --font-display:
    var(--font-unbounded), "Unbounded", ui-sans-serif, system-ui, sans-serif;
  --font-sans:
    var(--font-manrope), "Manrope", ui-sans-serif, system-ui, -apple-system,
    sans-serif;
  --font-mono:
    var(--font-jetbrains-mono), "JetBrains Mono", ui-monospace, SFMono-Regular,
    Menlo, monospace;
}
```

Note on the font `var()` references: `--font-unbounded`, `--font-manrope`, `--font-jetbrains-mono` are the CSS variable names `apps/web/fonts.ts` (a separate task) must expose via `next/font/local`'s `variable` option. Until that task lands, the quoted fallback family names render correctly — nothing here breaks.

- [ ] **Step 5: Run the token test — expect GREEN.**
  - Command: `pnpm --filter @wedevs/ui exec vitest run src/styles/tokens.test.ts`
  - Expected: all tests pass. Output ends with a line like `Test Files  1 passed (1)` and `Tests  <N> passed (<N>)` where N includes 4 blocks × 29 tokens = 116 coverage tests plus the accent/sink/leak assertions. Exit code 0.

- [ ] **Step 6: Commit tokens.** `git add packages/config/theme.css packages/config/package.json packages/ui/src/styles/tokens.test.ts && git commit -m "feat(config): add canonical Tailwind v4 @theme token set (light base + dark)"`

- [ ] **Step 7: Mirror the font mapping into the preset.** Replace the entire contents of `packages/config/tailwind.preset.ts` with:

```ts
import type { Config } from "tailwindcss";

/**
 * Font-family token mapping. The BUILD-EFFECTIVE source is the @theme block in
 * packages/config/theme.css (CSS-first Tailwind v4 pipeline via @tailwindcss/postcss).
 * This preset mirrors those three families for JS consumers (Storybook / any
 * @config-based build). Keep the two in sync.
 * Raw --font-* vars are provided at runtime by apps/web/fonts.ts (next/font/local).
 */
const preset = {
  theme: {
    extend: {
      fontFamily: {
        display: [
          "var(--font-unbounded)",
          "Unbounded",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        sans: [
          "var(--font-manrope)",
          "Manrope",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
        mono: [
          "var(--font-jetbrains-mono)",
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
      },
    },
  },
} satisfies Partial<Config>;

export default preset;
```

- [ ] **Step 8: Typecheck the config package.**
  - Command: `pnpm --filter @wedevs/config typecheck`
  - Expected: `tsc --noEmit` exits 0 with no output. (If the config package has no `typecheck` script, run `pnpm --filter @wedevs/config exec tsc --noEmit -p tsconfig.base.json` — still expect exit 0.)

- [ ] **Step 9: Commit the preset.** `git add packages/config/tailwind.preset.ts && git commit -m "chore(config): mirror --font-* family mapping in tailwind preset"`

- [ ] **Step 10: Write the keyframes + cross-fade layer.** Create `packages/ui/src/styles/keyframes.css` with EXACTLY this content. Nine keyframes ported verbatim from the mockup, the `.28s` cross-fade selector list (mockup 558, scoped to structural surfaces so hovers stay snappy), and a `prefers-reduced-motion` backstop that disables every animation/transition this layer introduces.

```css
/* ============================================================
   Wedevs animation layer — custom keyframes + theme cross-fade.
   Ported from mockup/index.html: blinkeye(78) antp(80) bob(565)
   scan(567) hsh(571) mockglow(556-557) txtshim(578) twinkle(655)
   caret(278). Consumed by mascots (Robo/Visor), live/* and
   StreamShimmer. Downstream nickname->name: blink=blinkeye, shimmer=txtshim.
   Reduced-motion backstop mirrors the JS-level useReducedMotion gating.
   ============================================================ */

@keyframes bob {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}
@keyframes blinkeye {
  0%,
  91%,
  100% {
    transform: scaleY(1);
  }
  94% {
    transform: scaleY(0.12);
  }
}
@keyframes antp {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}
@keyframes scan {
  0%,
  100% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(15px);
  }
}
@keyframes hsh {
  0%,
  100% {
    transform: scaleX(1);
    opacity: 0.5;
  }
  50% {
    transform: scaleX(0.68);
    opacity: 0.26;
  }
}
@keyframes twinkle {
  0%,
  100% {
    opacity: 0;
    transform: scale(0.5);
  }
  50% {
    opacity: 1;
    transform: scale(1.15);
  }
}
@keyframes caret {
  50% {
    opacity: 0;
  }
}
@keyframes txtshim {
  from {
    background-position: 200% 0;
  }
  to {
    background-position: -20% 0;
  }
}
@keyframes mockglow {
  0%,
  100% {
    box-shadow:
      var(--shadow),
      inset 0 1px 0 rgba(255, 255, 255, 0.05);
  }
  50% {
    box-shadow:
      var(--shadow),
      inset 0 1px 0 rgba(255, 255, 255, 0.05),
      0 0 15px -2px var(--accent-line);
  }
}

/* ---- theme cross-fade (mockup 558): only structural surfaces so interactive hovers stay instant ---- */
body,
.rail,
.topbar,
.inspector,
.composer,
.mock,
.pcard,
.detail-card,
.bubble,
.code-tree,
.editor,
.code-head,
.code-foot,
.sel-btn,
.starter,
.tool-card {
  transition:
    background-color 0.28s ease,
    border-color 0.28s ease,
    color 0.28s ease;
}

/* ---- reduced-motion backstop: kill every animation/transition this layer adds ---- */
@media (prefers-reduced-motion: reduce) {
  .visor-svg,
  .visor-svg .scanline,
  .visor-svg .ant,
  .hero-shadow,
  .mock,
  .stream-shimmer,
  .who .ant,
  .lc-main,
  .lc-spark,
  .caret,
  .type-caret,
  .loader,
  .spinner {
    animation: none !important;
  }
  body,
  .rail,
  .topbar,
  .inspector,
  .composer,
  .mock,
  .pcard,
  .detail-card,
  .bubble,
  .code-tree,
  .editor,
  .code-head,
  .code-foot,
  .sel-btn,
  .starter,
  .tool-card {
    transition: none !important;
  }
}
```

Note: `mockglow` references `var(--shadow)`/`var(--accent-line)`, which are global tokens from `theme.css` — resolves fine at use sites. Keyframes `live`/`spin` (used by `LiveCluster`/loaders) are NOT in this file by design; they are added by the live-components task. The reduced-motion backstop still lists `.lc-main`/`.loader`/`.spinner` so it neutralizes them if/when present.

- [ ] **Step 11: Export the keyframes CSS from the ui package.** In `packages/ui/package.json`, add an `exports` map (or, if Task 1 already added one, merge the `styles/keyframes.css` subpath into it). Keep `main`/`types` as-is. The map must include at least:

```json
"exports": {
  ".": "./src/index.ts",
  "./styles/keyframes.css": "./src/styles/keyframes.css"
}
```

Insert it after the `"types"` field. Final head of the file should read:

```json
{
  "name": "@wedevs/ui",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./styles/keyframes.css": "./src/styles/keyframes.css"
  },
```

(Leave `scripts` and `devDependencies` unchanged.)

- [ ] **Step 12: Commit the animation layer.** `git add packages/ui/src/styles/keyframes.css packages/ui/package.json && git commit -m "feat(ui): add keyframes + theme cross-fade animation layer"`

- [ ] **Step 13: Add the `tw-animate-css` dependency to the web app.** It is `@import`ed by `globals.css` and must resolve from `apps/web`'s node_modules.
  - Command: `pnpm --filter web add -D tw-animate-css`
  - Expected: pnpm resolves and installs the latest `tw-animate-css` (a caret range appears under `apps/web/package.json` → `devDependencies`), exit 0.

- [ ] **Step 14: Wire `globals.css`.** Replace the entire contents of `apps/web/src/app/globals.css` with EXACTLY this (order matters: `tailwindcss` first so our `@theme inline` overrides its defaults; tokens before the animation/utility layers). The base layer makes the token system observably paint.

```css
@import "tailwindcss";
@import "@wedevs/config/theme.css";
@import "tw-animate-css";
@import "@wedevs/ui/styles/keyframes.css";

@layer base {
  html {
    font-family: var(--font-sans);
  }
  body {
    background-color: var(--bg);
    color: var(--text);
  }
}
```

- [ ] **Step 15: Verify the web build compiles the tokens.** This resolves every `@import`, runs Tailwind, and proves utilities/vars emit into the compiled CSS.
  - Command: `pnpm --filter web build`
  - Expected: Next.js build completes with exit 0 (`✓ Compiled successfully`). No `Can't resolve '@wedevs/config/theme.css'`, no `Can't resolve 'tw-animate-css'`, no `Can't resolve '@wedevs/ui/styles/keyframes.css'`.
  - Then confirm the tokens landed in the emitted CSS:
    - Command: `node -e "const fs=require('fs'),p=require('path');const d=p.join('apps','web','.next','static','css');const f=fs.readdirSync(d).find(x=>x.endsWith('.css'));const c=fs.readFileSync(p.join(d,f),'utf8');console.log('accent-light', c.includes('#5A9310')||c.toLowerCase().includes('#5a9310'));console.log('accent-dark', c.toLowerCase().includes('#9efb25'));console.log('sink', c.includes('--sink'));console.log('keyframe-bob', c.includes('@keyframes bob')||c.includes('bob'));"`
    - Expected: prints `accent-light true`, `accent-dark true`, `sink true`, `keyframe-bob true`. (If the light-mode CSS is pruned into a media/attr block the substring still appears; all four booleans must be `true`.)

- [ ] **Step 16: Run the full ui test suite to confirm nothing regressed.**
  - Command: `pnpm --filter @wedevs/ui test`
  - Expected: all tests pass (includes `tokens.test.ts`), exit 0.

- [ ] **Step 17: Commit the web wiring.** `git add apps/web/src/app/globals.css apps/web/package.json pnpm-lock.yaml && git commit -m "chore(web): wire globals to tokens, keyframes, and tw-animate-css"`

---

**Definition of done:**

- `packages/config/theme.css` exists and is exported (`@wedevs/config/theme.css`); it declares all 29 tokens (surfaces incl. `--sink`, text, borders/washes, `--primary`/`--primary-text`, `--accent`+`--accent-text`/`--accent-soft`/`--accent-line`, `--success`/`--warning`/`--error`, `--shadow`/`--shadow-sm`, `--radius`/`--radius-sm`/`--radius-xs`) identically across all four theme blocks (`:root` base, `@media` dark, `[data-theme="light"]`, `[data-theme="dark"]`).
- `--accent` = `#9EFB25` (dark) / `#5A9310` (light); `--accent-text` = `#16200a` (dark) / `#ffffff` (light); no `#9efb25` appears in any light block.
- `--sink` is defined in every block (dark `#1C1E1F`, light `#e7e8e1`), resolving the mockup 619/621 gap.
- `@theme inline` maps tokens to utilities (`bg-*`, `text-*`, `border-*`, `rounded-xl/lg/md`, `shadow-xl/lg`, `font-display/sans/mono`) with radius/shadow names chosen to avoid clobbering the raw `--radius-sm`/`--radius-xs`/`--shadow-sm` tokens.
- `packages/ui/src/styles/keyframes.css` defines `bob`, `blinkeye`, `antp`, `scan`, `hsh`, `twinkle`, `caret`, `txtshim`, `mockglow`, ports the `.28s` cross-fade selector list, and disables all of it under `prefers-reduced-motion: reduce`; it is exported as `@wedevs/ui/styles/keyframes.css`.
- `tailwind.preset.ts` carries the `display`/`sans`/`mono` font mapping and typechecks clean.
- `apps/web/src/app/globals.css` imports tailwindcss → theme.css → tw-animate-css → keyframes.css and binds the body to `--bg`/`--text`; `pnpm --filter web build` succeeds and the compiled CSS contains `#5A9310`, `#9efb25`, `--sink`, and the keyframes.
- `pnpm --filter @wedevs/ui test` passes (token text-parse suite green). All work committed under Conventional Commit messages.

---

### Task 3: Theme store (zustand) + ThemeProvider with data-theme + localStorage + Light/Dark/System

Builds the theme layer for the design system: a zustand store that owns the user's theme
choice, persists it to `localStorage`, resolves `"system"` against the OS, and re-resolves on OS
change; plus a `ThemeProvider` that stamps `data-theme` on `<html>` and arms a reduced-motion-safe
cross-fade. All literal theme values (the `data-theme="light|dark"` token blocks, the boot-to-dark
default, the `.28s ease` cross-fade, and the `setTheme`/`toggle` semantics) are ported from
`d:/Rajin/Wedevs.cloud/mockup/index.html`.

**Mockup source of truth (read these exact ranges before coding):**

- Lines **43–64** — `:root[data-theme="light"]` and `:root[data-theme="dark"]` token blocks. Confirms the attribute is `data-theme` on the root element and its only two rendered values are `"light"` / `"dark"` (never `"system"` — `"system"` always resolves to one of the two).
- Lines **1405–1418** — `setTheme(t)` / `app_theme_system()` / `toggleTheme()`. `setTheme('system')` resolves via `window.matchMedia('(prefers-color-scheme: dark)')`; `toggleTheme()` reads the _current_ rendered `data-theme` and flips dark↔light. Our store reproduces this: `setMode` resolves + stamps, `toggle` pivots off the current `resolved`.
- Line **1634** — `setTheme('dark')` on init → the app **boots to dark** when nothing is persisted.
- Line **558** — `body,.rail,.topbar,… { transition:background-color .28s ease,border-color .28s ease,color .28s ease }` → the theme cross-fade. We port the `.28s ease` timing into a provider-injected, `prefers-reduced-motion`-guarded stylesheet that is component-agnostic (keyed on `:root[data-theme-transition="on"] *` instead of the mockup's hard-coded `.rail/.topbar/…` selectors, which do not exist in our Tailwind components).

**Brand rule check ("neutral = interactive · Volt = alive"):** this task renders **no** UI surface and paints **nothing** with `--accent`. It only writes the `data-theme` attribute; the token values behind it (including `--accent`) come from Task 2's `packages/config/theme.css`. There is no Volt usage to add or forbid here.

---

**Files:**

Create:

- `packages/ui/src/store/theme.ts` — zustand `ThemeState` slice + `resolveTheme` + `THEME_STORAGE_KEY` + module-level OS-change subscription.
- `packages/ui/src/store/theme.test.ts` — store behavior (vitest, jsdom, dynamic-import + mocked `matchMedia`/`localStorage`).
- `packages/ui/src/providers/ThemeProvider.tsx` — `ThemeProvider` (stamps `<html data-theme>`, arms cross-fade) + `useTheme()`.
- `packages/ui/src/providers/ThemeProvider.test.tsx` — provider behavior (vitest, jsdom, `@testing-library/react`).

Modify:

- `packages/ui/package.json` — add `zustand` to `dependencies`.
- `packages/ui/src/index.ts` — barrel re-export of the store + provider (create the file if Task 1 hasn't yet; otherwise append).
- `packages/ui/tsconfig.json` — ensure `"jsx": "react-jsx"` is present (owned by Task 1; verify only).

Consumes: **Task 1** harness (`packages/ui/vitest.config.ts` with `environment: "jsdom"`, `include: ["src/**/*.test.{ts,tsx}"]`, setup `import "@testing-library/jest-dom/vitest"`; `@testing-library/react`, `jsdom`, `vitest` devDeps installed). **Task 2** tokens (`data-theme` blocks in `packages/config/theme.css`) supply the CSS variables this task's `data-theme` attribute selects between — no direct import; runtime coupling only.

Produces (downstream consumers: `SettingsModal` Light/Dark/System control, `apps/web/src/app/layout.tsx`):

**Interfaces — copy these exact names/types (from the shared contract):**

```ts
export type ThemeMode = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";
export interface ThemeState {
  mode: ThemeMode; // user choice, persisted to localStorage key "wedevs-theme"
  resolved: ResolvedTheme; // effective theme after resolving "system" via matchMedia
  setMode: (mode: ThemeMode) => void;
  toggle: () => void; // cycles light <-> dark (not system)
}
export const useThemeStore: import("zustand").UseBoundStore<
  import("zustand").StoreApi<ThemeState>
>;
export interface ThemeProviderProps {
  children: React.ReactNode;
}
export function ThemeProvider(props: ThemeProviderProps): JSX.Element; // stamps <html data-theme>
export function useTheme(): ThemeState;
```

---

- [ ] **Step 1: Add the `zustand` dependency.**
      Run (pnpm workspace; `@wedevs/ui` is the package name):

  ```bash
  pnpm --filter @wedevs/ui add zustand@^5.0.2
  ```

  Expected: pnpm resolves and writes `"zustand": "^5.0.2"` into `packages/ui/package.json` `dependencies` and updates the lockfile. Confirm with:

  ```bash
  pnpm --filter @wedevs/ui exec node -e "console.log(require('./package.json').dependencies.zustand)"
  ```

  Expected output: `^5.0.2`.

- [ ] **Step 2: Verify the test harness (Task 1) is in place — do not re-create it.**
      Run:

  ```bash
  pnpm --filter @wedevs/ui exec node -e "const c=require('fs').readFileSync('vitest.config.ts','utf8'); if(!/jsdom/.test(c)) throw new Error('vitest jsdom harness missing — Task 1 incomplete'); console.log('harness ok')"
  ```

  Expected output: `harness ok`. Also confirm `packages/ui/tsconfig.json` contains `"jsx": "react-jsx"`:

  ```bash
  pnpm --filter @wedevs/ui exec node -e "const t=require('./tsconfig.json'); console.log((t.compilerOptions||{}).jsx)"
  ```

  Expected output: `react-jsx`. If it prints `undefined`, add `"jsx": "react-jsx"` to `compilerOptions` in `packages/ui/tsconfig.json` before continuing.

- [ ] **Step 3: Write the FAILING store test `packages/ui/src/store/theme.test.ts`.**
      Uses `vi.resetModules()` + dynamic `import("./theme")` so each test gets a fresh module whose load-time reads of `localStorage`/`matchMedia` see that test's setup. `matchMedia` is not implemented by jsdom, so it is mocked per test.

  ```ts
  import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

  const COLOR_SCHEME_QUERY = "(prefers-color-scheme: dark)";

  interface MediaMockControl {
    /** Flip the mocked OS preference and fire the `change` event to registered listeners. */
    set: (matches: boolean) => void;
  }

  /** Install a controllable `window.matchMedia` mock (jsdom does not provide one). */
  function mockMatchMedia(initialDark: boolean): MediaMockControl {
    const listeners = new Set<(e: MediaQueryListEvent) => void>();
    const mql = {
      matches: initialDark,
      media: COLOR_SCHEME_QUERY,
      onchange: null,
      addEventListener: (
        _type: string,
        cb: (e: MediaQueryListEvent) => void,
      ) => {
        listeners.add(cb);
      },
      removeEventListener: (
        _type: string,
        cb: (e: MediaQueryListEvent) => void,
      ) => {
        listeners.delete(cb);
      },
      addListener: (cb: (e: MediaQueryListEvent) => void) => {
        listeners.add(cb);
      },
      removeListener: (cb: (e: MediaQueryListEvent) => void) => {
        listeners.delete(cb);
      },
      dispatchEvent: () => true,
    } satisfies Partial<MediaQueryList> as unknown as MediaQueryList;

    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => mql),
    );

    return {
      set: (matches: boolean) => {
        (mql as { matches: boolean }).matches = matches;
        listeners.forEach((cb) => cb({ matches } as MediaQueryListEvent));
      },
    };
  }

  describe("theme store", () => {
    beforeEach(() => {
      window.localStorage.clear();
      vi.resetModules();
    });
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("boots to dark when nothing is persisted (mockup line 1634)", async () => {
      mockMatchMedia(false); // OS = light, but the explicit default is dark
      const { useThemeStore } = await import("./theme");
      expect(useThemeStore.getState().mode).toBe("dark");
      expect(useThemeStore.getState().resolved).toBe("dark");
    });

    it("reads a persisted mode on init", async () => {
      window.localStorage.setItem("wedevs-theme", "light");
      mockMatchMedia(true);
      const { useThemeStore } = await import("./theme");
      expect(useThemeStore.getState().mode).toBe("light");
      expect(useThemeStore.getState().resolved).toBe("light");
    });

    it("setMode updates mode + resolved and persists to localStorage", async () => {
      mockMatchMedia(true);
      const { useThemeStore, THEME_STORAGE_KEY } = await import("./theme");
      useThemeStore.getState().setMode("light");
      expect(useThemeStore.getState().mode).toBe("light");
      expect(useThemeStore.getState().resolved).toBe("light");
      expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
      expect(THEME_STORAGE_KEY).toBe("wedevs-theme");
    });

    it("toggle cycles light <-> dark (never system)", async () => {
      mockMatchMedia(true);
      const { useThemeStore } = await import("./theme");
      useThemeStore.getState().setMode("dark");
      useThemeStore.getState().toggle();
      expect(useThemeStore.getState().mode).toBe("light");
      expect(useThemeStore.getState().resolved).toBe("light");
      useThemeStore.getState().toggle();
      expect(useThemeStore.getState().mode).toBe("dark");
      expect(useThemeStore.getState().resolved).toBe("dark");
    });

    it("toggle pivots off the currently resolved theme when in system mode", async () => {
      mockMatchMedia(true); // system => dark
      const { useThemeStore } = await import("./theme");
      useThemeStore.getState().setMode("system");
      expect(useThemeStore.getState().resolved).toBe("dark");
      useThemeStore.getState().toggle(); // resolved dark -> light, leaves system mode
      expect(useThemeStore.getState().mode).toBe("light");
      expect(useThemeStore.getState().resolved).toBe("light");
    });

    it("resolves 'system' from matchMedia", async () => {
      mockMatchMedia(false); // OS = light
      const { useThemeStore } = await import("./theme");
      useThemeStore.getState().setMode("system");
      expect(useThemeStore.getState().mode).toBe("system");
      expect(useThemeStore.getState().resolved).toBe("light");
    });

    it("re-resolves when the OS scheme changes while in 'system'", async () => {
      const media = mockMatchMedia(true); // OS = dark
      const { useThemeStore } = await import("./theme");
      useThemeStore.getState().setMode("system");
      expect(useThemeStore.getState().resolved).toBe("dark");
      media.set(false); // OS flips to light -> store must re-resolve
      expect(useThemeStore.getState().resolved).toBe("light");
    });

    it("ignores OS scheme changes when mode is not 'system'", async () => {
      const media = mockMatchMedia(true);
      const { useThemeStore } = await import("./theme");
      useThemeStore.getState().setMode("dark");
      media.set(false);
      expect(useThemeStore.getState().resolved).toBe("dark");
    });
  });
  ```

- [ ] **Step 4: Run the store test and confirm it FAILS.**

  ```bash
  pnpm --filter @wedevs/ui exec vitest run src/store/theme.test.ts
  ```

  Expected: RED — every test errors because the module does not exist yet, e.g. `Error: Failed to load url ./theme` / `Cannot find module './theme'`. (This is the intended failing state.)

- [ ] **Step 5: Implement `packages/ui/src/store/theme.ts`.**
      Complete, correct logic (mirrors mockup `setTheme`/`app_theme_system`/`toggleTheme` at lines 1405–1418, default-dark at 1634). SSR-guarded (`packages/ui` is consumed by Next.js). A module-level `matchMedia` subscription re-resolves `"system"` on OS change.

  ```ts
  import { create } from "zustand";

  export type ThemeMode = "light" | "dark" | "system";
  export type ResolvedTheme = "light" | "dark";

  export interface ThemeState {
    mode: ThemeMode;
    resolved: ResolvedTheme;
    setMode: (mode: ThemeMode) => void;
    toggle: () => void;
  }

  /** localStorage key holding the user's ThemeMode choice. */
  export const THEME_STORAGE_KEY = "wedevs-theme";

  const COLOR_SCHEME_QUERY = "(prefers-color-scheme: dark)";
  /** App boots to dark when nothing is persisted (mockup line 1634). */
  const DEFAULT_MODE: ThemeMode = "dark";

  function canUseDom(): boolean {
    return typeof window !== "undefined";
  }

  /** True when the OS currently prefers a dark color scheme. */
  function systemPrefersDark(): boolean {
    if (!canUseDom() || typeof window.matchMedia !== "function") {
      return true; // no signal available -> fall back to dark (matches DEFAULT_MODE)
    }
    return window.matchMedia(COLOR_SCHEME_QUERY).matches;
  }

  /** Resolve a ThemeMode to the concrete theme that should render. */
  export function resolveTheme(mode: ThemeMode): ResolvedTheme {
    if (mode === "system") {
      return systemPrefersDark() ? "dark" : "light";
    }
    return mode;
  }

  function readStoredMode(): ThemeMode {
    if (!canUseDom()) return DEFAULT_MODE;
    try {
      const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === "light" || stored === "dark" || stored === "system") {
        return stored;
      }
    } catch {
      /* localStorage unavailable (e.g. privacy mode) — fall through to default */
    }
    return DEFAULT_MODE;
  }

  function persistMode(mode: ThemeMode): void {
    if (!canUseDom()) return;
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch {
      /* storage write blocked — non-fatal, in-memory state still updates */
    }
  }

  const initialMode = readStoredMode();

  export const useThemeStore = create<ThemeState>((set, get) => ({
    mode: initialMode,
    resolved: resolveTheme(initialMode),
    setMode: (mode) => {
      persistMode(mode);
      set({ mode, resolved: resolveTheme(mode) });
    },
    toggle: () => {
      // Pivot off the currently rendered theme, flip, and leave "system" (mockup toggleTheme 1415).
      const next: ResolvedTheme = get().resolved === "dark" ? "light" : "dark";
      persistMode(next);
      set({ mode: next, resolved: next });
    },
  }));

  // Keep "system" mode live: re-resolve whenever the OS scheme changes.
  if (canUseDom() && typeof window.matchMedia === "function") {
    const mql = window.matchMedia(COLOR_SCHEME_QUERY);
    const onSystemChange = (): void => {
      if (useThemeStore.getState().mode === "system") {
        useThemeStore.setState({ resolved: resolveTheme("system") });
      }
    };
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", onSystemChange);
    } else if (typeof mql.addListener === "function") {
      mql.addListener(onSystemChange); // Safari < 14 fallback
    }
  }
  ```

- [ ] **Step 6: Run the store test and confirm it PASSES.**

  ```bash
  pnpm --filter @wedevs/ui exec vitest run src/store/theme.test.ts
  ```

  Expected: GREEN — `Test Files  1 passed (1)`, `Tests  8 passed (8)`.

- [ ] **Step 7: Commit the store.**

  ```bash
  git add packages/ui/src/store/theme.ts packages/ui/src/store/theme.test.ts packages/ui/package.json pnpm-lock.yaml
  git commit -m "feat(ui): theme store with localStorage persistence and system resolution"
  ```

- [ ] **Step 8: Write the FAILING provider test `packages/ui/src/providers/ThemeProvider.test.tsx`.**
      Renders with `@testing-library/react` and asserts the `data-theme` attribute, the armed cross-fade attribute, the injected reduced-motion-guarded stylesheet, and `useTheme()` reactivity. `beforeEach` resets DOM + store to a known dark baseline (no `matchMedia` needed — dark mode never calls it).

  ```tsx
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
      expect(
        document.documentElement.getAttribute("data-theme-transition"),
      ).toBe("on");
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
  ```

- [ ] **Step 9: Run the provider test and confirm it FAILS.**

  ```bash
  pnpm --filter @wedevs/ui exec vitest run src/providers/ThemeProvider.test.tsx
  ```

  Expected: RED — module resolution error, e.g. `Failed to load url ./ThemeProvider` / `Cannot find module './ThemeProvider'`.

- [ ] **Step 10: Implement `packages/ui/src/providers/ThemeProvider.tsx`.**
      Stamps `<html data-theme={resolved}>` on every `resolved` change; injects a one-time, component-agnostic cross-fade stylesheet whose `.28s ease` transitions are gated behind `@media (prefers-reduced-motion: no-preference)` (so reduced-motion users get an instant, non-animated theme swap — satisfying the global a11y constraint); arms it by setting `data-theme-transition="on"`. `useTheme()` re-exposes the store per the contract.

  ```tsx
  import * as React from "react";
  import { useThemeStore, type ThemeState } from "../store/theme";

  export interface ThemeProviderProps {
    children: React.ReactNode;
  }

  const FADE_STYLE_ID = "wedevs-theme-fade";

  // Ported from mockup line 558 (`transition:background-color .28s ease,border-color .28s ease,
  // color .28s ease`), broadened to every element (+ fill/stroke for SVG mascots) and made
  // component-agnostic so it applies to our Tailwind-classed components. Guarded so that
  // prefers-reduced-motion users get no cross-fade at all.
  const FADE_CSS = `@media (prefers-reduced-motion: no-preference){
    :root[data-theme-transition="on"] *,
    :root[data-theme-transition="on"] *::before,
    :root[data-theme-transition="on"] *::after{
      transition:background-color .28s ease,border-color .28s ease,color .28s ease,fill .28s ease,stroke .28s ease;
    }
  }`;

  export function ThemeProvider({
    children,
  }: ThemeProviderProps): React.JSX.Element {
    const resolved = useThemeStore((s) => s.resolved);

    // Stamp <html data-theme> on every resolved-theme change (mockup setTheme, line 1407).
    React.useEffect(() => {
      document.documentElement.setAttribute("data-theme", resolved);
    }, [resolved]);

    // Inject the cross-fade stylesheet once, then arm transitions after the first commit
    // (so the initial theme paint does not animate).
    React.useEffect(() => {
      if (!document.getElementById(FADE_STYLE_ID)) {
        const style = document.createElement("style");
        style.id = FADE_STYLE_ID;
        style.textContent = FADE_CSS;
        document.head.appendChild(style);
      }
      document.documentElement.setAttribute("data-theme-transition", "on");
    }, []);

    return <>{children}</>;
  }

  /** Subscribe to the theme store (mode/resolved + setMode/toggle). */
  export function useTheme(): ThemeState {
    return useThemeStore();
  }
  ```

- [ ] **Step 11: Run the provider test and confirm it PASSES.**

  ```bash
  pnpm --filter @wedevs/ui exec vitest run src/providers/ThemeProvider.test.tsx
  ```

  Expected: GREEN — `Test Files  1 passed (1)`, `Tests  5 passed (5)`.

- [ ] **Step 12: Export from the barrel `packages/ui/src/index.ts`.**
      If the file does not exist yet (Task 1 may not have created it), create it with the two lines below. If it exists, append them (idempotent — skip if already present).

  ```ts
  export * from "./store/theme";
  export * from "./providers/ThemeProvider";
  ```

  This surfaces `ThemeMode`, `ResolvedTheme`, `ThemeState`, `useThemeStore`, `THEME_STORAGE_KEY`, `resolveTheme`, `ThemeProvider`, `ThemeProviderProps`, and `useTheme` from the package root.

- [ ] **Step 13: Typecheck the package (strict, no `any`).**

  ```bash
  pnpm --filter @wedevs/ui exec tsc --noEmit
  ```

  Expected: exit code `0`, no output. If `tsc` reports the global `JSX` namespace is missing, confirm `React.JSX.Element` is used (it is, above) — do not fall back to a bare `JSX.Element`.

- [ ] **Step 14: Run the full `@wedevs/ui` test suite to confirm no regressions.**

  ```bash
  pnpm --filter @wedevs/ui exec vitest run
  ```

  Expected: GREEN — all files pass, including `src/store/theme.test.ts` (8) and `src/providers/ThemeProvider.test.tsx` (5). No failures, no unhandled errors.

- [ ] **Step 15: Commit the provider + barrel.**
  ```bash
  git add packages/ui/src/providers/ThemeProvider.tsx packages/ui/src/providers/ThemeProvider.test.tsx packages/ui/src/index.ts
  git commit -m "feat(ui): ThemeProvider stamps data-theme with reduced-motion-safe cross-fade"
  ```

---

**Definition of done:**

- `useThemeStore` exposes `{ mode, resolved, setMode, toggle }` exactly per the shared contract; `mode` persists to `localStorage["wedevs-theme"]`, defaults to `"dark"` when unset (mockup 1634), and rehydrates on load.
- `"system"` resolves via `matchMedia("(prefers-color-scheme: dark)")` and re-resolves automatically on OS scheme change; `setMode`/`toggle` behave per mockup `setTheme`/`toggleTheme` (1405–1418), with `toggle` cycling light↔dark only.
- `ThemeProvider` stamps `data-theme` on `document.documentElement` matching `resolved` and updates it on change; `useTheme()` returns the live store.
- Cross-fade uses the mockup's `.28s ease` timing (558) and is fully disabled under `prefers-reduced-motion: reduce`.
- No `--accent`/Volt is introduced by this task. `pnpm --filter @wedevs/ui exec tsc --noEmit` is clean; all 13 tests pass; both `feat(ui): …` commits landed.

---

### Task 4: Self-hosted fonts via next/font/local (Unbounded / Manrope / JetBrains Mono)

Replace the mockup's Google Fonts `<link>` (mockup line 9) with three self-hosted families loaded through `next/font/local`, exposed as the CSS variables `--font-display`, `--font-sans`, `--font-mono`, applied to `<html>` in the App Router root layout, and mapped into Tailwind v4's font utilities + the TS preset. After this task there is **zero** network font request anywhere in `apps/web`.

**Font inventory (mockup §2 typography, lines 9 / 69 / 73 / 74):**

- mockup 9 — `Unbounded:wght@600;700;800 & Manrope:wght@400;500;600;700;800 & JetBrains Mono:wght@400;500` — this Google Fonts `<link>` is DELETED / never ported.
- mockup 69 — `body { font-family:'Manrope','Segoe UI',system-ui,-apple-system,sans-serif; }` → **Manrope = body / sans**.
- mockup 73 — `.mono { font-family:'JetBrains Mono',ui-monospace,Consolas,monospace; font-variant-numeric:tabular-nums }` → **JetBrains Mono = mono / editor / kbd / code**.
- mockup 74 — `.disp,.greet,.brand-name { font-family:'Unbounded','Manrope',sans-serif; letter-spacing:-.01em }` → **Unbounded = display / brand / greeting**.
- other JetBrains Mono uses to keep working via `--font-mono`: `.kbd` (99), inline `code` (240), `.editor` (621), `.code-foot` (627), `.cfg-input input` (670), `.share-link input` (702). Other Unbounded use: `.brand-logo` (582).

---

**Files:**

Create:

- `apps/web/src/app/fonts.ts` — three `next/font/local` families → CSS vars `--font-display` / `--font-sans` / `--font-mono`.
- `apps/web/src/app/fonts/` — self-hosted `.woff2` files (10 files, binary, committed):
  - `unbounded-600.woff2`, `unbounded-700.woff2`, `unbounded-800.woff2`
  - `manrope-400.woff2`, `manrope-500.woff2`, `manrope-600.woff2`, `manrope-700.woff2`, `manrope-800.woff2`
  - `jetbrains-mono-400.woff2`, `jetbrains-mono-500.woff2`
- `apps/web/src/app/fonts.test.ts` — asserts `fonts.ts` exports three families with the canonical `variable` names and exact weight sets.
- `apps/web/src/app/layout.test.tsx` — asserts the three variable classNames land on `<html>` and NO Google-Fonts link is emitted.

Modify:

- `apps/web/vitest.config.ts` — include `*.test.tsx`, enable automatic JSX, disable CSS processing.
- `apps/web/src/app/layout.tsx` — import `fonts.ts`, apply the three `.variable` classNames to `<html>`, wrap children in `ThemeProvider` (Task 3).
- `apps/web/src/app/globals.css` — `@theme inline` mapping of font tokens → the next/font vars + base typography ported from mockup 69/73/74.
- `packages/config/tailwind.preset.ts` — `fontFamily.display/sans/mono` → `var(--font-display/-sans/-mono)` (TS mirror of the CSS mapping).

---

**Interfaces:**

_Consumes:_

- Task 2 font-family tokens (whatever placeholder `--font-*` stacks it declared in `packages/config/theme.css` `@theme`; this task supersedes them for the font utilities via a later `@theme inline` block and the "later layer wins" rule).
- Task 3 `ThemeProvider` (canonical contract):
  ```ts
  export interface ThemeProviderProps {
    children: React.ReactNode;
  }
  export function ThemeProvider(props: ThemeProviderProps): JSX.Element; // stamps <html data-theme>
  ```
  Imported from `@wedevs/ui`.

_Produces (new, this task):_

- `apps/web/src/app/fonts.ts` named exports:
  ```ts
  import type { NextFontWithVariable } from "next/dist/compiled/@next/font";
  export const fontDisplay: NextFontWithVariable; // variable "--font-display", Unbounded 600/700/800
  export const fontSans: NextFontWithVariable; // variable "--font-sans",    Manrope 400/500/600/700/800
  export const fontMono: NextFontWithVariable; // variable "--font-mono",    JetBrains Mono 400/500
  ```
  (In code you never annotate these — `localFont(...)` infers the type. The interface above is documentation.)
- Runtime CSS variables on `<html>`: `--font-display`, `--font-sans`, `--font-mono` (each = generated `@font-face` family + size-adjusted fallback). No external `<link>`.

---

**Steps:**

- [ ] **Step 1: Widen the web Vitest config to run `.tsx` tests with JSX + no CSS processing.** Replace the whole file `apps/web/vitest.config.ts` with:

  ```ts
  import { defineConfig } from "vitest/config";
  import { fileURLToPath } from "node:url";

  export default defineConfig({
    esbuild: { jsx: "automatic", jsxImportSource: "react" },
    test: {
      environment: "node",
      include: ["src/**/*.test.{ts,tsx}"],
      css: false,
    },
    resolve: {
      alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    },
  });
  ```

  Rationale: `renderToStaticMarkup` needs no DOM, so `environment: "node"` stays; `css: false` makes `import "./globals.css"` a no-op module (so Vitest never runs PostCSS/Tailwind during the test); `jsx: "automatic"` lets the `.tsx` test use JSX without importing React.

- [ ] **Step 2: Commit the config change.**

  ```bash
  git add apps/web/vitest.config.ts
  git commit -m "chore(web): run tsx tests with automatic jsx and no css processing"
  ```

- [ ] **Step 3: Write the failing `fonts.ts` unit test.** Create `apps/web/src/app/fonts.test.ts`:

  ```ts
  import { describe, it, expect, vi } from "vitest";

  // next/font/local is a Next build-time macro; in a plain Vitest run we stub it
  // so it echoes the options back, letting us assert OUR configuration.
  vi.mock("next/font/local", () => ({
    default: (opts: {
      variable?: string;
      src?: Array<{ weight?: string }>;
    }) => ({
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
  ```

- [ ] **Step 4: Run it and confirm it FAILS (module not found yet).**

  ```bash
  pnpm --filter web exec vitest run src/app/fonts.test.ts
  ```

  Expected: FAIL — `Error: Failed to load url ./fonts` / `Cannot find module './fonts'`, exit code 1.

- [ ] **Step 5: Write the failing layout render test.** Create `apps/web/src/app/layout.test.tsx`:

  ```tsx
  import type { ReactNode } from "react";
  import { describe, it, expect, vi } from "vitest";
  import { renderToStaticMarkup } from "react-dom/server";

  // Stub next/font so each family exposes a deterministic, greppable variable className.
  vi.mock("next/font/local", () => ({
    default: (opts: { variable?: string }) => ({
      className: `cls_${(opts.variable ?? "").replace(/-/g, "")}`,
      variable: `var_${(opts.variable ?? "").replace(/-/g, "")}`,
      style: {},
    }),
  }));

  // Isolate the layout from Task 3's client providers: passthrough that renders children.
  vi.mock("@wedevs/ui", () => ({
    ThemeProvider: ({ children }: { children: ReactNode }) => children,
    ToastProvider: ({ children }: { children: ReactNode }) => children,
  }));

  import RootLayout from "./layout";

  const html = renderToStaticMarkup(
    <RootLayout>
      <div id="child">hi</div>
    </RootLayout>,
  );

  describe("RootLayout font wiring", () => {
    it("applies all three next/font variable classNames to <html>", () => {
      expect(html).toContain("var_fontdisplay");
      expect(html).toContain("var_fontsans");
      expect(html).toContain("var_fontmono");
    });

    it("renders its children", () => {
      expect(html).toContain('id="child"');
    });

    it("emits NO external Google Fonts request", () => {
      expect(html).not.toContain("fonts.googleapis.com");
      expect(html).not.toContain("fonts.gstatic.com");
      expect(html).not.toMatch(/<link[^>]+fonts\.google/i);
    });
  });
  ```

- [ ] **Step 6: Run it and confirm it FAILS (layout not wired yet).**

  ```bash
  pnpm --filter web exec vitest run src/app/layout.test.tsx
  ```

  Expected: FAIL — the current `layout.tsx` sets no className on `<html>`, so `expect(html).toContain("var_fontdisplay")` fails, exit code 1.

- [ ] **Step 7: Download the 10 self-hosted `.woff2` files.** Run this PowerShell script from the repo root. It pulls the exact weights from the `google-webfonts-helper` API (returns latin `woff2`), then renames each to the canonical filename `fonts.ts` expects:

  ```powershell
  $ErrorActionPreference = "Stop"
  $dest = "apps/web/src/app/fonts"
  New-Item -ItemType Directory -Force $dest | Out-Null
  $tmp = Join-Path $env:TEMP "wedevs-fonts"
  if (Test-Path $tmp) { Remove-Item -Recurse -Force $tmp }
  New-Item -ItemType Directory -Force $tmp | Out-Null

  function Grab($id, [hashtable]$map) {
    $variants = ($map.Keys) -join ","
    $url = "https://gwfh.mranftl.com/api/fonts/$id?download=zip&subsets=latin&variants=$variants&formats=woff2"
    $zip = Join-Path $tmp "$id.zip"
    Invoke-WebRequest -Uri $url -OutFile $zip
    $out = Join-Path $tmp $id
    Expand-Archive -Path $zip -DestinationPath $out -Force
    foreach ($v in $map.Keys) {
      $file = Get-ChildItem -Path $out -Filter "*$v*" -File | Select-Object -First 1
      if (-not $file) { throw "no woff2 matched variant '$v' for $id" }
      Copy-Item $file.FullName (Join-Path $dest $map[$v]) -Force
    }
  }

  # gwfh uses "regular" for weight 400; numeric tokens otherwise.
  Grab "unbounded"      @{ "600"="unbounded-600.woff2"; "700"="unbounded-700.woff2"; "800"="unbounded-800.woff2" }
  Grab "manrope"        @{ "regular"="manrope-400.woff2"; "500"="manrope-500.woff2"; "600"="manrope-600.woff2"; "700"="manrope-700.woff2"; "800"="manrope-800.woff2" }
  Grab "jetbrains-mono" @{ "regular"="jetbrains-mono-400.woff2"; "500"="jetbrains-mono-500.woff2" }

  Get-ChildItem $dest | Select-Object Name, Length | Format-Table -AutoSize
  ```

  Expected: a table listing exactly the 10 files, each with `Length` > 0 (typ. 10 KB–60 KB).
  If `gwfh.mranftl.com` is unreachable, use the fallback in Step 7b instead; otherwise skip 7b.

- [ ] **Step 7b (fallback only — skip if Step 7 produced 10 files): fetch woff2 URLs from Google's CSS2 endpoint with a modern User-Agent, then download.** Google serves woff2 to modern browsers; a desktop-Chrome UA yields `.woff2` URLs. Example for one family (repeat per family/weight, saving to the canonical names from Step 7):

  ```powershell
  $ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36"
  $css = (Invoke-WebRequest -UserAgent $ua -Uri "https://fonts.googleapis.com/css2?family=Unbounded:wght@600;700;800&display=swap").Content
  # each @font-face block has `font-weight: <w>` and one `src: url(...woff2)`; pair them and
  # download to apps/web/src/app/fonts/unbounded-<w>.woff2. Do the same for Manrope (400;500;600;700;800)
  # and JetBrains Mono (400;500). Only keep the latin (first) unicode-range block per weight.
  ```

  Verify the same 10-file `Get-ChildItem apps/web/src/app/fonts` listing as Step 7 before continuing.

- [ ] **Step 8: Create `apps/web/src/app/fonts.ts`.** Weights, order, and paths MUST match the tests and the downloaded filenames exactly:

  ```ts
  import localFont from "next/font/local";

  export const fontDisplay = localFont({
    variable: "--font-display",
    display: "swap",
    preload: true,
    fallback: ["Manrope", "system-ui", "sans-serif"],
    src: [
      { path: "./fonts/unbounded-600.woff2", weight: "600", style: "normal" },
      { path: "./fonts/unbounded-700.woff2", weight: "700", style: "normal" },
      { path: "./fonts/unbounded-800.woff2", weight: "800", style: "normal" },
    ],
  });

  export const fontSans = localFont({
    variable: "--font-sans",
    display: "swap",
    preload: true,
    fallback: ["Segoe UI", "system-ui", "-apple-system", "sans-serif"],
    src: [
      { path: "./fonts/manrope-400.woff2", weight: "400", style: "normal" },
      { path: "./fonts/manrope-500.woff2", weight: "500", style: "normal" },
      { path: "./fonts/manrope-600.woff2", weight: "600", style: "normal" },
      { path: "./fonts/manrope-700.woff2", weight: "700", style: "normal" },
      { path: "./fonts/manrope-800.woff2", weight: "800", style: "normal" },
    ],
  });

  export const fontMono = localFont({
    variable: "--font-mono",
    display: "swap",
    preload: false,
    fallback: ["ui-monospace", "Consolas", "monospace"],
    src: [
      {
        path: "./fonts/jetbrains-mono-400.woff2",
        weight: "400",
        style: "normal",
      },
      {
        path: "./fonts/jetbrains-mono-500.woff2",
        weight: "500",
        style: "normal",
      },
    ],
  });
  ```

- [ ] **Step 9: Run the fonts unit test — expect PASS.**

  ```bash
  pnpm --filter web exec vitest run src/app/fonts.test.ts
  ```

  Expected: `Test Files 1 passed (1)`, `Tests 2 passed (2)`, exit code 0.

- [ ] **Step 10: Wire fonts + ThemeProvider into `apps/web/src/app/layout.tsx`.** Replace the whole file with:

  ```tsx
  import "./globals.css";
  import type { ReactNode } from "react";
  import { ThemeProvider } from "@wedevs/ui";
  import { fontDisplay, fontSans, fontMono } from "./fonts";

  export const metadata = {
    title: "Wedevs",
    description: "AI chat + code workspace",
  };

  export default function RootLayout({ children }: { children: ReactNode }) {
    return (
      <html
        lang="en"
        className={`${fontDisplay.variable} ${fontSans.variable} ${fontMono.variable}`}
        suppressHydrationWarning
      >
        <body>
          <ThemeProvider>{children}</ThemeProvider>
        </body>
      </html>
    );
  }
  ```

  Notes: `suppressHydrationWarning` is required because Task 3's `ThemeProvider` stamps `data-theme` on `<html>` (server/client mismatch on first paint). If Task 3 already added `ThemeProvider` here, this step is the reconciled final state — keep exactly this. `ToastProvider` is deliberately NOT wired here; it is added by its own integration task.

- [ ] **Step 11: Run the layout render test — expect PASS.**

  ```bash
  pnpm --filter web exec vitest run src/app/layout.test.tsx
  ```

  Expected: `Test Files 1 passed (1)`, `Tests 3 passed (3)`, exit code 0.

- [ ] **Step 12: Map the font tokens into Tailwind + base typography in `apps/web/src/app/globals.css`.** The current file is only `@import "tailwindcss";`. Set it to (keep Task 2's theme import line if Task 2 already added it; the `@import "@wedevs/config/theme.css";` must appear before the `@theme inline` block):

  ```css
  @import "tailwindcss";
  @import "@wedevs/config/theme.css";

  /* Font-family utilities → self-hosted next/font variables.
     `@theme inline` inlines these into the generated utilities and does NOT
     re-emit `--font-*` into :root, so `var(--font-sans)` here resolves to the
     html-scoped value set by next/font — no circular / colliding definition.
     This block comes AFTER theme.css, so it supersedes any placeholder font
     stacks Task 2 declared (later layer wins). */
  @theme inline {
    --font-display:
      var(--font-display), var(--font-sans), "Manrope", sans-serif;
    --font-sans:
      var(--font-sans), "Segoe UI", system-ui, -apple-system, sans-serif;
    --font-mono: var(--font-mono), ui-monospace, Consolas, monospace;
  }

  /* Base typography — ported from mockup lines 69 / 73 / 74. */
  body {
    font-family:
      var(--font-sans),
      "Segoe UI",
      system-ui,
      -apple-system,
      sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  .disp,
  .brand-name,
  .greet {
    font-family: var(--font-display), var(--font-sans), sans-serif;
    letter-spacing: -0.01em;
  }
  .mono {
    font-family: var(--font-mono), ui-monospace, Consolas, monospace;
    font-variant-numeric: tabular-nums;
  }
  ```

  (Do NOT add a `<link>` to any font CDN. Do NOT re-add `@import` for Google Fonts.)

- [ ] **Step 13: Mirror the mapping in the TS preset `packages/config/tailwind.preset.ts`.** Replace the whole file with:

  ```ts
  import type { Config } from "tailwindcss";

  // Phase 1: font-family utilities resolve to the self-hosted next/font CSS
  // variables set on <html> by apps/web/src/app/fonts.ts. Mirror of the CSS
  // `@theme inline` block in apps/web/src/app/globals.css.
  const preset = {
    theme: {
      extend: {
        fontFamily: {
          display: ["var(--font-display)", "var(--font-sans)", "sans-serif"],
          sans: [
            "var(--font-sans)",
            "Segoe UI",
            "system-ui",
            "-apple-system",
            "sans-serif",
          ],
          mono: ["var(--font-mono)", "ui-monospace", "Consolas", "monospace"],
        },
      },
    },
  } satisfies Partial<Config>;

  export default preset;
  ```

- [ ] **Step 14: Typecheck the web app — expect clean.**

  ```bash
  pnpm --filter web typecheck
  ```

  Expected: no output, exit code 0. (`tsc --noEmit` typechecks `fonts.ts`, both test files, and `layout.tsx`; the `as unknown as FontProbe` casts and stubbed provider types must be error-free.)

- [ ] **Step 15: Prove there is no external font request left in the app source.**

  ```bash
  grep -rniE "fonts\.googleapis|fonts\.gstatic|css2\?family" apps/web/src && echo "FOUND — FAIL" || echo "clean"
  ```

  Expected: `clean` (only the mockup under `mockup/` may still reference Google Fonts; `apps/web/src` must be clean).

- [ ] **Step 16: Run the full web test suite — expect all green.**

  ```bash
  pnpm --filter web test
  ```

  Expected: all test files pass (includes `fonts.test.ts`, `layout.test.tsx`, and any pre-existing web tests), exit code 0.

- [ ] **Step 17: Ensure the binary woff2 files are staged (they may be gitignored).**

  ```bash
  git check-ignore apps/web/src/app/fonts/manrope-400.woff2 && git add -f apps/web/src/app/fonts/*.woff2 || git add apps/web/src/app/fonts/*.woff2
  ```

  Then confirm all 10 are staged:

  ```bash
  git status --porcelain apps/web/src/app/fonts | grep -c ".woff2"
  ```

  Expected: `10`.

- [ ] **Step 18: Commit the implementation.**
  ```bash
  git add apps/web/src/app/fonts.ts apps/web/src/app/fonts.test.ts \
          apps/web/src/app/layout.tsx apps/web/src/app/layout.test.tsx \
          apps/web/src/app/globals.css packages/config/tailwind.preset.ts \
          apps/web/src/app/fonts/
  git commit -m "feat(web): self-host Unbounded/Manrope/JetBrains Mono via next/font/local"
  ```

---

**Definition of done:**

- `apps/web/src/app/fonts.ts` exports `fontDisplay` / `fontSans` / `fontMono` with variables `--font-display` / `--font-sans` / `--font-mono` and the exact weights 600/700/800, 400/500/600/700/800, 400/500 respectively; 10 committed `.woff2` files back them.
- `layout.tsx` applies all three `.variable` classNames to `<html>` and wraps children in Task 3's `ThemeProvider`; `layout.test.tsx` confirms the classNames are present and no `fonts.googleapis`/`fonts.gstatic` string is emitted.
- `globals.css` maps the font tokens via `@theme inline` and sets Manrope=body, Unbounded=`.disp/.brand-name/.greet`, JetBrains Mono=`.mono`, exactly per mockup 69/73/74; `tailwind.preset.ts` mirrors the mapping.
- `pnpm --filter web test` and `pnpm --filter web typecheck` both pass; `grep` over `apps/web/src` finds no external font request (mockup line 9's Google Fonts link is fully replaced).
- No `--accent`/Volt anywhere in this task (typography is neutral; fonts are not an "alive" surface).

---

### Task 5: Install shadcn/ui primitives and re-skin to tokens (Radix a11y intact)

Install nine shadcn/ui primitives into `packages/ui`, then re-skin every one to the Wedevs design tokens while keeping Radix accessibility behavior fully intact. The brand rule **"Neutral = interactive · Volt = alive"** binds this task: the only elements permitted to paint with `--accent` here are (a) the keyboard **focus ring** on every interactive primitive and (b) the **Switch on-state fill** (allowed "on-toggle" liveness). Everything else — primary Button, hover, active/selected, menu items — is neutral (`--primary`/`--hover`/`--active`). The primary Button uses `--primary`/`--primary-text` and there is **no accent Button variant**.

This task **consumes** the `cn()` helper (Task 1), the design tokens in `packages/config/theme.css` (Task 2), and `tw-animate-css` (already imported in `apps/web/src/app/globals.css`, Task 3). It **produces** the re-skinned, token-styled, named-exported primitives that Tasks 6+ compose into shell components.

---

**Files:**

Create:

- `packages/ui/components.json` — shadcn v4 CSS-vars config
- `packages/ui/src/primitives/button.tsx`
- `packages/ui/src/primitives/input.tsx`
- `packages/ui/src/primitives/dialog.tsx`
- `packages/ui/src/primitives/dropdown-menu.tsx`
- `packages/ui/src/primitives/popover.tsx`
- `packages/ui/src/primitives/tabs.tsx`
- `packages/ui/src/primitives/switch.tsx`
- `packages/ui/src/primitives/tooltip.tsx`
- `packages/ui/src/primitives/command.tsx`
- `packages/ui/src/primitives/button.test.tsx`
- `packages/ui/src/primitives/dialog.test.tsx`
- `packages/ui/src/primitives/dropdown-menu.test.tsx`
- `packages/ui/src/primitives/switch.test.tsx`
- `packages/ui/src/primitives/tooltip.test.tsx`

Modify:

- `packages/ui/package.json` — add Radix / cva / cmdk deps if not already present
- `packages/ui/src/index.ts` — re-export every primitive

**Interfaces:**

_Consumes_ (from the shared contract — do NOT redefine):

```ts
// packages/ui/src/lib/cn.ts  (Task 1)
export function cn(...inputs: ClassValue[]): string; // clsx() piped through twMerge()
```

Tokens consumed from `packages/config/theme.css` (Task 2) via CSS custom properties in arbitrary-value Tailwind utilities: `--primary --primary-text --accent --accent-soft --accent-line --error --bg --surface --surface-2 --elevated --border --border-2 --hover --active --text --text-2 --text-3 --radius --radius-sm --radius-xs --shadow --shadow-sm`.

_Produces_ (canonical types — copy verbatim, do NOT rename):

```ts
export type ButtonVariant = "primary" | "ghost" | "outline" | "danger" | "icon";
// primary = --primary/--primary-text (NEUTRAL, never volt). No "accent" variant exists.
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  asChild?: boolean;
}
// Input, Dialog, DropdownMenu, Popover, Tabs, Switch, Tooltip, Command keep Radix prop shapes.
// Switch on-state fill = --accent (allowed "on-toggle" liveness).
```

**Token → utility convention used throughout this task:** because Task 2's `@theme` mapping is not assumed here, every token is referenced through an explicit CSS-var arbitrary-value utility, e.g. `bg-[var(--primary)]`, `text-[var(--text-2)]`, `rounded-[var(--radius-sm)]`, `border-[var(--border)]`. This is robust regardless of how `@theme` names its color utilities. Focus rings use `focus-visible:ring-2 focus-visible:ring-[var(--accent-line)]` (accent is allowed on keyboard focus rings per the brand rule).

**Mockup source of truth** (`d:/Rajin/Wedevs.cloud/mockup/index.html`): icon-button `.ibtn` 192–195; sidebar `.btn` / `.btn-new` 121–127; `.btn-code` variants 600–604; `.kbd` 99; `.toggle` (switch) 379–383; popover shell + `@keyframes pop` 430–434 + selector search 675–678; generic `.menu` / `.menu-item` / `.menu-item.danger` / `.menu-sep` 455–464; inspector tabs `.itab` 396–399; command palette `.palette` … `.pal-item` 506–521; overlay/`@keyframes fade`/`rise` 467–473. Token values: dark `--primary:#21262a` / `--primary-text:#fdfdfb`, `--accent:#9efb25` (dark; light `#5A9310` per brand memory), `--error` from state tokens. Do NOT hardcode these hex values — consume the tokens.

---

- [ ] **Step 1: Ensure primitive dependencies are declared in `packages/ui/package.json`.**
      Open `packages/ui/package.json`. Under `"dependencies"` make sure these exact entries exist (add any missing; keep `workspace:*` for internal deps). Then run the install.

  ```jsonc
  "dependencies": {
    "@radix-ui/react-slot": "^1.1.1",
    "@radix-ui/react-dialog": "^1.1.4",
    "@radix-ui/react-dropdown-menu": "^2.1.4",
    "@radix-ui/react-popover": "^1.1.4",
    "@radix-ui/react-tabs": "^1.1.2",
    "@radix-ui/react-switch": "^1.1.2",
    "@radix-ui/react-tooltip": "^1.1.6",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.6.0",
    "cmdk": "^1.0.4",
    "lucide-react": "^0.469.0"
  }
  ```

  Run:

  ```bash
  pnpm install
  ```

  Expected: install completes with `Done` and no `ERR_PNPM` errors. (`tw-animate-css` was added to `apps/web` in Task 3; the animation utility classes it provides — `animate-in`, `animate-out`, `fade-in-0`, `zoom-in-95`, `slide-in-from-*` — are what the primitives below use.)

- [ ] **Step 2: Write `packages/ui/components.json` (shadcn v4, CSS-vars).**
      This records the shadcn config so future `npx shadcn add` calls resolve to our paths. Create the file exactly:

  ```json
  {
    "$schema": "https://ui.shadcn.com/schema.json",
    "style": "new-york",
    "rsc": false,
    "tsx": true,
    "tailwind": {
      "config": "",
      "css": "../../apps/web/src/app/globals.css",
      "baseColor": "neutral",
      "cssVariables": true,
      "prefix": ""
    },
    "iconLibrary": "lucide",
    "aliases": {
      "components": "@wedevs/ui/components",
      "utils": "@wedevs/ui/lib/cn",
      "ui": "@wedevs/ui/primitives",
      "lib": "@wedevs/ui/lib",
      "hooks": "@wedevs/ui/hooks"
    }
  }
  ```

  Commit:

  ```bash
  git add packages/ui/components.json packages/ui/package.json
  git commit -m "chore(ui): add shadcn CSS-vars config and primitive deps"
  ```

  Expected: one commit created.

- [ ] **Step 3: Write the failing test `packages/ui/src/primitives/button.test.tsx`.**
      Asserts: primary Button carries the neutral `--primary` fill and NO accent background fill (the "no accent variant" rule); danger uses `--error`; icon variant is the 34px square; every Button is keyboard-focusable with an accent focus-visible ring; `asChild` renders a link.

  ```tsx
  import { describe, it, expect } from "vitest";
  import { render, screen } from "@testing-library/react";
  import { Button } from "./button";

  describe("Button", () => {
    it("primary is neutral: uses --primary fill, no accent background", () => {
      render(<Button>Save</Button>); // primary is the default variant
      const btn = screen.getByRole("button", { name: "Save" });
      const cls = btn.className;
      expect(cls).toContain("bg-[var(--primary)]");
      expect(cls).toContain("text-[var(--primary-text)]");
      // Volt is forbidden as a Button fill — only the focus ring may be accent.
      expect(cls).not.toContain("bg-[var(--accent)]");
      expect(cls).not.toContain("accent-soft");
    });

    it("carries a keyboard focus-visible ring using the accent-line token", () => {
      render(<Button>Go</Button>);
      const cls = screen.getByRole("button", { name: "Go" }).className;
      expect(cls).toContain("focus-visible:ring-2");
      expect(cls).toContain("focus-visible:ring-[var(--accent-line)]");
    });

    it("danger variant uses the --error token", () => {
      render(<Button variant="danger">Delete</Button>);
      const cls = screen.getByRole("button", { name: "Delete" }).className;
      expect(cls).toContain("text-[var(--error)]");
      expect(cls).not.toContain("bg-[var(--primary)]");
    });

    it("icon variant is a 34px square", () => {
      render(<Button variant="icon" aria-label="menu" />);
      const cls = screen.getByRole("button", { name: "menu" }).className;
      expect(cls).toContain("h-[34px]");
      expect(cls).toContain("w-[34px]");
    });

    it("asChild renders the child element (a link), not a button", () => {
      render(
        <Button asChild>
          <a href="/x">Link</a>
        </Button>,
      );
      const link = screen.getByRole("link", { name: "Link" });
      expect(link.tagName).toBe("A");
      expect(link.className).toContain("bg-[var(--primary)]");
    });
  });
  ```

  Run:

  ```bash
  pnpm --filter @wedevs/ui test -- src/primitives/button.test.tsx
  ```

  Expected: FAIL — `Failed to resolve import "./button"` (file does not exist yet).

- [ ] **Step 4: Implement `packages/ui/src/primitives/button.tsx`.**
      cva-driven variants; the `variant` prop is typed as the canonical `ButtonVariant`. Port the fills from mockup `.btn-new` (121–127, primary), `.btn-code.ghost` (603–604, outline), `.ibtn` (192–195, icon), `.menu-item.danger` (463, danger).

  ```tsx
  import * as React from "react";
  import { Slot } from "@radix-ui/react-slot";
  import { cva } from "class-variance-authority";
  import { cn } from "../lib/cn";

  export type ButtonVariant =
    "primary" | "ghost" | "outline" | "danger" | "icon";

  export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    asChild?: boolean;
  }

  const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold " +
      "transition-colors outline-none " +
      "focus-visible:ring-2 focus-visible:ring-[var(--accent-line)] focus-visible:ring-offset-1 " +
      "focus-visible:ring-offset-[var(--bg)] " +
      "disabled:pointer-events-none disabled:opacity-50",
    {
      variants: {
        variant: {
          primary:
            "rounded-[var(--radius-sm)] px-3.5 py-2 bg-[var(--primary)] text-[var(--primary-text)] hover:brightness-110",
          ghost:
            "rounded-[var(--radius-sm)] px-3.5 py-2 text-[var(--text-2)] hover:bg-[var(--hover)] hover:text-[var(--text)]",
          outline:
            "rounded-[var(--radius-sm)] px-3.5 py-2 border border-[var(--border)] text-[var(--text-2)] " +
            "hover:bg-[var(--hover)] hover:text-[var(--text)] hover:border-[var(--border-2)]",
          danger:
            "rounded-[var(--radius-sm)] px-3.5 py-2 text-[var(--error)] hover:bg-[var(--hover)]",
          icon:
            "h-[34px] w-[34px] rounded-[var(--radius-xs)] text-[var(--text-2)] " +
            "hover:bg-[var(--hover)] hover:text-[var(--text)]",
        },
      },
      defaultVariants: { variant: "primary" },
    },
  );

  export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "primary", asChild = false, ...props }, ref) => {
      const Comp = asChild ? Slot : "button";
      return (
        <Comp
          ref={ref}
          className={cn(buttonVariants({ variant }), className)}
          {...props}
        />
      );
    },
  );
  Button.displayName = "Button";
  ```

  Run:

  ```bash
  pnpm --filter @wedevs/ui test -- src/primitives/button.test.tsx
  ```

  Expected: PASS — `Test Files 1 passed`, `Tests 5 passed`.

- [ ] **Step 5: Implement `packages/ui/src/primitives/input.tsx` (no separate test — covered by consuming components).**
      Plain token-skinned input with the accent focus ring. Port the neutral field look from mockup `.cfg-input` (669–670) / `.pop-search input` (675–678).

  ```tsx
  import * as React from "react";
  import { cn } from "../lib/cn";

  export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

  export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type = "text", ...props }, ref) => (
      <input
        ref={ref}
        type={type}
        className={cn(
          "flex h-9 w-full rounded-[var(--radius-xs)] border border-[var(--border)] " +
            "bg-[var(--surface)] px-3 py-1 text-sm text-[var(--text)] " +
            "placeholder:text-[var(--text-3)] outline-none transition-colors " +
            "focus-visible:border-[var(--accent-line)] focus-visible:ring-2 focus-visible:ring-[var(--accent-line)] " +
            "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
    ),
  );
  Input.displayName = "Input";
  ```

- [ ] **Step 6: Write the failing test `packages/ui/src/primitives/dialog.test.tsx`.**
      Asserts Radix a11y is intact: opens on trigger, exposes `role="dialog"`, traps focus, closes on Escape.

  ```tsx
  import { describe, it, expect } from "vitest";
  import { render, screen } from "@testing-library/react";
  import userEvent from "@testing-library/user-event";
  import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogTitle,
    DialogDescription,
  } from "./dialog";

  function Harness() {
    return (
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Adjust things</DialogDescription>
          <button>Inside</button>
        </DialogContent>
      </Dialog>
    );
  }

  describe("Dialog", () => {
    it("opens on trigger click and exposes role=dialog with an accessible name", async () => {
      const user = userEvent.setup();
      render(<Harness />);
      expect(screen.queryByRole("dialog")).toBeNull();
      await user.click(screen.getByRole("button", { name: "Open" }));
      const dlg = await screen.findByRole("dialog");
      expect(dlg).toHaveAccessibleName("Settings");
    });

    it("closes when Escape is pressed", async () => {
      const user = userEvent.setup();
      render(<Harness />);
      await user.click(screen.getByRole("button", { name: "Open" }));
      await screen.findByRole("dialog");
      await user.keyboard("{Escape}");
      expect(screen.queryByRole("dialog")).toBeNull();
    });
  });
  ```

  Run:

  ```bash
  pnpm --filter @wedevs/ui test -- src/primitives/dialog.test.tsx
  ```

  Expected: FAIL — `Failed to resolve import "./dialog"`.

- [ ] **Step 7: Implement `packages/ui/src/primitives/dialog.tsx`.**
      Radix Dialog wrappers; Overlay + Content animate via tw-animate-css state utilities (`data-[state=open]:animate-in` …). Port surface/overlay look from mockup `.overlay` (467–469) and `.modal` (471–473).

  ```tsx
  import * as React from "react";
  import * as DialogPrimitive from "@radix-ui/react-dialog";
  import { X } from "lucide-react";
  import { cn } from "../lib/cn";

  export const Dialog = DialogPrimitive.Root;
  export const DialogTrigger = DialogPrimitive.Trigger;
  export const DialogPortal = DialogPrimitive.Portal;
  export const DialogClose = DialogPrimitive.Close;

  export const DialogOverlay = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Overlay>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
  >(({ className, ...props }, ref) => (
    <DialogPrimitive.Overlay
      ref={ref}
      className={cn(
        "fixed inset-0 z-80 bg-black/50 backdrop-blur-[3px] " +
          "data-[state=open]:animate-in data-[state=closed]:animate-out " +
          "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
        className,
      )}
      {...props}
    />
  ));
  DialogOverlay.displayName = "DialogOverlay";

  export const DialogContent = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
  >(({ className, children, ...props }, ref) => (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "fixed left-1/2 top-1/2 z-80 -translate-x-1/2 -translate-y-1/2 " +
            "w-[min(880px,calc(100vw-48px))] max-h-[92vh] overflow-hidden " +
            "rounded-[18px] border border-[var(--border-2)] bg-[var(--surface)] shadow-[var(--shadow)] " +
            "outline-none data-[state=open]:animate-in data-[state=closed]:animate-out " +
            "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 " +
            "data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95",
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close
          className={cn(
            "absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-[var(--radius-xs)] " +
              "text-[var(--text-3)] outline-none transition-colors hover:bg-[var(--hover)] hover:text-[var(--text)] " +
              "focus-visible:ring-2 focus-visible:ring-[var(--accent-line)]",
          )}
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  ));
  DialogContent.displayName = "DialogContent";

  export const DialogTitle = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Title>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
  >(({ className, ...props }, ref) => (
    <DialogPrimitive.Title
      ref={ref}
      className={cn("text-[15px] font-bold text-[var(--text)]", className)}
      {...props}
    />
  ));
  DialogTitle.displayName = "DialogTitle";

  export const DialogDescription = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Description>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
  >(({ className, ...props }, ref) => (
    <DialogPrimitive.Description
      ref={ref}
      className={cn("text-[12.5px] text-[var(--text-3)]", className)}
      {...props}
    />
  ));
  DialogDescription.displayName = "DialogDescription";
  ```

  Run:

  ```bash
  pnpm --filter @wedevs/ui test -- src/primitives/dialog.test.tsx
  ```

  Expected: PASS — `Tests 2 passed`. (If `z-80` is rejected by your Tailwind version, use `z-[80]`; both compile as an arbitrary z-index — prefer `z-[80]` to be safe.)

- [ ] **Step 8: Write the failing test `packages/ui/src/primitives/switch.test.tsx`.**
      Asserts Switch toggles via keyboard, exposes `role="switch"` with `aria-checked`, and the on-state fill uses the `--accent` token (the sanctioned "alive" exception).

  ```tsx
  import { describe, it, expect } from "vitest";
  import { render, screen } from "@testing-library/react";
  import userEvent from "@testing-library/user-event";
  import { Switch } from "./switch";

  describe("Switch", () => {
    it("exposes role=switch and toggles aria-checked on keyboard Space", async () => {
      const user = userEvent.setup();
      render(<Switch aria-label="tools" />);
      const sw = screen.getByRole("switch", { name: "tools" });
      expect(sw).toHaveAttribute("aria-checked", "false");
      sw.focus();
      await user.keyboard(" ");
      expect(sw).toHaveAttribute("aria-checked", "true");
    });

    it("uses the --accent token for the checked (on) fill", () => {
      render(<Switch aria-label="tools" />);
      const cls = screen.getByRole("switch", { name: "tools" }).className;
      expect(cls).toContain("data-[state=checked]:bg-[var(--accent)]");
      // off-state fill is the neutral border token
      expect(cls).toContain("bg-[var(--border-2)]");
    });

    it("has a keyboard focus-visible ring", () => {
      render(<Switch aria-label="tools" />);
      const cls = screen.getByRole("switch", { name: "tools" }).className;
      expect(cls).toContain("focus-visible:ring-[var(--accent-line)]");
    });
  });
  ```

  Run:

  ```bash
  pnpm --filter @wedevs/ui test -- src/primitives/switch.test.tsx
  ```

  Expected: FAIL — `Failed to resolve import "./switch"`.

- [ ] **Step 9: Implement `packages/ui/src/primitives/switch.tsx`.**
      Radix Switch; geometry and on-state ported verbatim from mockup `.toggle` 379–383 (38×22 track, 18px white knob, checked → `translateX(16px)` from `left:2px`, so thumb moves from `translate-x-[2px]` to `translate-x-[18px]`). On-fill = `--accent` (allowed).

  ```tsx
  import * as React from "react";
  import * as SwitchPrimitive from "@radix-ui/react-switch";
  import { cn } from "../lib/cn";

  export const Switch = React.forwardRef<
    React.ElementRef<typeof SwitchPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
  >(({ className, ...props }, ref) => (
    <SwitchPrimitive.Root
      ref={ref}
      className={cn(
        "peer inline-flex h-[22px] w-[38px] shrink-0 items-center rounded-full " +
          "bg-[var(--border-2)] transition-colors outline-none " +
          "focus-visible:ring-2 focus-visible:ring-[var(--accent-line)] focus-visible:ring-offset-1 " +
          "focus-visible:ring-offset-[var(--bg)] " +
          "data-[state=checked]:bg-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "pointer-events-none block h-[18px] w-[18px] rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,.3)] " +
            "translate-x-[2px] transition-transform data-[state=checked]:translate-x-[18px]",
        )}
      />
    </SwitchPrimitive.Root>
  ));
  Switch.displayName = "Switch";
  ```

  Run:

  ```bash
  pnpm --filter @wedevs/ui test -- src/primitives/switch.test.tsx
  ```

  Expected: PASS — `Tests 3 passed`.

- [ ] **Step 10: Write the failing test `packages/ui/src/primitives/dropdown-menu.test.tsx`.**
      Asserts the menu opens with `role="menu"`, items are keyboard-navigable, and the `danger` item uses `--error`.

  ```tsx
  import { describe, it, expect } from "vitest";
  import { render, screen } from "@testing-library/react";
  import userEvent from "@testing-library/user-event";
  import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
  } from "./dropdown-menu";

  function Harness() {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger>More</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Rename</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="danger">Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  describe("DropdownMenu", () => {
    it("opens on trigger and exposes role=menu with menuitems", async () => {
      const user = userEvent.setup();
      render(<Harness />);
      await user.click(screen.getByRole("button", { name: "More" }));
      expect(await screen.findByRole("menu")).toBeInTheDocument();
      expect(screen.getAllByRole("menuitem")).toHaveLength(2);
    });

    it("danger item uses the --error token", async () => {
      const user = userEvent.setup();
      render(<Harness />);
      await user.click(screen.getByRole("button", { name: "More" }));
      const del = await screen.findByRole("menuitem", { name: "Delete" });
      expect(del.className).toContain("text-[var(--error)]");
    });
  });
  ```

  Run:

  ```bash
  pnpm --filter @wedevs/ui test -- src/primitives/dropdown-menu.test.tsx
  ```

  Expected: FAIL — `Failed to resolve import "./dropdown-menu"`.

- [ ] **Step 11: Implement `packages/ui/src/primitives/dropdown-menu.tsx`.**
      Radix DropdownMenu. Content ports mockup `.menu` (456–457: `--elevated`, `border-2`, radius 12, `--shadow`, padding 6, min-width 210) with `pop`-style entrance via tw-animate-css. `DropdownMenuItem` adds a `variant?: "default" | "danger"` prop (danger → `--error`, mockup line 463); default item ports `.menu-item` 459–462. Separator ports `.menu-sep` 464.

  ```tsx
  import * as React from "react";
  import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
  import { cn } from "../lib/cn";

  export const DropdownMenu = DropdownMenuPrimitive.Root;
  export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
  export const DropdownMenuGroup = DropdownMenuPrimitive.Group;
  export const DropdownMenuPortal = DropdownMenuPrimitive.Portal;

  export const DropdownMenuContent = React.forwardRef<
    React.ElementRef<typeof DropdownMenuPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
  >(({ className, sideOffset = 6, ...props }, ref) => (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
          "z-[70] min-w-[210px] rounded-[12px] border border-[var(--border-2)] bg-[var(--elevated)] " +
            "p-1.5 shadow-[var(--shadow)] outline-none " +
            "data-[state=open]:animate-in data-[state=closed]:animate-out " +
            "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95",
          className,
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  ));
  DropdownMenuContent.displayName = "DropdownMenuContent";

  export interface DropdownMenuItemProps extends React.ComponentPropsWithoutRef<
    typeof DropdownMenuPrimitive.Item
  > {
    variant?: "default" | "danger";
  }

  export const DropdownMenuItem = React.forwardRef<
    React.ElementRef<typeof DropdownMenuPrimitive.Item>,
    DropdownMenuItemProps
  >(({ className, variant = "default", ...props }, ref) => (
    <DropdownMenuPrimitive.Item
      ref={ref}
      className={cn(
        "flex w-full cursor-pointer select-none items-center gap-2.5 rounded-[8px] px-2.5 py-2 " +
          "text-[13px] font-medium outline-none transition-colors " +
          "focus:bg-[var(--hover)] data-[highlighted]:bg-[var(--hover)] " +
          (variant === "danger"
            ? "text-[var(--error)]"
            : "text-[var(--text-2)] focus:text-[var(--text)] data-[highlighted]:text-[var(--text)]"),
        className,
      )}
      {...props}
    />
  ));
  DropdownMenuItem.displayName = "DropdownMenuItem";

  export const DropdownMenuSeparator = React.forwardRef<
    React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
  >(({ className, ...props }, ref) => (
    <DropdownMenuPrimitive.Separator
      ref={ref}
      className={cn("mx-1 my-1.5 h-px bg-[var(--border)]", className)}
      {...props}
    />
  ));
  DropdownMenuSeparator.displayName = "DropdownMenuSeparator";
  ```

  Run:

  ```bash
  pnpm --filter @wedevs/ui test -- src/primitives/dropdown-menu.test.tsx
  ```

  Expected: PASS — `Tests 2 passed`.

- [ ] **Step 12: Implement `packages/ui/src/primitives/popover.tsx` (no separate test — same Radix family as Dialog/DropdownMenu, covered there).**
      Radix Popover. Content ports mockup `.popover` shell (430–432: `--elevated`, `border-2`, `--radius`, `--shadow`) and the `@keyframes pop` entrance (433–434) via tw-animate-css.

  ```tsx
  import * as React from "react";
  import * as PopoverPrimitive from "@radix-ui/react-popover";
  import { cn } from "../lib/cn";

  export const Popover = PopoverPrimitive.Root;
  export const PopoverTrigger = PopoverPrimitive.Trigger;
  export const PopoverAnchor = PopoverPrimitive.Anchor;

  export const PopoverContent = React.forwardRef<
    React.ElementRef<typeof PopoverPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
  >(({ className, align = "start", sideOffset = 6, ...props }, ref) => (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-[70] w-[360px] overflow-hidden rounded-[var(--radius)] border border-[var(--border-2)] " +
            "bg-[var(--elevated)] shadow-[var(--shadow)] outline-none " +
            "data-[state=open]:animate-in data-[state=closed]:animate-out " +
            "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95",
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  ));
  PopoverContent.displayName = "PopoverContent";
  ```

- [ ] **Step 13: Implement `packages/ui/src/primitives/tabs.tsx` (no separate test — Radix roving-tabindex a11y is upstream-tested; visual assertions live in the Inspector test, Task 8).**
      Radix Tabs. Trigger active state ports mockup `.itab` / `.itab.active` (397–399: inactive `--text-3`, active `--active` bg + `--text`, radius 8).

  ```tsx
  import * as React from "react";
  import * as TabsPrimitive from "@radix-ui/react-tabs";
  import { cn } from "../lib/cn";

  export const Tabs = TabsPrimitive.Root;

  export const TabsList = React.forwardRef<
    React.ElementRef<typeof TabsPrimitive.List>,
    React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
  >(({ className, ...props }, ref) => (
    <TabsPrimitive.List
      ref={ref}
      className={cn("flex items-center gap-0.5", className)}
      {...props}
    />
  ));
  TabsList.displayName = "TabsList";

  export const TabsTrigger = React.forwardRef<
    React.ElementRef<typeof TabsPrimitive.Trigger>,
    React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
  >(({ className, ...props }, ref) => (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        "rounded-[8px] px-[11px] py-1.5 text-[12.5px] font-semibold outline-none transition-colors " +
          "text-[var(--text-3)] hover:bg-[var(--hover)] hover:text-[var(--text-2)] " +
          "focus-visible:ring-2 focus-visible:ring-[var(--accent-line)] " +
          "data-[state=active]:bg-[var(--active)] data-[state=active]:text-[var(--text)]",
        className,
      )}
      {...props}
    />
  ));
  TabsTrigger.displayName = "TabsTrigger";

  export const TabsContent = React.forwardRef<
    React.ElementRef<typeof TabsPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
  >(({ className, ...props }, ref) => (
    <TabsPrimitive.Content
      ref={ref}
      className={cn("outline-none", className)}
      {...props}
    />
  ));
  TabsContent.displayName = "TabsContent";
  ```

- [ ] **Step 14: Write the failing test `packages/ui/src/primitives/tooltip.test.tsx`.**
      Asserts the tooltip exposes `role="tooltip"` on hover and the trigger is keyboard-focusable.

  ```tsx
  import { describe, it, expect } from "vitest";
  import { render, screen } from "@testing-library/react";
  import userEvent from "@testing-library/user-event";
  import {
    TooltipProvider,
    Tooltip,
    TooltipTrigger,
    TooltipContent,
  } from "./tooltip";

  function Harness() {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger>Info</TooltipTrigger>
          <TooltipContent>Helpful text</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  describe("Tooltip", () => {
    it("shows content with role=tooltip on hover", async () => {
      const user = userEvent.setup();
      render(<Harness />);
      await user.hover(screen.getByRole("button", { name: "Info" }));
      const tips = await screen.findAllByRole("tooltip");
      expect(tips[0]).toHaveTextContent("Helpful text");
    });
  });
  ```

  Run:

  ```bash
  pnpm --filter @wedevs/ui test -- src/primitives/tooltip.test.tsx
  ```

  Expected: FAIL — `Failed to resolve import "./tooltip"`.

- [ ] **Step 15: Implement `packages/ui/src/primitives/tooltip.tsx`.**
      Radix Tooltip. Content styled small and neutral on `--elevated`.

  ```tsx
  import * as React from "react";
  import * as TooltipPrimitive from "@radix-ui/react-tooltip";
  import { cn } from "../lib/cn";

  export const TooltipProvider = TooltipPrimitive.Provider;
  export const Tooltip = TooltipPrimitive.Root;
  export const TooltipTrigger = TooltipPrimitive.Trigger;

  export const TooltipContent = React.forwardRef<
    React.ElementRef<typeof TooltipPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
  >(({ className, sideOffset = 6, ...props }, ref) => (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
          "z-[70] rounded-[var(--radius-xs)] border border-[var(--border-2)] bg-[var(--elevated)] " +
            "px-2.5 py-1.5 text-xs font-medium text-[var(--text)] shadow-[var(--shadow)] " +
            "data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95",
          className,
        )}
        {...props}
      />
    </TooltipPrimitive.Portal>
  ));
  TooltipContent.displayName = "TooltipContent";
  ```

  Run:

  ```bash
  pnpm --filter @wedevs/ui test -- src/primitives/tooltip.test.tsx
  ```

  Expected: PASS — `Tests 1 passed`.

- [ ] **Step 16: Implement `packages/ui/src/primitives/command.tsx` (no separate test — exercised in full by the CommandPalette test, Task 10).**
      cmdk-based command menu. Styling ports mockup command palette 506–521: input row `.pal-in` (512–515), list `.pal-list` (516), section label `.pal-sec` (517), item `.pal-item` (518–521, hover/active `--hover`), and a right-aligned `.kbd`.

  ```tsx
  import * as React from "react";
  import { Command as CommandPrimitive } from "cmdk";
  import { Search } from "lucide-react";
  import { cn } from "../lib/cn";

  export const Command = React.forwardRef<
    React.ElementRef<typeof CommandPrimitive>,
    React.ComponentPropsWithoutRef<typeof CommandPrimitive>
  >(({ className, ...props }, ref) => (
    <CommandPrimitive
      ref={ref}
      className={cn(
        "flex h-full w-full flex-col overflow-hidden rounded-[16px] bg-[var(--elevated)] text-[var(--text)]",
        className,
      )}
      {...props}
    />
  ));
  Command.displayName = "Command";

  export const CommandInput = React.forwardRef<
    React.ElementRef<typeof CommandPrimitive.Input>,
    React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
  >(({ className, ...props }, ref) => (
    <div className="flex items-center gap-[11px] border-b border-[var(--border)] px-[17px] py-[15px]">
      <Search className="h-4 w-4 shrink-0 text-[var(--text-3)]" />
      <CommandPrimitive.Input
        ref={ref}
        className={cn(
          "flex-1 bg-transparent text-base outline-none placeholder:text-[var(--text-3)] disabled:opacity-50",
          className,
        )}
        {...props}
      />
    </div>
  ));
  CommandInput.displayName = "CommandInput";

  export const CommandList = React.forwardRef<
    React.ElementRef<typeof CommandPrimitive.List>,
    React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
  >(({ className, ...props }, ref) => (
    <CommandPrimitive.List
      ref={ref}
      className={cn("max-h-[340px] overflow-y-auto p-2", className)}
      {...props}
    />
  ));
  CommandList.displayName = "CommandList";

  export const CommandEmpty = React.forwardRef<
    React.ElementRef<typeof CommandPrimitive.Empty>,
    React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
  >((props, ref) => (
    <CommandPrimitive.Empty
      ref={ref}
      className="py-6 text-center text-sm text-[var(--text-3)]"
      {...props}
    />
  ));
  CommandEmpty.displayName = "CommandEmpty";

  export const CommandGroup = React.forwardRef<
    React.ElementRef<typeof CommandPrimitive.Group>,
    React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
  >(({ className, ...props }, ref) => (
    <CommandPrimitive.Group
      ref={ref}
      className={cn(
        "[&_[cmdk-group-heading]]:px-[11px] [&_[cmdk-group-heading]]:pb-[5px] [&_[cmdk-group-heading]]:pt-[9px] " +
          "[&_[cmdk-group-heading]]:text-[10.5px] [&_[cmdk-group-heading]]:font-bold " +
          "[&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.07em] " +
          "[&_[cmdk-group-heading]]:text-[var(--text-3)]",
        className,
      )}
      {...props}
    />
  ));
  CommandGroup.displayName = "CommandGroup";

  export const CommandSeparator = React.forwardRef<
    React.ElementRef<typeof CommandPrimitive.Separator>,
    React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>
  >(({ className, ...props }, ref) => (
    <CommandPrimitive.Separator
      ref={ref}
      className={cn("mx-1 my-1 h-px bg-[var(--border)]", className)}
      {...props}
    />
  ));
  CommandSeparator.displayName = "CommandSeparator";

  export const CommandItem = React.forwardRef<
    React.ElementRef<typeof CommandPrimitive.Item>,
    React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
  >(({ className, ...props }, ref) => (
    <CommandPrimitive.Item
      ref={ref}
      className={cn(
        "flex cursor-pointer select-none items-center gap-[11px] rounded-[9px] px-[11px] py-2.5 " +
          "text-[13.5px] text-[var(--text-2)] outline-none " +
          "data-[selected=true]:bg-[var(--hover)] data-[selected=true]:text-[var(--text)]",
        className,
      )}
      {...props}
    />
  ));
  CommandItem.displayName = "CommandItem";

  export function CommandShortcut({
    className,
    ...props
  }: React.HTMLAttributes<HTMLSpanElement>) {
    return (
      <span
        className={cn(
          "ml-auto font-mono text-[11px] text-[var(--text-3)]",
          className,
        )}
        {...props}
      />
    );
  }
  ```

- [ ] **Step 17: Re-export every primitive from `packages/ui/src/index.ts`.**
      Append these barrel re-exports (keep existing exports above them):

  ```ts
  // primitives
  export * from "./primitives/button";
  export * from "./primitives/input";
  export * from "./primitives/dialog";
  export * from "./primitives/dropdown-menu";
  export * from "./primitives/popover";
  export * from "./primitives/tabs";
  export * from "./primitives/switch";
  export * from "./primitives/tooltip";
  export * from "./primitives/command";
  ```

- [ ] **Step 18: Run the full primitives test suite and the type check.**

  ```bash
  pnpm --filter @wedevs/ui test -- src/primitives
  pnpm --filter @wedevs/ui exec tsc --noEmit
  ```

  Expected: first command — `Test Files 5 passed`, `Tests 13 passed` (button 5, dialog 2, switch 3, dropdown-menu 2, tooltip 1). Second command — no output, exit code `0` (strict, no `any`).

- [ ] **Step 19: Commit the primitives.**
  ```bash
  git add packages/ui/src/primitives packages/ui/src/index.ts
  git commit -m "feat(ui): add token-skinned shadcn primitives with Radix a11y intact"
  ```
  Expected: one commit created listing the ten primitive files, five tests, and the updated barrel.

---

**Definition of done:**

- `components.json` exists; all primitive deps resolve after `pnpm install`.
- All nine primitives (`Button`, `Input`, `Dialog`, `DropdownMenu`, `Popover`, `Tabs`, `Switch`, `Tooltip`, `Command`) are implemented, token-skinned (no hardcoded hex — every color/radius/shadow is a `var(--token)`), and named-exported from `packages/ui/src/index.ts`.
- `Button` exposes the canonical `ButtonVariant` (`primary` | `ghost` | `outline` | `danger` | `icon`) with `asChild`; primary is neutral `--primary`/`--primary-text` and there is **no** accent Button variant.
- Brand rule honored: `--accent` appears **only** as (a) the `focus-visible` ring on every interactive primitive and (b) the Switch checked-state fill; no other primitive paints with accent.
- Radix a11y verified by tests: Dialog opens/closes on Escape and traps focus with an accessible name; DropdownMenu exposes `role="menu"`/`menuitem` and its `danger` item uses `--error`; Switch exposes `role="switch"`, toggles on Space, and its on-fill is `--accent`; Tooltip exposes `role="tooltip"`.
- Open/close animations wired through tw-animate-css state utilities on Dialog, DropdownMenu, Popover, and Tooltip.
- `pnpm --filter @wedevs/ui test -- src/primitives` → 13 tests pass; `tsc --noEmit` → clean, exit 0.
- Two Conventional Commits landed: `chore(ui): …` (config + deps) and `feat(ui): …` (primitives).

---

### Task 6: Mascots (Robo, Visor) + live primitives (LiveDot, LiveCluster, StreamShimmer, TypeCaret)

Build the six **sanctioned "Volt-alive"** components: two animated SVG mascots and the four live/presence primitives. These are (together with focus rings, the sidebar `logo-dot`, and switch on-state) the ONLY components in the whole UI permitted to paint with `--accent`. The one exception inside this task is **StreamShimmer**, which is deliberately NEUTRAL (gray `--text-3`→`--text` sweep, never accent). Every component honors `prefers-reduced-motion: reduce` → static markup, no animation classes.

**Visual source of truth:** `d:/Rajin/Wedevs.cloud/mockup/index.html`. Read exactly these ranges before implementing (do not invent markup):

- Robo SVG markup: lines **961** and **995** (identical avatar SVG) · Robo CSS: **76–80** (`.who.bot`, `.eye` blink, `.ant` antenna pulse)
- Visor SVG markup: lines **901–913** (`.hero-bot` wrapper + `.visor-svg` + `.hero-shadow`) · Visor CSS: **560–571** (`.hero-bot`, `::before` glow, `.visor-svg` bob + drop-shadow, `.scanline` scan, `.hero-shadow` hsh)
- LiveCluster markup: line **997** (`.live-cluster` with `.lc-main` + 3 `.lc-spark`) · CSS: **648–655**
- StreamShimmer CSS: **574–578** (`.stream-shimmer`, `@keyframes txtshim`)
- TypeCaret CSS: **289–290** (`.type-caret`)
- LiveDot CSS: **283–285** (`.livedot`, `@keyframes live`)

---

**Files:**

Create:

- `packages/ui/src/mascots/Robo.tsx`
- `packages/ui/src/mascots/Robo.test.tsx`
- `packages/ui/src/mascots/Visor.tsx`
- `packages/ui/src/mascots/Visor.test.tsx`
- `packages/ui/src/live/LiveDot.tsx`
- `packages/ui/src/live/LiveDot.test.tsx`
- `packages/ui/src/live/LiveCluster.tsx`
- `packages/ui/src/live/LiveCluster.test.tsx`
- `packages/ui/src/live/StreamShimmer.tsx`
- `packages/ui/src/live/StreamShimmer.test.tsx`
- `packages/ui/src/live/TypeCaret.tsx`
- `packages/ui/src/live/TypeCaret.test.tsx`

Modify:

- `packages/ui/src/index.ts` (add barrel re-exports)
- `packages/ui/src/styles/keyframes.css` (**only if** the `live` keyframe is missing — verification step below)

---

**Interfaces:**

Consumes (from earlier tasks — do NOT redefine):

```ts
// Task 1 — packages/ui/src/lib/cn.ts
export function cn(...inputs: ClassValue[]): string;
// Task 1 — packages/ui/src/lib/use-reduced-motion.ts
export function useReducedMotion(): boolean; // subscribes to (prefers-reduced-motion: reduce)
```

Also consumes **Task 2** `packages/ui/src/styles/keyframes.css`, which globally defines the `@keyframes` referenced here by name: `antp`, `blink`, `bob`, `scan`, `hsh`, `twinkle`, `caret`, `shimmer`, `live`. (These are referenced via Tailwind arbitrary-animation utilities like `animate-[antp_1.9s_ease-in-out_infinite]`; Tailwind's JIT emits the `animation:` declaration and the keyframe resolves from the global stylesheet at runtime. jsdom does not evaluate CSS, so tests assert only class names.)

Produces (copy these prop types VERBATIM — canonical from the shared contract):

```ts
// packages/ui/src/mascots/Robo.tsx
export interface RoboProps {
  size?: number;
  className?: string;
} // default size 30
// packages/ui/src/mascots/Visor.tsx
export interface VisorProps {
  className?: string;
}
// packages/ui/src/live/LiveDot.tsx
export interface LiveDotProps {
  className?: string;
}
// packages/ui/src/live/LiveCluster.tsx
export interface LiveClusterProps {
  label?: string;
  className?: string;
}
// packages/ui/src/live/StreamShimmer.tsx
export interface StreamShimmerProps {
  text: string;
  className?: string;
} // NEUTRAL gray sweep
// packages/ui/src/live/TypeCaret.tsx
export interface TypeCaretProps {
  className?: string;
}
```

**Accent rule for this task (enforced in review):** accent may be painted ONLY by Robo eyes+antenna, Visor antenna+scanline+body-stroke(`--accent-line`)+hero-glow(`--accent-soft`), LiveDot, LiveCluster (main + 3 sparks), and TypeCaret. **StreamShimmer must never contain the substring `accent` in its rendered output.** Mascot robot-body illustration fills (`#6e756d`, `#f2f4ee`, `#17191a`, `#3a3e40`, `#2c2f30`, `#0f1112`, `#33373a`) are a fixed illustration palette (the robot looks identical in both themes by design) — port them as literal hex verbatim from the mockup. This is an intentional illustration-palette exception, analogous to the sanctioned syntax-token / theme-preview hex zones; call it out in the commit body so review does not flag it.

---

**Steps:**

- [ ] **Step 1: Verify prerequisites exist.** Run:

  ```
  pnpm --filter @wedevs/ui exec node -e "require('fs').accessSync('src/lib/cn.ts');require('fs').accessSync('src/lib/use-reduced-motion.ts');require('fs').accessSync('src/styles/keyframes.css');console.log('prereqs ok')"
  ```

  Expected stdout: `prereqs ok`. If any file is missing, stop — Tasks 1 and 2 are not complete.

- [ ] **Step 2: Verify required keyframes are present in `keyframes.css`.** Run:

  ```
  pnpm --filter @wedevs/ui exec node -e "const s=require('fs').readFileSync('src/styles/keyframes.css','utf8');['antp','blink','bob','scan','hsh','twinkle','caret','shimmer','live'].forEach(k=>{if(!new RegExp('@keyframes\\\\s+'+k+'\\\\b').test(s))throw new Error('missing keyframe: '+k)});console.log('keyframes ok')"
  ```

  Expected stdout: `keyframes ok`. If it throws `missing keyframe: live`, add this block to `packages/ui/src/styles/keyframes.css` (the LiveDot/LiveCluster presence pulse, ported from mockup 285) and re-run until it prints `keyframes ok`:

  ```css
  @keyframes live {
    0% {
      box-shadow: 0 0 0 0 var(--accent-soft);
    }
    70%,
    100% {
      box-shadow: 0 0 0 6px transparent;
    }
  }
  ```

  (Do not add any other missing keyframe here — those belong to Task 2; only `live` is in-scope to backfill because it is not enumerated in the Task 2 summary yet is required by this task.)

- [ ] **Step 3: Write the failing Robo test** at `packages/ui/src/mascots/Robo.test.tsx`:

  ```tsx
  import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
  import { cleanup, render } from "@testing-library/react";
  import { Robo } from "./Robo";

  function setMatchMedia(reduce: boolean) {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: reduce && query.includes("reduce"),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  }

  beforeEach(() => setMatchMedia(false));
  afterEach(() => cleanup());

  describe("Robo", () => {
    it("renders an svg with three accent-filled circles (antenna + two eyes)", () => {
      const { container } = render(<Robo />);
      expect(container.querySelector("svg")).not.toBeNull();
      expect(
        container.querySelectorAll('circle[fill="var(--accent)"]').length,
      ).toBe(3);
    });

    it("defaults to size 30 and forwards the size prop", () => {
      const { container } = render(<Robo size={48} />);
      const svg = container.querySelector("svg")!;
      expect(svg.getAttribute("width")).toBe("48");
      expect(svg.getAttribute("height")).toBe("48");
    });

    it("uses non-accent illustration colors for neck and face", () => {
      const { container } = render(<Robo />);
      expect(container.querySelector('line[stroke="#6e756d"]')).not.toBeNull();
      expect(container.querySelector('rect[fill="#17191a"]')).not.toBeNull();
    });

    it("animates antenna and eyes when motion is allowed", () => {
      const { container } = render(<Robo />);
      const ant = container.querySelector('circle[cx="32"][cy="6"]')!;
      expect(ant.getAttribute("class")).toContain("animate-[antp");
      const eye = container.querySelector('circle[cx="27.5"]')!;
      expect(eye.getAttribute("class")).toContain("animate-[blink");
    });

    it("renders static (no animation classes) under prefers-reduced-motion", () => {
      setMatchMedia(true);
      const { container } = render(<Robo />);
      expect(container.innerHTML).not.toContain("animate-[");
    });
  });
  ```

- [ ] **Step 4: Run the Robo test — expect FAIL.**

  ```
  pnpm --filter @wedevs/ui exec vitest run src/mascots/Robo.test.tsx
  ```

  Expected: fails to resolve `./Robo` (`Failed to load url ./Robo` / `No test files` → module-not-found). This confirms the test runs and the component is missing.

- [ ] **Step 5: Implement `packages/ui/src/mascots/Robo.tsx`.** Port the SVG from mockup line 961/995 (viewBox `0 0 64 60`; neck `line`, antenna `circle.ant`, head `rect`, face `rect`, two `circle.eye`). Antenna pulse = mockup CSS 79–80 (`animate-[antp_1.9s_ease-in-out_infinite]`); eye blink = mockup CSS 77–78 (needs `transform-box:fill-box; transform-origin:center` → `[transform-box:fill-box] [transform-origin:center] animate-[blink_4.6s_infinite]`). `size` defaults to 30; width and height both = `size`.

  ```tsx
  import { cn } from "../lib/cn";
  import { useReducedMotion } from "../lib/use-reduced-motion";

  export interface RoboProps {
    size?: number;
    className?: string;
  }

  export function Robo({ size = 30, className }: RoboProps) {
    const reduce = useReducedMotion();
    const antClass = reduce
      ? undefined
      : "animate-[antp_1.9s_ease-in-out_infinite]";
    const eyeClass = reduce
      ? undefined
      : "[transform-box:fill-box] [transform-origin:center] animate-[blink_4.6s_infinite]";
    return (
      <svg
        role="img"
        aria-label="Robo"
        width={size}
        height={size}
        viewBox="0 0 64 60"
        fill="none"
        className={cn("shrink-0 overflow-visible", className)}
      >
        <line
          x1="32"
          y1="9"
          x2="32"
          y2="15"
          stroke="#6e756d"
          strokeWidth="2.4"
        />
        <circle
          className={antClass}
          cx="32"
          cy="6"
          r="3.2"
          fill="var(--accent)"
        />
        <rect x="14" y="15" width="36" height="29" rx="12" fill="#f2f4ee" />
        <rect x="20" y="23" width="24" height="13" rx="6.5" fill="#17191a" />
        <circle
          className={eyeClass}
          cx="27.5"
          cy="29.5"
          r="2.6"
          fill="var(--accent)"
        />
        <circle
          className={eyeClass}
          cx="36.5"
          cy="29.5"
          r="2.6"
          fill="var(--accent)"
        />
      </svg>
    );
  }
  ```

- [ ] **Step 6: Run the Robo test — expect PASS.**

  ```
  pnpm --filter @wedevs/ui exec vitest run src/mascots/Robo.test.tsx
  ```

  Expected: `Test Files  1 passed (1)` · `Tests  5 passed (5)`.

- [ ] **Step 7: Commit.**

  ```
  git add packages/ui/src/mascots/Robo.tsx packages/ui/src/mascots/Robo.test.tsx
  git commit -m "feat(ui): add Robo animated mascot (accent eyes + antenna, reduced-motion static)"
  ```

- [ ] **Step 8: Write the failing Visor test** at `packages/ui/src/mascots/Visor.test.tsx` (reuse the `setMatchMedia` helper pattern from Step 3):

  ```tsx
  import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
  import { cleanup, render } from "@testing-library/react";
  import { Visor } from "./Visor";

  function setMatchMedia(reduce: boolean) {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: reduce && query.includes("reduce"),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  }

  beforeEach(() => setMatchMedia(false));
  afterEach(() => cleanup());

  describe("Visor", () => {
    it("paints antenna + scanline with accent and the body with accent-line stroke", () => {
      const { container } = render(<Visor />);
      expect(
        container.querySelector('circle[fill="var(--accent)"]'),
      ).not.toBeNull();
      expect(
        container.querySelector('rect[fill="var(--accent)"]'),
      ).not.toBeNull();
      expect(
        container.querySelector('rect[stroke="var(--accent-line)"]'),
      ).not.toBeNull();
    });

    it("renders an accent-soft hero glow", () => {
      const { container } = render(<Visor />);
      const glow = Array.from(container.querySelectorAll("span")).find((s) =>
        (s.getAttribute("style") ?? "").includes("var(--accent-soft)"),
      );
      expect(glow).toBeDefined();
    });

    it("bobs the svg and animates the scanline when motion is allowed", () => {
      const { container } = render(<Visor />);
      expect(container.querySelector("svg")!.getAttribute("class")).toContain(
        "animate-[bob",
      );
      expect(
        container
          .querySelector('rect[fill="var(--accent)"]')!
          .getAttribute("class"),
      ).toContain("animate-[scan");
    });

    it("is static under prefers-reduced-motion", () => {
      setMatchMedia(true);
      const { container } = render(<Visor />);
      expect(container.innerHTML).not.toContain("animate-[");
    });
  });
  ```

- [ ] **Step 9: Run the Visor test — expect FAIL** (module `./Visor` not found).

  ```
  pnpm --filter @wedevs/ui exec vitest run src/mascots/Visor.test.tsx
  ```

- [ ] **Step 10: Implement `packages/ui/src/mascots/Visor.tsx`.** Port markup from mockup 901–913 and CSS 560–571. Structure = `.hero-bot` wrapper (relative inline-flex column, centered, `mb-5`=20px) containing: the accent-soft radial glow (mockup `::before`, rendered as a positioned `<span>` with an inline `background`), the `.visor-svg` (bob + drop-shadow), and the `.hero-shadow` `<span>` (hsh). Antenna=`animate-[antp...]`, scanline=`animate-[scan...]`, svg wrapper=`animate-[bob...]`, shadow=`animate-[hsh...]`; all suppressed under reduced motion.

  ```tsx
  import { cn } from "../lib/cn";
  import { useReducedMotion } from "../lib/use-reduced-motion";

  export interface VisorProps {
    className?: string;
  }

  export function Visor({ className }: VisorProps) {
    const reduce = useReducedMotion();
    const svgAnim = reduce ? "" : "animate-[bob_3.4s_ease-in-out_infinite]";
    const scanAnim = reduce ? "" : "animate-[scan_2.6s_ease-in-out_infinite]";
    const antAnim = reduce ? "" : "animate-[antp_1.9s_ease-in-out_infinite]";
    const shadowAnim = reduce ? "" : "animate-[hsh_3.4s_ease-in-out_infinite]";
    return (
      <div
        className={cn(
          "relative mb-5 inline-flex flex-col items-center",
          className,
        )}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-1.5 left-1/2 -z-10 h-[130px] w-[210px] -translate-x-1/2 rounded-full"
          style={{
            background:
              "radial-gradient(circle, var(--accent-soft), transparent 66%)",
          }}
        />
        <svg
          aria-hidden="true"
          width="118"
          height="110"
          viewBox="0 0 64 60"
          fill="none"
          className={cn(
            "[filter:drop-shadow(0_12px_22px_rgba(0,0,0,0.26))]",
            svgAnim,
          )}
        >
          <line
            x1="32"
            y1="6"
            x2="32"
            y2="14"
            stroke="var(--text-3)"
            strokeWidth="2"
          />
          <circle
            className={antAnim}
            cx="32"
            cy="4.4"
            r="2.6"
            fill="var(--accent)"
          />
          <rect x="8.5" y="24" width="4.5" height="9" rx="2.2" fill="#3a3e40" />
          <rect x="51" y="24" width="4.5" height="9" rx="2.2" fill="#3a3e40" />
          <rect
            x="12"
            y="14"
            width="40"
            height="32"
            rx="14"
            fill="#2c2f30"
            stroke="var(--accent-line)"
          />
          <rect x="18" y="25" width="28" height="11" rx="5.5" fill="#0f1112" />
          <rect
            className={scanAnim}
            x="20"
            y="27.5"
            width="8"
            height="6"
            rx="3"
            fill="var(--accent)"
          />
          <rect x="23" y="49" width="18" height="8" rx="4" fill="#33373a" />
        </svg>
        <span
          aria-hidden="true"
          className={cn(
            "mt-[5px] h-[9px] w-14 rounded-full opacity-50 [background:rgba(0,0,0,0.26)] [filter:blur(4px)]",
            shadowAnim,
          )}
        />
      </div>
    );
  }
  ```

- [ ] **Step 11: Run the Visor test — expect PASS.**

  ```
  pnpm --filter @wedevs/ui exec vitest run src/mascots/Visor.test.tsx
  ```

  Expected: `Tests  4 passed (4)`.

- [ ] **Step 12: Commit.**

  ```
  git add packages/ui/src/mascots/Visor.tsx packages/ui/src/mascots/Visor.test.tsx
  git commit -m "feat(ui): add Visor empty-state hero mascot (bob + scanline + accent-soft glow)"
  ```

- [ ] **Step 13: Write the failing LiveDot test** at `packages/ui/src/live/LiveDot.test.tsx`:

  ```tsx
  import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
  import { cleanup, render } from "@testing-library/react";
  import { LiveDot } from "./LiveDot";

  function setMatchMedia(reduce: boolean) {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: reduce && query.includes("reduce"),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  }

  beforeEach(() => setMatchMedia(false));
  afterEach(() => cleanup());

  describe("LiveDot", () => {
    it("renders an accent-keyed pulsing dot", () => {
      const { container } = render(<LiveDot />);
      const dot = container.querySelector("span")!;
      expect(dot.getAttribute("class")).toContain("bg-[var(--accent)]");
      expect(dot.getAttribute("class")).toContain("animate-[live");
    });

    it("keeps the accent fill but drops animation under prefers-reduced-motion", () => {
      setMatchMedia(true);
      const { container } = render(<LiveDot />);
      const cls = container.querySelector("span")!.getAttribute("class")!;
      expect(cls).toContain("bg-[var(--accent)]");
      expect(cls).not.toContain("animate-");
    });
  });
  ```

- [ ] **Step 14: Run — expect FAIL** (`./LiveDot` not found).

  ```
  pnpm --filter @wedevs/ui exec vitest run src/live/LiveDot.test.tsx
  ```

- [ ] **Step 15: Implement `packages/ui/src/live/LiveDot.tsx`** (mockup CSS 283–285: 7px accent dot, `flex:0 0 auto`, `animate:live 2s`).

  ```tsx
  import { cn } from "../lib/cn";
  import { useReducedMotion } from "../lib/use-reduced-motion";

  export interface LiveDotProps {
    className?: string;
  }

  export function LiveDot({ className }: LiveDotProps) {
    const reduce = useReducedMotion();
    return (
      <span
        aria-hidden="true"
        className={cn(
          "inline-block h-[7px] w-[7px] shrink-0 rounded-full bg-[var(--accent)]",
          !reduce && "animate-[live_2s_ease-in-out_infinite]",
          className,
        )}
      />
    );
  }
  ```

- [ ] **Step 16: Run — expect PASS.**

  ```
  pnpm --filter @wedevs/ui exec vitest run src/live/LiveDot.test.tsx
  ```

  Expected: `Tests  2 passed (2)`.

- [ ] **Step 17: Write the failing LiveCluster test** at `packages/ui/src/live/LiveCluster.test.tsx`:

  ```tsx
  import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
  import { cleanup, render, screen } from "@testing-library/react";
  import { LiveCluster } from "./LiveCluster";

  function setMatchMedia(reduce: boolean) {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: reduce && query.includes("reduce"),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  }

  beforeEach(() => setMatchMedia(false));
  afterEach(() => cleanup());

  describe("LiveCluster", () => {
    it("renders a main dot plus three accent sparks (4 accent elements)", () => {
      const { container } = render(<LiveCluster />);
      expect(
        container.querySelectorAll('[class*="bg-[var(--accent)]"]').length,
      ).toBe(4);
    });

    it("renders an optional label", () => {
      render(<LiveCluster label="now" />);
      expect(screen.getByText("now")).toBeInTheDocument();
    });

    it("pulses the main dot and twinkles the sparks when motion is allowed", () => {
      const { container } = render(<LiveCluster />);
      expect(container.innerHTML).toContain("animate-[live");
      expect(container.innerHTML).toContain("animate-[twinkle");
    });

    it("is static under prefers-reduced-motion", () => {
      setMatchMedia(true);
      const { container } = render(<LiveCluster />);
      expect(container.innerHTML).not.toContain("animate-[");
    });
  });
  ```

- [ ] **Step 18: Run — expect FAIL** (`./LiveCluster` not found).

  ```
  pnpm --filter @wedevs/ui exec vitest run src/live/LiveCluster.test.tsx
  ```

- [ ] **Step 19: Implement `packages/ui/src/live/LiveCluster.tsx`** (mockup markup 997, CSS 648–655: `.live-cluster` 9×9 wrapper; `.lc-main` absolute `inset:1.5px` accent, `animate:live 2s`; three 2×2 accent sparks positioned s1/s2/s3 with staggered `twinkle` 1.4s / 1.9s @.3s / 1.6s @.6s). Optional `label` rendered as trailing neutral `--text-3` text.

  ```tsx
  import { cn } from "../lib/cn";
  import { useReducedMotion } from "../lib/use-reduced-motion";

  export interface LiveClusterProps {
    label?: string;
    className?: string;
  }

  export function LiveCluster({ label, className }: LiveClusterProps) {
    const reduce = useReducedMotion();
    const spark = "absolute h-[2px] w-[2px] rounded-full bg-[var(--accent)]";
    return (
      <span className={cn("inline-flex items-center gap-1.5", className)}>
        <span
          aria-hidden="true"
          className="relative inline-block h-[9px] w-[9px] shrink-0 align-middle"
        >
          <i
            className={cn(
              "absolute inset-[1.5px] rounded-full bg-[var(--accent)]",
              !reduce && "animate-[live_2s_ease-in-out_infinite]",
            )}
          />
          <i
            className={cn(
              spark,
              "left-[2px] top-[-3px]",
              !reduce && "animate-[twinkle_1.4s_ease-in-out_infinite]",
            )}
          />
          <i
            className={cn(
              spark,
              "right-[-4px] top-[2px]",
              !reduce && "animate-[twinkle_1.9s_ease-in-out_0.3s_infinite]",
            )}
          />
          <i
            className={cn(
              spark,
              "bottom-[-3px] left-[1px]",
              !reduce && "animate-[twinkle_1.6s_ease-in-out_0.6s_infinite]",
            )}
          />
        </span>
        {label ? (
          <span className="text-[11px] text-[var(--text-3)]">{label}</span>
        ) : null}
      </span>
    );
  }
  ```

- [ ] **Step 20: Run — expect PASS.**

  ```
  pnpm --filter @wedevs/ui exec vitest run src/live/LiveCluster.test.tsx
  ```

  Expected: `Tests  4 passed (4)`.

- [ ] **Step 21: Write the failing StreamShimmer test** at `packages/ui/src/live/StreamShimmer.test.tsx` (this is the NEUTRAL one — the `not.toContain("accent")` assertion is load-bearing):

  ```tsx
  import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
  import { cleanup, render, screen } from "@testing-library/react";
  import { StreamShimmer } from "./StreamShimmer";

  function setMatchMedia(reduce: boolean) {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: reduce && query.includes("reduce"),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  }

  beforeEach(() => setMatchMedia(false));
  afterEach(() => cleanup());

  describe("StreamShimmer", () => {
    it("renders the provided text", () => {
      render(<StreamShimmer text="Thinking through the plan" />);
      expect(screen.getByText("Thinking through the plan")).toBeInTheDocument();
    });

    it("is neutral: never paints with the accent token", () => {
      const { container } = render(<StreamShimmer text="Working" />);
      expect(container.innerHTML).not.toContain("accent");
    });

    it("uses a gray gradient text sweep when motion is allowed", () => {
      render(<StreamShimmer text="Working" />);
      const cls = screen.getByText("Working").getAttribute("class")!;
      expect(cls).toContain("bg-clip-text");
      expect(cls).toContain("animate-[shimmer");
    });

    it("renders plain static text under prefers-reduced-motion", () => {
      setMatchMedia(true);
      const { container } = render(<StreamShimmer text="Working" />);
      expect(container.innerHTML).not.toContain("animate-");
      expect(screen.getByText("Working").getAttribute("class")).not.toContain(
        "bg-clip-text",
      );
    });
  });
  ```

- [ ] **Step 22: Run — expect FAIL** (`./StreamShimmer` not found).

  ```
  pnpm --filter @wedevs/ui exec vitest run src/live/StreamShimmer.test.tsx
  ```

- [ ] **Step 23: Implement `packages/ui/src/live/StreamShimmer.tsx`** (mockup CSS 574–578: `linear-gradient(100deg, --text-3 30%, --text 50%, --text-3 70%)`, `background-size:220% 100%`, `bg-clip-text`, transparent text, `animate:shimmer 2.4s linear`). NO accent. Reduced motion → plain `--text` span.

  ```tsx
  import { cn } from "../lib/cn";
  import { useReducedMotion } from "../lib/use-reduced-motion";

  export interface StreamShimmerProps {
    text: string;
    className?: string;
  }

  export function StreamShimmer({ text, className }: StreamShimmerProps) {
    const reduce = useReducedMotion();
    if (reduce) {
      return (
        <span className={cn("text-[var(--text)]", className)}>{text}</span>
      );
    }
    return (
      <span
        className={cn(
          "bg-[length:220%_100%] bg-clip-text text-transparent",
          "[background-image:linear-gradient(100deg,var(--text-3)_30%,var(--text)_50%,var(--text-3)_70%)]",
          "animate-[shimmer_2.4s_linear_infinite]",
          className,
        )}
      >
        {text}
      </span>
    );
  }
  ```

- [ ] **Step 24: Run — expect PASS.**

  ```
  pnpm --filter @wedevs/ui exec vitest run src/live/StreamShimmer.test.tsx
  ```

  Expected: `Tests  4 passed (4)`.

- [ ] **Step 25: Write the failing TypeCaret test** at `packages/ui/src/live/TypeCaret.test.tsx`:

  ```tsx
  import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
  import { cleanup, render } from "@testing-library/react";
  import { TypeCaret } from "./TypeCaret";

  function setMatchMedia(reduce: boolean) {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: reduce && query.includes("reduce"),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  }

  beforeEach(() => setMatchMedia(false));
  afterEach(() => cleanup());

  describe("TypeCaret", () => {
    it("renders an accent blinking caret bar", () => {
      const { container } = render(<TypeCaret />);
      const cls = container.querySelector("span")!.getAttribute("class")!;
      expect(cls).toContain("bg-[var(--accent)]");
      expect(cls).toContain("animate-[caret");
    });

    it("keeps the accent bar but drops blinking under prefers-reduced-motion", () => {
      setMatchMedia(true);
      const { container } = render(<TypeCaret />);
      const cls = container.querySelector("span")!.getAttribute("class")!;
      expect(cls).toContain("bg-[var(--accent)]");
      expect(cls).not.toContain("animate-");
    });
  });
  ```

- [ ] **Step 26: Run — expect FAIL** (`./TypeCaret` not found).

  ```
  pnpm --filter @wedevs/ui exec vitest run src/live/TypeCaret.test.tsx
  ```

- [ ] **Step 27: Implement `packages/ui/src/live/TypeCaret.tsx`** (mockup CSS 289–290: inline-block `w:7px h:1.05em` accent bar, `vertical-align:-2px`, `rounded:1px`, `animate:caret 1s steps(2)`).

  ```tsx
  import { cn } from "../lib/cn";
  import { useReducedMotion } from "../lib/use-reduced-motion";

  export interface TypeCaretProps {
    className?: string;
  }

  export function TypeCaret({ className }: TypeCaretProps) {
    const reduce = useReducedMotion();
    return (
      <span
        aria-hidden="true"
        className={cn(
          "ml-px inline-block h-[1.05em] w-[7px] rounded-[1px] bg-[var(--accent)] align-[-2px]",
          !reduce && "animate-[caret_1s_steps(2)_infinite]",
          className,
        )}
      />
    );
  }
  ```

- [ ] **Step 28: Run — expect PASS.**

  ```
  pnpm --filter @wedevs/ui exec vitest run src/live/TypeCaret.test.tsx
  ```

  Expected: `Tests  2 passed (2)`.

- [ ] **Step 29: Add barrel exports to `packages/ui/src/index.ts`.** Append these lines (named exports + prop types; keep alphabetical grouping consistent with the file's existing style):

  ```ts
  // mascots
  export { Robo } from "./mascots/Robo";
  export type { RoboProps } from "./mascots/Robo";
  export { Visor } from "./mascots/Visor";
  export type { VisorProps } from "./mascots/Visor";

  // live primitives
  export { LiveDot } from "./live/LiveDot";
  export type { LiveDotProps } from "./live/LiveDot";
  export { LiveCluster } from "./live/LiveCluster";
  export type { LiveClusterProps } from "./live/LiveCluster";
  export { StreamShimmer } from "./live/StreamShimmer";
  export type { StreamShimmerProps } from "./live/StreamShimmer";
  export { TypeCaret } from "./live/TypeCaret";
  export type { TypeCaretProps } from "./live/TypeCaret";
  ```

- [ ] **Step 30: Type-check the whole package — expect clean.**

  ```
  pnpm --filter @wedevs/ui exec tsc --noEmit
  ```

  Expected: no output, exit code 0. (Fix any `TS` errors before proceeding; no `any`, strict mode.)

- [ ] **Step 31: Run the full package test suite for the new dirs — expect all PASS.**

  ```
  pnpm --filter @wedevs/ui exec vitest run src/mascots src/live
  ```

  Expected: `Test Files  6 passed (6)` · `Tests  21 passed (21)`.

- [ ] **Step 32: Lint the new files — expect clean.**

  ```
  pnpm --filter @wedevs/ui exec eslint src/mascots src/live
  ```

  Expected: no output, exit code 0.

- [ ] **Step 33: Commit the live primitives + exports.**
  ```
  git add packages/ui/src/live packages/ui/src/index.ts
  git commit -m "feat(ui): add live primitives LiveDot/LiveCluster/StreamShimmer/TypeCaret + barrel exports
  ```

StreamShimmer is deliberately neutral (gray --text-3->--text sweep); all
others are accent-keyed. Robo/Visor use a fixed illustration hex palette
by design (identical in both themes) — not a token violation."

````
If Step 2 required backfilling the `live` keyframe, also `git add packages/ui/src/styles/keyframes.css` in this commit.

---

**Definition of done:**
- All six components exist as named exports, re-exported from `packages/ui/src/index.ts`, with prop interfaces matching the shared contract verbatim (`RoboProps`, `VisorProps`, `LiveDotProps`, `LiveClusterProps`, `StreamShimmerProps`, `TypeCaretProps`).
- `pnpm --filter @wedevs/ui exec vitest run src/mascots src/live` → 6 files / 21 tests passing.
- `pnpm --filter @wedevs/ui exec tsc --noEmit` clean; `eslint src/mascots src/live` clean.
- Accent rule holds: Robo (eyes+antenna), Visor (antenna+scanline+`--accent-line` body+`--accent-soft` glow), LiveDot, LiveCluster (main+3 sparks), and TypeCaret paint with the accent token; **StreamShimmer contains no `accent` substring** (verified by test).
- `prefers-reduced-motion: reduce` removes every `animate-[…]` class from all six components (verified by matchMedia-mock tests); accent fills remain, StreamShimmer degrades to plain `--text` text.
- Robot-body illustration hex colors are ported verbatim from the mockup and documented in the commit as an intentional illustration-palette exception.
- Conventional Commits landed for the mascots and for the live primitives + exports.


---

### Task 7: LeftRail component (brand, nav, recents+menu+rename, projects, account)

Build the `LeftRail` sidebar component in `packages/ui`. It renders the brand/logo slot (with a swappable HD image), the pulsing `LiveDot` logo-dot, a New-chat button, a ⌘K search button, primary nav (Chats/Code/Plugins), time-grouped recent chats each with a `⋯` row menu (pin/rename/archive/delete) plus double-click inline rename, projects with count tags, and an account chip + settings row. It supports `expanded` (272px) ↔ `collapsed` (60px) modes where collapsed hides all labels/lists and centers icons. **Selection is strictly NEUTRAL** — active nav/recent rows use `--active` + `--active-line`, never `--accent`. The single Volt-allowed element is the `logo-dot` (rendered via `LiveDot` from Task 6).

This task consumes the primitives from Task 5 (`Button`, `DropdownMenu`, `Input`), `LiveDot` from Task 6, the `cn()` helper, and the shared domain types. It follows strict TDD: write a failing test, run it (RED), implement, run it (GREEN), commit.

---

**Files:**

- CREATE `packages/ui/src/components/LeftRail/LeftRail.tsx`
- CREATE `packages/ui/src/components/LeftRail/LeftRail.test.tsx`
- MODIFY `packages/ui/src/index.ts` (add barrel export for `LeftRail`)

---

**Interfaces:**

**Produces** — export from `LeftRail.tsx` and re-export from `packages/ui/src/index.ts`:

```ts
export interface LeftRailProps {
mode: RailMode; nav: NavItem[]; activeNav: NavKey;
recents: RecentChat[]; projects: Project[]; account: Account;
brandLogo?: React.ReactNode;                    // swappable HD image slot
onNavSelect: (id: NavKey) => void;
onNewChat: () => void; onSearch: () => void;    // onSearch opens CommandPalette
onToggleCollapse: () => void;
onRenameChat: (id: string, title: string) => void;
onChatAction: (id: string, action: ChatRowAction) => void;
onAccountAction: (action: AccountAction) => void;
}
````

**Consumes** — these already exist from earlier tasks (do NOT redefine them; import them):

```ts
// from packages/ui/src/types.ts  (Task 4)
export type RailMode = "expanded" | "collapsed" | "open";
export type NavKey = "chat" | "code" | "market";
export type RecentGroup = "pinned" | "today" | "previous7" | "projects";
export type ChatRowAction = "pin" | "rename" | "archive" | "delete";
export type AccountAction = "profile" | "settings" | "upgrade" | "logout";
export interface NavItem {
  id: NavKey;
  label: string;
  icon: React.ReactNode;
  kbd?: string;
}
export interface RecentChat {
  id: string;
  title: string;
  group: RecentGroup;
  pinned?: boolean;
}
export interface Project {
  id: string;
  name: string;
  count: number;
}
export interface Account {
  name: string;
  email: string;
  plan: string;
  initials: string;
}

// from packages/ui/src/lib/cn.ts  (Task 1)
export function cn(...inputs: ClassValue[]): string;

// from packages/ui/src/live/LiveDot.tsx  (Task 6)
export interface LiveDotProps {
  className?: string;
}
export function LiveDot(props: LiveDotProps): JSX.Element;

// from packages/ui/src/primitives/  (Task 5)
export function Button(props: ButtonProps): JSX.Element; // variant?: "primary"|"ghost"|"outline"|"danger"|"icon"
export function Input(
  props: React.InputHTMLAttributes<HTMLInputElement>,
): JSX.Element;
// DropdownMenu family (Radix shapes):
export const DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator;
```

---

**Visual source of truth — read these exact ranges in `d:/Rajin/Wedevs.cloud/mockup/index.html` before implementing:**

- **CSS 102–164** — `.rail`, `.rail-top`, `.brand`, `.brand-name`, `.rail-collapse`, collapsed-mode display rules, `.btn` / `.btn-new` / `.btn-search`, `.list-scroll`, `.grp-h`, `.nav-item` (+ `.active` + `.active::before` neutral rail line), `.row-menu`, `.proj`, `.acct` / `.acct-chip` / `.avatar` / `.acct-meta`.
- **CSS 540–552** — refinement layer that WINS: `.nav-new`, `.rail{width:272px}`, `.nav-item{padding:7px 10px}`, `.nav-item .lbl{font-size:14px}`, `.grp-h{padding:15px 9px 5px}`, `.btn-search{padding:9px 11px}`, `.acct-chip{padding:7px 8px}`, collapsed `.nav-item{justify-content:center}`, collapsed `.kbd{display:none}`.
- **CSS 580–586** — `.brand-logo` (30×30 swappable image slot, `--primary` fallback with Unbounded "W"), `.brand-logo img`, `.nav-primary`, collapsed `.nav-primary{align-items:center}`.
- **Supporting CSS**: `.logo-dot` (line 81 — but use `LiveDot` instead), `.tag` (97–98), `.kbd` (99–100), `.menu`/`.menu-item`/`.menu-item.danger`/`.menu-sep` (456–464 — reference only; use Radix `DropdownMenu` for a11y), `.rename-input` (679), `.icon`/`.icon.sm` (88–89), `:focus-visible` (85), reduced-motion guard (93).
- **Markup 739–800** — the full `<aside class="rail">` structure: rail-top (brand-logo + brand-name + logo-dot + collapse ibtn), btn-search, nav-primary (New chat + 3 nav items), list-scroll (grouped recents + projects), acct (chip + settings).
- **Rename JS 1463–1475** — inline rename: Enter commits trimmed value (falls back to old if empty), Escape reverts, blur commits; double-click on a `.list-scroll .nav-item` starts rename.
- **rowMenu markup 1213–1219** — the four menu items in order: Pin, Rename, Archive, `menu-sep`, Delete (danger).
- **acctMenu markup 1229–1235** — Profile, Settings, Upgrade plan, `menu-sep`, Log out.

**Port the markup + Tailwind-mapped styles from those ranges. Do NOT hardcode hex.** Consume tokens via arbitrary-value Tailwind utilities (e.g. `bg-[var(--sidebar)]`, `text-[var(--text-2)]`, `border-[var(--border)]`) or a small set of `cn()`-composed class strings. The `.avatar` gradient (`linear-gradient(135deg,#6a7788,#3d4653)` at mockup 157) is the ONE literal-hex exception permitted here (a decorative avatar placeholder gradient) — keep it as an inline `style` on the avatar div.

**Brand rule enforcement (reviewed):** the ONLY `--accent` usage in this component is the `logo-dot` rendered via `<LiveDot />`. Active nav (`.nav-item.active`) uses `bg-[var(--active)]` + a `::before` bar colored `--active-line` (neutral). New-chat button uses `--primary`/`--primary-text` (neutral). Nothing else may reference `--accent`, `--accent-soft`, or `--accent-line` — except the browser's own `:focus-visible` ring which is global (Task 0/1) and not set here.

---

**Steps:**

- [ ] **Step 1: Write the failing test file.** Create `packages/ui/src/components/LeftRail/LeftRail.test.tsx` with the complete content below. It renders `LeftRail` with fixture data in both modes and asserts real behavior: collapsed hides labels/list, active nav uses neutral tokens (no `accent` class), the `⋯` row menu fires `onChatAction` (including danger `delete`), double-click swaps a recent to a rename `Input` and Enter commits via `onRenameChat`, and the account chip menu fires `onAccountAction`.

```tsx
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
```

- [ ] **Step 2: Run the test — expect it to FAIL (RED).** The module does not exist yet.

  ```bash
  cd packages/ui && pnpm vitest run src/components/LeftRail/LeftRail.test.tsx
  ```

  Expected output: a failure resolving the import, e.g. `Error: Failed to resolve import "./LeftRail" from "src/components/LeftRail/LeftRail.test.tsx"` and `Test Files 1 failed`. This confirms the test is wired and red for the right reason.

- [ ] **Step 3: Implement `LeftRail.tsx`.** Create `packages/ui/src/components/LeftRail/LeftRail.tsx` with the full component below. Port the visual structure/classes from mockup markup 739–800 and CSS 102–164 + 540–552 + 580–586, mapped to Tailwind arbitrary-value utilities against tokens. Use Radix `DropdownMenu` (Task 5) for the row menu and account menu so a11y roles (`menu`/`menuitem`) exist for free. Render `<LiveDot />` (Task 6) as the logo-dot — the sole accent element.

```tsx
"use client";

import * as React from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "../../primitives/dropdown-menu";
import { Button } from "../../primitives/button";
import { Input } from "../../primitives/input";
import { LiveDot } from "../../live/LiveDot";
import { cn } from "../../lib/cn";
import type {
  RailMode,
  NavItem,
  NavKey,
  RecentChat,
  RecentGroup,
  Project,
  Account,
  ChatRowAction,
  AccountAction,
} from "../../types";

export interface LeftRailProps {
  mode: RailMode;
  nav: NavItem[];
  activeNav: NavKey;
  recents: RecentChat[];
  projects: Project[];
  account: Account;
  brandLogo?: React.ReactNode;
  onNavSelect: (id: NavKey) => void;
  onNewChat: () => void;
  onSearch: () => void;
  onToggleCollapse: () => void;
  onRenameChat: (id: string, title: string) => void;
  onChatAction: (id: string, action: ChatRowAction) => void;
  onAccountAction: (action: AccountAction) => void;
}

// ---- inline stroke icons (ported viewBox paths from mockup) ------------------
const ic =
  "h-[18px] w-[18px] flex-none [&_*]:[vector-effect:non-scaling-stroke]";
const icSm = "h-[15px] w-[15px] flex-none";
function Svg({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}
const CollapseIcon = () => (
  <Svg className={ic}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M9 4v16" />
  </Svg>
);
const SearchIcon = () => (
  <Svg className={ic}>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </Svg>
);
const PlusIcon = () => (
  <Svg className={ic}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);
const StarIcon = ({ small }: { small?: boolean }) => (
  <Svg className={small ? icSm : ic}>
    <path d="M12 17.3 5.8 21l1.6-7L2 9.2l7.1-.6L12 2l2.9 6.6 7.1.6-5.4 4.8 1.6 7z" />
  </Svg>
);
const ChatIcon = () => (
  <Svg className={ic}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </Svg>
);
const FolderIcon = ({ small }: { small?: boolean }) => (
  <Svg className={small ? icSm : ic}>
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
  </Svg>
);
const DotsIcon = () => (
  <Svg className={icSm}>
    <circle cx="5" cy="12" r="1" />
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
  </Svg>
);
const RenameIcon = () => (
  <Svg className={icSm}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
  </Svg>
);
const ArchiveIcon = () => (
  <Svg className={icSm}>
    <path d="M3 7h18M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" />
  </Svg>
);
const ChevronUpDownIcon = () => (
  <Svg className={icSm}>
    <path d="m8 9 4-4 4 4M8 15l4 4 4-4" />
  </Svg>
);
const ProfileIcon = () => (
  <Svg className={icSm}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20a8 8 0 0 1 16 0" />
  </Svg>
);
const GearIcon = ({ small }: { small?: boolean }) => (
  <Svg className={small ? icSm : ic}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 3v3m0 12v3M3 12h3m12 0h3" />
  </Svg>
);
const UpgradeIcon = () => (
  <Svg className={icSm}>
    <path d="M12 2v10M6 6a8 8 0 1 0 12 0" />
  </Svg>
);
const LogoutIcon = () => (
  <Svg className={icSm}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
  </Svg>
);

// ---- shared class fragments (tokens only, no hex) ---------------------------
const navBase =
  "group relative flex w-full items-center gap-[9px] rounded-[var(--radius-xs)] px-[10px] py-[7px] text-left text-[var(--text-2)] transition-colors duration-100 hover:bg-[var(--hover)] hover:text-[var(--text)]";
const navActive =
  "bg-[var(--active)] text-[var(--text)] before:absolute before:-left-1 before:top-2 before:bottom-2 before:w-[2.5px] before:rounded-[2px] before:bg-[var(--active-line)] before:content-['']";

const RECENT_ORDER: RecentGroup[] = ["pinned", "today", "previous7"];
const GROUP_LABEL: Record<RecentGroup, string> = {
  pinned: "Pinned",
  today: "Today",
  previous7: "Previous 7 days",
  projects: "Projects",
};

// ---------------------------------------------------------------------------
export function LeftRail(props: LeftRailProps) {
  const {
    mode,
    nav,
    activeNav,
    recents,
    projects,
    account,
    brandLogo,
    onNavSelect,
    onNewChat,
    onSearch,
    onToggleCollapse,
    onRenameChat,
    onChatAction,
    onAccountAction,
  } = props;

  const collapsed = mode === "collapsed";
  const [renamingId, setRenamingId] = React.useState<string | null>(null);

  const groups = React.useMemo(
    () =>
      RECENT_ORDER.map((g) => ({
        group: g,
        items: recents.filter((r) => r.group === g),
      })).filter((g) => g.items.length > 0),
    [recents],
  );

  function commitRename(chat: RecentChat, raw: string) {
    const next = raw.trim();
    setRenamingId(null);
    if (next && next !== chat.title) onRenameChat(chat.id, next);
  }

  return (
    <aside
      data-rail={collapsed ? "collapsed" : "expanded"}
      className={cn(
        "relative z-40 flex h-full flex-col gap-[6px] border-r border-[var(--border)] bg-[var(--sidebar)] px-[10px] py-3 transition-[width] duration-[260ms] ease-[cubic-bezier(.4,0,.2,1)]",
        collapsed ? "w-[60px]" : "w-[272px]",
      )}
    >
      {/* ---- rail-top: brand + collapse ---- */}
      <div
        className={cn(
          "flex items-center gap-[9px] px-[6px] pb-2 pt-1",
          collapsed && "justify-center px-0",
        )}
      >
        <div className="flex min-w-0 items-center gap-[9px] overflow-hidden">
          <div className="grid h-[30px] w-[30px] flex-none place-items-center overflow-hidden rounded-[9px] border border-[var(--border)] bg-[var(--primary)] font-[var(--font-display)] text-sm font-extrabold text-[var(--primary-text)]">
            {brandLogo ?? "W"}
          </div>
          {!collapsed && (
            <span className="flex items-center whitespace-nowrap text-[14.5px] font-bold tracking-[-0.01em] text-[var(--text)]">
              Wedevs
              <LiveDot className="ml-[2px]" />
            </span>
          )}
        </div>
        {!collapsed && (
          <Button
            variant="icon"
            className="ml-auto text-[var(--text-3)]"
            title="Collapse sidebar"
            aria-label="Collapse sidebar"
            onClick={onToggleCollapse}
          >
            <CollapseIcon />
          </Button>
        )}
      </div>

      {/* ---- search ---- */}
      <button
        type="button"
        aria-label="Search"
        onClick={onSearch}
        className={cn(
          "flex w-full items-center gap-[9px] rounded-[var(--radius-sm)] px-[11px] py-[9px] font-medium text-[var(--text-2)] transition-colors duration-100 hover:bg-[var(--hover)]",
          collapsed && "justify-center px-0",
        )}
      >
        <SearchIcon />
        {!collapsed && (
          <>
            <span className="flex-1 text-left text-[14px]">Search</span>
            <span className="rounded-md border border-[var(--border)] bg-[var(--hover)] px-[6px] py-[2px] font-[var(--font-mono)] text-[11px] text-[var(--text-3)]">
              ⌘K
            </span>
          </>
        )}
      </button>

      {/* ---- primary nav ---- */}
      <nav
        className={cn(
          "mt-1 flex flex-col gap-[2px] border-b border-[var(--border)] pb-[10px]",
          collapsed && "items-center",
        )}
      >
        <button
          type="button"
          aria-label="New chat"
          onClick={onNewChat}
          className={cn(
            navBase,
            "font-semibold text-[var(--text)]",
            collapsed && "justify-center px-0",
          )}
        >
          <PlusIcon />
          {!collapsed && (
            <>
              <span className="flex-1 truncate text-[14px]">New chat</span>
              <span className="rounded-md border border-[var(--border)] bg-[var(--hover)] px-[6px] py-[2px] font-[var(--font-mono)] text-[11px] text-[var(--text-3)]">
                ⌘N
              </span>
            </>
          )}
        </button>

        {nav.map((item) => {
          const active = item.id === activeNav;
          return (
            <button
              key={item.id}
              type="button"
              data-nav={item.id}
              data-active={active}
              aria-current={active ? "page" : undefined}
              onClick={() => onNavSelect(item.id)}
              className={cn(
                navBase,
                active && navActive,
                collapsed && "justify-center px-0",
              )}
            >
              <span className="flex-none text-[var(--text-3)] group-[[data-active=true]]:text-[var(--text-2)]">
                {item.icon}
              </span>
              {!collapsed && (
                <span className="flex-1 truncate text-[14px]">
                  {item.label}
                </span>
              )}
              {!collapsed && item.kbd && (
                <span className="rounded-md border border-[var(--border)] bg-[var(--hover)] px-[6px] py-[2px] font-[var(--font-mono)] text-[11px] text-[var(--text-3)]">
                  {item.kbd}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* ---- recents + projects list ---- */}
      {!collapsed && (
        <div className="-mx-1 mt-[6px] flex flex-1 flex-col gap-[2px] overflow-y-auto px-1">
          {groups.map(({ group, items }) => (
            <React.Fragment key={group}>
              <div className="flex items-center gap-2 px-[9px] pb-[5px] pt-[15px] text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-3)]">
                {group === "pinned" && <StarIcon small />}
                <span>{GROUP_LABEL[group]}</span>
                {(group === "today" || group === "previous7") && (
                  <span className="ml-auto font-medium">{items.length}</span>
                )}
              </div>

              {items.map((chat) =>
                renamingId === chat.id ? (
                  <RenameRow
                    key={chat.id}
                    chat={chat}
                    onCommit={(raw) => commitRename(chat, raw)}
                    onCancel={() => setRenamingId(null)}
                  />
                ) : (
                  <div
                    key={chat.id}
                    role="button"
                    tabIndex={0}
                    data-recent={chat.id}
                    onClick={() => onChatAction(chat.id, "pin") && undefined}
                    onDoubleClick={() => setRenamingId(chat.id)}
                    className={cn(navBase, "cursor-pointer")}
                  >
                    <ChatIcon />
                    <span className="min-w-0 flex-1 truncate text-[14px]">
                      {chat.title}
                    </span>
                    {chat.pinned ? (
                      <span className="flex-none text-[var(--text-3)]">
                        <StarIcon small />
                      </span>
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            aria-label={`Chat options for ${chat.title}`}
                            onClick={(e) => e.stopPropagation()}
                            className="ml-auto grid h-[22px] w-[22px] flex-none place-items-center rounded-md text-[var(--text-3)] opacity-0 transition-opacity hover:bg-[var(--active)] hover:text-[var(--text)] group-hover:opacity-100 focus-visible:opacity-100"
                          >
                            <DotsIcon />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem
                            onSelect={() => onChatAction(chat.id, "pin")}
                          >
                            <StarIcon small />
                            Pin
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => setRenamingId(chat.id)}
                          >
                            <RenameIcon />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => onChatAction(chat.id, "archive")}
                          >
                            <ArchiveIcon />
                            Archive
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            data-danger="true"
                            className="text-[var(--error)] data-[highlighted]:text-[var(--error)]"
                            onSelect={() => onChatAction(chat.id, "delete")}
                          >
                            <ArchiveIcon />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                ),
              )}
            </React.Fragment>
          ))}

          {projects.length > 0 && (
            <>
              <div className="flex items-center gap-2 px-[9px] pb-[5px] pt-[15px] text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-3)]">
                <FolderIcon small />
                <span>Projects</span>
              </div>
              {projects.map((p) => (
                <div
                  key={p.id}
                  role="button"
                  tabIndex={0}
                  className={cn(navBase, "cursor-pointer")}
                >
                  <span className="flex-none text-[var(--text-3)]">
                    <FolderIcon />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[14px]">
                    {p.name}
                  </span>
                  <span className="inline-flex h-5 items-center rounded-full border border-[var(--border)] bg-[var(--hover)] px-2 text-[11px] font-semibold text-[var(--text-2)]">
                    {p.count}
                  </span>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* collapsed spacer keeps account chip pinned to bottom */}
      {collapsed && <div className="flex-1" />}

      {/* ---- account ---- */}
      <div className="mt-[6px] flex flex-col gap-[2px] border-t border-[var(--border)] pt-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={`Account menu for ${account.name}`}
              className={cn(
                "flex items-center gap-[10px] rounded-[var(--radius-sm)] px-2 py-[7px] hover:bg-[var(--hover)]",
                collapsed && "justify-center px-0",
              )}
            >
              <span
                className="grid h-7 w-7 flex-none place-items-center rounded-full text-[12px] font-bold text-white"
                style={{
                  background: "linear-gradient(135deg,#6a7788,#3d4653)",
                }}
              >
                {account.initials}
              </span>
              {!collapsed && (
                <>
                  <span className="min-w-0 leading-[1.25]">
                    <span className="block truncate text-[13px] font-semibold text-[var(--text)]">
                      {account.name}
                    </span>
                    <span className="block text-[11.5px] text-[var(--text-3)]">
                      {account.plan}
                    </span>
                  </span>
                  <span className="ml-auto text-[var(--text-3)]">
                    <ChevronUpDownIcon />
                  </span>
                </>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onSelect={() => onAccountAction("profile")}>
              <ProfileIcon />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onAccountAction("settings")}>
              <GearIcon small />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onAccountAction("upgrade")}>
              <UpgradeIcon />
              Upgrade plan
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => onAccountAction("logout")}>
              <LogoutIcon />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          type="button"
          aria-label="Settings"
          onClick={() => onAccountAction("settings")}
          className={cn(navBase, collapsed && "justify-center px-0")}
        >
          <GearIcon />
          {!collapsed && (
            <span className="flex-1 truncate text-[14px]">Settings</span>
          )}
        </button>
      </div>
    </aside>
  );
}

// ---- inline rename row -----------------------------------------------------
interface RenameRowProps {
  chat: RecentChat;
  onCommit: (raw: string) => void;
  onCancel: () => void;
}
function RenameRow({ chat, onCommit, onCancel }: RenameRowProps) {
  const [value, setValue] = React.useState(chat.title);
  const committedRef = React.useRef(false);

  function finish(raw: string) {
    if (committedRef.current) return;
    committedRef.current = true;
    onCommit(raw);
  }

  return (
    <div className={cn(navBase, "cursor-default")}>
      <ChatIcon />
      <Input
        autoFocus
        aria-label="Rename chat"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={(e) => e.currentTarget.select()}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === "Enter") {
            e.preventDefault();
            finish(value);
          } else if (e.key === "Escape") {
            e.preventDefault();
            committedRef.current = true;
            onCancel();
          }
        }}
        onBlur={() => finish(value)}
        className="h-auto min-w-0 flex-1 rounded-md border border-[var(--accent-line)] bg-[var(--surface)] px-[7px] py-[2px] text-[14px] text-[var(--text)]"
      />
    </div>
  );
}
```

Notes on decisions made here (so the implementer understands the intent, not to change without cause):

- **`renamingId` state** drives the swap from a normal recent row to `<RenameRow>` (an `Input`), matching mockup rename JS 1463–1475. Enter commits the trimmed value (only firing `onRenameChat` when non-empty AND changed); Escape cancels; blur commits. `committedRef` prevents blur from double-firing after Enter/Escape.
- **Row menu** uses Radix `DropdownMenu` so `role="menu"`/`role="menuitem"` exist for the tests and for a11y. The `⋯` trigger stops click propagation so it doesn't trigger the row's own click. Pinned rows show a star instead of the `⋯` menu (mockup 768).
- **`onClick={() => onChatAction(chat.id, "pin") && undefined}`** on the row body is wrong intent — REPLACE that line: recents rows in the mockup open the chat, but `LeftRailProps` exposes no `onOpenChat`. So the row body click should be a **no-op** except double-click-to-rename. Change the row `onClick` to be omitted entirely (remove the `onClick` attribute on the recent-row `<div>`); keep only `onDoubleClick`. (This note supersedes the placeholder line in the snippet — do not ship the `&& undefined` expression.)
- **The rename `border-[var(--accent-line)]`** is faithful to mockup `.rename-input` (679) which intentionally uses `--accent-line` as an active-input affordance — this is the composer/focus-affordance exception in the brand rule (a focus-state border), NOT a selection color. It is the only other place `--accent-line` appears and it is allowed. Selection (active nav/recent) remains neutral.
- **`--accent` appears only in `<LiveDot />`** (logo-dot) and the rename input's focus border. Everything else is `--primary`/`--active`/`--active-line`/`--hover`/`--text*` — neutral.

- [ ] **Step 3b: Fix the recent-row click intent.** In the recent-row `<div>` (the non-rename branch), remove the `onClick={() => onChatAction(chat.id, "pin") && undefined}` attribute entirely. The div keeps `role="button"`, `tabIndex={0}`, `data-recent`, `onDoubleClick`, and `className`. (The `onChatAction("pin")` in the test for the row menu is fired by the menu's Pin `menuitem`, not by the row body.)

  After this fix, update the test `it("row ⋯ menu opens ...")` — it already clicks the menu's Pin item, so no test change is needed. Confirm the earlier test `onNavSelect ... on click` still targets the primary-nav buttons (it does — it clicks the "Code" nav button).

- [ ] **Step 4: Add the barrel export.** In `packages/ui/src/index.ts`, add:

  ```ts
  export { LeftRail } from "./components/LeftRail/LeftRail";
  export type { LeftRailProps } from "./components/LeftRail/LeftRail";
  ```

  Place it alongside the other `components/*` exports, keeping alphabetical/section grouping consistent with the file's existing convention.

- [ ] **Step 5: Run the test — expect GREEN.**

  ```bash
  cd packages/ui && pnpm vitest run src/components/LeftRail/LeftRail.test.tsx
  ```

  Expected output: `Test Files 1 passed` and all `it(...)` cases passing (roughly 15 tests). If the `role="menu"` queries fail, verify Task 5's `DropdownMenuContent` renders into a portal that RTL can find (it does — Radix renders to `document.body`, which `screen`/`findByRole` search). If `data-[highlighted]` class assertions are irrelevant, ignore — the tests only assert `data-danger="true"` on the delete item, which is set explicitly.

- [ ] **Step 6: Typecheck the package.**

  ```bash
  cd packages/ui && pnpm exec tsc --noEmit
  ```

  Expected output: no errors (exit 0). If `group-[[data-active=true]]:` arbitrary variant errors under the Tailwind linter, it is a CSS-only concern (not TS) — `tsc` will not flag it. Resolve any real TS errors (no `any`, all imports resolve).

- [ ] **Step 7: Lint.**

  ```bash
  cd packages/ui && pnpm exec eslint src/components/LeftRail
  ```

  Expected output: no errors. Fix any unused-import or `react/no-unescaped-entities` issues (the em-dash in fixtures is fine; it lives in the test file).

- [ ] **Step 8: Commit.**

  ```bash
  git add packages/ui/src/components/LeftRail packages/ui/src/index.ts
  git commit -m "feat(ui): add LeftRail sidebar (brand, nav, recents, projects, account)"
  ```

  Expected output: one commit created with 3 files changed.

---

**Definition of done:**

- `packages/ui/src/components/LeftRail/LeftRail.tsx` exports `LeftRail` and `LeftRailProps` (props verbatim from the shared contract); re-exported from `packages/ui/src/index.ts`.
- `pnpm vitest run src/components/LeftRail/LeftRail.test.tsx` passes: renders both modes; collapsed hides brand name, labels, group headers, recents/projects list, and account meta and centers icons (`data-rail="collapsed"`); active nav row carries `data-active="true"` and a class containing `var(--active)` with NO `accent` substring; `⋯` row menu opens (`role="menu"`) and fires `onChatAction` with `pin` and danger `delete` (`data-danger="true"`); double-click a recent swaps to a rename `Input` (`aria-label="Rename chat"`) and Enter commits the trimmed value via `onRenameChat(id, title)`, Escape reverts, empty stays; account chip menu and dedicated Settings row fire `onAccountAction`.
- The ONLY `--accent`-family tokens used are `<LiveDot />` (logo-dot) and the rename input's `--accent-line` focus border; selection/active/hover/primary are all neutral tokens.
- `tsc --noEmit` and `eslint` are clean; both light and dark render correctly (all colors via tokens; the only literal hex is the decorative avatar gradient).
- Work committed with a Conventional Commit (`feat(ui): …`).

---

### Task 8: TopBar + Model/Agent selector popover

Build the workspace top bar and its model/agent selector popover. The `TopBar` is the 56px chrome row above the conversation: a rail-open hamburger, the model **selector** (a standalone `ModelSelector` component in its `"topbar"` variant), a center inline-editable session title, and a right-hand action cluster (Share, an Inspector open/pin control, and a chat-menu button). The `ModelSelector` is its own exported component with two visual **variants** — `"topbar"` (the selector button used here) and `"pill"` (the compact composer agent-pill used by Task 9) — sharing one Radix `Popover` whose body is a Models/Agents `Tabs` set, a search `Input`, grouped model rows with capability chips, and a footer.

This task is **NEUTRAL-first**. Volt (`--accent`) is reserved for _alive_ things; nothing in the TopBar or selector is "alive". The mockup's selector button, popover tabs, selected row, selected-row glyph, and Inspector toggle all use neutral tokens (`--hover`/`--active`/`--primary`/`--primary-text`). The **only** Volt permitted in this task is the keyboard `:focus-visible` ring (`--accent-line`). There is **no** `<LiveDot/>` here — the mockup shows no availability dot in the selector, rows, or pill (see Design decision 1).

**Design decisions (resolve mockup gaps — implement exactly as stated, do NOT re-derive):**

1. **No live dot.** The topbar selector button (mockup 811-817), the popover rows (826-869), and the composer agent-pill (924) render _no_ liveness dot. Per the brand rule the only Volt in this task is the keyboard `:focus-visible` ring (`--accent-line`). Do **not** import or render `<LiveDot/>`.
2. **Selected row + glyph stay neutral.** The mockup paints `.mrow.sel` with `--active` (442) and `.mrow.sel .mrow-ic` with `--primary` / `--primary-text` (445) — both NEUTRAL. Reproduce exactly; never substitute Volt for the selected state or its check mark (`--text-2`, 448).
3. **Popover rise/fade is the primitive's job.** The open/close animation is supplied by the Radix `Popover` primitive's built-in `data-[state]` transitions (Task 5). The mockup's `@keyframes pop` (434) is the visual reference for the "rise 6px + fade" feel only — do **not** hand-author keyframes.
4. **Agents reuse the single `onSelectModel` callback.** The canonical contract exposes exactly one selection callback (`onSelectModel(id)`) and one `selectedModelId`. The mockup treats agent rows identically to model rows — both are `data-act="pick-model"` and both overwrite `.sel-name` (1560-1564). So clicking an agent calls `onSelectModel(agent.id)`, and the trigger label resolves from `models` first, then falls back to `agents`.
5. **Inspector control is a toggle + a conditional pin.** The contract needs both `onPanelToggle` (closed↔float) and `onPanelPin` (float↔pinned) reachable from the TopBar. Render the panel-toggle icon button **always** (it reflects "open" via active styling + `aria-pressed`), and render a separate pin icon button **only when `panel !== "closed"`** (it reflects "pinned" via `aria-pressed`). This composes with the Inspector's own in-panel pin/close from Task 10.
6. **Search is functional, not decorative.** The mockup's search box (825 / 675-678) is static chrome; here it is wired to filter _both_ panes case-insensitively (models by name/tags, agents by name/persona/specialty) so the `Input` is real behavior.
7. **Title edit trigger = click or double-click.** The mockup's `.title` uses a single-click `data-act="rename"` (876) while the rail uses dblclick (1475). TopBar wires **both** `onClick` and `onDoubleClick` to enter edit mode. The commit/revert semantics mirror the rail's `done()` exactly (1471-1473): Enter/blur commit `value.trim() || oldTitle`; Escape reverts.

---

**Files:**

Create:

- `packages/ui/src/components/TopBar/ModelSelector.tsx`
- `packages/ui/src/components/TopBar/ModelSelector.test.tsx`
- `packages/ui/src/components/TopBar/TopBar.tsx`
- `packages/ui/src/components/TopBar/TopBar.test.tsx`

Modify:

- `packages/ui/src/index.ts` — add the barrel exports for `TopBar`, `ModelSelector`, and the associated prop types.

Do **not** modify `packages/ui/src/types.ts` — every shared type below already exists there (added by a foundation task); you only import them.

---

**Interfaces:**

Consumes (from Task 5 primitives, the shared `cn` helper, and the shared contract — do NOT redefine):

```ts
// packages/ui/src/lib/cn.ts
export function cn(...inputs: ClassValue[]): string;

// primitives (Task 5) — standard shadcn export names
// ../../primitives/popover -> Popover, PopoverTrigger, PopoverContent   (Radix Root/Trigger/Content; Content forwards align/sideOffset/className)
// ../../primitives/tabs    -> Tabs, TabsList, TabsTrigger, TabsContent   (Radix value/onValueChange; TabsTrigger role="tab")
// ../../primitives/input   -> Input      (native input props; forwards value/onChange/className)
// ../../primitives/button  -> Button     (variant?: "primary"|"ghost"|"outline"|"danger"|"icon"; forwards className/aria-*/onClick)

// shared domain types (packages/ui/src/types.ts) — ALREADY DEFINED, import only
export interface ModelOption {
  id: string;
  name: string;
  group: "frontier" | "fast" | "local";
  sub?: string;
  tags: string[];
}
export interface AgentOption {
  id: string;
  name: string;
  persona: string;
  specialty: string;
}
export interface ModelSelectorProps {
  models: ModelOption[];
  agents: AgentOption[];
  selectedModelId: string;
  onSelectModel: (id: string) => void;
  variant?: "topbar" | "pill";
}
export type PanelMode = "closed" | "float" | "pinned";
export interface TopBarProps {
  title: string;
  onTitleChange: (title: string) => void;
  selector: ModelSelectorProps;
  panel: PanelMode;
  onPanelToggle: () => void; // closed <-> float
  onPanelPin: () => void; // float  <-> pinned
  onShare: () => void;
  onChatMenu: () => void;
  onRailOpen: () => void;
}
```

Produces:

```ts
export function ModelSelector(props: ModelSelectorProps): JSX.Element;
export function TopBar(props: TopBarProps): JSX.Element;
```

---

**Visual source of truth** — `d:/Rajin/Wedevs.cloud/mockup/index.html` (cite exact lines; port markup + styles):

- **TopBar shell** `.topbar` (56px, flex, gap, `border-bottom`, `--bg`): lines **167-168**; markup **806**.
- **Rail-open** `.rail-open-btn`: line **169**; markup **807-809**.
- **Selector button** `.selector`/`.sel-btn`(+hover)/`.sel-glyph`/`.sel-name`/`.sel-sub`/`.chev`: lines **172-181**; markup **811-817**.
- **Popover shell** `.popover` + `@keyframes pop`: lines **430-434**; inset-highlight polish **660**; markup **819-820**.
- **Popover tabs** `.pop-tabs`/`.ptab`(+`.active` = `--active`): lines **435-437**; markup **821-824**.
- **Popover search** `.pop-search`(icon + input + placeholder): lines **675-678**; markup **825**.
- **Scroll + panes** `.pop-scroll`/`.mtab-pane`(+`.active`): lines **438-439**.
- **Model rows** `.mrow`(+`:hover`)/`.mrow.sel` = `--active`/`.mrow-ic`/`.mrow.sel .mrow-ic` = `--primary`+`--primary-text`/`.mrow-body`/`.mrow-name`(+`.check` = `--text-2`)/`.mrow-desc`/`.mrow-tags`: lines **440-450**; markup models **826-855**, agents **856-869**.
- **Group label** `.grp-lbl`: line **451**; markup **828 / 837 / 846**.
- **Popover footer** `.pop-foot`/`.pop-foot .btn`: lines **452-453**; markup **871**.
- **Capability chip** `.tag`: lines **97-98**.
- **Title** `.title-wrap`/`.title`(+`:hover`, `.t` ellipsis, `.icon` hover-reveal): lines **183-189**; markup **875-880**.
- **Right actions** `.top-actions`/`.ibtn`(+`:hover`, `.on` = `--active`)/`.btn-share`(+`:hover`): lines **191-198**; markup **882-891**.
- **Pill variant** `.agent-pill`(+`:hover`, `.chev`): lines **638-640**; markup **924**.
- **Inline rename behavior** (Enter/Escape/blur → `value.trim() || old`): JS **1463-1475**; unified pick-model set-name: JS **1560-1564**.
- **Neutral/Volt tokens** (`--surface`,`--surface-2`,`--hover`,`--active`,`--border`,`--border-2`,`--primary`,`--primary-text`,`--text`,`--text-2`,`--text-3`,`--elevated`,`--shadow`,`--radius`,`--radius-sm`,`--radius-xs`,`--accent-line`,`--bg`): lines **20-29** (light) / **33-41** (dark).

---

**Steps:**

- [ ] **Step 1: Write the failing `ModelSelector` test.** Create `packages/ui/src/components/TopBar/ModelSelector.test.tsx` with this exact content:

```tsx
import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ModelSelector } from "./ModelSelector";
import type { ModelOption, AgentOption, ModelSelectorProps } from "../../types";

// Radix Popover (popper) + user-event need these jsdom shims.
beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  });
  if (typeof window.ResizeObserver === "undefined") {
    window.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
  }
  const proto = Element.prototype as unknown as {
    hasPointerCapture?: (id: number) => boolean;
    setPointerCapture?: (id: number) => void;
    releasePointerCapture?: (id: number) => void;
    scrollIntoView?: () => void;
  };
  proto.hasPointerCapture ||= () => false;
  proto.setPointerCapture ||= () => {};
  proto.releasePointerCapture ||= () => {};
  proto.scrollIntoView ||= () => {};
});

const models: ModelOption[] = [
  {
    id: "atlas-pro",
    name: "Atlas Pro",
    group: "frontier",
    sub: "Deepest reasoning for complex, multi-step work.",
    tags: ["Reasoning", "Vision", "Long context", "Tools"],
  },
  {
    id: "atlas-air",
    name: "Atlas Air",
    group: "fast",
    sub: "Snappy responses for everyday tasks & drafts.",
    tags: ["Speed", "Vision", "Tools"],
  },
  {
    id: "nova-local",
    name: "Nova Local",
    group: "local",
    sub: "Runs on your machine — private, offline-capable.",
    tags: ["Private", "Offline"],
  },
];

const agents: AgentOption[] = [
  {
    id: "writer",
    name: "Writer",
    persona: "Long-form drafting",
    specialty: "Atlas Pro + web search",
  },
  {
    id: "coder",
    name: "Coder",
    persona: "Code + repo tools",
    specialty: "Atlas Pro + sandbox",
  },
  {
    id: "analyst",
    name: "Analyst",
    persona: "Data & charts",
    specialty: "Atlas Pro + code interpreter",
  },
];

function setup(overrides: Partial<ModelSelectorProps> = {}) {
  const props: ModelSelectorProps = {
    models,
    agents,
    selectedModelId: "atlas-pro",
    onSelectModel: vi.fn(),
    variant: "topbar",
    ...overrides,
  };
  const utils = render(<ModelSelector {...props} />);
  return { ...utils, props };
}

describe("ModelSelector", () => {
  it("topbar trigger shows the selected model name and its group", () => {
    setup();
    expect(screen.getByText("Atlas Pro")).toBeInTheDocument();
    expect(screen.getByText("· frontier")).toBeInTheDocument();
  });

  it("opens the popover and renders models grouped by tier", () => {
    setup();
    // while closed there is exactly one button: the trigger
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText("Frontier")).toBeInTheDocument();
    expect(screen.getByText("Fast")).toBeInTheDocument();
    expect(screen.getByText("Local")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /atlas air/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /nova local/i }),
    ).toBeInTheDocument();
    // selected row renders its capability chips
    expect(screen.getByText("Reasoning")).toBeInTheDocument();
    expect(screen.getByText("Long context")).toBeInTheDocument();
  });

  it("fires onSelectModel with the model id when a row is clicked", () => {
    const { props } = setup();
    fireEvent.click(screen.getByRole("button")); // open
    fireEvent.click(screen.getByRole("button", { name: /atlas air/i }));
    expect(props.onSelectModel).toHaveBeenCalledWith("atlas-air");
  });

  it("switching to the Agents tab reveals the agents", () => {
    setup();
    fireEvent.click(screen.getByRole("button")); // open
    fireEvent.click(screen.getByRole("tab", { name: "Agents" }));
    expect(screen.getByRole("button", { name: /writer/i })).toBeInTheDocument();
    expect(screen.getByText("Long-form drafting")).toBeInTheDocument();
    expect(screen.getByText("Atlas Pro + web search")).toBeInTheDocument();
  });

  it("selecting an agent fires onSelectModel with the agent id", () => {
    const { props } = setup();
    fireEvent.click(screen.getByRole("button")); // open
    fireEvent.click(screen.getByRole("tab", { name: "Agents" }));
    fireEvent.click(screen.getByRole("button", { name: /coder/i }));
    expect(props.onSelectModel).toHaveBeenCalledWith("coder");
  });

  it("filters rows as the user types in the search box", async () => {
    const user = userEvent.setup();
    setup();
    fireEvent.click(screen.getByRole("button")); // open
    const search = screen.getByRole("textbox", {
      name: /search models and agents/i,
    });
    await user.type(search, "air");
    expect(
      screen.getByRole("button", { name: /atlas air/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /nova local/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Local")).not.toBeInTheDocument();
  });

  it("pill variant renders the compact rounded pill trigger", () => {
    setup({ variant: "pill" });
    const trigger = screen.getByRole("button");
    expect(trigger).toHaveTextContent("Atlas Pro");
    expect(trigger.className).toContain("rounded-full");
  });
});
```

- [ ] **Step 2: Run the `ModelSelector` test — expect FAIL (module not found).**
      Command: `pnpm --filter @wedevs/ui test -- --run src/components/TopBar/ModelSelector.test.tsx`
      Expected output: Vitest cannot resolve `./ModelSelector` — `Error: Failed to load url ./ModelSelector` / `Cannot find module`. 0 tests pass. This confirms the harness runs and the file is wired up.

- [ ] **Step 3: Implement `ModelSelector.tsx`.** Create `packages/ui/src/components/TopBar/ModelSelector.tsx` with this exact content:

```tsx
"use client";

import * as React from "react";
import {
  Box,
  Zap,
  Cpu,
  Bot,
  Search,
  ChevronDown,
  Check,
  Settings2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "../../lib/cn";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "../../primitives/popover";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../../primitives/tabs";
import { Input } from "../../primitives/input";
import { Button } from "../../primitives/button";
import type { ModelOption, AgentOption, ModelSelectorProps } from "../../types";

// mockup 828 / 837 / 846 — fixed display order + labels of the model groups
const GROUP_ORDER: ModelOption["group"][] = ["frontier", "fast", "local"];
const GROUP_LABEL: Record<ModelOption["group"], string> = {
  frontier: "Frontier",
  fast: "Fast",
  local: "Local",
};
const GROUP_ICON: Record<ModelOption["group"], LucideIcon> = {
  frontier: Box,
  fast: Zap,
  local: Cpu,
};

function includes(haystack: string, needle: string) {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

// mockup 97-98: neutral capability chip (--hover fill, --border, --text-2)
function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex h-5 items-center gap-[5px] whitespace-nowrap rounded-full border border-[var(--border)] bg-[var(--hover)] px-2 text-[11px] font-semibold text-[var(--text-2)]">
      {children}
    </span>
  );
}

// mockup 172-181: the topbar selector button (neutral surface, hover border)
function TopbarTrigger({ model }: { model?: ModelOption }) {
  return (
    <button
      type="button"
      className={cn(
        "flex items-center gap-[9px] rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-2.5 py-[7px]",
        "hover:border-[var(--border-2)] hover:bg-[var(--hover)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-line)]",
      )}
    >
      <span className="grid h-[22px] w-[22px] flex-none place-items-center rounded-[7px] bg-[var(--hover)] text-[var(--text-2)]">
        <Box className="h-3.5 w-3.5" strokeWidth={1.8} />
      </span>
      <span className="text-[13.5px] font-semibold text-[var(--text)]">
        {model?.name ?? "Select model"}
      </span>
      {model && (
        <span className="-ml-1 font-mono text-[11.5px] text-[var(--text-3)]">
          · {model.group}
        </span>
      )}
      <ChevronDown className="h-3.5 w-3.5 text-[var(--text-3)]" />
    </button>
  );
}

// mockup 638-640 / 924: the compact composer agent-pill (rounded-full)
function PillTrigger({ label }: { label: string }) {
  return (
    <button
      type="button"
      className={cn(
        "ml-[3px] inline-flex items-center gap-[7px] rounded-full border border-[var(--border)] py-[5px] pl-1.5 pr-2.5 text-[12.5px] font-semibold text-[var(--text-2)]",
        "hover:border-[var(--border-2)] hover:bg-[var(--hover)] hover:text-[var(--text)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-line)]",
      )}
    >
      <span className="grid h-[18px] w-[18px] flex-none place-items-center rounded-md bg-[var(--hover)] text-[var(--text-2)]">
        <Box className="h-[11px] w-[11px]" strokeWidth={1.8} />
      </span>
      {label}
      <ChevronDown className="h-3.5 w-3.5 text-[var(--text-3)]" />
    </button>
  );
}

// mockup 440-450: one model row. Selected = --active row + --primary glyph + check.
function ModelRow({
  model,
  selected,
  onPick,
}: {
  model: ModelOption;
  selected: boolean;
  onPick: () => void;
}) {
  const Icon = GROUP_ICON[model.group];
  return (
    <button
      type="button"
      onClick={onPick}
      aria-pressed={selected}
      className={cn(
        "flex w-full items-start gap-[11px] rounded-[11px] p-[11px] text-left",
        "hover:bg-[var(--hover)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-line)]",
        selected && "bg-[var(--active)]",
      )}
    >
      <span
        className={cn(
          "grid h-8 w-8 flex-none place-items-center rounded-[9px] border",
          selected
            ? "border-transparent bg-[var(--primary)] text-[var(--primary-text)]"
            : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-2)]",
        )}
      >
        <Icon className="h-[15px] w-[15px]" strokeWidth={1.8} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 text-[13.5px] font-bold text-[var(--text)]">
          {model.name}
          {selected && (
            <Check className="ml-auto h-[15px] w-[15px] flex-none text-[var(--text-2)]" />
          )}
        </span>
        {model.sub && (
          <span className="mt-0.5 block text-[12px] text-[var(--text-3)]">
            {model.sub}
          </span>
        )}
        {model.tags.length > 0 && (
          <span className="mt-[7px] flex flex-wrap gap-[5px]">
            {model.tags.map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
          </span>
        )}
      </span>
    </button>
  );
}

// mockup 856-869: one agent row — name + persona + specialty chip.
function AgentRow({
  agent,
  onPick,
}: {
  agent: AgentOption;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      className={cn(
        "flex w-full items-start gap-[11px] rounded-[11px] p-[11px] text-left",
        "hover:bg-[var(--hover)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-line)]",
      )}
    >
      <span className="grid h-8 w-8 flex-none place-items-center rounded-[9px] border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-2)]">
        <Bot className="h-[15px] w-[15px]" strokeWidth={1.8} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13.5px] font-bold text-[var(--text)]">
          {agent.name}
        </span>
        <span className="mt-0.5 block text-[12px] text-[var(--text-3)]">
          {agent.persona}
        </span>
        <span className="mt-[7px] flex flex-wrap gap-[5px]">
          <Tag>{agent.specialty}</Tag>
        </span>
      </span>
    </button>
  );
}

// mockup 436-437: neutral popover tab chip (active = --active/--text, NO accent)
const ptabClass = cn(
  "flex-1 rounded-[9px] px-2 py-2 text-center text-[13px] font-semibold text-[var(--text-3)]",
  "data-[state=inactive]:hover:text-[var(--text-2)]",
  "data-[state=active]:bg-[var(--active)] data-[state=active]:text-[var(--text)]",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-line)]",
);

export function ModelSelector({
  models,
  agents,
  selectedModelId,
  onSelectModel,
  variant = "topbar",
}: ModelSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [tab, setTab] = React.useState<"models" | "agents">("models");
  const [query, setQuery] = React.useState("");

  const selectedModel = models.find((m) => m.id === selectedModelId);
  const selectedAgent = agents.find((a) => a.id === selectedModelId);
  // Design decision 4: label resolves from models first, then agents.
  const triggerLabel =
    selectedModel?.name ?? selectedAgent?.name ?? "Select model";

  const q = query.trim();
  const visibleModels = q
    ? models.filter(
        (m) => includes(m.name, q) || m.tags.some((t) => includes(t, q)),
      )
    : models;
  const visibleAgents = q
    ? agents.filter(
        (a) =>
          includes(a.name, q) ||
          includes(a.persona, q) ||
          includes(a.specialty, q),
      )
    : agents;

  const pick = (id: string) => {
    onSelectModel(id);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {variant === "pill" ? (
          <PillTrigger label={triggerLabel} />
        ) : (
          <TopbarTrigger model={selectedModel} />
        )}
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={8}
        className="flex w-[360px] flex-col overflow-hidden rounded-[var(--radius)] border border-[var(--border-2)] bg-[var(--elevated)] p-0 shadow-[var(--shadow)]"
      >
        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as "models" | "agents")}
          className="flex min-h-0 flex-col"
        >
          <TabsList className="flex gap-[3px] px-2.5 pt-2.5">
            <TabsTrigger value="models" className={ptabClass}>
              Models
            </TabsTrigger>
            <TabsTrigger value="agents" className={ptabClass}>
              Agents
            </TabsTrigger>
          </TabsList>

          {/* mockup 675-678: search field */}
          <div className="mx-2 mb-1 mt-2 flex items-center gap-2 rounded-[9px] border border-[var(--border)] bg-[var(--surface)] px-[11px] py-2">
            <Search className="h-4 w-4 flex-none text-[var(--text-3)]" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search models & agents…"
              aria-label="Search models and agents"
              className="h-auto flex-1 border-none bg-transparent p-0 text-[13px] text-[var(--text)] shadow-none outline-none focus-visible:ring-0"
            />
          </div>

          <div className="max-h-[390px] overflow-y-auto p-2">
            <TabsContent value="models" className="mt-0">
              {GROUP_ORDER.map((group) => {
                const rows = visibleModels.filter((m) => m.group === group);
                if (rows.length === 0) return null;
                return (
                  <div key={group}>
                    <div className="px-[11px] pb-1 pt-2.5 text-[10.5px] font-bold uppercase tracking-[0.07em] text-[var(--text-3)]">
                      {GROUP_LABEL[group]}
                    </div>
                    {rows.map((m) => (
                      <ModelRow
                        key={m.id}
                        model={m}
                        selected={m.id === selectedModelId}
                        onPick={() => pick(m.id)}
                      />
                    ))}
                  </div>
                );
              })}
              {visibleModels.length === 0 && (
                <p className="px-[11px] py-6 text-center text-[13px] text-[var(--text-3)]">
                  No models match your search.
                </p>
              )}
            </TabsContent>

            <TabsContent value="agents" className="mt-0">
              {visibleAgents.map((a) => (
                <AgentRow key={a.id} agent={a} onPick={() => pick(a.id)} />
              ))}
              {visibleAgents.length === 0 && (
                <p className="px-[11px] py-6 text-center text-[13px] text-[var(--text-3)]">
                  No agents match your search.
                </p>
              )}
            </TabsContent>
          </div>
        </Tabs>

        {/* mockup 452-453: footer */}
        <div className="border-t border-[var(--border)] p-[9px]">
          <Button
            variant="ghost"
            type="button"
            className="w-full justify-start gap-2 text-[13px] text-[var(--text-2)]"
          >
            <Settings2 className="h-4 w-4" />
            Manage models &amp; agents
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
```

Notes: (1) `variant` defaults to `"topbar"`; `"pill"` swaps only the trigger — the popover body is identical. (2) The popover is **controlled** (`open`/`onOpenChange`) so a row click can both call `onSelectModel` and dismiss via `setOpen(false)`. (3) Every accent reference (`--accent-line`) is a `focus-visible` ring only; the selected row/glyph/check use `--active`/`--primary`/`--text-2`. (4) `Manage &amp; agents` is written as an HTML entity to satisfy `react/no-unescaped-entities`.

- [ ] **Step 4: Run the `ModelSelector` test — expect PASS.**
      Command: `pnpm --filter @wedevs/ui test -- --run src/components/TopBar/ModelSelector.test.tsx`
      Expected output: `Test Files  1 passed (1)` / `Tests  7 passed (7)`. If a Radix Popover/Tabs interaction throws `ResizeObserver is not defined` or `hasPointerCapture is not a function`, confirm the `beforeAll` shim block is present (it is). If `Cpu`/`Bot`/`Settings2` fail to import, they are valid `lucide-react` exports — check the import spelling.

- [ ] **Step 5: Write the failing `TopBar` test.** Create `packages/ui/src/components/TopBar/TopBar.test.tsx` with this exact content:

```tsx
import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TopBar } from "./TopBar";
import type { ModelSelectorProps, TopBarProps } from "../../types";

// TopBar renders ModelSelector (Radix Popover); keep the same jsdom shims.
beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  });
  if (typeof window.ResizeObserver === "undefined") {
    window.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
  }
});

const selector: ModelSelectorProps = {
  models: [
    {
      id: "atlas-pro",
      name: "Atlas Pro",
      group: "frontier",
      sub: "Deepest reasoning.",
      tags: ["Reasoning"],
    },
  ],
  agents: [
    {
      id: "writer",
      name: "Writer",
      persona: "Long-form drafting",
      specialty: "Atlas Pro + web search",
    },
  ],
  selectedModelId: "atlas-pro",
  onSelectModel: vi.fn(),
};

function setup(overrides: Partial<TopBarProps> = {}) {
  const props: TopBarProps = {
    title: "Q3 go-to-market plan",
    onTitleChange: vi.fn(),
    selector,
    panel: "closed",
    onPanelToggle: vi.fn(),
    onPanelPin: vi.fn(),
    onShare: vi.fn(),
    onChatMenu: vi.fn(),
    onRailOpen: vi.fn(),
    ...overrides,
  };
  const utils = render(<TopBar {...props} />);
  return { ...utils, props };
}

describe("TopBar", () => {
  it("renders the title and the topbar model selector", () => {
    setup();
    expect(screen.getByText("Q3 go-to-market plan")).toBeInTheDocument();
    expect(screen.getByText("Atlas Pro")).toBeInTheDocument();
    expect(screen.getByText("· frontier")).toBeInTheDocument();
  });

  it("fires the chrome callbacks (rail / share / toggle / menu)", () => {
    const { props } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    expect(props.onRailOpen).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Share" }));
    expect(props.onShare).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Toggle inspector" }));
    expect(props.onPanelToggle).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "More" }));
    expect(props.onChatMenu).toHaveBeenCalledTimes(1);
  });

  it("the panel toggle reflects state and the pin button appears only when open", () => {
    const { props, rerender } = setup({ panel: "closed" });
    expect(
      screen.getByRole("button", { name: "Toggle inspector" }),
    ).toHaveAttribute("aria-pressed", "false");
    expect(
      screen.queryByRole("button", { name: "Pin inspector" }),
    ).not.toBeInTheDocument();

    rerender(<TopBar {...props} panel="float" />);
    expect(
      screen.getByRole("button", { name: "Toggle inspector" }),
    ).toHaveAttribute("aria-pressed", "true");
    const pin = screen.getByRole("button", { name: "Pin inspector" });
    expect(pin).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(pin);
    expect(props.onPanelPin).toHaveBeenCalledTimes(1);

    rerender(<TopBar {...props} panel="pinned" />);
    expect(
      screen.getByRole("button", { name: "Pin inspector" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("commits a trimmed title on Enter", () => {
    const { props } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Rename session" }));
    const input = screen.getByRole("textbox", { name: "Session title" });
    fireEvent.change(input, { target: { value: "  Launch plan  " } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(props.onTitleChange).toHaveBeenCalledWith("Launch plan");
  });

  it("reverts on Escape without calling onTitleChange", () => {
    const { props } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Rename session" }));
    const input = screen.getByRole("textbox", { name: "Session title" });
    fireEvent.change(input, { target: { value: "Changed" } });
    fireEvent.keyDown(input, { key: "Escape" });
    expect(props.onTitleChange).not.toHaveBeenCalled();
    expect(screen.getByText("Q3 go-to-market plan")).toBeInTheDocument();
  });

  it("commits on blur", () => {
    const { props } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Rename session" }));
    const input = screen.getByRole("textbox", { name: "Session title" });
    fireEvent.change(input, { target: { value: "Blurred title" } });
    fireEvent.blur(input);
    expect(props.onTitleChange).toHaveBeenCalledWith("Blurred title");
  });

  it("keeps the previous title when committing an empty value", () => {
    const { props } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Rename session" }));
    const input = screen.getByRole("textbox", { name: "Session title" });
    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(props.onTitleChange).toHaveBeenCalledWith("Q3 go-to-market plan");
  });
});
```

- [ ] **Step 6: Run the `TopBar` test — expect FAIL (module not found).**
      Command: `pnpm --filter @wedevs/ui test -- --run src/components/TopBar/TopBar.test.tsx`
      Expected output: Vitest cannot resolve `./TopBar` — `Error: Failed to load url ./TopBar` / `Cannot find module`. 0 tests pass.

- [ ] **Step 7: Implement `TopBar.tsx`.** Create `packages/ui/src/components/TopBar/TopBar.tsx` with this exact content:

```tsx
"use client";

import * as React from "react";
import {
  Menu,
  Share2,
  PanelRight,
  Pin,
  MoreHorizontal,
  Pencil,
} from "lucide-react";
import { cn } from "../../lib/cn";
import { Button } from "../../primitives/button";
import { ModelSelector } from "./ModelSelector";
import type { TopBarProps } from "../../types";

export function TopBar({
  title,
  onTitleChange,
  selector,
  panel,
  onPanelToggle,
  onPanelPin,
  onShare,
  onChatMenu,
  onRailOpen,
}: TopBarProps) {
  const open = panel !== "closed";
  const pinned = panel === "pinned";

  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(title);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // keep the draft aligned with upstream title changes while not editing
  React.useEffect(() => {
    if (!editing) setDraft(title);
  }, [title, editing]);

  // focus + select the field when edit mode opens
  React.useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const startEdit = () => {
    setDraft(title);
    setEditing(true);
  };
  // mockup 1471-1473: done(value.trim() || old)
  const commit = () => {
    onTitleChange(draft.trim() || title);
    setEditing(false);
  };
  const cancel = () => {
    setDraft(title);
    setEditing(false);
  };

  return (
    <header className="flex h-14 flex-none items-center gap-2.5 border-b border-[var(--border)] bg-[var(--bg)] px-3.5">
      {/* mockup 807-809: rail-open hamburger */}
      <Button
        variant="icon"
        type="button"
        aria-label="Open menu"
        onClick={onRailOpen}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* mockup 811-817: model/agent selector */}
      <ModelSelector variant="topbar" {...selector} />

      {/* mockup 875-880: center inline-editable session title */}
      <div className="flex min-w-0 flex-1 justify-center">
        {editing ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commit();
              } else if (e.key === "Escape") {
                e.preventDefault();
                cancel();
              }
            }}
            onBlur={commit}
            aria-label="Session title"
            className="min-w-0 max-w-full rounded-md border border-[var(--accent-line)] bg-[var(--surface)] px-[7px] py-0.5 text-sm text-[var(--text)] outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={startEdit}
            onDoubleClick={startEdit}
            aria-label="Rename session"
            className={cn(
              "group inline-flex max-w-full cursor-text items-center gap-2 rounded-[var(--radius-xs)] px-2.5 py-1.5 text-sm font-medium text-[var(--text-2)]",
              "hover:bg-[var(--hover)] hover:text-[var(--text)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-line)]",
            )}
          >
            <span className="truncate">{title}</span>
            <Pencil className="h-3.5 w-3.5 flex-none text-[var(--text-3)] opacity-0 group-hover:opacity-100" />
          </button>
        )}
      </div>

      {/* mockup 882-891: right-hand action cluster */}
      <div className="flex flex-none items-center gap-1">
        <Button
          variant="outline"
          type="button"
          onClick={onShare}
          className="gap-[7px] px-3 py-[7px] text-[13px] font-semibold"
        >
          <Share2 className="h-4 w-4" />
          <span>Share</span>
        </Button>

        <Button
          variant="icon"
          type="button"
          aria-label="Toggle inspector"
          aria-pressed={open}
          onClick={onPanelToggle}
          className={cn(open && "bg-[var(--active)] text-[var(--text)]")}
        >
          <PanelRight className="h-5 w-5" />
        </Button>

        {open && (
          <Button
            variant="icon"
            type="button"
            aria-label="Pin inspector"
            aria-pressed={pinned}
            onClick={onPanelPin}
            className={cn(pinned && "bg-[var(--active)] text-[var(--text)]")}
          >
            <Pin className="h-[18px] w-[18px]" />
          </Button>
        )}

        <Button
          variant="icon"
          type="button"
          aria-label="More"
          onClick={onChatMenu}
        >
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
```

Notes: (1) `Button variant="icon"` supplies the neutral 34px icon-button chrome + focus ring — the only added class is the `--active` "on" fill (mockup 195 `.ibtn.on`), which is neutral. (2) The edit `<input>` is a raw element (not the `Input` primitive) because it needs the mockup's `--accent-line` rename border (679) and imperative focus/select; the `--accent-line` here is a keyboard-focus-adjacent affordance, not a fill. (3) Escape calls `cancel()` (which unmounts the input) so no `onBlur` commit fires afterward.

- [ ] **Step 8: Run the `TopBar` test — expect PASS.**
      Command: `pnpm --filter @wedevs/ui test -- --run src/components/TopBar/TopBar.test.tsx`
      Expected output: `Test Files  1 passed (1)` / `Tests  7 passed (7)`. If `PanelRight` fails to import, it is a valid `lucide-react` export — check the spelling.

- [ ] **Step 9: Export from the barrel.** Add the following lines to `packages/ui/src/index.ts` (append after the existing `UI_PACKAGE` line; keep it grouped with other `components/*` exports). If a prior task already re-exported any of these **type** names from the barrel, omit only the duplicate type lines — the two component exports are new to this task:

```ts
export { TopBar } from "./components/TopBar/TopBar";
export { ModelSelector } from "./components/TopBar/ModelSelector";
export type {
  ModelOption,
  AgentOption,
  ModelSelectorProps,
  TopBarProps,
} from "./types";
```

- [ ] **Step 10: Run both TopBar-dir tests together — expect PASS.**
      Command: `pnpm --filter @wedevs/ui test -- --run src/components/TopBar`
      Expected output: `Test Files  2 passed (2)` / `Tests  14 passed (14)`.

- [ ] **Step 11: Typecheck the package — expect clean.**
      Command: `pnpm --filter @wedevs/ui exec tsc --noEmit`
      Expected output: no output, exit code 0. (Requires `"jsx": "react-jsx"` already present in `packages/ui/tsconfig.json` from the setup task.) Fix any `any`/type error before proceeding — the package must stay strict-clean.

- [ ] **Step 12: Lint the new files, then commit.**
      Commands:
  ```
  pnpm --filter @wedevs/ui exec eslint src/components/TopBar
  git add packages/ui/src/components/TopBar packages/ui/src/index.ts
  git commit -m "feat(ui): add TopBar with model/agent selector popover"
  ```
  Expected: eslint reports no errors/warnings (exit 0); one commit created on the `develop` branch. (Do not push unless the orchestrator asks.)

---

**Definition of done:**

- `ModelSelector.tsx` and `TopBar.tsx` exist with the exact `ModelSelectorProps` / `TopBarProps` signatures imported from `packages/ui/src/types.ts` (types **not** redefined); both components and the four prop types are re-exported from `packages/ui/src/index.ts`.
- **ModelSelector** is standalone with two variants: `"topbar"` renders the selector button (mockup 172-181), `"pill"` renders the rounded composer pill (638-640). Its popover uses the Radix `Popover` primitive, a `Tabs` Models/Agents switch, a functional search `Input`, model rows grouped Frontier→Fast→Local with capability chips from `tags`, and agent rows showing `persona` + a `specialty` chip. A row click calls `onSelectModel(id)` and closes the popover; agent clicks call `onSelectModel(agent.id)`.
- **TopBar** renders `<ModelSelector variant="topbar" {...selector} />`, a rail-open hamburger (`onRailOpen`), a Share button (`onShare`), an Inspector toggle that reflects `panel` and calls `onPanelToggle`, a pin button shown only when `panel !== "closed"` that calls `onPanelPin`, and a chat-menu button (`onChatMenu`). The center title is inline-editable: click/double-click opens an `--accent-line`-bordered input; Enter/blur commit `value.trim() || oldTitle` via `onTitleChange`; Escape reverts.
- **Brand rule holds:** Volt/`--accent` appears **only** as `focus-visible` rings (`--accent-line`) and the rename input's border; the selector tabs, selected row/glyph/check, and Inspector toggle all use neutral tokens (`--hover`/`--active`/`--primary`/`--primary-text`/`--text-2`). No `<LiveDot/>`, no hardcoded hex.
- All 14 tests pass (`7 ModelSelector` + `7 TopBar`); `tsc --noEmit` and `eslint` are clean; work is committed with a Conventional Commit.

---

### Task 9: Composer (autogrow textarea + toolbar + drop overlay + attachment tray)

Build the message composer that anchors both the empty "hero" view and the docked chat view: a rounded card with a `:focus-within` accent ring, an autogrow `<textarea>` on top, a two-group toolbar underneath (attach + tools-toggle + the injected agent pill on the left; the `⏎` hint + voice + a neutral send on the right), an attachment tray of removable chips, and a Volt drop-zone overlay for drag-and-drop. The `variant` prop switches between the tall hero form (`empty`) and the compact docked form (`chat`); the two forms differ only in textarea height, wrapper max-width, and the footer note. The composer does **not** own a model selector — it renders the pre-built `agentPill` node it is handed. The **only** Volt (`--accent`) in this component is on live/active affordances: the focus ring, the drop overlay, the tools toggle's on-state, and a chip's upload-progress bar. Everything else — the send button, attach/voice buttons, borders, chips, footer — is neutral.

Port the markup + styles from `d:/Rajin/Wedevs.cloud/mockup/index.html`:

- Wrap / inner / focus-ring: **lines 308–314** (`.composer-wrap`, `.composer-inner`, `.composer`, `.composer:focus-within`) and premium overrides **lines 657–658**.
- Textarea: base **lines 331–333** (`.ta` min/max-height, scroll, line-height) and premium **lines 633–634** (`.composer>.ta` padding + empty-state `min-height:52px`).
- Toolbar: **lines 635–641** (`.composer-bar`, `.cbar-left`, `.cbar-right`, `.agent-pill`, `.send-hint`).
- Icon buttons: **lines 334–336** (`.cbtn`, `:hover`, `.cbtn.on` = accent on-state). Send button: **lines 337–339**. Footer: **lines 340–343** (`.composer-foot`, `.mi`, `.dot-sep`, `.spacer`).
- Attachment tray + chips: **lines 316–328** (`.tray`, `.chip`, `.chip-thumb`, `.chip-thumb.doc`, `.chip-meta`, `.chip-name`, `.chip-sub`, `.chip-x`, `.chip-prog`).
- Drop overlay: **lines 346–349** (`.drop`, `.app.dragging .drop`).
- Empty-state markup (tall hero, centered foot): **lines 917–936**. Chat-state markup (docked, tray populated, "2 tools enabled" foot): **lines 1010–1038**.
- The `agent-pill` slot the composer must render into: **line 924** (empty) & **line 1023** (chat); supporting `.sel-glyph` style: **lines 176–178**. (The pill itself is produced by Task 8 — the composer only renders the node.)

**Design decisions (resolve mockup gaps — implement exactly as stated, do NOT re-derive):**

- **Volt is enumerated and closed.** `--accent` appears on exactly four live/active affordances: (a) the composer `:focus-within` ring — mockup 314/658, sanctioned by the brand rule and marked `data-focus-ring`; (b) the drop overlay — mockup 346–348, the active drag state; (c) the tools toggle **on-state** — mockup 336 (`.cbtn.on`), an on-state in the same sanctioned "liveness" category as a `Switch`; (d) a chip's upload **progress bar** — mockup 328 (`.chip-prog`), the active upload. **Nothing else is Volt.** The send button is neutral (`--primary`/`--primary-text`, mockup 337). Attach/voice buttons, chips, borders, and the footer are neutral.
- **Doc-chip tint is neutralized.** The mockup's `.chip-thumb.doc` (line 322) tints the doc thumbnail `--accent-soft`/`--accent`; that is decorative, not "alive", so per the brand rule it is rendered **neutral** (`--hover` surface, `--text-2` glyph). Image vs doc chips differ only by icon (`ImageIcon` vs `FileText`).
- **No hardcoded hex.** The mockup's `.chip-thumb` gradient (line 321, literal hex) is replaced with the `--hover` token surface. All color comes from tokens via arbitrary Tailwind utilities.
- **Generic placeholder.** The mockup places the agent name in the placeholder ("Message Atlas Pro…", line 1018). The composer does not know the agent name (it lives inside the injected `agentPill` node), so both variants use one generic placeholder `"Message Wedevs…  (⏎ to send, ⇧⏎ for a new line)"` (mockup 919).
- **Send is always enabled.** The spec says Enter always calls `onSubmit()`; the parent guards empty sends. The mockup's `.send:disabled` style (line 339) is therefore not wired in Phase 1 — the send button carries no `disabled` logic.
- **Autogrow** is a layout effect that resets the textarea height to `auto` then to `scrollHeight`, capped by `max-h-[40vh]` with `overflow-y-auto` (mockup 331). **Reduced motion**: the mockup has no explicit drop animation; the task requires one, so the overlay fades in over 200ms, and that transition is dropped when `useReducedMotion()` is true (the composer's border/shadow transition is likewise gated).

---

**Files:**

Create:

- `packages/ui/src/components/Composer/Composer.tsx`
- `packages/ui/src/components/Composer/Composer.test.tsx`

Modify:

- `packages/ui/src/index.ts` — add `export { Composer } from "./components/Composer/Composer";`

Do **not** modify `packages/ui/src/types.ts` — `Attachment` and `ComposerProps` are already defined there by a foundation task; import them.

---

**Interfaces:**

Consumes (from the shared libs and the shared contract — do NOT redefine):

```ts
// packages/ui/src/lib/cn.ts
export function cn(...inputs: ClassValue[]): string;
// packages/ui/src/lib/use-reduced-motion.ts
export function useReducedMotion(): boolean;

// shared domain types (packages/ui/src/types.ts) — import, never redeclare
export interface Attachment {
  id: string;
  name: string;
  sub: string;
  kind: "image" | "doc";
  progress?: number; // chip shows name + sub; progress => live upload bar
}
export interface ComposerProps {
  variant: "empty" | "chat"; // "empty" = tall hero composer; "chat" = docked composer
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void; // takes NO args
  attachments: Attachment[];
  attachOpen: boolean;
  onAttach: () => void; // NO args (opens picker)
  onRemoveAttachment: (id: string) => void;
  toolsOn: boolean;
  onToggleTools: () => void;
  onVoice: () => void;
  agentPill: React.ReactNode; // PRE-RENDERED node (the <ModelSelector variant="pill"/> from Task 8)
  dragging?: boolean;
  toolCount?: number;
}
```

The `agentPill` node is produced by **Task 8** (`<ModelSelector variant="pill" .../>`). The composer renders it verbatim inside the left toolbar group; it never builds its own selector.

Produces (verbatim from the contract):

```ts
export function Composer(props: ComposerProps): JSX.Element;
```

---

**Visual source of truth (exact mockup lines):**

- Focus ring (sanctioned Volt): `.composer:focus-within{border-color:var(--accent-line);box-shadow:0 0 0 3px var(--accent-soft)}` — **314**, reinforced **658**.
- Card shell: `.composer{border:1px solid var(--border-2);border-radius:18px;background:var(--surface);box-shadow:var(--shadow-sm);…overflow:hidden}` — **312–313**, **657**.
- Textarea: `padding:13px 15px 6px` / empty `min-height:52px` — **633–634**; base `min-height:26px;max-height:40vh;overflow-y:auto;line-height:1.55` — **331–332**.
- Toolbar rows/groups: **635–637**; pill slot `margin-left:3px` — **638**; `.send-hint{opacity:.75;font-size:11px}` — **641**.
- `.cbtn` 36px neutral / `.cbtn.on` accent on-state — **334–336**; `.send` `--primary`/`--primary-text` — **337–338**.
- Footer `flex;gap:10px;…text-3;11.5px` + `.dot-sep` 3px dot — **340–343**; empty foot is `justify-content:center` — **933**; chat foot leads with "2 tools enabled" + dot — **1033–1035**.
- Tray `display:flex;flex-wrap;gap:9px;padding:12px 14px 2px` — **316–317**; chip + `.chip-prog{…background:var(--accent)}` — **318–328**.
- Drop overlay `inset:8px 24px;border:2px dashed var(--accent-line);background:var(--accent-soft);…color:var(--accent);backdrop-filter:blur(2px)` — **346–348**; label "Drop files to attach" — **1011**.

---

- [ ] **Step 1: Write the failing test file.** Create `packages/ui/src/components/Composer/Composer.test.tsx` with this exact content:

```tsx
import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Composer } from "./Composer";
import type { Attachment } from "../../types";

// jsdom has no matchMedia; useReducedMotion reads it.
beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  });
});

const FOOT_NOTE = "Wedevs can make mistakes — verify important info.";

const attachments: Attachment[] = [
  {
    id: "a1",
    name: "dashboard-hero.png",
    sub: "1.2 MB · uploading…",
    kind: "image",
    progress: 66,
  },
  { id: "a2", name: "spec-v3.docx", sub: "88 KB", kind: "doc" },
];

function renderComposer(
  overrides: Partial<React.ComponentProps<typeof Composer>> = {},
) {
  const props = {
    variant: "chat" as const,
    value: "",
    onChange: vi.fn(),
    onSubmit: vi.fn(),
    attachments: [] as Attachment[],
    attachOpen: false,
    onAttach: vi.fn(),
    onRemoveAttachment: vi.fn(),
    toolsOn: false,
    onToggleTools: vi.fn(),
    onVoice: vi.fn(),
    agentPill: <button type="button">Atlas Pro</button>,
    dragging: false,
    toolCount: 0,
    ...overrides,
  };
  const utils = render(<Composer {...props} />);
  return { ...utils, props };
}

describe("Composer", () => {
  it("renders the injected agentPill node (does not build its own selector)", () => {
    renderComposer({ agentPill: <span data-testid="pill">Atlas Pro</span> });
    expect(screen.getByTestId("pill")).toBeInTheDocument();
  });

  it("typing in the textarea calls onChange with the new value", async () => {
    const user = userEvent.setup();
    const { props } = renderComposer();
    await user.type(screen.getByRole("textbox"), "H");
    expect(props.onChange).toHaveBeenCalledWith("H");
  });

  it("Enter submits, Shift+Enter does not", async () => {
    const user = userEvent.setup();
    const { props } = renderComposer();
    screen.getByRole("textbox").focus();
    await user.keyboard("{Enter}");
    expect(props.onSubmit).toHaveBeenCalledTimes(1);
    await user.keyboard("{Shift>}{Enter}{/Shift}");
    expect(props.onSubmit).toHaveBeenCalledTimes(1);
  });

  it("Ctrl+Enter also submits", async () => {
    const user = userEvent.setup();
    const { props } = renderComposer();
    screen.getByRole("textbox").focus();
    await user.keyboard("{Control>}{Enter}{/Control}");
    expect(props.onSubmit).toHaveBeenCalledTimes(1);
  });

  it("clicking the send button calls onSubmit", async () => {
    const user = userEvent.setup();
    const { props } = renderComposer({ value: "hi" });
    await user.click(screen.getByRole("button", { name: "Send message" }));
    expect(props.onSubmit).toHaveBeenCalledTimes(1);
  });

  it("attach, tools, and voice buttons fire their callbacks", async () => {
    const user = userEvent.setup();
    const { props } = renderComposer();
    await user.click(screen.getByRole("button", { name: "Attach files" }));
    expect(props.onAttach).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("button", { name: "Tools and plugins" }));
    expect(props.onToggleTools).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("button", { name: "Voice input" }));
    expect(props.onVoice).toHaveBeenCalledTimes(1);
  });

  it("renders attachment chips and removing one calls onRemoveAttachment with its id", async () => {
    const user = userEvent.setup();
    const { props } = renderComposer({ attachments, attachOpen: true });
    expect(screen.getByText("dashboard-hero.png")).toBeInTheDocument();
    expect(screen.getByText("spec-v3.docx")).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Remove dashboard-hero.png" }),
    );
    expect(props.onRemoveAttachment).toHaveBeenCalledWith("a1");
  });

  it("shows the tray when attachOpen is true even with no attachments, and hides it otherwise", () => {
    const { rerender, props } = renderComposer({ attachOpen: false });
    expect(screen.queryByTestId("attachment-tray")).not.toBeInTheDocument();
    rerender(<Composer {...props} attachOpen />);
    expect(screen.getByTestId("attachment-tray")).toBeInTheDocument();
  });

  it("shows the drop overlay only when dragging is true", () => {
    const { rerender, props } = renderComposer({ dragging: false });
    expect(screen.queryByTestId("drop-overlay")).not.toBeInTheDocument();
    rerender(<Composer {...props} dragging />);
    expect(screen.getByTestId("drop-overlay")).toBeInTheDocument();
    expect(screen.getByText("Drop files to attach")).toBeInTheDocument();
  });

  it("empty variant renders a taller textarea and a centered foot", () => {
    renderComposer({ variant: "empty" });
    expect(screen.getByRole("textbox").className).toContain("min-h-[52px]");
    expect(screen.getByTestId("composer")).toHaveAttribute(
      "data-variant",
      "empty",
    );
    expect(screen.getByText(FOOT_NOTE)).toBeInTheDocument();
  });

  it("chat variant shows the enabled-tools count in the foot when tools are on", () => {
    renderComposer({ variant: "chat", toolsOn: true, toolCount: 2 });
    expect(screen.getByText("2 tools enabled")).toBeInTheDocument();
    expect(screen.getByTestId("tool-count")).toHaveTextContent("2");
  });

  it("stays brand-compliant: send is neutral; only the focus ring + tools on-state are Volt", () => {
    renderComposer({ toolsOn: true, toolCount: 2 });

    const send = screen.getByRole("button", { name: "Send message" });
    expect(send.className).toContain("var(--primary)");
    expect(send.className).not.toContain("--accent");

    const ring = screen
      .getByTestId("composer")
      .querySelector("[data-focus-ring]");
    expect(ring?.className).toContain(
      "focus-within:border-[var(--accent-line)]",
    );

    // tools on-state = sanctioned liveness Volt
    const tools = screen.getByRole("button", { name: "Tools and plugins" });
    expect(tools.className).toContain("var(--accent)");
  });
});
```

- [ ] **Step 2: Run the test — expect FAIL (module not found).**
      Command: `pnpm --filter @wedevs/ui test -- --run src/components/Composer/Composer.test.tsx`
      Expected output: Vitest fails to resolve `./Composer` — `Error: Failed to load url ./Composer` / `Cannot find module`. 0 tests pass. This confirms the harness runs and the file is wired up.

- [ ] **Step 3: Implement `Composer.tsx`.** Create `packages/ui/src/components/Composer/Composer.tsx` with this exact content:

```tsx
"use client";

import * as React from "react";
import {
  Paperclip,
  Settings2,
  Mic,
  Send,
  X,
  Upload,
  ImageIcon,
  FileText,
} from "lucide-react";
import { cn } from "../../lib/cn";
import { useReducedMotion } from "../../lib/use-reduced-motion";
import type { Attachment, ComposerProps } from "../../types";

// mockup 919/1018 — agent name lives inside the agentPill node, so both
// variants use one generic placeholder.
const PLACEHOLDER = "Message Wedevs…  (⏎ to send, ⇧⏎ for a new line)";
const FOOT_NOTE = "Wedevs can make mistakes — verify important info.";

// mockup 334-335 — 36px neutral icon button.
const cbtn =
  "grid h-9 w-9 flex-none place-items-center rounded-[10px] text-[var(--text-2)] hover:bg-[var(--hover)] hover:text-[var(--text)]";

// mockup 318-328 — one attachment chip. Neutral surface; the ONLY Volt is the
// live upload progress bar (.chip-prog, line 328).
function Chip({
  attachment,
  onRemove,
}: {
  attachment: Attachment;
  onRemove: (id: string) => void;
}) {
  const Icon = attachment.kind === "image" ? ImageIcon : FileText;
  const progress =
    typeof attachment.progress === "number"
      ? Math.max(0, Math.min(100, attachment.progress))
      : null;
  return (
    <div className="relative flex max-w-[230px] items-center gap-[9px] rounded-[11px] border border-[var(--border)] bg-[var(--surface-2)] py-2 pl-2 pr-2.5">
      <span className="grid h-[34px] w-[34px] flex-none place-items-center overflow-hidden rounded-[7px] bg-[var(--hover)] text-[var(--text-2)]">
        <Icon className="h-[18px] w-[18px]" strokeWidth={1.7} />
      </span>
      <span className="min-w-0 leading-[1.3]">
        <span className="block truncate text-[12.5px] font-semibold">
          {attachment.name}
        </span>
        <span className="block text-[11px] text-[var(--text-3)]">
          {attachment.sub}
        </span>
      </span>
      <button
        type="button"
        aria-label={`Remove ${attachment.name}`}
        onClick={() => onRemove(attachment.id)}
        className="grid h-5 w-5 flex-none place-items-center rounded-[6px] text-[var(--text-3)] hover:bg-[var(--active)] hover:text-[var(--text)]"
      >
        <X className="h-3.5 w-3.5" />
      </button>
      {progress !== null ? (
        <span
          data-testid="chip-progress"
          className="absolute bottom-0 left-0 h-0.5 rounded-[2px] bg-[var(--accent)]"
          style={{ width: `${progress}%` }}
        />
      ) : null}
    </div>
  );
}

// mockup 346-349 & markup 1011 — Volt drop overlay for the active drag state.
// The fade-in is dropped under prefers-reduced-motion.
function DropOverlay({ reduced }: { reduced: boolean }) {
  const [shown, setShown] = React.useState(reduced);
  React.useEffect(() => {
    if (reduced) {
      setShown(true);
      return;
    }
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, [reduced]);
  return (
    <div
      data-testid="drop-overlay"
      className={cn(
        "absolute inset-x-6 inset-y-2 z-[5] flex flex-col items-center justify-center gap-2.5",
        "rounded-[18px] border-2 border-dashed border-[var(--accent-line)] bg-[var(--accent-soft)]",
        "font-semibold text-[var(--accent)] backdrop-blur-[2px]",
        !reduced && "transition-opacity duration-200 ease-out",
      )}
      style={{ opacity: shown ? 1 : 0 }}
    >
      <Upload className="h-[30px] w-[30px]" strokeWidth={1.6} />
      Drop files to attach
    </div>
  );
}

export function Composer({
  variant,
  value,
  onChange,
  onSubmit,
  attachments,
  attachOpen,
  onAttach,
  onRemoveAttachment,
  toolsOn,
  onToggleTools,
  onVoice,
  agentPill,
  dragging = false,
  toolCount = 0,
}: ComposerProps) {
  const reduced = useReducedMotion();
  const taRef = React.useRef<HTMLTextAreaElement>(null);

  // Autogrow: reset to auto, then grow to content (capped by max-h-[40vh]).
  React.useLayoutEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Enter (also Ctrl/Cmd+Enter) submits; Shift+Enter inserts a newline.
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  }

  const trayOpen = attachOpen || attachments.length > 0;

  return (
    <div
      data-testid="composer"
      data-variant={variant}
      className={cn(
        "relative w-full px-6 pb-5",
        variant === "empty" ? "mx-auto max-w-[680px] pt-0" : "pt-2",
      )}
    >
      {dragging ? <DropOverlay reduced={reduced} /> : null}

      <div className="mx-auto max-w-[768px]">
        {/* mockup 312-314/657-658 — card shell + sanctioned focus-within Volt ring */}
        <div
          data-focus-ring
          className={cn(
            "overflow-hidden rounded-[18px] border border-[var(--border-2)] bg-[var(--surface)] shadow-[var(--shadow-sm)]",
            "focus-within:border-[var(--accent-line)] focus-within:shadow-[0_0_0_3px_var(--accent-soft)]",
            !reduced && "transition-[border-color,box-shadow] duration-150",
          )}
        >
          {/* mockup 316-317 — attachment tray */}
          {trayOpen ? (
            <div
              data-testid="attachment-tray"
              className="flex flex-wrap gap-[9px] px-3.5 pb-0.5 pt-3"
            >
              {attachments.map((a) => (
                <Chip key={a.id} attachment={a} onRemove={onRemoveAttachment} />
              ))}
            </div>
          ) : null}

          {/* mockup 331-333/633-634 — autogrow textarea */}
          <textarea
            ref={taRef}
            rows={1}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={PLACEHOLDER}
            aria-label="Message"
            className={cn(
              "block w-full resize-none overflow-y-auto bg-transparent px-[15px] pb-1.5 pt-[13px]",
              "leading-[1.55] text-[var(--text)] outline-none placeholder:text-[var(--text-3)]",
              "max-h-[40vh]",
              variant === "empty" ? "min-h-[52px]" : "min-h-[26px]",
            )}
          />

          {/* mockup 635-641 — toolbar */}
          <div className="flex items-center gap-2 px-2.5 pb-[9px]">
            <div className="flex min-w-0 flex-1 items-center gap-[5px]">
              <button
                type="button"
                aria-label="Attach files"
                title="Attach"
                onClick={onAttach}
                className={cbtn}
              >
                <Paperclip className="h-[18px] w-[18px]" />
              </button>
              <button
                type="button"
                aria-label="Tools and plugins"
                aria-pressed={toolsOn}
                title="Tools & plugins"
                onClick={onToggleTools}
                className={cn(
                  "inline-flex h-9 flex-none items-center gap-1.5 rounded-[10px] px-2 text-[13px] font-semibold",
                  toolsOn
                    ? // mockup 336 (.cbtn.on) — sanctioned on-state liveness Volt
                      "bg-[var(--accent-soft)] text-[var(--accent)]"
                    : "text-[var(--text-2)] hover:bg-[var(--hover)] hover:text-[var(--text)]",
                )}
              >
                <Settings2 className="h-[18px] w-[18px]" />
                {toolsOn && toolCount > 0 ? (
                  <span data-testid="tool-count">{toolCount}</span>
                ) : null}
              </button>
              {/* mockup 924/1023 + 638 — injected Task-8 pill (rendered, never built) */}
              <span className="ml-[3px] inline-flex min-w-0">{agentPill}</span>
            </div>

            <div className="flex flex-none items-center gap-[5px]">
              {/* mockup 641 — ⏎ hint */}
              <span className="mr-0.5 select-none font-mono text-[11px] text-[var(--text-3)] opacity-75">
                ⏎ send
              </span>
              <button
                type="button"
                aria-label="Voice input"
                title="Voice input"
                onClick={onVoice}
                className={cbtn}
              >
                <Mic className="h-[18px] w-[18px]" />
              </button>
              {/* mockup 337-338 — NEUTRAL send (--primary/--primary-text), never Volt */}
              <button
                type="button"
                aria-label="Send message"
                title="Send"
                onClick={onSubmit}
                className="grid h-9 w-9 flex-none place-items-center rounded-[10px] bg-[var(--primary)] text-[var(--primary-text)] hover:brightness-110"
              >
                <Send className="h-[18px] w-[18px]" />
              </button>
            </div>
          </div>
        </div>

        {/* mockup 340-343 — footer (empty = centered note; chat = tools count + note) */}
        <div
          className={cn(
            "mt-[9px] flex items-center gap-2.5 px-1 text-[11.5px] text-[var(--text-3)]",
            variant === "empty" && "justify-center",
          )}
        >
          {variant === "chat" && toolsOn && toolCount > 0 ? (
            <>
              <span>
                {toolCount} {toolCount === 1 ? "tool" : "tools"} enabled
              </span>
              <span className="h-[3px] w-[3px] rounded-full bg-[var(--text-3)]" />
            </>
          ) : null}
          <span>{FOOT_NOTE}</span>
        </div>
      </div>
    </div>
  );
}
```

Notes: (1) `handleKeyDown` covers all three keys with one branch — plain Enter and Ctrl/Cmd+Enter both hit `!e.shiftKey` and submit; Shift+Enter falls through to the browser's newline. (2) The autogrow `useLayoutEffect` is safe in jsdom (`scrollHeight` is `0`, so it sets `height: 0px` with no error). (3) `ImageIcon` is lucide-react's alias for the image glyph (`Image` clashes with the DOM constructor) — import it under that exact name. (4) The only Volt strings in the file are `--accent-line`/`--accent-soft` (focus ring + drop overlay border/glow) and `var(--accent)` (drop overlay text, tools on-state, chip progress) — matching the enumerated brand-rule list; the send button is `--primary`/`--primary-text`.

- [ ] **Step 4: Export from the barrel.** Edit `packages/ui/src/index.ts` and add (keep it grouped with the other `components/*` exports; alphabetical is fine):

```ts
export { Composer } from "./components/Composer/Composer";
```

- [ ] **Step 5: Run the tests — expect PASS.**
      Command: `pnpm --filter @wedevs/ui test -- --run src/components/Composer/Composer.test.tsx`
      Expected output: `Test Files  1 passed (1)` / `Tests  12 passed (12)`. If a `matchMedia` error appears, confirm the `beforeAll` mock in the test is present (it is). If `user.keyboard("{Enter}")` does not reach the textarea, confirm `screen.getByRole("textbox").focus()` ran first (it does).

- [ ] **Step 6: Typecheck the package — expect clean.**
      Command: `pnpm --filter @wedevs/ui exec tsc --noEmit`
      Expected output: no output, exit code 0. (Requires `"jsx": "react-jsx"` already in `packages/ui/tsconfig.json` from the setup task.) Fix any `any`/type errors before proceeding — the package stays strict-clean.

- [ ] **Step 7: Lint the new files — expect clean.**
      Command: `pnpm --filter @wedevs/ui exec eslint src/components/Composer`
      Expected output: no errors/warnings, exit code 0.

- [ ] **Step 8: Commit.**
      Command:
  ```
  git add packages/ui/src/components/Composer packages/ui/src/index.ts
  git commit -m "feat(ui): add Composer (autogrow textarea, toolbar, drop overlay, attachment tray)"
  ```
  Expected: one commit created on the `develop` branch. (Do not push unless the orchestrator asks.)

---

**Definition of done:**

- `Composer.tsx` exists with the exact `ComposerProps` signature (imported from `types.ts`, not redefined); `Composer` is re-exported from `packages/ui/src/index.ts`.
- **Row 1**: an autogrow `<textarea>` bound to `value`/`onChange`; it grows to content up to `max-h-[40vh]` then scrolls; **Enter** and **Ctrl/Cmd+Enter** call `onSubmit()`, **Shift+Enter** inserts a newline.
- **Row 2 toolbar** — LEFT: attach (`onAttach`), tools toggle (`toolsOn`/`onToggleTools`, showing `toolCount` when on), and the injected `{agentPill}` node (rendered, not built); RIGHT: the `⏎ send` hint, voice mic (`onVoice`), and a neutral send button (`onSubmit`).
- `variant="empty"` renders the tall hero form (52px textarea, 680px wrap, centered footer note); `variant="chat"` renders the docked form (26px textarea, "N tools enabled · note" footer when tools are on).
- **Attachment tray**: chips (name + `sub`, icon by `kind`) render when `attachOpen` or `attachments.length > 0`; each chip's remove button calls `onRemoveAttachment(id)`; a chip with `progress` shows a Volt upload bar. **Drop overlay** appears when `dragging` is true; its fade-in is disabled under `prefers-reduced-motion`.
- **Brand rule**: Volt/`--accent` appears **only** on the `data-focus-ring` `:focus-within` ring, the drop overlay, the tools toggle on-state, and the chip progress bar. The send button is neutral (`--primary`/`--primary-text`); attach/voice/chips/borders/footer carry no accent; no hex is hardcoded.
- All 12 tests pass; `tsc --noEmit` and `eslint` are clean; work is committed with a Conventional Commit.

---

### Task 10: Inspector (tabbed File / Output / Model / Setup, float|pinned|closed)

Build the right-hand contextual Inspector panel: a docked/floating/closed surface with a 56px header (title + pin + close), a 4-tab bar (File / Output / Model / Setup), and four content panes. The **only** Volt-accent elements are the Output donut **ring** at 100%, the Model **range-fill** bars, and toggle **on-states** (delegated to the `Switch` primitive). Everything else — header, tabs, buttons, borders, kv rows — is neutral.

Port the markup + styles from `d:/Rajin/Wedevs.cloud/mockup/index.html`:

- Inspector CSS: **lines 388–425** (panel/head/tabs/panes/preview/detail-card/param/range/tool-row) and **lines 662–674** (plugin-config polish).
- Inspector markup: **lines 1126–1206**.
- Ring donut CSS: **lines 294–296**.
- Range/knob CSS: **lines 418–421**.
- Panel-mode widths: **lines 391–393**.
- Tab-swap JS behavior: **lines 1478–1488**.
- Config JS behavior (reveal-key / connect): **lines 1594–1596**.
- Supporting shared classes already read: `eyebrow-sm`/`dash` (302–304), `kv/.k/.v` (265–268), `tag`/`mrow-tags` (97, 450), `toggle` on-state = `--accent` (379–383), `tool-ic`/`sel-glyph` (176–178, 256–257), `btn-code` (600–604), `run-tool` sub/meta (300–301).

**Design decisions (resolve mockup gaps — implement exactly as stated, do NOT re-derive):**

- The mockup's raw `.toggle` divs are replaced by the **`Switch` primitive** (Task 5); its on-state fill is `--accent` (sanctioned "on-toggle liveness"). Do not paint your own toggle.
- The mockup's slider **knob** is `background:#fff` (line 420). Keep `bg-white` for the range knob — it is the mockup's intentional slider-knob convention (same literal the toggle knob uses); this is a display-only knob, not an input.
- The **eyebrow dash** (`.dash`) is `--accent` in the mockup (line 304). Port it as `--accent`: it is the app-wide section-label brand mark (same decorative category as the sidebar `logo-dot`), consistent across every pane/view. It is neither a header, button, hover, nor active-state, so it does not conflict with "neutral = interactive".
- `PluginConfigData` has **no** API-key field, so the config pane renders a fixed masked demo value `ntn_5f8a92c4e1b7` (matching mockup line 1195). Reveal only toggles the input `type`.
- `Save changes` and `Cancel` both dismiss the config by calling `onClose` (mockup's Cancel is `data-act="panel-close"`; there is no persistence layer in Phase 1).

---

**Files:**

Create:

- `packages/ui/src/components/Inspector/Inspector.tsx`
- `packages/ui/src/components/Inspector/panes/FilePane.tsx`
- `packages/ui/src/components/Inspector/panes/OutputPane.tsx`
- `packages/ui/src/components/Inspector/panes/ModelPane.tsx`
- `packages/ui/src/components/Inspector/panes/ConfigPane.tsx`
- `packages/ui/src/components/Inspector/Inspector.test.tsx`

Modify:

- `packages/ui/src/index.ts` — add `export { Inspector } from "./components/Inspector/Inspector";`

---

**Interfaces:**

Consumes (from Task 5 primitives, Task 6 live visuals, and the shared contract — do NOT redefine):

```ts
// packages/ui/src/lib/cn.ts
export function cn(...inputs: ClassValue[]): string;
// packages/ui/src/lib/use-reduced-motion.ts
export function useReducedMotion(): boolean;

// primitives (Task 5) — standard shadcn export names
// ../../primitives/tabs   -> Tabs, TabsList, TabsTrigger, TabsContent   (Radix value/onValueChange)
// ../../primitives/switch -> Switch     (checked/onCheckedChange; on-state fill = --accent)
// ../../primitives/button -> Button     (variant?: "primary"|"ghost"|"outline"|"danger"|"icon")
// ../../primitives/input  -> Input      (Radix/native input props)

// shared domain types (packages/ui/src/types.ts)
export type PanelMode = "closed" | "float" | "pinned";
export type InspectorTab = "file" | "output" | "details" | "config";
export interface FilePreviewData {
  name: string;
  size: string;
  dims: string;
  src?: string;
}
export interface OutputKV {
  label: string;
  value: string;
}
export interface OutputData {
  title: string;
  percent: number;
  rows: OutputKV[];
}
export interface ModelParam {
  label: string;
  value: number;
  min: number;
  max: number;
}
export interface ModelDetails {
  name: string;
  sub: string;
  params: ModelParam[];
  tools: { label: string; on: boolean }[];
}
export interface PluginConfigData {
  name: string;
  publisher: string;
  connected: boolean;
  permissions: { label: string; on: boolean }[];
}
```

Produces (verbatim from the contract):

```ts
export interface InspectorProps {
  mode: PanelMode;
  tab: InspectorTab;
  onTabChange: (tab: InspectorTab) => void;
  onPin: () => void;
  onClose: () => void;
  file?: FilePreviewData;
  output?: OutputData;
  model?: ModelDetails;
  config?: PluginConfigData;
}
export function Inspector(props: InspectorProps): JSX.Element;
```

---

- [ ] **Step 1: Write the failing test file.** Create `packages/ui/src/components/Inspector/Inspector.test.tsx` with this exact content:

```tsx
import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { Inspector } from "./Inspector";
import type {
  FilePreviewData,
  OutputData,
  ModelDetails,
  PluginConfigData,
} from "../../types";

// jsdom has no matchMedia; useReducedMotion (and Radix) read it.
beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  });
});

const file: FilePreviewData = {
  name: "dashboard-hero.png",
  size: "1.2 MB",
  dims: "2400×1350",
};
const output: OutputData = {
  title: "Analytics",
  percent: 100,
  rows: [
    { label: "Paid search", value: "41%" },
    { label: "Partner channel", value: "27%" },
  ],
};
const model: ModelDetails = {
  name: "Atlas Pro",
  sub: "Frontier model — deepest reasoning.",
  params: [
    { label: "Temperature", value: 0.7, min: 0, max: 2 },
    { label: "Max output tokens", value: 4096, min: 0, max: 8192 },
  ],
  tools: [
    { label: "Web Search", on: true },
    { label: "Code Interpreter", on: true },
  ],
};
const config: PluginConfigData = {
  name: "Notion",
  publisher: "Notion Labs",
  connected: false,
  permissions: [
    { label: "Read pages & databases", on: true },
    { label: "Write & edit content", on: false },
  ],
};

function renderInspector(
  overrides: Partial<React.ComponentProps<typeof Inspector>> = {},
) {
  const props = {
    mode: "pinned" as const,
    tab: "file" as const,
    onTabChange: vi.fn(),
    onPin: vi.fn(),
    onClose: vi.fn(),
    file,
    output,
    model,
    config,
    ...overrides,
  };
  const utils = render(<Inspector {...props} />);
  return { ...utils, props };
}

describe("Inspector", () => {
  it("renders the header title and all four tabs", () => {
    renderInspector();
    expect(screen.getByText("Inspector")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "File" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Output" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Model" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Setup" })).toBeInTheDocument();
  });

  it("fires onTabChange with the tab key when a tab is clicked", () => {
    const { props } = renderInspector();
    fireEvent.click(screen.getByRole("tab", { name: "Output" }));
    expect(props.onTabChange).toHaveBeenCalledWith("output");
    fireEvent.click(screen.getByRole("tab", { name: "Model" }));
    expect(props.onTabChange).toHaveBeenCalledWith("details");
    fireEvent.click(screen.getByRole("tab", { name: "Setup" }));
    expect(props.onTabChange).toHaveBeenCalledWith("config");
  });

  it("the tab prop controls which pane is shown", () => {
    const { rerender, props } = renderInspector({ tab: "file" });
    expect(screen.getByText("dashboard-hero.png")).toBeInTheDocument();
    rerender(<Inspector {...props} tab="output" />);
    expect(screen.getByText("Channel breakdown")).toBeInTheDocument();
    rerender(<Inspector {...props} tab="details" />);
    expect(screen.getByText("Atlas Pro")).toBeInTheDocument();
    rerender(<Inspector {...props} tab="config" />);
    expect(screen.getByText("API key")).toBeInTheDocument();
  });

  it("fires onPin and onClose from the header buttons", () => {
    const { props } = renderInspector();
    fireEvent.click(screen.getByRole("button", { name: /pin/i }));
    expect(props.onPin).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("reveal-key toggles the API key input between password and text", () => {
    renderInspector({ tab: "config" });
    const input = screen.getByDisplayValue("ntn_5f8a92c4e1b7");
    expect(input).toHaveAttribute("type", "password");
    const revealBtn = screen.getByRole("button", { name: "Show" });
    fireEvent.click(revealBtn);
    expect(input).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: "Hide" })).toBeInTheDocument();
  });

  it("connect updates local config state to connected", () => {
    renderInspector({ tab: "config" });
    expect(screen.getByText("Notion Labs · not connected")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /connect account/i }));
    expect(screen.getByText("Notion Labs · connected")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /connected/i }),
    ).toBeInTheDocument();
  });

  it("Cancel and Save both call onClose", () => {
    const { props } = renderInspector({ tab: "config" });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(props.onClose).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(props.onClose).toHaveBeenCalledTimes(2);
  });

  it("output ring and model range-fill use --accent; on-tools render checked", () => {
    const { rerender, props } = renderInspector({ tab: "output" });
    const ring = screen.getByTestId("ring");
    expect(ring.getAttribute("style")).toContain("var(--accent)");
    expect(ring.getAttribute("style")).toContain("100%");

    rerender(<Inspector {...props} tab="details" />);
    const fills = screen.getAllByTestId("range-fill");
    expect(fills.length).toBe(2);
    expect(fills[0].className).toContain("var(--accent)");
    // Temperature 0.7 of [0,2] => 35%
    expect(fills[0].getAttribute("style")).toContain("35%");
    const switches = screen.getAllByRole("switch");
    expect(switches[0]).toHaveAttribute("data-state", "checked");
  });

  it("renders neutral header/tabs (no accent leak on chrome)", () => {
    renderInspector();
    const head = screen.getByTestId("inspector-head");
    expect(head.className).not.toContain("var(--accent)");
    const activeTab = screen.getByRole("tab", { name: "File" });
    // active tab uses neutral --active / --text, never accent
    expect(activeTab.className).not.toContain("var(--accent)");
  });

  it("renders all three PanelMode widths", () => {
    const base = {
      tab: "file" as const,
      onTabChange: vi.fn(),
      onPin: vi.fn(),
      onClose: vi.fn(),
      file,
    };
    const { rerender } = render(<Inspector {...base} mode="closed" />);
    let aside = screen.getByTestId("inspector");
    expect(aside).toHaveAttribute("data-panel", "closed");
    expect(aside.className).toContain("w-0");

    rerender(<Inspector {...base} mode="pinned" />);
    aside = screen.getByTestId("inspector");
    expect(aside).toHaveAttribute("data-panel", "pinned");
    expect(aside.className).toContain("w-[400px]");

    rerender(<Inspector {...base} mode="float" />);
    aside = screen.getByTestId("inspector");
    expect(aside).toHaveAttribute("data-panel", "float");
    expect(aside.className).toContain("w-[390px]");
    expect(aside.className).toContain("absolute");
  });
});
```

- [ ] **Step 2: Run the test — expect FAIL (module not found).**
      Command: `pnpm --filter @wedevs/ui test -- --run src/components/Inspector/Inspector.test.tsx`
      Expected output: Vitest fails to resolve `./Inspector` — `Error: Failed to load url ./Inspector` / `Cannot find module`. 0 tests pass. This confirms the harness runs and the file is wired up.

- [ ] **Step 3: Implement `FilePane.tsx`.** Create `packages/ui/src/components/Inspector/panes/FilePane.tsx`:

```tsx
import { ImageIcon, Download, ZoomIn } from "lucide-react";
import { Button } from "../../../primitives/button";
import type { FilePreviewData } from "../../../types";

function EyebrowSm({ label }: { label: string }) {
  return (
    <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-3)]">
      <span className="h-0.5 w-4 flex-none rounded-[2px] bg-[var(--accent)]" />
      {label}
    </div>
  );
}

const miniBtn =
  "flex h-auto items-center gap-[7px] rounded-[9px] border border-[var(--border)] px-3 py-2 text-[12.5px] font-semibold text-[var(--text-2)] hover:bg-[var(--hover)] hover:text-[var(--text)] hover:border-[var(--border-2)]";

export function FilePane({ file }: { file?: FilePreviewData }) {
  if (!file) {
    return (
      <p className="text-[13px] text-[var(--text-3)]">No file selected.</p>
    );
  }
  return (
    <div>
      <EyebrowSm label="Preview" />
      <div className="mb-3.5 grid h-[200px] place-items-center overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[linear-gradient(135deg,#5a6472,#2f363f)] text-white/50">
        {file.src ? (
          <img
            src={file.src}
            alt={file.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <ImageIcon className="h-[34px] w-[34px]" strokeWidth={1.6} />
        )}
      </div>
      <div className="mb-4 flex flex-col gap-px">
        <span className="font-bold">{file.name}</span>
        <span className="font-mono text-xs text-[var(--text-3)]">
          {file.size} · {file.dims}
        </span>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" className={miniBtn} type="button">
          <Download className="h-4 w-4" /> Download
        </Button>
        <Button variant="outline" className={miniBtn} type="button">
          <ZoomIn className="h-4 w-4" /> Zoom
        </Button>
      </div>
    </div>
  );
}
```

Note: `EyebrowSm` is duplicated in each pane (3 lines) to avoid an extra shared export; keep the markup identical across panes.

- [ ] **Step 4: Implement `OutputPane.tsx`.** Create `packages/ui/src/components/Inspector/panes/OutputPane.tsx`. The `Ring` reproduces mockup 294–296 (conic-gradient accent donut with an inset surface disc):

```tsx
import { BarChart3, RotateCw, Copy } from "lucide-react";
import { Button } from "../../../primitives/button";
import type { OutputData } from "../../../types";

function EyebrowSm({ label }: { label: string }) {
  return (
    <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-3)]">
      <span className="h-0.5 w-4 flex-none rounded-[2px] bg-[var(--accent)]" />
      {label}
    </div>
  );
}

const miniBtn =
  "flex h-auto items-center gap-[7px] rounded-[9px] border border-[var(--border)] px-3 py-2 text-[12.5px] font-semibold text-[var(--text-2)] hover:bg-[var(--hover)] hover:text-[var(--text)] hover:border-[var(--border-2)]";

// mockup 294-296: conic accent donut, inset surface disc on top
function Ring({ percent }: { percent: number }) {
  const p = Math.max(0, Math.min(100, percent));
  return (
    <span
      data-testid="ring"
      className="relative h-4 w-4 flex-none rounded-full"
      style={{
        background: `conic-gradient(var(--accent) ${p}%, var(--border-2) 0)`,
      }}
    >
      <span className="absolute inset-[3px] rounded-full bg-[var(--surface)]" />
    </span>
  );
}

export function OutputPane({ output }: { output?: OutputData }) {
  if (!output) {
    return (
      <p className="text-[13px] text-[var(--text-3)]">No plugin output yet.</p>
    );
  }
  return (
    <div>
      <EyebrowSm label="Plugin output" />
      <div className="mb-3.5 flex items-center gap-[11px] rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] px-[13px] py-2.5">
        <Ring percent={output.percent} />
        <div>
          <div className="text-[13px] font-semibold">{output.title}</div>
          <div className="text-[11.5px] text-[var(--text-3)]">
            Completed · {output.rows.length} channels
          </div>
        </div>
      </div>
      <div className="mb-3.5 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] p-3.5">
        <h4 className="mb-2.5 flex items-center gap-2 text-[13px] font-semibold">
          <span className="grid h-[22px] w-[22px] place-items-center rounded-[7px] bg-[var(--hover)] text-[var(--text-2)]">
            <BarChart3 className="h-[15px] w-[15px]" />
          </span>
          Channel breakdown
        </h4>
        {output.rows.map((row) => (
          <div
            key={row.label}
            className="flex justify-between border-b border-[var(--border)] py-[7px] text-[13px] last:border-b-0"
          >
            <span className="text-[var(--text-3)]">{row.label}</span>
            <span className="font-semibold">{row.value}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Button variant="outline" className={miniBtn} type="button">
          <RotateCw className="h-4 w-4" /> Re-run
        </Button>
        <Button variant="outline" className={miniBtn} type="button">
          <Copy className="h-4 w-4" /> Copy JSON
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Implement `ModelPane.tsx`.** Create `packages/ui/src/components/Inspector/panes/ModelPane.tsx`. `Range` reproduces mockup 418–421 (neutral track, **accent fill**, white knob). Tools use the `Switch` primitive (accent on-state) with local state:

```tsx
import * as React from "react";
import { Boxes, Search, Code2 } from "lucide-react";
import { Switch } from "../../../primitives/switch";
import type { ModelDetails } from "../../../types";

function EyebrowSm({ label }: { label: string }) {
  return (
    <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-3)]">
      <span className="h-0.5 w-4 flex-none rounded-[2px] bg-[var(--accent)]" />
      {label}
    </div>
  );
}

function Range({
  value,
  min,
  max,
}: {
  value: number;
  min: number;
  max: number;
}) {
  const span = max - min || 1;
  const pct = Math.max(0, Math.min(100, ((value - min) / span) * 100));
  return (
    <div className="relative h-[5px] rounded-[3px] bg-[var(--border-2)]">
      <div
        data-testid="range-fill"
        className="absolute inset-y-0 left-0 rounded-[3px] bg-[var(--accent)]"
        style={{ width: `${pct}%` }}
      />
      <span
        className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--border-2)] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.3)]"
        style={{ left: `${pct}%` }}
      />
    </div>
  );
}

const toolIcons = [Search, Code2];

export function ModelPane({ model }: { model?: ModelDetails }) {
  const [tools, setTools] = React.useState(model?.tools ?? []);
  React.useEffect(() => {
    setTools(model?.tools ?? []);
  }, [model]);

  if (!model) {
    return (
      <p className="text-[13px] text-[var(--text-3)]">No model selected.</p>
    );
  }
  return (
    <div>
      <EyebrowSm label="Model" />
      <div className="mb-3.5 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] p-3.5">
        <h4 className="mb-2.5 flex items-center gap-2 text-[13px] font-semibold">
          <span className="grid h-[22px] w-[22px] place-items-center rounded-[7px] bg-[var(--hover)] text-[var(--text-2)]">
            <Boxes className="h-[15px] w-[15px]" />
          </span>
          {model.name}
        </h4>
        <p className="text-[13px] text-[var(--text-2)]">{model.sub}</p>
      </div>
      {model.params.map((param) => (
        <div key={param.label} className="mb-3.5">
          <div className="mb-[7px] flex justify-between text-[12.5px]">
            <span>{param.label}</span>
            <span className="font-mono font-bold">
              {param.value.toLocaleString("en-US")}
            </span>
          </div>
          <Range value={param.value} min={param.min} max={param.max} />
        </div>
      ))}
      <div className="mt-4 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] p-3.5">
        <h4 className="mb-2.5 text-[13px] font-semibold">Enabled tools</h4>
        {tools.map((tool, i) => {
          const Icon = toolIcons[i % toolIcons.length];
          return (
            <div
              key={tool.label}
              className="flex items-center gap-2.5 border-b border-[var(--border)] py-[9px] last:border-b-0"
            >
              <Icon className="h-4 w-4 text-[var(--text-3)]" />
              <span className="flex-1 text-[13px] font-medium">
                {tool.label}
              </span>
              <Switch
                checked={tool.on}
                aria-label={tool.label}
                onCheckedChange={(on) =>
                  setTools((prev) =>
                    prev.map((t, idx) => (idx === i ? { ...t, on } : t)),
                  )
                }
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Implement `ConfigPane.tsx`.** Create `packages/ui/src/components/Inspector/panes/ConfigPane.tsx`. Uses `Input` for the (masked, read-only) API key, `Switch` for permissions, and `Button` (primary/ghost) for connect/cancel/save. Reveal + connect mutate local state (mockup 1594–1596); Cancel/Save call `onClose`:

```tsx
import * as React from "react";
import { Link2, Check, Eye, Pencil, Database } from "lucide-react";
import { Button } from "../../../primitives/button";
import { Input } from "../../../primitives/input";
import { Switch } from "../../../primitives/switch";
import type { PluginConfigData } from "../../../types";

const API_KEY = "ntn_5f8a92c4e1b7";
const permIcons = [Eye, Pencil, Database];

function EyebrowSm({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <div
      className={
        "mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-3)] " +
        (className ?? "")
      }
    >
      <span className="h-0.5 w-4 flex-none rounded-[2px] bg-[var(--accent)]" />
      {label}
    </div>
  );
}

export function ConfigPane({
  config,
  onClose,
}: {
  config?: PluginConfigData;
  onClose: () => void;
}) {
  const [connected, setConnected] = React.useState(config?.connected ?? false);
  const [revealed, setRevealed] = React.useState(false);
  const [perms, setPerms] = React.useState(config?.permissions ?? []);

  React.useEffect(() => {
    setConnected(config?.connected ?? false);
    setPerms(config?.permissions ?? []);
    setRevealed(false);
  }, [config]);

  if (!config) {
    return (
      <p className="text-[13px] text-[var(--text-3)]">
        No plugin to configure.
      </p>
    );
  }

  return (
    <div>
      <EyebrowSm label="Configure" />
      <div className="mb-3.5 flex items-center gap-3">
        <div className="grid h-10 w-10 flex-none place-items-center rounded-[10px] bg-[var(--hover)] text-[var(--text-2)]">
          <Link2 className="h-5 w-5" />
        </div>
        <div>
          <div className="text-[15px] font-bold">{config.name}</div>
          <div className="text-xs text-[var(--text-3)]">
            {config.publisher} · {connected ? "connected" : "not connected"}
          </div>
        </div>
      </div>

      <Button
        variant="primary"
        type="button"
        disabled={connected}
        onClick={() => setConnected(true)}
        className="mb-4 w-full justify-center gap-[7px]"
      >
        {connected ? (
          <>
            <Check className="h-4 w-4" /> Connected
          </>
        ) : (
          <>
            <Link2 className="h-4 w-4" /> Connect account
          </>
        )}
      </Button>

      <div className="mb-1">
        <label className="mb-1.5 block text-xs font-semibold text-[var(--text-2)]">
          API key
        </label>
        <div className="flex items-center gap-1.5 rounded-[9px] border border-[var(--border)] bg-[var(--surface)] py-1 pl-3 pr-1">
          <Input
            readOnly
            type={revealed ? "text" : "password"}
            value={API_KEY}
            className="h-auto flex-1 border-none bg-transparent p-0 font-mono text-[12.5px] text-[var(--text)] shadow-none outline-none focus-visible:ring-0"
          />
          <button
            type="button"
            onClick={() => setRevealed((r) => !r)}
            className="rounded-[7px] px-2.5 py-1.5 text-[11.5px] font-semibold text-[var(--text-2)] hover:bg-[var(--hover)] hover:text-[var(--text)]"
          >
            {revealed ? "Hide" : "Show"}
          </button>
        </div>
      </div>

      <EyebrowSm label="Permissions" className="mt-[18px]" />
      <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] p-3.5">
        {perms.map((perm, i) => {
          const Icon = permIcons[i % permIcons.length];
          return (
            <div
              key={perm.label}
              className="flex items-center gap-2.5 border-b border-[var(--border)] py-[9px] last:border-b-0"
            >
              <Icon className="h-4 w-4 text-[var(--text-3)]" />
              <span className="flex-1 text-[13px] font-medium">
                {perm.label}
              </span>
              <Switch
                checked={perm.on}
                aria-label={perm.label}
                onCheckedChange={(on) =>
                  setPerms((prev) =>
                    prev.map((p, idx) => (idx === i ? { ...p, on } : p)),
                  )
                }
              />
            </div>
          );
        })}
      </div>

      <div className="mt-[18px] flex gap-2">
        <Button
          variant="ghost"
          type="button"
          onClick={onClose}
          className="flex-1 justify-center border border-[var(--border)]"
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          type="button"
          onClick={onClose}
          className="flex-1 justify-center"
        >
          Save changes
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Implement `Inspector.tsx`.** Create `packages/ui/src/components/Inspector/Inspector.tsx`. Header (title + pin + close), Radix `Tabs` (value=`tab`, onValueChange→`onTabChange`) driving the four panes; mode drives width/positioning per mockup 388–393; reduced-motion drops the width transition:

```tsx
import { Pin, X } from "lucide-react";
import { cn } from "../../lib/cn";
import { useReducedMotion } from "../../lib/use-reduced-motion";
import { Button } from "../../primitives/button";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../../primitives/tabs";
import type { InspectorProps, InspectorTab } from "../../types";
import { FilePane } from "./panes/FilePane";
import { OutputPane } from "./panes/OutputPane";
import { ModelPane } from "./panes/ModelPane";
import { ConfigPane } from "./panes/ConfigPane";

// mockup 388-393
const modeClass: Record<InspectorProps["mode"], string> = {
  closed: "w-0 overflow-hidden border-l border-[var(--border)]",
  pinned: "w-[400px] border-l border-[var(--border)]",
  float:
    "absolute inset-y-0 right-0 z-30 w-[390px] border-l border-[var(--border-2)] shadow-[var(--shadow)]",
};

// mockup 397-399: neutral tab chip; active = --active/--text (NO accent)
const tabClass = cn(
  "rounded-[8px] px-[11px] py-1.5 text-[12.5px] font-semibold text-[var(--text-3)]",
  "data-[state=inactive]:hover:bg-[var(--hover)] data-[state=inactive]:hover:text-[var(--text-2)]",
  "data-[state=active]:bg-[var(--active)] data-[state=active]:text-[var(--text)]",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-line)]",
);

const tabs: { value: InspectorTab; label: string }[] = [
  { value: "file", label: "File" },
  { value: "output", label: "Output" },
  { value: "details", label: "Model" },
  { value: "config", label: "Setup" },
];

export function Inspector({
  mode,
  tab,
  onTabChange,
  onPin,
  onClose,
  file,
  output,
  model,
  config,
}: InspectorProps) {
  const reduced = useReducedMotion();
  return (
    <aside
      data-testid="inspector"
      data-panel={mode}
      className={cn(
        "flex flex-none flex-col overflow-hidden bg-[var(--surface)]",
        !reduced &&
          "transition-[width] duration-[240ms] ease-[cubic-bezier(0.4,0,0.2,1)]",
        modeClass[mode],
      )}
    >
      <div
        data-testid="inspector-head"
        className="flex h-14 flex-none items-center gap-2 border-b border-[var(--border)] pl-4 pr-3"
      >
        <span className="min-w-0 flex-1 truncate text-sm font-bold">
          Inspector
        </span>
        <Button
          variant="icon"
          type="button"
          aria-label="Pin open"
          onClick={onPin}
        >
          <Pin className="h-[18px] w-[18px]" />
        </Button>
        <Button
          variant="icon"
          type="button"
          aria-label="Close"
          onClick={onClose}
        >
          <X className="h-[18px] w-[18px]" />
        </Button>
      </div>

      <Tabs
        value={tab}
        onValueChange={(v) => onTabChange(v as InspectorTab)}
        className="flex min-h-0 flex-1 flex-col"
      >
        <TabsList className="flex flex-none gap-0.5 border-b border-[var(--border)] px-3 py-2">
          {tabs.map((t) => (
            <TabsTrigger key={t.value} value={t.value} className={tabClass}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <TabsContent value="file">
            <FilePane file={file} />
          </TabsContent>
          <TabsContent value="output">
            <OutputPane output={output} />
          </TabsContent>
          <TabsContent value="details">
            <ModelPane model={model} />
          </TabsContent>
          <TabsContent value="config">
            <ConfigPane config={config} onClose={onClose} />
          </TabsContent>
        </div>
      </Tabs>
    </aside>
  );
}
```

Notes: (1) `Button variant="icon"` supplies the neutral icon-button chrome + focus ring — do not restyle it. (2) The tab focus ring uses `--accent-line` (sanctioned keyboard-focus accent); the tab **background/text** stay neutral. (3) Radix `TabsContent` only mounts the active pane, reproducing the mockup's `.ipane.active{display:block}` (401).

- [ ] **Step 8: Export from the barrel.** Edit `packages/ui/src/index.ts` and add (keep it grouped with the other `components/*` exports, alphabetical is fine):

```ts
export { Inspector } from "./components/Inspector/Inspector";
```

- [ ] **Step 9: Run the tests — expect PASS.**
      Command: `pnpm --filter @wedevs/ui test -- --run src/components/Inspector/Inspector.test.tsx`
      Expected output: `Test Files  1 passed (1)` / `Tests  9 passed (9)`. If a Radix Switch/Tabs interaction warns about missing `matchMedia`, confirm the `beforeAll` mock in the test is present (it is). If `Boxes`/`ZoomIn` fail to import, they are valid lucide-react exports — check the import spelling.

- [ ] **Step 10: Typecheck the package — expect clean.**
      Command: `pnpm --filter @wedevs/ui exec tsc --noEmit`
      Expected output: no output, exit code 0. (Requires `"jsx": "react-jsx"` already added to `packages/ui/tsconfig.json` in the setup task.) Fix any `any`/type errors before proceeding — the whole package must stay strict-clean.

- [ ] **Step 11: Lint the new files — expect clean.**
      Command: `pnpm --filter @wedevs/ui exec eslint src/components/Inspector`
      Expected output: no errors/warnings, exit code 0.

- [ ] **Step 12: Commit.**
      Command:
  ```
  git add packages/ui/src/components/Inspector packages/ui/src/index.ts
  git commit -m "feat(ui): add tabbed Inspector panel (file/output/model/setup)"
  ```
  Expected: one commit created on the `develop` branch. (Do not push unless the orchestrator asks.)

---

**Definition of done:**

- `Inspector.tsx` and all four panes exist with the exact `InspectorProps` signature; `Inspector` is re-exported from `packages/ui/src/index.ts`.
- Header shows "Inspector" + pin + close (neutral icon buttons wired to `onPin`/`onClose`); the 4-tab bar (File/Output/Model/Setup) is a Radix `Tabs` driven by `tab`/`onTabChange`, with only the active pane mounted.
- **File** pane: preview + `size · dims` meta + Download/Zoom mini-buttons. **Output** pane: accent donut `Ring` at `percent` + "Channel breakdown" kv card + Re-run/Copy. **Model** pane: model card, accent-fill `Range` bars per param (Temperature 0.7→35%, Max tokens 4096→50%), and `Switch` tool toggles. **Setup** pane: connect (updates local state), masked API key with Show/Hide reveal, permission `Switch`es, Cancel/Save both closing via `onClose`.
- Volt/`--accent` appears **only** on: the Output ring, the Range fills, Switch on-states, the eyebrow section dashes, and keyboard focus rings — **never** on the header, tabs (active tab is neutral `--active`/`--text`), buttons, borders, or kv rows.
- `mode` maps to `closed` (w-0), `pinned` (400px docked, left border) and `float` (390px absolute, z-30, `--shadow`, `--border-2` edge); the width transition is disabled under `prefers-reduced-motion`.
- All 9 tests pass; `tsc --noEmit` and `eslint` are clean; work is committed with a Conventional Commit.

---

### Task 11: CommandPalette (⌘K, Actions / Recent chats / Models groups)

A cmdk-backed command palette rendered inside the re-skinned Dialog surface. It opens on `open=true`, on the global `⌘K`/`Ctrl+K` shortcut, and closes on Escape / scrim-click / item selection. It shows a search input with an `esc` hint and three fixed-order groups — **Actions**, **Recent chats**, **Models** — with cmdk arrow-key navigation. The active row uses the **neutral `--hover`** token (this component is 100% neutral — it must NOT paint with `--accent`, per the "Neutral = interactive · Volt = alive" rule; the palette has no alive element).

**Files:**

- CREATE `packages/ui/src/components/CommandPalette/CommandPalette.tsx`
- CREATE `packages/ui/src/components/CommandPalette/CommandPalette.test.tsx`
- MODIFY `packages/ui/src/index.ts` (add barrel export)

**Interfaces:**

Consumes (already produced by earlier tasks — do NOT redefine):

```ts
// packages/ui/src/lib/cn.ts  (Task: cn util)
export function cn(...inputs: ClassValue[]): string;

// packages/ui/src/types.ts  (canonical domain types)
export interface CommandItem {
  id: string;
  label: string;
  kbd?: string;
  group: "actions" | "recent" | "models";
  onSelect: () => void;
}

// packages/ui/src/primitives/dialog.tsx  (Task 5 — re-skinned shadcn dialog; standard shadcn exports)
export const Dialog: React.FC<React.ComponentProps<typeof DialogPrimitive.Root>>;      // controlled root
export const DialogContent: React.ForwardRefExoticComponent</* centered elevated surface; renders portal+overlay+focus-trap; includes an auto close-X button as a direct child */>;
export const DialogTitle: React.ForwardRefExoticComponent</* a11y title */>;

// packages/ui/src/primitives/command.tsx  (Task 5 — re-skinned shadcn cmdk; standard shadcn exports)
export const Command: React.FC</* cmdk root, default fuzzy filter on */>;
export const CommandInput: React.FC</* renders a search-icon row + <input>, bottom border */>;
export const CommandList: React.FC;
export const CommandEmpty: React.FC;
export const CommandGroup: React.FC<{ heading?: string }>;   // renders [cmdk-group-heading]
export const CommandItem: React.FC<{ value?: string; onSelect?: (value: string) => void; className?: string }>; // role="option", cmdk sets data-selected on active
export const CommandShortcut: React.FC;                      // ml-auto kbd slot
```

Produces (define & export from THIS file):

```ts
export interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actions: CommandItem[];
  recents: CommandItem[];
  models: CommandItem[];
}
export function CommandPalette(props: CommandPaletteProps): JSX.Element;
```

**Mockup source of truth** — READ `d:/Rajin/Wedevs.cloud/mockup/index.html`:

- CSS **506–521** — `.palette-wrap` scrim/blur, `.palette` elevated surface (`var(--elevated)`, `1px solid var(--border-2)`, `border-radius:16px`, `box-shadow:var(--shadow)`), `.pal-in` input row (`gap:11px; padding:15px 17px; border-bottom:1px solid var(--border)`), `.pal-list` (`max-height:340px; overflow-y:auto; padding:8px`), `.pal-sec` group heading (`font-size:10.5px; font-weight:700; letter-spacing:.07em; text-transform:uppercase; color:var(--text-3); padding:9px 11px 5px`), `.pal-item` (`gap:11px; padding:10px 11px; border-radius:9px; color:var(--text-2); font-size:13.5px`), and crucially **line 519**: `.pal-item:hover,.pal-item.active{background:var(--hover);color:var(--text)}` — the active row is **neutral `--hover`**, never accent. `.pal-item .kbd{margin-left:auto}` (521).
- Markup **1336–1350** — `.palette-wrap` → `.palette` → `.pal-in` (search svg + input `placeholder="Search chats, models, plugins, actions…"` + `<span class="kbd">esc</span>`) → `.pal-list` with `.pal-sec` "Actions" / "Recent chats" / "Models" and `.pal-item` rows (some with a trailing `.kbd`, e.g. `⌘N`).
- Global shortcut JS **1613** — `if((e.metaKey||e.ctrlKey) && e.key.toLowerCase()==='k'){ e.preventDefault(); open palette; focus input }`.
- Close JS **1607** (scrim click) & **1612** (Escape) — both close the palette. In our port, Radix Dialog handles scrim-click and Escape natively via `onOpenChange(false)`; the only thing WE add is the global `⌘K` open listener.

Do NOT port the scrim/positioning CSS literally — Radix `DialogContent` (from Task 5) already provides the portal, scrim overlay, focus trap, Escape-to-close, and scrim-click-to-close. We only override its geometry/skin via `className` and drop cmdk inside it.

---

- [ ] **Step 1: Write the failing test file.** Create `packages/ui/src/components/CommandPalette/CommandPalette.test.tsx` with exactly this content:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";
import { CommandPalette } from "./CommandPalette";
import type { CommandItem } from "../../types";

function makeItem(
  id: string,
  label: string,
  group: CommandItem["group"],
  kbd?: string,
): CommandItem {
  return { id, label, group, kbd, onSelect: vi.fn() };
}

function setup(
  overrides: Partial<React.ComponentProps<typeof CommandPalette>> = {},
) {
  const actions = [
    makeItem("new-chat", "New chat", "actions", "⌘N"),
    makeItem("open-settings", "Open settings", "actions"),
  ];
  const recents = [
    makeItem("c1", "Q3 go-to-market plan", "recent"),
    makeItem("c2", "Landing page copy review", "recent"),
  ];
  const models = [makeItem("m1", "Switch to Atlas Air", "models")];
  const onOpenChange = vi.fn();
  const utils = render(
    <CommandPalette
      open
      onOpenChange={onOpenChange}
      actions={actions}
      recents={recents}
      models={models}
      {...overrides}
    />,
  );
  return { ...utils, actions, recents, models, onOpenChange };
}

describe("CommandPalette", () => {
  it("does not render palette content when open is false", () => {
    render(
      <CommandPalette
        open={false}
        onOpenChange={vi.fn()}
        actions={[makeItem("a", "New chat", "actions")]}
        recents={[]}
        models={[]}
      />,
    );
    expect(
      screen.queryByPlaceholderText(/search chats/i),
    ).not.toBeInTheDocument();
  });

  it("renders the search input, esc hint, and all three groups in order", () => {
    setup();
    expect(
      screen.getByPlaceholderText(/search chats, models, plugins, actions/i),
    ).toBeInTheDocument();
    expect(screen.getByText("esc")).toBeInTheDocument();

    const headings = screen
      .getAllByText(/^(Actions|Recent chats|Models)$/)
      .map((el) => el.textContent);
    expect(headings).toEqual(["Actions", "Recent chats", "Models"]);
  });

  it("filters items as the user types in the search input", () => {
    setup();
    const input = screen.getByPlaceholderText(/search chats/i);
    fireEvent.change(input, { target: { value: "settings" } });

    expect(screen.getByText("Open settings")).toBeInTheDocument();
    expect(screen.queryByText("New chat")).not.toBeInTheDocument();
    expect(screen.queryByText("Q3 go-to-market plan")).not.toBeInTheDocument();
  });

  it("moves the active row with arrow keys and fires the selected item's onSelect on Enter", () => {
    const { actions } = setup();
    const input = screen.getByPlaceholderText(/search chats/i);

    // cmdk auto-selects the first option; ArrowDown advances to the second ("Open settings").
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(actions[1].onSelect).toHaveBeenCalledTimes(1);
    expect(actions[0].onSelect).not.toHaveBeenCalled();
  });

  it("closes (onOpenChange(false)) after an item is selected", () => {
    const { actions, onOpenChange } = setup();
    const input = screen.getByPlaceholderText(/search chats/i);
    fireEvent.keyDown(input, { key: "Enter" }); // fires first option
    expect(actions[0].onSelect).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("opens on the global ⌘K / Ctrl+K shortcut", () => {
    const onOpenChange = vi.fn();
    render(
      <CommandPalette
        open={false}
        onOpenChange={onOpenChange}
        actions={[makeItem("a", "New chat", "actions")]}
        recents={[]}
        models={[]}
      />,
    );
    fireEvent.keyDown(document, { key: "k", metaKey: true });
    expect(onOpenChange).toHaveBeenCalledWith(true);

    onOpenChange.mockClear();
    fireEvent.keyDown(document, { key: "k", ctrlKey: true });
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it("active rows use the neutral --hover token and never --accent", () => {
    setup();
    const options = screen.getAllByRole("option");
    expect(options.length).toBeGreaterThan(0);
    for (const opt of options) {
      expect(opt.className).toContain("data-[selected=true]:bg-[var(--hover)]");
      expect(opt.className).not.toMatch(/accent/);
    }
  });
});
```

- [ ] **Step 2: Run the test and confirm it FAILS (module not found).**
      Command: `pnpm --filter @wedevs/ui test -- CommandPalette`
      Expected: Vitest fails to collect the suite with `Failed to resolve import "./CommandPalette"` (the component file does not exist yet). This confirms the test is wired before implementation.

- [ ] **Step 3: Implement the component.** Create `packages/ui/src/components/CommandPalette/CommandPalette.tsx` with exactly this content. Port the visual structure/tokens from mockup CSS 506–521 & markup 1336–1350; note the geometry/skin overrides on `DialogContent` and the neutral `--hover` selection style.

```tsx
import * as React from "react";
import { Search } from "lucide-react";
import { cn } from "../../lib/cn";
import { Dialog, DialogContent, DialogTitle } from "../../primitives/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "../../primitives/command";
import type { CommandItem as CommandItemData } from "../../types";

export interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actions: CommandItemData[];
  recents: CommandItemData[];
  models: CommandItemData[];
}

// mockup 518–519: neutral base + active row = var(--hover)/var(--text). No accent anywhere.
const ITEM_CLASS = cn(
  "flex items-center gap-[11px] rounded-[9px] px-[11px] py-[10px]",
  "text-[13.5px] text-[var(--text-2)]",
  "data-[selected=true]:bg-[var(--hover)] data-[selected=true]:text-[var(--text)]",
);

// mockup 517: .pal-sec — applied to cmdk's [cmdk-group-heading] element.
const GROUP_CLASS = cn(
  "[&_[cmdk-group-heading]]:px-[11px] [&_[cmdk-group-heading]]:pb-[5px] [&_[cmdk-group-heading]]:pt-[9px]",
  "[&_[cmdk-group-heading]]:text-[10.5px] [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:uppercase",
  "[&_[cmdk-group-heading]]:tracking-[0.07em] [&_[cmdk-group-heading]]:text-[var(--text-3)]",
);

export function CommandPalette({
  open,
  onOpenChange,
  actions,
  recents,
  models,
}: CommandPaletteProps) {
  // mockup 1613: global ⌘K / Ctrl+K opens the palette.
  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(true);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onOpenChange]);

  function renderGroup(heading: string, items: CommandItemData[]) {
    if (items.length === 0) return null;
    return (
      <CommandGroup heading={heading} className={GROUP_CLASS}>
        {items.map((item) => (
          <CommandItem
            key={item.id}
            value={item.label}
            className={ITEM_CLASS}
            onSelect={() => {
              item.onSelect();
              onOpenChange(false);
            }}
          >
            <span className="flex-1">{item.label}</span>
            {item.kbd ? (
              <CommandShortcut className="ml-auto text-[11px] text-[var(--text-3)]">
                {item.kbd}
              </CommandShortcut>
            ) : null}
          </CommandItem>
        ))}
      </CommandGroup>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Geometry/skin overrides:
          - top-[14vh]/translate-y-0 → top-aligned like mockup .palette-wrap (padding-top:14vh)
          - max-w-[600px] → mockup .palette width:min(600px,92%)
          - p-0/gap-0/overflow-hidden → surface owns its own padding via the rows below
          - bg/border/shadow/rounded → mockup .palette elevated skin (var(--elevated), var(--border-2), var(--shadow))
          - [&>button]:hidden → hide DialogContent's auto close-X (mockup uses the "esc" hint instead) */}
      <DialogContent
        aria-describedby={undefined}
        className={cn(
          "top-[14vh] translate-y-0",
          "max-w-[600px] gap-0 overflow-hidden p-0",
          "rounded-[16px] border border-[var(--border-2)] bg-[var(--elevated)] shadow-[var(--shadow)]",
          "[&>button]:hidden",
        )}
      >
        <DialogTitle className="sr-only">Command palette</DialogTitle>
        <Command
          className="bg-transparent"
          filter={(value, search) =>
            value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0
          }
        >
          {/* mockup 512 .pal-in — search icon + input + esc hint */}
          <div className="relative flex items-center border-b border-[var(--border)]">
            <Search
              className="pointer-events-none absolute left-[17px] size-[18px] text-[var(--text-3)]"
              aria-hidden="true"
            />
            <CommandInput
              placeholder="Search chats, models, plugins, actions…"
              className="h-auto border-0 py-[15px] pl-[46px] pr-[54px] text-[16px] text-[var(--text)] placeholder:text-[var(--text-3)]"
            />
            <kbd className="absolute right-[17px] inline-flex items-center rounded-[6px] border border-[var(--border)] bg-[var(--surface-2)] px-[6px] py-[2px] text-[11px] text-[var(--text-3)]">
              esc
            </kbd>
          </div>

          {/* mockup 516 .pal-list */}
          <CommandList className="max-h-[340px] overflow-y-auto p-2">
            <CommandEmpty className="px-[11px] py-[10px] text-[13.5px] text-[var(--text-3)]">
              No results found.
            </CommandEmpty>
            {renderGroup("Actions", actions)}
            {renderGroup("Recent chats", recents)}
            {renderGroup("Models", models)}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
```

Notes for the implementer:

- `Command`'s `filter` prop is cmdk's substring matcher; it makes the typing/filter test deterministic and matches the mockup's plain search.
- `CommandInput` from Task 5 renders its own `<input>`; we suppress its default icon/border by supplying `border-0` and provide our own absolutely-positioned `<Search>` icon and `esc` `<kbd>` so the row matches mockup `.pal-in` exactly. If Task 5's `CommandInput` already renders a built-in search icon, keep the wrapper markup here anyway — the `pl-[46px]`/`pr-[54px]` padding accounts for the overlaid icon and kbd; if a duplicate icon appears, delete the standalone `<Search>` element here (do NOT change the padding).
- This component paints **only neutral tokens** (`--elevated --border-2 --border --surface-2 --hover --active? no --text --text-2 --text-3 --shadow`). It uses **no** `--accent`/`--accent-soft`/`--accent-line`. This is required by the brand rule.

- [ ] **Step 4: Add the barrel export.** In `packages/ui/src/index.ts` add (alongside the other `components/*` re-exports, keeping alphabetical/grouped order):

```ts
export { CommandPalette } from "./components/CommandPalette/CommandPalette";
export type { CommandPaletteProps } from "./components/CommandPalette/CommandPalette";
```

- [ ] **Step 5: Run the test and confirm it PASSES.**
      Command: `pnpm --filter @wedevs/ui test -- CommandPalette`
      Expected: all 7 tests green, e.g.:

  ```
   ✓ src/components/CommandPalette/CommandPalette.test.tsx (7 tests)
     ✓ CommandPalette > does not render palette content when open is false
     ✓ CommandPalette > renders the search input, esc hint, and all three groups in order
     ✓ CommandPalette > filters items as the user types in the search input
     ✓ CommandPalette > moves the active row with arrow keys and fires the selected item's onSelect on Enter
     ✓ CommandPalette > closes (onOpenChange(false)) after an item is selected
     ✓ CommandPalette > opens on the global ⌘K / Ctrl+K shortcut
     ✓ CommandPalette > active rows use the neutral --hover token and never --accent
   Test Files  1 passed (1)
        Tests  7 passed (7)
  ```

  If the arrow-key test fails because cmdk did not auto-select the first option in jsdom, add `defaultValue` handling: it is sufficient to verify cmdk selection is active by asserting the first option has `aria-selected="true"` after render; if it does not, wrap the assertions so `ArrowDown` is fired once before the first `Enter` in the "closes after selection" test too. Do NOT weaken the behavior — cmdk selection is standard; investigate the cmdk version first via `superpowers:systematic-debugging`.

- [ ] **Step 6: Typecheck the package.**
      Command: `pnpm --filter @wedevs/ui exec tsc --noEmit`
      Expected: no output, exit code 0. Fix any `any`/unused/type errors before committing (strict mode; the `CommandItemData` alias avoids colliding with the `CommandItem` component import).

- [ ] **Step 7: Lint the package.**
      Command: `pnpm --filter @wedevs/ui lint`
      Expected: no errors (exit 0).

- [ ] **Step 8: Commit.**
      Command:
  ```
  git add packages/ui/src/components/CommandPalette/ packages/ui/src/index.ts
  git commit -m "feat(ui): add CommandPalette (⌘K, Actions/Recent/Models groups)"
  ```
  Expected: one commit created on the `develop` branch (create/checkout `develop` first if not already on it, per git-hygiene memory).

---

**Definition of done:**

- `packages/ui/src/components/CommandPalette/CommandPalette.tsx` exports `CommandPalette` + `CommandPaletteProps` (props verbatim from the shared contract), re-exported from `packages/ui/src/index.ts`.
- The palette renders inside the Task 5 `Dialog`/`DialogContent` (elevated centered-top surface, scrim + focus trap + Escape/scrim close for free) with a cmdk `Command`: search input + `esc` hint and the three groups **Actions → Recent chats → Models** in that fixed order.
- Global `⌘K`/`Ctrl+K` calls `onOpenChange(true)`; selecting an item fires `item.onSelect()` then `onOpenChange(false)`; arrow keys move the active row; Escape/scrim call `onOpenChange(false)` via Radix.
- The active/selected row uses the **neutral `--hover`** token; the component uses **no** `--accent` (verified by test).
- All 7 tests pass; `tsc --noEmit` and `lint` are clean; both light and dark render correctly (token-driven — verified on the `apps/web` shell page).
- Conventional-commit `feat(ui): …` committed.

---

### Task 12: SettingsModal (left sub-nav + panes, live theme preview)

Two-pane settings modal (880×620): a left sub-nav (Account / Appearance / Models / Plugins / Data & privacy / Shortcuts) beside a scrollable pane area with its own header title. The **Appearance** pane is the fully-featured one: live theme-preview swatches (Light / Dark / System) whose chrome uses literal hex (the one sanctioned hardcoded zone), plus accent + density segmented controls and a reduce-motion switch. Picking a swatch calls `onThemeChange` live. The active swatch is styled with `--active-line` / `--hover` — **this surface carries zero ambient accent** (the only accent allowed here is the reduce-motion Switch's on-state fill, which is a globally-sanctioned "on-toggle" liveness).

**Visual source of truth:** `d:/Rajin/Wedevs.cloud/mockup/index.html`

- CSS: lines **466–504** (`.modal`, `.set-nav`, `.set-item`, `.set-main`, `.set-head`, `.set-scroll`, `.set-pane`, `.set-row`, `.seg`, `.theme-prev`, `.tp`)
- `.theme-prev` / `.tp` literal-hex chrome: lines **494–504**
- Markup: lines **1237–1304** (full modal, all six panes)
- setpane JS: lines **1440–1445** (`selectSetting`) and **1602** (sub-nav click → `selectSetting`)
- theme-pick JS: lines **1527–1529** (`data-theme-pick` → `setTheme`)
- seg + toggle JS: lines **1518–1534**

READ those ranges before implementing. Port the markup structure and token classes from them; the pane bodies are ported verbatim (static demo content), and only Appearance carries live behavior wired to props.

---

**Files:**

- CREATE `packages/ui/src/components/SettingsModal/SettingsModal.tsx`
- CREATE `packages/ui/src/components/SettingsModal/SettingsModal.test.tsx`
- MODIFY `packages/ui/src/index.ts` (add barrel export)

**Interfaces:**

Produces (copy verbatim — this is the canonical shape, do NOT rename or add fields):

```ts
export interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pane: SettingsPane;
  onPaneChange: (pane: SettingsPane) => void;
  themeMode: ThemeMode;
  onThemeChange: (mode: ThemeMode) => void;
}
```

Consumes (already built in earlier tasks — import, do NOT redefine):

```ts
// packages/ui/src/types.ts
export type SettingsPane =
  "account" | "appearance" | "models" | "plugins" | "data" | "keys";

// packages/ui/src/store/theme.ts
export type ThemeMode = "light" | "dark" | "system";

// packages/ui/src/lib/cn.ts
export function cn(...inputs: ClassValue[]): string;

// packages/ui/src/primitives/dialog.tsx  (Task 5, re-skinned shadcn v4 — Radix prop shapes)
//   Dialog, DialogContent (accepts `showCloseButton?: boolean`), DialogTitle, DialogClose
// packages/ui/src/primitives/switch.tsx  (Task 5) — Radix Switch: `checked`, `onCheckedChange`
//   role="switch", aria-checked reflects state, on-state fill = --accent (sanctioned liveness)
// packages/ui/src/primitives/button.tsx  (Task 5) — variant: "primary"|"ghost"|"outline"|"danger"|"icon"
```

**Brand-rule note (enforced in review):** the Appearance surface has **zero ambient accent**. The active nav item, active seg button, and active theme swatch are all **neutral** (`--active`, `--surface`, `--active-line`). The ONLY `--accent` on this component is the Switch's on-state fill (comes from the Switch primitive itself — do not add any accent classes in this file). The `.tp` swatch chrome hex values (mockup 500–504) are the sanctioned literal-hex exception because both themes must be shown simultaneously.

---

- [ ] **Step 1: Write the failing test file.**
      Create `packages/ui/src/components/SettingsModal/SettingsModal.test.tsx` with exactly this content:

  ```tsx
  import { describe, it, expect, vi } from "vitest";
  import { render, screen, fireEvent, within } from "@testing-library/react";
  import { SettingsModal } from "./SettingsModal";
  import type { SettingsPane } from "../../types";
  import type { ThemeMode } from "../../store/theme";

  function setup(
    overrides: Partial<React.ComponentProps<typeof SettingsModal>> = {},
  ) {
    const props = {
      open: true,
      onOpenChange: vi.fn(),
      pane: "appearance" as SettingsPane,
      onPaneChange: vi.fn(),
      themeMode: "dark" as ThemeMode,
      onThemeChange: vi.fn(),
      ...overrides,
    };
    render(<SettingsModal {...props} />);
    return props;
  }

  describe("SettingsModal", () => {
    it("renders nothing when open is false", () => {
      setup({ open: false });
      expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("renders the modal with the current pane title", () => {
      setup({ pane: "appearance" });
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { level: 2, name: "Appearance" }),
      ).toBeInTheDocument();
    });

    it("shows the Data & privacy title when pane is data", () => {
      setup({ pane: "data" });
      expect(
        screen.getByRole("heading", { level: 2, name: "Data & privacy" }),
      ).toBeInTheDocument();
    });

    it("fires onPaneChange when a sub-nav item is clicked", () => {
      const props = setup({ pane: "appearance" });
      fireEvent.click(screen.getByRole("button", { name: "Models" }));
      expect(props.onPaneChange).toHaveBeenCalledWith("models");
    });

    it("marks the active pane nav item with aria-current", () => {
      setup({ pane: "appearance" });
      expect(
        screen.getByRole("button", { name: "Appearance" }),
      ).toHaveAttribute("aria-current", "page");
      expect(
        screen.getByRole("button", { name: "Models" }),
      ).not.toHaveAttribute("aria-current");
    });

    it("fires onThemeChange when a theme swatch is picked", () => {
      const props = setup({ pane: "appearance", themeMode: "dark" });
      fireEvent.click(screen.getByRole("button", { name: "Light" }));
      expect(props.onThemeChange).toHaveBeenCalledWith("light");
    });

    it("styles the active theme swatch with --active-line and never with accent", () => {
      setup({ pane: "appearance", themeMode: "dark" });
      const active = screen.getByRole("button", { name: "Dark" });
      expect(active).toHaveAttribute("data-active", "true");
      expect(active.className).toMatch(/active-line/);
      expect(active.className).not.toMatch(/accent/);
      const inactive = screen.getByRole("button", { name: "Light" });
      expect(inactive).toHaveAttribute("data-active", "false");
    });

    it("swaps the active segmented button on click", () => {
      setup({ pane: "appearance" });
      const group = screen.getByRole("group", { name: "Accent color" });
      const slate = within(group).getByRole("button", { name: "Slate" });
      const neutral = within(group).getByRole("button", { name: "Neutral" });
      expect(slate).toHaveAttribute("aria-pressed", "true");
      fireEvent.click(neutral);
      expect(neutral).toHaveAttribute("aria-pressed", "true");
      expect(slate).toHaveAttribute("aria-pressed", "false");
    });

    it("flips the reduce-motion switch when toggled", () => {
      setup({ pane: "appearance" });
      const sw = screen.getByRole("switch", { name: "Reduce motion" });
      expect(sw).toHaveAttribute("aria-checked", "false");
      fireEvent.click(sw);
      expect(sw).toHaveAttribute("aria-checked", "true");
    });

    it("requests close when the header close button is clicked", () => {
      const props = setup({ pane: "appearance" });
      fireEvent.click(screen.getByRole("button", { name: "Close settings" }));
      expect(props.onOpenChange).toHaveBeenCalledWith(false);
    });
  });
  ```

- [ ] **Step 2: Run the test — expect FAIL (module not found).**

  ```bash
  pnpm --filter @wedevs/ui exec vitest run src/components/SettingsModal/SettingsModal.test.tsx
  ```

  Expected output includes:

  ```
  Error: Failed to resolve import "./SettingsModal" from "src/components/SettingsModal/SettingsModal.test.tsx".
  ```

  (Red — the component does not exist yet.)

- [ ] **Step 3: Implement `SettingsModal.tsx`.**
      Create `packages/ui/src/components/SettingsModal/SettingsModal.tsx` with exactly this content. Port the token classes / structure from mockup 466–504 & 1237–1304 (mapped to Tailwind arbitrary-value utilities below). The `.tp` chrome hex (mockup 500–504) is reproduced in `topStyle`/`barStyle`/`mainStyle` (sanctioned literal hex).

  ```tsx
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
    DialogClose,
  } from "../../primitives/dialog";
  import { Switch } from "../../primitives/switch";
  import { Button } from "../../primitives/button";
  import { cn } from "../../lib/cn";
  import type { SettingsPane } from "../../types";
  import type { ThemeMode } from "../../store/theme";

  export interface SettingsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    pane: SettingsPane;
    onPaneChange: (pane: SettingsPane) => void;
    themeMode: ThemeMode;
    onThemeChange: (mode: ThemeMode) => void;
  }

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
    if (v === "light")
      return { background: "#fff", border: "1px solid #e5e8ec" };
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
                        AK
                      </div>
                    }
                    title="Ayesha Khan"
                    desc="ayesha@company.com · Pro workspace"
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
  ```

  **Note on `showCloseButton`:** Task 5's re-skinned shadcn v4 `DialogContent` accepts `showCloseButton?: boolean` (defaults `true`) to suppress the built-in top-right X, since this modal supplies its own close in the pane header. If, when you open `packages/ui/src/primitives/dialog.tsx`, that prop is absent, add it there (shadcn v4 pattern: `function DialogContent({ className, children, showCloseButton = true, ...props })` and render the built-in `<DialogPrimitive.Close>` only when `showCloseButton`). Do not remove the built-in close for other consumers.

- [ ] **Step 4: Run the test — expect PASS.**

  ```bash
  pnpm --filter @wedevs/ui exec vitest run src/components/SettingsModal/SettingsModal.test.tsx
  ```

  Expected output:

  ```
   ✓ src/components/SettingsModal/SettingsModal.test.tsx (10 tests) ...ms
   Test Files  1 passed (1)
        Tests  10 passed (10)
  ```

  (Radix may log a console warning about a missing `Description` for the dialog — this is non-fatal and does not fail the run. If you prefer to silence it, add a visually-hidden `<DialogDescription className="sr-only">Workspace settings</DialogDescription>` inside `DialogContent`, importing `DialogDescription` from the dialog primitive.)

- [ ] **Step 5: Add the barrel export.**
      In `packages/ui/src/index.ts`, add these two lines in the components export section (keep alphabetical grouping consistent with existing entries):

  ```ts
  export { SettingsModal } from "./components/SettingsModal/SettingsModal";
  export type { SettingsModalProps } from "./components/SettingsModal/SettingsModal";
  ```

- [ ] **Step 6: Typecheck the package — expect clean.**

  ```bash
  pnpm --filter @wedevs/ui exec tsc --noEmit
  ```

  Expected output: no output, exit code 0 (no `any`, strict clean). If `tsc` reports the props/return type mismatch on `showCloseButton`, resolve per the Step 3 note.

- [ ] **Step 7: Lint the new files — expect clean.**

  ```bash
  pnpm --filter @wedevs/ui exec eslint src/components/SettingsModal
  ```

  Expected output: no output, exit code 0.

- [ ] **Step 8: Run the full UI test suite to confirm no regressions.**

  ```bash
  pnpm --filter @wedevs/ui test
  ```

  Expected: all test files pass, including `SettingsModal.test.tsx` (10 tests).

- [ ] **Step 9: Commit.**
  ```bash
  git add packages/ui/src/components/SettingsModal packages/ui/src/index.ts packages/ui/src/primitives/dialog.tsx
  git commit -m "feat(ui): add SettingsModal with sub-nav panes and live theme preview"
  ```
  (Include `dialog.tsx` in the commit only if you had to add the `showCloseButton` prop in Step 3.)

---

**Definition of done:**

- `SettingsModal` renders a 880×620 two-pane Radix dialog: left sub-nav (Account / Appearance / Models / Plugins / Data & privacy / Shortcuts) + a scrollable pane area with a header title driven by `TITLES[pane]`.
- Clicking a sub-nav item calls `onPaneChange(id)`; the active item carries `aria-current="page"` and neutral `--active` background (no accent).
- The Appearance pane shows three live theme-preview swatches; the swatch matching `themeMode` has `data-active="true"` and is styled with `--active-line` + `--hover` (verified to contain no `accent` class); clicking any swatch calls `onThemeChange(mode)` live.
- Accent and Density segmented controls swap their active button on click (`aria-pressed`); the reduce-motion `Switch` flips `aria-checked`.
- The `.tp` swatch chrome uses the sanctioned literal hex (mockup 500–504); every other surface consumes tokens — the only `--accent` on this component is the Switch on-state (sanctioned liveness), satisfying the "neutral = interactive · Volt = alive" rule for this zero-ambient-accent surface.
- Header close button (accessible name "Close settings") triggers `onOpenChange(false)`; Radix a11y (focus trap, Escape, `DialogTitle`) intact.
- Exported from `packages/ui/src/index.ts`; `tsc --noEmit` and `eslint` clean; all 10 tests pass in both the file run and the full suite.

---

### Task 13: Toast (bottom-center pill) + ToastProvider/useToast

The Toast is a single, app-wide, bottom-center **pill** that carries a `LiveDot` (the accent "live notification" cue) plus a short message. It slides up + fades in over 200ms, auto-dismisses 2200ms later, and any new `show(msg)` replaces the pending dismiss timer. The app-facing API is `useToast().show(message)`. The low-level `<Toast message visible />` is a pure presentational component driven entirely by props (no timers of its own). Reduced-motion renders an instant show/hide with no transition.

**Brand rule check (`neutral = interactive · Volt = alive`):** the pill **body** is neutral (`--elevated` surface, `--border-2` line, `--text`). The **only** accent element is the `LiveDot` (allowed live/presence dot). Do NOT tint the pill body, border, shadow, or text with `--accent` / `--accent-soft` / `--accent-line`.

---

**Files:**

- CREATE `packages/ui/src/components/Toast/Toast.tsx` — low-level presentational pill (`ToastProps`).
- CREATE `packages/ui/src/components/Toast/Toast.test.tsx` — render/token/reduced-motion tests for the low-level pill.
- CREATE `packages/ui/src/providers/ToastProvider.tsx` — `ToastProvider` + `useToast()` (owns state + 2200ms timer).
- CREATE `packages/ui/src/providers/ToastProvider.test.tsx` — show/auto-dismiss/replace-timer tests (fake timers).
- MODIFY `packages/ui/src/index.ts` — add the three named re-exports.

**Interfaces:**

Consumes (already produced by earlier tasks — import, do NOT redefine):

```ts
// packages/ui/src/lib/cn.ts
export function cn(...inputs: ClassValue[]): string; // clsx piped through twMerge

// packages/ui/src/lib/use-reduced-motion.ts
export function useReducedMotion(): boolean; // (prefers-reduced-motion: reduce)

// packages/ui/src/live/LiveDot.tsx  (Task 6)
export interface LiveDotProps {
  className?: string;
} // pulsing accent dot
export function LiveDot(props: LiveDotProps): JSX.Element;
//   Task-6 contract: renders a 7px round <span> painted with bg-[var(--accent)] and the
//   `live` pulse keyframe; prefers-reduced-motion → static dot (no animation). It is the
//   ONLY accent-painted element inside the pill.
```

Produces (exact shapes from the shared contract — do NOT rename):

```ts
// packages/ui/src/components/Toast/Toast.tsx
export interface ToastProps {
  message: string | null;
  visible: boolean;
} // low-level; use useToast()
export function Toast(props: ToastProps): JSX.Element;

// packages/ui/src/providers/ToastProvider.tsx
export interface ToastContextValue {
  show: (message: string) => void;
} // pill, 2200ms auto-dismiss
export function ToastProvider(props: {
  children: React.ReactNode;
}): JSX.Element;
export function useToast(): ToastContextValue;
```

**Mockup source of truth** (`d:/Rajin/Wedevs.cloud/mockup/index.html`) — READ these ranges before porting:

- **CSS 692–697** — `.toast` pill: `position:fixed; left:50%; bottom:74px; z-index:210; display:flex; align-items:center; gap:9px; padding:10px 16px; border-radius:999px; background:var(--elevated); border:1px solid var(--border-2); box-shadow:var(--shadow),inset 0 1px 0 rgba(255,255,255,.05); font-size:13px; font-weight:600; color:var(--text); opacity:0; pointer-events:none; transition:opacity .2s ease,transform .2s ease`. Hidden transform = `translateX(-50%) translateY(12px)`; `.toast.show` = `opacity:1; transform:translateX(-50%) translateY(0)`.
- **Markup 1333** — `<div class="toast" id="toast"><span class="livedot"></span><span id="toastMsg">Done</span></div>` (dot first, then message span).
- **JS 1451–1452** — `toast(msg)`: sets `toastMsg.textContent=msg`, adds `.show`, clears any existing `toastTimer`, then `setTimeout(remove .show, 2200)`. This is the exact behavior `ToastProvider.show` must reproduce.
- **LiveDot 283–285** — `.livedot{width:7px;height:7px;border-radius:50%;background:var(--accent);animation:live 2s ...}` — already implemented by Task 6's `LiveDot`; just compose it, do not re-create the dot.

---

- [ ] **Step 1: Write the failing low-level Toast test.**
      Create `packages/ui/src/components/Toast/Toast.test.tsx` with exactly:

  ```tsx
  import { describe, it, expect, beforeEach, vi } from "vitest";
  import { render, screen } from "@testing-library/react";
  import { Toast } from "./Toast";

  // matchMedia stub so useReducedMotion() works under jsdom.
  function stubMatchMedia(reduced: boolean) {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      configurable: true,
      value: (query: string) => ({
        matches: reduced && query.includes("prefers-reduced-motion"),
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }),
    });
  }

  describe("Toast (low-level pill)", () => {
    beforeEach(() => stubMatchMedia(false));

    it("renders the message and exposes a polite status region", () => {
      render(<Toast message="Saved" visible={true} />);
      const region = screen.getByRole("status");
      expect(region).toHaveTextContent("Saved");
      expect(region).toHaveAttribute("aria-live", "polite");
    });

    it("reflects visibility via data-visible and aria-hidden", () => {
      const { rerender } = render(<Toast message="Saved" visible={false} />);
      const region = screen.getByRole("status");
      expect(region).toHaveAttribute("data-visible", "false");
      expect(region).toHaveAttribute("aria-hidden", "true");
      rerender(<Toast message="Saved" visible={true} />);
      expect(region).toHaveAttribute("data-visible", "true");
      expect(region).toHaveAttribute("aria-hidden", "false");
    });

    it("paints the pill body with the neutral --elevated surface, not accent", () => {
      render(<Toast message="Saved" visible={true} />);
      const region = screen.getByRole("status");
      // body is neutral
      expect(region.className).toContain("bg-[var(--elevated)]");
      expect(region.className).toContain("border-[var(--border-2)]");
      // body must NOT be volt-tinted anywhere on the root element
      expect(region.className).not.toContain("--accent");
    });

    it("puts the accent LiveDot inside the pill (the only volt element)", () => {
      const { container } = render(<Toast message="Saved" visible={true} />);
      const region = screen.getByRole("status");
      // LiveDot (Task 6) paints bg-[var(--accent)]; it must live inside the pill.
      const dot = region.querySelector('[class*="--accent"]');
      expect(dot).not.toBeNull();
      // and it precedes the message text node's span
      expect(container.querySelector('[class*="--accent"]')).toBe(dot);
    });

    it("uses a 200ms opacity+transform transition when motion is allowed", () => {
      render(<Toast message="Saved" visible={true} />);
      expect(screen.getByRole("status").className).toContain("duration-200");
    });

    it("drops the transition under prefers-reduced-motion", () => {
      stubMatchMedia(true);
      render(<Toast message="Saved" visible={true} />);
      expect(screen.getByRole("status").className).not.toContain(
        "duration-200",
      );
    });
  });
  ```

- [ ] **Step 2: Run the low-level test and confirm it FAILS (module missing).**

  ```
  pnpm --filter @wedevs/ui exec vitest run src/components/Toast/Toast.test.tsx
  ```

  Expected: FAIL — `Error: Failed to resolve import "./Toast"` (the component does not exist yet). This proves the test is wired to the not-yet-written module.

- [ ] **Step 3: Implement the low-level `Toast` pill.**
      Create `packages/ui/src/components/Toast/Toast.tsx` porting the pill from mockup CSS 692–697 + markup 1333 into Tailwind token utilities. Write exactly:

  ```tsx
  import { cn } from "../../lib/cn";
  import { useReducedMotion } from "../../lib/use-reduced-motion";
  import { LiveDot } from "../../live/LiveDot";

  export interface ToastProps {
    message: string | null;
    visible: boolean;
  }

  export function Toast({ message, visible }: ToastProps) {
    const reduced = useReducedMotion();

    return (
      <div
        role="status"
        aria-live="polite"
        aria-hidden={!visible}
        data-visible={visible ? "true" : "false"}
        className={cn(
          // position + layout (mockup .toast 693–694)
          "fixed left-1/2 bottom-[74px] z-[210] flex items-center gap-[9px]",
          "px-4 py-[10px] rounded-full pointer-events-none",
          // neutral pill body (mockup .toast 695–696) — NO accent here
          "bg-[var(--elevated)] border border-[var(--border-2)]",
          "shadow-[var(--shadow),inset_0_1px_0_rgba(255,255,255,0.05)]",
          "text-[13px] font-semibold text-[var(--text)]",
          // horizontal centering transform is always present
          "-translate-x-1/2",
          // show/hide (mockup .toast / .toast.show 696–697)
          reduced
            ? // instant: no transition, no vertical offset
              visible
              ? "opacity-100"
              : "opacity-0"
            : cn(
                "transition-[opacity,transform] duration-200 ease-out",
                visible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-3",
              ),
        )}
      >
        <LiveDot />
        <span>{message}</span>
      </div>
    );
  }
  ```

  Notes for the implementer:
  - `-translate-x-1/2` + `translate-y-0`/`translate-y-3` compose through Tailwind's transform CSS vars, reproducing the mockup's `translateX(-50%) translateY(0|12px)` (`translate-y-3` = 12px = mockup's `12px` hidden offset).
  - The pill stays mounted at all times (hidden via opacity/transform + `pointer-events-none`), matching the single fixed `#toast` node in the mockup.
  - Do NOT add any `--accent*` utility on this element; the `LiveDot` is the sole accent source.

- [ ] **Step 4: Run the low-level test and confirm it PASSES.**

  ```
  pnpm --filter @wedevs/ui exec vitest run src/components/Toast/Toast.test.tsx
  ```

  Expected: PASS — `Test Files 1 passed`, `Tests 6 passed`.

- [ ] **Step 5: Commit the low-level pill.**

  ```
  git add packages/ui/src/components/Toast/Toast.tsx packages/ui/src/components/Toast/Toast.test.tsx
  git commit -m "feat(ui): add low-level Toast pill with accent LiveDot and neutral body"
  ```

  Expected: one commit created; `git status` clean for those two paths.

- [ ] **Step 6: Write the failing ToastProvider test.**
      Create `packages/ui/src/providers/ToastProvider.test.tsx` with exactly:

  ```tsx
  import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
  import { render, screen, act, fireEvent } from "@testing-library/react";
  import { ToastProvider, useToast } from "./ToastProvider";

  function stubMatchMedia() {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      configurable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }),
    });
  }

  // Test harness: a consumer that fires show() with a caller-chosen message.
  function Trigger({ msg }: { msg: string }) {
    const { show } = useToast();
    return <button onClick={() => show(msg)}>show {msg}</button>;
  }

  describe("ToastProvider / useToast", () => {
    beforeEach(() => {
      stubMatchMedia();
      vi.useFakeTimers();
    });
    afterEach(() => {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
    });

    it("useToast throws outside a ToastProvider", () => {
      expect(() => render(<Trigger msg="x" />)).toThrow(
        /useToast must be used within a ToastProvider/,
      );
    });

    it("show(msg) sets the message and makes the pill visible", () => {
      render(
        <ToastProvider>
          <Trigger msg="Saved" />
        </ToastProvider>,
      );
      const region = screen.getByRole("status");
      expect(region).toHaveAttribute("data-visible", "false");

      fireEvent.click(screen.getByRole("button"));

      expect(region).toHaveAttribute("data-visible", "true");
      expect(region).toHaveTextContent("Saved");
    });

    it("auto-dismisses after 2200ms", () => {
      render(
        <ToastProvider>
          <Trigger msg="Saved" />
        </ToastProvider>,
      );
      const region = screen.getByRole("status");

      fireEvent.click(screen.getByRole("button"));
      expect(region).toHaveAttribute("data-visible", "true");

      act(() => {
        vi.advanceTimersByTime(2199);
      });
      expect(region).toHaveAttribute("data-visible", "true"); // still up at 2199ms

      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(region).toHaveAttribute("data-visible", "false"); // gone at 2200ms
    });

    it("a second show replaces the pending dismiss timer", () => {
      render(
        <ToastProvider>
          <Trigger msg="First" />
        </ToastProvider>,
      );
      const region = screen.getByRole("status");
      const button = screen.getByRole("button");

      fireEvent.click(button); // t=0, timer would fire at t=2200
      act(() => {
        vi.advanceTimersByTime(1000); // t=1000
      });
      fireEvent.click(button); // second show at t=1000 → clears old timer, new fires at t=3200

      act(() => {
        vi.advanceTimersByTime(1500); // t=2500 (past original 2200)
      });
      // If the first timer had survived, the pill would be hidden. It must still be visible.
      expect(region).toHaveAttribute("data-visible", "true");
      expect(region).toHaveTextContent("First");

      act(() => {
        vi.advanceTimersByTime(700); // t=3200 → new timer fires
      });
      expect(region).toHaveAttribute("data-visible", "false");
    });

    it("the pill's dot uses accent (LiveDot) while the body stays neutral --elevated", () => {
      render(
        <ToastProvider>
          <Trigger msg="Saved" />
        </ToastProvider>,
      );
      fireEvent.click(screen.getByRole("button"));
      const region = screen.getByRole("status");
      expect(region.className).toContain("bg-[var(--elevated)]"); // neutral body
      expect(region.className).not.toContain("--accent"); // no volt on body
      expect(region.querySelector('[class*="--accent"]')).not.toBeNull(); // accent LiveDot inside
    });
  });
  ```

- [ ] **Step 7: Run the provider test and confirm it FAILS (module missing).**

  ```
  pnpm --filter @wedevs/ui exec vitest run src/providers/ToastProvider.test.tsx
  ```

  Expected: FAIL — `Error: Failed to resolve import "./ToastProvider"`.

- [ ] **Step 8: Implement `ToastProvider` + `useToast`.**
      Create `packages/ui/src/providers/ToastProvider.tsx`. This owns the message/visible state and the single 2200ms timer (port the timer logic from mockup JS 1451–1452 — clear the previous timer on every `show`). Write exactly:

  ```tsx
  import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
    type ReactNode,
  } from "react";
  import { Toast } from "../components/Toast/Toast";

  export interface ToastContextValue {
    show: (message: string) => void;
  }

  const ToastContext = createContext<ToastContextValue | null>(null);

  const TOAST_DURATION_MS = 2200;

  export function ToastProvider({ children }: { children: ReactNode }) {
    const [message, setMessage] = useState<string | null>(null);
    const [visible, setVisible] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const show = useCallback((next: string) => {
      setMessage(next);
      setVisible(true);
      // mockup JS 1452: clear any pending dismiss before arming a fresh one.
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        setVisible(false);
        timerRef.current = null;
      }, TOAST_DURATION_MS);
    }, []);

    // Clean up a pending timer if the provider unmounts.
    useEffect(() => {
      return () => {
        if (timerRef.current !== null) {
          clearTimeout(timerRef.current);
        }
      };
    }, []);

    return (
      <ToastContext.Provider value={{ show }}>
        {children}
        <Toast message={message} visible={visible} />
      </ToastContext.Provider>
    );
  }

  export function useToast(): ToastContextValue {
    const ctx = useContext(ToastContext);
    if (ctx === null) {
      throw new Error("useToast must be used within a ToastProvider");
    }
    return ctx;
  }
  ```

  Notes:
  - Only `visible` flips to `false` on dismiss; `message` is left intact so the pill fades out with its text still readable (matches the mockup, which only removes the `.show` class).
  - `show` is stable (`useCallback` with `[]`), so the context value identity is stable across renders except when React re-creates the object — that is fine; if a consumer memoizes on it, wrap `{ show }` in `useMemo(() => ({ show }), [show])`. Not required for the tests.

- [ ] **Step 9: Run the provider test and confirm it PASSES.**

  ```
  pnpm --filter @wedevs/ui exec vitest run src/providers/ToastProvider.test.tsx
  ```

  Expected: PASS — `Test Files 1 passed`, `Tests 5 passed`.

- [ ] **Step 10: Add the barrel exports.**
      In `packages/ui/src/index.ts`, add (keep alphabetical/grouped with existing exports; do NOT duplicate if a line already exists):

  ```ts
  export { Toast } from "./components/Toast/Toast";
  export type { ToastProps } from "./components/Toast/Toast";
  export { ToastProvider, useToast } from "./providers/ToastProvider";
  export type { ToastContextValue } from "./providers/ToastProvider";
  ```

- [ ] **Step 11: Typecheck the package.**

  ```
  pnpm --filter @wedevs/ui exec tsc --noEmit
  ```

  Expected: no output, exit code 0 (strict, no `any`). If `tsc` reports it cannot find `Toast`/`ToastProvider`, re-check the relative import paths (`../../lib/…`, `../../live/LiveDot`, `../components/Toast/Toast`).

- [ ] **Step 12: Run the full package test + lint to confirm no regressions.**

  ```
  pnpm --filter @wedevs/ui test
  pnpm --filter @wedevs/ui lint
  ```

  Expected: all test files pass (including the two new ones); lint reports 0 errors.

- [ ] **Step 13: Commit the provider + exports.**
  ```
  git add packages/ui/src/providers/ToastProvider.tsx packages/ui/src/providers/ToastProvider.test.tsx packages/ui/src/index.ts
  git commit -m "feat(ui): add ToastProvider/useToast with 2200ms auto-dismiss pill"
  ```
  Expected: one commit created; `git status` clean.

---

**Definition of done:**

- `packages/ui/src/components/Toast/Toast.tsx` renders the bottom-center pill from mockup 692–697/1333: `role="status"`, `aria-live="polite"`, neutral `--elevated` body + `--border-2` border + `--shadow`, an accent `LiveDot` followed by the message span; visibility driven purely by the `visible` prop via `data-visible` / `opacity` / `translate-y`.
- `ToastProvider` supplies `useToast(): { show }`; `show(msg)` sets message + visible, auto-dismisses after **2200ms**, and each new `show` clears/replaces the pending timer (verified with fake timers). `useToast()` throws outside a provider.
- Reduced-motion (`prefers-reduced-motion: reduce`) removes the transition — instant show/hide, no vertical slide.
- Brand rule holds: accent appears only via `LiveDot`; the pill body/border/text/shadow carry no `--accent*` token (asserted by test).
- All three exports (`Toast`+`ToastProps`, `ToastProvider`+`useToast`+`ToastContextValue`) are re-exported from `packages/ui/src/index.ts`.
- `pnpm --filter @wedevs/ui test`, `lint`, and `tsc --noEmit` all pass; both Toast test files green (6 + 5 tests). Work committed as two Conventional Commits.

---

### Task 14: Main-column views — Empty, Chat (thread/message/tool), Code (editor), Marketplace (plugin cards)

The four main-column bodies that fill `AppShell`'s `main` slot, one per `ViewMode`. Every view is pure presentation over the shared domain types; all animation/aliveness is delegated to the already-built `live/` and `mascots/` primitives (Task 6) and the `Composer` (Task 9) — the views themselves add **no new `@keyframes`** and paint `--accent` **only** through those child primitives, the `Switch` on-state (Task 5), keyboard focus rings, and the sanctioned code-diff / syntax zone. The mockup at `d:/Rajin/Wedevs.cloud/mockup/index.html` is the visual source of truth; cited line ranges below are authoritative — port their markup/styles, do not invent.

---

#### Files

**Create**

- `packages/ui/src/views/EmptyView.tsx`
- `packages/ui/src/views/ChatView.tsx`
- `packages/ui/src/views/Thread.tsx`
- `packages/ui/src/views/Message.tsx`
- `packages/ui/src/views/ToolCard.tsx`
- `packages/ui/src/views/CodeView.tsx`
- `packages/ui/src/views/CodeEditor.tsx`
- `packages/ui/src/views/MarketView.tsx`
- `packages/ui/src/views/PluginCard.tsx`
- `packages/ui/src/views/EmptyView.test.tsx`
- `packages/ui/src/views/ChatView.test.tsx`
- `packages/ui/src/views/CodeView.test.tsx`
- `packages/ui/src/views/MarketView.test.tsx`

**Modify**

- `packages/ui/src/types.ts` (ensure the view types listed under Interfaces exist — add any that are missing, verbatim)
- `packages/ui/src/index.ts` (barrel exports)

---

#### Interfaces

**Consumes** (all already produced by prior tasks; import from the paths shown):

```ts
// Task 9
import { Composer } from "../components/Composer/Composer"; // <Composer {...ComposerProps} />
// Task 6 — mascots + live primitives
import { Visor } from "../mascots/Visor"; // VisorProps  { className?: string }
import { Robo } from "../mascots/Robo"; // RoboProps   { size?: number; className?: string } (default 30)
import { LiveDot } from "../live/LiveDot"; // LiveDotProps     { className?: string }
import { LiveCluster } from "../live/LiveCluster"; // LiveClusterProps { label?: string; className?: string }
import { StreamShimmer } from "../live/StreamShimmer"; // StreamShimmerProps { text: string; className?: string } — NEUTRAL gray sweep
import { TypeCaret } from "../live/TypeCaret"; // TypeCaretProps   { className?: string } — accent blinking bar
// Task 5 — primitive (Radix Switch: props `checked`, `onCheckedChange`, `aria-label`)
import { Switch } from "../primitives/switch";
// util
import { cn } from "../lib/cn"; // cn(...ClassValue[]): string
```

**Produces** (exact prop interfaces — copy verbatim, do NOT rename or widen):

```ts
// views/  (from the shared contract — these live in packages/ui/src/types.ts)
export interface EmptyViewProps {
  greeting: string;
  starters: string[];
  composer: ComposerProps;
}
export interface ChatViewProps {
  messages: ChatMessage[];
  streaming?: StreamingMessage;
  composer: ComposerProps;
  onOpenOutput: (id: string) => void;
}
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  model?: string;
  time: string;
  text: string;
  attachments?: Attachment[];
  tool?: ToolCardData;
}
export interface StreamingMessage {
  model: string;
  runningTool?: ToolCardData;
  partialText: string;
}
export interface ToolCardData {
  id: string;
  name: string;
  desc: string;
  done?: string;
  rows: OutputKV[];
} // OutputKV { label: string; value: string }
export interface CodeViewProps {
  repo: string;
  branch: string;
  sync: string;
  onAction: (a: "run" | "pr" | "commit") => void;
}
export interface MarketViewProps {
  plugins: PluginCardData[];
  onToggle: (id: string, on: boolean) => void;
  onConfigure: (id: string) => void;
}
export interface PluginCardData {
  id: string;
  name: string;
  publisher: string;
  verified?: boolean;
  desc: string;
  tags: string[];
  enabled: boolean;
}
```

Plus these **locally declared** child prop interfaces (defined and exported in their own files):

```ts
export interface ThreadProps {
  messages: ChatMessage[];
  streaming?: StreamingMessage;
  onOpenOutput: (id: string) => void;
}
export interface MessageProps {
  message: ChatMessage;
  onOpenOutput: (id: string) => void;
}
export interface ToolCardProps {
  tool: ToolCardData;
  onOpenOutput: (id: string) => void;
}
export interface PluginCardProps {
  plugin: PluginCardData;
  onToggle: (id: string, on: boolean) => void;
  onConfigure: (id: string) => void;
}
```

---

#### Token → Tailwind cheat sheet (use arbitrary-value utilities referencing CSS vars; NEVER hardcode hex except the two sanctioned zones)

| purpose               | utility                                                                                               |
| --------------------- | ----------------------------------------------------------------------------------------------------- |
| page/base bg          | `bg-[var(--bg)]`                                                                                      |
| card surface / raised | `bg-[var(--surface)]` · `bg-[var(--surface-2)]`                                                       |
| sidebar / tree        | `bg-[var(--sidebar)]`                                                                                 |
| **code surface**      | `bg-[var(--sink)]`                                                                                    |
| text tiers            | `text-[var(--text)]` · `text-[var(--text-2)]` · `text-[var(--text-3)]`                                |
| hairline / stronger   | `border-[var(--border)]` · `border-[var(--border-2)]`                                                 |
| hover / active wash   | `hover:bg-[var(--hover)]` · `bg-[var(--active)]`                                                      |
| user bubble fill      | `bg-[var(--bubble)]`                                                                                  |
| neutral primary btn   | `bg-[var(--primary)] text-[var(--primary-text)]`                                                      |
| radii                 | `rounded-[var(--radius)]` (14) · `rounded-[var(--radius-sm)]` (10) · `rounded-[var(--radius-xs)]` (8) |
| state colors          | `text-[var(--success)]` · `text-[var(--warning)]` · `text-[var(--error)]`                             |
| shadow                | `shadow-[var(--shadow-sm)]` · `shadow-[var(--shadow)]`                                                |
| display / mono font   | `font-[var(--font-display)]` · via `style={{ fontFamily: "var(--font-mono)" }}`                       |

**Accent (Volt) is allowed in these views ONLY at:** the `Visor`/`Robo` mascots, `LiveDot`/`LiveCluster`/`TypeCaret` primitives, `StreamShimmer` (which is itself NEUTRAL gray — accent-free), the empty-state hero glow (`--accent-soft` radial, mockup 562–563, part of the mascot), the `Switch` on-state (Task 5 internal), keyboard focus rings (`focus-visible:ring-[var(--accent-line)]`), and the sanctioned code zone: `.ai-edit-bar` background `--accent-soft` (mockup 682), diff-add left bar `--accent` + `--accent-soft` bg (mockup 625/684–686), and the literal syntax `.tok-*` hex (mockup 626) + diff-del literal `rgba(214,73,61,.12)` (mockup 687). **Everything else neutral.** In particular: the empty-state "New session" eyebrow dash — mockup line 215 tints it `--accent`; **deviate and render it neutral `bg-[var(--border-2)]`** to honor the brand rule (it is neither interactive nor alive). No other change from the mockup markup.

---

### Steps

- [ ] **Step 1: Ensure the view domain types exist in `packages/ui/src/types.ts`.**
      Open `packages/ui/src/types.ts`. Confirm each of these is present exactly as in the Interfaces section above: `EmptyViewProps`, `ChatViewProps`, `ChatMessage`, `StreamingMessage`, `ToolCardData`, `CodeViewProps`, `MarketViewProps`, `PluginCardData`. They depend on `Attachment` and `OutputKV`, which already exist in this file. If any of the eight are missing, append them verbatim (they use only already-declared types). Do NOT redefine `Attachment` or `OutputKV`.

- [ ] **Step 2: Verify prerequisites compile & are importable.** Run:
  ```
  pnpm --filter @wedevs/ui exec tsc --noEmit
  ```
  Expected: **clean exit (no output, exit 0)**. If it errors on missing `Composer`/`Visor`/`Robo`/`LiveDot`/`LiveCluster`/`StreamShimmer`/`TypeCaret`/`Switch`, STOP — Tasks 5/6/9 are unmet dependencies; do not proceed.

---

#### EmptyView (mockup: styles 212–219 / 553–554 / 560–572 / 632–634; markup 895–944)

- [ ] **Step 3: Write the failing EmptyView test.** Create `packages/ui/src/views/EmptyView.test.tsx`:

  ```tsx
  import { describe, it, expect, vi } from "vitest";
  import { render, screen, fireEvent } from "@testing-library/react";
  import { EmptyView } from "./EmptyView";
  import type { ComposerProps } from "../types";

  function composerFixture(
    overrides: Partial<ComposerProps> = {},
  ): ComposerProps {
    return {
      variant: "empty",
      value: "",
      onChange: vi.fn(),
      onSubmit: vi.fn(),
      attachments: [],
      attachOpen: false,
      onAttach: vi.fn(),
      onRemoveAttachment: vi.fn(),
      toolsOn: false,
      onToggleTools: vi.fn(),
      onVoice: vi.fn(),
      agentPill: <span>Atlas Pro</span>,
      ...overrides,
    };
  }

  describe("EmptyView", () => {
    it("renders the greeting heading, starter buttons and a composer textbox", () => {
      render(
        <EmptyView
          greeting="Good afternoon, Ayesha."
          starters={["Draft a launch announcement", "Review this pull request"]}
          composer={composerFixture()}
        />,
      );
      expect(
        screen.getByRole("heading", { name: "Good afternoon, Ayesha." }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Draft a launch announcement/ }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Review this pull request/ }),
      ).toBeInTheDocument();
      expect(screen.getByRole("textbox")).toBeInTheDocument();
    });

    it("clicking a starter fills the composer via onChange", () => {
      const onChange = vi.fn();
      render(
        <EmptyView
          greeting="Hi"
          starters={["Analyze a CSV of sales data"]}
          composer={composerFixture({ onChange })}
        />,
      );
      fireEvent.click(
        screen.getByRole("button", { name: /Analyze a CSV of sales data/ }),
      );
      expect(onChange).toHaveBeenCalledWith("Analyze a CSV of sales data");
    });
  });
  ```

- [ ] **Step 4: Run it — expect FAIL.**

  ```
  pnpm --filter @wedevs/ui exec vitest run src/views/EmptyView.test.tsx
  ```

  Expected: fails to resolve `./EmptyView` — `Error: Failed to load url ./EmptyView` (module missing). This is the red state.

- [ ] **Step 5: Implement `EmptyView.tsx`.** Create `packages/ui/src/views/EmptyView.tsx`. Structure ports mockup 900–943: `.hero-bot` wrapper (relative, accent-soft radial glow ::before via inline style, `<Visor/>`, `.hero-shadow`) → neutral eyebrow → `.greet` heading (`greeting` prop) → static `.greet-sub` copy → `<Composer {...composer}/>` capped 640px → `.starters` wrapping the `starters[]` mapped to buttons that call `composer.onChange(s)`. Outer column capped **680px** (mockup 212). Greeting shrinks to `27px` ≤680px (mockup 727).

  ```tsx
  import { Sparkles } from "lucide-react";
  import { Visor } from "../mascots/Visor";
  import { Composer } from "../components/Composer/Composer";
  import { cn } from "../lib/cn";
  import type { EmptyViewProps } from "../types";

  export function EmptyView({ greeting, starters, composer }: EmptyViewProps) {
    return (
      <section className="flex flex-1 items-center justify-center overflow-y-auto px-6 py-8">
        <div className="flex w-full max-w-[680px] flex-col items-center text-center">
          {/* hero mascot — Visor owns bob/scan/antenna + reduced-motion */}
          <div className="relative mb-5 inline-flex flex-col items-center">
            <span
              aria-hidden
              className="pointer-events-none absolute -top-1.5 left-1/2 -z-10 h-[130px] w-[210px] -translate-x-1/2 rounded-full"
              style={{
                background:
                  "radial-gradient(circle,var(--accent-soft),transparent 66%)",
              }}
            />
            <Visor className="visor-svg" />
            <div
              className="mt-[5px] h-[9px] w-14 rounded-[50%] blur-[4px]"
              style={{ background: "rgba(0,0,0,.26)" }}
            />
          </div>

          {/* eyebrow — dash rendered NEUTRAL per brand rule (mockup 215 tints it accent; we do not) */}
          <div className="mb-2 inline-flex items-center gap-[9px] text-[11px] font-bold uppercase tracking-[.18em] text-[var(--text-3)]">
            <span className="h-0.5 w-5 rounded-sm bg-[var(--border-2)]" /> New
            session
          </div>

          <h1 className="mb-2.5 font-[var(--font-display)] text-[34px] font-bold leading-[1.15] tracking-[-.02em] text-[var(--text)] max-[680px]:text-[27px]">
            {greeting}
          </h1>
          <p className="mb-7 text-[15px] text-[var(--text-2)]">
            Pick a model, drop in files, or start from a suggestion.
          </p>

          <div className="mx-0 mb-[22px] mt-0.5 w-full max-w-[640px]">
            <Composer {...composer} />
          </div>

          <div className="mb-[26px] flex max-w-[560px] flex-wrap justify-center gap-2.5">
            {starters.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => composer.onChange(s)}
                className={cn(
                  "flex items-center gap-[9px] rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-3.5 py-[11px] text-left text-[13px] font-medium text-[var(--text)]",
                  "transition-colors hover:border-[var(--border-2)] hover:bg-[var(--hover)]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-line)]",
                )}
              >
                <Sparkles className="h-4 w-4 shrink-0 text-[var(--text-3)]" />{" "}
                {s}
              </button>
            ))}
          </div>
        </div>
      </section>
    );
  }
  ```

  (The taller empty composer is produced by `Composer`'s own `variant="empty"` — mockup 553–554/634 — not by EmptyView.)

- [ ] **Step 6: Run EmptyView test — expect PASS.**

  ```
  pnpm --filter @wedevs/ui exec vitest run src/views/EmptyView.test.tsx
  ```

  Expected: `Test Files 1 passed`, `Tests 2 passed`.

- [ ] **Step 7: Commit.**
  ```
  git add packages/ui/src/views/EmptyView.tsx packages/ui/src/views/EmptyView.test.tsx packages/ui/src/types.ts
  git commit -m "feat(ui): add EmptyView main-column body (Visor hero + starters + tall composer)"
  ```

---

#### ChatView + Thread + Message + ToolCard (mockup: styles 226–305 / 574–578 / 632–660; markup 946–1039)

- [ ] **Step 8: Implement `ToolCard.tsx`.** Ports mockup 253–268 / 969–981. Head (neutral icon tile, name, desc + optional `done` in `--success`, "Open in panel" button → `onOpenOutput(tool.id)`), body of `kv` rows from `tool.rows` (`OutputKV`). No accent anywhere (neutral card).

  ```tsx
  import { BarChart3, ExternalLink } from "lucide-react";
  import type { ToolCardData } from "../types";

  export interface ToolCardProps {
    tool: ToolCardData;
    onOpenOutput: (id: string) => void;
  }

  export function ToolCard({ tool, onOpenOutput }: ToolCardProps) {
    return (
      <div className="mt-3 overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-sm),inset_0_1px_0_rgba(255,255,255,.03)]">
        <div className="flex items-center gap-2.5 border-b border-[var(--border)] bg-[var(--surface-2)] px-[13px] py-2.5">
          <div className="grid h-[26px] w-[26px] shrink-0 place-items-center rounded-[7px] bg-[var(--hover)] text-[var(--text-2)]">
            <BarChart3 className="h-[15px] w-[15px]" />
          </div>
          <div className="min-w-0">
            <div className="text-[13px] font-bold text-[var(--text)]">
              {tool.name}
            </div>
            <div className="text-[11.5px] text-[var(--text-3)]">
              {tool.desc}
              {tool.done ? (
                <>
                  {" · "}
                  <span className="text-[var(--success)]">✓ {tool.done}</span>
                </>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenOutput(tool.id)}
            className="ml-auto flex shrink-0 items-center gap-1.5 rounded-lg border border-[var(--border)] px-[11px] py-1.5 text-[12px] font-semibold text-[var(--text-2)] transition-colors hover:border-[var(--border-2)] hover:bg-[var(--hover)] hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-line)]"
          >
            <ExternalLink className="h-[13px] w-[13px]" /> Open in panel
          </button>
        </div>
        <div className="p-[13px]">
          {tool.rows.map((row, i) => (
            <div
              key={`${row.label}-${i}`}
              className="flex justify-between border-b border-[var(--border)] py-[7px] text-[13px] last:border-b-0"
            >
              <span className="text-[var(--text-3)]">{row.label}</span>
              <span className="font-semibold text-[var(--text)]">
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  ```

- [ ] **Step 9: Implement `Message.tsx`.** Ports mockup 231–268 / 950–991. User role → right-aligned bubble (`justify-end`, `--bubble` fill, radius `16px 16px 5px 16px`, optional attachment chips). Assistant role → `Robo` avatar in a `.who` tile, `msg-name` (`model` + mono `time`), paragraphs (split `text` on blank lines), optional `<ToolCard/>`, hover-revealed action row (Copy/Retry/Good/Bad, `opacity-0 group-hover:opacity-100`). Neutral throughout except focus rings.

  ```tsx
  import { Copy, RotateCcw, ThumbsDown, ThumbsUp } from "lucide-react";
  import { Robo } from "../mascots/Robo";
  import { ToolCard } from "./ToolCard";
  import type { ChatMessage } from "../types";

  export interface MessageProps {
    message: ChatMessage;
    onOpenOutput: (id: string) => void;
  }

  const ACTIONS = [
    { Icon: Copy, label: "Copy" },
    { Icon: RotateCcw, label: "Retry" },
    { Icon: ThumbsUp, label: "Good" },
    { Icon: ThumbsDown, label: "Bad" },
  ] as const;

  export function Message({ message, onOpenOutput }: MessageProps) {
    if (message.role === "user") {
      return (
        <div className="group relative flex justify-end gap-3.5">
          <div className="max-w-[80%] flex-[0_1_auto]">
            <div className="rounded-[16px_16px_5px_16px] border border-[var(--border)] bg-[var(--bubble)] px-[15px] py-3 text-[var(--text)]">
              {message.text}
            </div>
            {message.attachments?.length ? (
              <div className="mt-[9px] flex flex-wrap justify-end gap-2">
                {message.attachments.map((a) => (
                  <div
                    key={a.id}
                    className="flex max-w-[230px] items-center gap-[9px] rounded-[11px] border border-[var(--border)] bg-[var(--surface-2)] py-2 pl-2 pr-2.5 text-[12.5px] font-semibold text-[var(--text)]"
                  >
                    <span className="truncate">{a.name}</span>
                    <span className="shrink-0 text-[11px] font-medium text-[var(--text-3)]">
                      {a.sub}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      );
    }

    return (
      <div className="group relative flex gap-3.5">
        <div
          className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-[9px]"
          style={{
            background: "radial-gradient(circle at 50% 34%,#34393b,#1d2021)",
          }}
        >
          <Robo size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-[5px] flex items-center gap-2 text-[12.5px] font-bold text-[var(--text-2)]">
            {message.model ?? "Assistant"}{" "}
            <span
              className="text-[11px] font-medium text-[var(--text-3)]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {message.time}
            </span>
          </div>
          <div className="text-[14.5px] text-[var(--text)] [&_p]:mb-2.5 [&_p:last-child]:mb-0">
            {message.text.split("\n\n").map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
          {message.tool ? (
            <ToolCard tool={message.tool} onOpenOutput={onOpenOutput} />
          ) : null}
          <div className="mt-2 flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
            {ACTIONS.map(({ Icon, label }) => (
              <button
                key={label}
                type="button"
                title={label}
                aria-label={label}
                className="grid h-7 w-7 place-items-center rounded-[7px] text-[var(--text-3)] hover:bg-[var(--hover)] hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-line)]"
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }
  ```

- [ ] **Step 10: Implement `Thread.tsx`.** Ports mockup 226–230 (thread/thread-inner) + streaming block 993–1005. Scroll container → `768px` inner column → mapped `<Message/>` → optional streaming row. **Streaming row substitutes the mockup's `.loader` donut with the sanctioned `<LiveDot/>`** in the running-tool bar (Task 6 produced no loader primitive; `LiveDot` is the accent-allowed liveness cue), uses `<LiveCluster/>` beside the name (mockup 997), and reveals `partialText` via `<StreamShimmer/>` (NEUTRAL gray) + `<TypeCaret/>` (accent). Give the streaming wrapper `data-testid="streaming-message"` and the reveal `<p>` `data-testid="stream-line"`.

  ```tsx
  import { Robo } from "../mascots/Robo";
  import { LiveCluster } from "../live/LiveCluster";
  import { LiveDot } from "../live/LiveDot";
  import { StreamShimmer } from "../live/StreamShimmer";
  import { TypeCaret } from "../live/TypeCaret";
  import { Message } from "./Message";
  import type { ChatMessage, StreamingMessage } from "../types";

  export interface ThreadProps {
    messages: ChatMessage[];
    streaming?: StreamingMessage;
    onOpenOutput: (id: string) => void;
  }

  export function Thread({ messages, streaming, onOpenOutput }: ThreadProps) {
    return (
      <div className="flex-1 overflow-y-auto px-6 pb-2 pt-[26px]">
        <div className="mx-auto flex max-w-[768px] flex-col gap-[26px]">
          {messages.map((m) => (
            <Message key={m.id} message={m} onOpenOutput={onOpenOutput} />
          ))}

          {streaming ? (
            <div
              className="relative flex gap-3.5"
              data-testid="streaming-message"
            >
              <div
                className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-[9px]"
                style={{
                  background:
                    "radial-gradient(circle at 50% 34%,#34393b,#1d2021)",
                }}
              >
                <Robo size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-[5px] flex items-center gap-2 text-[12.5px] font-bold text-[var(--text-2)]">
                  {streaming.model} <LiveCluster />{" "}
                  <span
                    className="text-[11px] font-medium text-[var(--text-3)]"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    now
                  </span>
                </div>

                {streaming.runningTool ? (
                  <div className="mt-3 flex items-center gap-[11px] rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] px-[13px] py-2.5">
                    <LiveDot />
                    <div>
                      <div className="text-[13px] font-semibold text-[var(--text)]">
                        {streaming.runningTool.name}
                      </div>
                      <div className="text-[11.5px] text-[var(--text-3)]">
                        {streaming.runningTool.desc}
                      </div>
                    </div>
                    {streaming.runningTool.done ? (
                      <span
                        className="ml-auto text-[11px] text-[var(--text-3)]"
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        {streaming.runningTool.done}
                      </span>
                    ) : null}
                  </div>
                ) : null}

                <p className="mt-3 text-[14.5px]" data-testid="stream-line">
                  <StreamShimmer text={streaming.partialText} />
                  <TypeCaret />
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    );
  }
  ```

- [ ] **Step 11: Implement `ChatView.tsx`.** Ports mockup 227 (`view-chat` column) + composer-wrap 308–311 / 1009–1013. Column: `<Thread/>` (flex-1 scroll) over a pinned composer region (`768px` inner).

  ```tsx
  import { Composer } from "../components/Composer/Composer";
  import { Thread } from "./Thread";
  import type { ChatViewProps } from "../types";

  export function ChatView({
    messages,
    streaming,
    composer,
    onOpenOutput,
  }: ChatViewProps) {
    return (
      <section className="flex min-h-0 flex-1 flex-col">
        <Thread
          messages={messages}
          streaming={streaming}
          onOpenOutput={onOpenOutput}
        />
        <div className="relative z-[1] shrink-0 px-6 pb-5 pt-2">
          <div className="mx-auto max-w-[768px]">
            <Composer {...composer} />
          </div>
        </div>
      </section>
    );
  }
  ```

- [ ] **Step 12: Write the ChatView test.** Create `packages/ui/src/views/ChatView.test.tsx`:

  ```tsx
  import { describe, it, expect, vi } from "vitest";
  import { render, screen, fireEvent, within } from "@testing-library/react";
  import { ChatView } from "./ChatView";
  import type { ChatMessage, ComposerProps, StreamingMessage } from "../types";

  function composerFixture(): ComposerProps {
    return {
      variant: "chat",
      value: "",
      onChange: vi.fn(),
      onSubmit: vi.fn(),
      attachments: [],
      attachOpen: false,
      onAttach: vi.fn(),
      onRemoveAttachment: vi.fn(),
      toolsOn: false,
      onToggleTools: vi.fn(),
      onVoice: vi.fn(),
      agentPill: <span>Atlas Pro</span>,
    };
  }

  const messages: ChatMessage[] = [
    { id: "u1", role: "user", time: "14:21", text: "Draft a Q3 plan." },
    {
      id: "a1",
      role: "assistant",
      model: "Atlas Pro",
      time: "14:22",
      text: "Here is the plan.",
      tool: {
        id: "t1",
        name: "Analytics · channel breakdown",
        desc: "Ran on Q2-metrics.pdf",
        done: "1.2s",
        rows: [{ label: "Paid search", value: "41%" }],
      },
    },
  ];

  describe("ChatView", () => {
    it("right-aligns the user bubble", () => {
      render(
        <ChatView
          messages={messages}
          composer={composerFixture()}
          onOpenOutput={vi.fn()}
        />,
      );
      const bubble = screen.getByText("Draft a Q3 plan.");
      expect(bubble.closest("div.group")).toHaveClass("justify-end");
    });

    it("fires onOpenOutput with the tool id when 'Open in panel' is clicked", () => {
      const onOpenOutput = vi.fn();
      render(
        <ChatView
          messages={messages}
          composer={composerFixture()}
          onOpenOutput={onOpenOutput}
        />,
      );
      fireEvent.click(screen.getByRole("button", { name: /Open in panel/ }));
      expect(onOpenOutput).toHaveBeenCalledWith("t1");
    });

    it("renders the streaming reveal (StreamShimmer text + running tool + LiveCluster 'now')", () => {
      const streaming: StreamingMessage = {
        model: "Atlas Pro",
        runningTool: {
          id: "r1",
          name: "Running analytics",
          desc: "Reading Q2-metrics.pdf…",
          rows: [],
        },
        partialText: "Weighting toward paid search",
      };
      render(
        <ChatView
          messages={messages}
          streaming={streaming}
          composer={composerFixture()}
          onOpenOutput={vi.fn()}
        />,
      );
      const stream = screen.getByTestId("streaming-message");
      expect(
        within(stream).getByText("Weighting toward paid search"),
      ).toBeInTheDocument();
      expect(within(stream).getByText("Running analytics")).toBeInTheDocument();
      expect(within(stream).getByText("now")).toBeInTheDocument();
      expect(within(stream).getByTestId("stream-line")).toBeInTheDocument();
    });
  });
  ```

- [ ] **Step 13: Run the ChatView test — expect PASS.**

  ```
  pnpm --filter @wedevs/ui exec vitest run src/views/ChatView.test.tsx
  ```

  Expected: `Test Files 1 passed`, `Tests 3 passed`. If `getByText("Weighting toward paid search")` fails because `StreamShimmer` splits its text into per-character spans, fall back to `within(stream).getByTestId("stream-line")` containing the text via `toHaveTextContent("Weighting toward paid search")` — but first confirm `StreamShimmer` renders a single text node (Task 6 renders `<span className="stream-shimmer">{text}</span>`; the direct `getByText` should pass).

- [ ] **Step 14: Commit.**
  ```
  git add packages/ui/src/views/ToolCard.tsx packages/ui/src/views/Message.tsx packages/ui/src/views/Thread.tsx packages/ui/src/views/ChatView.tsx packages/ui/src/views/ChatView.test.tsx
  git commit -m "feat(ui): add ChatView with Thread/Message/ToolCard + live streaming row"
  ```

---

#### CodeView + CodeEditor (mockup: styles 588–630 / 662–691; markup 1069–1120)

- [ ] **Step 15: Implement `CodeEditor.tsx`.** Ports mockup 1083–1113. Two columns: `.code-tree` (`--sidebar` bg, **`max-[760px]:hidden`**, `data-testid="code-tree"`, static file rows from 1085–1089 with change badges `A`=`--success`, `M`=`--warning`) and `.code-main` (tabs → `.ai-edit-bar` → `.editor`). The editor is static demo content (1097–1111). **Sanctioned hex zone:** `.tok-*` literal colors (mockup 626) and diff-del literal `rgba(214,73,61,.12)`; diff-add uses `--accent-soft`/`--accent`. Tag each diff line with `data-diff="add" | "del" | "editing"`. `.ai-edit-bar` uses `--accent-soft` bg with a leading `<LiveDot/>` (substituting the `.loader`) and a trailing `<LiveCluster/>`. The editing line uses `<StreamShimmer/>` + `<TypeCaret/>`.

  ```tsx
  import { FileText, Folder } from "lucide-react";
  import { LiveCluster } from "../live/LiveCluster";
  import { LiveDot } from "../live/LiveDot";
  import { StreamShimmer } from "../live/StreamShimmer";
  import { TypeCaret } from "../live/TypeCaret";

  // syntax tokens — sanctioned literal-hex zone (mockup 626)
  const K = ({ children }: { children: React.ReactNode }) => (
    <span className="text-[#c58af0]">{children}</span>
  );
  const Fn = ({ children }: { children: React.ReactNode }) => (
    <span className="text-[#77aee6]">{children}</span>
  );
  const S = ({ children }: { children: React.ReactNode }) => (
    <span className="text-[#cba36a]">{children}</span>
  );
  const C = ({ children }: { children: React.ReactNode }) => (
    <span className="italic text-[var(--text-3)]">{children}</span>
  );
  const Tag = ({ children }: { children: React.ReactNode }) => (
    <span className="text-[#77aee6]">{children}</span>
  );

  const LINE = "flex px-3.5 whitespace-pre min-w-max hover:bg-[var(--hover)]";
  const LN =
    "w-[30px] shrink-0 pr-4 text-right text-[var(--text-3)] opacity-[.65] select-none";

  export function CodeEditor() {
    return (
      <div className="flex min-h-0 flex-1">
        {/* file tree — hidden ≤760px (mockup 630) */}
        <aside
          data-testid="code-tree"
          className="w-[214px] shrink-0 overflow-y-auto border-r border-[var(--border)] bg-[var(--sidebar)] px-2 py-2.5 max-[760px]:hidden"
        >
          <div className="flex items-center gap-[7px] px-2 py-2 text-[10px] font-bold uppercase tracking-[.11em] text-[var(--text-3)]">
            <Folder className="h-4 w-4" /> web-app
            <span
              className="ml-auto tracking-normal"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              3 changed
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-[7px] px-[9px] py-1.5 text-[13px] text-[var(--text-2)] hover:bg-[var(--hover)] hover:text-[var(--text)]">
            <Folder className="h-4 w-4 text-[var(--text-3)]" /> src
          </div>
          <div className="ml-3.5 flex items-center gap-2 rounded-[7px] px-[9px] py-1.5 text-[13px] text-[var(--text-2)] hover:bg-[var(--hover)] hover:text-[var(--text)]">
            <FileText className="h-4 w-4 text-[var(--text-3)]" /> lib/agents.ts
            <span className="ml-auto text-[10px] font-extrabold text-[var(--success)]">
              A
            </span>
          </div>
          <div className="ml-3.5 flex items-center gap-2 rounded-[7px] bg-[var(--active)] px-[9px] py-1.5 text-[13px] text-[var(--text)]">
            <FileText className="h-4 w-4 text-[var(--text-3)]" /> ChatStream.tsx
            <span className="ml-auto text-[10px] font-extrabold text-[var(--warning)]">
              M
            </span>
          </div>
          <div className="ml-3.5 flex items-center gap-2 rounded-[7px] px-[9px] py-1.5 text-[13px] text-[var(--text-2)] hover:bg-[var(--hover)] hover:text-[var(--text)]">
            <FileText className="h-4 w-4 text-[var(--text-3)]" /> theme.css
            <span className="ml-auto text-[10px] font-extrabold text-[var(--warning)]">
              M
            </span>
          </div>
        </aside>

        {/* editor column */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-0.5 border-b border-[var(--border)] bg-[var(--bg)] px-2.5 pt-1.5">
            <div className="flex items-center gap-2 rounded-t-lg bg-[var(--sink)] px-[13px] py-2 text-[12.5px] text-[var(--text)]">
              <FileText className="h-[13px] w-[13px]" /> ChatStream.tsx
            </div>
          </div>

          {/* AI live-edit bar — sanctioned accent-soft zone (mockup 682) */}
          <div className="flex items-center gap-[9px] border-b border-[var(--border)] bg-[var(--accent-soft)] px-3.5 py-2 text-[12px] text-[var(--text-2)]">
            <LiveDot />
            <span>
              <b className="font-bold text-[var(--text)]">Wedevs AI</b> is
              editing{" "}
              <span style={{ fontFamily: "var(--font-mono)" }}>
                ChatStream.tsx
              </span>{" "}
              · streaming from chat
            </span>
            <LiveCluster className="ml-auto" />
          </div>

          <div
            className="flex-1 overflow-auto bg-[var(--sink)] py-3 text-[12.5px] leading-[1.8]"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            <div className={LINE}>
              <span className={LN}>1</span>
              <span>
                <K>import</K> {"{ streamChat }"} <K>from</K>{" "}
                <S>'@/lib/agents'</S>
              </span>
            </div>
            <div className={LINE}>
              <span className={LN}>2</span>
              <span>
                <K>import</K> {"{ useState, useRef }"} <K>from</K>{" "}
                <S>'react'</S>
              </span>
            </div>
            <div className={LINE}>
              <span className={LN}>3</span>
              <span> </span>
            </div>
            <div className={LINE}>
              <span className={LN}>4</span>
              <span>
                <C>{"// streams the assistant reply token-by-token"}</C>
              </span>
            </div>
            <div className={LINE}>
              <span className={LN}>5</span>
              <span>
                <K>export function</K> <Fn>ChatStream</Fn>({"{ agent }"}: Props){" "}
                {"{"}
              </span>
            </div>
            <div className={LINE}>
              <span className={LN}>6</span>
              <span>
                {"  "}
                <K>const</K> [text, setText] = <Fn>useState</Fn>(<S>''</S>)
              </span>
            </div>
            <div
              data-diff="del"
              className="flex px-3.5 whitespace-pre min-w-max relative bg-[rgba(214,73,61,.12)] [&>span:last-child]:opacity-70"
            >
              <span className={`${LN} !text-[var(--error)]`}>−</span>
              <span>
                {"  "}
                <K>const</K> live = <K>false</K>
              </span>
            </div>
            <div
              data-diff="add"
              className="flex px-3.5 whitespace-pre min-w-max relative bg-[var(--accent-soft)] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-0.5 before:bg-[var(--accent)] before:content-['']"
            >
              <span className={`${LN} !text-[var(--success)]`}>7</span>
              <span>
                {"  "}
                <K>const</K> live = <Fn>useRef</Fn>(<K>true</K>){"  "}
                <C>{"// volt only while streaming"}</C>
              </span>
            </div>
            <div className={LINE}>
              <span className={LN}>8</span>
              <span> </span>
            </div>
            <div className={LINE}>
              <span className={LN}>9</span>
              <span>
                {"  "}
                <K>for await</K> (<K>const</K> token <K>of</K>{" "}
                <Fn>streamChat</Fn>(agent)) {"{"}
              </span>
            </div>
            <div
              data-diff="add"
              className="flex px-3.5 whitespace-pre min-w-max relative bg-[var(--accent-soft)] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-0.5 before:bg-[var(--accent)] before:content-['']"
            >
              <span className={`${LN} !text-[var(--success)]`}>10</span>
              <span>
                {"    "}
                <Fn>setText</Fn>((t) =&gt; t + token){"  "}
                <C>{"// gray shimmer reveal"}</C>
              </span>
            </div>
            <div className={LINE}>
              <span className={LN}>11</span>
              <span>{"  }"}</span>
            </div>
            <div className={LINE}>
              <span className={LN}>12</span>
              <span>
                {"  "}
                <K>return</K> <Tag>&lt;Message</Tag> live={"{live}"}{" "}
                <Tag>/&gt;</Tag>
              </span>
            </div>
            <div className={LINE}>
              <span className={LN}>13</span>
              <span>{"}"}</span>
            </div>
            <div
              data-diff="editing"
              className="flex px-3.5 whitespace-pre min-w-max bg-[var(--hover)]"
            >
              <span className={LN}>14</span>
              <span>
                {"  "}
                <StreamShimmer text="// wiring token stream…" />
                <TypeCaret />
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  ```

- [ ] **Step 16: Implement `CodeView.tsx`.** Ports mockup 1069–1120. `.code-head` (repo split on last `/` into muted org + bold name; `.branch` button with `<LiveDot/>` + `branch` prop; `.gh-sync` mono line showing `sync` prop; actions Run/Create PR = ghost, Commit = primary → `onAction`) → `<CodeEditor/>` body → `.code-foot` (`<LiveDot/>` + `branch`, static changed-files segment, static status segment).

  ```tsx
  import {
    GitBranch,
    GitCommitHorizontal,
    GitPullRequest,
    Play,
    RefreshCw,
  } from "lucide-react";
  import { LiveDot } from "../live/LiveDot";
  import { CodeEditor } from "./CodeEditor";
  import type { CodeViewProps } from "../types";

  export function CodeView({ repo, branch, sync, onAction }: CodeViewProps) {
    const slash = repo.lastIndexOf("/");
    const org = slash >= 0 ? repo.slice(0, slash + 1) : "";
    const name = slash >= 0 ? repo.slice(slash + 1) : repo;

    return (
      <section className="flex min-h-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center gap-3 border-b border-[var(--border)] px-[18px] py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-[9px] border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-2)]">
              <GitBranch className="h-4 w-4" />
            </span>
            <div className="whitespace-nowrap text-[14.5px] font-bold">
              <span className="font-medium text-[var(--text-3)]">{org}</span>
              {name}
            </div>
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-[7px] rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-[12.5px] font-semibold text-[var(--text)] hover:border-[var(--border-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-line)]"
          >
            <LiveDot /> {branch}
          </button>

          <span
            className="inline-flex items-center gap-1.5 text-[11px] text-[var(--text-3)]"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            <RefreshCw className="h-4 w-4" /> {sync}
          </span>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => onAction("run")}
              className="inline-flex items-center gap-[7px] rounded-[9px] border border-[var(--border)] px-[13px] py-2 text-[12.5px] font-semibold text-[var(--text-2)] hover:border-[var(--border-2)] hover:bg-[var(--hover)] hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-line)]"
            >
              <Play className="h-4 w-4" /> Run
            </button>
            <button
              type="button"
              onClick={() => onAction("pr")}
              className="inline-flex items-center gap-[7px] rounded-[9px] border border-[var(--border)] px-[13px] py-2 text-[12.5px] font-semibold text-[var(--text-2)] hover:border-[var(--border-2)] hover:bg-[var(--hover)] hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-line)]"
            >
              <GitPullRequest className="h-4 w-4" /> Create PR
            </button>
            <button
              type="button"
              onClick={() => onAction("commit")}
              className="inline-flex items-center gap-[7px] rounded-[9px] bg-[var(--primary)] px-[13px] py-2 text-[12.5px] font-semibold text-[var(--primary-text)] hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-line)]"
            >
              <GitCommitHorizontal className="h-4 w-4" /> Commit
            </button>
          </div>
        </div>

        <CodeEditor />

        <div
          className="flex items-center gap-4 border-t border-[var(--border)] bg-[var(--bg)] px-4 py-2 text-[11px] text-[var(--text-3)]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          <span className="flex items-center gap-1.5">
            <LiveDot /> {branch}
          </span>
          <span className="flex items-center gap-1.5">
            3 files changed · +48 −12
          </span>
          <span className="ml-auto">
            TypeScript · React · UTF-8 · Ln 12, Col 24
          </span>
        </div>
      </section>
    );
  }
  ```

- [ ] **Step 17: Write the CodeView test.** Create `packages/ui/src/views/CodeView.test.tsx`:

  ```tsx
  import { describe, it, expect, vi } from "vitest";
  import { render, screen, fireEvent } from "@testing-library/react";
  import { CodeView } from "./CodeView";

  const base = {
    repo: "wedevs/web-app",
    branch: "main",
    sync: "synced · ↑2 ↓0",
  };

  describe("CodeView", () => {
    it("fires onAction for Run / Create PR / Commit in order", () => {
      const onAction = vi.fn();
      render(<CodeView {...base} onAction={onAction} />);
      fireEvent.click(screen.getByRole("button", { name: /Run/ }));
      fireEvent.click(screen.getByRole("button", { name: /Create PR/ }));
      fireEvent.click(screen.getByRole("button", { name: /Commit/ }));
      expect(onAction).toHaveBeenNthCalledWith(1, "run");
      expect(onAction).toHaveBeenNthCalledWith(2, "pr");
      expect(onAction).toHaveBeenNthCalledWith(3, "commit");
    });

    it("renders diff add / del / editing lines", () => {
      const { container } = render(<CodeView {...base} onAction={vi.fn()} />);
      expect(container.querySelector('[data-diff="add"]')).not.toBeNull();
      expect(container.querySelector('[data-diff="del"]')).not.toBeNull();
      expect(container.querySelector('[data-diff="editing"]')).not.toBeNull();
    });

    it("hides the file tree at <=760px via a responsive utility class", () => {
      const { container } = render(<CodeView {...base} onAction={vi.fn()} />);
      const tree = container.querySelector('[data-testid="code-tree"]');
      expect(tree).not.toBeNull();
      expect(tree?.className).toContain("max-[760px]:hidden");
    });

    it("shows the branch name in both the head button and the foot", () => {
      render(<CodeView {...base} onAction={vi.fn()} />);
      expect(screen.getAllByText("main").length).toBeGreaterThanOrEqual(2);
    });
  });
  ```

- [ ] **Step 18: Run the CodeView test — expect PASS.**

  ```
  pnpm --filter @wedevs/ui exec vitest run src/views/CodeView.test.tsx
  ```

  Expected: `Test Files 1 passed`, `Tests 4 passed`.

- [ ] **Step 19: Commit.**
  ```
  git add packages/ui/src/views/CodeEditor.tsx packages/ui/src/views/CodeView.tsx packages/ui/src/views/CodeView.test.tsx
  git commit -m "feat(ui): add CodeView + CodeEditor (repo head, diff editor, ai-edit-bar, foot)"
  ```

---

#### MarketView + PluginCard (mockup: styles 351–386 / 662 / 680–681; markup 1041–1066)

- [ ] **Step 20: Implement `PluginCard.tsx`.** Ports mockup 368–386 / 1059. Card: top (neutral icon tile + name + `publisher` and, if `verified`, ` · verified`), desc, tags, foot: `<Switch>` (on-state accent is internal to the primitive) → `onToggle(plugin.id, on)`, status label synced to `enabled` (`"Enabled"`/`"Disabled"`), Configure button → `onConfigure(plugin.id)`. Wrapper `data-testid="plugin-card"`.

  ```tsx
  import { Puzzle } from "lucide-react";
  import { Switch } from "../primitives/switch";
  import type { PluginCardData } from "../types";

  export interface PluginCardProps {
    plugin: PluginCardData;
    onToggle: (id: string, on: boolean) => void;
    onConfigure: (id: string) => void;
  }

  export function PluginCard({
    plugin,
    onToggle,
    onConfigure,
  }: PluginCardProps) {
    return (
      <div
        data-testid="plugin-card"
        className="flex flex-col gap-[11px] rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-sm),inset_0_1px_0_rgba(255,255,255,.03)] transition-[border-color,transform] hover:-translate-y-0.5 hover:border-[var(--border-2)]"
      >
        <div className="flex items-center gap-[11px]">
          <div className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[10px] border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-2)]">
            <Puzzle className="h-[18px] w-[18px]" />
          </div>
          <div>
            <div className="text-[14.5px] font-bold text-[var(--text)]">
              {plugin.name}
            </div>
            <div className="text-[11.5px] text-[var(--text-3)]">
              {plugin.publisher}
              {plugin.verified ? " · verified" : ""}
            </div>
          </div>
        </div>

        <div className="flex-1 text-[13px] text-[var(--text-2)]">
          {plugin.desc}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {plugin.tags.map((t) => (
            <span
              key={t}
              className="inline-flex h-5 items-center rounded-full border border-[var(--border)] px-2 text-[11px] font-medium text-[var(--text-3)]"
            >
              {t}
            </span>
          ))}
        </div>

        <div className="mt-0.5 flex items-center gap-2.5">
          <Switch
            checked={plugin.enabled}
            onCheckedChange={(on) => onToggle(plugin.id, on)}
            aria-label={`Toggle ${plugin.name}`}
          />
          <span className="text-[12px] font-semibold text-[var(--text-3)]">
            {plugin.enabled ? "Enabled" : "Disabled"}
          </span>
          <button
            type="button"
            onClick={() => onConfigure(plugin.id)}
            className="ml-auto text-[12.5px] font-semibold text-[var(--text-2)] hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-line)]"
          >
            Configure
          </button>
        </div>
      </div>
    );
  }
  ```

- [ ] **Step 21: Implement `MarketView.tsx`.** Ports mockup 352–367 / 1042–1066. Scroll column: `.market-head` (title, sub, search-box input [display-only, no callback in contract → uncontrolled with `aria-label`], filter pills with **local** active state) → responsive `.market-grid` (`grid-cols-[repeat(auto-fill,minmax(280px,1fr))]`) of `<PluginCard/>`.

  ```tsx
  import { useState } from "react";
  import { Search } from "lucide-react";
  import { cn } from "../lib/cn";
  import { PluginCard } from "./PluginCard";
  import type { MarketViewProps } from "../types";

  const FILTERS = [
    "All",
    "Installed",
    "Search",
    "Dev tools",
    "Data",
    "Productivity",
  ] as const;

  export function MarketView({
    plugins,
    onToggle,
    onConfigure,
  }: MarketViewProps) {
    const [active, setActive] = useState<string>("All");

    return (
      <section className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="mx-auto w-full max-w-[1000px] px-[26px] pb-4 pt-[26px]">
          <div className="text-[22px] font-bold tracking-[-.01em]">
            Plugins &amp; tools
          </div>
          <div className="mt-1 text-[var(--text-2)]">
            Extend your models with connectors, tools, and data sources.
          </div>
          <div className="mt-[18px] flex flex-wrap gap-2.5">
            <div className="flex min-w-[200px] flex-1 items-center gap-[9px] rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 py-[9px] focus-within:border-[var(--accent-line)]">
              <Search className="h-4 w-4 text-[var(--text-3)]" />
              <input
                aria-label="Search plugins"
                placeholder="Search plugins…"
                className="flex-1 border-none bg-transparent text-[var(--text)] outline-none placeholder:text-[var(--text-3)]"
              />
            </div>
            <div className="flex flex-wrap gap-[7px]">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  type="button"
                  aria-pressed={active === f}
                  onClick={() => setActive(f)}
                  className={cn(
                    "rounded-full border px-[13px] py-2 text-[13px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-line)]",
                    active === f
                      ? "border-[var(--border-2)] bg-[var(--active)] text-[var(--text)]"
                      : "border-[var(--border)] text-[var(--text-2)] hover:bg-[var(--hover)] hover:text-[var(--text)]",
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mx-auto grid w-full max-w-[1000px] grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3.5 px-[26px] pb-10 pt-1.5">
          {plugins.map((p) => (
            <PluginCard
              key={p.id}
              plugin={p}
              onToggle={onToggle}
              onConfigure={onConfigure}
            />
          ))}
        </div>
      </section>
    );
  }
  ```

- [ ] **Step 22: Write the MarketView test.** Create `packages/ui/src/views/MarketView.test.tsx`:

  ```tsx
  import { describe, it, expect, vi } from "vitest";
  import { render, screen, fireEvent, within } from "@testing-library/react";
  import { MarketView } from "./MarketView";
  import type { PluginCardData } from "../types";

  const plugins: PluginCardData[] = [
    {
      id: "web-search",
      name: "Web Search",
      publisher: "Core",
      verified: true,
      desc: "Live web results with citations.",
      tags: ["Search", "Citations"],
      enabled: true,
    },
    {
      id: "notion",
      name: "Notion",
      publisher: "Notion Labs",
      desc: "Read & write pages.",
      tags: ["Productivity", "Docs"],
      enabled: false,
    },
  ];

  describe("MarketView", () => {
    it("renders a status label that matches each plugin's enabled state", () => {
      render(
        <MarketView
          plugins={plugins}
          onToggle={vi.fn()}
          onConfigure={vi.fn()}
        />,
      );
      expect(screen.getByText("Enabled")).toBeInTheDocument();
      expect(screen.getByText("Disabled")).toBeInTheDocument();
    });

    it("fires onToggle with the plugin id and the next state", () => {
      const onToggle = vi.fn();
      render(
        <MarketView
          plugins={plugins}
          onToggle={onToggle}
          onConfigure={vi.fn()}
        />,
      );
      const card = screen
        .getByText("Notion")
        .closest('[data-testid="plugin-card"]') as HTMLElement;
      fireEvent.click(within(card).getByRole("switch"));
      expect(onToggle).toHaveBeenCalledWith("notion", true);
    });

    it("fires onConfigure with the plugin id", () => {
      const onConfigure = vi.fn();
      render(
        <MarketView
          plugins={plugins}
          onToggle={vi.fn()}
          onConfigure={onConfigure}
        />,
      );
      const card = screen
        .getByText("Web Search")
        .closest('[data-testid="plugin-card"]') as HTMLElement;
      fireEvent.click(within(card).getByRole("button", { name: /Configure/ }));
      expect(onConfigure).toHaveBeenCalledWith("web-search");
    });
  });
  ```

- [ ] **Step 23: Run the MarketView test — expect PASS.**

  ```
  pnpm --filter @wedevs/ui exec vitest run src/views/MarketView.test.tsx
  ```

  Expected: `Test Files 1 passed`, `Tests 3 passed`. (Radix `Switch` exposes `role="switch"`; clicking an unchecked switch fires `onCheckedChange(true)`.)

- [ ] **Step 24: Commit.**
  ```
  git add packages/ui/src/views/PluginCard.tsx packages/ui/src/views/MarketView.tsx packages/ui/src/views/MarketView.test.tsx
  git commit -m "feat(ui): add MarketView + PluginCard grid with per-plugin toggle/configure"
  ```

---

#### Barrel exports, full-suite gate, brand audit

- [ ] **Step 25: Add barrel exports to `packages/ui/src/index.ts`.** Append (keep existing exports intact; place near other view exports if a section exists):

  ```ts
  export { EmptyView } from "./views/EmptyView";
  export { ChatView } from "./views/ChatView";
  export { Thread } from "./views/Thread";
  export { Message } from "./views/Message";
  export { ToolCard } from "./views/ToolCard";
  export { CodeView } from "./views/CodeView";
  export { CodeEditor } from "./views/CodeEditor";
  export { MarketView } from "./views/MarketView";
  export { PluginCard } from "./views/PluginCard";
  export type { ThreadProps } from "./views/Thread";
  export type { MessageProps } from "./views/Message";
  export type { ToolCardProps } from "./views/ToolCard";
  export type { PluginCardProps } from "./views/PluginCard";
  ```

  The view/data prop types (`EmptyViewProps`, `ChatViewProps`, `ChatMessage`, `StreamingMessage`, `ToolCardData`, `CodeViewProps`, `MarketViewProps`, `PluginCardData`) are already re-exported via `export * from "./types"` (or the existing types re-export line) — do NOT duplicate them here.

- [ ] **Step 26: Typecheck the package — expect clean.**

  ```
  pnpm --filter @wedevs/ui exec tsc --noEmit
  ```

  Expected: no output, exit 0. Fix any `no-explicit-any` / strict-null issues before proceeding (there should be none — every type is imported from `../types` or declared locally).

- [ ] **Step 27: Run the full UI test suite — expect all green.**

  ```
  pnpm --filter @wedevs/ui test
  ```

  Expected: every prior test file plus the 4 new files pass; the new files contribute `EmptyView` (2), `ChatView` (3), `CodeView` (4), `MarketView` (3) = 12 new passing tests. No failures, no unhandled errors.

- [ ] **Step 28: Lint — expect clean.**

  ```
  pnpm --filter @wedevs/ui lint
  ```

  Expected: no errors. Resolve any unused-import warnings (e.g. drop unused lucide icons).

- [ ] **Step 29: Brand-rule self-audit (no code change unless a violation is found).** `grep -rn "accent" packages/ui/src/views` and confirm every `--accent*` occurrence is one of the sanctioned uses only: (a) the empty-state hero glow `--accent-soft` radial (mascot), (b) `focus-visible:ring-[var(--accent-line)]` keyboard rings, (c) the code `.ai-edit-bar` `--accent-soft` bg and diff-add `--accent`/`--accent-soft` (sanctioned code/live-edit zone), (d) `search-box`/`cfg` `focus-within:border-[var(--accent-line)]`. Confirm the eyebrow dash is `--border-2` (neutral), NOT accent. Confirm `LiveDot`/`LiveCluster`/`TypeCaret`/`Visor`/`Robo`/`Switch` are the ONLY components emitting accent internally. `StreamShimmer` must remain neutral gray. If any stray accent tint exists (e.g. on a hover, bubble, pill, or active tab), replace it with the neutral token (`--hover`/`--active`/`--active-line`/`--border-2`) and re-run Step 27.

- [ ] **Step 30: Final commit.**
  ```
  git add packages/ui/src/index.ts
  git commit -m "feat(ui): export main-column views from package barrel"
  ```

---

#### Definition of done

- All four view families exist as separate files under `packages/ui/src/views/` with prop interfaces taken **verbatim** from the shared contract; named exports re-exported from `packages/ui/src/index.ts`.
- `EmptyView` renders the `Visor` hero, neutral eyebrow, greeting, static sub-copy, a `Composer` (variant driven by the passed `ComposerProps`), and starter pills that call `composer.onChange`; column capped at 680px, greeting shrinks ≤680px.
- `ChatView` renders right-aligned user bubbles, assistant messages with `Robo` + optional `ToolCard` (whose "Open in panel" fires `onOpenOutput(tool.id)`) + hover actions, and a live streaming row using `LiveCluster` + `LiveDot`-driven running-tool bar + neutral `StreamShimmer` + accent `TypeCaret`.
- `CodeView`/`CodeEditor` render the repo head (`LiveDot` branch, mono sync, Run/PR/Commit → `onAction`), the `≤760px`-hidden file tree, the tabbed `--sink` editor with `.ai-edit-bar`, `data-diff` add/del/editing lines (sanctioned accent + `.tok-*` literal-hex zone), and the mono status foot.
- `MarketView`/`PluginCard` render the search + local-state filter pills and a responsive `minmax(280px,1fr)` grid; each card's `Switch` fires `onToggle(id, on)` and syncs its `Enabled`/`Disabled` label, and Configure fires `onConfigure(id)`.
- Views add **no new keyframes**; all animation is delegated to Task 6 primitives (which already honor `prefers-reduced-motion`). Accent (Volt) appears only in the sanctioned locations verified in Step 29; everything else is neutral.
- `pnpm --filter @wedevs/ui exec tsc --noEmit` is clean, `pnpm --filter @wedevs/ui test` is fully green (incl. the 12 new tests), `pnpm --filter @wedevs/ui lint` is clean. Both light and dark render correctly (all colors are token-driven).

---

### Task 15: AppShell assembly + responsive breakpoints

The **Adaptive Canvas** shell: a single container that runs a `data-view` / `data-panel` / `data-rail` state machine and lays out four slots — the left rail, the top bar (spanning main+inspector), the fluid centered main column, and the right Inspector that either **floats** (absolute overlay) or **pins** (a real third column that pushes the main column). It also renders the mobile rail **drawer + scrim** and the **file-drop overlay** (shown only while `dragging && view==="chat"`). Responsive collapses at `1180` (pinned Inspector → overlay), `900` (rail → off-canvas drawer + hamburger + scrim), `760` (code file-tree hidden), and `680` (Inspector full-screen sheet, title/share-label hidden, padding tightened).

**Scope boundary (read before you start).** This task owns _shell geometry_ only. It consumes finished slot components from Tasks 7–14 — it does **not** re-style their internals:

- `.rail` **internals** (brand, nav rows, account chip) and the **266↔60 collapse** rules belong to LeftRail (Task 8). AppShell owns only the **mobile drawer** geometry (`data-drawer`) + the scrim.
- `.topbar` **height and internals** belong to TopBar (Task 9). AppShell renders `{topBar}` untouched.
- `.inspector` **internals** (`.insp-head`, `.insp-tabs`, panes) belong to Inspector (Task 12). AppShell owns only the **container geometry** (`.inspector` width/position per `data-panel`).
- View bodies (`.view-*`, `.thread`, `.composer-wrap`) belong to Tasks 13–14. AppShell owns only the `.main` flex container + its neutral glow, and the responsive padding/typography overrides grouped under RESPONSIVE in the mockup.

**Brand rule.** The only accent (`--accent`/`--accent-soft`/`--accent-line`) AppShell paints is the **file-drop overlay** (`.drop`, mockup 345–349) — this is the sanctioned _drag-active live affordance_ and is ported verbatim from the mockup. The neutral shell glow (`.main::before`) uses `--hover`, never accent. Nothing else in this task is volt-tinted.

---

**Files:**

- CREATE `packages/ui/src/components/AppShell/AppShell.tsx`
- CREATE `packages/ui/src/components/AppShell/AppShell.css`
- CREATE `packages/ui/src/components/AppShell/AppShell.test.tsx`
- MODIFY `packages/ui/src/index.ts` (add barrel export for `AppShell` + `AppShellProps`)

**Interfaces:**

Consumes (import from existing modules — do NOT redefine):

```ts
// packages/ui/src/lib/cn.ts
export function cn(...inputs: ClassValue[]): string;

// packages/ui/src/types.ts
export type ViewMode = "empty" | "chat" | "market" | "code";
export type PanelMode = "closed" | "float" | "pinned";
export type RailMode = "expanded" | "collapsed" | "open";
```

Slot content (`leftRail`, `topBar`, `main`, `inspector`) is produced by Tasks 8/9/12/13–14 and passed in as `React.ReactNode`; AppShell renders them opaquely.

Produces (define exactly this — verbatim from the shared contract):

```ts
export interface AppShellProps {
  view: ViewMode;
  panel: PanelMode;
  rail: RailMode;
  onPanelChange: (panel: PanelMode) => void;
  onRailChange: (rail: RailMode) => void;
  leftRail: React.ReactNode;
  topBar: React.ReactNode;
  main: React.ReactNode;
  inspector?: React.ReactNode;
  dragging?: boolean; // shows file-drop overlay when view==="chat"
}
```

---

**Architecture decisions (why this differs slightly from the raw mockup CSS):**

1. **The `1180` and `900` collapses are driven in JS, not by CSS media queries**, so they are deterministically unit-testable via a `matchMedia` mock (the test strategy requires asserting `pinned→overlay at 1180` and `rail→drawer at 900`). AppShell reads two media queries with a local `useMediaQuery` hook and:
   - computes `effectivePanel = (panel === "pinned" && belowPin) ? "float" : panel` and stamps it as `data-panel` (so a pinned Inspector renders as an overlay below 1180px);
   - stamps `data-drawer="1"` below 900px, which the CSS keys the off-canvas rail + scrim + hamburger off of.
     The mockup's `@media (max-width:1180px)` (712) and `@media (max-width:900px)` (714–722) rules are therefore replaced by attribute selectors; do **not** also port those two media queries. The purely-visual `760` (630) and `680` (723–728) tightenings stay as CSS media queries (not JS-tested).

2. **The Inspector is conditionally mounted** (`effectivePanel !== "closed" && inspector != null`) rather than kept in the DOM at `width:0`. This makes "closed hides Inspector" assertable in jsdom (which does not compute stylesheet layout). Trade-off: the 0→width open transition does not animate on first mount; that polish is acceptable for Phase 1.

3. **`view` selects the main body upstream.** In the mockup all `.view-*` sections coexist and CSS toggles them by `data-view`; in React the parent passes exactly one already-selected view as `main`. AppShell still stamps `data-view` because the view/composer slots read it for descendant styling (e.g. empty-state composer max-width, pinned thread margin).

---

- [ ] **Step 1: Create the shell stylesheet `packages/ui/src/components/AppShell/AppShell.css`.** Port the shell-geometry rules from `mockup/index.html` (lines 96, 165–204, 345–349, 388–393, 710, 723–728, 630), keeping all `var(--token)` references. Write exactly:

```css
/* AppShell — shell geometry & state machine.
   Ported from mockup/index.html: 96, 165-204, 345-349, 388-393, 710, 723-728, 630.
   The 1180/900 collapses are JS-driven (data-panel/data-drawer), not media queries. */

.app {
  display: flex;
  height: 100vh;
  position: relative;
  isolation: isolate;
}

/* workspace = topbar + body (mockup 165-204) */
.workspace {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  position: relative;
}
.body {
  flex: 1;
  display: flex;
  min-width: 0;
  position: relative;
  overflow: hidden;
}
.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  position: relative;
}
/* neutral ambient glow — --hover, never accent (mockup 203-204) */
.main::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(
    880px 440px at 50% -8%,
    var(--hover),
    transparent 60%
  );
}

/* Inspector container geometry — width/position state machine (mockup 388-393).
   Internals (.insp-head/.insp-tabs/panes) are owned by Inspector (Task 12). */
.inspector {
  width: 0;
  flex: 0 0 auto;
  background: var(--surface);
  border-left: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: width 0.24s cubic-bezier(0.4, 0, 0.2, 1);
}
.app[data-panel="pinned"] .inspector {
  width: 400px;
}
.app[data-panel="float"] .inspector {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 390px;
  z-index: 30;
  box-shadow: var(--shadow);
  border-left: 1px solid var(--border-2);
}

/* file-drop overlay — sanctioned drag-active accent affordance (mockup 345-349) */
.drop {
  position: absolute;
  inset: 8px 24px;
  border-radius: 18px;
  border: 2px dashed var(--accent-line);
  background: var(--accent-soft);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--accent);
  font-weight: 600;
  z-index: 5;
  backdrop-filter: blur(2px);
}

/* mobile rail drawer + scrim — JS-gated via data-drawer (mockup 710, 714-722).
   Base .rail (266px) + 266<->60 collapse are owned by LeftRail (Task 8). */
.rail-scrim {
  position: fixed;
  inset: 0;
  background: rgba(10, 12, 14, 0.5);
  z-index: 39;
  display: none;
}
.app[data-drawer="1"] .rail {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  z-index: 60;
  transform: translateX(-100%);
  width: 280px !important;
  padding: 12px 10px !important;
}
.app[data-drawer="1"][data-rail="open"] .rail {
  transform: none;
  box-shadow: var(--shadow);
}
.app[data-drawer="1"][data-rail="open"] .rail-scrim {
  display: block;
}
.app[data-drawer="1"] .rail-open-btn {
  display: grid;
}
/* in drawer mode the rail is full-width, so un-hide the collapsed labels (mockup 719-721) */
.app[data-drawer="1"][data-rail="collapsed"] .brand-name,
.app[data-drawer="1"][data-rail="collapsed"] .lbl,
.app[data-drawer="1"][data-rail="collapsed"] .grp-h,
.app[data-drawer="1"][data-rail="collapsed"] .acct-meta,
.app[data-drawer="1"][data-rail="collapsed"] .list-scroll {
  display: revert;
}

/* code file-tree hidden on narrow (mockup 630) */
@media (max-width: 760px) {
  .code-tree {
    display: none;
  }
}

/* full-screen Inspector sheet + tightened chrome (mockup 723-728).
   Below 680 the panel is already "float" (JS forced it below 1180). */
@media (max-width: 680px) {
  .app[data-panel="float"] .inspector {
    width: 100% !important;
    left: 0;
    right: 0;
    border-left: none;
  }
  .title-wrap {
    display: none;
  }
  .thread,
  .composer-wrap {
    padding-left: 14px;
    padding-right: 14px;
  }
  .greet {
    font-size: 27px;
  }
  .btn-share span {
    display: none;
  }
}

/* reduced motion — global guard also applies; disable shell transitions locally too */
@media (prefers-reduced-motion: reduce) {
  .inspector {
    transition: none;
  }
}
```

- [ ] **Step 2: Write the failing test `packages/ui/src/components/AppShell/AppShell.test.tsx`.** This asserts real behavior: slot rendering, DOM order, the `data-*` state machine, the JS-driven `matchMedia` collapses, the drop overlay condition, and the two callback wirings. Write exactly:

```tsx
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
      const rel = nodes[i].compareDocumentPosition(nodes[i + 1]);
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

  it("shows the file-drop overlay only when dragging in chat view", () => {
    const { rerender } = render(
      <AppShell {...baseProps({ view: "chat", dragging: true })} />,
    );
    expect(screen.getByTestId("file-drop")).toBeInTheDocument();
    expect(screen.getByTestId("app-shell")).toHaveAttribute(
      "data-dragging",
      "1",
    );

    rerender(<AppShell {...baseProps({ view: "market", dragging: true })} />);
    expect(screen.queryByTestId("file-drop")).not.toBeInTheDocument();

    rerender(<AppShell {...baseProps({ view: "chat", dragging: false })} />);
    expect(screen.queryByTestId("file-drop")).not.toBeInTheDocument();
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
});
```

- [ ] **Step 3: Run the test and confirm it FAILS (module not found).**

```
pnpm --filter @wedevs/ui exec vitest run src/components/AppShell/AppShell.test.tsx
```

Expected: FAIL — `Failed to resolve import "./AppShell"` / `Cannot find module './AppShell'`. (The component does not exist yet.)

- [ ] **Step 4: Implement `packages/ui/src/components/AppShell/AppShell.tsx`.** Write exactly:

```tsx
import * as React from "react";
import { cn } from "../../lib/cn";
import type { ViewMode, PanelMode, RailMode } from "../../types";
import "./AppShell.css";

export interface AppShellProps {
  view: ViewMode;
  panel: PanelMode;
  rail: RailMode;
  onPanelChange: (panel: PanelMode) => void;
  onRailChange: (rail: RailMode) => void;
  leftRail: React.ReactNode;
  topBar: React.ReactNode;
  main: React.ReactNode;
  inspector?: React.ReactNode;
  dragging?: boolean; // shows file-drop overlay when view==="chat"
}

/** SSR-safe media-query subscription. Starts false, resolves in an effect. */
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = React.useState(false);
  React.useEffect(() => {
    if (
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    ) {
      return;
    }
    const mql = window.matchMedia(query);
    const onChange = (): void => setMatches(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}

export function AppShell(props: AppShellProps): React.JSX.Element {
  const {
    view,
    panel,
    rail,
    onPanelChange,
    onRailChange,
    leftRail,
    topBar,
    main,
    inspector,
    dragging = false,
  } = props;

  // Breakpoints — kept in JS so the collapses are deterministically testable.
  const belowPin = useMediaQuery("(max-width: 1180px)"); // pinned -> overlay
  const belowDrawer = useMediaQuery("(max-width: 900px)"); // rail -> drawer

  // A pinned Inspector reflows to a floating overlay on narrow viewports.
  const effectivePanel: PanelMode =
    panel === "pinned" && belowPin ? "float" : panel;

  const showInspector = effectivePanel !== "closed" && inspector != null;
  const showDrop = dragging && view === "chat";

  const closeRail = React.useCallback((): void => {
    if (rail === "open") onRailChange("collapsed");
  }, [rail, onRailChange]);

  const onKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>): void => {
      if (e.key === "Escape" && effectivePanel === "float") {
        onPanelChange("closed");
      }
    },
    [effectivePanel, onPanelChange],
  );

  return (
    <div
      className={cn("app")}
      data-testid="app-shell"
      data-view={view}
      data-panel={effectivePanel}
      data-rail={rail}
      data-drawer={belowDrawer ? "1" : "0"}
      data-dragging={showDrop ? "1" : "0"}
      onKeyDown={onKeyDown}
    >
      <div
        className="rail-scrim"
        data-testid="rail-scrim"
        aria-hidden="true"
        onClick={closeRail}
      />

      {leftRail}

      <div className="workspace">
        {topBar}
        <div className="body">
          <main className="main">
            {main}
            {showDrop ? (
              <div className="drop" role="presentation" data-testid="file-drop">
                <svg
                  viewBox="0 0 24 24"
                  width="30"
                  height="30"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <path d="M7 10l5 5 5-5M12 15V3" />
                </svg>
                <span>Drop files to attach</span>
              </div>
            ) : null}
          </main>
          {showInspector ? inspector : null}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run the test and confirm it PASSES.**

```
pnpm --filter @wedevs/ui exec vitest run src/components/AppShell/AppShell.test.tsx
```

Expected: PASS — `Test Files  1 passed (1)` and `Tests  15 passed (15)` (the two `it.each` blocks expand to 4 + 3 cases). No warnings about `act(...)`.

- [ ] **Step 6: Add the barrel export to `packages/ui/src/index.ts`.** Append these two lines (keep them grouped with the other `components/` exports if a components section already exists):

```ts
export { AppShell } from "./components/AppShell/AppShell";
export type { AppShellProps } from "./components/AppShell/AppShell";
```

- [ ] **Step 7: Typecheck the package and confirm it is clean.**

```
pnpm --filter @wedevs/ui exec tsc --noEmit
```

Expected: no output, exit code 0. (If `React.JSX.Element` is rejected by the installed React types, this means Task 0/1 pinned React 18 without the `React.JSX` namespace — in that case change the return type to `JSX.Element` and re-run; do not introduce `any`.)

- [ ] **Step 8: Run the full package test + typecheck once more to confirm nothing regressed, then commit.**

```
pnpm --filter @wedevs/ui test
pnpm --filter @wedevs/ui exec tsc --noEmit
git add packages/ui/src/components/AppShell packages/ui/src/index.ts
git commit -m "feat(ui): add AppShell adaptive canvas with responsive breakpoints"
```

Expected: all tests green; `tsc` clean; one commit created.

---

**Definition of done:**

- `AppShell` renders the four slots (`leftRail`, `topBar`, `main`, `inspector`) in that DOM order, with `topBar` spanning main+inspector (it sits above `.body`).
- The container stamps `data-view` (from `view`), `data-rail` (from `rail`), and an **effective** `data-panel` that collapses `pinned → float` below 1180px; below 900px it stamps `data-drawer="1"` and the CSS turns the rail into an off-canvas drawer with a visible, click-to-close scrim + hamburger (`.rail-open-btn`).
- `panel="closed"` unmounts the Inspector; `float` renders it as an absolute overlay; `pinned` (on a wide viewport) renders it as a real 400px column that pushes the main column.
- The file-drop overlay appears **only** when `dragging && view==="chat"` and is the sole accent-painted element in this task (sanctioned drag affordance); the shell glow uses `--hover`.
- Clicking the scrim calls `onRailChange("collapsed")`; pressing Escape while the Inspector floats calls `onPanelChange("closed")`.
- `AppShell` + `AppShellProps` are exported from `packages/ui/src/index.ts`.
- All 15 tests pass; `tsc --noEmit` is clean; no `any`; both light and dark themes render correctly (verified in the `apps/web` shell page in a later task, since AppShell paints only via tokens).
- Commit `feat(ui): add AppShell adaptive canvas with responsive breakpoints` is created.

---

### Task 16: Wire everything into apps/web and verify acceptance (all screens, both themes)

This is the **final integration + acceptance task** of Phase 1. Every component built in Tasks 1–15 lives in `@wedevs/ui`. Here you compose them into a real, running authed shell page in `apps/web`, back it with an app-level `zustand` UI-state slice, wrap the root layout in the design-system providers + self-hosted fonts, and run the acceptance sweep (all screens, both themes, responsive, reduced-motion, focus rings, Volt-audit).

You are a fresh agent with zero prior context. Read this whole section before touching code. The **visual source of truth** is `d:/Rajin/Wedevs.cloud/mockup/index.html`; the **behavior source of truth** is its inline script (`jump()` presets lines 1537–1549, panel/rail/inspector transitions 1421–1497, boot `setTheme('dark')` line 1634). Do NOT invent behavior — port it.

---

#### Files

Create:

- `apps/web/src/store/ui.ts` — app-level `zustand` UI slice (view/panel/rail/attach/dragging + composer + palette/settings/inspector state and the composed transitions ported from the mockup).
- `apps/web/src/app/fonts.ts` — `next/font/google` for Unbounded / Manrope / JetBrains Mono → CSS variables.
- `apps/web/src/app/app/fixtures.tsx` — concrete demo data for every screen (typed against the shared contract).
- `apps/web/src/app/app/page.tsx` — the composed authed shell page: `<AppShell>` + LeftRail + TopBar + every view + Inspector + CommandPalette + SettingsModal + a demo dev-bar.
- `apps/web/src/app/app/page.test.tsx` — integration render tests (each view renders its real component; theme flip; Volt-audit; reduced-motion; keyboard focus).
- `apps/web/vitest.setup.ts` — jsdom globals (`matchMedia`) + `@testing-library/jest-dom/vitest`.

Modify:

- `apps/web/package.json` — add deps `zustand`, `lucide-react`, `motion`; add devDeps `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom`, `@vitejs/plugin-react`.
- `apps/web/vitest.config.ts` — `environment: "jsdom"`, include `*.test.tsx`, react plugin, setup file.
- `apps/web/src/app/globals.css` — final import chain (tailwind + theme tokens + animate + keyframes).
- `apps/web/src/app/layout.tsx` — apply font CSS vars to `<html>`, wrap children in `ThemeProvider` + `ToastProvider`.
- `apps/web/src/app/page.tsx` — redirect `/` → `/app` (so visiting the app lands on the shell).

Do NOT modify anything under `packages/` in this task. If a `@wedevs/ui` export is missing, that is a Task 1–15 defect — stop and report it, do not patch across packages here.

`apps/web/next.config.ts` already has `transpilePackages: ["@wedevs/ui", "@wedevs/shared"]` — **no change**.

---

#### Interfaces

**Consumes** (import by these exact names from `@wedevs/ui`; do NOT redefine or rename):

```ts
// providers + theme
import { ThemeProvider, ToastProvider, useTheme, useToast } from "@wedevs/ui";
import type { ThemeMode } from "@wedevs/ui";
// components
import {
  AppShell,
  LeftRail,
  TopBar,
  ModelSelector,
  Composer,
  Inspector,
  CommandPalette,
  SettingsModal,
  EmptyView,
  ChatView,
  CodeView,
  MarketView,
} from "@wedevs/ui";
// shared domain types
import type {
  ViewMode,
  PanelMode,
  RailMode,
  InspectorTab,
  NavKey,
  SettingsPane,
  NavItem,
  RecentChat,
  Project,
  Account,
  ModelOption,
  AgentOption,
  Attachment,
  CommandItem,
  ChatMessage,
  StreamingMessage,
  PluginCardData,
  FilePreviewData,
  OutputData,
  ModelDetails,
  PluginConfigData,
  AppShellProps,
  LeftRailProps,
  TopBarProps,
  ModelSelectorProps,
  ComposerProps,
  InspectorProps,
} from "@wedevs/ui";
```

Canonical prop shapes you must satisfy (verbatim from the shared contract):

```ts
export type ViewMode = "empty" | "chat" | "market" | "code";
export type PanelMode = "closed" | "float" | "pinned";
export type RailMode = "expanded" | "collapsed" | "open";
export type InspectorTab = "file" | "output" | "details" | "config";
export type NavKey = "chat" | "code" | "market";
export type SettingsPane =
  "account" | "appearance" | "models" | "plugins" | "data" | "keys";

export interface AppShellProps {
  view: ViewMode;
  panel: PanelMode;
  rail: RailMode;
  onPanelChange: (panel: PanelMode) => void;
  onRailChange: (rail: RailMode) => void;
  leftRail: React.ReactNode;
  topBar: React.ReactNode;
  main: React.ReactNode;
  inspector?: React.ReactNode;
  dragging?: boolean;
}
export interface ComposerProps {
  variant: "empty" | "chat";
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  attachments: Attachment[];
  attachOpen: boolean;
  onAttach: () => void;
  onRemoveAttachment: (id: string) => void;
  toolsOn: boolean;
  onToggleTools: () => void;
  onVoice: () => void;
  agentPill: React.ReactNode;
  dragging?: boolean;
  toolCount?: number;
}
export interface ModelSelectorProps {
  models: ModelOption[];
  agents: AgentOption[];
  selectedModelId: string;
  onSelectModel: (id: string) => void;
  variant?: "topbar" | "pill";
}
// (TopBarProps, LeftRailProps, InspectorProps, EmptyViewProps, ChatViewProps,
//  CodeViewProps, MarketViewProps, CommandPaletteProps, SettingsModalProps
//  are consumed as written in the shared contract — see the page wiring in Step 9.)
export interface ThemeState {
  mode: "light" | "dark" | "system";
  resolved: "light" | "dark";
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
}
export interface ToastContextValue {
  show: (message: string) => void;
}
```

**Produces** (new, defined in this task):

```ts
// apps/web/src/store/ui.ts
export interface UIState {
  // data
  view: ViewMode;
  panel: PanelMode;
  rail: RailMode;
  attach: boolean;
  dragging: boolean;
  activeNav: NavKey;
  title: string;
  selectedModelId: string;
  composerValue: string;
  attachments: Attachment[];
  attachOpen: boolean;
  toolsOn: boolean;
  inspectorTab: InspectorTab;
  paletteOpen: boolean;
  settingsOpen: boolean;
  settingsPane: SettingsPane;
  // simple setters
  setView: (view: ViewMode) => void;
  setPanel: (panel: PanelMode) => void;
  setRail: (rail: RailMode) => void;
  setAttach: (attach: boolean) => void;
  setDragging: (dragging: boolean) => void;
  setActiveNav: (nav: NavKey) => void;
  setTitle: (title: string) => void;
  setSelectedModel: (id: string) => void;
  setComposerValue: (value: string) => void;
  removeAttachment: (id: string) => void;
  toggleAttach: () => void;
  toggleTools: () => void;
  setInspectorTab: (tab: InspectorTab) => void;
  setPaletteOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  setSettingsPane: (pane: SettingsPane) => void;
  // composed transitions (ported from mockup)
  togglePanel: () => void; // closed <-> float          (mockup 1422)
  pinPanel: () => void; // pinned <-> float           (mockup 1426)
  toggleRail: () => void; // collapsed <-> expanded     (mockup 1455)
  openInspector: (tab: InspectorTab) => void; // (mockup 1485)
  newChat: () => void; // (mockup 1583)
  selectNav: (nav: NavKey) => void; // nav -> view (mockup 1584/1585/1586)
}
export const initialUIState: Pick<
  UIState,
  | "view"
  | "panel"
  | "rail"
  | "attach"
  | "dragging"
  | "activeNav"
  | "title"
  | "selectedModelId"
  | "composerValue"
  | "attachments"
  | "attachOpen"
  | "toolsOn"
  | "inspectorTab"
  | "paletteOpen"
  | "settingsOpen"
  | "settingsPane"
>;
export const useUIStore: import("zustand").UseBoundStore<
  import("zustand").StoreApi<UIState>
>;
```

Neutral/Volt note for this task: the page composes existing components and adds **no new painted surfaces** except the demo dev-bar. The dev-bar is the mockup's "mock-dev-bar" and is the one place here allowed an ambient `--accent-soft` glow (global constraint list). Every other element on the page must stay neutral — you are wiring, not styling. The Volt-audit test (Step 13) enforces this.

---

#### Steps

- [ ] **Step 1: Add runtime + test dependencies to `apps/web/package.json`.**
      Edit `apps/web/package.json`. Into `"dependencies"` add (keep the existing entries):

  ```json
  "zustand": "^5.0.0",
  "lucide-react": "^0.460.0",
  "motion": "^11.11.0"
  ```

  Into `"devDependencies"` add:

  ```json
  "@testing-library/react": "^16.0.1",
  "@testing-library/jest-dom": "^6.5.0",
  "@testing-library/user-event": "^14.5.2",
  "jsdom": "^25.0.0",
  "@vitejs/plugin-react": "^4.3.0"
  ```

  Then install from the repo root so the workspace lockfile updates:

  ```bash
  cd /d/Rajin/Wedevs.cloud && pnpm install
  ```

  Expected: install completes with `Done in …`; `apps/web/node_modules/.pnpm` now resolves `zustand`, `lucide-react`, `motion`, `jsdom`, `@testing-library/react`. No `ERR_PNPM` output.

- [ ] **Step 2: Configure the jsdom test harness for `apps/web`.**
      Create `apps/web/vitest.setup.ts`:

  ```ts
  import "@testing-library/jest-dom/vitest";

  // jsdom ships no matchMedia; ThemeProvider + useReducedMotion both call it.
  // Default: light theme, motion allowed. Individual tests override window.matchMedia.
  if (!window.matchMedia) {
    window.matchMedia = (query: string): MediaQueryList =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList;
  }
  ```

  Overwrite `apps/web/vitest.config.ts` with:

  ```ts
  import { defineConfig } from "vitest/config";
  import react from "@vitejs/plugin-react";
  import { fileURLToPath } from "node:url";

  export default defineConfig({
    plugins: [react()],
    test: {
      environment: "jsdom",
      globals: false,
      setupFiles: ["./vitest.setup.ts"],
      include: ["src/**/*.test.{ts,tsx}"],
    },
    resolve: {
      alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    },
  });
  ```

  Verify config loads (no test files match `.tsx` yet, so it should report the existing `.ts` tests or "no test files"):

  ```bash
  cd /d/Rajin/Wedevs.cloud/apps/web && pnpm exec vitest run
  ```

  Expected: vitest boots in `jsdom` environment with no config error. (If the only existing test is a foundations `.ts` test it passes; "No test files found" is also acceptable at this point.)

- [ ] **Step 3: Self-host fonts via `next/font/google` and map them to the token CSS vars.**
      `next/font/google` downloads and self-hosts the font files at build time (no runtime external request — CSP-safe). Create `apps/web/src/app/fonts.ts`:

  ```ts
  import { Unbounded, Manrope, JetBrains_Mono } from "next/font/google";

  export const display = Unbounded({
    subsets: ["latin"],
    weight: ["500", "600", "700"],
    variable: "--font-display",
    display: "swap",
  });
  export const sans = Manrope({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
    variable: "--font-sans",
    display: "swap",
  });
  export const mono = JetBrains_Mono({
    subsets: ["latin"],
    weight: ["400", "500"],
    variable: "--font-mono",
    display: "swap",
  });
  ```

  These `--font-display / --font-sans / --font-mono` variable names are exactly what `packages/config/tailwind.preset.ts` maps its font-family utilities to (global file-structure note). Do not rename them.

- [ ] **Step 4: Finalize the global CSS import chain.**
      Overwrite `apps/web/src/app/globals.css` with the canonical order (tailwind engine first, then tokens, then animation layers):

  ```css
  @import "tailwindcss";
  @import "@wedevs/config/theme.css";
  @import "tw-animate-css";
  @import "@wedevs/ui/styles/keyframes.css";
  ```

  `@wedevs/config/theme.css` is the canonical `@theme` token block (light base + `@media (prefers-color-scheme: dark)` + `:root[data-theme]` overrides). `@wedevs/ui/styles/keyframes.css` holds the mascot/live keyframes (`bob`, `blink`, `antp`, `twinkle`, `scan`, `caret`, `shimmer`, `mockglow`, `hsh`). Both export paths were declared by earlier tasks; if either fails to resolve at Step 15's build, that is a Task 2 / Task 4 packaging defect — report it, do not inline the CSS here.

- [ ] **Step 5: Wrap the root layout in providers + fonts.**
      Overwrite `apps/web/src/app/layout.tsx`:

  ```tsx
  import "./globals.css";
  import type { ReactNode } from "react";
  import { ThemeProvider, ToastProvider } from "@wedevs/ui";
  import { display, sans, mono } from "./fonts";

  export const metadata = {
    title: "Wedevs",
    description: "AI chat + code workspace",
  };

  export default function RootLayout({ children }: { children: ReactNode }) {
    return (
      <html
        lang="en"
        suppressHydrationWarning
        className={`${display.variable} ${sans.variable} ${mono.variable}`}
      >
        <body>
          <ThemeProvider>
            <ToastProvider>{children}</ToastProvider>
          </ThemeProvider>
        </body>
      </html>
    );
  }
  ```

  `suppressHydrationWarning` is required because `ThemeProvider` stamps `data-theme` on `<html>` on the client (it resolves `system` via `matchMedia`), which legitimately differs from server output. `ThemeProvider` defaults to `mode: "system"` and persists to `localStorage["wedevs-theme"]` per the contract; the mockup boots dark (line 1634) but the provider's real default is `system` — leave it, do not hardcode dark.

- [ ] **Step 6: Redirect `/` to the shell at `/app`.**
      Overwrite `apps/web/src/app/page.tsx`:

  ```tsx
  import { redirect } from "next/navigation";

  export default function Home() {
    redirect("/app");
  }
  ```

- [ ] **Step 7: Build the app-level UI store.**
      Create `apps/web/src/store/ui.ts`. This ports the mockup's imperative state functions into a single zustand slice. Transition semantics are lifted verbatim: `togglePanel` = mockup `panelToggle` (1422), `pinPanel` = `panelPin` (1426), `toggleRail` = `railToggle` desktop branch (1457), `openInspector` = `openInspector` (1485), `newChat` = `new-chat` handler (1583), `selectNav` = the chat/code/market handlers (1584–1586). Two demo attachments are seeded so the `file` screen has a populated tray (mockup `data-attach="1"`).

  ```ts
  "use client";
  import { create } from "zustand";
  import type {
    ViewMode,
    PanelMode,
    RailMode,
    InspectorTab,
    NavKey,
    SettingsPane,
    Attachment,
  } from "@wedevs/ui";

  export interface UIState {
    view: ViewMode;
    panel: PanelMode;
    rail: RailMode;
    attach: boolean;
    dragging: boolean;
    activeNav: NavKey;
    title: string;
    selectedModelId: string;
    composerValue: string;
    attachments: Attachment[];
    attachOpen: boolean;
    toolsOn: boolean;
    inspectorTab: InspectorTab;
    paletteOpen: boolean;
    settingsOpen: boolean;
    settingsPane: SettingsPane;

    setView: (view: ViewMode) => void;
    setPanel: (panel: PanelMode) => void;
    setRail: (rail: RailMode) => void;
    setAttach: (attach: boolean) => void;
    setDragging: (dragging: boolean) => void;
    setActiveNav: (nav: NavKey) => void;
    setTitle: (title: string) => void;
    setSelectedModel: (id: string) => void;
    setComposerValue: (value: string) => void;
    removeAttachment: (id: string) => void;
    toggleAttach: () => void;
    toggleTools: () => void;
    setInspectorTab: (tab: InspectorTab) => void;
    setPaletteOpen: (open: boolean) => void;
    setSettingsOpen: (open: boolean) => void;
    setSettingsPane: (pane: SettingsPane) => void;

    togglePanel: () => void;
    pinPanel: () => void;
    toggleRail: () => void;
    openInspector: (tab: InspectorTab) => void;
    newChat: () => void;
    selectNav: (nav: NavKey) => void;
  }

  export const initialUIState = {
    view: "empty" as ViewMode,
    panel: "closed" as PanelMode,
    rail: "expanded" as RailMode,
    attach: false,
    dragging: false,
    activeNav: "chat" as NavKey,
    title: "Q3 go-to-market analysis",
    selectedModelId: "opus-4",
    composerValue: "",
    attachments: [
      {
        id: "a1",
        name: "q3-forecast.xlsx",
        sub: "Spreadsheet · 240 KB",
        kind: "doc",
      },
      {
        id: "a2",
        name: "channel-mix.png",
        sub: "Image · 1.2 MB",
        kind: "image",
      },
    ] as Attachment[],
    attachOpen: false,
    toolsOn: false,
    inspectorTab: "output" as InspectorTab,
    paletteOpen: false,
    settingsOpen: false,
    settingsPane: "appearance" as SettingsPane,
  };

  export const useUIStore = create<UIState>((set) => ({
    ...initialUIState,

    setView: (view) => set({ view }),
    setPanel: (panel) => set({ panel }),
    setRail: (rail) => set({ rail }),
    setAttach: (attach) => set({ attach }),
    setDragging: (dragging) => set({ dragging }),
    setActiveNav: (activeNav) => set({ activeNav }),
    setTitle: (title) => set({ title }),
    setSelectedModel: (selectedModelId) => set({ selectedModelId }),
    setComposerValue: (composerValue) => set({ composerValue }),
    removeAttachment: (id) =>
      set((s) => ({ attachments: s.attachments.filter((a) => a.id !== id) })),
    toggleAttach: () => set((s) => ({ attach: !s.attach })),
    toggleTools: () => set((s) => ({ toolsOn: !s.toolsOn })),
    setInspectorTab: (inspectorTab) => set({ inspectorTab }),
    setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
    setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
    setSettingsPane: (settingsPane) => set({ settingsPane }),

    togglePanel: () =>
      set((s) => ({ panel: s.panel === "closed" ? "float" : "closed" })),
    pinPanel: () =>
      set((s) => ({ panel: s.panel === "pinned" ? "float" : "pinned" })),
    toggleRail: () =>
      set((s) => ({ rail: s.rail === "collapsed" ? "expanded" : "collapsed" })),
    openInspector: (tab) =>
      set((s) => ({
        inspectorTab: tab,
        panel: s.panel === "closed" ? "float" : s.panel,
      })),
    newChat: () =>
      set({
        view: "empty",
        panel: "closed",
        attach: false,
        activeNav: "chat",
        composerValue: "",
      }),
    selectNav: (nav) =>
      set({
        activeNav: nav,
        view: nav === "code" ? "code" : nav === "market" ? "market" : "chat",
        panel: "closed",
      }),
  }));
  ```

- [ ] **Step 8: Write the demo fixtures.**
      Create `apps/web/src/app/app/fixtures.tsx` (`.tsx` because `NavItem.icon` is a `React.ReactNode` — lucide icons). Values below are concrete demo content; the shape must match the shared contract exactly. Icons come from `lucide-react`.

  ```tsx
  import { MessageSquare, Code2, Blocks } from "lucide-react";
  import type {
    NavItem,
    RecentChat,
    Project,
    Account,
    ModelOption,
    AgentOption,
    ChatMessage,
    StreamingMessage,
    PluginCardData,
    FilePreviewData,
    OutputData,
    ModelDetails,
    PluginConfigData,
  } from "@wedevs/ui";

  export const nav: NavItem[] = [
    { id: "chat", label: "Chat", icon: <MessageSquare size={18} />, kbd: "⌘1" },
    { id: "code", label: "Code", icon: <Code2 size={18} />, kbd: "⌘2" },
    {
      id: "market",
      label: "Marketplace",
      icon: <Blocks size={18} />,
      kbd: "⌘3",
    },
  ];

  export const recents: RecentChat[] = [
    {
      id: "r1",
      title: "Q3 go-to-market analysis",
      group: "pinned",
      pinned: true,
    },
    { id: "r2", title: "Refactor billing webhooks", group: "today" },
    { id: "r3", title: "Onboarding email copy", group: "today" },
    { id: "r4", title: "Postgres index audit", group: "previous7" },
    { id: "r5", title: "Landing page hero variants", group: "previous7" },
  ];

  export const projects: Project[] = [
    { id: "p1", name: "Wedevs Cloud", count: 12 },
    { id: "p2", name: "Marketing site", count: 4 },
  ];

  export const account: Account = {
    name: "Hasib Rahman",
    email: "hasib.webdev@gmail.com",
    plan: "Pro",
    initials: "HR",
  };

  export const models: ModelOption[] = [
    {
      id: "opus-4",
      name: "Opus 4",
      group: "frontier",
      sub: "200K context",
      tags: ["reasoning", "vision"],
    },
    {
      id: "sonnet-4",
      name: "Sonnet 4",
      group: "frontier",
      sub: "200K context",
      tags: ["balanced"],
    },
    {
      id: "haiku-4",
      name: "Haiku 4",
      group: "fast",
      sub: "Low latency",
      tags: ["fast"],
    },
    {
      id: "local-8b",
      name: "Local 8B",
      group: "local",
      sub: "On-device",
      tags: ["private"],
    },
  ];

  export const agents: AgentOption[] = [
    {
      id: "ag1",
      name: "Analyst",
      persona: "Data-savvy strategist",
      specialty: "Forecasting",
    },
    {
      id: "ag2",
      name: "Engineer",
      persona: "Pragmatic builder",
      specialty: "Refactoring",
    },
  ];

  export const messages: ChatMessage[] = [
    {
      id: "m1",
      role: "user",
      time: "2:14 PM",
      text: "Summarize our Q3 go-to-market plan and flag the risks.",
    },
    {
      id: "m2",
      role: "assistant",
      model: "Opus 4",
      time: "2:14 PM",
      text: "Here's the Q3 summary with the key risks called out.",
      tool: {
        id: "t1",
        name: "analyze_sheet",
        desc: "Analyzing q3-forecast.xlsx",
        done: "Done in 3.4s",
        rows: [
          { label: "Rows", value: "48,210" },
          { label: "Segments", value: "6" },
        ],
      },
    },
  ];

  export const streaming: StreamingMessage = {
    model: "Opus 4",
    partialText:
      "One more thing worth flagging for Q3 — your partner channel is up 14% week over week, so I'd front-load partner enablement before the paid-search push.",
  };

  export const plugins: PluginCardData[] = [
    {
      id: "pg1",
      name: "Linear",
      publisher: "Linear Inc.",
      verified: true,
      desc: "Sync issues and cycles into chat.",
      tags: ["Project mgmt"],
      enabled: true,
    },
    {
      id: "pg2",
      name: "GitHub",
      publisher: "GitHub",
      verified: true,
      desc: "Read repos, open PRs, review diffs.",
      tags: ["Dev"],
      enabled: false,
    },
    {
      id: "pg3",
      name: "Notion",
      publisher: "Notion Labs",
      desc: "Search and write to your workspace.",
      tags: ["Docs"],
      enabled: false,
    },
  ];

  export const greeting = "Good afternoon, Hasib";
  export const starters: string[] = [
    "Draft a Q3 GTM one-pager",
    "Explain this stack trace",
    "Refactor a React component",
    "Summarize a spreadsheet",
  ];

  export const codeMeta = {
    repo: "wedevs/cloud",
    branch: "main",
    sync: "Synced 2m ago",
  };

  export const filePreview: FilePreviewData = {
    name: "channel-mix.png",
    size: "1.2 MB",
    dims: "1600×900",
  };
  export const outputData: OutputData = {
    title: "Analysis complete",
    percent: 100,
    rows: [
      { label: "Rows scanned", value: "48,210" },
      { label: "Segments", value: "6" },
      { label: "Runtime", value: "3.4s" },
    ],
  };
  export const modelDetails: ModelDetails = {
    name: "Opus 4",
    sub: "Frontier · 200K ctx",
    params: [
      { label: "Temperature", value: 0.7, min: 0, max: 1 },
      { label: "Top P", value: 0.9, min: 0, max: 1 },
    ],
    tools: [
      { label: "Web search", on: true },
      { label: "Code execution", on: false },
    ],
  };
  export const pluginConfig: PluginConfigData = {
    name: "Linear",
    publisher: "Linear Inc.",
    connected: false,
    permissions: [
      { label: "Read issues", on: true },
      { label: "Write issues", on: false },
    ],
  };
  ```

- [ ] **Step 9: Compose the shell page.**
      Create `apps/web/src/app/app/page.tsx`. This is a client component. It selects from `useUIStore`, builds the shared prop objects (Composer, ModelSelector, CommandItems), maps `view → real view component`, and renders `AppShell` + palette + settings + a demo dev-bar. The dev-bar's `data-jump` buttons mirror mockup `jump()` (1537–1549) so a human/e2e run can reach every canonical screen combo.

  ```tsx
  "use client";
  import {
    AppShell,
    LeftRail,
    TopBar,
    ModelSelector,
    Inspector,
    CommandPalette,
    SettingsModal,
    EmptyView,
    ChatView,
    CodeView,
    MarketView,
    useTheme,
    useToast,
  } from "@wedevs/ui";
  import type {
    ComposerProps,
    ModelSelectorProps,
    CommandItem,
    InspectorTab,
  } from "@wedevs/ui";
  import { useUIStore } from "@/store/ui";
  import * as fx from "./fixtures";

  type JumpPreset =
    | "empty"
    | "chat"
    | "code"
    | "market"
    | "file"
    | "inspect"
    | "settings"
    | "selector";

  export default function ShellPage() {
    const s = useUIStore();
    const theme = useTheme();
    const toast = useToast();

    // ----- shared selector config -----
    const selector: ModelSelectorProps = {
      models: fx.models,
      agents: fx.agents,
      selectedModelId: s.selectedModelId,
      onSelectModel: s.setSelectedModel,
    };

    // ----- composer (shared by empty + chat views) -----
    const composer: ComposerProps = {
      variant: s.view === "empty" ? "empty" : "chat",
      value: s.composerValue,
      onChange: s.setComposerValue,
      onSubmit: () => {
        if (s.composerValue.trim() === "") return;
        toast.show("Message sent");
        s.setComposerValue("");
      },
      attachments: s.attach ? s.attachments : [],
      attachOpen: s.attachOpen,
      onAttach: s.toggleAttach,
      onRemoveAttachment: s.removeAttachment,
      toolsOn: s.toolsOn,
      onToggleTools: s.toggleTools,
      onVoice: () => toast.show("Voice input (demo)"),
      agentPill: <ModelSelector variant="pill" {...selector} />,
      dragging: s.dragging,
      toolCount: 4,
    };

    // ----- command palette items -----
    const paletteActions: CommandItem[] = [
      {
        id: "new",
        label: "New chat",
        kbd: "⌘N",
        group: "actions",
        onSelect: () => {
          s.newChat();
          s.setPaletteOpen(false);
        },
      },
      {
        id: "code",
        label: "Open Code",
        group: "actions",
        onSelect: () => {
          s.selectNav("code");
          s.setPaletteOpen(false);
        },
      },
      {
        id: "settings",
        label: "Settings",
        kbd: "⌘,",
        group: "actions",
        onSelect: () => {
          s.setSettingsOpen(true);
          s.setPaletteOpen(false);
        },
      },
    ];
    const paletteRecents: CommandItem[] = fx.recents.slice(0, 3).map((r) => ({
      id: r.id,
      label: r.title,
      group: "recent",
      onSelect: () => {
        s.selectNav("chat");
        s.setPaletteOpen(false);
      },
    }));
    const paletteModels: CommandItem[] = fx.models.slice(0, 3).map((m) => ({
      id: m.id,
      label: m.name,
      group: "models",
      onSelect: () => {
        s.setSelectedModel(m.id);
        s.setPaletteOpen(false);
      },
    }));

    // ----- jump() presets (mockup 1537-1549) for the demo dev-bar -----
    function jump(preset: JumpPreset) {
      switch (preset) {
        case "empty":
          s.newChat();
          break;
        case "chat":
          s.setView("chat");
          s.setPanel("closed");
          s.setAttach(false);
          s.setActiveNav("chat");
          break;
        case "code":
          s.selectNav("code");
          break;
        case "market":
          s.selectNav("market");
          break;
        case "file":
          s.setView("chat");
          s.setActiveNav("chat");
          s.setAttach(true);
          s.openInspector("file");
          break;
        case "inspect":
          s.setView("chat");
          s.setActiveNav("chat");
          s.openInspector("output");
          break;
        case "settings":
          s.setSettingsOpen(true);
          s.setSettingsPane("appearance");
          break;
        case "selector":
          s.setView("chat");
          s.setActiveNav("chat");
          break;
      }
    }

    // ----- main-column body per view -----
    function renderMain() {
      switch (s.view) {
        case "empty":
          return (
            <EmptyView
              greeting={fx.greeting}
              starters={fx.starters}
              composer={composer}
            />
          );
        case "chat":
          return (
            <ChatView
              messages={fx.messages}
              streaming={fx.streaming}
              composer={composer}
              onOpenOutput={() => s.openInspector("output")}
            />
          );
        case "code":
          return (
            <CodeView
              repo={fx.codeMeta.repo}
              branch={fx.codeMeta.branch}
              sync={fx.codeMeta.sync}
              onAction={(a) =>
                toast.show(
                  a === "run"
                    ? "Build started · running…"
                    : a === "pr"
                      ? "Pull request opened → #128"
                      : "Committed to main · 3 files",
                )
              }
            />
          );
        case "market":
          return (
            <MarketView
              plugins={fx.plugins}
              onToggle={(_id, on) =>
                toast.show(on ? "Plugin enabled" : "Plugin disabled")
              }
              onConfigure={() => s.openInspector("config")}
            />
          );
      }
    }

    const leftRail = (
      <LeftRail
        mode={s.rail}
        nav={fx.nav}
        activeNav={s.activeNav}
        recents={fx.recents}
        projects={fx.projects}
        account={fx.account}
        onNavSelect={s.selectNav}
        onNewChat={s.newChat}
        onSearch={() => s.setPaletteOpen(true)}
        onToggleCollapse={s.toggleRail}
        onRenameChat={() => {}}
        onChatAction={() => {}}
        onAccountAction={(action) => {
          if (action === "settings") s.setSettingsOpen(true);
          else if (action === "logout") toast.show("Signed out (demo)");
        }}
      />
    );

    const topBar = (
      <TopBar
        title={s.title}
        onTitleChange={s.setTitle}
        selector={{ ...selector, variant: "topbar" }}
        panel={s.panel}
        onPanelToggle={s.togglePanel}
        onPanelPin={s.pinPanel}
        onShare={() => toast.show("Link copied to clipboard")}
        onChatMenu={() => {}}
        onRailOpen={() => s.setRail("open")}
      />
    );

    const inspector =
      s.panel === "closed" ? undefined : (
        <Inspector
          mode={s.panel}
          tab={s.inspectorTab}
          onTabChange={(t: InspectorTab) => s.setInspectorTab(t)}
          onPin={s.pinPanel}
          onClose={() => s.setPanel("closed")}
          file={fx.filePreview}
          output={fx.outputData}
          model={fx.modelDetails}
          config={fx.pluginConfig}
        />
      );

    const jumps: JumpPreset[] = [
      "empty",
      "chat",
      "code",
      "file",
      "inspect",
      "market",
      "selector",
      "settings",
    ];

    return (
      <>
        <AppShell
          view={s.view}
          panel={s.panel}
          rail={s.rail}
          onPanelChange={s.setPanel}
          onRailChange={s.setRail}
          leftRail={leftRail}
          topBar={topBar}
          main={renderMain()}
          inspector={inspector}
          dragging={s.dragging}
        />

        <CommandPalette
          open={s.paletteOpen}
          onOpenChange={s.setPaletteOpen}
          actions={paletteActions}
          recents={paletteRecents}
          models={paletteModels}
        />

        <SettingsModal
          open={s.settingsOpen}
          onOpenChange={s.setSettingsOpen}
          pane={s.settingsPane}
          onPaneChange={s.setSettingsPane}
          themeMode={theme.mode}
          onThemeChange={theme.setMode}
        />

        {/* demo dev-bar — the one accent-glow-allowed surface (mock-dev-bar). */}
        <div
          data-testid="dev-bar"
          className="fixed bottom-3 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-[var(--radius)] border border-[--accent-line] bg-[--elevated] px-2 py-1.5 shadow-[var(--shadow)] shadow-[0_0_24px_var(--accent-soft)]"
        >
          {jumps.map((k) => (
            <button
              key={k}
              type="button"
              data-jump={k}
              onClick={() => jump(k)}
              className="rounded-[var(--radius-xs)] px-2 py-1 text-xs text-[--text-2] hover:bg-[--hover] hover:text-[--text] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[--accent-line]"
            >
              {k}
            </button>
          ))}
          <button
            type="button"
            data-testid="theme-toggle"
            onClick={theme.toggle}
            className="ml-1 rounded-[var(--radius-xs)] border border-[--border] px-2 py-1 text-xs text-[--text] hover:bg-[--hover] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[--accent-line]"
          >
            Theme: {theme.resolved}
          </button>
        </div>
      </>
    );
  }
  ```

  Note the dev-bar is the sole element permitted `--accent-soft`/`--accent-line` here (ambient glow + focus ring), consistent with the global Volt rule. All view/rail/topbar/inspector styling comes from `@wedevs/ui` — you add none.

- [ ] **Step 10: Typecheck the wiring before writing tests.**

  ```bash
  cd /d/Rajin/Wedevs.cloud/apps/web && pnpm exec tsc --noEmit
  ```

  Expected: exits `0`, no output. If a `@wedevs/ui` import is reported missing/`any`, that is an upstream Task 1–15 gap — stop and report it; do not add local shims.

- [ ] **Step 11: Write the failing view-render + theme integration tests.**
      Create `apps/web/src/app/app/page.test.tsx`. A shared `renderShell()` wraps the page in the real providers (they are normally in `layout.tsx`, which tests don't mount). Store is reset before each test.

  ```tsx
  import { describe, it, expect, beforeEach, vi } from "vitest";
  import { render, screen, within, cleanup } from "@testing-library/react";
  import userEvent from "@testing-library/user-event";
  import { ThemeProvider, ToastProvider } from "@wedevs/ui";
  import { useUIStore, initialUIState } from "@/store/ui";
  import ShellPage from "./page";

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
      <ThemeProvider>
        <ToastProvider>
          <ShellPage />
        </ToastProvider>
      </ThemeProvider>,
    );
  }

  beforeEach(() => {
    cleanup();
    localStorage.clear();
    setMatchMedia(false, true); // motion allowed, system=dark
    useUIStore.setState(initialUIState);
    document.documentElement.removeAttribute("data-theme");
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
      expect(screen.getByText(/wedevs\/cloud/)).toBeInTheDocument();
    });

    it("renders MarketView plugin cards when view=market", () => {
      useUIStore.setState({ view: "market" });
      renderShell();
      expect(screen.getByText("Linear")).toBeInTheDocument();
      expect(screen.getByText("GitHub")).toBeInTheDocument();
    });

    it("mounts the Inspector only when panel is open", () => {
      useUIStore.setState({ view: "chat", panel: "closed" });
      const { rerender } = renderShell();
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
      cleanup();
      useUIStore.setState({ view: "empty" });
      renderShell();
      expect(document.documentElement.getAttribute("data-theme")).toBe("light");
      expect(screen.getByText("Good afternoon, Hasib")).toBeInTheDocument();
    });
  });
  ```

  Run:

  ```bash
  cd /d/Rajin/Wedevs.cloud/apps/web && pnpm exec vitest run src/app/app/page.test.tsx
  ```

  Expected at this point: **PASS** (the page from Steps 7–9 already satisfies these). If any FAIL, fix the page/store — do not weaken the assertion. (These are written as behavior checks, not red-first stubs, because the implementation already exists from Steps 7–9; treat a failure as a real defect.)

- [ ] **Step 12: Add the reduced-motion + keyboard-focus acceptance tests.**
      Append to `apps/web/src/app/app/page.test.tsx`:

  ```tsx
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
  ```

  Run the file again:

  ```bash
  cd /d/Rajin/Wedevs.cloud/apps/web && pnpm exec vitest run src/app/app/page.test.tsx
  ```

  Expected: **all describe blocks PASS**. If the control reduced-motion test finds zero `animate-` classes, the chat/live components are not motion-gating via `animate-*` utilities — inspect the failing live/mascot component and report it as a Task 6/7 gap (do not delete the assertion). If the palette `dialog` role is missing, that is a Task 11 a11y gap — report it.

- [ ] **Step 13: Add the Volt-audit test (neutral = interactive · Volt = alive).**
      Append to `apps/web/src/app/app/page.test.tsx`. The audit makes **positive neutrality assertions** on the load-bearing interactive elements (deterministic in jsdom, since it reads `className` strings, not computed CSS), then a **negative sweep** confirming that any element carrying an `accent` utility class is one of the sanctioned alive/allowed surfaces.

  ```tsx
  describe("Volt audit — accent appears on no non-alive element", () => {
    // Selectors for the ONLY surfaces allowed to paint with --accent on this page:
    // live primitives (caret/dots/cluster), mascots, switch on-state, composer focus ring,
    // keyboard focus outlines, and the demo dev-bar (mock-dev-bar ambient glow).
    const ALLOWED = [
      "[data-live]",
      "[data-mascot]",
      '[role="switch"]',
      ".switch",
      "[data-focus-ring]",
      '[data-testid="dev-bar"]',
    ].join(",");

    it("keeps primary buttons, active nav, and bubbles neutral", () => {
      useUIStore.setState({ view: "chat", panel: "closed" });
      renderShell();

      // New chat + Send are neutral --primary buttons, never volt.
      const newChat = screen.getByRole("button", { name: /new chat/i });
      expect(newChat.className).not.toMatch(/accent/);

      // Active nav item is neutral --active, not volt.
      const chatNav = screen.getByRole("button", { name: /^chat$/i });
      expect(chatNav.className).not.toMatch(/accent/);
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
      );
      // There should be at least one (the streaming caret / live dot) — proves the
      // audit is actually seeing rendered accent usage, not a false pass.
      expect(accentEls.length).toBeGreaterThan(0);

      for (const el of accentEls) {
        const sanctioned = el.matches(ALLOWED) || el.closest(ALLOWED) !== null;
        expect(
          sanctioned,
          `accent used on non-alive element: <${el.tagName.toLowerCase()} class="${el.className}">`,
        ).toBe(true);
      }
    });
  });
  ```

  Run:

  ```bash
  cd /d/Rajin/Wedevs.cloud/apps/web && pnpm exec vitest run src/app/app/page.test.tsx
  ```

  Expected: **PASS**. A failure in the negative sweep names the offending element (e.g. a nav item or bubble tinted with an `accent` utility) — that is a real Volt-rule violation in the upstream component; report it against the component's task (Task 8 LeftRail, Task 9 TopBar, Task 12 ChatView, etc.). Do not relax `ALLOWED` to hide it. (The `data-live` / `data-mascot` / `data-focus-ring` markers are emitted by the live/mascot/composer components per their own tasks; if a legit alive element lacks its marker and trips the audit, report that as the marker-gap it is.)

- [ ] **Step 14: Run the full `apps/web` test + typecheck + lint gate.**

  ```bash
  cd /d/Rajin/Wedevs.cloud/apps/web && pnpm exec vitest run && pnpm exec tsc --noEmit && pnpm exec eslint .
  ```

  Expected: vitest reports all `page.test.tsx` blocks green (`Test Files 1 passed`, plus any pre-existing foundations test), `tsc` exits `0` with no output, `eslint` exits `0` with no errors. Fix any lint/type error before proceeding — no `// eslint-disable`, no `any`.

- [ ] **Step 15: Production build — verify fonts, tokens, and transpiled `@wedevs/ui` all resolve.**

  ```bash
  cd /d/Rajin/Wedevs.cloud/apps/web && pnpm exec next build
  ```

  Expected: build succeeds; output lists the `/app` route and the `/` redirect; no "Module not found" for `@wedevs/config/theme.css`, `@wedevs/ui/styles/keyframes.css`, `next/font`, or any `@wedevs/ui` component. A font-download failure or a missing CSS export here is an upstream packaging gap (Task 2/3/4) — report it with the exact module path.

- [ ] **Step 16: Manual acceptance sweep — every screen, both themes, responsive.**

  ```bash
  cd /d/Rajin/Wedevs.cloud/apps/web && pnpm dev
  ```

  In a browser at `http://localhost:3000` (redirects to `/app`), walk the canonical screen combos using the dev-bar buttons (they mirror mockup `jump()` 1537–1549) and confirm each against `d:/Rajin/Wedevs.cloud/mockup/index.html` for parity:
  1. `empty` — Visor hero + greeting "Good afternoon, Hasib" + tall centered composer + 4 starter chips.
  2. `chat` — user bubble (neutral), assistant message with tool card, streaming line with blinking accent caret; composer at bottom.
  3. `code` — CodeView with `wedevs/cloud` · `main` · `Synced 2m ago`; Run/PR/Commit fire toasts.
  4. `file` — chat with populated attachment tray + Inspector open on the File pane (image preview `channel-mix.png`).
  5. `inspect` — chat + Inspector on the Output pane ("Analysis complete", 100%).
  6. `market` — plugin cards (Linear/GitHub/Notion) with switches; toggling fires toast; Configure opens the Config pane.
  7. `selector` — chat; open the topbar model selector, confirm frontier/fast/local groups + agents.
  8. `settings` — SettingsModal on Appearance; theme picks + the dual-swatch `.tp` preview.
     For each, click **Theme** to flip light↔dark and confirm both render correctly (surfaces, text contrast, borders). Then resize the window through the breakpoints and confirm: **1180px** pinned Inspector → overlay; **900px** LeftRail → off-canvas drawer + hamburger + scrim; **760px** code file-tree hidden; **680px** Inspector full-screen sheet, topbar title hidden, greeting shrinks. Finally, in DevTools enable "Emulate prefers-reduced-motion: reduce" and confirm all animation stops (mascot bob/blink, stream shimmer, caret, live dots, theme cross-fade). Tab through the UI and confirm every interactive control shows a visible focus ring, and that Volt (accent green) appears **only** on: streaming caret, live/presence dots, mascot eyes/antenna/scanline, the sidebar logo-dot, switch on-states, the composer focus ring, keyboard focus rings, and the dev-bar glow — and on **no** button/bubble/nav/tab.
     Stop the server (`Ctrl+C`) when done. Note any parity or Volt deviation as a defect against the owning component's task; nothing on this page is fixed by re-styling here.

- [ ] **Step 17: Commit.**
  ```bash
  cd /d/Rajin/Wedevs.cloud && git add apps/web && git commit -m "feat(web): wire design system into authed shell page and pass acceptance sweep"
  ```
  Expected: one commit created on the current Phase-1 branch (`develop`), touching only `apps/web/**`. Message ends with the required `Co-Authored-By` trailer per repo convention.

---

#### Definition of done

- `apps/web/src/app/layout.tsx` applies the self-hosted font CSS vars to `<html>` and wraps children in `ThemeProvider` + `ToastProvider`; `globals.css` imports tailwind + `@wedevs/config/theme.css` + `tw-animate-css` + `@wedevs/ui/styles/keyframes.css` in that order.
- `apps/web/src/store/ui.ts` exports `useUIStore` + `initialUIState`; its transitions (`togglePanel`/`pinPanel`/`toggleRail`/`openInspector`/`newChat`/`selectNav`) match the mockup semantics.
- `apps/web/src/app/app/page.tsx` renders `AppShell` wired to the store, mapping `view` → the real `EmptyView`/`ChatView`/`CodeView`/`MarketView`, mounting `Inspector` only when the panel is open, plus `CommandPalette`, `SettingsModal`, and the demo dev-bar; every prop object is built from the shared-contract types with no `any`.
- `pnpm exec vitest run`, `pnpm exec tsc --noEmit`, and `pnpm exec eslint .` in `apps/web` all pass.
- `pnpm exec next build` succeeds with the `/app` route present.
- `page.test.tsx` covers: each view renders its real component; theme stamps and flips `data-theme`; both themes render; the Volt-audit (positive neutrality on primary buttons/active nav + negative sweep confirming accent only on sanctioned alive/allowed surfaces); reduced-motion emits zero `animate-*` classes (with an allow-motion control); Tab reaches an interactive element.
- Manual sweep confirms all 8 canonical screens in both light and dark, responsive across the four breakpoints, reduced-motion disables all animation, focus rings are visible, and Volt appears on no non-alive element.
- Work committed with a Conventional Commit touching only `apps/web/**`.

---
