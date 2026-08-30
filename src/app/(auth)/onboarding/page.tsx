"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = React.useState(0);

  const steps = [
    "Verifying session credentials with Better Auth...",
    "Retrieving active threads from local PostgreSQL dataset...",
    "Synthesizing Executive Briefing & urgency indexes...",
    "Preparing inbox workspace...",
  ];

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("priora-demo-session", "true");
    }

    const timer1 = setTimeout(() => setStep(1), 600);
    const timer2 = setTimeout(() => setStep(2), 1200);
    const timer3 = setTimeout(() => setStep(3), 1800);
    const timer4 = setTimeout(() => {
      router.push("/dashboard");
    }, 2400);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      <Card className="w-full max-w-sm p-6 text-center space-y-4 border-[var(--border-subtle)] shadow-xs">
        <div className="mx-auto flex h-8 w-8 items-center justify-center rounded bg-[#3F5F8F] text-white font-serif font-bold text-sm">
          P
        </div>

        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Initializing Workstation</h2>
          <p className="text-xs text-[var(--text-secondary)]">Loading your 15-day executive dataset...</p>
        </div>

        {/* Progress List */}
        <div className="space-y-2.5 text-left pt-2">
          {steps.map((text, idx) => {
            const isDone = idx < step;
            const isCurrent = idx === step;

            return (
              <div key={idx} className="flex items-center space-x-2.5 text-xs">
                {isDone ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#477A5B] shrink-0" />
                ) : isCurrent ? (
                  <div className="h-3.5 w-3.5 rounded-full border-2 border-[#3F5F8F] dark:border-[#7CA1D8] border-t-transparent animate-spin shrink-0" />
                ) : (
                  <div className="h-3.5 w-3.5 rounded-full border border-[var(--border-subtle)] shrink-0" />
                )}
                <span
                  className={
                    isDone
                      ? "text-[var(--text-primary)] font-medium"
                      : isCurrent
                      ? "text-[#3F5F8F] dark:text-[#7CA1D8] font-semibold"
                      : "text-[var(--text-muted)]"
                  }
                >
                  {text}
                </span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
