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
  User,
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

      setSuccessMessage("Email dispatched successfully from your Gmail account.");
      setIsSending(false);

      setTimeout(() => {
        if (onSentSuccess) onSentSuccess();
        onClose();
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unexpected error sending email";
      setErrorMessage(msg);
      setIsSending(false);
    }
  };

  const handleAiDraft = async (tone: "concise" | "formal" | "executive" | "friendly") => {
    setIsAiGenerating(true);
    setErrorMessage(null);

    try {
      // If user typed a custom prompt or topic, use it
      const topic = aiPrompt.trim() || subject.trim() || "Executive follow-up";
      const res = await fetch("/api/ai/draft?tone=" + tone, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          tone,
          context: bodyText || `Email to ${to || "recipient"} regarding ${subject || "topic"}`,
        }),
      }).catch(() => null);

      if (res && res.ok) {
        const data = await res.json();
        if (data.draft?.draftText) {
          setBodyText(data.draft.draftText);
          setShowAiPrompt(false);
          setIsAiGenerating(false);
          return;
        }
      }

      // High-quality executive client-side template fallback
      const greeting = to ? `Hi ${to.split("@")[0].replace(/[._]/g, " ")},` : "Hello,";
      let drafted = "";
      if (tone === "concise") {
        drafted = `${greeting}\n\nThank you for your note. I've reviewed the details and agree with the proposed direction. Let's proceed as planned.\n\nBest regards,\n`;
      } else if (tone === "formal") {
        drafted = `${greeting}\n\nThank you for reaching out. I have carefully reviewed the matter and appreciate the comprehensive overview provided. Please find my full confirmation attached to move forward.\n\nSincerely,\n`;
      } else if (tone === "friendly") {
        drafted = `${greeting}\n\nGreat connecting with you! Everything looks fantastic on my end, looking forward to working together on this.\n\nCheers,\n`;
      } else {
        drafted = `${greeting}\n\nFollowing up on our discussion regarding ${subject || "the strategic initiatives"}. The key deliverables are confirmed for execution.\n\nBest regards,\n`;
      }

      setBodyText(drafted);
      setShowAiPrompt(false);
    } catch (err) {
      console.warn("[ComposeModal] AI generation error:", err);
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
          <div className="flex items-start space-x-2 rounded-md bg-[var(--status-urgent-subtle)] border border-[var(--status-urgent-border)] p-3 text-xs text-[var(--status-urgent)]">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Unable to send</p>
              <p className="mt-0.5 text-[11px] leading-relaxed opacity-90">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="flex items-center space-x-2 rounded-md bg-[var(--status-success-subtle)] border border-[var(--status-success-border)] p-3 text-xs text-[var(--status-success)]">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span className="font-medium">{successMessage}</span>
          </div>
        )}

        {/* Recipients Input Row */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <label className="w-12 text-xs font-medium text-[var(--text-secondary)]">To:</label>
            <div className="flex-1 relative">
              <Input
                type="email"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="recipient@example.com"
                className="text-xs h-8"
                autoFocus
              />
            </div>
            <button
              type="button"
              onClick={() => setShowCc(!showCc)}
              className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] px-1.5 py-1 rounded cursor-pointer"
            >
              {showCc ? "Hide CC" : "CC"}
            </button>
          </div>

          {showCc && (
            <div className="flex items-center space-x-2">
              <label className="w-12 text-xs font-medium text-[var(--text-secondary)]">Cc:</label>
              <div className="flex-1">
                <Input
                  type="email"
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                  placeholder="colleague@example.com"
                  className="text-xs h-8"
                />
              </div>
            </div>
          )}

          {/* Subject Row */}
          <div className="flex items-center space-x-2">
            <label className="w-12 text-xs font-medium text-[var(--text-secondary)]">Subject:</label>
            <div className="flex-1">
              <Input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email Subject"
                className="text-xs h-8"
              />
            </div>
          </div>
        </div>

        {/* AI Assist Toolbar */}
        <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-2 space-y-2">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowAiPrompt(!showAiPrompt)}
              className="flex items-center space-x-1.5 text-xs font-medium text-[#3F5F8F] dark:text-[#7CA1D8] hover:underline cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Draft with AI Assistant</span>
              {showAiPrompt ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>

            {/* Quick Tone Buttons */}
            <div className="flex items-center space-x-1">
              {(["concise", "formal", "friendly"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleAiDraft(t)}
                  disabled={isAiGenerating}
                  className="px-2 py-0.5 text-[10px] uppercase font-semibold tracking-wider rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] cursor-pointer disabled:opacity-50 transition-colors"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {showAiPrompt && (
            <div className="pt-1 flex items-center space-x-2">
              <Input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Describe what you want to write (e.g. Schedule call on Thursday)..."
                className="text-xs h-7 flex-1"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAiDraft("concise")}
                disabled={isAiGenerating}
                className="h-7 text-xs px-2"
              >
                {isAiGenerating ? <RefreshCw className="h-3 w-3 animate-spin" /> : "Generate"}
              </Button>
            </div>
          )}
        </div>

        {/* Message Body Textarea */}
        <Textarea
          value={bodyText}
          onChange={(e) => setBodyText(e.target.value)}
          placeholder="Compose your email message..."
          className="min-h-[160px] text-xs font-sans text-[var(--text-primary)] bg-[var(--bg-canvas)] border-[var(--border-subtle)] leading-relaxed"
        />

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)]">
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
