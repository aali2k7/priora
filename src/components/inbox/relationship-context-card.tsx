"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  History,
  Clock,
  ExternalLink,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { RelationshipContext } from "@/lib/relationship-service";

interface RelationshipContextCardProps {
  threadId: string;
}

export function RelationshipContextCard({
  threadId,
}: RelationshipContextCardProps) {
  const [context, setContext] = useState<RelationshipContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    async function load() {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/ai/relationship-context?threadId=${encodeURIComponent(threadId)}`
        );
        if (res.ok && !ignore) {
          const data = await res.json();
          if (data.data) {
            setContext(data.data);
          }
        }
      } catch (err) {
        console.warn("[RelationshipContextCard] Error fetching:", err);
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [threadId]);

  if (isLoading || !context || context.relatedThreads.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3.5 space-y-2.5">
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
        <div className="flex items-center space-x-2">
          <div className="flex h-5 w-5 items-center justify-center rounded bg-[#3F5F8F]/10 text-[#3F5F8F] dark:bg-[#7CA1D8]/10 dark:text-[#7CA1D8]">
            <History className="h-3 w-3" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#3F5F8F] dark:text-[#7CA1D8]">
            Multi-Thread Context & Relationship
          </span>
        </div>

        <span className="text-[10px] text-[var(--text-muted)] font-medium">
          {context.totalHistoricalThreads} conversation(s) on record
        </span>
      </div>

      <div className="space-y-1">
        <p className="text-xs text-[var(--text-primary)] font-medium leading-relaxed">
          {context.historicalContextSummary}
        </p>
        <div className="flex items-center space-x-2 text-[11px] text-[var(--text-secondary)]">
          <span className="flex items-center space-x-1">
            <Clock className="h-3 w-3 text-[var(--text-muted)]" />
            <span>{context.cadenceNote}</span>
          </span>
        </div>
      </div>

      {/* Related Threads Pills */}
      {context.relatedThreads.length > 0 && (
        <div className="space-y-1 pt-1.5 border-t border-[var(--border-subtle)]">
          <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block">
            Recent Related Threads
          </span>
          <div className="space-y-1">
            {context.relatedThreads.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded bg-[var(--bg-canvas)] px-2.5 py-1.5 text-xs hover:border-[var(--border-focus)] border border-transparent transition-colors"
              >
                <div className="min-w-0 pr-2">
                  <p className="truncate font-medium text-[var(--text-primary)] text-[11px]">
                    {item.subject}
                  </p>
                  <p className="truncate text-[10px] text-[var(--text-muted)]">
                    {item.summary || item.snippet}
                  </p>
                </div>
                <span className="shrink-0 text-[9px] text-[var(--text-muted)]">
                  {new Date(item.lastMessageAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
