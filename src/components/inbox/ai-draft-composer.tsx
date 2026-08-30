"use client";

import React from "react";
import { AIDraftResponse, ToneModifier } from "@/types/ai";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ShortcutKey } from "@/components/ui/shortcut-key";
import { Send, RefreshCw } from "lucide-react";
import { EmailService } from "@/lib/email-service";

interface AIDraftComposerProps {
  threadId: string;
  onSentSuccess: () => void;
}

export function AIDraftComposer({ threadId, onSentSuccess }: AIDraftComposerProps) {
  const [draft, setDraft] = React.useState<AIDraftResponse | null>(null);
  const [draftText, setDraftText] = React.useState("");
  const [activeTone, setActiveTone] = React.useState<ToneModifier>("concise");
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSending, setIsSending] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;

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
            setIsLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn("[AIDraftComposer] API fetch failed, using fallback:", err);
      }

      if (isMounted) {
        setDraft({
          threadId,
          intentStrategy: `Responding with ${activeTone} style`,
          draftText: "Hi,\n\nThank you for reaching out. I have reviewed the details and will follow up shortly.\n\nBest regards,\nAali",
          suggestedTone: activeTone,
          lastUpdated: "Just now",
        });
        setDraftText("Hi,\n\nThank you for reaching out. I have reviewed the details and will follow up shortly.\n\nBest regards,\nAali");
        setIsLoading(false);
      }
    }

    fetchDraft();

    return () => {
      isMounted = false;
    };
  }, [threadId, activeTone]);

  const handleToneSelect = (tone: ToneModifier) => {
    setIsLoading(true);
    setActiveTone(tone);
  };

  const handleSend = async () => {
    if (!draftText.trim()) return;
    setIsSending(true);

    await EmailService.sendReply(threadId, draftText);
    setIsSending(false);
    onSentSuccess();
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 space-y-2">
        <div className="flex items-center space-x-2 text-xs text-[var(--text-secondary)]">
          <RefreshCw className="h-3 w-3 animate-spin text-[#3F5F8F]" />
          <span>Generating AI reply draft...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 space-y-3">
      {/* Draft Header & Tone Selection */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[var(--border-subtle)]">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-[#3F5F8F] dark:text-[#7CA1D8] uppercase tracking-wider">
            Reply Draft
          </span>
          {draft && (
            <span className="text-[11px] text-[var(--text-muted)] italic">
              • {draft.intentStrategy}
            </span>
          )}
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
                onClick={() => handleToneSelect(t.id as ToneModifier)}
                className={`px-2 py-0.5 text-[11px] rounded transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-[var(--bg-surface-selected)] text-[#3F5F8F] dark:text-[#7CA1D8] font-semibold border border-[var(--border-subtle)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Draft Text Area */}
      <Textarea
        value={draftText}
        onChange={(e) => setDraftText(e.target.value)}
        placeholder="Type or edit your response..."
        className="min-h-[100px] font-sans text-xs text-[var(--text-primary)] bg-[var(--bg-canvas)] border-[var(--border-subtle)]"
      />

      {/* Actions Toolbar */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center space-x-1 text-[11px] text-[var(--text-muted)]">
          <span>Press</span>
          <ShortcutKey>⌘</ShortcutKey>
          <ShortcutKey>Enter</ShortcutKey>
          <span>to send</span>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleSend}
          disabled={isSending}
          className="space-x-1.5"
        >
          {isSending ? (
            <>
              <RefreshCw className="h-3 w-3 animate-spin" />
              <span>Sending...</span>
            </>
          ) : (
            <>
              <Send className="h-3 w-3" />
              <span>Send Reply</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
