"use client";

import React, { useState, useEffect } from "react";
import { Clock, Send, ChevronRight, RefreshCw, AlertCircle } from "lucide-react";
import { FollowUpCandidate } from "@/lib/followup-service";
import { Button } from "@/components/ui/button";

interface FollowUpTriageBannerProps {
  onSelectThread: (threadId: string) => void;
}

export function FollowUpTriageBanner({
  onSelectThread,
}: FollowUpTriageBannerProps) {
  const [candidates, setCandidates] = useState<FollowUpCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await fetch("/api/ai/followups?minDays=2");
        if (res.ok && !ignore) {
          const data = await res.json();
          if (data.data) {
            setCandidates(data.data);
          }
        }
      } catch (err) {
        console.warn("[FollowUpTriageBanner] Error fetching:", err);
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, []);

  if (isLoading || candidates.length === 0) {
    return null;
  }

  return (
    <div className="mx-3 my-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 space-y-2 dark:bg-amber-500/10">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
          <span className="text-xs font-semibold text-[var(--text-primary)]">
            {candidates.length} Awaiting Response
          </span>
          <span className="rounded-full bg-amber-500/20 px-1.5 py-0.2 text-[9px] font-bold text-amber-700 dark:text-amber-300">
            Follow-Up
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-[11px] font-medium text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
        >
          {isExpanded ? "Hide" : "View"}
        </button>
      </div>

      <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
        Outgoing emails where no reply has been received in 2+ days.
      </p>

      {isExpanded && (
        <div className="space-y-1.5 pt-1.5 border-t border-amber-500/20">
          {candidates.slice(0, 4).map((c) => (
            <div
              key={c.threadId}
              onClick={() => onSelectThread(c.threadId)}
              className="flex items-center justify-between rounded bg-[var(--bg-surface)] p-2 text-xs border border-[var(--border-subtle)] hover:border-amber-500 cursor-pointer transition-colors"
            >
              <div className="min-w-0 pr-2">
                <p className="truncate font-medium text-[var(--text-primary)] text-[11px]">
                  {c.subject}
                </p>
                <p className="truncate text-[10px] text-[var(--text-muted)]">
                  To: {c.recipientEmail} • Waiting {c.daysWaiting}d
                </p>
              </div>
              <ChevronRight className="h-3 w-3 text-[var(--text-muted)] shrink-0" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
