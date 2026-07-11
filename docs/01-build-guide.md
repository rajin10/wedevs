# Wedevs Build Guide — Phases 0–9 (Web App)

Build the full web application, phase by phase. Each phase lists **goals → steps (point by point) → key code → acceptance criteria**. Do not start a phase until the previous one's acceptance criteria pass. Env vars referenced here are defined in [04-reference.md](04-reference.md); the database schema lives there too.

---

## Phase 0 — Foundations

**Goal:** A running monorepo with tooling, CI skeleton, and env plumbing.

**Steps**
1. `pnpm dlx create-turbo@latest wedevs` → choose the pnpm/Turborepo starter; delete the example apps.
2. Create the workspace layout from the README (`apps/web`, `apps/worker`, `packages/*`). Add `pnpm-workspace.yaml` globbing `apps/*` and `packages/*`.
3. Scaffold `apps/web` with `pnpm create next-app@latest` (App Router, TypeScript, Tailwind v4, ESLint, `src/` dir, import alias `@/*`).
4. Add shared presets in `packages/config`: `tsconfig.base.json` (`strict: true`), an ESLint flat config, a Tailwind preset holding the Wedevs tokens.
5. Add root scripts: `dev`, `build`, `lint`, `typecheck`, `test`, `format`. Wire them through `turbo.json` with proper `dependsOn`/`outputs`.
6. Add `.env.example` (copy the full table from `04-reference.md`) and load env via `@t3-oss/env-nextjs` + Zod so a missing/invalid var fails the build loudly. Never read `process.env` directly in app code.
7. Set up Git: `main` protected, Conventional Commits, Husky + lint-staged running `eslint --fix` + `prettier` on staged files.
8. Add `.github/workflows/ci.yml`: on PR, run `pnpm install --frozen-lockfile`, `lint`, `typecheck`, `test`. (Deploy is added in `03-deployment.md`.)

**Acceptance:** `pnpm dev` serves a blank Next.js page; `pnpm lint && pnpm typecheck && pnpm test` pass locally and in CI; a bad env value fails startup with a clear message.

---

## Phase 1 — Design system & Adaptive Canvas shell

**Goal:** Re-create the mockup as real, themeable, accessible components. This is the largest UI phase.

**Steps**
1. **Tokens:** port the mockup's CSS variables into the Tailwind v4 theme (`@theme`) as the single source of truth: `--bg/--surface/--surface-2/--sidebar/--elevated`, text `--text/--text-2/--text-3`, `--border/--border-2/--hover/--active`, `--primary/--primary-text`, the one **`--accent` (Volt)** token, `--success/--warning/--error`, radii, shadows. Define light as base, dark via `@media (prefers-color-scheme: dark)` **and** `:root[data-theme]`.
2. **Theme provider:** a Zustand slice + a `data-theme` attribute on `<html>`; persist to `localStorage`; expose Light/Dark/System. Add the smooth cross-fade transition from the mockup.
3. **Enforce the brand rule** in code review: Volt (`--accent`) is used **only** on "alive" things (streaming caret, live/presence dots, mascot eyes, logo dot, on-toggles, active nav in the mockup-dev bar). Hover/active/selected/primary buttons use neutral tokens.
4. **Install shadcn/ui**, then re-skin its primitives (button, input, dialog, dropdown-menu, popover, tabs, switch, tooltip, command) to the tokens. Keep Radix a11y intact.
5. **Fonts:** load Unbounded / Manrope / JetBrains Mono via `next/font/local` (self-hosted) to avoid external requests.
6. **Shell components** (from the mockup), each as its own file in `packages/ui`:
   - `AppShell` — the Adaptive Canvas: collapsible left rail (264px ↔ 60px icon rail ↔ mobile drawer), fluid main column (centered ~768px reading width), right `Inspector` that floats (overlay) or **pins** into a real third column; top bar spanning main + inspector.
   - `LeftRail` — brand/logo slot (swappable HD image), New chat, ⌘K search, primary nav (Chats / Code / Plugins), time-grouped recents with ⋯ menu (pin/rename/delete) + inline rename, projects, account chip + settings.
   - `TopBar` — model/agent selector button + popover (Models/Agents tabs, search, capability tags), inline-editable title, Share, Inspector pin/close toggle.
   - `Composer` — two-row: autogrow textarea on top; a toolbar with attach, tools toggle, agent pill (left) and voice mic + send + `⏎` hint (right); drag-drop drop-zone overlay; attachment tray.
   - `Inspector` — tabbed contextual surface (File preview / Plugin output / Model details / plugin Setup form).
   - `CommandPalette` — ⌘K, groups (Actions / Recent chats / Models).
   - `SettingsModal` — left sub-nav (Account, Appearance, Models, Plugins, Data & privacy, Shortcuts) with live theme preview.
   - `Toast` — bottom-center pill for action feedback.
   - Mascots (`Robo`, `Visor`, etc.) as animated SVG components with `prefers-reduced-motion` guards.
7. **Responsive:** implement the breakpoints (desktop ≥1280 all three regions; laptop 1024–1280 inspector overlay-only; tablet 768–1024 rail→drawer, inspector→sheet; mobile <768 single column, panels as full-screen sheets).
8. **Storybook (optional but recommended):** a story per component in both themes for visual review.

**Acceptance:** Every mockup screen (empty, chat, code, marketplace, settings, selector, inspector) renders from real components in both themes, responsive to mobile; `prefers-reduced-motion` disables animation; keyboard focus rings visible; Volt never appears on a non-alive element.

---

## Phase 2 — Auth & accounts

**Goal:** Real sign-in, protected routes, and a profile row per user.

**Steps**
1. Enable providers in Supabase: Email OTP, Google, GitHub. Configure redirect URLs for `localhost`, the prod domain, **and** the desktop deep-link scheme `wedevs://auth/callback` (Phase 10).
2. Use `@supabase/ssr` to create typed server and browser clients; wire `middleware.ts` to refresh the session cookie and gate `/app/*`.
3. Build `/login` and `/auth/callback` route handlers using the mockup's visual style.
4. On first sign-in, upsert a `profiles` row (id = `auth.users.id`, display name, avatar, `plan='free'`) via a Postgres trigger `on auth.users insert`.
5. Wire the account chip menu (Profile, Settings, Upgrade, Log out) and the settings **Account** pane to real data.
6. Add server helpers `getUser()` / `requireUser()` that read the verified JWT; every route handler and server action calls `requireUser()`.

**Acceptance:** A new user can sign in via all three methods; a `profiles` row is created; `/app` is unreachable when signed out (redirects to `/login`); signing out clears the session everywhere.

---

## Phase 3 — Data model & chat history

**Goal:** Persist chats, projects, and messages with RLS; wire the history UI.

**Steps**
1. In `packages/db`, define the Drizzle schema for `profiles, workspaces, projects, chats, messages, attachments, agents, plugins, plugin_installs, integrations, code_sessions, code_edits, usage_events, subscriptions` (full DDL in `04-reference.md`). Generate and apply migrations with `drizzle-kit`.
2. **Enable RLS on every table** and add policies keyed to `auth.uid()` (owner-only read/write). Add the exact policies from `04-reference.md`; write a test that a second user cannot read the first user's chats.
3. Seed the system `agents` (Writer/Coder/Analyst) and the `plugins` catalog (web search, code interpreter, GitHub, Notion, Slack, Gmail) as non-user rows.
4. CRUD via route handlers or server actions (all through `requireUser()` + Drizzle):
   - `chats`: create, list (time-grouped: Pinned/Today/Yesterday/Previous 7 days/Older), rename, delete, pin/unpin, move to project.
   - `projects`: create, rename, delete, list; assign chats.
   - `messages`: list by chat (paginated), append.
5. Fetch with **TanStack Query**; optimistic updates for rename/pin/delete/new-chat. Debounced client + server search over titles (Postgres `tsvector` or `ilike` for v1).
6. Wire the left rail and command palette to live data (replace the mockup's static rows).

**Acceptance:** Creating/renaming/deleting/pinning chats persists and survives reload; history groups correctly by date; search returns matches; RLS test confirms isolation.

---

## Phase 4 — AI layer (multi-provider) & selector

**Goal:** A provider-agnostic AI layer with streaming, tool support, agents, and a working model/agent selector. **Server-side only.**

**Steps**
1. In `packages/ai`, build the **provider registry** with the Vercel AI SDK. Use exact Claude model IDs; keep OpenAI/Ollama configurable.

   ```ts
   // packages/ai/registry.ts
   import { anthropic } from '@ai-sdk/anthropic'
   import { openai } from '@ai-sdk/openai'
   import { createOllama } from 'ollama-ai-provider'

   const ollama = createOllama({ baseURL: process.env.OLLAMA_BASE_URL }) // e.g. http://ollama:11434/api

   export type Capability = 'reasoning' | 'speed' | 'vision' | 'long-context' | 'tools' | 'private'

   export const MODELS = {
     'claude-opus-4-8':  { label: 'Claude Opus 4.8',  group: 'Frontier', provider: 'anthropic',
       model: () => anthropic('claude-opus-4-8'),
       caps: ['reasoning','vision','long-context','tools'] as Capability[],
       price: { in: 5,  out: 25 } },        // USD / 1M tokens
     'claude-sonnet-5':  { label: 'Claude Sonnet 5',  group: 'Fast', provider: 'anthropic',
       model: () => anthropic('claude-sonnet-5'),
       caps: ['speed','vision','tools'], price: { in: 3, out: 15 } },
     'claude-haiku-4-5': { label: 'Claude Haiku 4.5', group: 'Fast', provider: 'anthropic',
       model: () => anthropic('claude-haiku-4-5'),
       caps: ['speed','tools'], price: { in: 1, out: 5 } },
     'gpt-4o': { label: 'GPT-4o', group: 'Frontier', provider: 'openai',
       model: () => openai(process.env.OPENAI_MODEL_FRONTIER ?? 'gpt-4o'),
       caps: ['reasoning','vision','tools'], price: { in: 5, out: 15 } },
     'nova-local': { label: 'Local (Ollama)', group: 'Local', provider: 'ollama',
       model: () => ollama(process.env.OLLAMA_MODEL ?? 'qwen2.5-coder'),
       caps: ['private','tools'], price: { in: 0, out: 0 } },
   } as const
   export type ModelId = keyof typeof MODELS
   export const DEFAULT_MODEL: ModelId = 'claude-opus-4-8'
   ```

   > Anthropic model IDs are exact and must not carry date suffixes. Default to streaming for long input/output. For deep-reasoning turns on Claude, pass adaptive thinking via provider options (`providerOptions.anthropic.thinking = { type: 'adaptive' }`); do not set `budget_tokens` (rejected on current models).

2. **Streaming chat route** — `apps/web/app/api/chat/route.ts` (Edge or Node runtime):
   - `requireUser()`; validate body with Zod (`chatId`, `messages`, `modelId | agentId`, `enabledTools`).
   - Enforce **rate limit** (Redis sliding window) and **plan quota** (from `usage_events` vs plan cap); 429 with a friendly message when exceeded.
   - Resolve model from the agent (agent → model + system prompt + tools) or the explicit `modelId`.
   - Call `streamText({ model, system, messages, tools, onFinish })`; return `result.toDataStreamResponse()`.
   - In `onFinish`, persist the assistant message and write a `usage_events` row (provider, model, input/output tokens, computed `cost_cents` from `MODELS[id].price`).
3. **Client:** use the AI SDK `useChat` hook; render tokens with the gray shimmer reveal; show the presence/live dot and the animated agent avatar while streaming; stop/retry/edit controls.
4. **Selector:** the top-bar popover + composer agent pill switch model/agent; capability tags come from `MODELS[id].caps`; the "Agents" tab lists personas from the `agents` table with "＋ New agent".
5. **Usage/cost:** a small server util turns token counts into cents; surface remaining quota in Settings → Models.

**Acceptance:** A chat streams from Claude by default; switching to OpenAI or the local model works with no client change; agents apply their system prompt + tools; every completed turn writes a `usage_events` row with correct cost; exceeding the free quota returns a clear 429.

---

## Phase 5 — Full chat experience

**Goal:** Everything a message turn needs: attachments, tool-result cards, the Inspector, and message actions.

**Steps**
1. **Attachments:** drag-drop onto the composer → upload to a **private Supabase Storage** bucket via a signed upload URL from a route handler → create `attachments` rows → show thumbnails (images) / doc chips (name+size+progress). Pass image attachments to vision-capable models as image parts; pass documents as extracted text (or the file to the code-interpreter tool).
2. **Message rendering:** react-markdown + Shiki; copy buttons on code blocks; user messages as right-aligned bubbles, assistant full-width with the mascot avatar.
3. **Inline tool/plugin cards:** when the model calls a tool, render a result card with an "Open in panel →" action that populates the right Inspector (File preview / Plugin output / Model details tabs).
4. **Inspector modes:** implement float (overlay, Esc/click-away) and **pin** (real third column) exactly as the mockup; the main column recenters when pinned.
5. **Message actions:** copy, retry (re-run last turn), edit (edit a user message and re-generate downstream), 👍/👎 feedback (store in a lightweight `message_feedback` table or a `feedback` jsonb on `messages`).
6. **Voice input (secondary):** Web Speech API `SpeechRecognition` → transcribe into the composer; graceful fallback where unsupported.
7. **Share/export:** the Share modal — copy a share link (a read-only tokenized route), and export the chat as Markdown / PDF / JSON (PDF + large exports go through a **worker** job).

**Acceptance:** A user can attach an image and ask about it; tool results render as cards and open in the Inspector; the Inspector floats and pins; retry/edit regenerate correctly; a chat exports to Markdown and PDF; voice input fills the composer where supported.

---

## Phase 6 — Plugins / tools system

**Goal:** Browse, enable, and configure tools that the AI can call.

**Steps**
1. **Tool contract:** each plugin exports an AI SDK tool definition (`name`, `description` with clear "call this when…", Zod `parameters`, server-side `execute`). Register enabled tools into the `streamText({ tools })` call for a turn.
2. **Marketplace view:** the `Plugins` nav opens the main-panel grid from the mockup (icon, name, description, tags, enable toggle, Configure). Search + category filters + "Installed" filter. Data from the `plugins` catalog + the user's `plugin_installs`.
3. **Enable/disable:** toggling writes `plugin_installs` (owner_id, plugin_id, enabled).
4. **Configure panel:** clicking Configure opens the Inspector **Setup** tab (from the mockup): Connect account, API-key field (show/hide), permission toggles, Save. Store secrets **encrypted in Supabase Vault**, referenced by `plugin_installs.config`/secret pointer — never in plaintext columns.
5. **v1 built-in plugins:**
   - **Web Search** — server tool calling a search API; returns cited results.
   - **Code Interpreter** — for data/file analysis (can run in the worker with a constrained runtime; keep scope tight for v1).
   - **GitHub** — thin wrapper over the Phase 7 integration (browse/read) so chat can reference repos.
   - **Notion / Slack / Gmail** — OAuth-connected read/write via their APIs (stub the ones you won't finish in v1 but keep the configure flow real).
6. **Settings → Plugins** mirrors enable/disable and links to the marketplace.

**Acceptance:** Enabling Web Search makes the model produce cited answers via the tool; the Configure panel connects an account and persists an encrypted secret; disabling a plugin removes its tool from subsequent turns.

---

## Phase 7 — Code workspace (GitHub + AI edits)

**Goal:** Connect GitHub, browse a repo, let the AI propose diffs, and open commits/PRs on `main`. **No arbitrary execution.**

**Steps**
1. **Create a GitHub App** (not just OAuth) with permissions: Repository contents (read/write), Pull requests (read/write), Metadata (read). Subscribe to `push` and `pull_request` webhooks. Store App ID, private key (PEM), client ID/secret, webhook secret in env/Vault.
2. **Install flow:** the `Code` nav (or Settings → Integrations) launches the GitHub App install; the callback stores an `integrations` row (provider `github`, `installation_id`, account) per user, token encrypted in Vault.
3. **Repo browse:** `apps/web/app/api/code/*` route handlers use **Octokit** (authenticated as the installation) to list repos, list branches (default `main`), read the file tree, and read file contents. Render the Code view: repo header + branch chip + sync status, file tree with change markers, a Shiki-highlighted read-only editor, and a status footer.
4. **AI-proposed edits:** `POST /api/code/propose` — given a file (or task) + instruction, stream a unified **diff** from the model (system prompt constrains it to return a valid patch). Render it in the editor with the "Wedevs AI is editing…" banner + added/removed line gutters (from the mockup).
5. **Apply → PR:** on **Accept**, enqueue a BullMQ job. The **worker** (Octokit): creates a feature branch off `main`, applies the diff (create/update blobs → tree → commit), pushes, and opens a **PR** into `main`. Return the PR URL; toast "Pull request opened → #N".
6. **Commit button:** for direct commits to `main` (when the user chooses), the worker commits without a PR — gated behind a confirm.
7. **Webhooks:** `POST /api/webhooks/github` verifies the signature and updates `code_sessions`/`code_edits` (e.g., PR merged/closed) → Realtime updates the UI.
8. **Guardrails:** validate every file path server-side; cap diff size; never execute repo code; require the confirm modal before any write.

**Acceptance:** A user connects GitHub, opens a real repo on `main`, asks the AI to change a file, reviews the streamed diff, accepts, and a real PR appears on GitHub; webhook events update the UI; commit-to-main is gated by a confirm.

---

## Phase 8 — Billing & plan limits

**Goal:** Free/Pro plans via Stripe, enforced by the usage table.

**Steps**
1. Create Stripe products/prices (Free = no charge; Pro = e.g. $30/mo). Store price IDs in env.
2. **Checkout:** Settings → Account "Upgrade" → route handler creates a Stripe Checkout session (customer keyed to `profiles`), redirect; on return, verify via webhook.
3. **Webhooks:** `POST /api/webhooks/stripe` (verify signature) handles `checkout.session.completed`, `customer.subscription.updated/deleted`, `invoice.paid/payment_failed`; upsert `subscriptions` (customer id, sub id, plan, status, current_period_end) and set `profiles.plan`.
4. **Plan limits:** define caps (e.g. free: N messages/day, no local/frontier premium features; pro: higher). Enforce in the chat route (Phase 4) by summing `usage_events` for the period and comparing to the plan cap.
5. **Billing UI:** Settings → Account shows plan, renewal date, Manage (Stripe Billing Portal link), and usage-this-period.

**Acceptance:** A user upgrades via Stripe test mode → `subscriptions` + `profiles.plan` update via webhook → higher limits apply immediately; the portal link manages/cancels; a canceled sub reverts to free at period end.

---

## Phase 9 — Realtime, search, settings depth, polish

**Goal:** Cross-device sync, good search, complete settings, and production-grade a11y/perf.

**Steps**
1. **Realtime:** subscribe to Postgres changes (or broadcast) for `chats`/`messages` so a chat opened on two devices stays in sync; presence dot when streaming.
2. **Search:** upgrade to Postgres full-text (`tsvector` columns + GIN index) across chat titles and message content; optional `pgvector` semantic search over messages (embeddings generated by a worker job on message insert).
3. **Settings depth:** finish Appearance (theme + accent + density + reduce-motion), Models (default model + default params + stream toggle), Data & privacy (history toggle, improve-the-model toggle, export all data, delete account), Keyboard shortcuts.
4. **A11y:** audit with axe; every interactive element keyboard-reachable; ARIA on menus/dialogs/toasts; color contrast AA (already in tokens); focus management on modal open/close.
5. **Perf:** route-level code splitting; virtualize long message lists and the file tree; stream SSR where useful; image optimization; Lighthouse ≥ 90 on the chat route.
6. **Observability:** wire Sentry (web + worker) and PostHog events (sign-in, new chat, message sent, model switched, plugin enabled, PR opened, upgrade).

**Acceptance:** A chat updates live across two browsers; full-text (and optionally semantic) search returns relevant results; all settings persist and take effect; axe reports no serious issues; Lighthouse ≥ 90; events show up in PostHog and errors in Sentry.

---

Web app complete. Continue to **[02-desktop-tauri.md](02-desktop-tauri.md)** for the desktop app, then **[03-deployment.md](03-deployment.md)** to ship.
