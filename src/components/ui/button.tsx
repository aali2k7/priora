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
          "inline-flex items-center justify-center font-medium rounded-md transition-colors focus-ring disabled:opacity-50 disabled:pointer-events-none cursor-pointer",
          // Sizes
          size === "sm" && "h-8 px-3 text-xs",
          size === "md" && "h-9 px-4 text-sm",
          size === "lg" && "h-11 px-6 text-base",
          size === "icon" && "h-9 w-9 p-0",
          // Variants
          variant === "primary" && "bg-indigo-600 text-white hover:bg-indigo-500 shadow-sm",
          variant === "secondary" && "bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-700/60",
          variant === "outline" && "border border-slate-700 bg-transparent text-slate-200 hover:bg-slate-800/60",
          variant === "ghost" && "bg-transparent text-slate-300 hover:bg-slate-800 hover:text-slate-100",
          variant === "danger" && "bg-rose-600/90 text-white hover:bg-rose-600",
          variant === "ai-sparkle" && "bg-sky-500/15 text-sky-300 border border-sky-500/30 hover:bg-sky-500/25 shadow-ai",
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
