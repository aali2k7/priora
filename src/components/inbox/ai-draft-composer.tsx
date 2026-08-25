"use client";

import React from "react";
import { AIDraftResponse, ToneModifier } from "@/types/ai";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ShortcutKey } from "@/components/ui/shortcut-key";
import { Sparkles, Send, RefreshCw } from "lucide-react";
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
          intentStrategy: `Strategy: Responding in ${activeTone} tone.`,
          draftText: "Hi,\n\nThank you for reaching out. I have reviewed the details and will follow up shortly.\n\nBest,\nAlex Mercer",
          suggestedTone: activeTone,
          lastUpdated: "Just now",
        });
        setDraftText("Hi,\n\nThank you for reaching out. I have reviewed the details and will follow up shortly.\n\nBest,\nAlex Mercer");
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
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-5 animate-pulse space-y-3 shadow-2xs">
        <div className="h-4 w-48 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="h-20 bg-slate-200 dark:bg-slate-800 rounded" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-indigo-500/30 bg-white/90 dark:bg-slate-900/90 p-5 shadow-card dark:shadow-panel space-y-4 transition-all">
      {/* Draft Header & Strategy Tag */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center space-x-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
          <Sparkles className="h-4 w-4" />
          <span>AI Suggested Reply</span>
        </div>

        {draft && (
          <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
            {draft.intentStrategy}
          </p>
        )}
      </div>

      {/* Tone Adjustment Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto custom-scrollbar pb-1">
        <span className="text-[11px] text-slate-500 font-medium shrink-0">Adjust Tone:</span>
        {[
          { id: "concise", label: "Concise" },
          { id: "formal", label: "Formal" },
          { id: "direct_refusal", label: "Direct Refusal" },
          { id: "request_call", label: "Request Call" },
        ].map((t) => {
          const isSelected = activeTone === t.id;
          return (
            <button
              key={t.id}
              onClick={() => handleToneSelect(t.id as ToneModifier)}
              className={`px-3 py-1 text-[11px] font-medium rounded-full border transition-all cursor-pointer whitespace-nowrap ${
                isSelected
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs font-semibold"
                  : "bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700/60 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Draft Text Area */}
      <Textarea
        value={draftText}
        onChange={(e) => setDraftText(e.target.value)}
        placeholder="Type or edit your response..."
        className="min-h-[120px] font-sans text-xs sm:text-sm text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-950/80 border-slate-200 dark:border-slate-800"
      />

      {/* Actions Toolbar */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center space-x-1.5 text-[11px] text-slate-500">
          <span>Press</span>
          <ShortcutKey>⌘</ShortcutKey>
          <ShortcutKey>Enter</ShortcutKey>
          <span>to send</span>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="primary"
            size="sm"
            onClick={handleSend}
            disabled={isSending}
            className="space-x-1.5"
          >
            {isSending ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-white" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5" />
                <span>Send Email</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
