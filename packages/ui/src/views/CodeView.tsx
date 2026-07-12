"use client";

import {
  GitBranch,
  GitCommitHorizontal,
  GitPullRequest,
  Play,
  RefreshCw,
} from "lucide-react";
import { LiveDot } from "../live/LiveDot";
import { CodeEditor } from "./CodeEditor";
import type { CodeViewProps } from "../types";

// Ported from mockup/index.html markup 1069-1120. `.code-head` (repo split
// on last `/` into muted org + bold name; `.branch` button with <LiveDot/> +
// branch prop; `.gh-sync` mono line showing sync prop; actions Run/Create PR
// = ghost, Commit = primary -> onAction) -> <CodeEditor/> body -> `.code-foot`
// (<LiveDot/> + branch, static changed-files segment, static status segment).
export function CodeView({ repo, branch, sync, onAction }: CodeViewProps) {
  const slash = repo.lastIndexOf("/");
  const org = slash >= 0 ? repo.slice(0, slash + 1) : "";
  const name = slash >= 0 ? repo.slice(slash + 1) : repo;

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-center gap-3 border-b border-[var(--border)] px-[18px] py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-[9px] border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-2)]">
            <GitBranch className="h-4 w-4" />
          </span>
          <div className="whitespace-nowrap text-[14.5px] font-bold">
            <span className="font-medium text-[var(--text-3)]">{org}</span>
            {name}
          </div>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-[7px] rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-[12.5px] font-semibold text-[var(--text)] hover:border-[var(--border-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-line)]"
        >
          <LiveDot /> {branch}
        </button>

        <span
          className="inline-flex items-center gap-1.5 text-[11px] text-[var(--text-3)]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          <RefreshCw className="h-4 w-4" /> {sync}
        </span>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => onAction("run")}
            className="inline-flex items-center gap-[7px] rounded-[9px] border border-[var(--border)] px-[13px] py-2 text-[12.5px] font-semibold text-[var(--text-2)] hover:border-[var(--border-2)] hover:bg-[var(--hover)] hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-line)]"
          >
            <Play className="h-4 w-4" /> Run
          </button>
          <button
            type="button"
            onClick={() => onAction("pr")}
            className="inline-flex items-center gap-[7px] rounded-[9px] border border-[var(--border)] px-[13px] py-2 text-[12.5px] font-semibold text-[var(--text-2)] hover:border-[var(--border-2)] hover:bg-[var(--hover)] hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-line)]"
          >
            <GitPullRequest className="h-4 w-4" /> Create PR
          </button>
          <button
            type="button"
            onClick={() => onAction("commit")}
            className="inline-flex items-center gap-[7px] rounded-[9px] bg-[var(--primary)] px-[13px] py-2 text-[12.5px] font-semibold text-[var(--primary-text)] hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-line)]"
          >
            <GitCommitHorizontal className="h-4 w-4" /> Commit
          </button>
        </div>
      </div>

      <CodeEditor />

      <div
        className="flex items-center gap-4 border-t border-[var(--border)] bg-[var(--bg)] px-4 py-2 text-[11px] text-[var(--text-3)]"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        <span className="flex items-center gap-1.5">
          <LiveDot /> {branch}
        </span>
        <span className="flex items-center gap-1.5">
          3 files changed · +48 −12
        </span>
        <span className="ml-auto">
          TypeScript · React · UTF-8 · Ln 12, Col 24
        </span>
      </div>
    </section>
  );
}
