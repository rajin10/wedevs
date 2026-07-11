# Reference — Env, Schema, APIs, Tree, Costs

Concrete reference for the whole build. Nothing here is a placeholder — values are real examples with instructions on where each secret comes from.

---

## 1. Environment variables

Group by surface. `NEXT_PUBLIC_*` are exposed to the browser (safe); everything else is **server-only** and must never reach the client bundle or the Tauri shell. Validate all of these with Zod at startup (Phase 0).

### Web app (`apps/web`)

| Var | Example / source | Notes |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | `https://app.wedevs.cloud` | Public base URL |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://abcd1234.supabase.co` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOi…` | Public anon key (RLS-guarded) |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOi…` | **Server-only.** Bypasses RLS — worker/admin ops only |
| `DATABASE_URL` | `postgresql://postgres:PW@db.abcd1234.supabase.co:5432/postgres` | Drizzle migrations/queries |
| `ANTHROPIC_API_KEY` | `sk-ant-…` | console.anthropic.com |
| `OPENAI_API_KEY` | `sk-…` | platform.openai.com |
| `OPENAI_MODEL_FRONTIER` | `gpt-4o` | Configurable OpenAI model id |
| `OLLAMA_BASE_URL` | `http://ollama:11434/api` | Compose service or a reachable host |
| `OLLAMA_MODEL` | `qwen2.5-coder` | Default local model |
| `REDIS_URL` | `redis://redis:6379` | Rate limit + cache |
| `GITHUB_APP_ID` | `1234567` | GitHub App settings |
| `GITHUB_APP_PRIVATE_KEY` | `-----BEGIN RSA PRIVATE KEY-----…` | PEM (base64 or literal); store in Vault/secret manager |
| `GITHUB_APP_CLIENT_ID` | `Iv1.abc123…` | OAuth for install flow |
| `GITHUB_APP_CLIENT_SECRET` | `…` | |
| `GITHUB_WEBHOOK_SECRET` | random 32+ chars | Verify webhook signatures |
| `STRIPE_SECRET_KEY` | `sk_live_…` (test: `sk_test_…`) | Stripe → Developers → API keys |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_…` | Client checkout |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` | From the webhook endpoint |
| `STRIPE_PRICE_PRO` | `price_…` | Pro plan price id |
| `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` | `https://…@sentry.io/…` | Server + client DSNs |
| `NEXT_PUBLIC_POSTHOG_KEY` | `phc_…` | Product analytics |
| `NEXT_PUBLIC_POSTHOG_HOST` | `https://us.i.posthog.com` | |
| `RESEND_API_KEY` | `re_…` | Transactional email |

### Worker (`apps/worker`)
Needs: `DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `REDIS_URL`, `ANTHROPIC_API_KEY`/`OPENAI_API_KEY`/`OLLAMA_*` (for embeddings/summaries), all `GITHUB_APP_*` (commits/PRs), `SENTRY_DSN`, `RESEND_API_KEY`.

### Desktop (`apps/desktop`)
No secrets. Only `wedevs://` scheme config and the **updater public key** (in `tauri.conf.json`). Signing keys live in CI secrets, not env.

---

## 2. Database schema (Postgres / Supabase)

Authoritative DDL. Model it in Drizzle; the generated SQL should match this. **RLS is enabled on every table** and policies are keyed to `auth.uid()`. `workspace_id` is included for future teams but v1 sets it to the user's personal workspace.

```sql
-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists vector;      -- optional: semantic search

-- profiles (1:1 with auth.users)
create table profiles (
  id           uuid primary key references auth.users on delete cascade,
  display_name text,
  avatar_url   text,
  plan         text not null default 'free' check (plan in ('free','pro')),
  settings     jsonb not null default '{}',
  created_at   timestamptz not null default now()
);

-- auto-create a profile on signup
create function handle_new_user() returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'avatar_url');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

create table workspaces (
  id         uuid primary key default uuid_generate_v4(),
  owner_id   uuid not null references profiles on delete cascade,
  name       text not null default 'Personal',
  plan       text not null default 'free',
  created_at timestamptz not null default now()
);

create table projects (
  id         uuid primary key default uuid_generate_v4(),
  owner_id   uuid not null references profiles on delete cascade,
  name       text not null,
  created_at timestamptz not null default now()
);

create table agents (
  id            uuid primary key default uuid_generate_v4(),
  owner_id      uuid references profiles on delete cascade,  -- null = system agent
  name          text not null,
  description   text,
  model_id      text not null,            -- key into the AI registry
  system_prompt text,
  tools         jsonb not null default '[]',
  avatar        text,                     -- mascot key
  is_system     boolean not null default false,
  created_at    timestamptz not null default now()
);

create table chats (
  id         uuid primary key default uuid_generate_v4(),
  owner_id   uuid not null references profiles on delete cascade,
  project_id uuid references projects on delete set null,
  title      text not null default 'New chat',
  agent_id   uuid references agents on delete set null,
  model_id   text not null,
  pinned     boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on chats (owner_id, updated_at desc);

create table messages (
  id           uuid primary key default uuid_generate_v4(),
  chat_id      uuid not null references chats on delete cascade,
  owner_id     uuid not null references profiles on delete cascade,
  role         text not null check (role in ('user','assistant','system','tool')),
  content      jsonb not null,            -- parts: text/image/tool_call/tool_result
  attachments  jsonb not null default '[]',
  feedback     smallint,                  -- -1 / null / 1
  input_tokens int, output_tokens int,
  created_at   timestamptz not null default now()
);
create index on messages (chat_id, created_at);

create table attachments (
  id           uuid primary key default uuid_generate_v4(),
  owner_id     uuid not null references profiles on delete cascade,
  chat_id      uuid references chats on delete cascade,
  kind         text not null,             -- image | doc
  name         text not null, size_bytes bigint, mime text,
  storage_path text not null,             -- private bucket key
  created_at   timestamptz not null default now()
);

create table plugins (                     -- catalog (system-owned, no RLS write)
  id          uuid primary key default uuid_generate_v4(),
  slug        text unique not null,
  name        text not null, description text,
  category    text, publisher text, verified boolean default false,
  config_schema jsonb not null default '{}'
);

create table plugin_installs (
  id          uuid primary key default uuid_generate_v4(),
  owner_id    uuid not null references profiles on delete cascade,
  plugin_id   uuid not null references plugins on delete cascade,
  enabled     boolean not null default true,
  config      jsonb not null default '{}', -- non-secret config; secrets -> Vault
  secret_ref  text,                        -- pointer to Supabase Vault secret
  created_at  timestamptz not null default now(),
  unique (owner_id, plugin_id)
);

create table integrations (                -- e.g. GitHub App installs
  id             uuid primary key default uuid_generate_v4(),
  owner_id       uuid not null references profiles on delete cascade,
  provider       text not null,            -- 'github'
  external_account text,
  installation_id text,
  token_ref      text,                     -- Vault pointer (encrypted)
  scopes         text[],
  created_at     timestamptz not null default now()
);

create table code_sessions (
  id           uuid primary key default uuid_generate_v4(),
  owner_id     uuid not null references profiles on delete cascade,
  repo_full_name text not null,
  branch       text not null default 'main',
  chat_id      uuid references chats on delete set null,
  created_at   timestamptz not null default now()
);

create table code_edits (
  id          uuid primary key default uuid_generate_v4(),
  session_id  uuid not null references code_sessions on delete cascade,
  owner_id    uuid not null references profiles on delete cascade,
  file_path   text not null,
  status      text not null default 'proposed' check (status in ('proposed','committed','pr_open','merged','closed')),
  diff        text,
  pr_url      text,
  created_at  timestamptz not null default now()
);

create table usage_events (
  id            uuid primary key default uuid_generate_v4(),
  owner_id      uuid not null references profiles on delete cascade,
  kind          text not null,             -- 'chat' | 'embedding' | 'export'
  provider      text, model text,
  input_tokens  int default 0, output_tokens int default 0,
  cost_cents    int default 0,
  created_at    timestamptz not null default now()
);
create index on usage_events (owner_id, created_at);

create table subscriptions (
  id                 uuid primary key default uuid_generate_v4(),
  owner_id           uuid not null references profiles on delete cascade unique,
  stripe_customer_id text, stripe_sub_id text,
  plan               text not null default 'free',
  status             text, current_period_end timestamptz
);
```

### RLS policies (apply to every owner-scoped table)

```sql
alter table chats enable row level security;
create policy "owner_rw_chats" on chats
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
-- repeat the identical pattern for: profiles(id=auth.uid()), projects, agents(owner-or-system read),
-- messages, attachments, plugin_installs, integrations, code_sessions, code_edits,
-- usage_events (read own; insert via service role), subscriptions (read own).

-- system rows readable by all authenticated users:
alter table agents  enable row level security;
create policy "read_system_agents" on agents for select using (is_system or owner_id = auth.uid());
create policy "owner_write_agents" on agents for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

alter table plugins enable row level security;
create policy "read_plugins" on plugins for select using (true);   -- catalog is public-read
```

> `usage_events`, `subscriptions`, and `integrations.token_ref` writes happen with the **service role** in the worker/route handlers, so users can't forge cost/plan/secret rows. Reads stay owner-scoped.

---

## 3. API contracts (route handlers)

All under `apps/web/app/api/*`. Every handler calls `requireUser()` first. Bodies validated with Zod.

| Method & path | Body / query | Returns |
|---|---|---|
| `POST /api/chat` | `{ chatId, messages, modelId?|agentId?, enabledTools? }` | **SSE stream** (AI SDK data stream). On finish: persists assistant message + `usage_events` |
| `GET /api/chats` | `?group=1` | Time-grouped chat list |
| `POST /api/chats` | `{ title?, projectId?, agentId?, modelId? }` | New chat |
| `PATCH /api/chats/:id` | `{ title? | pinned? | projectId? }` | Updated chat |
| `DELETE /api/chats/:id` | — | `204` |
| `GET /api/chats/:id/messages` | `?cursor=` | Paginated messages |
| `POST /api/projects` · `PATCH/DELETE /api/projects/:id` | `{ name }` | Project CRUD |
| `POST /api/attachments/sign` | `{ name, mime, size }` | Signed upload URL + `attachmentId` |
| `GET /api/plugins` | `?q=&category=&installed=` | Marketplace list (catalog + install state) |
| `POST /api/plugins/:id/toggle` | `{ enabled }` | Install state |
| `POST /api/plugins/:id/config` | `{ config, secret? }` | Saves config; secret → Vault |
| `GET /api/code/repos` | — | Installed-repo list (Octokit) |
| `GET /api/code/tree` | `?repo=&branch=main&path=` | File tree / contents |
| `POST /api/code/propose` | `{ repo, path, instruction }` | **SSE stream** of a unified diff |
| `POST /api/code/apply` | `{ sessionId, path, diff, mode: 'pr'\|'commit' }` | Enqueues worker job → `{ jobId }` |
| `POST /api/billing/checkout` | `{ priceId }` | Stripe Checkout URL |
| `POST /api/billing/portal` | — | Stripe Billing Portal URL |
| `POST /api/webhooks/stripe` | Stripe event (signed) | `200` after upsert `subscriptions`/`profiles.plan` |
| `POST /api/webhooks/github` | GitHub event (signed) | `200` after updating `code_edits` |
| `GET /api/health` | — | `{ ok: true, sha }` |
| `GET /api/share/:token` | — | Read-only shared chat |

Worker jobs (BullMQ queues): `code.apply` (branch→commit→PR), `export.chat` (md/pdf/json), `embed.message` (pgvector), `email.send`.

---

## 4. Repository tree (target)

```
wedevs/
├─ apps/
│  ├─ web/
│  │  ├─ app/
│  │  │  ├─ (marketing)/            # landing, pricing, legal
│  │  │  ├─ login/  auth/callback/
│  │  │  ├─ app/                    # authed shell: chat, code, plugins, settings
│  │  │  └─ api/                    # route handlers (see §3)
│  │  ├─ middleware.ts              # Supabase session + route guard
│  │  └─ next.config.ts             # output: 'standalone'
│  ├─ worker/                       # BullMQ consumers
│  └─ desktop/
│     └─ src-tauri/ (tauri.conf.json, capabilities/, icons/)
├─ packages/
│  ├─ ui/         # shell components, theme tokens, mascots, shadcn re-skin
│  ├─ ai/         # registry.ts, tools/, usage.ts, streaming helpers
│  ├─ db/         # schema.ts, migrations/, queries/
│  ├─ integrations/  # github/ (App client), plugins/
│  ├─ shared/     # zod schemas, types, constants
│  └─ config/     # tsconfig/eslint/tailwind presets
├─ docker/        # web.Dockerfile, worker.Dockerfile, docker-compose.yml, Caddyfile
├─ .github/workflows/  # ci.yml, deploy.yml, desktop.yml
├─ docs/          # these documents
├─ turbo.json  pnpm-workspace.yaml  package.json
```

---

## 5. Cost model & quotas

**Infra (starting scale, monthly):** VPS $40–80 · Supabase Pro ~$25 · Sentry/PostHog/Resend free→low tiers · Redis $0 (in-Docker). ~**$70–110/mo fixed**.

**AI spend (variable, the big one):** billed per token by provider. Reference prices (USD / 1M tokens, in/out):

| Model | In | Out |
|---|---|---|
| `claude-opus-4-8` | $5 | $25 |
| `claude-sonnet-5` | $3 | $15 |
| `claude-haiku-4-5` | $1 | $5 |
| `gpt-4o` | ~$5 | ~$15 |
| Local (Ollama) | $0 | $0 (your compute) |

`packages/ai/usage.ts` computes `cost_cents = round((inTok/1e6*price.in + outTok/1e6*price.out) * 100)` per turn and writes `usage_events`. This drives:
- **Per-user quotas:** e.g. Free = capped daily message/token budget on cheaper models; Pro = higher caps + frontier models. Enforced in `/api/chat` by summing `usage_events` for the period.
- **Cost dashboards:** sum `usage_events.cost_cents` grouped by user/model to watch spend and set alerts.

**Levers to control spend:** default new chats to a cheaper model where appropriate; route agents to the right tier; enable prompt caching for repeated system prompts; offer the local Ollama model for cost-sensitive/private use; cap `max_tokens` and stream.

---

This reference plus the four phase documents fully specify the Wedevs build from empty repo to deployed web + desktop product. Start at **[README.md](README.md)** → **[01-build-guide.md](01-build-guide.md)**.
