"use client";

import React from "react";
import { AIDraftResponse, ToneModifier } from "@/types/ai";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ShortcutKey } from "@/components/ui/shortcut-key";
import { Send, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";
import { EmailService } from "@/lib/email-service";
import { SplitSendButton } from "./scheduled-send-popover";

interface AIDraftComposerProps {
  threadId: string;
  onSentSuccess: () => void;
}

export function AIDraftComposer({
  threadId,
  onSentSuccess,
}: AIDraftComposerProps) {
  const [draftsByTone, setDraftsByTone] = React.useState<Record<string, AIDraftResponse>>({});
  const [draft, setDraft] = React.useState<AIDraftResponse | null>(null);
  const [draftText, setDraftText] = React.useState("");
  const [activeTone, setActiveTone] = React.useState<ToneModifier>("concise");
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSending, setIsSending] = React.useState(false);
  const [archiveAfterSend, setArchiveAfterSend] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isMounted = true;
    const cacheKey = `${threadId}_${activeTone}`;

    // Instant check from in-memory tone cache
    if (draftsByTone[cacheKey]) {
      const cached = draftsByTone[cacheKey];
      setDraft(cached);
      setDraftText(cached.draftText);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    async function fetchDraft() {
      try {
        const res = await fetch(
          `/api/ai/draft?threadId=${encodeURIComponent(threadId)}&tone=${encodeURIComponent(activeTone)}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.draft && isMounted) {
            setDraft(data.draft);
            setDraftText(data.draft.draftText);
            setDraftsByTone((prev) => ({ ...prev, [cacheKey]: data.draft }));
            setIsLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn(
          "[AIDraftComposer] API fetch failed, using fallback:",
          err
        );
      }

      if (isMounted) {
        const fallbackDraft: AIDraftResponse = {
          threadId,
          intentStrategy: `Responding with ${activeTone} style`,
          draftText:
            "Hi,\n\nThank you for reaching out. I have reviewed the details and will follow up shortly.\n\nBest regards,\nAali",
          suggestedTone: activeTone,
          lastUpdated: "Just now",
        };
        setDraft(fallbackDraft);
        setDraftText(fallbackDraft.draftText);
        setDraftsByTone((prev) => ({ ...prev, [cacheKey]: fallbackDraft }));
        setIsLoading(false);
      }
    }

    fetchDraft();

    return () => {
      isMounted = false;
    };
  }, [threadId, activeTone, draftsByTone]);

  const handleToneSelect = (tone: ToneModifier) => {
    setActiveTone(tone);
    setErrorMessage(null);
    const cacheKey = `${threadId}_${tone}`;
    if (draftsByTone[cacheKey]) {
      setDraft(draftsByTone[cacheKey]);
      setDraftText(draftsByTone[cacheKey].draftText);
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }
  };

  const handleSend = async () => {
    if (!draftText.trim()) return;
    setErrorMessage(null);
    setIsSending(true);

    try {
      const result = await EmailService.sendReply(
        threadId,
        draftText.trim(),
        archiveAfterSend
      );

      if (!result.success) {
        setErrorMessage(
          result.error ||
            "Failed to send reply. Please check your Gmail connection or re-authenticate."
        );
        setIsSending(false);
        return;
      }

      setIsSending(false);
      onSentSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error sending reply";
      setErrorMessage(msg);
      setIsSending(false);
    }
  };

  const handleScheduleReply = async (
    scheduledAt: Date,
    formattedTime: string,
    timezone: string
  ) => {
    if (!draftText.trim()) return;
    setErrorMessage(null);
    setIsSending(true);

    try {
      const result = await EmailService.scheduleEmail({
        threadId,
        to: "recipient",
        subject: "Re: Thread",
        bodyText: draftText.trim(),
        scheduledAt: scheduledAt.toISOString(),
        userTimezone: timezone,
        userFormattedTime: formattedTime,
      });

      if (!result.success) {
        setErrorMessage(
          result.error || "Failed to schedule reply. Please try again."
        );
        setIsSending(false);
        return;
      }

      setSuccessMessage(`Reply scheduled for ${formattedTime}.`);
      setIsSending(false);
      setTimeout(() => {
        onSentSuccess();
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error scheduling reply";
      setErrorMessage(msg);
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className="space-y-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 transition-all duration-150"
      onKeyDown={handleKeyDown}
    >
      {/* Error Alert */}
      {errorMessage && (
        <div className="flex items-start space-x-2 rounded-md border border-[var(--status-urgent-border)] bg-[var(--status-urgent-subtle)] p-3 text-xs text-[var(--status-urgent)]">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">Failed to send reply</p>
            <p className="mt-0.5 text-[11px] leading-relaxed opacity-90">
              {errorMessage}
            </p>
          </div>
        </div>
      )}

      {/* Success Alert */}
      {successMessage && (
        <div className="flex items-center space-x-2 rounded-md border border-[var(--status-success-border)] bg-[var(--status-success-subtle)] p-3 text-xs text-[var(--status-success)]">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {/* Draft Header & Tone Selection */}
      <div className="flex flex-col justify-between gap-2 border-b border-[var(--border-subtle)] pb-2 sm:flex-row sm:items-center">
        <div className="flex items-center space-x-2 min-h-[22px]">
          <span className="text-xs font-semibold tracking-wider text-[#3F5F8F] uppercase dark:text-[#7CA1D8]">
            Reply Draft
          </span>
          {isLoading ? (
            <span className="flex items-center space-x-1 text-[11px] text-[var(--text-muted)] italic">
              <RefreshCw className="h-2.5 w-2.5 animate-spin text-[#3F5F8F] dark:text-[#7CA1D8]" />
              <span>Generating {activeTone} reply...</span>
            </span>
          ) : draft ? (
            <span className="max-w-xs truncate text-[11px] text-[var(--text-muted)] italic sm:max-w-md">
              • {draft.intentStrategy}
            </span>
          ) : null}
        </div>

        {/* Tone Selector */}
        <div className="flex items-center space-x-1">
          {[
            { id: "concise", label: "Concise" },
            { id: "formal", label: "Formal" },
            { id: "direct_refusal", label: "Decline" },
            { id: "request_call", label: "Call" },
          ].map((t) => {
            const isSelected = activeTone === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => handleToneSelect(t.id as ToneModifier)}
                className={`cursor-pointer rounded px-2 py-0.5 text-[11px] transition-colors duration-150 ${
                  isSelected
                    ? "border border-[var(--border-subtle)] bg-[var(--bg-surface-selected)] font-semibold text-[#3F5F8F] dark:text-[#7CA1D8]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Draft Text Area with Smooth Transition and Stable Layout */}
      <div className="relative">
        <Textarea
          value={draftText}
          onChange={(e) => setDraftText(e.target.value)}
          placeholder={isLoading ? "Generating draft..." : "Type or edit your response..."}
          disabled={isLoading}
          className={`min-h-[110px] border-[var(--border-subtle)] bg-[var(--bg-canvas)] font-sans text-xs leading-relaxed text-[var(--text-primary)] transition-opacity duration-150 ${
            isLoading ? "opacity-40 animate-pulse" : "opacity-100"
          }`}
        />
      </div>

      {/* Actions Toolbar */}
      <div className="flex flex-col justify-between gap-2 pt-1 sm:flex-row sm:items-center">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1 text-[11px] text-[var(--text-muted)]">
            <span>Press</span>
            <ShortcutKey>⌘</ShortcutKey>
            <ShortcutKey>Enter</ShortcutKey>
            <span>to send</span>
          </div>

          <label className="flex cursor-pointer items-center space-x-1.5 text-[11px] text-[var(--text-secondary)] select-none">
            <input
              type="checkbox"
              checked={archiveAfterSend}
              onChange={(e) => setArchiveAfterSend(e.target.checked)}
              className="h-3.5 w-3.5 cursor-pointer rounded border-[var(--border-subtle)] text-[#3F5F8F] focus:ring-0"
            />
            <span>Archive on send</span>
          </label>
        </div>

        <SplitSendButton
          onSendNow={handleSend}
          onScheduleSend={handleScheduleReply}
          isSending={isSending}
          disabled={isSending || isLoading || !draftText.trim() || !!successMessage}
          sendLabel={archiveAfterSend ? "Send & Archive" : "Send Reply"}
        />
      </div>
    </div>
  );
}
