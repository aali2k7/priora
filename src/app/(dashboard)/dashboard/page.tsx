import React from "react";
import { AIService } from "@/lib/ai-service";
import { EmailService } from "@/lib/email-service";
import { BriefingBanner } from "@/components/dashboard/briefing-banner";
import { UrgentActionCard } from "@/components/dashboard/urgent-action-card";
import { HighPriorityFeed } from "@/components/dashboard/high-priority-feed";

export const metadata = {
  title: "Executive Briefing — Priora",
  description: "Morning Executive Briefing & Top Urgent Priorities",
};

export default async function DashboardPage() {
  const briefing = await AIService.getExecutiveBriefing();
  const threads = await EmailService.getThreads("all");

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* 1. Morning Executive Briefing Banner */}
      <BriefingBanner briefing={briefing} />

      {/* 2. Top Urgent Action Cards (The 5-Second Clarity Focus) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">
              Urgent Executive Actions ({briefing.topActionItems.length})
            </h2>
            <p className="text-xs text-slate-400">
              Tasks requiring your immediate approval or sign-off today
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {briefing.topActionItems.map((task, idx) => {
            const linkedThread = threads.find((t) => t.id === task.threadId);
            return (
              <UrgentActionCard
                key={task.id}
                task={task}
                thread={linkedThread}
                index={idx}
              />
            );
          })}
        </div>
      </div>

      {/* 3. Priority Feed Overview */}
      <HighPriorityFeed threads={threads} />
    </div>
  );
}
