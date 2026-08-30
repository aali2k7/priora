import React from "react";
import { ThreePaneWorkspace } from "@/components/inbox/three-pane-workspace";

export const metadata = {
  title: "Inbox & Focused — Priora",
  description: "Executive Email Intelligence & Triage Workspace",
};

interface InboxPageProps {
  searchParams: Promise<{ threadId?: string; action?: string; view?: string }>;
}

export default async function InboxPage({ searchParams }: InboxPageProps) {
  const resolvedParams = await searchParams;

  return (
    <div className="h-full w-full">
      <ThreePaneWorkspace
        initialThreads={[]}
        initialThreadId={resolvedParams.threadId}
        initialAction={resolvedParams.action}
        initialView={resolvedParams.view as "inbox" | "focused" | "archived" | undefined}
      />
    </div>
  );
}
