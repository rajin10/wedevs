# syntax=docker/dockerfile:1
# Multi-stage build for the Next.js 15 web app (standalone output) in a pnpm monorepo.
# Built in CI and pushed to GHCR; run on the VPS via docker/docker-compose.yml.

# ---- Base: Node + pnpm via corepack ----
FROM node:22-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
WORKDIR /app

# ---- Builder: install the whole workspace and build the web app ----
FROM base AS builder
# The .dockerignore keeps node_modules/.next/.git out, so this is source-only.
COPY . .
RUN pnpm install --frozen-lockfile
ARG GIT_SHA=dev
ENV GIT_SHA=$GIT_SHA
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter web build

# ---- Runner: copy only the standalone output ----
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
# Next standalone preserves the monorepo layout: server entry is at apps/web/server.js
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
