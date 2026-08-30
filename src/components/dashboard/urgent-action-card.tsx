"use client";

import React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, ArrowRight, CheckCircle2, User } from "lucide-react";
import { ExtractedTask } from "@/types/ai";
import { EmailThread } from "@/types/email";

interface UrgentActionCardProps {
  task: ExtractedTask;
  thread?: EmailThread;
  index: number;
}

export function UrgentActionCard({ task, thread, index }: UrgentActionCardProps) {
  return (
    <Card variant="surface" className="p-4 transition-colors">
      <div className="flex flex-col justify-between space-y-3 h-full">
        {/* Top Header: Rank + Urgency Badge + Deadline */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="flex h-4 w-4 items-center justify-center rounded bg-[var(--bg-canvas)] text-[10px] font-mono text-[var(--text-muted)] border border-[var(--border-subtle)]">
              #{index + 1}
            </span>
            <Badge variant={task.priority === "high" ? "urgent" : "warning"} dot>
              {task.priority === "high" ? "Urgent Action" : "Action Required"}
            </Badge>
          </div>

          {task.deadline && (
            <div className="flex items-center space-x-1 text-[11px] text-[var(--status-action)] font-normal">
              <Clock className="h-3 w-3" />
              <span>{task.deadline}</span>
            </div>
          )}
        </div>

        {/* Task Title & Assignee Context */}
        <div className="space-y-1">
          <h4 className="text-xs font-semibold text-[var(--text-primary)] leading-snug">
            {task.title}
          </h4>
          {task.assigneeName && (
            <div className="flex items-center space-x-1.5 text-[11px] text-[var(--text-secondary)] font-normal">
              <User className="h-3 w-3 text-[var(--text-muted)]" />
              <span>From: <strong className="text-[var(--text-primary)] font-medium">{task.assigneeName}</strong></span>
            </div>
          )}
        </div>

        {/* Thread Snippet if linked */}
        {thread && (
          <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2 bg-[var(--bg-canvas)] p-2 rounded border border-[var(--border-subtle)] leading-relaxed">
            &ldquo;{thread.snippet}&rdquo;
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)] mt-auto">
          <Link href={`/inbox?threadId=${task.threadId}`}>
            <Button variant="ghost" size="sm" className="text-xs text-[var(--text-secondary)] p-0">
              <span>View Thread</span>
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>

          <Link href={`/inbox?threadId=${task.threadId}&action=reply`}>
            <Button variant="primary" size="sm" className="text-xs">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              <span>Reply</span>
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
