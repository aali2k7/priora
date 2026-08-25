import React from "react";
import { Sparkles, AlertCircle, CheckCircle2, Clock, FileText, UserCheck, ShieldCheck, Award, RefreshCw } from "lucide-react";
import { AISummary } from "@/types/ai";
import { Button } from "@/components/ui/button";

interface AISummaryBannerProps {
  summary: AISummary;
  onReanalyze?: () => void;
  isReanalyzing?: boolean;
}

export function AISummaryBanner({ summary, onReanalyze, isReanalyzing }: AISummaryBannerProps) {
  const keyInfo = summary.keyInformation;
  const insights = summary.aiInsights;
  const recAction = summary.recommendedAction;

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/80 p-6 shadow-card dark:shadow-glass space-y-6 transition-all">
      {/* 1. Header: Title + Urgency Score + Reading Time Saved */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-100 dark:border-slate-800/60">
        <div className="flex items-center space-x-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
          <Sparkles className="h-4 w-4" />
          <span>Executive Brief & Decision Engine</span>
          {summary.analyzedAt && (
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
              Gemini AI
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
              className="text-[11px] h-7 px-2.5 text-slate-600 dark:text-slate-300"
              title="Request fresh Gemini AI analysis"
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${isReanalyzing ? "animate-spin text-indigo-500" : "text-slate-400"}`} />
              <span>{isReanalyzing ? "Analyzing..." : "Re-analyze"}</span>
            </Button>
          )}
          {summary.readingTimeSaved && (
            <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 px-2.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-700/60">
              {summary.readingTimeSaved}
            </span>
          )}
          <span className="text-[11px] font-mono text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
            Urgency Score: {summary.urgencyScore}/100
          </span>
        </div>
      </div>

      {/* 2. Executive Brief Statement */}
      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-relaxed">
        {summary.executiveBrief}
      </p>

      {/* 3. Key Decision Required (If Any) */}
      {summary.keyDecisionRequired && (
        <div className="flex items-start space-x-3 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 p-4 text-xs text-amber-900 dark:text-amber-300">
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold text-xs text-amber-800 dark:text-amber-300 block">Key Decision Needed</span>
            <p className="text-xs text-amber-900/90 dark:text-amber-300/90 font-normal leading-relaxed">{summary.keyDecisionRequired}</p>
          </div>
        </div>
      )}

      {/* 4. Extracted Information Panel (Apple Settings Style Grid) */}
      {keyInfo && (
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
            <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-2">
              <UserCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span>Extracted Key Information</span>
            </h4>
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 px-2.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-700/60 font-normal">
              Confidence {keyInfo.confidenceScore}%
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs pt-1">
            {keyInfo.studentName && (
              <div className="space-y-0.5">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal block">Student Name</span>
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{keyInfo.studentName}</span>
              </div>
            )}

            {keyInfo.studentId && (
              <div className="space-y-0.5">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal block">Student ID</span>
                <span className="text-sm font-mono text-indigo-600 dark:text-indigo-400 font-medium">{keyInfo.studentId}</span>
              </div>
            )}

            {keyInfo.program && (
              <div className="space-y-0.5">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal block">Program / Course</span>
                <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{keyInfo.program}</span>
              </div>
            )}

            {keyInfo.requestedDates && (
              <div className="space-y-0.5">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal block">Requested Dates</span>
                <span className="text-sm font-medium text-amber-700 dark:text-amber-400 flex items-center space-x-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{keyInfo.requestedDates}</span>
                </span>
              </div>
            )}

            {keyInfo.parentsCCd && (
              <div className="space-y-0.5">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal block">Parents CC&apos;d</span>
                <span className="text-sm font-medium text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{keyInfo.parentsCCd}</span>
                </span>
              </div>
            )}

            {keyInfo.reason && (
              <div className="col-span-1 sm:col-span-2 space-y-0.5">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal block">Extracted Reason</span>
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{keyInfo.reason}</span>
              </div>
            )}
          </div>

          {keyInfo.attachments && keyInfo.attachments.length > 0 && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center space-x-2 text-xs">
              <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">Attached Documents:</span>
              {keyInfo.attachments.map((att, idx) => (
                <span key={idx} className="text-[11px] font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/60 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700/60">
                  {att}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. AI Verification Insights (Simple Clean List with Subtle Checkmark Icons) */}
      {insights && insights.length > 0 && (
        <div className="space-y-2 pt-1">
          <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-2">
            <ShieldCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span>AI Automated Verification Insights</span>
          </h4>
          <ul className="space-y-2 pt-1 text-xs text-slate-700 dark:text-slate-300">
            {insights.map((ins, i) => (
              <li key={i} className="flex items-start space-x-2.5">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0 mt-0.5">✓</span>
                <span className="text-xs text-slate-700 dark:text-slate-300 font-normal leading-relaxed">{ins}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 6. Recommended Action Card (Primary Focal Point with Subtle Emerald Tint) */}
      {recAction && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 p-5 text-xs text-slate-900 dark:text-slate-100 shadow-2xs">
          <div className="flex items-start space-x-3.5">
            <Award className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold text-xs text-emerald-800 dark:text-emerald-300 block">Recommended Action</span>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 leading-snug">{recAction.actionTitle}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-normal leading-relaxed">{recAction.reasoning}</p>
            </div>
          </div>

          <div className="shrink-0 text-right">
            <span className="text-[11px] font-mono text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 px-3 py-1 rounded-md border border-slate-200 dark:border-slate-700 font-medium inline-block">
              Confidence {recAction.confidenceScore}%
            </span>
          </div>
        </div>
      )}

      {/* Standard Bullet Points (Fallback if not custom panel) */}
      {!keyInfo && summary.bulletPoints.length > 0 && (
        <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300 list-disc list-inside pt-1 border-t border-slate-100 dark:border-slate-800/60">
          {summary.bulletPoints.map((pt, i) => (
            <li key={i} className="font-normal leading-relaxed">{pt}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
