# Wedevs — Deployment Activation Checklist

**Status:** the CI/CD pipeline is committed and wired, but the deploy job is **dormant** — it is skipped on every push until you complete the steps below. Nothing deploys to a live server yet because no server/secrets are configured. This is by design.
**Last updated:** 2026-07-12.

---

## What is already set up (in the repo)

| File                           | Role                                                                                                                                                                    |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.github/workflows/ci.yml`     | **CI** — runs `lint / typecheck / test / build` on every PR and every push to `main`. Active now.                                                                       |
| `.github/workflows/deploy.yml` | **Deploy** — builds the web image in GitHub Actions, pushes it to GHCR, then SSHes into your VPS and runs `docker compose up`. **Dormant** until you enable it (below). |
| `apps/web/Dockerfile`          | Multi-stage build of the Next.js standalone image (built in CI).                                                                                                        |
| `docker/docker-compose.yml`    | Production stack: `web` behind `caddy` (automatic HTTPS). Worker + Redis join in Phase 5/7.                                                                             |
| `docker/Caddyfile`             | Reverse proxy + Let's Encrypt TLS for your domain.                                                                                                                      |
| `docker/.env.example`          | Template for the `.env` you place on the VPS (domain + GHCR owner; no secrets).                                                                                         |

**How a deploy will flow once enabled:** push/merge to `main` → CI gates run → the deploy job builds `ghcr.io/rajin10/wedevs-web:latest` → copies the compose files to the VPS → `docker compose pull && up -d` → Caddy serves the new version over HTTPS. Health is verifiable at `https://<your-domain>/api/health` → `{ "ok": true, "sha": "<commit>" }`.

---

## To go live — one-time setup

### 1. Provision a VPS

- A server (≥ 2 vCPU / 4 GB to start) with **Docker + Docker Compose v2** installed.
- Create an app directory, e.g. `/opt/wedevs`.
- Point a **domain's DNS** (A/AAAA record) at the server's IP.

### 2. Put the deploy env on the VPS

In the app directory (e.g. `/opt/wedevs`), create a `.env` from `docker/.env.example`:

```
DOMAIN=app.yourdomain.com
GHCR_OWNER=rajin10
GIT_SHA=prod
```

### 3. Create an SSH key for the deploy

On your machine: `ssh-keygen -t ed25519 -C "wedevs-deploy" -f wedevs_deploy` (no passphrase). Add the **public** key (`wedevs_deploy.pub`) to the VPS user's `~/.ssh/authorized_keys`. The **private** key goes into the `VPS_SSH_KEY` secret below.

### 4. Create a GHCR pull token

GitHub → Settings → Developer settings → **Personal access token** (classic) with scope **`read:packages`**. The VPS uses it to pull the private image. (Alternatively, make the GHCR package public and skip `GHCR_PAT`.)

### 5. Add the GitHub secrets and variable

Repo → **Settings → Secrets and variables → Actions**.

**Secrets** (Secrets tab):

| Secret        | Value                                               |
| ------------- | --------------------------------------------------- |
| `VPS_HOST`    | Server IP or hostname                               |
| `VPS_USER`    | SSH username (e.g. `deploy` or `root`)              |
| `VPS_SSH_KEY` | The **private** SSH key from step 3 (full contents) |
| `VPS_APP_DIR` | App directory on the server, e.g. `/opt/wedevs`     |
| `GHCR_PAT`    | The `read:packages` token from step 4               |

**Variable** (Variables tab) — this is the on-switch:

| Variable         | Value  |
| ---------------- | ------ |
| `DEPLOY_ENABLED` | `true` |

> `GITHUB_TOKEN` (used to **push** the image in CI) is provided automatically — you do not create it.

### 6. First deploy

Push (or merge) to `main`, or run the **deploy** workflow manually (Actions → deploy → _Run workflow_). Watch the run; then check `https://app.yourdomain.com/api/health`.

---

## Notes & guardrails

- Until `DEPLOY_ENABLED=true`, the deploy job **skips** cleanly on every push — no red failures.
- The image is private on GHCR; the VPS authenticates with `GHCR_PAT`.
- No secrets ever live in the repo — the web app reads config through its validated env module, and all deploy credentials live in GitHub Secrets / the VPS `.env`.
- Worker + Redis services are intentionally not in `docker-compose.yml` yet; they arrive with the async-jobs work in Phase 5/7.
- The full background/rationale for this topology is in [03-deployment.md](03-deployment.md).
