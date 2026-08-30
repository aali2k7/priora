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
    <div
      className={cn(
        "inline-flex items-center rounded-md bg-[var(--bg-surface-hover)] p-0.5 border border-[var(--border-subtle)]",
        className
      )}
    >
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
        "inline-flex items-center space-x-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer select-none",
        isSelected
          ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs border border-[var(--border-subtle)] font-semibold"
          : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]",
        className
      )}
    >
      <span>{children}</span>
      {badge && <span>{badge}</span>}
    </button>
  );
}
