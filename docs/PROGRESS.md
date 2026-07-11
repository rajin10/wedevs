# Wedevs — Build Progress Report

**Product:** Wedevs — a prosumer AI chat + code workspace (web + desktop).
**This document:** a living, plain-language log of _what has actually been built_, _why each piece is necessary_, and _how the build deviated from the original plan_. It is the counterpart to the numbered docs (which describe the plan); this describes reality.
**Last updated:** 2026-07-12.
**Current state:** **Phase 0 (Foundations) — COMPLETE (10/10 tasks) and merge-approved.** All quality gates green; final whole-branch review passed with zero blocking issues. Next step is the GitHub repo + deployment setup (§7).

> How to read this: the numbered docs (`README.md`, `01`–`04`) are the _plan_. This file is the _execution record_. When the two disagree, this file explains why — every deviation was deliberate and reviewed.

---

## 1. Executive summary

We are building the monorepo foundation that every later phase sits on. Work is being executed **task-by-task**: for each task a fresh implementer builds it, an independent reviewer checks it against its spec _and_ for code quality, findings are fixed, and only then is it marked done. Every task ends in its own git commit.

As of now:

- **14 commits** on branch `phase-0-foundations` (all 10 tasks + fixes + this report).
- **10 of 10 Phase-0 tasks** committed and reviewed. **Final whole-branch review: ✅ ready to merge** (0 Critical, 0 Important).
- **All four repo-wide quality gates pass:** `lint`, `typecheck`, `test`, `build` — verified under a clean `--frozen-lockfile` install (CI parity).
- **6 automated tests** passing across 2 suites.
- **0 unresolved review findings.** Every Critical/Important finding was fixed before acceptance; the only remaining items are three Minor refinements explicitly deferred to Phase 1.

What this gives us: a typed, linted, tested pnpm + Turborepo workspace with a runnable Next.js 15 web app (with a health endpoint and a validated environment module) and a runnable background worker — the skeleton the actual product features get built into from Phase 1 onward.

---

## 2. Environment reality (and why it differs from the plan)

The plan (`README.md` §5) was written against Node 22 / pnpm 9. The build machine has newer tools, so the pins were **reconciled** before any code was written — this was a deliberate, one-time decision:

| Tool     | Plan said      | Actually used          | Why it's fine                                                                                                                         |
| -------- | -------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Node     | 22 LTS         | **v24.15.0**           | The workspace declares `engines.node >=22`; Node 24 satisfies it. `.nvmrc` stays `22` as the advisory floor.                          |
| pnpm     | 9.12.0         | **11.10.0**            | Root `package.json` `packageManager` was set to `pnpm@11.10.0` to match the machine; `engines.pnpm >=9` still holds.                  |
| CI pnpm  | pinned version | reads `packageManager` | The CI setup step was changed to take **no** version input, so it always uses the version the repo declares (single source of truth). |
| Git / OS | —              | git 2.47, Windows 10   | All commands are written to run in both PowerShell and Git Bash.                                                                      |

**Why this matters:** pinning to versions that don't exist on the machine would break `pnpm install` on step one. Reconciling once, up front, kept every later task deterministic.

---

## 3. What exists now (repository map)

Everything below is committed on `phase-0-foundations`:

```
wedevs/
├─ package.json            # workspace root: dev/build/lint/typecheck/test/format scripts
├─ pnpm-workspace.yaml     # workspaces: apps/*, packages/*  (+ approved native builds)
├─ turbo.json             # the 4 pipeline tasks + dev
├─ tsconfig.json          # root TS config (editor DX)
├─ eslint.config.js       # root ESLint config (used by lint-staged)
├─ commitlint.config.js · .lintstagedrc.json
├─ .husky/                # pre-commit (lint-staged) + commit-msg (commitlint) hooks
├─ .github/workflows/     # ci.yml — lint/typecheck/test/build on every PR
├─ .gitignore .npmrc .nvmrc
├─ apps/
│  ├─ web/                # Next.js 15 + React 19 + Tailwind v4 app
│  │  ├─ src/app/         # layout, page, globals.css
│  │  ├─ src/app/api/health/route.ts   # GET /api/health → { ok, sha }
│  │  ├─ src/env.ts       # validated, typed environment module
│  │  └─ (next/eslint/postcss/vitest configs)
│  └─ worker/             # Node background worker (tsx) — boots + self-checks
├─ packages/
│  ├─ config/             # shared tsconfig/eslint/prettier/tailwind presets (@wedevs/config)
│  ├─ shared/             # @wedevs/shared — formatBytes() + the Vitest harness pattern
│  ├─ ui/  ├─ ai/  ├─ db/  ├─ integrations/   # typed, lintable placeholder libraries
├─ docs/                  # the plan + this report
├─ mockup/                # the visual source of truth (unchanged)
└─ prototype/             # earlier clickable prototype (unchanged)
```

**Not yet created** (later phases): real feature code in `ui/ai/db/integrations`, the Tauri `apps/desktop/`, and the `docker/` deploy files (Dockerfile, `docker-compose.yml`, Caddyfile) — the deploy pipeline is set up in the GitHub phase (§7–§8).

---

## 4. Task-by-task log (Phase 0)

Each entry: **what** was built · **why** it's necessary · **how it changed** vs. the plan · **verification**.

### Genesis — `3a0a374`

The existing `docs/`, `mockup/`, and `prototype/` folders were committed as the repository's first commit so all later work builds on a clean, known base. These three folders are left untouched by every task.

### Task 1 — Monorepo skeleton · `5bf3bcf`

- **What:** root `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `.gitignore`, `.npmrc`, `.nvmrc`, and the `apps/`+`packages/` folders.
- **Why:** this defines the workspace and the six script names (`dev/build/lint/typecheck/test/format`) that _every_ later package and the CI pipeline call. Without it there is no monorepo.
- **How it changed:** the `prepare: "husky"` script hard-failed `pnpm install` because husky isn't installed until Task 9. Changed to `prepare: "husky || true"` (a documented contingency) so install succeeds now and still works once husky exists.
- **Verification:** `pnpm install` succeeds; `pnpm turbo --version` → 2.10.4. Review: **Approved**.

### Task 2 — Shared config presets (`@wedevs/config`) · `ecc8724`

- **What:** shared `tsconfig.base.json`, ESLint flat-config preset, Prettier config, and a Tailwind preset stub.
- **Why:** one source of truth for TypeScript strictness and lint rules. Every other package extends these instead of redefining them, so standards can't drift package-to-package.
- **How it changed:** none functionally. (The Tailwind preset references `tailwindcss` types but doesn't depend on the package yet — intentional; that file isn't type-checked in Phase 0 and Phase 1 wires Tailwind fully.)
- **Verification:** package resolves and imports cleanly. Review: **Approved**.

### Task 3 — Shared utilities + test harness (`@wedevs/shared`) · `e503bfd`

- **What:** the `@wedevs/shared` package exporting `formatBytes(bytes)`, plus the **Vitest** test setup that every other package copies.
- **Why:** proves the whole toolchain end-to-end — a real function, a real test, real lint + typecheck — and establishes the testing pattern. `formatBytes` will be used by the attachment UI later.
- **How it changed:** written **test-first (TDD)** — the test was watched failing, then made to pass. pnpm 11 gates native build scripts for security; `esbuild` (pulled in by Vitest) was explicitly approved in `pnpm-workspace.yaml` (`allowBuilds`). This is necessary — Vitest can't run without it — and safe (esbuild is a standard, trusted tool).
- **Verification:** 5/5 tests pass; the reviewer hand-traced all five cases to confirm the tests assert real behavior. Review: **Approved**.

### Task 4 — Library skeletons (`ui`, `ai`, `db`, `integrations`) · `755c41e`

- **What:** four empty-but-valid packages, each typed and lintable, each exporting a placeholder constant.
- **Why:** completes the workspace dependency graph so `lint`/`typecheck` run across _everything_ from now on. Real code arrives in later phases; these reserve the structure.
- **How it changed:** none — a clean, repeated template.
- **Verification:** all four typecheck + lint exit 0; reviewer confirmed each package's name/const is distinct (no copy-paste errors) and configs are byte-identical. Review: **Approved**.

### Task 5 — Next.js 15 web app · `a1336b9`, fixes `2dce8a9` + `de7cc09`

- **What:** the `apps/web` Next.js 15 / React 19 / Tailwind v4 app: layout, home page, global styles, and `GET /api/health` returning `{ ok: true, sha }` (used by the production deploy health-check later).
- **Why:** this is the actual application shell every UI feature is built into, and the health route is how the load balancer/monitoring will know the app is alive.
- **How it changed (three things):**
  1. **More native builds approved** — `sharp` and `unrs-resolver` (both standard parts of the Next/ESLint toolchain) were added to `allowBuilds`, same rationale as esbuild.
  2. **ESLint fix (`2dce8a9`)** — Next.js auto-generates `next-env.d.ts`, which the shared lint preset rejected. The web app's ESLint config now ignores just that one generated file. This was necessary because a later task requires `lint` to pass across the whole repo.
  3. **Git hygiene fix (`de7cc09`)** — a build-cache file (`tsconfig.tsbuildinfo`) and `next-env.d.ts` had been committed; both are machine-generated and now correctly git-ignored, so future commits stay clean.
- **Verification:** `next build` produces a standalone output with no type errors; the health route returns `{"ok":true,"sha":"dev"}`; `lint` exits 0. Review: **Approved** (the one Important finding — the committed build artifacts — was fixed in `de7cc09`).

### Task 6 — Validated environment module · `7a6ed05`

- **What:** `apps/web/src/env.ts` — a typed, schema-validated config object (via `@t3-oss/env-nextjs` + Zod), plus `.env.example`. The health route was switched to read from it.
- **Why:** this is a **security and correctness boundary**. The project rule is _never read `process.env` directly in app code_. This module is the single validated gateway: missing/malformed config fails fast and loudly, and secrets never leak to the browser. Every later phase (Supabase, AI keys, Stripe) plugs its variables in here.
- **How it changed:** written test-first. It _closed_ the temporary shortcut from Task 5 — the health route now reads `env.GIT_SHA` instead of raw `process.env`.
- **Verification:** a repo-wide search confirmed `process.env` appears **only** inside the module's validated boundary; `.env.example` contains no real secrets; typecheck + build pass. Review: **Approved**.

### Task 7 — Background worker · `92d1545`

- **What:** `apps/worker` — a runnable Node service (run via `tsx`) that boots, imports from `@wedevs/shared`, logs readiness, and exits.
- **Why:** reserves the async-jobs service that will run PR creation, exports, and embeddings (via BullMQ) in later phases. Proves a non-Next service can consume workspace packages.
- **How it changed:** none.
- **Verification:** prints `wedevs worker ready (self-check: 1.2 MB)`; typecheck + lint exit 0. Review: **Approved**.

### Task 8 — Wire the repo-wide gates · `3ed8295`

- **What:** a root `tsconfig.json` (editor convenience) and confirmation that all four gates run correctly across the whole monorepo.
- **Why:** this is the **integration checkpoint** — the point where every package must lint, typecheck, test, and build _together_. These are exactly the checks CI will enforce.
- **How it changed:** the plan hinted `turbo.json` might need editing; it didn't — the config from Task 1 already covered all four tasks, so nothing was invented. (One cosmetic warning from Vitest about the root config's `extends` path; exit codes are all 0 — later resolved by Task 9.)
- **Verification:** `pnpm lint` (7 packages), `pnpm typecheck` (7), `pnpm test` (6 tests / 2 suites), `pnpm build` (web standalone) — **all exit 0**. Review: verified inline (trivial one-file diff; the real proof is the green gates).

### Task 9 — Git hooks (husky + lint-staged + commitlint) · `f54d1bb` + `4e06879`

- **What:** a **pre-commit** hook that auto-fixes staged files (ESLint + Prettier via lint-staged) and a **commit-msg** hook that enforces Conventional Commits (commitlint).
- **Why:** catches lint/format problems and non-standard commit messages _before_ they enter history — the same standards CI enforces, but locally and instantly.
- **How it changed (an important fix):** the plan's hook was broken for this monorepo — `lint-staged` runs from the repo root, but ESLint isn't installed there (pnpm keeps it per-package), so the hook would have failed with "eslint not found." The fix: add `eslint` + `@wedevs/config` to the root and a root `eslint.config.js` that re-exports the shared preset, so root-run linting works. This _also_ silenced the leftover Task 8 config-resolution warning. A follow-up commit set the root package to ESM (`"type": "module"`) to remove a Node warning on every commit.
- **Verification:** a deliberately bad commit message was **rejected**; a conventional one was **accepted** with the pre-commit hook running clean; `pnpm lint` still exits 0. Review: **Approved** (3 Minor, cosmetic).

### Task 10 — Continuous Integration · `2f6e986`

- **What:** `.github/workflows/ci.yml` — a GitHub Actions pipeline that, on every pull request and every push to `main`, installs with a frozen lockfile and runs all four gates.
- **Why:** this is the automated merge gate. No change reaches `main` without lint, typecheck, tests, and build passing in a clean cloud environment.
- **How it changed:** none — it runs exactly the gates Task 8 established.
- **Verification:** the workflow is valid YAML and was proven at "CI parity" — a clean `pnpm install --frozen-lockfile` followed by all four gates passed locally, exactly what CI will do. Review: verified inline.

### Final whole-branch review (independent, most-capable model)

After all 10 tasks, the **entire branch** was reviewed as one unit against the Phase 0 Definition of Done. Verdict: **✅ ready to merge** — 0 Critical, 0 Important. The reviewer confirmed every DoD bullet, the complete/consistent workspace graph, and the security posture (a repo-wide search found **no committed secrets**, and `process.env` appears **only** inside the validated env module). Three Minor refinements were logged for Phase 1: compose `eslint-config-next` into the web lint config; give `packages/config` its own lint/typecheck; and (informational) the safe typecheck-before-build ordering.

---

## 5. Cross-cutting decisions & deviations (the "how it changed" you should know about)

These are the judgment calls made during the build. Each was deliberate, reviewed, and recorded:

1. **Toolchain version reconciliation** (Node 24 / pnpm 11.10.0) — one-time, up front. See §2.
2. **Native build-script approvals** — pnpm 11 blocks packages from running install scripts unless you approve them (a supply-chain safety feature). We approved only well-known, trusted tools: `esbuild`, `sharp`, `unrs-resolver`. Anything unrecognized would have stopped the build for a human decision.
3. **`husky || true` bootstrap** — lets `pnpm install` succeed before git hooks are installed (Task 9); harmless once they are.
4. **Ignoring Next's generated `next-env.d.ts` in lint**, and **git-ignoring build artifacts** (`*.tsbuildinfo`, `next-env.d.ts`) — standard Next.js hygiene the base plan didn't anticipate; needed so `lint` passes repo-wide and commits stay clean.
5. **The env module as the only `process.env` boundary** — enforced and verified. This is the project's core secrets-handling discipline.

**Open Minor items** (deferred to the final review, none blocking): the cosmetic Vitest `extends` warning from Task 8; the `husky || true` could be simplified to `husky` once Task 9 lands; the Tailwind preset's type-only dependency gets wired in Phase 1.

---

## 6. Quality gates — current state

| Gate      | Command          | Runs across                                   | Result  |
| --------- | ---------------- | --------------------------------------------- | ------- |
| Lint      | `pnpm lint`      | shared, ui, ai, db, integrations, web, worker | ✅ pass |
| Typecheck | `pnpm typecheck` | same 7 packages                               | ✅ pass |
| Test      | `pnpm test`      | `@wedevs/shared` (5) + `web` (1) = 6 tests    | ✅ pass |
| Build     | `pnpm build`     | `web` → standalone output                     | ✅ pass |

Every one of these will be enforced automatically by CI (Task 10) on every push.

---

## 7. GitHub & deployment plan (decided; executes after Phase 0)

Decisions confirmed on 2026-07-12:

| Choice        | Decision                                                                         |
| ------------- | -------------------------------------------------------------------------------- |
| Repository    | **`wedevs`**, **private**, under GitHub account `rajin10`                        |
| Deploy target | **Self-hosted VPS via SSH** (Docker Compose), per `03-deployment.md`             |
| Sequencing    | **Finish Phase 0 first**, then push — so the first push is green and CI-complete |

**Planned steps (after Tasks 9–10):**

1. Create the private `wedevs` repo and push `main` + `phase-0-foundations`.
2. Add `develop` and `testing` branches and open PRs.
3. GitHub Actions: **CI** (lint/typecheck/test/build on every push) + a **deploy** workflow that SSHes into the VPS and runs Docker Compose on merge to `main`.
4. Hand over a **secrets checklist** (VPS host/user/SSH key, container registry) — the deploy job stays dormant until those secrets and the server exist.

> **Reality check:** no server is provisioned yet and no deploy secrets have been provided. The CI/CD _pipeline_ will be wired and ready, but "the live server auto-updates" only becomes true once the VPS and its secrets are in place.

---

## 8. GitHub & deployment — DONE (2026-07-12)

The repo and pipeline are live:

- **Repo:** private `github.com/rajin10/wedevs` (account `rajin10`).
- **Branches:** `main` (production, has all of Phase 0), plus `develop` and `testing` created off it for future work. Per the chosen flow, no PRs were opened yet — the next feature starts the PR flow.
- **CI:** `.github/workflows/ci.yml` runs on every PR and every push to `main`, and **passed green on the clean Ubuntu runner** (~1m42s) — confirming the `--frozen-lockfile` install + `allowBuilds` native builds work outside the dev machine.
- **Deploy:** `.github/workflows/deploy.yml` + `apps/web/Dockerfile` + `docker/` (compose + Caddyfile) build the web image in Actions, push to GHCR, and deploy to the VPS over SSH. It is **dormant** (gated on the `DEPLOY_ENABLED` repo variable) and currently **skips cleanly** on each push — no server or secrets are wired yet.
- **To go live:** follow [DEPLOYMENT-SETUP.md](DEPLOYMENT-SETUP.md) — provision a VPS, add five secrets + the `DEPLOY_ENABLED=true` variable, then a push to `main` deploys.

## 9. What's next

**Phase 1** — the design system + Adaptive Canvas shell — turning `mockup/index.html` into real components. It will be authored as its own plan and executed the same task-by-task way, and will get its own section here as it lands.
