"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@/components/ui/dialog";
import { Search, Sparkles, Inbox, Settings, CheckCircle2, ArrowRight } from "lucide-react";
import { ShortcutKey } from "@/components/ui/shortcut-key";

interface CommandMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandMenu({ isOpen, onClose }: CommandMenuProps) {
  const router = RouterHook();
  const [query, setQuery] = React.useState("");

  const actions = [
    {
      id: "nav_dashboard",
      title: "Go to Executive Briefing",
      subtitle: "View morning digest & top urgent action items",
      icon: Sparkles,
      shortcut: ["G", "B"],
      action: () => router.push("/dashboard"),
    },
    {
      id: "nav_inbox",
      title: "Go to Priority Inbox",
      subtitle: "Open 3-pane email triage workstation",
      icon: Inbox,
      shortcut: ["G", "I"],
      action: () => router.push("/inbox"),
    },
    {
      id: "nav_settings",
      title: "Go to Settings",
      subtitle: "Manage Gmail sync & privacy guardrails",
      icon: Settings,
      shortcut: ["G", "S"],
      action: () => router.push("/settings"),
    },
    {
      id: "act_quick_reply",
      title: "Quick Reply with AI",
      subtitle: "Draft executive reply for top urgent thread",
      icon: CheckCircle2,
      shortcut: ["R"],
      action: () => router.push("/inbox?action=reply"),
    },
  ];

  const filteredActions = actions.filter((a) =>
    a.title.toLowerCase().includes(query.toLowerCase()) ||
    a.subtitle.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (actFn: () => void) => {
    actFn();
    onClose();
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Command Palette">
      <div className="space-y-4">
        {/* Search Input Box */}
        <div className="relative flex items-center">
          <Search className="absolute left-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search..."
            className="w-full rounded-md border border-slate-800 bg-slate-950 py-2 pl-9 pr-3 text-sm text-slate-100 placeholder:text-slate-500 focus-ring"
            autoFocus
          />
        </div>

        {/* Action List */}
        <div className="space-y-1 max-h-64 overflow-y-auto custom-scrollbar pt-1">
          {filteredActions.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-500">No matching commands found.</p>
          ) : (
            filteredActions.map((act) => {
              const Icon = act.icon;
              return (
                <button
                  key={act.id}
                  onClick={() => handleSelect(act.action)}
                  className="flex w-full items-center justify-between rounded-md p-2.5 text-left hover:bg-slate-800/80 transition-colors focus-ring group cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded bg-slate-800 text-slate-300 group-hover:bg-indigo-600/20 group-hover:text-indigo-400">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-200">{act.title}</p>
                      <p className="text-2xs text-slate-400">{act.subtitle}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    {act.shortcut.map((k) => (
                      <ShortcutKey key={k}>{k}</ShortcutKey>
                    ))}
                    <ArrowRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-slate-300 ml-1" />
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Keyboard Footer Tip */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-2xs text-slate-400">
          <span>Use <ShortcutKey>↑</ShortcutKey> <ShortcutKey>↓</ShortcutKey> to navigate</span>
          <span>Press <ShortcutKey>ESC</ShortcutKey> to exit</span>
        </div>
      </div>
    </Dialog>
  );
}

function RouterHook() {
  return useRouter();
}
