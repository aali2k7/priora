"use client";

import React, { useEffect, useState } from "react";
import { EmailThread } from "@/types/email";
import { ExecutiveBriefing } from "@/types/ai";
import { BriefingBanner } from "./briefing-banner";
import { HighPriorityFeed } from "./high-priority-feed";
import { Sparkles, RefreshCw } from "lucide-react";

interface DashboardClientViewProps {
  initialBriefing: ExecutiveBriefing;
}

export function DashboardClientView({ initialBriefing }: DashboardClientViewProps) {
  const [threads, setThreads] = useState<EmailThread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function loadData() {
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
        console.error("[Dashboard] Error loading threads:", err);
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    loadData();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
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
        console.error("[Dashboard] Error polling threads:", err);
      }
    }, 3000);

    return () => {
      ignore = true;
      clearInterval(interval);
    };
  }, [isSyncing]);

  if (isLoading || (isSyncing && threads.length === 0)) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md p-8 text-center shadow-elevation">
        <div className="flex flex-col items-center space-y-4 max-w-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600/10 dark:bg-indigo-600/20 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 animate-pulse">
            <Sparkles className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Syncing Executive Dashboard
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Fetching real Gmail threads from Neon PostgreSQL database...
            </p>
          </div>
          <div className="flex items-center space-x-2 text-xs text-indigo-600 dark:text-indigo-400 font-medium">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Gmail REST API Sync active...</span>
          </div>
        </div>
      </div>
    );
  }

  const urgentThreads = threads.filter((t) => t.priority === "urgent" || t.category === "action_required");
  const urgentCount = urgentThreads.length;
  const pendingCount = threads.filter((t) => t.isUnread).length;

  const dynamicBriefing: ExecutiveBriefing = {
    ...initialBriefing,
    digestSummary: threads.length > 0
      ? `You have ${urgentCount} urgent priority items requiring your attention across ${threads.length} total synced threads.`
      : initialBriefing.digestSummary,
    urgentItemCount: urgentCount,
    waitingOnCount: pendingCount,
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* 1. Executive Briefing Banner */}
      <BriefingBanner briefing={dynamicBriefing} />

      {/* 2. Priority Feed Overview */}
      <HighPriorityFeed threads={threads} />
    </div>
  );
}
