"use client";

import React from "react";
import { Search, RefreshCw, Sparkles, User } from "lucide-react";
import { ShortcutKey } from "@/components/ui/shortcut-key";
import { Badge } from "@/components/ui/badge";
import { MOCK_EXECUTIVE_USER } from "@/lib/mock-data";

interface HeaderBarProps {
  onOpenCommandMenu?: () => void;
}

export function HeaderBar({ onOpenCommandMenu }: HeaderBarProps) {
  const [isSyncing, setIsSyncing] = React.useState(false);

  const handleManualSync = () => {
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 1200);
  };

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-800/80 bg-slate-950/80 px-4 md:px-6 backdrop-blur-md">
      {/* Search / Command Menu Trigger */}
      <button
        onClick={onOpenCommandMenu}
        className="flex h-9 w-64 md:w-80 items-center justify-between rounded-md border border-slate-800 bg-slate-900/60 px-3 text-xs text-slate-400 hover:border-slate-700 hover:text-slate-300 focus-ring cursor-pointer transition-colors"
      >
        <span className="flex items-center space-x-2">
          <Search className="h-3.5 w-3.5 text-slate-400" />
          <span>Search emails or run action...</span>
        </span>
        <div className="flex items-center space-x-1">
          <ShortcutKey>⌘</ShortcutKey>
          <ShortcutKey>K</ShortcutKey>
        </div>
      </button>

      {/* Right Header Status & User Controls */}
      <div className="flex items-center space-x-3">
        {/* Sync Trigger */}
        <button
          onClick={handleManualSync}
          disabled={isSyncing}
          className="hidden sm:flex items-center space-x-1.5 rounded-md border border-slate-800 bg-slate-900/60 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 focus-ring cursor-pointer transition-colors"
          title="Trigger Gmail Sync"
        >
          <RefreshCw className={`h-3.5 w-3.5 text-slate-400 ${isSyncing ? "animate-spin text-indigo-400" : ""}`} />
          <span>{isSyncing ? "Syncing..." : "Synced 2m ago"}</span>
        </button>

        {/* AI Mode Indicator */}
        <Badge variant="ai-glow" className="hidden md:inline-flex space-x-1">
          <Sparkles className="h-3 w-3 text-sky-400" />
          <span>Executive Engine</span>
        </Badge>

        {/* User Profile Avatar */}
        <div className="flex items-center space-x-2.5 pl-2 border-l border-slate-800/80">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold overflow-hidden">
            {MOCK_EXECUTIVE_USER.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={MOCK_EXECUTIVE_USER.avatarUrl} alt={MOCK_EXECUTIVE_USER.name} className="h-full w-full object-cover" />
            ) : (
              <User className="h-4 w-4 text-slate-400" />
            )}
          </div>
          <div className="hidden xl:block text-left">
            <p className="text-xs font-semibold text-slate-200 leading-tight">{MOCK_EXECUTIVE_USER.name}</p>
            <p className="text-2xs text-slate-400 leading-tight">{MOCK_EXECUTIVE_USER.title}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
