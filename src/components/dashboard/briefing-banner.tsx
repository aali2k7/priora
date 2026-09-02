"use client";

import React, { useState } from "react";
import {
  Calendar,
  AlertTriangle,
  Clock,
  Sparkles,
  CheckCircle2,
  Volume2,
  VolumeX,
  ArrowRight,
  ShieldCheck,
  Target,
  Zap,
} from "lucide-react";
import { ExecutiveBriefing } from "@/types/ai";
import { Button } from "@/components/ui/button";

interface BriefingBannerProps {
  briefing: ExecutiveBriefing;
}

export function BriefingBanner({ briefing }: BriefingBannerProps) {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const toggleAudioBrief = () => {
    setIsPlayingAudio(!isPlayingAudio);
    if (!isPlayingAudio && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(
        `Good morning. Here is your Priora Executive Briefing. ${briefing.digestSummary} You currently have ${briefing.urgentItemCount} urgent items requiring your decision.`
      );
      utterance.rate = 1.05;
      utterance.onend = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
    } else if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  };

  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 space-y-5 shadow-xs">
      {/* 1. Header with Executive Date, Status & Audio Brief */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[var(--border-subtle)] pb-4 gap-3">
        <div className="flex items-center space-x-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#3F5F8F]/10 text-[#3F5F8F] dark:bg-[#7CA1D8]/10 dark:text-[#7CA1D8]">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-[#3F5F8F] dark:text-[#7CA1D8] uppercase tracking-wider">
              <span>Executive Command Agenda</span>
              <span className="text-[var(--text-muted)]">•</span>
              <span className="flex items-center text-[var(--text-secondary)] font-normal normal-case">
                <Calendar className="h-3.5 w-3.5 mr-1 text-[var(--text-muted)]" />
                {briefing.date}
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
              Daily synthesized decision matrix synthesized across email, calendar, and workflows
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Text to speech briefing player */}
          <Button
            variant="outline"
            size="sm"
            onClick={toggleAudioBrief}
            className={`text-xs space-x-1.5 ${
              isPlayingAudio
                ? "border-[#3F5F8F] text-[#3F5F8F] bg-[#3F5F8F]/10 animate-pulse"
                : ""
            }`}
          >
            {isPlayingAudio ? (
              <>
                <VolumeX className="h-3.5 w-3.5" />
                <span>Stop Brief</span>
              </>
            ) : (
              <>
                <Volume2 className="h-3.5 w-3.5" />
                <span>Listen to 60s Brief</span>
              </>
            )}
          </Button>

          <a
            href="/inbox?view=focused"
            className="inline-flex items-center space-x-1 rounded-md bg-[#3F5F8F] px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#3F5F8F]/90 transition-colors"
          >
            <span>Triage Focused</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* 2. Executive Synthesis Summary */}
      <div className="space-y-1">
        <h2 className="text-base sm:text-lg font-semibold text-[var(--text-primary)] leading-snug">
          {briefing.digestSummary}
        </h2>
      </div>

      {/* 3. Multi-Section Decision Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
        {/* Urgent Decisions Card */}
        <div className="rounded-lg border border-[var(--status-urgent-border)] bg-[var(--status-urgent-subtle)] p-3.5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="flex items-center space-x-1.5 text-xs font-semibold text-[var(--status-urgent)]">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Critical Decisions</span>
            </span>
            <span className="text-sm font-bold text-[var(--status-urgent)]">
              {briefing.urgentItemCount}
            </span>
          </div>
          <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
            High-stakes threads with pending stakeholder approvals or approaching deadlines.
          </p>
        </div>

        {/* Pending Dependencies Card */}
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3.5 space-y-1 dark:bg-amber-500/10">
          <div className="flex items-center justify-between">
            <span className="flex items-center space-x-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
              <Clock className="h-3.5 w-3.5" />
              <span>Awaiting Response</span>
            </span>
            <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
              {briefing.waitingOnCount}
            </span>
          </div>
          <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
            Unanswered outgoing proposals and external bottlenecks on your radar.
          </p>
        </div>

        {/* Zero-Inbox Status Card */}
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3.5 space-y-1 dark:bg-emerald-500/10">
          <div className="flex items-center justify-between">
            <span className="flex items-center space-x-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Executive Velocity</span>
            </span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              Active
            </span>
          </div>
          <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
            AI draft suggestions pre-warmed for instant sub-5-second review and dispatch.
          </p>
        </div>
      </div>
    </div>
  );
}
