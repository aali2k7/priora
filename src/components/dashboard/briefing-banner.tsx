import React from "react";
import { Sparkles, Calendar, AlertTriangle, Clock } from "lucide-react";
import { ExecutiveBriefing } from "@/types/ai";

interface BriefingBannerProps {
  briefing: ExecutiveBriefing;
}

export function BriefingBanner({ briefing }: BriefingBannerProps) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-sky-500/30 bg-gradient-to-r from-slate-900 via-slate-900/90 to-sky-950/40 p-6 shadow-panel">
      {/* Decorative Glow Background */}
      <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2 max-w-3xl">
          <div className="flex items-center space-x-2 text-xs font-semibold text-sky-400 uppercase tracking-wider">
            <Sparkles className="h-4 w-4" />
            <span>Morning Executive Briefing</span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center text-slate-400 font-medium lowercase">
              <Calendar className="h-3.5 w-3.5 mr-1 text-slate-400" />
              {briefing.date}
            </span>
          </div>

          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-100 leading-snug">
            {briefing.digestSummary}
          </h1>
        </div>

        {/* Executive Stats Badges */}
        <div className="flex items-center space-x-3 shrink-0 pt-2 md:pt-0">
          <div className="flex items-center space-x-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3.5 py-2">
            <AlertTriangle className="h-4 w-4 text-rose-400" />
            <div>
              <p className="text-sm font-bold text-rose-300">{briefing.urgentItemCount}</p>
              <p className="text-2xs text-rose-400/80 uppercase font-semibold">Urgent</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3.5 py-2">
            <Clock className="h-4 w-4 text-amber-400" />
            <div>
              <p className="text-sm font-bold text-amber-300">{briefing.waitingOnCount}</p>
              <p className="text-2xs text-amber-400/80 uppercase font-semibold">Pending</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
