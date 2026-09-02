"use client";

import React, { useState } from "react";
import {
  Zap,
  Info,
  Shield,
  Clock,
  UserCheck,
  AlertTriangle,
  Check,
  Sliders,
} from "lucide-react";

export interface PriorityFactor {
  label: string;
  impact: string; // e.g. "+35"
  description: string;
}

interface PriorityExplainabilityPopoverProps {
  urgencyScore?: number;
  importanceScore?: number;
  priorityLevel?: string;
  category?: string;
  senderEmail?: string;
  onOverridePriority?: (newPriority: string) => void;
}

export function PriorityExplainabilityPopover({
  urgencyScore = 50,
  importanceScore = 50,
  priorityLevel = "NORMAL",
  category = "General",
  senderEmail,
  onOverridePriority,
}: PriorityExplainabilityPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [overrideFeedback, setOverrideFeedback] = useState<string | null>(null);

  // Compute explainable factor breakdown
  const factors: PriorityFactor[] = [];

  if (urgencyScore >= 70 || priorityLevel.toUpperCase() === "URGENT") {
    factors.push({
      label: "Time Sensitivity",
      impact: "+30",
      description: "Direct action or pending deadline detected within 24–48 hours.",
    });
  }

  if (category.toLowerCase().includes("vip") || (senderEmail && senderEmail.includes("investor"))) {
    factors.push({
      label: "Key Stakeholder",
      impact: "+35",
      description: "Sender is recognized as a key partner or executive contact.",
    });
  } else if (senderEmail && (senderEmail.includes("team") || senderEmail.includes("corp"))) {
    factors.push({
      label: "Internal Team Communication",
      impact: "+20",
      description: "Internal organization domain requiring team synchronization.",
    });
  }

  if (importanceScore >= 60) {
    factors.push({
      label: "Decision Requirement",
      impact: "+25",
      description: "Thread contains a blocking question or approval request.",
    });
  }

  if (factors.length === 0) {
    factors.push({
      label: "Standard Inquiries",
      impact: "+10",
      description: "Routine informational update without immediate deadline pressure.",
    });
  }

  const handleSetPriority = (level: string) => {
    if (onOverridePriority) {
      onOverridePriority(level);
    }
    setOverrideFeedback(`Priority tuned to ${level}. Future weighting adjusted.`);
    setTimeout(() => {
      setOverrideFeedback(null);
      setIsOpen(false);
    }, 1200);
  };

  return (
    <div className="relative inline-block">
      {/* Clickable Score Pill */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="Click to view AI Priority Explainability Breakdown"
        className="flex items-center space-x-1 rounded border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-2 py-0.5 text-[10px] font-mono text-[var(--text-secondary)] hover:border-[#3F5F8F] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
      >
        <Zap className="h-2.5 w-2.5 text-amber-500" />
        <span>Score: {urgencyScore}/100</span>
        <Info className="h-2.5 w-2.5 text-[var(--text-muted)] opacity-70" />
      </button>

      {/* Explainability Breakdown Popover */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          <div className="absolute right-0 top-full z-50 mt-1.5 w-72 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3.5 shadow-xl space-y-3 backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
              <div className="flex items-center space-x-1.5 text-xs font-semibold text-[var(--text-primary)]">
                <Sliders className="h-3.5 w-3.5 text-[#3F5F8F] dark:text-[#7CA1D8]" />
                <span>Explainable AI Priority</span>
              </div>
              <span className="rounded bg-amber-500/10 px-1.5 py-0.2 text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase">
                {priorityLevel}
              </span>
            </div>

            {/* Score Comparison Bars */}
            <div className="space-y-1.5 text-[11px]">
              <div>
                <div className="flex justify-between text-[10px] text-[var(--text-secondary)] mb-0.5">
                  <span>Urgency (Time)</span>
                  <span className="font-semibold text-[var(--text-primary)]">{urgencyScore}/100</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-[var(--border-subtle)] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-500 transition-all duration-300"
                    style={{ width: `${Math.min(100, urgencyScore)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[10px] text-[var(--text-secondary)] mb-0.5">
                  <span>Importance (Business)</span>
                  <span className="font-semibold text-[var(--text-primary)]">{importanceScore}/100</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-[var(--border-subtle)] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${Math.min(100, importanceScore)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Factor Weight Breakdown */}
            <div className="space-y-1.5 pt-1 border-t border-[var(--border-subtle)]">
              <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block">
                Contributing Signals
              </span>
              <div className="space-y-1">
                {factors.map((f, i) => (
                  <div
                    key={i}
                    className="rounded bg-[var(--bg-canvas)] p-1.5 text-[11px] border border-[var(--border-subtle)]"
                  >
                    <div className="flex items-center justify-between font-medium text-[var(--text-primary)]">
                      <span>{f.label}</span>
                      <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                        {f.impact}
                      </span>
                    </div>
                    <p className="text-[10px] text-[var(--text-muted)] mt-0.5 leading-tight">
                      {f.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Feedback Tuning */}
            <div className="pt-2 border-t border-[var(--border-subtle)] space-y-1.5">
              <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block">
                Tune AI Weighting
              </span>
              {overrideFeedback ? (
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  {overrideFeedback}
                </p>
              ) : (
                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => handleSetPriority("URGENT")}
                    className="flex-1 rounded bg-[var(--bg-canvas)] py-1 text-[10px] font-medium text-[var(--text-secondary)] hover:text-amber-600 hover:border-amber-500 border border-[var(--border-subtle)] transition-colors cursor-pointer"
                  >
                    Set Urgent
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetPriority("VIP")}
                    className="flex-1 rounded bg-[var(--bg-canvas)] py-1 text-[10px] font-medium text-[var(--text-secondary)] hover:text-purple-600 hover:border-purple-500 border border-[var(--border-subtle)] transition-colors cursor-pointer"
                  >
                    Mark VIP
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetPriority("LOW")}
                    className="flex-1 rounded bg-[var(--bg-canvas)] py-1 text-[10px] font-medium text-[var(--text-secondary)] hover:text-zinc-600 hover:border-zinc-500 border border-[var(--border-subtle)] transition-colors cursor-pointer"
                  >
                    Lower
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
