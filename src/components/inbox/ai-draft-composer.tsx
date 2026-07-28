"use client";

import React from "react";
import { AIDraftResponse, ToneModifier } from "@/types/ai";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ShortcutKey } from "@/components/ui/shortcut-key";
import { Sparkles, Send, RefreshCw, Check } from "lucide-react";
import { AIService } from "@/lib/ai-service";
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
    setIsLoading(true);

    AIService.getDraftResponse(threadId, activeTone).then((res) => {
      if (isMounted) {
        setDraft(res);
        setDraftText(res.draftText);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [threadId, activeTone]);

  const handleToneSelect = (tone: ToneModifier) => {
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
      <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-4 animate-pulse space-y-3">
        <div className="h-4 w-48 bg-slate-800 rounded" />
        <div className="h-20 bg-slate-800 rounded" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-indigo-500/30 bg-slate-900/90 p-4 shadow-panel space-y-4">
      {/* Draft Header & Strategy Tag */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2 text-xs font-semibold text-indigo-400">
          <Sparkles className="h-4 w-4 text-sky-400" />
          <span>AI Suggested Reply</span>
        </div>

        {draft && (
          <p className="text-2xs text-slate-400 italic">
            {draft.intentStrategy}
          </p>
        )}
      </div>

      {/* Tone Adjustment Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto custom-scrollbar pb-1">
        <span className="text-2xs text-slate-500 font-medium shrink-0">Adjust Tone:</span>
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
              className={`px-2.5 py-1 text-2xs font-medium rounded-full border transition-all cursor-pointer whitespace-nowrap ${
                isSelected
                  ? "bg-indigo-600/30 text-indigo-300 border-indigo-500/50"
                  : "bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-slate-200"
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
        className="min-h-[120px] font-sans text-xs sm:text-sm text-slate-100 bg-slate-950/80 border-slate-800"
      />

      {/* Actions Toolbar */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center space-x-2 text-2xs text-slate-500">
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
