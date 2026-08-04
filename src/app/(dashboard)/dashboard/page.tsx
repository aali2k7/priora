import React from "react";
import { AIService } from "@/lib/ai-service";
import { DashboardClientView } from "@/components/dashboard/dashboard-client-view";

export const metadata = {
  title: "Executive Briefing — Priora",
  description: "Morning Executive Briefing & Top Urgent Priorities",
};

export default async function DashboardPage() {
  const briefing = await AIService.getExecutiveBriefing();

  return <DashboardClientView initialBriefing={briefing} />;
}
