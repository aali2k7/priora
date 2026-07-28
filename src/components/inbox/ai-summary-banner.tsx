import React from "react";
import { Sparkles, AlertCircle } from "lucide-react";
import { AISummary } from "@/types/ai";

interface AISummaryBannerProps {
  summary: AISummary;
}

export function AISummaryBanner({ summary }: AISummaryBannerProps) {
  return (
    <div className="rounded-lg border border-sky-500/30 bg-sky-950/20 p-4 shadow-ai space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs font-semibold text-sky-400">
          <Sparkles className="h-4 w-4" />
          <span>AI Executive Brief</span>
        </div>
        <span className="text-2xs font-mono font-medium text-sky-400/80 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
          Urgency Score: {summary.urgencyScore}/100
        </span>
      </div>

      <p className="text-xs md:text-sm font-medium text-slate-200 leading-relaxed">
        {summary.executiveBrief}
      </p>

      {summary.keyDecisionRequired && (
        <div className="flex items-start space-x-2 rounded-md bg-amber-500/10 border border-amber-500/20 p-2.5 text-xs text-amber-300">
          <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold">Key Decision Needed:</strong> {summary.keyDecisionRequired}
          </div>
        </div>
      )}

      {summary.bulletPoints.length > 0 && (
        <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside pt-1 border-t border-sky-500/10">
          {summary.bulletPoints.map((pt, i) => (
            <li key={i}>{pt}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
