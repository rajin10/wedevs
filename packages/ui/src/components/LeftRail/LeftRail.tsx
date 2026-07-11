"use client";

import * as React from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "../../primitives/dropdown-menu";
import { Button } from "../../primitives/button";
import { Input } from "../../primitives/input";
import { LiveDot } from "../../live/LiveDot";
import { cn } from "../../lib/cn";
import type { LeftRailProps, RecentChat, RecentGroup } from "../../types";

export type { LeftRailProps };

// ---- inline stroke icons (ported viewBox paths from mockup) ------------------
const ic =
  "h-[18px] w-[18px] flex-none [&_*]:[vector-effect:non-scaling-stroke]";
const icSm = "h-[15px] w-[15px] flex-none";
function Svg({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}
const CollapseIcon = () => (
  <Svg className={ic}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M9 4v16" />
  </Svg>
);
const SearchIcon = () => (
  <Svg className={ic}>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </Svg>
);
const PlusIcon = () => (
  <Svg className={ic}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);
const StarIcon = ({ small }: { small?: boolean }) => (
  <Svg className={small ? icSm : ic}>
    <path d="M12 17.3 5.8 21l1.6-7L2 9.2l7.1-.6L12 2l2.9 6.6 7.1.6-5.4 4.8 1.6 7z" />
  </Svg>
);
const ChatIcon = () => (
  <Svg className={ic}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </Svg>
);
const FolderIcon = ({ small }: { small?: boolean }) => (
  <Svg className={small ? icSm : ic}>
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
  </Svg>
);
const DotsIcon = () => (
  <Svg className={icSm}>
    <circle cx="5" cy="12" r="1" />
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
  </Svg>
);
const RenameIcon = () => (
  <Svg className={icSm}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
  </Svg>
);
const ArchiveIcon = () => (
  <Svg className={icSm}>
    <path d="M3 7h18M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" />
  </Svg>
);
const ChevronUpDownIcon = () => (
  <Svg className={icSm}>
    <path d="m8 9 4-4 4 4M8 15l4 4 4-4" />
  </Svg>
);
const ProfileIcon = () => (
  <Svg className={icSm}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20a8 8 0 0 1 16 0" />
  </Svg>
);
const GearIcon = ({ small }: { small?: boolean }) => (
  <Svg className={small ? icSm : ic}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 3v3m0 12v3M3 12h3m12 0h3" />
  </Svg>
);
const UpgradeIcon = () => (
  <Svg className={icSm}>
    <path d="M12 2v10M6 6a8 8 0 1 0 12 0" />
  </Svg>
);
const LogoutIcon = () => (
  <Svg className={icSm}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
  </Svg>
);

// ---- shared class fragments (tokens only, no hex) ---------------------------
const navBase =
  "group relative flex w-full items-center gap-[9px] rounded-[var(--radius-xs)] px-[10px] py-[7px] text-left text-[var(--text-2)] transition-colors duration-100 hover:bg-[var(--hover)] hover:text-[var(--text)]";
const navActive =
  "bg-[var(--active)] text-[var(--text)] before:absolute before:-left-1 before:top-2 before:bottom-2 before:w-[2.5px] before:rounded-[2px] before:bg-[var(--active-line)] before:content-['']";

const RECENT_ORDER: RecentGroup[] = ["pinned", "today", "previous7"];
const GROUP_LABEL: Record<RecentGroup, string> = {
  pinned: "Pinned",
  today: "Today",
  previous7: "Previous 7 days",
  projects: "Projects",
};

// ---------------------------------------------------------------------------
export function LeftRail(props: LeftRailProps) {
  const {
    mode,
    nav,
    activeNav,
    recents,
    projects,
    account,
    brandLogo,
    onNavSelect,
    onNewChat,
    onSearch,
    onToggleCollapse,
    onRenameChat,
    onChatAction,
    onAccountAction,
  } = props;

  const collapsed = mode === "collapsed";
  const [renamingId, setRenamingId] = React.useState<string | null>(null);

  const groups = React.useMemo(
    () =>
      RECENT_ORDER.map((g) => ({
        group: g,
        items: recents.filter((r) => r.group === g),
      })).filter((g) => g.items.length > 0),
    [recents],
  );

  function commitRename(chat: RecentChat, raw: string) {
    const next = raw.trim();
    setRenamingId(null);
    if (next && next !== chat.title) onRenameChat(chat.id, next);
  }

  return (
    <aside
      data-rail={collapsed ? "collapsed" : "expanded"}
      className={cn(
        "relative z-40 flex h-full flex-col gap-[6px] border-r border-[var(--border)] bg-[var(--sidebar)] px-[10px] py-3 transition-[width] duration-[260ms] ease-[cubic-bezier(.4,0,.2,1)]",
        collapsed ? "w-[60px]" : "w-[272px]",
      )}
    >
      {/* ---- rail-top: brand + collapse ---- */}
      <div
        className={cn(
          "flex items-center gap-[9px] px-[6px] pb-2 pt-1",
          collapsed && "justify-center px-0",
        )}
      >
        <div className="flex min-w-0 items-center gap-[9px] overflow-hidden">
          <div className="grid h-[30px] w-[30px] flex-none place-items-center overflow-hidden rounded-[9px] border border-[var(--border)] bg-[var(--primary)] font-[var(--font-display)] text-sm font-extrabold text-[var(--primary-text)]">
            {brandLogo ?? "W"}
          </div>
          {!collapsed && (
            <span className="flex items-center whitespace-nowrap text-[14.5px] font-bold tracking-[-0.01em] text-[var(--text)]">
              Wedevs
              <LiveDot className="ml-[2px]" />
            </span>
          )}
        </div>
        {!collapsed && (
          <Button
            variant="icon"
            className="ml-auto text-[var(--text-3)]"
            title="Collapse sidebar"
            aria-label="Collapse sidebar"
            onClick={onToggleCollapse}
          >
            <CollapseIcon />
          </Button>
        )}
      </div>

      {/* ---- search ---- */}
      <button
        type="button"
        aria-label="Search"
        onClick={onSearch}
        className={cn(
          "flex w-full items-center gap-[9px] rounded-[var(--radius-sm)] px-[11px] py-[9px] font-medium text-[var(--text-2)] transition-colors duration-100 hover:bg-[var(--hover)]",
          collapsed && "justify-center px-0",
        )}
      >
        <SearchIcon />
        {!collapsed && (
          <>
            <span className="flex-1 text-left text-[14px]">Search</span>
            <span className="rounded-md border border-[var(--border)] bg-[var(--hover)] px-[6px] py-[2px] font-[var(--font-mono)] text-[11px] text-[var(--text-3)]">
              ⌘K
            </span>
          </>
        )}
      </button>

      {/* ---- primary nav ---- */}
      <nav
        className={cn(
          "mt-1 flex flex-col gap-[2px] border-b border-[var(--border)] pb-[10px]",
          collapsed && "items-center",
        )}
      >
        <button
          type="button"
          aria-label="New chat"
          onClick={onNewChat}
          className={cn(
            navBase,
            "font-semibold text-[var(--text)]",
            collapsed && "justify-center px-0",
          )}
        >
          <PlusIcon />
          {!collapsed && (
            <>
              <span className="flex-1 truncate text-[14px]">New chat</span>
              <span className="rounded-md border border-[var(--border)] bg-[var(--hover)] px-[6px] py-[2px] font-[var(--font-mono)] text-[11px] text-[var(--text-3)]">
                ⌘N
              </span>
            </>
          )}
        </button>

        {nav.map((item) => {
          const active = item.id === activeNav;
          return (
            <button
              key={item.id}
              type="button"
              data-nav={item.id}
              data-active={active}
              aria-current={active ? "page" : undefined}
              onClick={() => onNavSelect(item.id)}
              className={cn(
                navBase,
                active && navActive,
                collapsed && "justify-center px-0",
              )}
            >
              <span className="flex-none text-[var(--text-3)] group-[[data-active=true]]:text-[var(--text-2)]">
                {item.icon}
              </span>
              {!collapsed && (
                <span className="flex-1 truncate text-[14px]">
                  {item.label}
                </span>
              )}
              {!collapsed && item.kbd && (
                <span className="rounded-md border border-[var(--border)] bg-[var(--hover)] px-[6px] py-[2px] font-[var(--font-mono)] text-[11px] text-[var(--text-3)]">
                  {item.kbd}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* ---- recents + projects list ---- */}
      {!collapsed && (
        <div className="-mx-1 mt-[6px] flex flex-1 flex-col gap-[2px] overflow-y-auto px-1">
          {groups.map(({ group, items }) => (
            <React.Fragment key={group}>
              <div className="flex items-center gap-2 px-[9px] pb-[5px] pt-[15px] text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-3)]">
                {group === "pinned" && <StarIcon small />}
                <span>{GROUP_LABEL[group]}</span>
                {(group === "today" || group === "previous7") && (
                  <span className="ml-auto font-medium">{items.length}</span>
                )}
              </div>

              {items.map((chat) =>
                renamingId === chat.id ? (
                  <RenameRow
                    key={chat.id}
                    chat={chat}
                    onCommit={(raw) => commitRename(chat, raw)}
                    onCancel={() => setRenamingId(null)}
                  />
                ) : (
                  <div
                    key={chat.id}
                    role="button"
                    tabIndex={0}
                    data-recent={chat.id}
                    onDoubleClick={() => setRenamingId(chat.id)}
                    className={cn(navBase, "cursor-pointer")}
                  >
                    <ChatIcon />
                    <span className="min-w-0 flex-1 truncate text-[14px]">
                      {chat.title}
                    </span>
                    {chat.pinned ? (
                      <span className="flex-none text-[var(--text-3)]">
                        <StarIcon small />
                      </span>
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            aria-label={`Chat options for ${chat.title}`}
                            onClick={(e) => e.stopPropagation()}
                            className="ml-auto grid h-[22px] w-[22px] flex-none place-items-center rounded-md text-[var(--text-3)] opacity-0 transition-opacity hover:bg-[var(--active)] hover:text-[var(--text)] group-hover:opacity-100 focus-visible:opacity-100"
                          >
                            <DotsIcon />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem
                            onSelect={() => onChatAction(chat.id, "pin")}
                          >
                            <StarIcon small />
                            Pin
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => setRenamingId(chat.id)}
                          >
                            <RenameIcon />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => onChatAction(chat.id, "archive")}
                          >
                            <ArchiveIcon />
                            Archive
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="danger"
                            data-danger="true"
                            onSelect={() => onChatAction(chat.id, "delete")}
                          >
                            <ArchiveIcon />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                ),
              )}
            </React.Fragment>
          ))}

          {projects.length > 0 && (
            <>
              <div className="flex items-center gap-2 px-[9px] pb-[5px] pt-[15px] text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-3)]">
                <FolderIcon small />
                <span>Projects</span>
              </div>
              {projects.map((p) => (
                <div
                  key={p.id}
                  role="button"
                  tabIndex={0}
                  className={cn(navBase, "cursor-pointer")}
                >
                  <span className="flex-none text-[var(--text-3)]">
                    <FolderIcon />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[14px]">
                    {p.name}
                  </span>
                  <span className="inline-flex h-5 items-center rounded-full border border-[var(--border)] bg-[var(--hover)] px-2 text-[11px] font-semibold text-[var(--text-2)]">
                    {p.count}
                  </span>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* collapsed spacer keeps account chip pinned to bottom */}
      {collapsed && <div className="flex-1" />}

      {/* ---- account ---- */}
      <div className="mt-[6px] flex flex-col gap-[2px] border-t border-[var(--border)] pt-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={`Account menu for ${account.name}`}
              className={cn(
                "flex items-center gap-[10px] rounded-[var(--radius-sm)] px-2 py-[7px] hover:bg-[var(--hover)]",
                collapsed && "justify-center px-0",
              )}
            >
              <span
                className="grid h-7 w-7 flex-none place-items-center rounded-full text-[12px] font-bold text-white"
                style={{
                  background: "linear-gradient(135deg,#6a7788,#3d4653)",
                }}
              >
                {account.initials}
              </span>
              {!collapsed && (
                <>
                  <span className="min-w-0 leading-[1.25]">
                    <span className="block truncate text-[13px] font-semibold text-[var(--text)]">
                      {account.name}
                    </span>
                    <span className="block text-[11.5px] text-[var(--text-3)]">
                      {account.plan}
                    </span>
                  </span>
                  <span className="ml-auto text-[var(--text-3)]">
                    <ChevronUpDownIcon />
                  </span>
                </>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onSelect={() => onAccountAction("profile")}>
              <ProfileIcon />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onAccountAction("settings")}>
              <GearIcon small />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onAccountAction("upgrade")}>
              <UpgradeIcon />
              Upgrade plan
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => onAccountAction("logout")}>
              <LogoutIcon />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          type="button"
          aria-label="Settings"
          onClick={() => onAccountAction("settings")}
          className={cn(navBase, collapsed && "justify-center px-0")}
        >
          <GearIcon />
          {!collapsed && (
            <span className="flex-1 truncate text-[14px]">Settings</span>
          )}
        </button>
      </div>
    </aside>
  );
}

// ---- inline rename row -----------------------------------------------------
interface RenameRowProps {
  chat: RecentChat;
  onCommit: (raw: string) => void;
  onCancel: () => void;
}
function RenameRow({ chat, onCommit, onCancel }: RenameRowProps) {
  const [value, setValue] = React.useState(chat.title);
  const committedRef = React.useRef(false);

  function finish(raw: string) {
    if (committedRef.current) return;
    committedRef.current = true;
    onCommit(raw);
  }

  return (
    <div className={cn(navBase, "cursor-default")}>
      <ChatIcon />
      <Input
        autoFocus
        aria-label="Rename chat"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={(e) => e.currentTarget.select()}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === "Enter") {
            e.preventDefault();
            finish(value);
          } else if (e.key === "Escape") {
            e.preventDefault();
            committedRef.current = true;
            onCancel();
          }
        }}
        onBlur={() => finish(value)}
        className="h-auto min-w-0 flex-1 rounded-md border border-[var(--accent-line)] bg-[var(--surface)] px-[7px] py-[2px] text-[14px] text-[var(--text)]"
      />
    </div>
  );
}
