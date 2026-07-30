import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "ai-sparkle";
  size?: "sm" | "md" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus-ring disabled:opacity-50 disabled:pointer-events-none cursor-pointer select-none active:scale-[0.98]",
          // Sizes
          size === "sm" && "h-8 px-3 text-xs gap-1.5",
          size === "md" && "h-9 px-4 text-sm gap-2",
          size === "lg" && "h-11 px-6 text-base gap-2.5",
          size === "icon" && "h-9 w-9 p-0",
          // Variants
          variant === "primary" &&
            "bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-500/25 hover:shadow-md hover:shadow-indigo-500/35 hover:-translate-y-[1px]",
          variant === "secondary" &&
            "bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700/90 border border-slate-200 dark:border-slate-700/60 shadow-2xs hover:-translate-y-[1px]",
          variant === "outline" &&
            "border border-slate-300 dark:border-slate-700/80 bg-transparent text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:-translate-y-[1px]",
          variant === "ghost" &&
            "bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100",
          variant === "danger" &&
            "bg-rose-500/10 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30 hover:bg-rose-500/20 hover:-translate-y-[1px]",
          variant === "ai-sparkle" &&
            "bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-300/40 dark:border-indigo-500/30 hover:bg-indigo-500/20 shadow-xs hover:-translate-y-[1px]",
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
