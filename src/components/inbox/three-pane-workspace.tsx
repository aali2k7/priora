"use client";

import React from "react";
import { EmailThread } from "@/types/email";
import { ThreadFeedList } from "./thread-feed-list";
import { ThreadReader } from "./thread-reader";
import { EmailService } from "@/lib/email-service";
import { Inbox, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ThreePaneWorkspaceProps {
  initialThreads: EmailThread[];
  initialThreadId?: string;
  initialAction?: string;
}

export function ThreePaneWorkspace({
  initialThreads,
  initialThreadId,
  initialAction,
}: ThreePaneWorkspaceProps) {
  const [threads, setThreads] = React.useState<EmailThread[]>(initialThreads);
  const [activeFilter, setActiveFilter] = React.useState<"all" | "urgent" | "action_needed" | "vip" | "archived">("all");
  const [activeThreadId, setActiveThreadId] = React.useState<string>(
    initialThreadId || initialThreads[0]?.id || ""
  );
  const [isMobileViewThread, setIsMobileViewThread] = React.useState(!!initialThreadId);

  // Fetch live Gmail threads on workspace mount
  React.useEffect(() => {
    let isMounted = true;
    fetch("/api/gmail/threads")
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.threads && data.threads.length > 0) {
          setThreads(data.threads);
          if (!initialThreadId || !data.threads.some((t: EmailThread) => t.id === initialThreadId)) {
            setActiveThreadId(data.threads[0].id);
          }
        }
      })
      .catch((err) => console.error("[Workspace] Error loading Gmail threads:", err));

    return () => {
      isMounted = false;
    };
  }, [initialThreadId]);

  const activeThread = threads.find((t) => t.id === activeThreadId);

  const handleFilterChange = (filterStr: string) => {
    const validFilter = filterStr as "all" | "urgent" | "action_needed" | "vip" | "archived";
    setActiveFilter(validFilter);
    EmailService.getThreads(validFilter).then((updated) => {
      setThreads(updated);
      if (updated.length > 0 && !updated.some((t) => t.id === activeThreadId)) {
        setActiveThreadId(updated[0].id);
      }
    });
  };

  const handleThreadUpdated = React.useCallback(async () => {
    const updated = await EmailService.getThreads(activeFilter);
    setThreads(updated);
    if (updated.length > 0 && !updated.some((t) => t.id === activeThreadId)) {
      setActiveThreadId(updated[0].id);
    }
  }, [activeFilter, activeThreadId]);

  // Keyboard navigation shortcuts: J (Next), K (Prev), E (Archive), R (Reply), S (Snooze)
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
        const currIdx = threads.findIndex((t) => t.id === activeThreadId);
        if (currIdx < threads.length - 1) {
          setActiveThreadId(threads[currIdx + 1].id);
        }
      } else if (e.key === "k" || e.key === "K") {
        e.preventDefault();
        const currIdx = threads.findIndex((t) => t.id === activeThreadId);
        if (currIdx > 0) {
          setActiveThreadId(threads[currIdx - 1].id);
        }
      } else if (e.key === "e" || e.key === "E") {
        e.preventDefault();
        if (activeThreadId) {
          EmailService.archiveThread(activeThreadId).then(handleThreadUpdated);
        }
      } else if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        if (activeThreadId) {
          EmailService.snoozeThread(activeThreadId).then(handleThreadUpdated);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [threads, activeThreadId, handleThreadUpdated]);

  const handleSelectThread = (id: string) => {
    setActiveThreadId(id);
    setIsMobileViewThread(true);
  };

  return (
    <div className="flex h-[calc(100vh-56px-3rem)] rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-950/80 backdrop-blur-md overflow-hidden shadow-elevation transition-colors duration-200">
      {/* Pane 2: Thread Feed List */}
      <div
        className={`w-full lg:w-[380px] shrink-0 ${
          isMobileViewThread ? "hidden lg:block" : "block"
        }`}
      >
        <ThreadFeedList
          threads={threads}
          activeThreadId={activeThreadId}
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
