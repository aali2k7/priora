"use client";

import React from "react";
import { EmailThread } from "@/types/email";
import { Badge } from "@/components/ui/badge";
import { Search, Sparkles, Inbox, Zap, Archive, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export type ViewMode = "inbox" | "focused" | "archived";
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
    const matchesSearch =
      t.subject.toLowerCase().includes(query) ||
      t.snippet.toLowerCase().includes(query) ||
      t.participants.some((p) => p.name.toLowerCase().includes(query) || p.email.toLowerCase().includes(query));

    return matchesSearch;
  });

  return (
    <div className="flex flex-col h-full border-r border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/60 min-w-0">
      {/* Primary View Switcher: INBOX vs FOCUSED vs ARCHIVED */}
      <div className="p-3 space-y-2.5 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/60">
        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
          <button
            onClick={() => onViewModeChange("inbox")}
            className={cn(
              "flex items-center justify-center space-x-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer",
              viewMode === "inbox"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            )}
          >
            <Inbox className="h-3.5 w-3.5" />
            <span>Inbox</span>
            <span className="text-[10px] opacity-70">({totalInboxCount})</span>
          </button>

          <button
            onClick={() => onViewModeChange("focused")}
            className={cn(
              "flex items-center justify-center space-x-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer",
              viewMode === "focused"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            )}
          >
            <Zap className="h-3.5 w-3.5" />
            <span>Focused</span>
            <span className="text-[10px] opacity-70">({totalFocusedCount})</span>
          </button>

          <button
            onClick={() => onViewModeChange("archived")}
            className={cn(
              "flex items-center justify-center space-x-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer",
              viewMode === "archived"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            )}
          >
            <Archive className="h-3.5 w-3.5" />
            <span>Archived</span>
            <span className="text-[10px] opacity-70">({totalArchivedCount})</span>
          </button>
        </div>

        {/* Sub-Filters */}
        {viewMode === "focused" && (
          <div className="flex items-center space-x-1 overflow-x-auto custom-scrollbar pb-0.5">
            {(
              [
                { id: "all", label: "All Focused" },
                { id: "urgent", label: "Urgent" },
                { id: "action_needed", label: "Action Needed" },
                { id: "vip", label: "VIP" },
              ] as const
            ).map((filter) => (
              <button
                key={filter.id}
                onClick={() => onFocusedFilterChange(filter.id)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-[11px] font-medium shrink-0 transition-colors cursor-pointer",
                  focusedFilter === filter.id
                    ? "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 font-semibold"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
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
                { id: "unread", label: "Unread Only" },
              ] as const
            ).map((filter) => (
              <button
                key={filter.id}
                onClick={() => onInboxFilterChange(filter.id)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-[11px] font-medium shrink-0 transition-colors cursor-pointer",
                  inboxFilter === filter.id
                    ? "bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        )}

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search in ${viewMode}...`}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus-ring shadow-2xs transition-colors"
          />
        </div>
      </div>

      {/* Thread List Items */}
      <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-slate-100 dark:divide-slate-800/40">
        {filteredThreads.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            {viewMode === "focused"
              ? "No focused threads match active filter. Threads analyzed with high priority or action items will appear here."
              : "No threads found in active view."}
          </div>
        ) : (
          filteredThreads.map((thread) => {
            const isSelected = thread.id === activeThreadId;

            return (
              <button
                key={thread.id}
                onClick={() => onSelectThread(thread.id)}
                className={cn(
                  "w-full text-left p-3.5 transition-all duration-150 focus-ring relative group cursor-pointer",
                  isSelected
                    ? "bg-indigo-500/10 dark:bg-slate-800/90 shadow-2xs"
                    : "hover:bg-slate-100/60 dark:hover:bg-slate-900/70"
                )}
              >
                {isSelected && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-indigo-600 dark:bg-indigo-500" />
                )}

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-2 min-w-0">
                    <span className={cn(
                      "text-xs truncate",
                      thread.isUnread ? "font-bold text-slate-900 dark:text-slate-100" : "font-medium text-slate-700 dark:text-slate-300"
                    )}>
                      {thread.participants[0]?.name || "Sender"}
                    </span>
                    {thread.priority === "urgent" && <Badge variant="urgent">Urgent</Badge>}
                    {thread.category === "vip" && <Badge variant="vip">VIP</Badge>}
                    {thread.actionRequired && <Badge variant="default">Action</Badge>}
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {thread.lastMessageTimestamp}
                  </span>
                </div>

                <p className={cn(
                  "text-xs truncate mt-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors",
                  thread.isUnread ? "font-semibold text-slate-900 dark:text-slate-100" : "font-normal text-slate-700 dark:text-slate-300"
                )}>
                  {thread.subject}
                </p>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed font-normal">
                  {thread.snippet}
                </p>

                <div className="flex items-center space-x-2 mt-2 pt-1">
                  {thread.analyzedAt ? (
                    <span className="inline-flex items-center text-[10px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                      <Sparkles className="h-2.5 w-2.5 mr-1 text-emerald-600 dark:text-emerald-400" />
                      AI Analyzed {typeof thread.urgencyScore === "number" ? `• ${thread.urgencyScore}/100` : ""}
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700/60">
                      <Clock className="h-2.5 w-2.5 mr-1 text-slate-400" />
                      Analysis pending
                    </span>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
