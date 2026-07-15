# Wedevs — Agent Constitution

Read this fully. It is short on purpose. Everything else you read is routed from here.

**Product:** Wedevs — a prosumer AI chat + code workspace (web + desktop).
**Live:** http://187.127.178.219 · **Repo:** `rajin10/wedevs` (private)

---

## Orientation — do this before anything else

1. **`docs/PROGRESS.md`** — the execution record. What is actually built, and why the build deviated from the plan. Read this before believing any plan doc.
2. **`git log --oneline -20`** — what happened most recently. Always true; costs nothing.
3. **`docs/superpowers/plans/`** — the plan for the current phase.
4. Open **only** the 2–3 files those routed you to.

**Do not crawl the repo.** If the files above did not route you, they are wrong — fix them, then continue.

**After a compaction:** trust `docs/PROGRESS.md` + `git log` over your own memory. Your memory of this session is gone; those are not.

> **Known gap:** `.superpowers/sdd/progress.md` is the richest task ledger (per-task checkboxes with commit SHAs) but it is **not committed** — it exists only on the machine that produced it. If you are on that machine, read it; it is the best state you have. If it is absent, it is not lost — it was never here. Do not go looking for it, and do not treat its absence as a bug.

---

## Where things live

| Path | What |
|---|---|
| `apps/web` | Next.js 15 + React 19 + Tailwind v4 — the product |
| `apps/worker` | background worker |
| `packages/ui` | design system. `packages/ui/src/types.ts` is the **single source** for shared types |
| `packages/config` | shared eslint/ts/tailwind config |
| `packages/db` · `packages/ai` · `packages/integrations` · `packages/shared` | as named |
| `supabase/` | auth + DB. Currently **demo-session mode** — flips to real Supabase when credentials exist |
| `docker/` · `apps/web/Dockerfile` | the deploy artifact |
| `.github/workflows/ci.yml` | lint · typecheck · test · build |
| `.github/workflows/deploy.yml` | GHCR image → VPS over SSH. Gated by repo variable `DEPLOY_ENABLED` |
| `mockup/` · `prototype/` | design ground-truth. When prose and mockup disagree, **the mockup wins** |

---

## The flow

```
feature branch → develop → main → auto-deploy to http://187.127.178.219
```

- Work happens on a branch off `develop`.
- **Never push directly to `main`.** Merging to `main` deploys to production.
- Every task ends in its own commit. Conventional commits — `commitlint` enforces it.

## Phases

Work is executed **task-by-task**: a fresh implementer builds one task, an independent reviewer checks it against its spec *and* for quality, findings are fixed, then it is marked done.

Phase 0 (Foundations), Phase 1 (Design system & shell), Phase 2 (Auth) — **complete**.
Current phase and task status: `.superpowers/sdd/progress.md`.

---

## Definition of done

A task is **not** done until all four gates pass from the repo root:

```
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

Run **`pnpm typecheck` unfiltered**, not just on the package you touched. Cross-package type breakage is invisible to a filtered run — this has bitten us before.

Then:

- **Verify the claim against the codebase before reporting work done.** Do not report a task complete because you believe you finished it. Check.
- Code and docs must both be updated and consistent. A stale doc is worse than no doc — it makes the next agent confidently wrong.
- **No placeholders.** No `TODO`, no `throw new Error("not implemented")`, no hardcoded mock returns standing in for real logic. If it isn't finished, it isn't a task that's done.

## Honest claims

Say what actually happened. If tests fail, say so and show the output. If you skipped a step, say so. Never report success you have not observed. "It should work" is not a result.

---

## Hard rules

**Never touch these paths.** They are other people's repositories, present on this machine, and are reference-only:

```
D:\magic\Talash
D:\www\Talash
C:\Users\Fahad\Documents\Projects\Talash
D:\magic\my
```

Reading them is denied in `.claude/settings.json`. Do not work around it.

**Never edit the gates to make yourself green.** `.github/workflows/`, `eslint.config.js`, `commitlint.config.js`, `.lintstagedrc.json`, `.claude/settings.json` are denied. If a gate is genuinely wrong, say so and let a human change it. An agent that can silence its own alarm has no alarm.

**Never `git push --force`.** Never push to `main`.

---

## Permissions

`.claude/settings.json` pre-authorizes commands so you do not prompt for routine work. This is deliberate: **approval happens once, at the plan gate — not 400 times at the tool gate.**

The deny list above is not negotiable and not a suggestion. It is the reason the allow list can be as wide as it is.

---

## Decisions

Architectural decisions live in `docs/decisions/NNNN-slug.md`, append-only.

**Before deciding anything architectural, grep `docs/decisions/` — it may already be settled.** If you make a new architectural decision, write one. If you reverse an old one, write a *new* ADR marking the old one superseded — **never edit a decided ADR.** They are history, not documentation.
