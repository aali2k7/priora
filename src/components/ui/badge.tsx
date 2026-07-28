import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "urgent" | "warning" | "success" | "ai-glow" | "vip";
}

export function Badge({ className, variant = "default", children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 text-2xs font-semibold rounded-full tracking-wide transition-colors",
        variant === "default" && "bg-slate-800 text-slate-300 border border-slate-700",
        variant === "urgent" && "bg-rose-500/15 text-rose-400 border border-rose-500/30",
        variant === "warning" && "bg-amber-500/15 text-amber-400 border border-amber-500/30",
        variant === "success" && "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
        variant === "ai-glow" && "bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-ai",
        variant === "vip" && "bg-indigo-500/15 text-indigo-300 border border-indigo-500/30",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
