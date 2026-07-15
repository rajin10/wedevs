#!/usr/bin/env node
/**
 * Proves the lint gate actually fires.
 *
 * Runs ESLint against gate-fixtures/ — files that are broken on purpose — and
 * asserts every one is rejected by the expected rule. If a fixture lints clean,
 * the rule meant to catch it has silently stopped working, and this exits 1.
 *
 * Why this exists: in a repo we studied, three gates (a format hook, check-types,
 * and lint-in-CI) were dead for months. None failed. All reported success.
 * A gate with no proof it fails on bad input is a decoration.
 */
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

/** fixture -> the rule that MUST reject it */
const EXPECTATIONS = [
  { file: "gate-fixtures/todo-comment.ts", rule: "no-warning-comments", minErrors: 3 },
  { file: "gate-fixtures/stub-throw.ts", rule: "no-restricted-syntax", minErrors: 3 },
  { file: "gate-fixtures/type-laundering.ts", rule: "no-restricted-syntax", minErrors: 2 },
];

function lint(file) {
  // Routed through the shell: pnpm/npx resolve differently across Windows and
  // macOS, and both of ours must work (see AGENTS.md — two machines).
  const cmd = `pnpm exec eslint --no-ignore --format json "${file}"`;
  try {
    const out = execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    return { exitCode: 0, results: JSON.parse(out) };
  } catch (err) {
    // ESLint exits 1 when it finds lint errors — the expected path here.
    if (err.stdout) {
      try {
        return { exitCode: err.status, results: JSON.parse(err.stdout) };
      } catch {
        /* not JSON — fall through and report loudly below */
      }
    }
    throw new Error(
      `Could not run ESLint on ${file}. This script cannot prove anything, so it fails.\n` +
        `  command: ${cmd}\n  exit: ${err.status}\n  stdout: ${err.stdout ?? "(none)"}\n  stderr: ${err.stderr ?? "(none)"}`,
    );
  }
}

let failed = 0;
console.log("Verifying the lint gate fires on known-bad input\n");

for (const { file, rule, minErrors } of EXPECTATIONS) {
  if (!existsSync(join(process.cwd(), file))) {
    console.error(`  DEAD  ${file}\n        fixture is missing — the gate is unproven`);
    failed++;
    continue;
  }

  const { results } = lint(file);
  const messages = results.flatMap((r) => r.messages ?? []);
  const hits = messages.filter((m) => m.ruleId === rule);

  if (hits.length === 0) {
    console.error(`  DEAD  ${file}`);
    console.error(`        expected '${rule}' to reject this file. It did not.`);
    console.error(`        The rule is gone, renamed, or disabled. Nothing is protecting you.`);
    if (messages.length) {
      console.error(`        (other rules fired: ${[...new Set(messages.map((m) => m.ruleId))].join(", ")})`);
    }
    failed++;
  } else if (hits.length < minErrors) {
    console.error(`  WEAK  ${file}`);
    console.error(`        '${rule}' caught ${hits.length}/${minErrors} expected violations.`);
    console.error(`        Part of the rule stopped matching. Check the config, not the fixture.`);
    failed++;
  } else {
    console.log(`  LIVE  ${file}  —  '${rule}' caught ${hits.length}`);
  }
}

console.log("");
if (failed > 0) {
  console.error(`${failed} gate(s) not proven. Fix the RULE — do not fix the fixture.`);
  process.exit(1);
}
console.log(`All ${EXPECTATIONS.length} gates proven live.`);
