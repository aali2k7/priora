"use client";

import React, { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { useSession } from "@/lib/auth-client";
import { Sparkles } from "lucide-react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    // If auth check has completed and user is not authenticated, redirect to login page
    if (!isPending && !session) {
      // Allow fallback if demo mode flag is set or redirect to login
      const isDemoMode = typeof window !== "undefined" && localStorage.getItem("priora-demo-session") === "true";
      if (!isDemoMode) {
        router.push("/login");
      }
    }
  }, [session, isPending, router]);

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-canvas)] text-[var(--text-primary)]">
        <div className="flex flex-col items-center space-y-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600/10 dark:bg-indigo-600/20 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 animate-pulse">
            <Sparkles className="h-6 w-6" />
          </div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Verifying Executive Session...</p>
        </div>
      </div>
    );
  }

  return <DashboardShell>{children}</DashboardShell>;
}
