import React from "react";
import Link from "next/link";
import { ShieldCheck, Sparkles, ArrowRight, CheckCircle2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Priora — An Executive Assistant for Your Inbox",
  description: "Transform email overload into calm, actionable executive clarity.",
};

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100 antialiased selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-800/80 bg-slate-950/80 px-6 backdrop-blur-md">
        <div className="flex items-center space-x-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-100">
            Priora
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="text-xs">
              Sign In
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="primary" size="sm" className="text-xs">
              Get Started
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="flex-1 max-w-6xl mx-auto px-6 py-16 md:py-24 space-y-16">
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <Badge variant="ai-glow" className="px-3 py-1 space-x-1.5">
            <Sparkles className="h-3.5 w-3.5 text-sky-400" />
            <span>AI Executive Email Assistant</span>
          </Badge>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-100 leading-[1.15]">
            An executive assistant <br className="hidden sm:inline" /> for your inbox.
          </h1>

          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Priora transforms raw email overload into calm, actionable decisions. Answer one question every morning:
            <span className="block mt-1 font-semibold text-slate-200 text-lg sm:text-xl">
              &ldquo;What do I need to pay attention to today?&rdquo;
            </span>
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/login" className="w-full sm:w-auto">
              <Button variant="primary" size="lg" className="w-full sm:w-auto space-x-2 text-sm shadow-lg">
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Continue with Google</span>
              </Button>
            </Link>

            <Link href="/dashboard" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto space-x-2 text-sm">
                <span>Explore Executive Demo</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="flex items-center justify-center space-x-6 pt-4 text-xs text-slate-500">
            <span className="flex items-center space-x-1.5">
              <Lock className="h-3.5 w-3.5 text-slate-400" />
              <span>Privacy-First Architecture</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>No AI Model Training on Data</span>
            </span>
          </div>
        </div>

        {/* Product Preview Card */}
        <Card variant="glass" className="relative p-6 md:p-8 max-w-4xl mx-auto shadow-2xl border-slate-800">
          <div className="flex items-center justify-between pb-6 border-b border-slate-800/80">
            <div className="flex items-center space-x-2">
              <div className="h-3 w-3 rounded-full bg-rose-500/80" />
              <div className="h-3 w-3 rounded-full bg-amber-500/80" />
              <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
              <span className="text-2xs font-mono text-slate-400 ml-2">Priora Executive Workstation</span>
            </div>
            <Badge variant="urgent">2 Urgent Actions</Badge>
          </div>

          <div className="py-6 space-y-4">
            <div className="rounded-lg bg-sky-950/20 border border-sky-500/30 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-sky-400">
                <span>Morning Executive Briefing</span>
                <span>Urgency Score: 95/100</span>
              </div>
              <p className="text-sm font-medium text-slate-200">
                Sarah Lin (Sequoia Capital) requires your signature on clause 4.2 of the Series B term sheet before 3:00 PM EST today for the board deck.
              </p>
            </div>
          </div>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-6 text-center text-xs text-slate-500">
        Priora Technologies © 2026. Built for Executive Focus.
      </footer>
    </div>
  );
}
