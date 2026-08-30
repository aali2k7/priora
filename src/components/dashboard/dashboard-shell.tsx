"use client";

import React, { ReactNode } from "react";
import { SidebarNav } from "@/components/common/sidebar-nav";
import { HeaderBar } from "@/components/common/header-bar";
import { CommandMenu } from "@/components/common/command-menu";

interface DashboardShellProps {
  children: ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const [isCommandMenuOpen, setIsCommandMenuOpen] = React.useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsCommandMenuOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="flex min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] antialiased transition-colors duration-150">
      {/* Navigation Sidebar (Fixed Width, Visual Separation) */}
      <SidebarNav />

      {/* Main Workspace Column */}
      <div className="flex flex-1 flex-col min-w-0 h-screen overflow-hidden">
        <HeaderBar onOpenCommandMenu={() => setIsCommandMenuOpen(true)} />
        <main className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
          {children}
        </main>
      </div>

      {/* Global Command Menu */}
      <CommandMenu
        isOpen={isCommandMenuOpen}
        onClose={() => setIsCommandMenuOpen(false)}
      />
    </div>
  );
}
