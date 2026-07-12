import type { ReactNode } from "react";
import { FileText, Folder } from "lucide-react";
import { LiveCluster } from "../live/LiveCluster";
import { LiveDot } from "../live/LiveDot";
import { StreamShimmer } from "../live/StreamShimmer";
import { TypeCaret } from "../live/TypeCaret";

// syntax tokens — sanctioned literal-hex zone (mockup 626)
const K = ({ children }: { children: ReactNode }) => (
  <span className="text-[#c58af0]">{children}</span>
);
const Fn = ({ children }: { children: ReactNode }) => (
  <span className="text-[#77aee6]">{children}</span>
);
const S = ({ children }: { children: ReactNode }) => (
  <span className="text-[#cba36a]">{children}</span>
);
const C = ({ children }: { children: ReactNode }) => (
  <span className="italic text-[var(--text-3)]">{children}</span>
);
const Tag = ({ children }: { children: ReactNode }) => (
  <span className="text-[#77aee6]">{children}</span>
);

const LINE = "flex px-3.5 whitespace-pre min-w-max hover:bg-[var(--hover)]";
const LN =
  "w-[30px] shrink-0 pr-4 text-right text-[var(--text-3)] opacity-[.65] select-none";

// Ported from mockup/index.html markup 1083-1113. Two columns: `.code-tree`
// (hidden <=760px per mockup 630, static demo rows) and `.code-main`
// (tabs -> .ai-edit-bar -> .editor). The editor is static demo content.
// Sanctioned hex zone: `.tok-*` literal colors (mockup 626) and diff-del
// literal rgba(214,73,61,.12); diff-add uses --accent-soft/--accent.
export function CodeEditor() {
  return (
    <div className="flex min-h-0 flex-1">
      {/* file tree — hidden ≤760px (mockup 630) */}
      <aside
        data-testid="code-tree"
        className="w-[214px] shrink-0 overflow-y-auto border-r border-[var(--border)] bg-[var(--sidebar)] px-2 py-2.5 max-[760px]:hidden"
      >
        <div className="flex items-center gap-[7px] px-2 py-2 text-[10px] font-bold uppercase tracking-[.11em] text-[var(--text-3)]">
          <Folder className="h-4 w-4" /> web-app
          <span
            className="ml-auto tracking-normal"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            3 changed
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-[7px] px-[9px] py-1.5 text-[13px] text-[var(--text-2)] hover:bg-[var(--hover)] hover:text-[var(--text)]">
          <Folder className="h-4 w-4 text-[var(--text-3)]" /> src
        </div>
        <div className="ml-3.5 flex items-center gap-2 rounded-[7px] px-[9px] py-1.5 text-[13px] text-[var(--text-2)] hover:bg-[var(--hover)] hover:text-[var(--text)]">
          <FileText className="h-4 w-4 text-[var(--text-3)]" /> lib/agents.ts
          <span className="ml-auto text-[10px] font-extrabold text-[var(--success)]">
            A
          </span>
        </div>
        <div className="ml-3.5 flex items-center gap-2 rounded-[7px] bg-[var(--active)] px-[9px] py-1.5 text-[13px] text-[var(--text)]">
          <FileText className="h-4 w-4 text-[var(--text-3)]" /> ChatStream.tsx
          <span className="ml-auto text-[10px] font-extrabold text-[var(--warning)]">
            M
          </span>
        </div>
        <div className="ml-3.5 flex items-center gap-2 rounded-[7px] px-[9px] py-1.5 text-[13px] text-[var(--text-2)] hover:bg-[var(--hover)] hover:text-[var(--text)]">
          <FileText className="h-4 w-4 text-[var(--text-3)]" /> theme.css
          <span className="ml-auto text-[10px] font-extrabold text-[var(--warning)]">
            M
          </span>
        </div>
      </aside>

      {/* editor column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-0.5 border-b border-[var(--border)] bg-[var(--bg)] px-2.5 pt-1.5">
          <div className="flex items-center gap-2 rounded-t-lg bg-[var(--sink)] px-[13px] py-2 text-[12.5px] text-[var(--text)]">
            <FileText className="h-[13px] w-[13px]" /> ChatStream.tsx
          </div>
        </div>

        {/* AI live-edit bar — sanctioned accent-soft zone (mockup 682), active AI-editing state */}
        <div
          data-live="ai-edit"
          className="flex items-center gap-[9px] border-b border-[var(--border)] bg-[var(--accent-soft)] px-3.5 py-2 text-[12px] text-[var(--text-2)]"
        >
          <LiveDot />
          <span>
            <b className="font-bold text-[var(--text)]">Wedevs AI</b> is editing{" "}
            <span style={{ fontFamily: "var(--font-mono)" }}>
              ChatStream.tsx
            </span>{" "}
            · streaming from chat
          </span>
          <LiveCluster className="ml-auto" />
        </div>

        <div
          className="flex-1 overflow-auto bg-[var(--sink)] py-3 text-[12.5px] leading-[1.8]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          <div className={LINE}>
            <span className={LN}>1</span>
            <span>
              <K>import</K> {"{ streamChat }"} <K>from</K> <S>'@/lib/agents'</S>
            </span>
          </div>
          <div className={LINE}>
            <span className={LN}>2</span>
            <span>
              <K>import</K> {"{ useState, useRef }"} <K>from</K> <S>'react'</S>
            </span>
          </div>
          <div className={LINE}>
            <span className={LN}>3</span>
            <span> </span>
          </div>
          <div className={LINE}>
            <span className={LN}>4</span>
            <span>
              <C>{"// streams the assistant reply token-by-token"}</C>
            </span>
          </div>
          <div className={LINE}>
            <span className={LN}>5</span>
            <span>
              <K>export function</K> <Fn>ChatStream</Fn>({"{ agent }"}: Props){" "}
              {"{"}
            </span>
          </div>
          <div className={LINE}>
            <span className={LN}>6</span>
            <span>
              {"  "}
              <K>const</K> [text, setText] = <Fn>useState</Fn>(<S>''</S>)
            </span>
          </div>
          <div
            data-diff="del"
            className="flex px-3.5 whitespace-pre min-w-max relative bg-[rgba(214,73,61,.12)] [&>span:last-child]:opacity-70"
          >
            <span className={`${LN} !text-[var(--error)]`}>−</span>
            <span>
              {"  "}
              <K>const</K> live = <K>false</K>
            </span>
          </div>
          <div
            data-diff="add"
            className="flex px-3.5 whitespace-pre min-w-max relative bg-[var(--accent-soft)] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-0.5 before:bg-[var(--accent)] before:content-['']"
          >
            <span className={`${LN} !text-[var(--success)]`}>7</span>
            <span>
              {"  "}
              <K>const</K> live = <Fn>useRef</Fn>(<K>true</K>){"  "}
              <C>{"// volt only while streaming"}</C>
            </span>
          </div>
          <div className={LINE}>
            <span className={LN}>8</span>
            <span> </span>
          </div>
          <div className={LINE}>
            <span className={LN}>9</span>
            <span>
              {"  "}
              <K>for await</K> (<K>const</K> token <K>of</K> <Fn>streamChat</Fn>
              (agent)) {"{"}
            </span>
          </div>
          <div
            data-diff="add"
            className="flex px-3.5 whitespace-pre min-w-max relative bg-[var(--accent-soft)] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-0.5 before:bg-[var(--accent)] before:content-['']"
          >
            <span className={`${LN} !text-[var(--success)]`}>10</span>
            <span>
              {"    "}
              <Fn>setText</Fn>((t) =&gt; t + token){"  "}
              <C>{"// gray shimmer reveal"}</C>
            </span>
          </div>
          <div className={LINE}>
            <span className={LN}>11</span>
            <span>{"  }"}</span>
          </div>
          <div className={LINE}>
            <span className={LN}>12</span>
            <span>
              {"  "}
              <K>return</K> <Tag>&lt;Message</Tag> live={"{live}"}{" "}
              <Tag>/&gt;</Tag>
            </span>
          </div>
          <div className={LINE}>
            <span className={LN}>13</span>
            <span>{"}"}</span>
          </div>
          <div
            data-diff="editing"
            className="flex px-3.5 whitespace-pre min-w-max bg-[var(--hover)]"
          >
            <span className={LN}>14</span>
            <span>
              {"  "}
              <StreamShimmer text="// wiring token stream…" />
              <TypeCaret />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
