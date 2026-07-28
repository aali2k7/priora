import { cn } from "@/lib/utils";

export function ShortcutKey({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        "inline-flex items-center justify-center rounded border border-slate-700 bg-slate-800/80 px-1.5 py-0.5 text-2xs font-mono text-slate-300 font-semibold shadow-xs select-none",
        className
      )}
    >
      {children}
    </kbd>
  );
}
