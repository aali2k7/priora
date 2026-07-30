import React from "react";
import { Sparkles, Calendar, AlertTriangle, Clock } from "lucide-react";
import { ExecutiveBriefing } from "@/types/ai";

interface BriefingBannerProps {
  briefing: ExecutiveBriefing;
}

export function BriefingBanner({ briefing }: BriefingBannerProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 p-6 md:p-8 shadow-card transition-all">
      {/* Decorative Indigo Glow Background */}
      <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-3 max-w-3xl">
          <div className="flex items-center space-x-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
            <Sparkles className="h-4 w-4" />
            <span>Morning Executive Briefing</span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="flex items-center text-slate-500 dark:text-slate-400 font-normal lowercase">
              <Calendar className="h-3.5 w-3.5 mr-1 text-slate-400" />
              {briefing.date}
            </span>
          </div>

          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 leading-snug">
            {briefing.digestSummary}
          </h1>
        </div>

        {/* Executive Stats Badges */}
        <div className="flex items-center space-x-3 shrink-0 pt-2 md:pt-0">
          <div className="flex items-center space-x-2.5 rounded-xl border border-rose-200/80 dark:border-rose-500/20 bg-rose-500/5 px-4 py-2.5 shadow-2xs">
            <AlertTriangle className="h-4.5 w-4.5 text-rose-600 dark:text-rose-400" />
            <div>
              <p className="text-sm font-semibold text-rose-700 dark:text-rose-300 leading-none">{briefing.urgentItemCount}</p>
              <p className="text-[10px] text-rose-600/80 dark:text-rose-400/80 font-medium mt-0.5">Urgent</p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 rounded-xl border border-amber-200/80 dark:border-amber-500/20 bg-amber-500/5 px-4 py-2.5 shadow-2xs">
            <Clock className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="text-sm font-semibold text-amber-700 dark:text-amber-300 leading-none">{briefing.waitingOnCount}</p>
              <p className="text-[10px] text-amber-600/80 dark:text-amber-400/80 font-medium mt-0.5">Pending</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
