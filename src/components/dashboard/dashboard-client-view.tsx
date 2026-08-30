"use client";

import React, { useEffect, useState } from "react";
import { EmailThread } from "@/types/email";
import { ExecutiveBriefing } from "@/types/ai";
import { BriefingBanner } from "./briefing-banner";
import { HighPriorityFeed } from "./high-priority-feed";
import { RefreshCw } from "lucide-react";

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

    const handleRefresh = () => {
      loadData();
    };

    window.addEventListener("priora-email-synced", handleRefresh);
    window.addEventListener("priora-email-sent", handleRefresh);

    const tenMinInterval = setInterval(() => {
      loadData();
    }, 10 * 60 * 1000);

    return () => {
      ignore = true;
      window.removeEventListener("priora-email-synced", handleRefresh);
      window.removeEventListener("priora-email-sent", handleRefresh);
      clearInterval(tenMinInterval);
    };
  }, []);

  // Gentle background check while active sync is ongoing
  useEffect(() => {
    if (!isSyncing) return;

    let ignore = false;
    let timerId: NodeJS.Timeout;

    const pollSyncStatus = async () => {
      try {
        const res = await fetch("/api/gmail/threads");
        if (res.ok && !ignore) {
          const data = await res.json();
          const stillSyncing = !!data.isSyncing;
          setIsSyncing(stillSyncing);
          if (data.threads && data.threads.length > 0) {
            setThreads(data.threads);
          }
          if (stillSyncing && !ignore) {
            timerId = setTimeout(pollSyncStatus, 6000);
          }
        }
      } catch (err) {
        console.error("[Dashboard] Error checking sync status:", err);
        if (!ignore) {
          timerId = setTimeout(pollSyncStatus, 10000);
        }
      }
    };

    timerId = setTimeout(pollSyncStatus, 4000);

    return () => {
      ignore = true;
      clearTimeout(timerId);
    };
  }, [isSyncing]);

  if (isLoading && threads.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center p-8 text-center">
        <div className="flex flex-col items-center space-y-2.5 max-w-sm">
          <RefreshCw className="h-5 w-5 animate-spin text-[#3F5F8F]" />
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              Loading Overview
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Fetching summary from database cache...
            </p>
          </div>
        </div>
      </div>
    );
  }

  const urgentThreads = threads.filter(
    (t) =>
      !t.isArchived &&
      (t.priority === "urgent" ||
        t.category === "action_required" ||
        (typeof t.urgencyScore === "number" && t.urgencyScore >= 70))
  );
  const urgentCount = urgentThreads.length;
  const pendingCount = threads.filter((t) => !t.isArchived && t.isUnread).length;

  const dynamicBriefing: ExecutiveBriefing = {
    ...initialBriefing,
    digestSummary:
      threads.length > 0
        ? `You have ${urgentCount} urgent priority items across ${threads.length} active threads.`
        : initialBriefing.digestSummary,
    urgentItemCount: urgentCount,
    waitingOnCount: pendingCount,
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto">
      {/* 1. Executive Briefing Banner */}
      <BriefingBanner briefing={dynamicBriefing} />

      {/* 2. Priority Feed Overview */}
      <HighPriorityFeed threads={urgentThreads.length > 0 ? urgentThreads : threads} />
    </div>
  );
}
