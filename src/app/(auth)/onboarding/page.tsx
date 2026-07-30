"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Sparkles, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = React.useState(0);

  const steps = [
    "Connecting securely to Google OAuth via Better Auth...",
    "Analyzing recent email threads for urgent deadlines...",
    "Synthesizing Morning Executive Briefing...",
    "Preparing priority triage workstation...",
  ];

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("priora-demo-session", "true");
    }

    const timer1 = setTimeout(() => setStep(1), 700);
    const timer2 = setTimeout(() => setStep(2), 1400);
    const timer3 = setTimeout(() => setStep(3), 2100);
    const timer4 = setTimeout(() => {
      router.push("/dashboard");
    }, 2800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-[var(--bg-canvas)] text-[var(--text-primary)] transition-colors duration-200">
      <Card variant="glass" className="w-full max-w-md p-8 text-center space-y-6 border-slate-200 dark:border-slate-800 shadow-elevation">
        {/* Animated Glow Icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 shadow-2xs animate-pulse">
          <Sparkles className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Preparing Your Executive Workstation</h2>
          <p className="text-xs text-[var(--text-muted)]">Priora is organizing your inbox into calm action items.</p>
        </div>

        {/* Progress List */}
        <div className="space-y-3 text-left pt-2">
          {steps.map((text, idx) => {
            const isDone = idx < step;
            const isCurrent = idx === step;

            return (
              <div key={idx} className="flex items-center space-x-3 text-xs">
                {isDone ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : isCurrent ? (
                  <div className="h-4 w-4 rounded-full border-2 border-indigo-600 dark:border-indigo-400 border-t-transparent animate-spin shrink-0" />
                ) : (
                  <div className="h-4 w-4 rounded-full border border-slate-300 dark:border-slate-700 shrink-0" />
                )}
                <span className={isDone ? "text-slate-800 dark:text-slate-300 font-medium" : isCurrent ? "text-indigo-700 dark:text-indigo-300 font-semibold" : "text-slate-400 dark:text-slate-500"}>
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
