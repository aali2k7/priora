import React from "react";
import Link from "next/link";
import { EmailThread } from "@/types/email";
import { ArrowRight, Zap } from "lucide-react";

interface HighPriorityFeedProps {
  threads: EmailThread[];
}

export function HighPriorityFeed({ threads }: HighPriorityFeedProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center space-x-2">
            <Zap className="h-4 w-4 text-[#3F5F8F] dark:text-[#7CA1D8]" />
            <span>Priority Attention Feed</span>
          </h3>
          <p className="text-xs text-[var(--text-secondary)]">Emails sorted by urgency and action requirements</p>
        </div>

        <Link
          href="/inbox"
          className="text-xs font-semibold text-[#3F5F8F] dark:text-[#7CA1D8] hover:underline flex items-center space-x-1"
        >
          <span>Open Full Inbox</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] divide-y divide-[var(--border-subtle)] overflow-hidden">
        {threads.length === 0 ? (
          <div className="p-8 text-center text-xs text-[var(--text-muted)]">
            No priority threads in current 15-day window.
          </div>
        ) : (
          threads.slice(0, 10).map((thread) => {
            const isUrgent = thread.priority === "urgent" || (typeof thread.urgencyScore === "number" && thread.urgencyScore >= 75);
            const isAction = thread.actionRequired === true || thread.category === "action_required";

            return (
              <Link
                key={thread.id}
                href={`/inbox?threadId=${thread.id}`}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 hover:bg-[var(--bg-surface-hover)] transition-colors gap-2 group block"
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  {/* Status Indicator */}
                  {isUrgent ? (
                    <span className="h-2 w-2 rounded-full bg-[#B83A3A] shrink-0" />
                  ) : isAction ? (
                    <span className="h-2 w-2 rounded-full bg-[#A56B20] shrink-0" />
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-[var(--text-muted)] opacity-40 shrink-0" />
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-semibold text-[var(--text-primary)] truncate">
                        {thread.participants[0]?.name || "Sender"}
                      </span>
                      {thread.category === "vip" && (
                        <span className="text-[9px] font-mono px-1 rounded bg-[var(--status-ai-subtle)] text-[#526B9E]">
                          VIP
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] truncate group-hover:text-[var(--text-primary)] transition-colors">
                      {thread.subject}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0 text-[11px] text-[var(--text-muted)] sm:justify-end">
                  {thread.analyzedAt && typeof thread.urgencyScore === "number" && (
                    <span className="text-[10px] font-mono text-[var(--text-secondary)] bg-[var(--bg-canvas)] px-1.5 py-0.5 rounded border border-[var(--border-subtle)]">
                      {thread.urgencyScore}/100
                    </span>
                  )}
                  <span>{thread.lastMessageTimestamp}</span>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
