import React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmailThread } from "@/types/email";
import { ArrowRight, Inbox, Sparkles } from "lucide-react";

interface HighPriorityFeedProps {
  threads: EmailThread[];
}

export function HighPriorityFeed({ threads }: HighPriorityFeedProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-100 flex items-center space-x-2">
            <Inbox className="h-5 w-5 text-indigo-400" />
            <span>Priority Inbox Feed</span>
          </h2>
          <p className="text-xs text-slate-400">Emails sorted by executive impact and urgency</p>
        </div>

        <Link href="/inbox" className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center space-x-1">
          <span>Open Full Workstation</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="space-y-2.5">
        {threads.map((thread) => (
          <Link key={thread.id} href={`/inbox?threadId=${thread.id}`}>
            <Card variant="glass" className="p-4 hover:bg-slate-800/60 transition-colors group cursor-pointer">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-slate-300 border border-slate-700">
                    {thread.participants[0]?.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-semibold text-slate-200 truncate">
                        {thread.participants[0]?.name}
                      </span>
                      {thread.priority === "urgent" && <Badge variant="urgent">Urgent</Badge>}
                      {thread.category === "vip" && <Badge variant="vip">VIP</Badge>}
                    </div>
                    <p className="text-xs font-medium text-slate-300 truncate mt-0.5 group-hover:text-indigo-300 transition-colors">
                      {thread.subject}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 shrink-0 justify-between sm:justify-end text-2xs text-slate-400">
                  <span className="flex items-center space-x-1 text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded">
                    <Sparkles className="h-3 w-3" />
                    <span>AI Brief</span>
                  </span>
                  <span>{thread.lastMessageTimestamp}</span>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
