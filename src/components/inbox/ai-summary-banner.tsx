import React from "react";
import { Sparkles, AlertCircle, CheckCircle2, Clock, FileText, UserCheck, ShieldAlert, Award } from "lucide-react";
import { AISummary } from "@/types/ai";

interface AISummaryBannerProps {
  summary: AISummary;
}

export function AISummaryBanner({ summary }: AISummaryBannerProps) {
  const keyInfo = summary.keyInformation;
  const insights = summary.aiInsights;
  const recAction = summary.recommendedAction;

  return (
    <div className="rounded-xl border border-sky-500/30 bg-gradient-to-b from-sky-950/30 via-slate-900/90 to-slate-950 p-5 shadow-ai space-y-5">
      {/* Top Banner Header: Title + Urgency Score + Reading Time Saved */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-sky-500/20 pb-3">
        <div className="flex items-center space-x-2 text-xs font-semibold text-sky-400">
          <Sparkles className="h-4 w-4" />
          <span className="uppercase tracking-wider">AI Executive Brief & Decision Engine</span>
        </div>

        <div className="flex items-center space-x-2">
          {summary.readingTimeSaved && (
            <span className="text-2xs font-medium text-slate-300 bg-slate-800/80 px-2.5 py-0.5 rounded border border-slate-700">
              {summary.readingTimeSaved}
            </span>
          )}
          <span className="text-2xs font-mono font-bold text-sky-300 bg-sky-500/15 px-2.5 py-0.5 rounded border border-sky-500/30">
            Urgency Score: {summary.urgencyScore}/100
          </span>
        </div>
      </div>

      {/* 2-Sentence Executive Brief */}
      <p className="text-xs sm:text-sm font-semibold text-slate-100 leading-relaxed">
        {summary.executiveBrief}
      </p>

      {/* Key Decision Needed Pill */}
      {summary.keyDecisionRequired && (
        <div className="flex items-start space-x-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 text-xs text-amber-300">
          <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold uppercase text-2xs tracking-wider text-amber-400 block mb-0.5">Key Decision Needed:</strong>
            {summary.keyDecisionRequired}
          </div>
        </div>
      )}

      {/* Structured Key Information Panel (For Faculty / University Outing Demo) */}
      {keyInfo && (
        <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <h4 className="text-2xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
              <UserCheck className="h-3.5 w-3.5 text-indigo-400" />
              <span>Extracted Key Information Panel</span>
            </h4>
            <span className="text-2xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Confidence: {keyInfo.confidenceScore}%
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            {keyInfo.studentName && (
              <div>
                <span className="text-2xs text-slate-500 block font-medium">Student Name:</span>
                <span className="font-semibold text-slate-200">{keyInfo.studentName}</span>
              </div>
            )}

            {keyInfo.studentId && (
              <div>
                <span className="text-2xs text-slate-500 block font-medium">Student ID:</span>
                <span className="font-mono text-indigo-300 font-semibold">{keyInfo.studentId}</span>
              </div>
            )}

            {keyInfo.program && (
              <div>
                <span className="text-2xs text-slate-500 block font-medium">Program / Course:</span>
                <span className="text-slate-300 font-medium">{keyInfo.program}</span>
              </div>
            )}

            {keyInfo.requestedDates && (
              <div>
                <span className="text-2xs text-slate-500 block font-medium">Requested Dates:</span>
                <span className="text-amber-400 font-semibold flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>{keyInfo.requestedDates}</span>
                </span>
              </div>
            )}

            {keyInfo.parentsCCd && (
              <div>
                <span className="text-2xs text-slate-500 block font-medium">Parents CC&apos;d:</span>
                <span className="text-emerald-400 font-medium flex items-center space-x-1">
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                  <span>{keyInfo.parentsCCd}</span>
                </span>
              </div>
            )}

            {keyInfo.reason && (
              <div className="col-span-1 sm:col-span-2">
                <span className="text-2xs text-slate-500 block font-medium">Extracted Reason:</span>
                <span className="text-slate-200 font-medium">{keyInfo.reason}</span>
              </div>
            )}
          </div>

          {keyInfo.attachments && keyInfo.attachments.length > 0 && (
            <div className="pt-2 border-t border-slate-800/80 flex items-center space-x-2 text-xs">
              <FileText className="h-3.5 w-3.5 text-sky-400 shrink-0" />
              <span className="text-2xs text-slate-400">Attached Documents:</span>
              {keyInfo.attachments.map((att, idx) => (
                <span key={idx} className="text-2xs font-mono text-sky-300 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                  {att}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* AI Insights & Observations Checklist */}
      {insights && insights.length > 0 && (
        <div className="space-y-2 pt-1">
          <h4 className="text-2xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
            <ShieldAlert className="h-3.5 w-3.5 text-sky-400" />
            <span>AI Automated Verification Insights</span>
          </h4>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
            {insights.map((ins, i) => (
              <li key={i} className="flex items-center space-x-2 bg-slate-900/60 p-2 rounded border border-slate-800">
                <span className="text-emerald-400 font-bold">{ins}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommended Action Box */}
      {recAction && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3.5 text-xs text-emerald-300">
          <div className="flex items-center space-x-2.5">
            <Award className="h-5 w-5 text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold uppercase text-2xs tracking-wider text-emerald-400 block">Recommended Action:</span>
              <strong className="text-sm text-emerald-200 font-semibold">{recAction.actionTitle}</strong>
              <p className="text-2xs text-emerald-400/90 mt-0.5">{recAction.reasoning}</p>
            </div>
          </div>

          <div className="shrink-0 text-right">
            <span className="text-2xs font-mono font-bold text-emerald-300 bg-emerald-500/20 px-2.5 py-1 rounded border border-emerald-500/40">
              Confidence: {recAction.confidenceScore}%
            </span>
          </div>
        </div>
      )}

      {/* Standard Bullet Points (Fallback if not custom panel) */}
      {!keyInfo && summary.bulletPoints.length > 0 && (
        <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside pt-1 border-t border-sky-500/10">
          {summary.bulletPoints.map((pt, i) => (
            <li key={i}>{pt}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
