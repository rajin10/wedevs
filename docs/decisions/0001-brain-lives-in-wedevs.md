# 0001 — The agent brain lives in wedevs, not a separate core repo

- **Date:** 2026-07-15
- **Status:** accepted

## Context

We want a reusable "brain": persistent structure that lets an AI agent orient instantly, know what was decided and why, execute an approved plan without prompting for every tool call, and be blocked by gates from shipping anything unverified.

The first instinct was a dedicated core repo (`rajin10/Real-Life-Agent`) holding the brain, which every project would then pull from.

Two pieces of evidence killed that.

**1. Copies rot. This is observed, not theoretical.** In `hasib-devs/Talash` — a mature repo with a real agent setup — the multi-AI configuration is hand-duplicated rather than generated. It has already silently diverged: `.mcp.json` declares 6 MCP servers, `.codex/config.toml` declares 7. `chrome-devtools` exists only for Codex. No sync task exists anywhere in the repo, so nothing flags it. The same repo carries four byte-identical copies of a `deploy-check` skill that warns about a bug in `production.yml` — a file renamed to `ci.yml` long ago. The skill fabricates an outage and steers agents toward hand-rolled production deploys. Every one of these is a disease of the same bytes living in N places.

**2. We have one project, and it already has a repo.** wedevs exists, is deployed, and has three phases complete. A separate core repo would immediately create the propagation problem — brain in one repo, project in another — which is the exact problem the core repo was supposed to solve. It would be machinery built for a fleet we do not have.

## Decision

The brain lives in this repo. `AGENTS.md` (constitution), `CLAUDE.md` (pointer), `.claude/settings.json` (permissions), and `docs/decisions/` (this) are wedevs files, versioned with wedevs.

When project #2 exists, we decide then whether it becomes a workspace here or the brain gets extracted. That decision is cheap with a working brain in hand and expensive to guess now.

## Rejected

- **A separate core repo + versioned `@core/*` packages + a sync CLI (`core new`, `add-target`, `doctor`).** Estimated 3–5 weeks to a usable v1, plus permanent generator maintenance — a tools team of two people. Correct only when a project must be its own repo. None is planned. Building the sync machinery on speculation is the same mistake as scaffolding four platform targets into a project that uses one.
- **A GitHub template repo.** Templates deliberately share no git history, so improvements can never propagate to projects already created from them. Dead on arrival for our purpose.
- **Shipping the brain as a Claude Code plugin.** Structurally impossible for the part that matters: plugin-shipped agents cannot carry `hooks`, `mcpServers`, or `permissionMode` (an explicit security restriction), and a plugin-root `CLAUDE.md` is never loaded as project context. The headline requirement — pre-authorized permissions — cannot ship in a plugin. It must be a local file.
- **Mirroring into `.codex/` and `.agents/`.** `CLAUDE.md` containing only `@AGENTS.md` already serves Claude, Codex, and Cursor with zero duplication. Talash's mirrors are the thing that drifted. We add a mirror only when a second tool is actually in use.

## Consequences

- Drift between brain and project is impossible, not merely detectable. There is one copy.
- The brain is proven against a real deployed product rather than a greenfield toy.
- `rajin10/Real-Life-Agent` stays empty and unused for now. Its design spec is retained as the record of this reasoning.
- If a project ever genuinely needs its own repo, `git subtree split` is the exit. We pay that cost once, when it is real.
- Blast radius is shared: a broken gate blocks all work in this repo. Accepted — the gate stack is the mitigation.
