"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, RefreshCw, Sparkles, User, Sun, Moon, Monitor, LogOut } from "lucide-react";
import { ShortcutKey } from "@/components/ui/shortcut-key";
import { Badge } from "@/components/ui/badge";
import { MOCK_EXECUTIVE_USER } from "@/lib/mock-data";
import { useTheme } from "@/components/theme-provider";
import { authClient, useSession } from "@/lib/auth-client";

interface HeaderBarProps {
  onOpenCommandMenu?: () => void;
}

export function HeaderBar({ onOpenCommandMenu }: HeaderBarProps) {
  const router = useRouter();
  const [isSyncing, setIsSyncing] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();

  const activeUser = session?.user
    ? {
        name: session.user.name || MOCK_EXECUTIVE_USER.name,
        email: session.user.email || MOCK_EXECUTIVE_USER.email,
        title: MOCK_EXECUTIVE_USER.title,
        avatarUrl: session.user.image || MOCK_EXECUTIVE_USER.avatarUrl,
      }
    : MOCK_EXECUTIVE_USER;

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await fetch("/api/gmail/sync", { method: "POST" });
    } catch (err) {
      console.error("Sync error:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const cycleTheme = () => {
    if (theme === "system") setTheme("light");
    else if (theme === "light") setTheme("dark");
    else setTheme("system");
  };

  const handleSignOut = async () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("priora-demo-session");
      }
      await authClient.signOut();
    } catch (err) {
      console.error("Sign out error:", err);
    } finally {
      router.push("/login");
    }
  };

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 px-4 md:px-6 backdrop-blur-md transition-colors duration-200">
      {/* Search / Command Menu Trigger */}
      <button
        onClick={onOpenCommandMenu}
        className="flex h-9 w-64 md:w-80 items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/60 px-3 text-xs text-slate-500 dark:text-slate-400 hover:border-indigo-500/40 hover:text-slate-800 dark:hover:text-slate-200 focus-ring cursor-pointer transition-all shadow-2xs"
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

      {/* Right Header Status, Theme & User Controls */}
      <div className="flex items-center space-x-3">
        {/* Sync Trigger */}
        <button
          onClick={handleManualSync}
          disabled={isSyncing}
          className="hidden sm:flex items-center space-x-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/60 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 focus-ring cursor-pointer transition-colors"
          title="Trigger Gmail Sync"
        >
          <RefreshCw className={`h-3.5 w-3.5 text-slate-400 ${isSyncing ? "animate-spin text-indigo-500" : ""}`} />
          <span>{isSyncing ? "Syncing..." : "Synced 2m ago"}</span>
        </button>

        {/* Theme Selector Button */}
        <button
          onClick={cycleTheme}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 focus-ring cursor-pointer transition-colors"
          title={`Theme: ${theme.toUpperCase()} (Click to toggle)`}
          aria-label="Toggle Light/Dark/System Theme"
        >
          {theme === "light" && <Sun className="h-4 w-4 text-amber-500" />}
          {theme === "dark" && <Moon className="h-4 w-4 text-indigo-400" />}
          {theme === "system" && <Monitor className="h-4 w-4 text-slate-400" />}
        </button>

        {/* AI Mode Indicator */}
        <Badge variant="ai-glow" className="hidden md:inline-flex space-x-1 py-1">
          <Sparkles className="h-3 w-3 text-indigo-500 dark:text-indigo-400" />
          <span>Executive Engine</span>
        </Badge>

        {/* User Profile & Sign Out Dropdown */}
        <div className="relative pl-2 border-l border-slate-200 dark:border-slate-800/80">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center space-x-2.5 text-left focus-ring rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-semibold overflow-hidden shrink-0">
              {activeUser.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={activeUser.avatarUrl} alt={activeUser.name} className="h-full w-full object-cover" />
              ) : (
                <User className="h-4 w-4 text-slate-400" />
              )}
            </div>
            <div className="hidden xl:block">
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-200 leading-tight">{activeUser.name}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">{activeUser.title}</p>
            </div>
          </button>

          {/* User Menu Dropdown */}
          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 shadow-elevation z-50 space-y-1">
              <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{activeUser.name}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{activeUser.email}</p>
              </div>
              <button
                onClick={handleSignOut}
                className="flex w-full items-center space-x-2 rounded-lg px-2.5 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
