# Phases 11–14 — Testing, Hardening, Deployment, Launch

Ship Wedevs to production: Docker Compose on your VPS, managed Supabase, CI/CD, TLS, desktop distribution, security hardening, and a launch checklist.

---

## Phase 11 — Testing strategy

**Goal:** Confidence to ship and to change code without regressions.

**Layers**
1. **Unit (Vitest):** `packages/ai` (registry, cost calc, tool contracts), `packages/db` (query helpers), pure utils. Mock providers with the AI SDK's mock model.
2. **Component (Testing Library):** shell interactions — selector switching, composer send/attach, inspector float↔pin, command palette, settings toggles, inline rename.
3. **Integration (route handlers):** run against a **local Supabase** (`supabase start`) — auth guard, chat streaming (assert `usage_events` written), plugins enable/disable, code propose→PR (Octokit mocked), Stripe webhook (signed test events).
4. **RLS tests:** create two users; assert user B cannot read/write user A's chats, messages, attachments, integrations. This is a **required** gate.
5. **E2E (Playwright):** sign in → new chat → stream a reply (provider mocked) → attach an image → enable a plugin → open a repo → propose+accept a diff (GitHub mocked) → upgrade (Stripe test) → toggle theme. Run headless in CI on the built app.
6. **Coverage / CI gates:** block merge on lint, typecheck, unit+component, integration, RLS, and a smoke E2E. Nightly full E2E.

**Acceptance:** all layers green in CI; RLS tests pass; a smoke E2E runs on every PR.

---

## Phase 12 — Security & observability hardening

**Goal:** Production-safe before exposing to the internet.

**Checklist**
- **Secrets:** never in the client bundle. AI keys, GitHub App key, Stripe secret live only in `web`/`worker` env. Plugin/integration tokens encrypted in **Supabase Vault**. Rotate on exposure.
- **AuthZ:** every route handler and server action calls `requireUser()`; RLS is the second line of defense. Verify Supabase JWT server-side.
- **Webhooks:** verify signatures for **Stripe** and **GitHub** before processing; reject on mismatch; dedupe by event id.
- **Rate limiting:** Redis sliding-window on `/api/chat`, `/api/code/*`, auth endpoints. Per-user and per-IP.
- **Input validation:** Zod on every request body; cap message length, attachment size/count, and diff size.
- **Headers/CSP:** strict `Content-Security-Policy`, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, frame-ancestors deny. Mirror the CSP in the Tauri config.
- **Storage:** private buckets; access only via short-lived signed URLs; validate MIME/size on upload.
- **CORS:** lock API routes to your own origins (web + `wedevs://` desktop).
- **PII/data:** honor the "improve the model" and history toggles; implement account/data deletion (Phase 9) fully.
- **Dependency hygiene:** `pnpm audit` in CI; Dependabot; pin base images by digest.
- **Observability:** Sentry (web + worker + desktop) with release tagging + source maps; pino JSON logs; Uptime monitor (Uptime Kuma or a hosted pinger) on `/api/health`; PostHog product analytics; alert on error-rate spikes and failed webhooks.
- **Backups/DR:** rely on Supabase automated backups; additionally schedule a nightly `pg_dump` to off-box storage; test a restore before launch.

**Acceptance:** a security review of the checklist passes; a forged webhook is rejected; rate limits trip under load; `/api/health` is monitored; a restore from backup succeeds in a drill.

---

## Phase 13 — Deployment (Docker on VPS + managed Supabase)

**Goal:** Reproducible production deploy with automatic TLS and CI/CD.

### 13.1 Provision
1. VPS (Ubuntu LTS, ≥ 4 vCPU / 8 GB) with your domain's DNS pointing at it: `A app.wedevs.cloud`, `A www`, `A ollama` (if self-hosting local models).
2. Install Docker Engine + Compose plugin. Create a non-root deploy user; enable UFW (allow 22, 80, 443 only); enable unattended security upgrades.
3. Create the managed **Supabase** project; run Drizzle migrations against it; apply RLS policies; seed system agents/plugins.

### 13.2 Compose stack (`docker/docker-compose.yml`)

```yaml
services:
  caddy:
    image: caddy:2
    restart: unless-stopped
    ports: ["80:80", "443:443"]
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
    depends_on: [web]

  web:
    image: ghcr.io/OWNER/wedevs-web:${TAG:-latest}
    restart: unless-stopped
    env_file: [./.env.production]
    expose: ["3000"]
    depends_on: [redis]
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 5s
      retries: 3

  worker:
    image: ghcr.io/OWNER/wedevs-worker:${TAG:-latest}
    restart: unless-stopped
    env_file: [./.env.production]
    depends_on: [redis]

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    command: ["redis-server", "--appendonly", "yes"]
    volumes: [redis_data:/data]

  # Optional: self-hosted local model provider
  ollama:
    image: ollama/ollama:latest
    restart: unless-stopped
    volumes: [ollama_data:/root/.ollama]
    expose: ["11434"]

volumes: { caddy_data: {}, caddy_config: {}, redis_data: {}, ollama_data: {} }
```

`docker/Caddyfile`:

```
app.wedevs.cloud {
    encode zstd gzip
    reverse_proxy web:3000
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        X-Content-Type-Options "nosniff"
        Referrer-Policy "strict-origin-when-cross-origin"
    }
}
www.wedevs.cloud { redir https://app.wedevs.cloud{uri} }
```

Caddy obtains and renews Let's Encrypt certs automatically. Supabase (Postgres/Auth/Realtime/Storage) is **not** in this stack — it's managed.

### 13.3 Dockerfiles
- `docker/web.Dockerfile`: multi-stage — `pnpm install --frozen-lockfile` → `turbo run build --filter=web` → Next.js **standalone** output → slim runtime image (Node 22 alpine), non-root user, `EXPOSE 3000`.
- `docker/worker.Dockerfile`: build `--filter=worker` → run the BullMQ consumer.
- Add `/api/health` in the web app returning 200 with build SHA.

### 13.4 CI/CD (`.github/workflows/deploy.yml`)
On push to `main` (after CI passes):
1. Build & push `web` and `worker` images to GHCR, tagged with the commit SHA and `latest`.
2. Run Drizzle migrations against production Supabase (a guarded migrate job).
3. SSH to the VPS: `docker compose pull && docker compose up -d` with `TAG=<sha>`; wait for the `web` healthcheck; roll back to the previous tag on failure.
4. Notify (Slack/Discord) with the deployed SHA.

Desktop artifacts are built and released by the separate tag-triggered `desktop.yml` (see `02-desktop-tauri.md`).

### 13.5 Environment
Put production env in `/opt/wedevs/.env.production` on the VPS (root-owned, `600`), populated from your secret manager — never commit it. It contains the full var set from `04-reference.md` with production values (Supabase prod, live Stripe keys, GitHub App prod, real provider keys, `NEXT_PUBLIC_APP_URL=https://app.wedevs.cloud`).

**Acceptance:** pushing to `main` builds images, migrates the DB, deploys to the VPS, and the app is live over HTTPS with a valid cert; a failed deploy rolls back; health checks pass.

---

## Phase 14 — Launch checklist & ops

**Pre-launch**
- [ ] DNS + TLS valid (A+ on SSL Labs); HSTS preloaded.
- [ ] All env vars present in prod; a missing var fails the build (verified).
- [ ] Supabase RLS on every table; RLS tests green against prod schema.
- [ ] Stripe switched to **live** keys + live webhook; a real upgrade+cancel tested.
- [ ] GitHub App in prod; install→propose→PR tested on a real repo.
- [ ] AI providers reachable from prod; a chat streams; `usage_events` + cost recorded; quotas enforced.
- [ ] Rate limits + input caps active; forged Stripe/GitHub webhooks rejected.
- [ ] Sentry receiving errors (web/worker/desktop) with source maps; PostHog receiving events.
- [ ] Uptime monitor on `/api/health`; alerting wired.
- [ ] Backups running + a restore drill completed.
- [ ] Desktop: signed/notarized builds install cleanly; auto-update verified end-to-end.
- [ ] Legal: Terms, Privacy, and a data-deletion path live.
- [ ] Lighthouse ≥ 90 on the chat route; axe clean.

**Day-1 ops**
- Watch Sentry error rate, `/api/chat` latency/error, provider spend (per-model cost from `usage_events`), and Stripe events.
- Have a rollback command ready (`docker compose up -d` with the previous `TAG`).
- Runbooks: provider outage (fail over model/provider), Supabase incident, webhook backlog (BullMQ retry), cert renewal failure (Caddy logs).

**Scaling later (when needed)**
- Multiple `web` replicas behind Caddy; separate the `worker` onto its own box; managed Redis; read replicas / connection pooling (Supavisor) for Postgres; CDN in front of static assets; move heavy plugins to dedicated workers.

**Rough monthly cost (starting scale):** VPS ~$40–80; Supabase Pro ~$25; Redis (in-Docker) $0; Sentry/PostHog/Resend free-to-low tiers; **AI provider spend is usage-based** and typically the largest variable — the `usage_events` table lets you attribute and cap it per user (see `04-reference.md`).

---

**Done.** With Phases 0–14 complete you have a production web + desktop app, deployed on your own VPS with managed Supabase, multi-provider AI, GitHub-connected code edits, billing, and auto-updating desktop builds. Reference material (env, schema, API, tree, costs) is in **[04-reference.md](04-reference.md)**.
