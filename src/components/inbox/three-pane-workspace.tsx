"use client";

import React from "react";
import { EmailThread } from "@/types/email";
import { ThreadFeedList } from "./thread-feed-list";
import { ThreadReader } from "./thread-reader";
import { Inbox, ArrowLeft, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ThreePaneWorkspaceProps {
  initialThreads?: EmailThread[];
  initialThreadId?: string;
  initialAction?: string;
}

export function ThreePaneWorkspace({
  initialThreads = [],
  initialThreadId,
  initialAction,
}: ThreePaneWorkspaceProps) {
  const [threads, setThreads] = React.useState<EmailThread[]>(initialThreads);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [activeFilter, setActiveFilter] = React.useState<"all" | "urgent" | "action_needed" | "vip" | "archived">("all");
  const [activeThreadId, setActiveThreadId] = React.useState<string>(initialThreadId || "");
  const [isMobileViewThread, setIsMobileViewThread] = React.useState(!!initialThreadId);

  // Fetch threads on workspace mount
  React.useEffect(() => {
    let ignore = false;

    async function loadWorkspaceData() {
      try {
        const res = await fetch("/api/gmail/threads");
        if (res.ok && !ignore) {
          const data = await res.json();
          setIsSyncing(!!data.isSyncing);
          if (data.threads) {
            setThreads(data.threads);
            if (data.threads.length > 0 && (!initialThreadId || !data.threads.some((t: EmailThread) => t.id === initialThreadId))) {
              setActiveThreadId(data.threads[0].id);
            }
          }
        }
      } catch (err) {
        console.error("[Workspace] Error loading threads from database:", err);
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    loadWorkspaceData();

    return () => {
      ignore = true;
    };
  }, [initialThreadId]);

  // Poll while syncing
  React.useEffect(() => {
    if (!isSyncing) return;

    let ignore = false;
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/gmail/threads");
        if (res.ok && !ignore) {
          const data = await res.json();
          setIsSyncing(!!data.isSyncing);
          if (data.threads) {
            setThreads(data.threads);
          }
        }
      } catch (err) {
        console.error("[Workspace] Error polling threads:", err);
      }
    }, 3000);

    return () => {
      ignore = true;
      clearInterval(interval);
    };
  }, [isSyncing]);

  const filteredThreads = threads.filter((t) => {
    if (activeFilter === "urgent") return t.priority === "urgent";
    if (activeFilter === "action_needed") return t.category === "action_required";
    if (activeFilter === "vip") return t.category === "vip";
    if (activeFilter === "archived") return t.isArchived;
    return !t.isArchived;
  });

  const activeThread = filteredThreads.find((t) => t.id === activeThreadId) || filteredThreads[0];

  const handleFilterChange = (filterStr: string) => {
    const validFilter = filterStr as "all" | "urgent" | "action_needed" | "vip" | "archived";
    setActiveFilter(validFilter);
    const updatedFiltered = threads.filter((t) => {
      if (validFilter === "urgent") return t.priority === "urgent";
      if (validFilter === "action_needed") return t.category === "action_required";
      if (validFilter === "vip") return t.category === "vip";
      if (validFilter === "archived") return t.isArchived;
      return !t.isArchived;
    });
    if (updatedFiltered.length > 0) {
      setActiveThreadId(updatedFiltered[0].id);
    }
  };

  const handleThreadUpdated = React.useCallback(async () => {
    try {
      const res = await fetch("/api/gmail/threads");
      if (res.ok) {
        const data = await res.json();
        if (data.threads) setThreads(data.threads);
      }
    } catch (err) {
      console.error("[Workspace] Error refreshing threads:", err);
    }
  }, []);

  // Keyboard navigation shortcuts: J (Next), K (Prev)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (e.key === "j" || e.key === "J") {
        e.preventDefault();
        const currIdx = filteredThreads.findIndex((t) => t.id === activeThreadId);
        if (currIdx < filteredThreads.length - 1) {
          setActiveThreadId(filteredThreads[currIdx + 1].id);
        }
      } else if (e.key === "k" || e.key === "K") {
        e.preventDefault();
        const currIdx = filteredThreads.findIndex((t) => t.id === activeThreadId);
        if (currIdx > 0) {
          setActiveThreadId(filteredThreads[currIdx - 1].id);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [filteredThreads, activeThreadId]);

  const handleSelectThread = (id: string) => {
    setActiveThreadId(id);
    setIsMobileViewThread(true);
  };

  // Syncing or Initial Loading State
  if (isLoading || (isSyncing && threads.length === 0)) {
    return (
      <div className="flex h-[calc(100vh-56px-3rem)] flex-col items-center justify-center rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md p-8 text-center shadow-elevation">
        <div className="flex flex-col items-center space-y-4 max-w-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600/10 dark:bg-indigo-600/20 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 animate-pulse">
            <Sparkles className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Syncing Your Live Gmail Inbox
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Fetching up to 100 recent threads and populating PostgreSQL database cache...
            </p>
          </div>
          <div className="flex items-center space-x-2 text-xs text-indigo-600 dark:text-indigo-400 font-medium">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Connecting to Gmail REST API...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-56px-3rem)] rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-950/80 backdrop-blur-md overflow-hidden shadow-elevation transition-colors duration-200">
      {/* Pane 2: Thread Feed List */}
      <div
        className={`w-full lg:w-[380px] shrink-0 ${
          isMobileViewThread ? "hidden lg:block" : "block"
        }`}
      >
        <ThreadFeedList
          threads={filteredThreads}
          activeThreadId={activeThread?.id}
          onSelectThread={handleSelectThread}
          activeFilter={activeFilter}
          onFilterChange={handleFilterChange}
        />
      </div>

      {/* Pane 3: Active Thread Reader & AI Workspace */}
      <div
        className={`flex-1 min-w-0 ${
          !isMobileViewThread ? "hidden lg:block" : "block"
        }`}
      >
        {activeThread ? (
          <div className="flex flex-col h-full">
            {/* Mobile Back Button Header */}
            <div className="lg:hidden p-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileViewThread(false)}
                className="text-xs text-slate-700 dark:text-slate-300"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                <span>Back to Feed</span>
              </Button>
            </div>

            <ThreadReader
              thread={activeThread}
              onThreadUpdated={handleThreadUpdated}
              autoOpenReply={initialAction === "reply"}
            />
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center text-slate-500">
            <Inbox className="h-10 w-10 text-slate-400 dark:text-slate-600 mb-3" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No Thread Selected</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              Select an email from the feed list to view AI summaries and draft responses.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
