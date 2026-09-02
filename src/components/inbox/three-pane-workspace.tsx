"use client";

import React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { EmailThread } from "@/types/email";
import { ThreadFeedList, ViewMode, FocusedSubFilter, InboxSubFilter } from "./thread-feed-list";
import { ThreadReader } from "./thread-reader";
import { ScheduledOutboxView } from "./scheduled-outbox-view";
import { Inbox, ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

import { getCachedThreads, setCachedThreads } from "@/lib/client-cache";

interface ThreePaneWorkspaceProps {
  initialThreads?: EmailThread[];
  initialThreadId?: string;
  initialAction?: string;
  initialView?: ViewMode;
}

export function ThreePaneWorkspace({
  initialThreads = [],
  initialThreadId,
  initialAction,
  initialView = "inbox",
}: ThreePaneWorkspaceProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlView = (searchParams.get("view") as ViewMode) || null;

  const [threads, setThreads] = React.useState<EmailThread[]>(initialThreads);
  const [isLoading, setIsLoading] = React.useState(initialThreads.length === 0);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [internalViewMode, setInternalViewMode] = React.useState<ViewMode>(initialView);
  const viewMode = urlView || internalViewMode;

  const [inboxFilter, setInboxFilter] = React.useState<InboxSubFilter>("all");
  const [focusedFilter, setFocusedFilter] = React.useState<FocusedSubFilter>("all");
  const [activeThreadId, setActiveThreadId] = React.useState<string>(initialThreadId || "");
  const [isMobileViewThread, setIsMobileViewThread] = React.useState(!!initialThreadId);

  // 1. Instant Cache Restoration on Browser Mount
  React.useEffect(() => {
    const cached = getCachedThreads();
    if (cached && cached.length > 0) {
      setThreads(cached);
      setIsLoading(false);
      if (!initialThreadId || !cached.some((t: EmailThread) => t.id === initialThreadId)) {
        setActiveThreadId((prev) => prev || cached[0].id);
      }
    }
  }, [initialThreadId]);

  // 2. Fetch threads on mount and setup 10-minute cadence & event listeners
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
            setCachedThreads(data.threads);
            if (
              data.threads.length > 0 &&
              (!initialThreadId || !data.threads.some((t: EmailThread) => t.id === initialThreadId))
            ) {
              setActiveThreadId((prev) => prev || data.threads[0].id);
            }
          }
        }
      } catch (err) {
        console.error("[Workspace] Error loading threads:", err);
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    loadWorkspaceData();

    const handleRefresh = () => {
      loadWorkspaceData();
    };

    window.addEventListener("priora-email-sent", handleRefresh);
    window.addEventListener("priora-email-synced", handleRefresh);

    // 3. Connect to real-time push event stream (SSE)
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource("/api/events");
      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === "new-email" || payload.type === "sync-complete") {
            console.log("[Workspace] Real-time email push received via SSE:", payload);
            loadWorkspaceData();
          }
        } catch {
          // heartbeat or non-json message
        }
      };
    } catch (sseErr) {
      console.warn("[Workspace] SSE connection warning:", sseErr);
    }

    return () => {
      ignore = true;
      window.removeEventListener("priora-email-sent", handleRefresh);
      window.removeEventListener("priora-email-synced", handleRefresh);
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [initialThreadId]);

  // One-time sync check only if inbox is completely empty and initial background sync is running
  React.useEffect(() => {
    if (!isSyncing || threads.length > 0) return;

    let ignore = false;
    let timerId: NodeJS.Timeout;

    const pollInitialSync = async () => {
      try {
        const res = await fetch("/api/gmail/threads");
        if (res.ok && !ignore) {
          const data = await res.json();
          setIsSyncing(!!data.isSyncing);
          if (data.threads && data.threads.length > 0) {
            setThreads(data.threads);
            setCachedThreads(data.threads);
            setActiveThreadId((prev) => prev || data.threads[0]?.id || "");
          }
        }
      } catch (err) {
        console.error("[Workspace] Error checking initial sync:", err);
      }
    };

    timerId = setTimeout(pollInitialSync, 5000);

    return () => {
      ignore = true;
      clearTimeout(timerId);
    };
  }, [isSyncing, threads.length]);

  // Qualification for FOCUSED view derived from real persisted AI analysis
  const isThreadFocused = (t: EmailThread): boolean => {
    if (t.isArchived) return false;
    if (!t.analyzedAt) return false;

    const hasHighUrgency = typeof t.urgencyScore === "number" && t.urgencyScore >= 60;
    const hasHighImportance = typeof t.importanceScore === "number" && t.importanceScore >= 60;
    const isUrgentPriority = t.priority === "urgent" || t.priority === "high";
    const isActionCategory =
      t.category === "action_required" || t.category === "deadline_today" || t.category === "vip";
    const hasActionRequired = t.actionRequired === true;

    return (
      hasHighUrgency || hasHighImportance || isUrgentPriority || isActionCategory || hasActionRequired
    );
  };

  // Filter threads based on active viewMode and subFilters
  const filteredThreads = React.useMemo(() => {
    if (viewMode === "archived") {
      return threads.filter((t) => t.isArchived);
    }

    if (viewMode === "focused") {
      const focusedThreads = threads.filter(isThreadFocused);
      if (focusedFilter === "urgent") {
        return focusedThreads.filter(
          (t) =>
            t.priority === "urgent" ||
            (typeof t.urgencyScore === "number" && t.urgencyScore >= 75)
        );
      }
      if (focusedFilter === "action_needed") {
        return focusedThreads.filter(
          (t) => t.actionRequired === true || t.category === "action_required"
        );
      }
      if (focusedFilter === "vip") {
        return focusedThreads.filter((t) => t.category === "vip" || t.participants.some((p) => p.isVIP));
      }
      return focusedThreads;
    }

    // Default: Inbox (all non-archived threads within 15-day dataset)
    const inboxThreads = threads.filter((t) => !t.isArchived);
    if (inboxFilter === "unread") {
      return inboxThreads.filter((t) => t.isUnread);
    }
    return inboxThreads;
  }, [threads, viewMode, inboxFilter, focusedFilter]);

  const activeThread =
    filteredThreads.find((t) => t.id === activeThreadId) || filteredThreads[0];

  const handleViewModeChange = (mode: ViewMode) => {
    setInternalViewMode(mode);
    router.replace(`/inbox?view=${mode}`, { scroll: false });
    const targetThreads = threads.filter((t) => {
      if (mode === "archived") return t.isArchived;
      if (mode === "focused") return isThreadFocused(t);
      return !t.isArchived;
    });
    if (targetThreads.length > 0) {
      setActiveThreadId(targetThreads[0].id);
    }
  };

  const handleThreadUpdated = React.useCallback(async () => {
    try {
      const res = await fetch("/api/gmail/threads");
      if (res.ok) {
        const data = await res.json();
        if (data.threads) {
          setThreads(data.threads);
          setCachedThreads(data.threads);
        }
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
      <div className="flex h-full flex-col items-center justify-center p-8 text-center bg-[var(--bg-canvas)]">
        <div className="flex flex-col items-center space-y-3 max-w-sm">
          <RefreshCw className="h-5 w-5 animate-spin text-[#3F5F8F]" />
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              Loading Inbox
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Fetching 15-day rolling working dataset from local storage...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Scheduled Outbox Management View
  if (viewMode === "scheduled") {
    return (
      <div className="flex h-full w-full bg-[var(--bg-canvas)] overflow-hidden">
        <div className="flex-1 min-w-0 h-full overflow-hidden">
          <ScheduledOutboxView />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full bg-[var(--bg-canvas)] overflow-hidden">
      {/* Left Pane: Thread Feed List (Table-like, Enterprise Proportions) */}
      <div
        className={`w-full lg:w-[380px] xl:w-[420px] shrink-0 h-full border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] ${
          isMobileViewThread ? "hidden lg:block" : "block"
        }`}
      >
        <ThreadFeedList
          threads={filteredThreads}
          totalInboxCount={threads.filter((t) => !t.isArchived).length}
          totalFocusedCount={threads.filter(isThreadFocused).length}
          totalArchivedCount={threads.filter((t) => t.isArchived).length}
          activeThreadId={activeThread?.id}
          onSelectThread={handleSelectThread}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          inboxFilter={inboxFilter}
          onInboxFilterChange={setInboxFilter}
          focusedFilter={focusedFilter}
          onFocusedFilterChange={setFocusedFilter}
        />
      </div>

      {/* Right Pane: Active Thread Reader & Conversation Timeline */}
      <div
        className={`flex-1 min-w-0 h-full bg-[var(--bg-canvas)] overflow-hidden ${
          !isMobileViewThread ? "hidden lg:block" : "block"
        }`}
      >
        {activeThread ? (
          <div className="flex flex-col h-full">
            {/* Mobile Back Button Header */}
            <div className="lg:hidden p-2 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileViewThread(false)}
                className="text-xs text-[var(--text-secondary)]"
              >
                <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                <span>Back to list</span>
              </Button>
            </div>

            <ThreadReader
              thread={activeThread}
              onThreadUpdated={handleThreadUpdated}
              autoOpenReply={initialAction === "reply"}
            />
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center text-[var(--text-muted)] bg-[var(--bg-canvas)]">
            <Inbox className="h-8 w-8 text-[var(--text-muted)] mb-2" />
            <p className="text-sm font-semibold text-[var(--text-primary)]">No conversation selected</p>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5 max-w-sm">
              Select an email thread from the left list to read messages and AI summaries.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
