"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  Inbox,
  Settings,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Menu,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SidebarNavProps {
  urgentCount?: number;
}

export function SidebarNav({ urgentCount = 2 }: SidebarNavProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

  const navItems = [
    {
      label: "Briefing",
      href: "/dashboard",
      icon: Sparkles,
      badge: null,
    },
    {
      label: "Priority Inbox",
      href: "/inbox",
      icon: Inbox,
      badge: urgentCount > 0 ? <Badge variant="urgent">{urgentCount}</Badge> : null,
    },
    {
      label: "Settings",
      href: "/settings",
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <>
      {/* Mobile Menu Toggle Button */}
      <div className="lg:hidden fixed bottom-4 right-4 z-40">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg focus-ring"
          aria-label="Toggle Navigation Menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Sidebar Container */}
      <aside
        className={cn(
          "flex flex-col border-r border-slate-800/80 bg-slate-950/80 backdrop-blur-md transition-all duration-200 z-30",
          isCollapsed ? "w-16" : "w-64",
          "hidden lg:flex shrink-0 min-h-screen"
        )}
      >
        {/* Logo / Brand Header */}
        <div className="flex h-14 items-center justify-between px-4 border-b border-slate-800/60">
          {!isCollapsed && (
            <Link href="/dashboard" className="flex items-center space-x-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <span className="text-base font-bold tracking-tight text-slate-100">
                Priora
              </span>
            </Link>
          )}

          {isCollapsed && (
            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
          )}

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-800 hover:text-slate-200 focus-ring"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Primary Navigation Links */}
        <nav className="flex-1 space-y-1.5 p-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-ring group",
                  isActive
                    ? "bg-slate-800/90 text-slate-100 border border-slate-700/60 shadow-2xs"
                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-200",
                  isCollapsed && "justify-center px-0"
                )}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-indigo-400" : "text-slate-400 group-hover:text-slate-200")} />
                {!isCollapsed && <span className="flex-1">{item.label}</span>}
                {!isCollapsed && item.badge && <div>{item.badge}</div>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom AI Status Pill */}
        {!isCollapsed && (
          <div className="p-3 border-t border-slate-800/60">
            <div className="flex items-center space-x-2.5 rounded-lg border border-sky-500/20 bg-sky-500/10 p-2.5">
              <div className="h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
              <div className="flex-1 overflow-hidden">
                <p className="text-xs font-medium text-sky-300 truncate">AI Engine Active</p>
                <p className="text-2xs text-sky-400/80 truncate">Scaffolding Fallback Active</p>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
