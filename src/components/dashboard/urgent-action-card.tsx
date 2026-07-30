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
    <Card variant="glass" className="relative p-6 hover:border-indigo-500/40 group transition-all duration-150">
      <div className="flex flex-col justify-between space-y-4 h-full">
        {/* Top Header: Rank + Urgency Badge + Deadline Pill */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-mono font-medium text-slate-500 dark:text-slate-400">
              #{index + 1}
            </span>
            <Badge variant={task.priority === "high" ? "urgent" : "warning"}>
              {task.priority === "high" ? "Urgent Action" : "Action Required"}
            </Badge>
          </div>

          {task.deadline && (
            <div className="flex items-center space-x-1.5 text-[11px] font-normal text-amber-700 dark:text-amber-400 bg-amber-500/5 px-2.5 py-1 rounded-md border border-amber-500/15">
              <Clock className="h-3.5 w-3.5" />
              <span>{task.deadline}</span>
            </div>
          )}
        </div>

        {/* Task Title & Assignee Context */}
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug">
            {task.title}
          </h3>
          {task.assigneeName && (
            <div className="flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400 font-normal">
              <User className="h-3.5 w-3.5 text-slate-400" />
              <span>From: <strong className="text-slate-700 dark:text-slate-300 font-medium">{task.assigneeName}</strong></span>
            </div>
          )}
        </div>

        {/* Thread Snippet if linked */}
        {thread && (
          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-lg border border-slate-200/60 dark:border-slate-800/60 italic leading-relaxed font-normal">
            &ldquo;{thread.snippet}&rdquo;
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/60 mt-auto">
          <Link href={`/inbox?threadId=${task.threadId}`}>
            <Button variant="ghost" size="sm" className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 p-0 font-normal">
              <span>View Full Thread</span>
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </Link>

          <Link href={`/inbox?threadId=${task.threadId}&action=reply`}>
            <Button variant="ai-sparkle" size="sm" className="text-xs">
              <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-indigo-600 dark:text-indigo-400" />
              <span>Approve AI Reply</span>
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
