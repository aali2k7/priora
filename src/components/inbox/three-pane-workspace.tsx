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
  const [activeFilter, setActiveFilter] = React.useState("all");
  const [activeThreadId, setActiveThreadId] = React.useState<string>(
    initialThreadId || initialThreads[0]?.id || ""
  );
  const [isMobileViewThread, setIsMobileViewThread] = React.useState(!!initialThreadId);

  const activeThread = threads.find((t) => t.id === activeThreadId);

  const refreshThreads = React.useCallback(async () => {
    const updated = await EmailService.getThreads(activeFilter as any);
    setThreads(updated);
    if (updated.length > 0 && !updated.some((t) => t.id === activeThreadId)) {
      setActiveThreadId(updated[0].id);
    }
  }, [activeFilter, activeThreadId]);

  React.useEffect(() => {
    refreshThreads();
  }, [activeFilter, refreshThreads]);

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
          EmailService.archiveThread(activeThreadId).then(refreshThreads);
        }
      } else if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        if (activeThreadId) {
          EmailService.snoozeThread(activeThreadId).then(refreshThreads);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [threads, activeThreadId, refreshThreads]);

  const handleSelectThread = (id: string) => {
    setActiveThreadId(id);
    setIsMobileViewThread(true);
  };

  return (
    <div className="flex h-[calc(100vh-56px-3rem)] rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl">
      {/* Pane 2: Thread Feed List (Width: 360px-400px on desktop, full width on mobile if list active) */}
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
          onFilterChange={setActiveFilter}
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
            <div className="lg:hidden p-2 border-b border-slate-800 bg-slate-900 flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileViewThread(false)}
                className="text-xs text-slate-300"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                <span>Back to Feed</span>
              </Button>
            </div>

            <ThreadReader
              thread={activeThread}
              onThreadUpdated={refreshThreads}
              autoOpenReply={initialAction === "reply"}
            />
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center text-slate-500">
            <Inbox className="h-10 w-10 text-slate-600 mb-3" />
            <p className="text-sm font-semibold text-slate-300">No Thread Selected</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              Select an email from the feed list to view AI summaries and draft responses.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
