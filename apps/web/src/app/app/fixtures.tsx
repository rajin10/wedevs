import { MessageSquare, Code2, Blocks } from "lucide-react";
import type {
  NavItem,
  RecentChat,
  Project,
  Account,
  ModelOption,
  AgentOption,
  ChatMessage,
  StreamingMessage,
  PluginCardData,
  FilePreviewData,
  OutputData,
  ModelDetails,
  PluginConfigData,
} from "@wedevs/ui";

export const nav: NavItem[] = [
  { id: "chat", label: "Chat", icon: <MessageSquare size={18} />, kbd: "⌘1" },
  { id: "code", label: "Code", icon: <Code2 size={18} />, kbd: "⌘2" },
  { id: "market", label: "Marketplace", icon: <Blocks size={18} />, kbd: "⌘3" },
];

export const recents: RecentChat[] = [
  {
    id: "r1",
    title: "Q3 go-to-market analysis",
    group: "pinned",
    pinned: true,
  },
  { id: "r2", title: "Refactor billing webhooks", group: "today" },
  { id: "r3", title: "Onboarding email copy", group: "today" },
  { id: "r4", title: "Postgres index audit", group: "previous7" },
  { id: "r5", title: "Landing page hero variants", group: "previous7" },
];

export const projects: Project[] = [
  { id: "p1", name: "Wedevs Cloud", count: 12 },
  { id: "p2", name: "Marketing site", count: 4 },
];

export const account: Account = {
  name: "Hasib Rahman",
  email: "hasib.webdev@gmail.com",
  plan: "Pro",
  initials: "HR",
};

export const models: ModelOption[] = [
  {
    id: "opus-4",
    name: "Opus 4",
    group: "frontier",
    sub: "200K context",
    tags: ["reasoning", "vision"],
  },
  {
    id: "sonnet-4",
    name: "Sonnet 4",
    group: "frontier",
    sub: "200K context",
    tags: ["balanced"],
  },
  {
    id: "haiku-4",
    name: "Haiku 4",
    group: "fast",
    sub: "Low latency",
    tags: ["fast"],
  },
  {
    id: "local-8b",
    name: "Local 8B",
    group: "local",
    sub: "On-device",
    tags: ["private"],
  },
];

export const agents: AgentOption[] = [
  {
    id: "ag1",
    name: "Analyst",
    persona: "Data-savvy strategist",
    specialty: "Forecasting",
  },
  {
    id: "ag2",
    name: "Engineer",
    persona: "Pragmatic builder",
    specialty: "Refactoring",
  },
];

export const messages: ChatMessage[] = [
  {
    id: "m1",
    role: "user",
    time: "2:14 PM",
    text: "Summarize our Q3 go-to-market plan and flag the risks.",
  },
  {
    id: "m2",
    role: "assistant",
    model: "Opus 4",
    time: "2:14 PM",
    text: "Here's the Q3 summary with the key risks called out.",
    tool: {
      id: "t1",
      name: "analyze_sheet",
      desc: "Analyzing q3-forecast.xlsx",
      done: "Done in 3.4s",
      rows: [
        { label: "Rows", value: "48,210" },
        { label: "Segments", value: "6" },
      ],
    },
  },
];

export const streaming: StreamingMessage = {
  model: "Opus 4",
  partialText:
    "One more thing worth flagging for Q3 — your partner channel is up 14% week over week, so I'd front-load partner enablement before the paid-search push.",
};

export const plugins: PluginCardData[] = [
  {
    id: "pg1",
    name: "Linear",
    publisher: "Linear Inc.",
    verified: true,
    desc: "Sync issues and cycles into chat.",
    tags: ["Project mgmt"],
    enabled: true,
  },
  {
    id: "pg2",
    name: "GitHub",
    publisher: "GitHub",
    verified: true,
    desc: "Read repos, open PRs, review diffs.",
    tags: ["Dev"],
    enabled: false,
  },
  {
    id: "pg3",
    name: "Notion",
    publisher: "Notion Labs",
    desc: "Search and write to your workspace.",
    tags: ["Docs"],
    enabled: false,
  },
];

export const greeting = "Good afternoon, Hasib";
export const starters: string[] = [
  "Draft a Q3 GTM one-pager",
  "Explain this stack trace",
  "Refactor a React component",
  "Summarize a spreadsheet",
];

export const codeMeta = {
  repo: "wedevs/cloud",
  branch: "main",
  sync: "Synced 2m ago",
};

export const filePreview: FilePreviewData = {
  name: "channel-mix.png",
  size: "1.2 MB",
  dims: "1600×900",
};
export const outputData: OutputData = {
  title: "Analysis complete",
  percent: 100,
  rows: [
    { label: "Rows scanned", value: "48,210" },
    { label: "Segments", value: "6" },
    { label: "Runtime", value: "3.4s" },
  ],
};
export const modelDetails: ModelDetails = {
  name: "Opus 4",
  sub: "Frontier · 200K ctx",
  params: [
    { label: "Temperature", value: 0.7, min: 0, max: 1 },
    { label: "Top P", value: 0.9, min: 0, max: 1 },
  ],
  tools: [
    { label: "Web search", on: true },
    { label: "Code execution", on: false },
  ],
};
export const pluginConfig: PluginConfigData = {
  name: "Linear",
  publisher: "Linear Inc.",
  connected: false,
  permissions: [
    { label: "Read issues", on: true },
    { label: "Write issues", on: false },
  ],
};
