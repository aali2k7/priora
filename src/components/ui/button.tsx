import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "ai" | "ai-sparkle";
  size?: "sm" | "md" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-medium rounded-md transition-colors duration-150 focus-ring disabled:opacity-50 disabled:pointer-events-none cursor-pointer select-none",
          // Sizes
          size === "sm" && "h-7 px-2.5 text-xs gap-1.5",
          size === "md" && "h-8 px-3.5 text-xs gap-2",
          size === "lg" && "h-9 px-4 text-sm gap-2.5",
          size === "icon" && "h-8 w-8 p-0",
          // Variants
          variant === "primary" &&
            "bg-[#3F5F8F] hover:bg-[#324C73] dark:bg-[#7CA1D8] dark:hover:bg-[#92B4E8] text-white dark:text-[#131416] border border-transparent shadow-xs font-semibold",
          variant === "secondary" &&
            "bg-[var(--bg-surface-hover)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-active)] border border-[var(--border-subtle)]",
          variant === "outline" &&
            "border border-[var(--border-subtle)] bg-transparent text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] hover:border-[var(--border-hover)]",
          variant === "ghost" &&
            "bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]",
          variant === "danger" &&
            "bg-[var(--status-urgent-subtle)] text-[var(--status-urgent)] border border-[var(--status-urgent-border)] hover:bg-[var(--status-urgent-subtle)]/80",
          (variant === "ai" || variant === "ai-sparkle") &&
            "bg-[var(--status-ai-subtle)] text-[var(--status-ai)] border border-[var(--status-ai-border)] hover:bg-[var(--status-ai-border)]/30 font-medium",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
