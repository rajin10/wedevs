"use client";

import * as React from "react";
import {
  Box,
  Zap,
  Cpu,
  Bot,
  Search,
  ChevronDown,
  Check,
  Settings2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "../../lib/cn";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "../../primitives/popover";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../../primitives/tabs";
import { Input } from "../../primitives/input";
import { Button } from "../../primitives/button";
import type { ModelOption, AgentOption, ModelSelectorProps } from "../../types";

// mockup 828 / 837 / 846 — fixed display order + labels of the model groups
const GROUP_ORDER: ModelOption["group"][] = ["frontier", "fast", "local"];
const GROUP_LABEL: Record<ModelOption["group"], string> = {
  frontier: "Frontier",
  fast: "Fast",
  local: "Local",
};
const GROUP_ICON: Record<ModelOption["group"], LucideIcon> = {
  frontier: Box,
  fast: Zap,
  local: Cpu,
};

function includes(haystack: string, needle: string) {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

// mockup 97-98: neutral capability chip (--hover fill, --border, --text-2)
function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex h-5 items-center gap-[5px] whitespace-nowrap rounded-full border border-[var(--border)] bg-[var(--hover)] px-2 text-[11px] font-semibold text-[var(--text-2)]">
      {children}
    </span>
  );
}

// mockup 172-181: the topbar selector button (neutral surface, hover border)
// NOTE: forwardRef + ...props spread is required — Radix's `PopoverTrigger
// asChild` merges its onClick/ref/aria-* onto this element via Slot, and
// those props must reach the real DOM <button> or the popover cannot open.
const TopbarTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { model?: ModelOption }
>(({ model, className, ...props }, ref) => {
  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        "flex items-center gap-[9px] rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-2.5 py-[7px]",
        "hover:border-[var(--border-2)] hover:bg-[var(--hover)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-line)]",
        className,
      )}
      {...props}
    >
      <span className="grid h-[22px] w-[22px] flex-none place-items-center rounded-[7px] bg-[var(--hover)] text-[var(--text-2)]">
        <Box className="h-3.5 w-3.5" strokeWidth={1.8} />
      </span>
      <span className="text-[13.5px] font-semibold text-[var(--text)]">
        {model?.name ?? "Select model"}
      </span>
      {model && (
        <span className="-ml-1 font-mono text-[11.5px] text-[var(--text-3)]">
          · {model.group}
        </span>
      )}
      <ChevronDown className="h-3.5 w-3.5 text-[var(--text-3)]" />
    </button>
  );
});
TopbarTrigger.displayName = "TopbarTrigger";

// mockup 638-640 / 924: the compact composer agent-pill (rounded-full)
// Same forwardRef requirement as TopbarTrigger above.
const PillTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }
>(({ label, className, ...props }, ref) => {
  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        "ml-[3px] inline-flex items-center gap-[7px] rounded-full border border-[var(--border)] py-[5px] pl-1.5 pr-2.5 text-[12.5px] font-semibold text-[var(--text-2)]",
        "hover:border-[var(--border-2)] hover:bg-[var(--hover)] hover:text-[var(--text)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-line)]",
        className,
      )}
      {...props}
    >
      <span className="grid h-[18px] w-[18px] flex-none place-items-center rounded-md bg-[var(--hover)] text-[var(--text-2)]">
        <Box className="h-[11px] w-[11px]" strokeWidth={1.8} />
      </span>
      {label}
      <ChevronDown className="h-3.5 w-3.5 text-[var(--text-3)]" />
    </button>
  );
});
PillTrigger.displayName = "PillTrigger";

// mockup 440-450: one model row. Selected = --active row + --primary glyph + check.
function ModelRow({
  model,
  selected,
  onPick,
}: {
  model: ModelOption;
  selected: boolean;
  onPick: () => void;
}) {
  const Icon = GROUP_ICON[model.group];
  return (
    <button
      type="button"
      onClick={onPick}
      aria-pressed={selected}
      className={cn(
        "flex w-full items-start gap-[11px] rounded-[11px] p-[11px] text-left",
        "hover:bg-[var(--hover)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-line)]",
        selected && "bg-[var(--active)]",
      )}
    >
      <span
        className={cn(
          "grid h-8 w-8 flex-none place-items-center rounded-[9px] border",
          selected
            ? "border-transparent bg-[var(--primary)] text-[var(--primary-text)]"
            : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-2)]",
        )}
      >
        <Icon className="h-[15px] w-[15px]" strokeWidth={1.8} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 text-[13.5px] font-bold text-[var(--text)]">
          {model.name}
          {selected && (
            <Check className="ml-auto h-[15px] w-[15px] flex-none text-[var(--text-2)]" />
          )}
        </span>
        {model.sub && (
          <span className="mt-0.5 block text-[12px] text-[var(--text-3)]">
            {model.sub}
          </span>
        )}
        {model.tags.length > 0 && (
          <span className="mt-[7px] flex flex-wrap gap-[5px]">
            {model.tags.map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
          </span>
        )}
      </span>
    </button>
  );
}

// mockup 856-869: one agent row — name + persona + specialty chip.
function AgentRow({
  agent,
  onPick,
}: {
  agent: AgentOption;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      className={cn(
        "flex w-full items-start gap-[11px] rounded-[11px] p-[11px] text-left",
        "hover:bg-[var(--hover)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-line)]",
      )}
    >
      <span className="grid h-8 w-8 flex-none place-items-center rounded-[9px] border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-2)]">
        <Bot className="h-[15px] w-[15px]" strokeWidth={1.8} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13.5px] font-bold text-[var(--text)]">
          {agent.name}
        </span>
        <span className="mt-0.5 block text-[12px] text-[var(--text-3)]">
          {agent.persona}
        </span>
        <span className="mt-[7px] flex flex-wrap gap-[5px]">
          <Tag>{agent.specialty}</Tag>
        </span>
      </span>
    </button>
  );
}

// mockup 436-437: neutral popover tab chip (active = --active/--text, NO accent)
const ptabClass = cn(
  "flex-1 rounded-[9px] px-2 py-2 text-center text-[13px] font-semibold text-[var(--text-3)]",
  "data-[state=inactive]:hover:text-[var(--text-2)]",
  "data-[state=active]:bg-[var(--active)] data-[state=active]:text-[var(--text)]",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-line)]",
);

export function ModelSelector({
  models,
  agents,
  selectedModelId,
  onSelectModel,
  variant = "topbar",
}: ModelSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [tab, setTab] = React.useState<"models" | "agents">("models");
  const [query, setQuery] = React.useState("");

  const selectedModel = models.find((m) => m.id === selectedModelId);
  const selectedAgent = agents.find((a) => a.id === selectedModelId);
  // Design decision 4: label resolves from models first, then agents.
  const triggerLabel =
    selectedModel?.name ?? selectedAgent?.name ?? "Select model";

  const q = query.trim();
  const visibleModels = q
    ? models.filter(
        (m) => includes(m.name, q) || m.tags.some((t) => includes(t, q)),
      )
    : models;
  const visibleAgents = q
    ? agents.filter(
        (a) =>
          includes(a.name, q) ||
          includes(a.persona, q) ||
          includes(a.specialty, q),
      )
    : agents;

  const pick = (id: string) => {
    onSelectModel(id);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {variant === "pill" ? (
          <PillTrigger label={triggerLabel} />
        ) : (
          <TopbarTrigger model={selectedModel} />
        )}
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={8}
        className="flex w-[360px] flex-col overflow-hidden rounded-[var(--radius)] border border-[var(--border-2)] bg-[var(--elevated)] p-0 shadow-[var(--shadow)]"
      >
        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as "models" | "agents")}
          className="flex min-h-0 flex-col"
        >
          <TabsList className="flex gap-[3px] px-2.5 pt-2.5">
            {/* onClick is a defensive addition alongside Radix's built-in
                onMouseDown/onFocus activation — see forwardRef note above
                for why click-only environments need an explicit handler. */}
            <TabsTrigger
              value="models"
              onClick={() => setTab("models")}
              className={ptabClass}
            >
              Models
            </TabsTrigger>
            <TabsTrigger
              value="agents"
              onClick={() => setTab("agents")}
              className={ptabClass}
            >
              Agents
            </TabsTrigger>
          </TabsList>

          {/* mockup 675-678: search field */}
          <div className="mx-2 mb-1 mt-2 flex items-center gap-2 rounded-[9px] border border-[var(--border)] bg-[var(--surface)] px-[11px] py-2">
            <Search className="h-4 w-4 flex-none text-[var(--text-3)]" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search models & agents…"
              aria-label="Search models and agents"
              className="h-auto flex-1 border-none bg-transparent p-0 text-[13px] text-[var(--text)] shadow-none outline-none focus-visible:ring-0"
            />
          </div>

          <div className="max-h-[390px] overflow-y-auto p-2">
            <TabsContent value="models" className="mt-0">
              {GROUP_ORDER.map((group) => {
                const rows = visibleModels.filter((m) => m.group === group);
                if (rows.length === 0) return null;
                return (
                  <div key={group}>
                    <div className="px-[11px] pb-1 pt-2.5 text-[10.5px] font-bold uppercase tracking-[0.07em] text-[var(--text-3)]">
                      {GROUP_LABEL[group]}
                    </div>
                    {rows.map((m) => (
                      <ModelRow
                        key={m.id}
                        model={m}
                        selected={m.id === selectedModelId}
                        onPick={() => pick(m.id)}
                      />
                    ))}
                  </div>
                );
              })}
              {visibleModels.length === 0 && (
                <p className="px-[11px] py-6 text-center text-[13px] text-[var(--text-3)]">
                  No models match your search.
                </p>
              )}
            </TabsContent>

            <TabsContent value="agents" className="mt-0">
              {visibleAgents.map((a) => (
                <AgentRow key={a.id} agent={a} onPick={() => pick(a.id)} />
              ))}
              {visibleAgents.length === 0 && (
                <p className="px-[11px] py-6 text-center text-[13px] text-[var(--text-3)]">
                  No agents match your search.
                </p>
              )}
            </TabsContent>
          </div>
        </Tabs>

        {/* mockup 452-453: footer */}
        <div className="border-t border-[var(--border)] p-[9px]">
          <Button
            variant="ghost"
            type="button"
            className="w-full justify-start gap-2 text-[13px] text-[var(--text-2)]"
          >
            <Settings2 className="h-4 w-4" />
            Manage models &amp; agents
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
