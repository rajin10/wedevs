# Gate fixtures

**These files are broken on purpose. Do not fix them.**

Each one contains a violation that the lint gate is supposed to catch. `scripts/verify-gates.mjs` runs ESLint against them and asserts that **every single one is rejected**. If a fixture ever lints clean, the rule meant to catch it has stopped working, and `verify-gates` fails CI.

This exists because of a specific, observed failure. In a reference repo we studied, three separate gates — a formatting hook, `check-types`, and lint-in-CI — were silently dead for months. The hook piped to a binary that wasn't installed and swallowed the error with `|| true`. `check-types` resolved to a non-existent command across all 18 workspaces. Lint was commented out of the CI file. **None of them failed. All of them reported success.** The team believed they were protected the entire time.

> A gate with no proof that it fails on bad input is not a gate. It is a decoration that reports success.

`pnpm lint` ignores this directory (see `packages/config/eslint.preset.js`) so these deliberate violations don't break the normal build. `verify-gates.mjs` reaches them with `--no-ignore`.

## Adding a rule

When you add a gate rule, add a fixture that violates it, and add the expectation to `scripts/verify-gates.mjs`. A rule without a fixture is unproven — and unproven is how the reference repo got where it is.
