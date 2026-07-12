"use client";

import * as React from "react";
import { Link2, Check, Eye, Pencil, Database } from "lucide-react";
import { Button } from "../../../primitives/button";
import { Input } from "../../../primitives/input";
import { Switch } from "../../../primitives/switch";
import type { PluginConfigData } from "../../../types";

const API_KEY = "ntn_5f8a92c4e1b7";
const permIcons = [Eye, Pencil, Database];

function EyebrowSm({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <div
      className={
        "mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-3)] " +
        (className ?? "")
      }
    >
      <span className="h-0.5 w-4 flex-none rounded-[2px] bg-[var(--accent)]" />
      {label}
    </div>
  );
}

export function ConfigPane({
  config,
  onClose,
}: {
  config?: PluginConfigData;
  onClose: () => void;
}) {
  const [connected, setConnected] = React.useState(config?.connected ?? false);
  const [revealed, setRevealed] = React.useState(false);
  const [perms, setPerms] = React.useState(config?.permissions ?? []);

  React.useEffect(() => {
    setConnected(config?.connected ?? false);
    setPerms(config?.permissions ?? []);
    setRevealed(false);
  }, [config]);

  if (!config) {
    return (
      <p className="text-[13px] text-[var(--text-3)]">
        No plugin to configure.
      </p>
    );
  }

  return (
    <div>
      <EyebrowSm label="Configure" />
      <div className="mb-3.5 flex items-center gap-3">
        <div className="grid h-10 w-10 flex-none place-items-center rounded-[10px] bg-[var(--hover)] text-[var(--text-2)]">
          <Link2 className="h-5 w-5" />
        </div>
        <div>
          <div className="text-[15px] font-bold">{config.name}</div>
          <div className="text-xs text-[var(--text-3)]">
            {config.publisher} · {connected ? "connected" : "not connected"}
          </div>
        </div>
      </div>

      <Button
        variant="primary"
        type="button"
        disabled={connected}
        onClick={() => setConnected(true)}
        className="mb-4 w-full justify-center gap-[7px]"
      >
        {connected ? (
          <>
            <Check className="h-4 w-4" /> Connected
          </>
        ) : (
          <>
            <Link2 className="h-4 w-4" /> Connect account
          </>
        )}
      </Button>

      <div className="mb-1">
        <label className="mb-1.5 block text-xs font-semibold text-[var(--text-2)]">
          API key
        </label>
        <div className="flex items-center gap-1.5 rounded-[9px] border border-[var(--border)] bg-[var(--surface)] py-1 pl-3 pr-1">
          <Input
            readOnly
            type={revealed ? "text" : "password"}
            value={API_KEY}
            className="h-auto flex-1 border-none bg-transparent p-0 font-mono text-[12.5px] text-[var(--text)] shadow-none outline-none focus-visible:ring-0"
          />
          <button
            type="button"
            onClick={() => setRevealed((r) => !r)}
            className="rounded-[7px] px-2.5 py-1.5 text-[11.5px] font-semibold text-[var(--text-2)] hover:bg-[var(--hover)] hover:text-[var(--text)]"
          >
            {revealed ? "Hide" : "Show"}
          </button>
        </div>
      </div>

      <EyebrowSm label="Permissions" className="mt-[18px]" />
      <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] p-3.5">
        {perms.map((perm, i) => {
          const Icon = permIcons[i % permIcons.length]!;
          return (
            <div
              key={perm.label}
              className="flex items-center gap-2.5 border-b border-[var(--border)] py-[9px] last:border-b-0"
            >
              <Icon className="h-4 w-4 text-[var(--text-3)]" />
              <span className="flex-1 text-[13px] font-medium">
                {perm.label}
              </span>
              <Switch
                checked={perm.on}
                aria-label={perm.label}
                onCheckedChange={(on) =>
                  setPerms((prev) =>
                    prev.map((p, idx) => (idx === i ? { ...p, on } : p)),
                  )
                }
              />
            </div>
          );
        })}
      </div>

      <div className="mt-[18px] flex gap-2">
        <Button
          variant="ghost"
          type="button"
          onClick={onClose}
          className="flex-1 justify-center border border-[var(--border)]"
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          type="button"
          onClick={onClose}
          className="flex-1 justify-center"
        >
          Save changes
        </Button>
      </div>
    </div>
  );
}
