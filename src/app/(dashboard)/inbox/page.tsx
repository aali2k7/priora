import React from "react";
import { EmailService } from "@/lib/email-service";
import { ThreePaneWorkspace } from "@/components/inbox/three-pane-workspace";

export const metadata = {
  title: "Priority Inbox — Priora",
  description: "Executive 3-Pane Triage Workstation",
};

interface InboxPageProps {
  searchParams: Promise<{ threadId?: string; action?: string }>;
}

export default async function InboxPage({ searchParams }: InboxPageProps) {
  const resolvedParams = await searchParams;
  const initialThreads = await EmailService.getThreads("all");

  return (
    <div className="max-w-[1600px] mx-auto h-full">
      <ThreePaneWorkspace
        initialThreads={initialThreads}
        initialThreadId={resolvedParams.threadId}
        initialAction={resolvedParams.action}
      />
    </div>
  );
}
