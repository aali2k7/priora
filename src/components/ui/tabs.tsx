"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function Tabs({ value, onValueChange, children, className }: TabsProps) {
  return (
    <div className={cn("inline-flex items-center rounded-lg bg-slate-900/90 p-1 border border-slate-800", className)}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement<TabTriggerProps>(child)) {
          return React.cloneElement(child, {
            isSelected: child.props.value === value,
            onClick: () => onValueChange(child.props.value),
          });
        }
        return child;
      })}
    </div>
  );
}

interface TabTriggerProps {
  value: string;
  children: React.ReactNode;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
  badge?: React.ReactNode;
}

export function TabTrigger({ children, isSelected, onClick, className, badge }: TabTriggerProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center space-x-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all focus-ring cursor-pointer select-none",
        isSelected
          ? "bg-slate-800 text-slate-100 shadow-xs border border-slate-700/60"
          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40",
        className
      )}
    >
      <span>{children}</span>
      {badge && <span>{badge}</span>}
    </button>
  );
}
