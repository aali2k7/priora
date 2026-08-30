"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@/components/ui/dialog";
import { Search, Sparkles, Inbox, Focus, Settings, CheckCircle2, ArrowRight } from "lucide-react";
import { ShortcutKey } from "@/components/ui/shortcut-key";

interface CommandMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCompose?: () => void;
}

export function CommandMenu({ isOpen, onClose, onOpenCompose }: CommandMenuProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");

  const actions = [
    {
      id: "act_compose",
      title: "Compose New Email",
      subtitle: "Write and send a new email via Gmail",
      icon: Sparkles,
      shortcut: ["C"],
      action: () => {
        if (onOpenCompose) onOpenCompose();
      },
    },
    {
      id: "nav_dashboard",
      title: "Executive Overview",
      subtitle: "View briefing digest and attention feed",
      icon: Sparkles,
      shortcut: ["G", "O"],
      action: () => router.push("/dashboard"),
    },
    {
      id: "nav_inbox",
      title: "Open Inbox",
      subtitle: "View active 15-day mailbox dataset",
      icon: Inbox,
      shortcut: ["G", "I"],
      action: () => router.push("/inbox?view=inbox"),
    },
    {
      id: "nav_focused",
      title: "Open Focused",
      subtitle: "View Priora intelligence curated emails",
      icon: Focus,
      shortcut: ["G", "F"],
      action: () => router.push("/inbox?view=focused"),
    },
    {
      id: "nav_settings",
      title: "Settings & Preferences",
      subtitle: "Manage theme and Gmail connection",
      icon: Settings,
      shortcut: ["G", "S"],
      action: () => router.push("/settings"),
    },
    {
      id: "act_quick_reply",
      title: "Quick Reply with AI",
      subtitle: "Open draft composer on active thread",
      icon: CheckCircle2,
      shortcut: ["R"],
      action: () => router.push("/inbox?action=reply"),
    },
  ];

  const filteredActions = actions.filter(
    (a) =>
      a.title.toLowerCase().includes(query.toLowerCase()) ||
      a.subtitle.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (actFn: () => void) => {
    actFn();
    onClose();
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Command Palette">
      <div className="space-y-3">
        {/* Search Input Box */}
        <div className="relative flex items-center">
          <Search className="absolute left-3 h-3.5 w-3.5 text-[var(--text-muted)]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search..."
            className="w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-canvas)] py-2 pl-9 pr-3 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus-ring shadow-xs"
            autoFocus
          />
        </div>

        {/* Action List */}
        <div className="space-y-0.5 max-h-60 overflow-y-auto custom-scrollbar pt-1">
          {filteredActions.length === 0 ? (
            <p className="py-6 text-center text-xs text-[var(--text-muted)]">No matching commands.</p>
          ) : (
            filteredActions.map((act) => {
              const Icon = act.icon;
              return (
                <button
                  key={act.id}
                  onClick={() => handleSelect(act.action)}
                  className="flex w-full items-center justify-between rounded p-2 text-left hover:bg-[var(--bg-surface-hover)] transition-colors focus-ring group cursor-pointer"
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[var(--text-secondary)] group-hover:text-[#3F5F8F] dark:group-hover:text-[#7CA1D8] transition-colors">
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[var(--text-primary)]">{act.title}</p>
                      <p className="text-[10px] text-[var(--text-secondary)]">{act.subtitle}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    {act.shortcut.map((k) => (
                      <ShortcutKey key={k}>{k}</ShortcutKey>
                    ))}
                    <ArrowRight className="h-3 w-3 text-[var(--text-muted)] ml-1" />
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Keyboard Footer Tip */}
        <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)] text-[10px] text-[var(--text-muted)]">
          <span>Navigate with <ShortcutKey>↑</ShortcutKey> <ShortcutKey>↓</ShortcutKey></span>
          <span>Press <ShortcutKey>ESC</ShortcutKey> to close</span>
        </div>
      </div>
    </Dialog>
  );
}
