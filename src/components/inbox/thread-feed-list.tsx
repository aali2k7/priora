"use client";

import React from "react";
import { EmailThread } from "@/types/email";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabTrigger } from "@/components/ui/tabs";
import { Search, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThreadFeedListProps {
  threads: EmailThread[];
  activeThreadId?: string;
  onSelectThread: (id: string) => void;
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

export function ThreadFeedList({
  threads,
  activeThreadId,
  onSelectThread,
  activeFilter,
  onFilterChange,
}: ThreadFeedListProps) {
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredThreads = threads.filter((t) => {
    const matchesSearch =
      t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.snippet.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.participants.some((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesSearch;
  });

  return (
    <div className="flex flex-col h-full border-r border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/60 min-w-0">
      {/* Header & Filter Tabs */}
      <div className="p-3.5 space-y-3 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Priority Feed
          </h2>
          <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400 bg-slate-200/50 dark:bg-slate-800/60 px-2 py-0.5 rounded-full">
            {filteredThreads.length} threads
          </span>
        </div>

        {/* Filter Tabs */}
        <div className="overflow-x-auto custom-scrollbar">
          <Tabs value={activeFilter} onValueChange={onFilterChange} className="w-full">
            <TabTrigger value="all">All</TabTrigger>
            <TabTrigger value="urgent">Urgent</TabTrigger>
            <TabTrigger value="action_needed">Action Needed</TabTrigger>
            <TabTrigger value="vip">VIP</TabTrigger>
            <TabTrigger value="archived">Archived</TabTrigger>
          </Tabs>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search feed..."
            className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus-ring shadow-2xs transition-colors"
          />
        </div>
      </div>

      {/* Thread List Items */}
      <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-slate-100 dark:divide-slate-800/40">
        {filteredThreads.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No threads match active filter.
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
                    <span className="text-xs font-semibold text-slate-900 dark:text-slate-200 truncate">
                      {thread.participants[0]?.name}
                    </span>
                    {thread.priority === "urgent" && <Badge variant="urgent">Urgent</Badge>}
                    {thread.category === "vip" && <Badge variant="vip">VIP</Badge>}
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {thread.lastMessageTimestamp}
                  </span>
                </div>

                <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate mt-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
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
                      Pending AI
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
