import { cn } from "@/lib/utils";

export function ShortcutKey({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        "inline-flex items-center justify-center rounded border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/90 px-1.5 py-0.5 text-[10px] font-mono text-slate-600 dark:text-slate-300 font-semibold shadow-2xs select-none",
        className
      )}
    >
      {children}
    </kbd>
  );
}
