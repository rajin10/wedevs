# Wedevs — Complete Build & Deployment Documentation

**Product:** Wedevs — a prosumer AI chat + code workspace (web + desktop).
**Status:** Design complete (see `mockup/index.html`); this is the production build guide.
**Audience:** The engineer(s) building it. Every phase is step-by-step and self-contained.
**Last updated:** 2026-07-11.

---

## 0. How to use these docs

Read in this order. Each document is a phase gate — finish one before starting the next.

| Doc                                            | What it covers                                                                                                                               |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **README.md** (this file)                      | Product scope, architecture, tech stack, locked decisions, prerequisites, timeline                                                           |
| **[01-build-guide.md](01-build-guide.md)**     | Phases 0–9: repo → design system → auth → data → AI → chat → plugins → **Code workspace** → billing → polish                                 |
| **[02-desktop-tauri.md](02-desktop-tauri.md)** | Phase 10: the Tauri v2 desktop app (native shell, auto-update, deep links)                                                                   |
| **[03-deployment.md](03-deployment.md)**       | Phases 11–14: Docker on VPS, managed Supabase, CI/CD, TLS, desktop distribution, security, launch                                            |
| **[04-reference.md](04-reference.md)**         | Env-var table, full Postgres schema + RLS, API contracts, repo tree, cost model                                                              |
| **[PROGRESS.md](PROGRESS.md)**                 | **Live build report** — what's actually been built so far, why each piece matters, and every deviation from the plan (updated as work lands) |
| **[DEPLOYMENT-SETUP.md](DEPLOYMENT-SETUP.md)** | **Deploy activation checklist** — the committed CI/CD pipeline and the exact secrets/steps to make the VPS auto-deploy go live               |

The **mockup** at `mockup/index.html` is the visual source of truth. The web UI must match it: Adaptive Canvas shell (collapsible left rail, centered chat, right Inspector that floats or pins), model/agent selector, plugin marketplace, Code workspace, Settings, both themes, and the "neutral = interactive · Volt = alive" rule.

---

## 1. What we are building

Wedevs is a single product with two surfaces (web + desktop) built from one codebase.

### Feature inventory (v1)

1. **Streaming chat** — multi-turn conversations with token-by-token streaming and a gray "shimmer" reveal.
2. **Multi-provider models** — Claude, OpenAI, and local (Ollama), selectable per chat, with capability tags.
3. **Agents** — saved personas (model + system prompt + enabled tools), e.g. Writer / Coder / Analyst.
4. **File & image attachments** — drag-and-drop upload, thumbnails/previews, stored in object storage.
5. **Plugins / tools** — a marketplace to browse/enable/configure tools (web search, code interpreter, GitHub, Notion, …); results render as inline cards; details open in the right Inspector.
6. **Code workspace** — connect GitHub, browse a repo, let the AI propose diffs, and open **commits/PRs** on the `main` branch (no arbitrary code execution in v1).
7. **Chat history** — searchable, time-grouped, with pin / rename / delete; projects/folders.
8. **Command palette** — ⌘K to jump to chats, models, plugins, actions.
9. **Settings** — account, appearance (light/dark/system), model defaults, plugins, data & privacy, shortcuts.
10. **Billing** — Free and Pro plans via Stripe (usage-metered).
11. **Desktop app** — the same UI in a native Tauri window with auto-update and deep links.

### Non-goals for v1 (explicitly deferred)

- Arbitrary code execution / sandboxes in the Code workspace (GitHub + AI-proposed edits only).
- Team/multi-seat workspaces (schema is team-ready, but UI ships single-user).
- Mobile apps (the web app is responsive; native mobile is later).
- Voice output / real-time audio (voice **input** via Web Speech API is in scope, secondary).

---

## 2. The four locked decisions

Confirmed with the product owner on 2026-07-11:

| Decision                 | Choice                                       | Consequence                                                                                                            |
| ------------------------ | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Desktop framework**    | **Tauri v2**                                 | ~10 MB binary, Rust core, secure by default; wraps the same Next.js UI. See `02-desktop-tauri.md`.                     |
| **Code workspace depth** | **GitHub + AI-proposed edits**               | Connect via a GitHub App, read repo, stream proposed diffs, open commits/PRs via the GitHub API. No sandbox/execution. |
| **AI provider strategy** | **Multi-provider from day one**              | Claude (default) + OpenAI + local Ollama, behind the Vercel AI SDK. Server holds the keys and meters usage.            |
| **Deploy target**        | **Self-host on your VPS + managed Supabase** | Docker Compose on your server (web, worker, redis, caddy); Supabase Cloud for Postgres/Auth/Realtime/Storage.          |

---

## 3. Tech stack (pinned)

Pin these in `package.json` / `Cargo.toml`. Versions reflect current stable releases as of July 2026; bump only deliberately.

### Frontend / app

| Concern          | Choice                                                     | Notes                                                           |
| ---------------- | ---------------------------------------------------------- | --------------------------------------------------------------- |
| Framework        | **Next.js 15** (App Router) + **React 19**                 | SSR + route handlers act as the API layer                       |
| Language         | **TypeScript 5.6+** (`strict: true`)                       |                                                                 |
| Styling          | **Tailwind CSS v4** + **shadcn/ui** (Radix primitives)     | Re-themed to the Wedevs tokens; port the mockup's CSS variables |
| Animation        | **Framer Motion** (`motion`)                               | Streaming shimmer, mascot bob/blink, panel transitions          |
| Client state     | **Zustand** (UI) + **TanStack Query v5** (server state)    | Query for chats/messages; Zustand for panel/composer UI         |
| Forms/validation | **React Hook Form** + **Zod**                              | Zod schemas shared client↔server                                |
| Markdown/code    | **react-markdown** + **Shiki**                             | Message rendering + syntax highlighting                         |
| Fonts            | Unbounded (display) · Manrope (UI) · JetBrains Mono (code) | Self-host via `next/font`                                       |

### AI layer

| Concern       | Choice                                                      | Notes                                                                                       |
| ------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Abstraction   | **Vercel AI SDK v4** (`ai`)                                 | Provider-agnostic `streamText` / `generateText` + tool calling                              |
| Providers     | `@ai-sdk/anthropic`, `@ai-sdk/openai`, `ollama-ai-provider` | Claude is the default; see `01-build-guide.md` Phase 4 for the exact model registry and IDs |
| Default model | **Claude Opus 4.8** (`claude-opus-4-8`)                     | Frontier tier. Others: `claude-sonnet-5`, `claude-haiku-4-5`                                |

> **Model IDs are exact.** Anthropic: `claude-opus-4-8` ($5/$25 per 1M in/out), `claude-sonnet-5` ($3/$15), `claude-haiku-4-5` ($1/$5). Never append date suffixes to these aliases. OpenAI and Ollama model IDs are configured via env (examples in Phase 4). Default to streaming for anything with long input/output.

### Backend / data / infra

| Concern             | Choice                                                                      | Notes                                                                    |
| ------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Database            | **Supabase Postgres 15** (managed cloud)                                    | RLS on every table; `pgvector` for semantic search (optional)            |
| ORM / migrations    | **Drizzle ORM** + `drizzle-kit`                                             | Typed schema + SQL migrations; Supabase client for Auth/Realtime/Storage |
| Auth                | **Supabase Auth**                                                           | Email OTP + Google/GitHub OAuth; JWT verified server-side                |
| Realtime            | **Supabase Realtime**                                                       | Synced chat history, presence                                            |
| Storage             | **Supabase Storage**                                                        | Attachments (private buckets, signed URLs)                               |
| Secrets             | **Supabase Vault**                                                          | Encrypt plugin/integration tokens at rest                                |
| Queue / cache       | **Redis 7** + **BullMQ**                                                    | Async jobs: PR creation, exports, embeddings; rate limiting              |
| Worker              | Node.js service                                                             | Consumes BullMQ jobs (runs in Docker alongside web)                      |
| Billing             | **Stripe** (Checkout + Billing + webhooks)                                  | Free/Pro; usage metering table drives limits                             |
| Integrations        | **GitHub App** + **Octokit**                                                | Repo read + commit/PR write                                              |
| Reverse proxy / TLS | **Caddy 2**                                                                 | Automatic HTTPS (Let's Encrypt)                                          |
| Containers          | **Docker + Docker Compose**                                                 | On your VPS                                                              |
| Desktop             | **Tauri v2** (Rust)                                                         | Wraps the web build; auto-update via GitHub Releases                     |
| CI/CD               | **GitHub Actions**                                                          | Lint/typecheck/test → build image → deploy over SSH; Tauri build matrix  |
| Errors              | **Sentry**                                                                  | Web + worker + desktop                                                   |
| Logs                | **pino** (JSON) → file/stdout, shipped by the platform                      |                                                                          |
| Product analytics   | **PostHog** (cloud or self-host)                                            |                                                                          |
| Transactional email | **Resend**                                                                  | Product emails; auth emails handled by Supabase                          |
| Testing             | **Vitest** (unit) · **Playwright** (E2E) · **Testing Library** (components) |                                                                          |
| Tooling             | **pnpm** workspaces + **Turborepo** · **ESLint** + **Prettier**             | Monorepo                                                                 |

---

## 4. System architecture

### Monorepo layout (Turborepo + pnpm)

```
wedevs/
├─ apps/
│  ├─ web/            # Next.js 15 app (UI + route-handler API)
│  ├─ worker/         # Node BullMQ worker (async jobs)
│  └─ desktop/        # Tauri v2 shell (Rust + config; loads the web build)
├─ packages/
│  ├─ ui/             # shadcn components, Wedevs theme tokens, mascots
│  ├─ ai/             # provider registry, streaming, tools, usage metering
│  ├─ db/             # Drizzle schema, migrations, typed query helpers
│  ├─ integrations/   # GitHub App client, plugin runtimes
│  ├─ config/         # shared eslint/tsconfig/tailwind presets
│  └─ shared/         # Zod schemas, types, constants shared client↔server
├─ docker/            # Dockerfiles, docker-compose.yml, Caddyfile
├─ .github/workflows/ # CI/CD
└─ docs/              # these documents
```

### Runtime topology (production)

```
                         ┌─────────────── Supabase Cloud ───────────────┐
                         │  Postgres · Auth · Realtime · Storage · Vault │
                         └───────────────▲───────────────▲──────────────┘
                                         │               │
   Browser / Tauri ──HTTPS──►  Caddy  ──►│  web (Next.js) │◄── Redis (cache, rate limit)
                                         │   route handlers│
                                         │        │        │
   GitHub / Stripe ──webhooks──►  Caddy ─┘        │ enqueue │
                                                  ▼        │
                                            Redis (BullMQ) ─► worker (Node)
                                                              ├─ GitHub App (commits/PRs)
                                                              ├─ exports (md/pdf/json)
                                                              └─ embeddings
   AI providers  ◄── server-side only ── web/worker ── Claude · OpenAI · Ollama
```

Everything in the middle column runs as Docker containers on **your VPS**. Supabase is managed. AI provider keys live only in `web`/`worker` env — never shipped to the client.

### Core data flows

- **Chat streaming:** client `POST /api/chat` → route handler authorizes (Supabase JWT) → checks Redis rate limit + plan quota → `streamText()` with the selected provider/model + enabled tools → SSE stream to client (rendered with shimmer) → on finish, persist the assistant message + `usage_events`; Realtime syncs other tabs/devices.
- **Code edits:** client opens a repo (GitHub App installation) → `POST /api/code/propose` streams an AI-generated diff → user accepts → enqueue a BullMQ job → worker uses Octokit to create a branch, commit, and open a PR → toast + Inspector update via Realtime.
- **Plugins/tools:** enabled plugins register AI SDK `tools`; execution runs server-side in the route handler (or worker for long jobs); results become inline cards and Inspector content. Plugin secrets are stored encrypted in Supabase Vault.

---

## 5. Prerequisites & accounts

Create these before Phase 0. Store every secret in a password manager; they map 1:1 to the env table in `04-reference.md`.

**Local toolchain**

- Node.js 22 LTS, pnpm 9, Git, Docker Desktop.
- Rust stable + Tauri v2 prerequisites (`cargo`, platform build tools) — needed from Phase 10; see `02-desktop-tauri.md`.

**Accounts / keys**

- **Supabase** project (region near your VPS) → URL, `anon` key, `service_role` key, DB connection string.
- **Anthropic** API key (`ANTHROPIC_API_KEY`).
- **OpenAI** API key (`OPENAI_API_KEY`).
- **Ollama** — a reachable Ollama host (self-hosted container or a dev machine) for local models (optional at first).
- **GitHub App** (created in Phase 7) → App ID, private key, client ID/secret, webhook secret.
- **Stripe** account → secret key, publishable key, webhook signing secret, price IDs (Phase 8).
- **Sentry**, **PostHog**, **Resend** projects → DSN / keys.
- A **VPS** (≥ 4 vCPU / 8 GB RAM to start) with a domain and DNS you control.

---

## 6. Phased timeline

Rough effort for one experienced full-stack engineer. Phases are ordered so each builds on a working previous state.

| Phase | Deliverable                                                         | Est.   |
| ----- | ------------------------------------------------------------------- | ------ |
| 0     | Monorepo, tooling, CI skeleton, env plumbing                        | 2–3 d  |
| 1     | Design system + Adaptive Canvas shell (mockup → components)         | 5–7 d  |
| 2     | Supabase auth + account menu + protected routes                     | 2–3 d  |
| 3     | Data model (Drizzle), chats/projects/messages CRUD, history UI      | 4–5 d  |
| 4     | Multi-provider AI layer + streaming + agents/model selector         | 5–7 d  |
| 5     | Full chat experience (composer, attachments, tool cards, Inspector) | 5–7 d  |
| 6     | Plugin/tool system + marketplace + configure panel                  | 4–6 d  |
| 7     | **Code workspace** (GitHub App, repo browse, AI diffs, PRs)         | 7–10 d |
| 8     | Billing (Stripe) + plan limits + usage metering                     | 3–4 d  |
| 9     | Realtime sync, search, settings depth, a11y/perf polish             | 4–6 d  |
| 10    | Tauri desktop app + auto-update                                     | 4–6 d  |
| 11–14 | Testing, hardening, deploy, launch                                  | 6–9 d  |

**Total ≈ 10–14 weeks** for a polished v1 solo; less with a small team splitting frontend/backend.

---

## 7. Definition of done (v1)

- All 11 features work end-to-end against real Supabase, Stripe (test mode → live), and GitHub.
- The web UI matches the mockup in both themes and is responsive to mobile.
- RLS blocks cross-user data access (verified by tests).
- CI is green (lint, typecheck, unit, E2E) and deploys on merge to `main`.
- The desktop app installs, auto-updates, and signs in via deep link.
- Errors report to Sentry; usage and cost are visible per user.
- The launch checklist in `03-deployment.md` is fully checked.

Proceed to **[01-build-guide.md](01-build-guide.md)**.
