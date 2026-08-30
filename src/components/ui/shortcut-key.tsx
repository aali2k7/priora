import { cn } from "@/lib/utils";

export function ShortcutKey({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        "inline-flex items-center justify-center rounded border border-[var(--border-subtle)] bg-[var(--bg-surface-hover)] px-1 py-0.5 text-[10px] font-mono text-[var(--text-secondary)] font-medium select-none",
        className
      )}
    >
      {children}
    </kbd>
  );
}
