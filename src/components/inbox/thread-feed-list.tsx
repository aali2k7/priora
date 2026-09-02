"use client";

import React from "react";
import { EmailThread } from "@/types/email";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export type ViewMode = "inbox" | "focused" | "archived" | "scheduled";
export type InboxSubFilter = "all" | "unread";
export type FocusedSubFilter = "all" | "urgent" | "action_needed" | "vip";

interface ThreadFeedListProps {
  threads: EmailThread[];
  totalInboxCount: number;
  totalFocusedCount: number;
  totalArchivedCount: number;
  activeThreadId?: string;
  onSelectThread: (id: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  inboxFilter: InboxSubFilter;
  onInboxFilterChange: (filter: InboxSubFilter) => void;
  focusedFilter: FocusedSubFilter;
  onFocusedFilterChange: (filter: FocusedSubFilter) => void;
}

export function ThreadFeedList({
  threads,
  totalInboxCount,
  totalFocusedCount,
  totalArchivedCount,
  activeThreadId,
  onSelectThread,
  viewMode,
  onViewModeChange,
  inboxFilter,
  onInboxFilterChange,
  focusedFilter,
  onFocusedFilterChange,
}: ThreadFeedListProps) {
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredThreads = threads.filter((t) => {
    const query = searchQuery.toLowerCase();
    return (
      t.subject.toLowerCase().includes(query) ||
      t.snippet.toLowerCase().includes(query) ||
      t.participants.some(
        (p) => p.name.toLowerCase().includes(query) || p.email.toLowerCase().includes(query)
      )
    );
  });

  return (
    <div className="flex flex-col h-full bg-[var(--bg-surface)] min-w-0 select-none">
      {/* Top Header Section & View Switcher */}
      <div className="p-3 border-b border-[var(--border-subtle)] space-y-2.5 bg-[var(--bg-surface)]">
        {/* Primary View Switcher: Inbox | Focused | Archived */}
        <div className="flex items-center p-0.5 rounded-md bg-[var(--bg-canvas)] border border-[var(--border-subtle)]">
          <button
            onClick={() => onViewModeChange("inbox")}
            className={cn(
              "flex-1 py-1 px-2 text-center text-xs rounded transition-colors cursor-pointer font-medium",
              viewMode === "inbox"
                ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs font-semibold"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            )}
          >
            <span>Inbox</span>
            <span className="text-[10px] ml-1 text-[var(--text-muted)]">({totalInboxCount})</span>
          </button>

          <button
            onClick={() => onViewModeChange("focused")}
            className={cn(
              "flex-1 py-1 px-2 text-center text-xs rounded transition-colors cursor-pointer font-medium",
              viewMode === "focused"
                ? "bg-[var(--bg-surface)] text-[#3F5F8F] dark:text-[#7CA1D8] shadow-xs font-semibold"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            )}
          >
            <span>Focused</span>
            <span className="text-[10px] ml-1 text-[var(--text-muted)]">({totalFocusedCount})</span>
          </button>

          <button
            onClick={() => onViewModeChange("archived")}
            className={cn(
              "flex-1 py-1 px-2 text-center text-xs rounded transition-colors cursor-pointer font-medium",
              viewMode === "archived"
                ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs font-semibold"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            )}
          >
            <span>Archived</span>
            <span className="text-[10px] ml-1 text-[var(--text-muted)]">({totalArchivedCount})</span>
          </button>
        </div>

        {/* Sub-Filters */}
        {viewMode === "focused" && (
          <div className="flex items-center space-x-1 overflow-x-auto custom-scrollbar pb-0.5">
            {(
              [
                { id: "all", label: "All Focused" },
                { id: "urgent", label: "Urgent" },
                { id: "action_needed", label: "Needs Action" },
                { id: "vip", label: "VIP" },
              ] as const
            ).map((filter) => (
              <button
                key={filter.id}
                onClick={() => onFocusedFilterChange(filter.id)}
                className={cn(
                  "px-2 py-0.5 rounded text-[11px] font-medium shrink-0 transition-colors cursor-pointer",
                  focusedFilter === filter.id
                    ? "bg-[var(--bg-surface-selected)] text-[#3F5F8F] dark:text-[#7CA1D8] font-semibold"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        )}

        {viewMode === "inbox" && (
          <div className="flex items-center space-x-1 overflow-x-auto custom-scrollbar pb-0.5">
            {(
              [
                { id: "all", label: "All Mail" },
                { id: "unread", label: "Unread" },
              ] as const
            ).map((filter) => (
              <button
                key={filter.id}
                onClick={() => onInboxFilterChange(filter.id)}
                className={cn(
                  "px-2 py-0.5 rounded text-[11px] font-medium shrink-0 transition-colors cursor-pointer",
                  inboxFilter === filter.id
                    ? "bg-[var(--bg-surface-selected)] text-[#3F5F8F] dark:text-[#7CA1D8] font-semibold"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        )}

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Filter ${viewMode}...`}
            className="w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-canvas)] pl-8 pr-2.5 py-1 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus-ring transition-colors"
          />
        </div>
      </div>

      {/* Structured List of Emails */}
      <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-[var(--border-subtle)]">
        {filteredThreads.length === 0 ? (
          <div className="p-8 text-center text-xs text-[var(--text-muted)]">
            {viewMode === "focused"
              ? "No focused emails matching active filter."
              : "No emails in this view."}
          </div>
        ) : (
          filteredThreads.map((thread) => {
            const isSelected = thread.id === activeThreadId;
            const senderName = thread.participants[0]?.name || "Unknown";
            const isUrgent = thread.priority === "urgent" || (typeof thread.urgencyScore === "number" && thread.urgencyScore >= 75);
            const isAction = thread.actionRequired === true || thread.category === "action_required";
            const isVip = thread.category === "vip" || thread.participants.some((p) => p.isVIP);

            return (
              <button
                key={thread.id}
                onClick={() => onSelectThread(thread.id)}
                className={cn(
                  "w-full text-left p-3 transition-colors duration-100 relative group cursor-pointer",
                  isSelected
                    ? "bg-[var(--bg-surface-selected)]"
                    : "hover:bg-[var(--bg-surface-hover)] bg-[var(--bg-surface)]"
                )}
              >
                {/* Thin Left Selection Accent Indicator */}
                {isSelected && (
                  <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#3F5F8F] dark:bg-[#7CA1D8]" />
                )}

                {/* Top Row: Sender + Indicators + Timestamp */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-1.5 min-w-0">
                    {/* Unread dot */}
                    {thread.isUnread && (
                      <span className="h-1.5 w-1.5 rounded-full bg-[#3F5F8F] dark:bg-[#7CA1D8] shrink-0" />
                    )}

                    <span
                      className={cn(
                        "text-xs truncate",
                        thread.isUnread
                          ? "font-bold text-[var(--text-primary)]"
                          : "font-medium text-[var(--text-primary)]"
                      )}
                    >
                      {senderName}
                    </span>

                    {/* Tiny Semantic Status Dots */}
                    {isUrgent && (
                      <span className="h-1.5 w-1.5 rounded-full bg-[#B83A3A] shrink-0" title="Urgent" />
                    )}
                    {isAction && !isUrgent && (
                      <span className="h-1.5 w-1.5 rounded-full bg-[#A56B20] shrink-0" title="Action Needed" />
                    )}
                    {isVip && (
                      <span className="text-[9px] font-mono px-1 rounded bg-[var(--status-ai-subtle)] text-[#526B9E] shrink-0">
                        VIP
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] text-[var(--text-muted)] shrink-0 font-normal">
                    {thread.lastMessageTimestamp}
                  </span>
                </div>

                {/* Subject Line */}
                <p
                  className={cn(
                    "text-xs truncate mt-0.5",
                    thread.isUnread
                      ? "font-semibold text-[var(--text-primary)]"
                      : "font-normal text-[var(--text-primary)]"
                  )}
                >
                  {thread.subject}
                </p>

                {/* Snippet Line */}
                <p className="text-[11px] text-[var(--text-secondary)] line-clamp-1 mt-0.5 font-normal leading-relaxed">
                  {thread.snippet}
                </p>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
