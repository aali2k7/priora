"use client";

import React from "react";
import { EmailThread } from "@/types/email";
import { AISummary } from "@/types/ai";
import { AISummaryBanner } from "./ai-summary-banner";
import { AIDraftComposer } from "./ai-draft-composer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShortcutKey } from "@/components/ui/shortcut-key";
import { Archive, Clock, ChevronDown, ChevronUp, User, CheckCircle, FileText, Users } from "lucide-react";
import { EmailService } from "@/lib/email-service";

interface ThreadReaderProps {
  thread: EmailThread;
  onThreadUpdated: () => void;
  autoOpenReply?: boolean;
}

export function ThreadReader({ thread, onThreadUpdated, autoOpenReply }: ThreadReaderProps) {
  const [summary, setSummary] = React.useState<AISummary | null>(null);
  const [isReanalyzing, setIsReanalyzing] = React.useState(false);
  const [isReplyOpen, setIsReplyOpen] = React.useState(!!autoOpenReply);
  const [expandedMessages, setExpandedMessages] = React.useState<Record<string, boolean>>({
    [thread.messages[thread.messages.length - 1]?.id || ""]: true,
  });
  const [isArchiving, setIsArchiving] = React.useState(false);
  const [isSnoozing, setIsSnoozing] = React.useState(false);
  const [isSentSuccess, setIsSentSuccess] = React.useState(false);

  React.useEffect(() => {
    let ignore = false;

    async function fetchSummary() {
      try {
        const res = await fetch(`/api/ai/summary?threadId=${encodeURIComponent(thread.id)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.summary && !ignore) {
            setSummary(data.summary);
            return;
          }
        }
      } catch (err) {
        console.warn("[ThreadReader] Failed to fetch summary from API, using fallback:", err);
      }

      // Fallback from thread properties
      if (!ignore) {
        setSummary({
          threadId: thread.id,
          executiveBrief: thread.executiveBrief || thread.aiSummary || thread.snippet || "Review required.",
          bulletPoints: [thread.snippet || "Conversation details available in history."],
          urgencyScore: thread.urgencyScore ?? (thread.priority === "urgent" ? 90 : 50),
          importanceScore: thread.importanceScore ?? 50,
          actionRequired: thread.actionRequired ?? (thread.priority === "urgent"),
        });
      }
    }

    fetchSummary();

    return () => {
      ignore = true;
    };
  }, [thread]);

  const handleReanalyze = async () => {
    setIsReanalyzing(true);
    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId: thread.id, force: true }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.summary) {
          setSummary(data.summary);
          onThreadUpdated();
        }
      }
    } catch (err) {
      console.error("[ThreadReader] Error re-analyzing with Gemini:", err);
    } finally {
      setIsReanalyzing(false);
    }
  };

  const handleArchive = async () => {
    setIsArchiving(true);
    await EmailService.archiveThread(thread.id);
    setIsArchiving(false);
    onThreadUpdated();
  };

  const handleSnooze = async () => {
    setIsSnoozing(true);
    await EmailService.snoozeThread(thread.id);
    setIsSnoozing(false);
    onThreadUpdated();
  };

  const toggleMessage = (id: string) => {
    setExpandedMessages((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSentSuccess = () => {
    setIsSentSuccess(true);
    setTimeout(() => {
      onThreadUpdated();
    }, 1200);
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg-canvas)] p-4 md:p-6 overflow-y-auto custom-scrollbar space-y-6">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800 pb-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-bold text-[var(--text-primary)]">{thread.subject}</h1>
            {thread.priority === "urgent" && <Badge variant="urgent">Urgent</Badge>}
            {thread.category === "vip" && <Badge variant="vip">Student VIP</Badge>}
          </div>
          <p className="text-[11px] text-[var(--text-muted)]">
            {thread.messages.length} message{thread.messages.length > 1 ? "s" : ""} in thread
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center space-x-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleArchive}
            disabled={isArchiving}
            className="text-xs"
            title="Archive Thread (E)"
          >
            <Archive className="h-3.5 w-3.5 mr-1 text-slate-400" />
            <span>Archive</span>
            <ShortcutKey className="ml-1">E</ShortcutKey>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSnooze}
            disabled={isSnoozing}
            className="text-xs"
            title="Snooze Thread (S)"
          >
            <Clock className="h-3.5 w-3.5 mr-1 text-slate-400" />
            <span>Snooze</span>
            <ShortcutKey className="ml-1">S</ShortcutKey>
          </Button>

          {!isReplyOpen && (
            <Button
              variant="ai-sparkle"
              size="sm"
              onClick={() => setIsReplyOpen(true)}
              className="text-xs"
            >
              <span>Reply with AI</span>
              <ShortcutKey className="ml-1">R</ShortcutKey>
            </Button>
          )}
        </div>
      </div>

      {/* Sent Confirmation Banner */}
      {isSentSuccess && (
        <div className="flex items-center space-x-2.5 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-300 dark:border-emerald-500/30 p-4 text-xs text-emerald-800 dark:text-emerald-300 shadow-2xs">
          <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="font-medium">Outing Approval Email Dispatched to Student & Parents! Thread Archived.</span>
        </div>
      )}

      {/* AI Summary Banner & Key Info Panel */}
      {summary && (
        <AISummaryBanner
          summary={summary}
          onReanalyze={handleReanalyze}
          isReanalyzing={isReanalyzing}
        />
      )}

      {/* AI Composer (If Open) */}
      {isReplyOpen && !isSentSuccess && (
        <AIDraftComposer threadId={thread.id} onSentSuccess={handleSentSuccess} />
      )}

      {/* Thread Messages Timeline */}
      <div className="space-y-3 pt-2">
        <h3 className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
          Email Conversation History
        </h3>

        {thread.messages.map((msg) => {
          const isExpanded = expandedMessages[msg.id];
          return (
            <div
              key={msg.id}
              className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-hidden shadow-2xs"
            >
              {/* Message Header */}
              <button
                onClick={() => toggleMessage(msg.id)}
                className="flex w-full items-center justify-between p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors focus-ring cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 overflow-hidden shrink-0">
                    {msg.sender.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={msg.sender.avatarUrl} alt={msg.sender.name} className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-4 w-4 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-semibold text-slate-900 dark:text-slate-200">
                        {msg.sender.name}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        &lt;{msg.sender.email}&gt;
                      </span>
                    </div>

                    {/* CC list if present */}
                    {msg.ccRecipients && msg.ccRecipients.length > 0 && (
                      <div className="flex items-center space-x-1 text-[11px] text-emerald-700 dark:text-emerald-400/90 mt-0.5 font-medium">
                        <Users className="h-3 w-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>CC&apos;d Parents: {msg.ccRecipients.map((c) => c.name).join(", ")}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3 text-[10px] text-slate-400 shrink-0">
                  <span>{msg.timestamp}</span>
                  {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </div>
              </button>

              {/* Message Body & Attachments */}
              {isExpanded && (
                <div className="p-4 pt-2 border-t border-slate-200/80 dark:border-slate-800/60 space-y-4">
                  <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-sans">
                    {msg.bodyText}
                  </div>

                  {/* Attachments Section */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800/80 space-y-2">
                      <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">
                        Attachments ({msg.attachments.length})
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {msg.attachments.map((att, idx) => (
                          <div
                            key={idx}
                            className="flex items-center space-x-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs text-slate-800 dark:text-slate-200 hover:border-indigo-500/50 transition-colors shadow-2xs"
                          >
                            <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                            <div>
                              <p className="font-semibold text-[11px] text-slate-900 dark:text-slate-200">{att.name}</p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400">{att.size}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
