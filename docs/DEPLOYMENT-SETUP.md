# Wedevs — Deployment Operations

**Status:** the CI/CD pipeline is **live**. Every push/merge to `main` builds the
web image in GitHub Actions, pushes it to GHCR, and deploys it to the VPS over
SSH. The VPS currently serves on its **bare IP over HTTP** — swap in a domain to
get automatic HTTPS (one `.env` change, no rebuild — see "Switching to a domain").
**Last updated:** 2026-07-12.

---

## Live target

| Thing        | Value                                                              |
| ------------ | ------------------------------------------------------------------ |
| URL          | `http://187.127.178.219`                                           |
| Health check | `http://187.127.178.219/api/health` → `{ "ok": true, "sha": "…" }` |
| Server       | Ubuntu 24.04 VPS (`srv1796377`), 2 vCPU / 8 GB / 96 GB             |
| App dir      | `/opt/wedevs` (compose stack: `web` behind `caddy`)                |
| Image        | `ghcr.io/rajin10/wedevs-web:latest` (private)                      |

> The VPS also runs an unrelated `factory-gateway` container (a WhatsApp AI
> gateway) on port 4000. Wedevs is fully isolated from it — its own dir, its own
> ports (80/443). Nothing here touches that container.

## How a deploy flows

Push/merge to `main` → CI gates (`lint / typecheck / test / build`) → the deploy
job builds `ghcr.io/rajin10/wedevs-web:latest` + a `:<sha>` tag → copies
`docker-compose.yml` to `/opt/wedevs` → SSHes in, logs into GHCR with the
workflow's own `GITHUB_TOKEN`, `docker compose pull && up -d` → Caddy (in
`reverse-proxy` mode, configured by `SITE_ADDRESS`) serves the new version. The
server's `/opt/wedevs/.env` is never overwritten, so server-specific settings
persist across deploys.

You can also run it on demand: **Actions → deploy → Run workflow**, or
`gh workflow run deploy.yml --ref main`.

---

## What is configured (already done)

| Item                           | Value / location                                                                           |
| ------------------------------ | ------------------------------------------------------------------------------------------ |
| Repo secret `VPS_HOST`         | `187.127.178.219`                                                                          |
| Repo secret `VPS_USER`         | `root`                                                                                     |
| Repo secret `VPS_APP_DIR`      | `/opt/wedevs`                                                                              |
| Repo secret `VPS_SSH_KEY`      | ed25519 private deploy key (`wedevs-deploy`)                                               |
| Repo variable `DEPLOY_ENABLED` | `true` (the on-switch)                                                                     |
| Server `/opt/wedevs/.env`      | `SITE_ADDRESS=:80`, `APP_URL=http://187.127.178.219`, `GHCR_OWNER=rajin10`, `GIT_SHA=prod` |

**No GHCR PAT is needed.** The VPS pulls the private image using the deploy
workflow's built-in `GITHUB_TOKEN`, forwarded to the SSH step for the duration
of the run — no long-lived registry token to store or rotate.

---

## Switching to a domain (HTTPS)

When a real domain is ready:

1. Point the domain's **DNS A record** at `187.127.178.219`.
2. On the server, edit `/opt/wedevs/.env`:
   ```
   SITE_ADDRESS=app.yourdomain.com
   APP_URL=https://app.yourdomain.com
   ```
3. `cd /opt/wedevs && docker compose up -d` (or just re-run the deploy).

Caddy then obtains a Let's Encrypt certificate automatically and serves HTTPS.
No image rebuild — the site address is read from env at container start.

---

## Notes & guardrails

- Serving on a **bare IP must be HTTP**: Let's Encrypt cannot issue a certificate
  for an IP address, so `SITE_ADDRESS=:80` (plain HTTP) is correct until a domain
  is attached. The env-driven `reverse-proxy` flips to HTTPS the moment `SITE_ADDRESS`
  becomes a hostname.
- No secrets live in the repo — the web app reads config through its validated
  env module; all deploy credentials live in GitHub Secrets / the server `.env`.
- Worker + Redis services are intentionally not in `docker-compose.yml` yet; they
  arrive with the async-jobs work in Phase 5/7.
- The full background/rationale for this topology is in [03-deployment.md](03-deployment.md).
