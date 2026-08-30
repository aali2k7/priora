import React from "react";
import { Calendar, AlertTriangle, Clock } from "lucide-react";
import { ExecutiveBriefing } from "@/types/ai";

interface BriefingBannerProps {
  briefing: ExecutiveBriefing;
}

export function BriefingBanner({ briefing }: BriefingBannerProps) {
  return (
    <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 md:p-6 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2 max-w-3xl">
          <div className="flex items-center space-x-2 text-xs font-semibold text-[#3F5F8F] dark:text-[#7CA1D8] uppercase tracking-wider">
            <span>Executive Briefing</span>
            <span className="text-[var(--text-muted)]">•</span>
            <span className="flex items-center text-[var(--text-secondary)] font-normal normal-case">
              <Calendar className="h-3.5 w-3.5 mr-1 text-[var(--text-muted)]" />
              {briefing.date}
            </span>
          </div>

          <h2 className="text-base sm:text-lg font-semibold text-[var(--text-primary)] leading-snug">
            {briefing.digestSummary}
          </h2>
        </div>

        {/* Executive Stats Badges */}
        <div className="flex items-center space-x-2.5 shrink-0">
          <div className="flex items-center space-x-2 rounded-md border border-[var(--status-urgent-border)] bg-[var(--status-urgent-subtle)] px-3 py-2">
            <AlertTriangle className="h-4 w-4 text-[var(--status-urgent)]" />
            <div>
              <p className="text-sm font-semibold text-[var(--status-urgent)] leading-none">
                {briefing.urgentItemCount}
              </p>
              <p className="text-[10px] text-[var(--status-urgent)] mt-0.5 font-medium">Urgent</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 rounded-md border border-[var(--status-action-border)] bg-[var(--status-action-subtle)] px-3 py-2">
            <Clock className="h-4 w-4 text-[var(--status-action)]" />
            <div>
              <p className="text-sm font-semibold text-[var(--status-action)] leading-none">
                {briefing.waitingOnCount}
              </p>
              <p className="text-[10px] text-[var(--status-action)] mt-0.5 font-medium">Pending</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
