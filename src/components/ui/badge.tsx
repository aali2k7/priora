import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "urgent" | "warning" | "success" | "ai-glow" | "vip";
}

export function Badge({ className, variant = "default", children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-md tracking-tight transition-colors select-none",
        variant === "default" &&
          "bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/80",
        variant === "urgent" &&
          "bg-rose-500/10 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-300/40 dark:border-rose-500/30",
        variant === "warning" &&
          "bg-amber-500/10 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-300/40 dark:border-amber-500/30",
        variant === "success" &&
          "bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-300/40 dark:border-emerald-500/30",
        variant === "ai-glow" &&
          "bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-300/40 dark:border-indigo-500/30",
        variant === "vip" &&
          "bg-indigo-500/15 dark:bg-indigo-500/20 text-indigo-800 dark:text-indigo-200 border border-indigo-300/50 dark:border-indigo-400/30 font-medium",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
