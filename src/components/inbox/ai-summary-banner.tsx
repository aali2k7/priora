"use client";

import React from "react";
import { Clock, RefreshCw } from "lucide-react";
import { AISummary } from "@/types/ai";
import { Button } from "@/components/ui/button";

interface AISummaryBannerProps {
  summary: AISummary;
  onReanalyze?: () => void;
  isReanalyzing?: boolean;
}

export function AISummaryBanner({ summary, onReanalyze, isReanalyzing }: AISummaryBannerProps) {
  const isAnalyzed = Boolean(summary.analyzedAt);
  const keyInfo = isAnalyzed ? summary.keyInformation : undefined;
  const insights = isAnalyzed ? summary.aiInsights : undefined;
  const recAction = isAnalyzed ? summary.recommendedAction : undefined;

  return (
    <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 space-y-3.5">
      {/* 1. Header: AI Brief Label + Re-analyze Action */}
      <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-[#3F5F8F] dark:text-[#7CA1D8] uppercase tracking-wider">
            AI Brief
          </span>
          {isAnalyzed ? (
            <span className="text-[10px] text-[var(--text-muted)] font-mono">
              • Persisted analysis
            </span>
          ) : (
            <span className="text-[10px] text-[var(--text-muted)] font-mono">
              • Pending
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {onReanalyze && (
            <Button
              variant="outline"
              size="sm"
              onClick={onReanalyze}
              disabled={isReanalyzing}
              className="text-[11px] h-6 px-2 text-[var(--text-secondary)]"
              title="Request fresh Gemini AI analysis"
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${isReanalyzing ? "animate-spin text-[#3F5F8F]" : "text-[var(--text-muted)]"}`} />
              <span>{isReanalyzing ? "Analyzing..." : isAnalyzed ? "Re-analyze" : "Analyze"}</span>
            </Button>
          )}

          {isAnalyzed && typeof summary.urgencyScore === "number" && (
            <span className="text-[10px] font-mono text-[var(--text-secondary)] bg-[var(--bg-canvas)] px-2 py-0.5 rounded border border-[var(--border-subtle)]">
              Score: {summary.urgencyScore}/100
            </span>
          )}
        </div>
      </div>

      {/* 2. Executive Brief Statement */}
      {isAnalyzed ? (
        <p className="text-xs text-[var(--text-primary)] leading-relaxed font-normal">
          {summary.executiveBrief}
        </p>
      ) : (
        <div className="flex items-center space-x-2 py-1 text-xs text-[var(--text-secondary)]">
          <Clock className="h-3.5 w-3.5 text-[var(--text-muted)] shrink-0" />
          <span>Analysis pending. Click &quot;Analyze&quot; to run Gemini structured extraction.</span>
        </div>
      )}

      {/* 3. Key Decision Needed (If Any) */}
      {isAnalyzed && summary.keyDecisionRequired && (
        <div className="p-2.5 rounded bg-[var(--status-action-subtle)] border border-[var(--status-action-border)] space-y-0.5">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--status-action)] block">
            Key Decision Needed
          </span>
          <p className="text-xs text-[var(--text-primary)] leading-relaxed font-normal">
            {summary.keyDecisionRequired}
          </p>
        </div>
      )}

      {/* 4. Action Required / Recommended Action */}
      {isAnalyzed && recAction && (
        <div className="pt-2 border-t border-[var(--border-subtle)] space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)] block">
            Recommended Action
          </span>
          <p className="text-xs font-semibold text-[var(--text-primary)]">
            {recAction.actionTitle}
          </p>
          <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
            {recAction.reasoning}
          </p>
        </div>
      )}

      {/* 5. Key Extracted Context (If Available) */}
      {isAnalyzed && keyInfo && (keyInfo.studentName || keyInfo.requestedDates || keyInfo.program || keyInfo.reason) && (
        <div className="pt-2 border-t border-[var(--border-subtle)] space-y-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)] block">
            Extracted Context
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {keyInfo.studentName && (
              <div>
                <span className="text-[10px] text-[var(--text-muted)] block">Contact</span>
                <span className="font-medium text-[var(--text-primary)]">{keyInfo.studentName}</span>
              </div>
            )}
            {keyInfo.requestedDates && (
              <div>
                <span className="text-[10px] text-[var(--text-muted)] block">Dates</span>
                <span className="font-medium text-[var(--status-action)]">{keyInfo.requestedDates}</span>
              </div>
            )}
            {keyInfo.program && (
              <div className="col-span-2">
                <span className="text-[10px] text-[var(--text-muted)] block">Project / Program</span>
                <span className="text-[var(--text-primary)]">{keyInfo.program}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5b. Extracted Commitments & Action Items (Multi-Party Attribution) */}
      {isAnalyzed && summary.commitments && summary.commitments.length > 0 && (
        <div className="pt-2 border-t border-[var(--border-subtle)] space-y-2">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)] block">
            Extracted Commitments & Deadlines
          </span>
          <div className="space-y-1.5">
            {summary.commitments.map((comm) => (
              <div
                key={comm.id}
                className="flex items-start justify-between rounded-md bg-[var(--bg-canvas)] p-2 text-xs border border-[var(--border-subtle)]"
              >
                <div className="flex items-start space-x-2">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-3.5 w-3.5 rounded border-[var(--border-subtle)] text-[#3F5F8F] focus:ring-0 cursor-pointer"
                  />
                  <div className="space-y-0.5">
                    <span className="font-medium text-[var(--text-primary)]">
                      {comm.task}
                    </span>
                    <div className="flex items-center space-x-1.5 text-[10px] text-[var(--text-secondary)]">
                      <span
                        className={`rounded px-1.5 py-0.2 font-semibold uppercase tracking-wider ${
                          comm.owner === "YOU"
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            : comm.owner === "COUNTERPARTY"
                            ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                            : "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                        }`}
                      >
                        {comm.ownerName ? `${comm.owner}: ${comm.ownerName}` : comm.owner}
                      </span>

                      {comm.deadlineText && (
                        <span
                          className={`rounded px-1.5 py-0.2 font-medium ${
                            comm.deadlineType === "HARD_DEADLINE"
                              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold"
                              : "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400"
                          }`}
                        >
                          {comm.deadlineText}
                        </span>
                      )}

                      {comm.confidenceScore < 80 && (
                        <span className="rounded bg-amber-500/10 px-1 py-0.2 text-[9px] text-amber-600 dark:text-amber-400">
                          Verify
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Priora Insights (Clean Bullet List) */}
      {isAnalyzed && insights && insights.length > 0 && (
        <div className="pt-2 border-t border-[var(--border-subtle)] space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)] block">
            Priora Insights
          </span>
          <ul className="space-y-1 text-xs text-[var(--text-secondary)]">
            {insights.map((ins, i) => (
              <li key={i} className="flex items-start space-x-1.5 leading-relaxed">
                <span className="text-[#3F5F8F] dark:text-[#7CA1D8] font-bold text-xs shrink-0">•</span>
                <span>{ins}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
