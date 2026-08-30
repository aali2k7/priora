"use client";

import React, { Suspense, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, RefreshCw, User, Sun, Moon, Monitor, LogOut } from "lucide-react";
import { ShortcutKey } from "@/components/ui/shortcut-key";
import { MOCK_EXECUTIVE_USER } from "@/lib/mock-data";
import { useTheme } from "@/components/theme-provider";
import { authClient, useSession } from "@/lib/auth-client";

interface HeaderBarProps {
  onOpenCommandMenu?: () => void;
}

function HeaderBarContent({ onOpenCommandMenu }: HeaderBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentView = searchParams.get("view");
  const [isSyncing, setIsSyncing] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();

  const activeUser = session?.user
    ? {
        name: session.user.name || MOCK_EXECUTIVE_USER.name,
        email: session.user.email || MOCK_EXECUTIVE_USER.email,
        avatarUrl: session.user.image || MOCK_EXECUTIVE_USER.avatarUrl,
      }
    : MOCK_EXECUTIVE_USER;

  // Derive section title based on active page
  let pageTitle = "Overview";
  if (pathname === "/dashboard" || pathname === "/briefing") {
    pageTitle = "Overview";
  } else if (pathname === "/inbox") {
    if (currentView === "focused") pageTitle = "Focused";
    else if (currentView === "archived") pageTitle = "Archived";
    else pageTitle = "Inbox";
  } else if (pathname === "/settings") {
    pageTitle = "Settings";
  }

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/gmail/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force: true }),
      });
      if (res.ok) {
        window.dispatchEvent(new CustomEvent("priora-email-synced"));
      }
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
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 md:px-6 select-none">
      {/* Left: Section Title */}
      <div className="flex items-center space-x-4 shrink-0">
        <h1 className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">
          {pageTitle}
        </h1>
      </div>

      {/* Center/Left: Integrated Search / Command Menu */}
      <div className="flex-1 max-w-md mx-4">
        <button
          onClick={onOpenCommandMenu}
          className="flex h-8 w-full items-center justify-between rounded border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-2.5 text-xs text-[var(--text-muted)] hover:border-[var(--border-hover)] hover:text-[var(--text-secondary)] focus-ring cursor-pointer transition-colors"
        >
          <span className="flex items-center space-x-2 truncate">
            <Search className="h-3.5 w-3.5 text-[var(--text-muted)] shrink-0" />
            <span className="truncate">Search emails, senders, or actions...</span>
          </span>
          <div className="flex items-center space-x-0.5 shrink-0 ml-2">
            <ShortcutKey>⌘K</ShortcutKey>
          </div>
        </button>
      </div>

      {/* Right: Sync Status, Theme, and Minimal User Profile */}
      <div className="flex items-center space-x-2 shrink-0">
        {/* Sync Trigger */}
        <button
          onClick={handleManualSync}
          disabled={isSyncing}
          className="flex items-center space-x-1.5 rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-1 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] focus-ring cursor-pointer transition-colors"
          title="Synchronize Gmail messages"
        >
          <RefreshCw className={`h-3 w-3 text-[var(--text-muted)] ${isSyncing ? "animate-spin text-[#3F5F8F]" : ""}`} />
          <span className="hidden sm:inline">{isSyncing ? "Syncing..." : "Sync"}</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={cycleTheme}
          className="flex h-7 w-7 items-center justify-center rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] focus-ring cursor-pointer transition-colors"
          title={`Theme: ${theme.toUpperCase()}`}
          aria-label="Toggle Light/Dark/System Theme"
        >
          {theme === "light" && <Sun className="h-3.5 w-3.5 text-[#A56B20]" />}
          {theme === "dark" && <Moon className="h-3.5 w-3.5 text-[#7CA1D8]" />}
          {theme === "system" && <Monitor className="h-3.5 w-3.5 text-[var(--text-muted)]" />}
        </button>

        {/* Minimal User Profile */}
        <div className="relative pl-1 border-l border-[var(--border-subtle)]">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center space-x-2 text-left focus-ring rounded p-1 hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs font-semibold overflow-hidden shrink-0">
              {activeUser.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={activeUser.avatarUrl} alt={activeUser.name} className="h-full w-full object-cover" />
              ) : (
                <User className="h-3.5 w-3.5 text-[var(--text-muted)]" />
              )}
            </div>
            <span className="hidden sm:inline text-xs font-medium text-[var(--text-primary)]">
              {activeUser.name.split(" ")[0]}
            </span>
          </button>

          {/* User Menu Dropdown */}
          {isUserMenuOpen && (
            <div className="absolute right-0 mt-1.5 w-48 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-1 shadow-elevation z-50 space-y-0.5">
              <div className="px-2.5 py-1.5 border-b border-[var(--border-subtle)]">
                <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{activeUser.name}</p>
                <p className="text-[11px] text-[var(--text-secondary)] truncate">{activeUser.email}</p>
              </div>
              <button
                onClick={handleSignOut}
                className="flex w-full items-center space-x-2 rounded px-2.5 py-1.5 text-xs text-[var(--status-urgent)] hover:bg-[var(--status-urgent-subtle)] transition-colors cursor-pointer"
              >
                <LogOut className="h-3 w-3" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export function HeaderBar(props: HeaderBarProps) {
  return (
    <Suspense fallback={<header className="h-14 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]" />}>
      <HeaderBarContent {...props} />
    </Suspense>
  );
}
