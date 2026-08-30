"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Zap,
  Sparkles,
  Inbox,
  Focus,
  Archive,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
} from "lucide-react";

interface SidebarNavContentProps {
  urgentCount?: number;
}

function SidebarNavContent({ urgentCount = 0 }: SidebarNavContentProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentView = searchParams.get("view") || "inbox";
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

  // Define structured navigation groups matching the executive reference
  const navSections = [
    {
      group: "OVERVIEW",
      items: [
        {
          label: "Overview",
          href: "/dashboard",
          icon: LayoutDashboard,
          isActive: pathname === "/dashboard",
        },
        {
          label: "Priority",
          href: "/inbox?view=focused",
          icon: Zap,
          isActive: pathname === "/inbox" && currentView === "focused",
          badge: urgentCount > 0 ? urgentCount : undefined,
        },
        {
          label: "Briefing",
          href: "/dashboard",
          icon: Sparkles,
          isActive: pathname === "/briefing",
        },
      ],
    },
    {
      group: "MAIL",
      items: [
        {
          label: "Inbox",
          href: "/inbox?view=inbox",
          icon: Inbox,
          isActive: pathname === "/inbox" && currentView === "inbox",
        },
        {
          label: "Focused",
          href: "/inbox?view=focused",
          icon: Focus,
          isActive: pathname === "/inbox" && currentView === "focused",
        },
        {
          label: "Archived",
          href: "/inbox?view=archived",
          icon: Archive,
          isActive: pathname === "/inbox" && currentView === "archived",
        },
      ],
    },
    {
      group: "SYSTEM",
      items: [
        {
          label: "Settings",
          href: "/settings",
          icon: Settings,
          isActive: pathname === "/settings",
        },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Menu Toggle Button */}
      <div className="lg:hidden fixed bottom-4 right-4 z-40">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[#3F5F8F] text-white shadow-md focus-ring"
          aria-label="Toggle Navigation Menu"
        >
          <Menu className="h-4 w-4" />
        </button>
      </div>

      {/* Sidebar Container */}
      <aside
        className={cn(
          "flex flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] transition-all duration-200 z-30",
          isCollapsed ? "w-14" : "w-56",
          "hidden lg:flex shrink-0 min-h-screen select-none"
        )}
      >
        {/* Logo / Brand Header */}
        <div className="flex h-14 items-center justify-between px-4 border-b border-[var(--border-subtle)]">
          {!isCollapsed && (
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-[#3F5F8F] text-white font-serif font-bold text-xs">
                P
              </div>
              <span className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">
                Priora
              </span>
            </Link>
          )}

          {isCollapsed && (
            <div className="mx-auto flex h-6 w-6 items-center justify-center rounded bg-[#3F5F8F] text-white font-serif font-bold text-xs">
              P
            </div>
          )}

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex h-6 w-6 items-center justify-center rounded text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)] focus-ring transition-colors"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Structured Navigation Groups */}
        <nav className="flex-1 py-3 px-2 space-y-4 overflow-y-auto custom-scrollbar">
          {navSections.map((section, sIdx) => (
            <div key={section.group} className="space-y-1">
              {!isCollapsed && (
                <div className="px-2 py-1 text-[10px] font-semibold tracking-wider text-[var(--text-muted)] uppercase">
                  {section.group}
                </div>
              )}
              {isCollapsed && sIdx > 0 && (
                <div className="my-2 border-t border-[var(--border-subtle)]" />
              )}

              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.isActive;

                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className={cn(
                        "flex items-center space-x-2.5 rounded px-2 py-1.5 text-xs transition-colors group relative",
                        isActive
                          ? "bg-[var(--bg-surface-selected)] text-[#3F5F8F] dark:text-[#7CA1D8] font-semibold"
                          : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)] font-normal",
                        isCollapsed && "justify-center px-0"
                      )}
                      title={isCollapsed ? item.label : undefined}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1 bottom-1 w-0.5 rounded-r bg-[#3F5F8F] dark:bg-[#7CA1D8]" />
                      )}
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0 transition-colors",
                          isActive
                            ? "text-[#3F5F8F] dark:text-[#7CA1D8]"
                            : "text-[var(--text-muted)] group-hover:text-[var(--text-primary)]"
                        )}
                      />
                      {!isCollapsed && <span className="flex-1 truncate">{item.label}</span>}
                      {!isCollapsed && typeof item.badge === "number" && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[var(--status-urgent-subtle)] text-[var(--status-urgent)] border border-[var(--status-urgent-border)]">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom System Status */}
        {!isCollapsed && (
          <div className="p-3 border-t border-[var(--border-subtle)]">
            <div className="flex items-center space-x-2 text-[11px] text-[var(--text-muted)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#477A5B] shrink-0" />
              <span className="truncate">Priora Intelligence Active</span>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

export function SidebarNav(props: SidebarNavContentProps) {
  return (
    <Suspense fallback={<aside className="w-56 hidden lg:flex border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] min-h-screen" />}>
      <SidebarNavContent {...props} />
    </Suspense>
  );
}
