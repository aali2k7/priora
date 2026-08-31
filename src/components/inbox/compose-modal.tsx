"use client";

import React, { useState, useEffect } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ShortcutKey } from "@/components/ui/shortcut-key";
import { EmailService } from "@/lib/email-service";
import {
  Send,
  Sparkles,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTo?: string;
  initialSubject?: string;
  initialBody?: string;
  onSentSuccess?: () => void;
}

export function ComposeModal({
  isOpen,
  onClose,
  initialTo = "",
  initialSubject = "",
  initialBody = "",
  onSentSuccess,
}: ComposeModalProps) {
  const [to, setTo] = useState(initialTo);
  const [showCc, setShowCc] = useState(false);
  const [cc, setCc] = useState("");
  const [subject, setSubject] = useState(initialSubject);
  const [bodyText, setBodyText] = useState(initialBody);

  const [isSending, setIsSending] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [showAiPrompt, setShowAiPrompt] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTo(initialTo);
      setSubject(initialSubject);
      setBodyText(initialBody);
      setCc("");
      setShowCc(false);
      setErrorMessage(null);
      setSuccessMessage(null);
      setShowAiPrompt(false);
      setAiPrompt("");
    }
  }, [isOpen, initialTo, initialSubject, initialBody]);

  const handleSend = async () => {
    setErrorMessage(null);

    const trimmedTo = to.trim();
    const trimmedBody = bodyText.trim();

    if (!trimmedTo) {
      setErrorMessage("Please specify at least one recipient email address.");
      return;
    }

    if (!trimmedBody) {
      setErrorMessage("Please enter email body text before sending.");
      return;
    }

    setIsSending(true);

    try {
      const result = await EmailService.sendNewEmail({
        to: trimmedTo,
        subject: subject.trim() || "(No Subject)",
        bodyText: trimmedBody,
        cc: cc.trim() || undefined,
      });

      if (!result.success) {
        setErrorMessage(
          result.error ||
            "Failed to send email. Please check your Gmail connection and permissions."
        );
        setIsSending(false);
        return;
      }

      setSuccessMessage(
        "Email dispatched successfully from your Gmail account."
      );
      setIsSending(false);

      setTimeout(() => {
        if (onSentSuccess) onSentSuccess();
        onClose();
      }, 1200);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Unexpected error sending email";
      setErrorMessage(msg);
      setIsSending(false);
    }
  };

  const handleAiDraft = async (tone: "concise" | "formal" | "friendly") => {
    setIsAiGenerating(true);
    setErrorMessage(null);

    try {
      const instruction =
        aiPrompt.trim() ||
        subject.trim() ||
        bodyText.trim() ||
        "Compose a new email";
      const res = await fetch("/api/ai/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instruction,
          recipient: to.trim() || undefined,
          subject: subject.trim() || undefined,
          tone,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.draft?.draftText) {
        setBodyText(data.draft.draftText);
        setShowAiPrompt(false);
        return;
      }

      setErrorMessage(
        data.error ||
          "Failed to generate AI draft. Please check your AI connection and try again."
      );
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "AI generation error occurred";
      console.warn("[ComposeModal] AI generation error:", err);
      setErrorMessage(msg);
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Keyboard shortcut: Cmd/Ctrl + Enter to send
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="New Email"
      description="Send an email directly through your connected Gmail account"
    >
      <div className="space-y-3 pt-1" onKeyDown={handleKeyDown}>
        {/* Error Alert */}
        {errorMessage && (
          <div className="flex items-start space-x-2 rounded-md border border-[var(--status-urgent-border)] bg-[var(--status-urgent-subtle)] p-3 text-xs text-[var(--status-urgent)]">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold">Unable to send</p>
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

        {/* Recipients Input Row */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <label className="w-12 text-xs font-medium text-[var(--text-secondary)]">
              To:
            </label>
            <div className="relative flex-1">
              <Input
                type="email"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="recipient@example.com"
                className="h-8 text-xs"
                autoFocus
              />
            </div>
            <button
              type="button"
              onClick={() => setShowCc(!showCc)}
              className="cursor-pointer rounded px-1.5 py-1 text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              {showCc ? "Hide CC" : "CC"}
            </button>
          </div>

          {showCc && (
            <div className="flex items-center space-x-2">
              <label className="w-12 text-xs font-medium text-[var(--text-secondary)]">
                Cc:
              </label>
              <div className="flex-1">
                <Input
                  type="email"
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                  placeholder="colleague@example.com"
                  className="h-8 text-xs"
                />
              </div>
            </div>
          )}

          {/* Subject Row */}
          <div className="flex items-center space-x-2">
            <label className="w-12 text-xs font-medium text-[var(--text-secondary)]">
              Subject:
            </label>
            <div className="flex-1">
              <Input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email Subject"
                className="h-8 text-xs"
              />
            </div>
          </div>
        </div>

        {/* AI Assist Toolbar */}
        <div className="space-y-2 rounded border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-2">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowAiPrompt(!showAiPrompt)}
              className="flex cursor-pointer items-center space-x-1.5 text-xs font-medium text-[#3F5F8F] hover:underline dark:text-[#7CA1D8]"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Draft with AI Assistant</span>
              {showAiPrompt ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>

            {/* Quick Tone Buttons */}
            <div className="flex items-center space-x-1">
              {(["concise", "formal", "friendly"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleAiDraft(t)}
                  disabled={isAiGenerating}
                  className="cursor-pointer rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-0.5 text-[10px] font-semibold tracking-wider text-[var(--text-secondary)] uppercase transition-colors hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)] disabled:opacity-50"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {showAiPrompt && (
            <div className="flex items-center space-x-2 pt-1">
              <Input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Describe what you want to write (e.g. Schedule call on Thursday)..."
                className="h-7 flex-1 text-xs"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    e.stopPropagation();
                    handleAiDraft("concise");
                  }
                }}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAiDraft("concise")}
                disabled={isAiGenerating}
                className="h-7 px-2 text-xs"
              >
                {isAiGenerating ? (
                  <RefreshCw className="h-3 w-3 animate-spin" />
                ) : (
                  "Generate"
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Message Body Textarea */}
        <Textarea
          value={bodyText}
          onChange={(e) => setBodyText(e.target.value)}
          placeholder="Compose your email message..."
          className="min-h-[160px] border-[var(--border-subtle)] bg-[var(--bg-canvas)] font-sans text-xs leading-relaxed text-[var(--text-primary)]"
        />

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-2">
          <div className="flex items-center space-x-1 text-[11px] text-[var(--text-muted)]">
            <span>Press</span>
            <ShortcutKey>⌘</ShortcutKey>
            <ShortcutKey>Enter</ShortcutKey>
            <span>to send</span>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSending}
              type="button"
            >
              Cancel
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handleSend}
              disabled={isSending || !!successMessage}
              className="space-x-1.5"
              type="button"
            >
              {isSending ? (
                <>
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  <span>Sending via Gmail...</span>
                </>
              ) : (
                <>
                  <Send className="h-3 w-3" />
                  <span>Send Email</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
