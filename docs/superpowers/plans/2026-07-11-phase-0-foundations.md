# Phase 0 — Foundations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the Wedevs monorepo with tooling, a shared config, a scaffolded Next.js web app, env validation, a working test harness, git hooks, and a green CI pipeline.

**Architecture:** A pnpm + Turborepo monorepo. `apps/*` hold runnable programs (web, worker); `packages/*` hold shared libraries (config, shared utils, ui, ai, db, integrations). A shared config package centralizes TypeScript, ESLint, Prettier, and Tailwind presets so every workspace inherits one source of truth. CI runs lint → typecheck → test on every PR.

**Tech Stack:** pnpm 9, Turborepo 2, Node 22, TypeScript 5.6 (strict), Next.js 15 + React 19, Tailwind CSS v4, Vitest 2, ESLint 9 (flat config), Prettier 3, Husky + lint-staged + commitlint, GitHub Actions.

## Global Constraints

- Node `>=22`, pnpm `>=9` (declared in root `package.json` `engines` + `packageManager`).
- TypeScript `strict: true` everywhere; no `any` without an inline justification comment.
- Package names are scoped `@wedevs/*`; internal deps use `workspace:*`.
- Conventional Commits enforced by commitlint (`feat:`, `fix:`, `chore:`, …).
- No secrets in the repo. All env access goes through the validated env module — never read `process.env` directly in app code.
- The monorepo is initialized at the repo root `d:\Rajin\Wedevs.cloud`. Existing `prototype/`, `mockup/`, and `docs/` stay in place as design/reference artifacts.
- Commands are shown with forward-slash paths; they work as-is in PowerShell and Bash. Run every command from the repo root unless stated otherwise.

---

## File Structure

Files created in this phase and their single responsibility:

- `package.json` — root workspace manifest: scripts, devtools, engines, packageManager.
- `pnpm-workspace.yaml` — workspace globs (`apps/*`, `packages/*`).
- `turbo.json` — task pipeline (lint/typecheck/test/build) with dependsOn + outputs.
- `.gitignore`, `.npmrc`, `.nvmrc` — VCS ignores, pnpm settings, Node version pin.
- `packages/config/` — shared presets: `tsconfig.base.json`, `eslint.preset.js`, `prettier.config.js`, `tailwind.preset.ts`.
- `packages/shared/` — framework-agnostic utils + Zod types; first real Vitest test lives here (`formatBytes`).
- `packages/ui/`, `packages/ai/`, `packages/db/`, `packages/integrations/` — library skeletons with typed `index.ts` so the workspace graph is complete and typechecks.
- `apps/web/` — Next.js 15 app (App Router) inheriting the shared config; a `/api/health` route; the validated env module.
- `apps/worker/` — Node service skeleton (BullMQ consumer stub) that typechecks and starts.
- `.github/workflows/ci.yml` — install → lint → typecheck → test on PRs.
- `.husky/`, `commitlint.config.js` — pre-commit lint-staged + commit-msg lint.

Each task below ends with an independently verifiable deliverable and a commit.

---

## Task 1: Initialize the monorepo skeleton

**Files:**
- Create: `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `.gitignore`, `.npmrc`, `.nvmrc`

**Interfaces:**
- Consumes: nothing (first task).
- Produces: a pnpm+Turborepo workspace with the `dev/build/lint/typecheck/test/format` script names that all later tasks and CI call.

- [ ] **Step 1: Initialize git (skip if already a repo)**

Run:
```bash
git init
```
Expected: `Initialized empty Git repository` (or a no-op if already initialized).

- [ ] **Step 2: Create `.gitignore`**

`.gitignore`:
```gitignore
node_modules/
.next/
dist/
out/
.turbo/
coverage/
*.log
.env
.env.*
!.env.example
.DS_Store
apps/desktop/src-tauri/target/
```

- [ ] **Step 3: Create `.npmrc` and `.nvmrc`**

`.npmrc`:
```
auto-install-peers=true
strict-peer-dependencies=false
```

`.nvmrc`:
```
22
```

- [ ] **Step 4: Create the root `package.json`**

`package.json`:
```json
{
  "name": "wedevs",
  "private": true,
  "packageManager": "pnpm@11.10.0",
  "engines": { "node": ">=22", "pnpm": ">=9" },
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck",
    "test": "turbo run test",
    "format": "prettier --write \"**/*.{ts,tsx,js,json,md,css}\"",
    "prepare": "husky"
  },
  "devDependencies": {
    "turbo": "^2.1.0",
    "prettier": "^3.3.0",
    "typescript": "^5.6.0"
  }
}
```

- [ ] **Step 5: Create `pnpm-workspace.yaml`**

`pnpm-workspace.yaml`:
```yaml
packages:
  - "apps/*"
  - "packages/*"
```

- [ ] **Step 6: Create `turbo.json`**

`turbo.json`:
```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": [".next/**", "!.next/cache/**", "dist/**"] },
    "lint": {},
    "typecheck": { "dependsOn": ["^build"] },
    "test": {},
    "dev": { "cache": false, "persistent": true }
  }
}
```

- [ ] **Step 7: Create the workspace directories**

Run (two commands so it works identically in PowerShell and Bash):
```bash
mkdir apps
mkdir packages
```
Expected: two new empty directories.

- [ ] **Step 8: Install and verify Turborepo is available**

Run:
```bash
pnpm install
pnpm turbo --version
```
Expected: install completes; `turbo --version` prints `2.x.x`.

- [ ] **Step 9: Commit**

```bash
git add .gitignore .npmrc .nvmrc package.json pnpm-workspace.yaml turbo.json pnpm-lock.yaml
git commit -m "chore: initialize pnpm + turborepo monorepo skeleton"
```

---

## Task 2: Shared config package (`@wedevs/config`)

**Files:**
- Create: `packages/config/package.json`, `packages/config/tsconfig.base.json`, `packages/config/eslint.preset.js`, `packages/config/prettier.config.js`, `packages/config/tailwind.preset.ts`

**Interfaces:**
- Consumes: the workspace from Task 1.
- Produces: `@wedevs/config` exposing `tsconfig.base.json` (extended by every package via `"extends": "@wedevs/config/tsconfig.base.json"`) and `eslint.preset.js` (imported by each package's `eslint.config.js`).

- [ ] **Step 1: Create the package manifest**

`packages/config/package.json`:
```json
{
  "name": "@wedevs/config",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    "./tsconfig.base.json": "./tsconfig.base.json",
    "./eslint": "./eslint.preset.js",
    "./prettier": "./prettier.config.js",
    "./tailwind": "./tailwind.preset.ts"
  },
  "devDependencies": {
    "@eslint/js": "^9.12.0",
    "typescript-eslint": "^8.8.0",
    "eslint": "^9.12.0",
    "eslint-config-prettier": "^9.1.0"
  }
}
```

- [ ] **Step 2: Create the base TypeScript config**

`packages/config/tsconfig.base.json`:
```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "declaration": true,
    "noEmit": true
  }
}
```

- [ ] **Step 3: Create the ESLint preset (flat config)**

`packages/config/eslint.preset.js`:
```js
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  { ignores: ["dist/**", ".next/**", ".turbo/**", "coverage/**"] },
);
```

- [ ] **Step 4: Create the Prettier config**

`packages/config/prettier.config.js`:
```js
export default { semi: true, singleQuote: false, printWidth: 100, trailingComma: "all" };
```

- [ ] **Step 5: Create the Tailwind preset (Wedevs tokens placeholder for Phase 1)**

`packages/config/tailwind.preset.ts`:
```ts
import type { Config } from "tailwindcss";

// Phase 1 fills the full Wedevs token set (Graphite × Volt) here.
// Phase 0 only proves the preset is importable and typed.
const preset = {
  theme: { extend: {} },
} satisfies Partial<Config>;

export default preset;
```

- [ ] **Step 6: Install and verify the package resolves**

Run:
```bash
pnpm install
pnpm --filter @wedevs/config exec node -e "console.log('config ok')"
```
Expected: install completes; prints `config ok`.

- [ ] **Step 7: Commit**

```bash
git add packages/config
git commit -m "chore(config): add shared tsconfig, eslint, prettier, tailwind presets"
```

---

## Task 3: Shared utils package with a real test harness (`@wedevs/shared`)

**Files:**
- Create: `packages/shared/package.json`, `packages/shared/tsconfig.json`, `packages/shared/eslint.config.js`, `packages/shared/vitest.config.ts`, `packages/shared/src/index.ts`, `packages/shared/src/format-bytes.ts`, `packages/shared/src/format-bytes.test.ts`

**Interfaces:**
- Consumes: `@wedevs/config` (tsconfig + eslint presets).
- Produces: `@wedevs/shared` exporting `formatBytes(bytes: number): string` — used later by the attachment UI (Phase 5). This task establishes the Vitest harness every other package will copy.

- [ ] **Step 1: Create the package manifest**

`packages/shared/package.json`:
```json
{
  "name": "@wedevs/shared",
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
  "devDependencies": {
    "@wedevs/config": "workspace:*",
    "eslint": "^9.12.0",
    "typescript": "^5.6.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: Create the tsconfig and eslint config**

`packages/shared/tsconfig.json`:
```json
{ "extends": "@wedevs/config/tsconfig.base.json", "include": ["src"] }
```

`packages/shared/eslint.config.js`:
```js
import preset from "@wedevs/config/eslint";
export default preset;
```

- [ ] **Step 3: Create the Vitest config**

`packages/shared/vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
export default defineConfig({ test: { environment: "node", include: ["src/**/*.test.ts"] } });
```

- [ ] **Step 4: Write the failing test**

`packages/shared/src/format-bytes.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { formatBytes } from "./format-bytes";

describe("formatBytes", () => {
  it("formats zero", () => expect(formatBytes(0)).toBe("0 B"));
  it("formats bytes", () => expect(formatBytes(512)).toBe("512 B"));
  it("formats kilobytes", () => expect(formatBytes(1024)).toBe("1 KB"));
  it("formats megabytes with one decimal", () => expect(formatBytes(1_258_291)).toBe("1.2 MB"));
  it("formats gigabytes", () => expect(formatBytes(3_221_225_472)).toBe("3 GB"));
});
```

- [ ] **Step 5: Add the `test` runner deps and run the test to verify it fails**

Run:
```bash
pnpm install
pnpm --filter @wedevs/shared test
```
Expected: FAIL — `Failed to resolve import "./format-bytes"` (module not yet created).

- [ ] **Step 6: Write the minimal implementation**

`packages/shared/src/format-bytes.ts`:
```ts
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  const rounded = value >= 10 || Number.isInteger(value) ? Math.round(value) : Math.round(value * 10) / 10;
  return `${rounded} ${units[unit]}`;
}
```

`packages/shared/src/index.ts`:
```ts
export { formatBytes } from "./format-bytes";
```

- [ ] **Step 7: Run the test to verify it passes**

Run:
```bash
pnpm --filter @wedevs/shared test
```
Expected: PASS — 5 tests green.

- [ ] **Step 8: Verify lint + typecheck pass**

Run:
```bash
pnpm --filter @wedevs/shared lint
pnpm --filter @wedevs/shared typecheck
```
Expected: both exit 0.

- [ ] **Step 9: Commit**

```bash
git add packages/shared
git commit -m "feat(shared): add formatBytes util with vitest harness"
```

---

## Task 4: Library skeletons (`@wedevs/ui`, `@wedevs/ai`, `@wedevs/db`, `@wedevs/integrations`)

**Files:**
- Create, for each of `ui`, `ai`, `db`, `integrations`: `packages/<name>/package.json`, `packages/<name>/tsconfig.json`, `packages/<name>/eslint.config.js`, `packages/<name>/src/index.ts`

**Interfaces:**
- Consumes: `@wedevs/config`.
- Produces: four typed, lintable, empty-but-valid packages so the workspace graph is complete and `typecheck`/`lint` run across everything. Real code arrives in later phases.

- [ ] **Step 1: Create each package manifest (repeat for ui, ai, db, integrations)**

`packages/ui/package.json` (change `name` per package to `@wedevs/ai`, `@wedevs/db`, `@wedevs/integrations`):
```json
{
  "name": "@wedevs/ui",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": { "lint": "eslint .", "typecheck": "tsc --noEmit" },
  "devDependencies": {
    "@wedevs/config": "workspace:*",
    "eslint": "^9.12.0",
    "typescript": "^5.6.0"
  }
}
```

- [ ] **Step 2: Create the tsconfig + eslint config for each package**

`packages/ui/tsconfig.json` (identical file in each package):
```json
{ "extends": "@wedevs/config/tsconfig.base.json", "include": ["src"] }
```

`packages/ui/eslint.config.js` (identical file in each package):
```js
import preset from "@wedevs/config/eslint";
export default preset;
```

- [ ] **Step 3: Create a typed placeholder export for each package**

`packages/ui/src/index.ts`:
```ts
export const UI_PACKAGE = "@wedevs/ui" as const;
```
`packages/ai/src/index.ts`:
```ts
export const AI_PACKAGE = "@wedevs/ai" as const;
```
`packages/db/src/index.ts`:
```ts
export const DB_PACKAGE = "@wedevs/db" as const;
```
`packages/integrations/src/index.ts`:
```ts
export const INTEGRATIONS_PACKAGE = "@wedevs/integrations" as const;
```

- [ ] **Step 4: Install and verify all four typecheck + lint**

Run:
```bash
pnpm install
pnpm --filter "@wedevs/ui" --filter "@wedevs/ai" --filter "@wedevs/db" --filter "@wedevs/integrations" typecheck
pnpm --filter "@wedevs/ui" --filter "@wedevs/ai" --filter "@wedevs/db" --filter "@wedevs/integrations" lint
```
Expected: all exit 0.

- [ ] **Step 5: Commit**

```bash
git add packages/ui packages/ai packages/db packages/integrations
git commit -m "chore: scaffold ui, ai, db, integrations package skeletons"
```

---

## Task 5: Scaffold the Next.js web app (`apps/web`)

**Files:**
- Create: `apps/web/package.json`, `apps/web/tsconfig.json`, `apps/web/next.config.ts`, `apps/web/eslint.config.js`, `apps/web/postcss.config.mjs`, `apps/web/src/app/globals.css`, `apps/web/src/app/layout.tsx`, `apps/web/src/app/page.tsx`, `apps/web/src/app/api/health/route.ts`

**Interfaces:**
- Consumes: `@wedevs/config` (tsconfig, eslint), `@wedevs/shared`, `@wedevs/ui`.
- Produces: a runnable Next.js 15 app exposing `GET /api/health` → `{ ok: true, sha }` (used by the deploy healthcheck in Phase 13). Establishes the web app's `lint`/`typecheck`/`build`/`dev` scripts.

- [ ] **Step 1: Create the web package manifest**

`apps/web/package.json`:
```json
{
  "name": "web",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev --port 3000",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@wedevs/shared": "workspace:*",
    "@wedevs/ui": "workspace:*",
    "next": "^15.1.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@wedevs/config": "workspace:*",
    "@types/node": "^22.7.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@tailwindcss/postcss": "^4.0.0",
    "tailwindcss": "^4.0.0",
    "eslint": "^9.12.0",
    "eslint-config-next": "^15.1.0",
    "typescript": "^5.6.0"
  }
}
```

- [ ] **Step 2: Create the web tsconfig, next config, eslint, and postcss configs**

`apps/web/tsconfig.json`:
```json
{
  "extends": "@wedevs/config/tsconfig.base.json",
  "compilerOptions": {
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] },
    "jsx": "preserve"
  },
  "include": ["next-env.d.ts", "src/**/*.ts", "src/**/*.tsx", ".next/types/**/*.ts"]
}
```

`apps/web/next.config.ts`:
```ts
import type { NextConfig } from "next";
const config: NextConfig = { output: "standalone", transpilePackages: ["@wedevs/ui", "@wedevs/shared"] };
export default config;
```

`apps/web/eslint.config.js`:
```js
import preset from "@wedevs/config/eslint";
export default preset;
```

`apps/web/postcss.config.mjs`:
```js
export default { plugins: { "@tailwindcss/postcss": {} } };
```

- [ ] **Step 3: Create the app entry files**

`apps/web/src/app/globals.css`:
```css
@import "tailwindcss";
```

`apps/web/src/app/layout.tsx`:
```tsx
import "./globals.css";
import type { ReactNode } from "react";

export const metadata = { title: "Wedevs", description: "AI chat + code workspace" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

`apps/web/src/app/page.tsx`:
```tsx
import { UI_PACKAGE } from "@wedevs/ui";

export default function Home() {
  return <main style={{ padding: 24 }}>Wedevs foundations online — {UI_PACKAGE}</main>;
}
```

- [ ] **Step 4: Create the health route**

`apps/web/src/app/api/health/route.ts`:
```ts
export const runtime = "nodejs";

export function GET() {
  const sha = process.env.GIT_SHA ?? "dev";
  return Response.json({ ok: true, sha });
}
```

- [ ] **Step 5: Install, then verify the build and health route**

Run:
```bash
pnpm install
pnpm --filter web build
```
Expected: `next build` completes with a `.next/standalone` output and no type errors.

- [ ] **Step 6: Verify the dev server serves the health route**

Run (in one terminal):
```bash
pnpm --filter web dev
```
Then in another terminal:
```bash
curl http://localhost:3000/api/health
```
Expected: `{"ok":true,"sha":"dev"}`. Stop the dev server afterward.

- [ ] **Step 7: Commit**

```bash
git add apps/web
git commit -m "feat(web): scaffold Next.js 15 app with health route"
```

---

## Task 6: Validated env module (`apps/web`)

**Files:**
- Create: `apps/web/src/env.ts`, `apps/web/src/env.test.ts`, `apps/web/vitest.config.ts`, `.env.example`
- Modify: `apps/web/package.json` (add `test` script + deps), `apps/web/src/app/api/health/route.ts:1-8` (read `env` instead of `process.env`)

**Interfaces:**
- Consumes: `apps/web` from Task 5.
- Produces: `env` — a typed, validated config object (`import { env } from "@/env"`). All web code reads env through this module. Exposes `env.GIT_SHA` and (from Phase 2 onward) the Supabase/AI/Stripe vars.

- [ ] **Step 1: Add the env + test deps and a `test` script to `apps/web/package.json`**

Add to `apps/web/package.json` `dependencies`:
```json
"@t3-oss/env-nextjs": "^0.11.0",
"zod": "^3.23.0"
```
Add to `devDependencies`:
```json
"vitest": "^2.1.0"
```
Add to `scripts`:
```json
"test": "vitest run"
```

- [ ] **Step 2: Create the Vitest config for the web app**

`apps/web/vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: { environment: "node", include: ["src/**/*.test.ts"] },
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
});
```

- [ ] **Step 3: Write the failing test**

`apps/web/src/env.test.ts`:
```ts
import { describe, it, expect } from "vitest";

describe("env", () => {
  it("provides GIT_SHA with a default", async () => {
    const { env } = await import("./env");
    expect(typeof env.GIT_SHA).toBe("string");
  });
});
```

- [ ] **Step 4: Run the test to verify it fails**

Run:
```bash
pnpm install
pnpm --filter web test
```
Expected: FAIL — cannot resolve `./env` (module not yet created).

- [ ] **Step 5: Write the env module**

`apps/web/src/env.ts`:
```ts
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    GIT_SHA: z.string().default("dev"),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  },
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    GIT_SHA: process.env.GIT_SHA,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
  emptyStringAsUndefined: true,
});
```

- [ ] **Step 6: Point the health route at the validated env**

Replace `apps/web/src/app/api/health/route.ts` with:
```ts
import { env } from "@/env";

export const runtime = "nodejs";

export function GET() {
  return Response.json({ ok: true, sha: env.GIT_SHA });
}
```

- [ ] **Step 7: Create `.env.example`**

`.env.example`:
```
# Web (Phase 0 subset — later phases append Supabase / AI / Stripe / GitHub vars)
NEXT_PUBLIC_APP_URL=http://localhost:3000
GIT_SHA=dev
```

- [ ] **Step 8: Run the test to verify it passes**

Run:
```bash
pnpm --filter web test
```
Expected: PASS.

- [ ] **Step 9: Verify typecheck + build still pass**

Run:
```bash
pnpm --filter web typecheck
pnpm --filter web build
```
Expected: both exit 0.

- [ ] **Step 10: Commit**

```bash
git add apps/web .env.example
git commit -m "feat(web): add validated env module and route it through health"
```

---

## Task 7: Worker skeleton (`apps/worker`)

**Files:**
- Create: `apps/worker/package.json`, `apps/worker/tsconfig.json`, `apps/worker/eslint.config.js`, `apps/worker/src/index.ts`

**Interfaces:**
- Consumes: `@wedevs/config`, `@wedevs/shared`.
- Produces: a runnable Node worker entrypoint (`start`) that boots and logs readiness. Real BullMQ queues arrive in Phase 5/7.

- [ ] **Step 1: Create the worker manifest**

`apps/worker/package.json`:
```json
{
  "name": "worker",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "start": "tsx src/index.ts",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": { "@wedevs/shared": "workspace:*" },
  "devDependencies": {
    "@wedevs/config": "workspace:*",
    "@types/node": "^22.7.0",
    "eslint": "^9.12.0",
    "tsx": "^4.19.0",
    "typescript": "^5.6.0"
  }
}
```

- [ ] **Step 2: Create the tsconfig + eslint config**

`apps/worker/tsconfig.json`:
```json
{ "extends": "@wedevs/config/tsconfig.base.json", "include": ["src"] }
```

`apps/worker/eslint.config.js`:
```js
import preset from "@wedevs/config/eslint";
export default preset;
```

- [ ] **Step 3: Create the worker entrypoint**

`apps/worker/src/index.ts`:
```ts
import { formatBytes } from "@wedevs/shared";

function main(): void {
  // Phase 5/7 replace this with a BullMQ consumer. Phase 0 proves boot + workspace import.
  console.log(`wedevs worker ready (self-check: ${formatBytes(1_258_291)})`);
}

main();
```

- [ ] **Step 4: Install, then verify boot + typecheck + lint**

Run:
```bash
pnpm install
pnpm --filter worker start
```
Expected: prints `wedevs worker ready (self-check: 1.2 MB)`.

Run:
```bash
pnpm --filter worker typecheck
pnpm --filter worker lint
```
Expected: both exit 0.

- [ ] **Step 5: Commit**

```bash
git add apps/worker
git commit -m "chore(worker): scaffold node worker skeleton"
```

---

## Task 8: Wire the full Turborepo pipeline + top-level gates

**Files:**
- Modify: `turbo.json` (ensure lint/typecheck/test/build across all workspaces)
- Create: `tsconfig.json` (root, references convenience for editors)

**Interfaces:**
- Consumes: all packages/apps from Tasks 1–7.
- Produces: the four repo-wide gates (`pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`) that CI runs.

- [ ] **Step 1: Create a root tsconfig for editor DX**

`tsconfig.json`:
```json
{ "files": [], "include": [], "extends": "@wedevs/config/tsconfig.base.json" }
```

- [ ] **Step 2: Run every gate across the whole monorepo**

Run:
```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```
Expected: all four succeed. `test` runs the `@wedevs/shared` and `web` suites; `build` produces the web standalone output.

- [ ] **Step 3: Commit**

```bash
git add turbo.json tsconfig.json
git commit -m "chore: wire monorepo-wide lint/typecheck/test/build gates"
```

---

## Task 9: Git hooks — lint-staged + commitlint

**Files:**
- Create: `.husky/pre-commit`, `.husky/commit-msg`, `commitlint.config.js`, `.lintstagedrc.json`
- Modify: `package.json` (add hook tooling devDeps)

**Interfaces:**
- Consumes: the root scripts from Task 1.
- Produces: pre-commit auto-fix (eslint + prettier on staged files) and Conventional-Commits enforcement on commit messages.

- [ ] **Step 1: Add hook tooling to the root `package.json` devDependencies**

Add to `package.json` `devDependencies`:
```json
"husky": "^9.1.0",
"lint-staged": "^15.2.0",
"@commitlint/cli": "^19.5.0",
"@commitlint/config-conventional": "^19.5.0"
```

- [ ] **Step 2: Install and initialize Husky**

Run:
```bash
pnpm install
pnpm exec husky init
```
Expected: a `.husky/` directory with a sample `pre-commit`.

- [ ] **Step 3: Create the lint-staged config**

`.lintstagedrc.json`:
```json
{ "*.{ts,tsx,js}": ["eslint --fix", "prettier --write"], "*.{json,md,css}": ["prettier --write"] }
```

- [ ] **Step 4: Set the pre-commit hook to run lint-staged**

`.husky/pre-commit`:
```sh
pnpm exec lint-staged
```

- [ ] **Step 5: Create the commitlint config and commit-msg hook**

`commitlint.config.js`:
```js
export default { extends: ["@commitlint/config-conventional"] };
```

`.husky/commit-msg`:
```sh
pnpm exec commitlint --edit "$1"
```

- [ ] **Step 6: Verify the hooks reject a bad commit and accept a good one**

Run:
```bash
git add .husky commitlint.config.js .lintstagedrc.json package.json pnpm-lock.yaml
git commit -m "bad message"
```
Expected: FAIL — commitlint rejects the non-conventional message.

Run:
```bash
git commit -m "chore: add husky, lint-staged, and commitlint hooks"
```
Expected: PASS — pre-commit runs lint-staged, commit succeeds.

---

## Task 10: Continuous Integration

**Files:**
- Create: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: the repo-wide gates from Task 8.
- Produces: a PR-triggered pipeline that installs, lints, typechecks, and tests — the merge gate for every later phase.

- [ ] **Step 1: Create the CI workflow**

`.github/workflows/ci.yml`:
```yaml
name: ci
on:
  pull_request:
  push:
    branches: [main]

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4   # reads the pinned version from package.json "packageManager"
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test
      - run: pnpm build
```

- [ ] **Step 2: Verify the workflow file is valid and the gates pass locally (CI parity)**

Run:
```bash
pnpm install --frozen-lockfile
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```
Expected: all succeed (this is exactly what CI will run).

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add lint/typecheck/test/build workflow"
```

---

## Phase 0 Definition of Done

- `pnpm install` succeeds from a clean checkout; `pnpm lint && pnpm typecheck && pnpm test && pnpm build` all pass.
- `apps/web` builds to a standalone output and serves `GET /api/health` → `{ ok: true, sha }`.
- `apps/worker start` boots and logs readiness.
- A bad env value or a non-conventional commit message fails loudly.
- The CI workflow runs the same gates on every PR.
- The workspace graph (`apps/web`, `apps/worker`, `@wedevs/{config,shared,ui,ai,db,integrations}`) is complete and typechecks.

Next plan: **Phase 1 — Design System & Adaptive Canvas Shell** (port the mockup tokens + shell components), authored in this same format once Phase 0 is green.
