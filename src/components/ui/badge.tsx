import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "urgent" | "action" | "warning" | "success" | "ai" | "ai-glow" | "vip";
  dot?: boolean;
}

export function Badge({ className, variant = "default", dot = false, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-medium rounded tracking-tight transition-colors select-none",
        variant === "default" &&
          "bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] border border-[var(--border-subtle)]",
        variant === "urgent" &&
          "bg-[var(--status-urgent-subtle)] text-[var(--status-urgent)] border border-[var(--status-urgent-border)]",
        (variant === "action" || variant === "warning") &&
          "bg-[var(--status-action-subtle)] text-[var(--status-action)] border border-[var(--status-action-border)]",
        variant === "success" &&
          "bg-[var(--status-success-subtle)] text-[var(--status-success)] border border-[var(--status-success-border)]",
        (variant === "ai" || variant === "ai-glow") &&
          "bg-[var(--status-ai-subtle)] text-[var(--status-ai)] border border-[var(--status-ai-border)]",
        variant === "vip" &&
          "bg-[var(--status-ai-subtle)] text-[var(--status-ai)] border border-[var(--status-ai-border)] font-semibold",
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full shrink-0",
            variant === "urgent" && "bg-[var(--status-urgent)]",
            (variant === "action" || variant === "warning") && "bg-[var(--status-action)]",
            variant === "success" && "bg-[var(--status-success)]",
            (variant === "ai" || variant === "ai-glow" || variant === "vip") && "bg-[var(--status-ai)]",
            variant === "default" && "bg-[var(--text-muted)]"
          )}
        />
      )}
      {children}
    </span>
  );
}
