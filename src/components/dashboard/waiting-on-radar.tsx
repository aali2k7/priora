"use client";

import React, { useState, useEffect } from "react";
import {
  Hourglass,
  Clock,
  Send,
  AlertTriangle,
  ChevronRight,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { WaitingOnItem } from "@/lib/waiting-on-service";
import { Button } from "@/components/ui/button";

export function WaitingOnRadar() {
  const [items, setItems] = useState<WaitingOnItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/ai/waiting-on");
      if (res.ok) {
        const data = await res.json();
        setItems(data.data || []);
      }
    } catch (err) {
      console.warn("[WaitingOnRadar] Fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const overdueCount = items.filter((i) => i.status === "OVERDUE").length;

  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
        <div className="flex items-center space-x-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Hourglass className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                Waiting-On Radar
              </h3>
              {overdueCount > 0 && (
                <span className="rounded-full bg-rose-500/10 px-2 py-0.2 text-[10px] font-bold text-rose-600 dark:text-rose-400">
                  {overdueCount} delayed
                </span>
              )}
            </div>
            <p className="text-[11px] text-[var(--text-secondary)]">
              External bottlenecks and deliverables you are awaiting from other stakeholders
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchItems}
          disabled={isLoading}
          className="text-xs h-7 px-2"
        >
          <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Dependency Feed */}
      <div className="space-y-2.5">
        {isLoading && items.length === 0 ? (
          <div className="py-8 text-center text-xs text-[var(--text-muted)] space-y-1">
            <RefreshCw className="h-4 w-4 animate-spin mx-auto text-[#3F5F8F]" />
            <p>Scanning thread dependencies...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[var(--border-subtle)] py-8 text-center text-xs text-[var(--text-muted)]">
            <p className="font-medium text-[var(--text-primary)]">Zero Blocked Dependencies</p>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
              All active workflows are moving forward with no pending external bottlenecks.
            </p>
          </div>
        ) : (
          items.map((item) => {
            const isOverdue = item.status === "OVERDUE";
            return (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-3 hover:border-[var(--border-focus)] transition-all gap-2"
              >
                <div className="space-y-1 min-w-0 pr-2">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`rounded px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider ${
                        isOverdue
                          ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                      }`}
                    >
                      {item.status}
                    </span>

                    <span className="truncate text-xs font-semibold text-[var(--text-primary)]">
                      {item.topic}
                    </span>
                  </div>

                  <p className="text-[11px] text-[var(--text-secondary)] line-clamp-1">
                    {item.deliverable}
                  </p>

                  <div className="flex items-center space-x-2 text-[10px] text-[var(--text-muted)]">
                    <span>Awaiting: <strong className="text-[var(--text-secondary)]">{item.ownerName}</strong></span>
                    <span>•</span>
                    <span>{item.dueDateText}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 shrink-0">
                  <a
                    href={`/inbox?view=focused`}
                    className="inline-flex items-center space-x-1 rounded px-2.5 py-1 text-xs font-medium text-[#3F5F8F] hover:bg-[#3F5F8F]/10 dark:text-[#7CA1D8] transition-colors"
                  >
                    <span>Nudge</span>
                    <Send className="h-3 w-3" />
                  </a>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
