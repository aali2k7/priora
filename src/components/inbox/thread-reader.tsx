"use client";

import React from "react";
import { EmailThread } from "@/types/email";
import { AISummary } from "@/types/ai";
import { AISummaryBanner } from "./ai-summary-banner";
import { AIDraftComposer } from "./ai-draft-composer";
import { Button } from "@/components/ui/button";
import { ShortcutKey } from "@/components/ui/shortcut-key";
import { Archive, Clock, ChevronDown, ChevronUp, User, CheckCircle, FileText, Reply } from "lucide-react";
import { EmailService } from "@/lib/email-service";

import { getCachedSummary, setCachedSummary } from "@/lib/client-cache";

interface ThreadReaderProps {
  thread: EmailThread;
  onThreadUpdated: () => void;
  autoOpenReply?: boolean;
}

export function ThreadReader({ thread, onThreadUpdated, autoOpenReply }: ThreadReaderProps) {
  const [summary, setSummary] = React.useState<AISummary | null>(() => getCachedSummary(thread.id));
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

    // 1. Instant check: If thread already has persisted AI summary from PostgreSQL, use it & sync cache
    if (thread.analyzedAt && (thread.aiSummary || thread.executiveBrief)) {
      const summaryData: AISummary = {
        threadId: thread.id,
        executiveBrief: thread.executiveBrief || thread.aiSummary || "AI Analysis completed.",
        bulletPoints: [thread.snippet || "Conversation details available in history."],
        urgencyScore: thread.urgencyScore ?? undefined,
        importanceScore: thread.importanceScore ?? undefined,
        actionRequired: thread.actionRequired ?? undefined,
        analyzedAt: thread.analyzedAt,
      };
      setSummary(summaryData);
      setCachedSummary(thread.id, summaryData);
      return; // Skip redundant API call
    }

    // 2. Client cache check: If present in browser localStorage, use it immediately
    const cached = getCachedSummary(thread.id);
    if (cached && (cached.executiveBrief || cached.bulletPoints?.length)) {
      setSummary(cached);
      return; // Skip redundant API call
    }

    // 3. Only fetch from API if thread has not yet been analyzed
    async function fetchSummary() {
      try {
        const res = await fetch(`/api/ai/summary?threadId=${encodeURIComponent(thread.id)}`);
        if (res.ok && !ignore) {
          const data = await res.json();
          if (data.summary) {
            setSummary(data.summary);
            setCachedSummary(thread.id, data.summary);
            return;
          }
        }
      } catch (err) {
        console.warn("[ThreadReader] Failed to fetch summary from API:", err);
      }

      if (!ignore) {
        setSummary({
          threadId: thread.id,
          executiveBrief: "Analysis pending",
          bulletPoints: ["This thread is queued for AI analysis."],
          analyzedAt: undefined,
        });
      }
    }

    fetchSummary();

    return () => {
      ignore = true;
    };
  }, [thread.id, thread.analyzedAt, thread.aiSummary, thread.executiveBrief]);

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
          setCachedSummary(thread.id, data.summary);
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

  const primarySender = thread.participants[0] || { name: "Sender", email: "" };

  return (
    <div className="flex flex-col h-full bg-[var(--bg-canvas)] p-5 md:p-6 overflow-y-auto custom-scrollbar space-y-5">
      {/* 1. Header Toolbar: Subject + Metadata + Actions */}
      <div className="border-b border-[var(--border-subtle)] pb-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-base sm:text-lg font-semibold text-[var(--text-primary)] leading-snug">
              {thread.subject}
            </h1>
            <p className="text-xs text-[var(--text-secondary)]">
              {primarySender.name} {primarySender.email ? `• <${primarySender.email}>` : ""} • {thread.lastMessageTimestamp}
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center space-x-1.5 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleArchive}
              disabled={isArchiving}
              title="Archive Thread (E)"
            >
              <Archive className="h-3 w-3 mr-1 text-[var(--text-muted)]" />
              <span>Archive</span>
              <ShortcutKey className="ml-1">E</ShortcutKey>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleSnooze}
              disabled={isSnoozing}
              title="Snooze Thread (S)"
            >
              <Clock className="h-3 w-3 mr-1 text-[var(--text-muted)]" />
              <span>Snooze</span>
              <ShortcutKey className="ml-1">S</ShortcutKey>
            </Button>

            {!isReplyOpen && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsReplyOpen(true)}
              >
                <Reply className="h-3 w-3 mr-1" />
                <span>Reply</span>
                <ShortcutKey className="ml-1 text-white/70">R</ShortcutKey>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Banner */}
      {isSentSuccess && (
        <div className="flex items-center space-x-2 rounded-md bg-[var(--status-success-subtle)] border border-[var(--status-success-border)] p-3 text-xs text-[var(--status-success)]">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span className="font-medium">Reply dispatched successfully. Thread archived.</span>
        </div>
      )}

      {/* 2. Executive AI Brief Section */}
      {summary && (
        <AISummaryBanner
          summary={summary}
          onReanalyze={handleReanalyze}
          isReanalyzing={isReanalyzing}
        />
      )}

      {/* 3. Reply Composer */}
      {isReplyOpen && !isSentSuccess && (
        <AIDraftComposer threadId={thread.id} onSentSuccess={handleSentSuccess} />
      )}

      {/* 4. Conversation History (Clean Timeline with Thin Separators) */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between pb-1 border-b border-[var(--border-subtle)]">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Conversation History ({thread.messages.length})
          </span>
        </div>

        <div className="space-y-2.5">
          {thread.messages.map((msg) => {
            const isExpanded = expandedMessages[msg.id];
            return (
              <div
                key={msg.id}
                className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden"
              >
                {/* Message Header */}
                <button
                  onClick={() => toggleMessage(msg.id)}
                  className="flex w-full items-center justify-between p-3.5 text-left hover:bg-[var(--bg-surface-hover)] transition-colors focus-ring cursor-pointer"
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--bg-canvas)] text-[11px] font-semibold text-[var(--text-primary)] border border-[var(--border-subtle)] shrink-0">
                      {msg.sender.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={msg.sender.avatarUrl} alt={msg.sender.name} className="h-full w-full object-cover rounded-full" />
                      ) : (
                        msg.sender.name.charAt(0) || <User className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-semibold text-[var(--text-primary)] truncate">
                          {msg.sender.name}
                        </span>
                        <span className="text-[11px] text-[var(--text-muted)] truncate">
                          &lt;{msg.sender.email}&gt;
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 text-[11px] text-[var(--text-muted)] shrink-0">
                    <span>{msg.timestamp}</span>
                    {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </div>
                </button>

                {/* Message Body & Attachments */}
                {isExpanded && (
                  <div className="p-3.5 pt-2 border-t border-[var(--border-subtle)] space-y-3">
                    <div className="text-xs text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap font-sans">
                      {msg.bodyText}
                    </div>

                    {/* Attachments */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="pt-2 border-t border-[var(--border-subtle)] space-y-1.5">
                        <span className="text-[10px] font-semibold uppercase text-[var(--text-muted)]">
                          Attachments ({msg.attachments.length})
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {msg.attachments.map((att, idx) => (
                            <div
                              key={idx}
                              className="flex items-center space-x-2 rounded border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-2 text-xs text-[var(--text-primary)]"
                            >
                              <FileText className="h-3.5 w-3.5 text-[#3F5F8F] dark:text-[#7CA1D8]" />
                              <div>
                                <p className="font-medium text-[11px]">{att.name}</p>
                                <p className="text-[10px] text-[var(--text-muted)]">{att.size}</p>
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
    </div>
  );
}
