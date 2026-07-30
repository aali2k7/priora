import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Lock,
  Clock,
  Send,
  Zap,
  Command,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ShortcutKey } from "@/components/ui/shortcut-key";

export const metadata = {
  title: "Priora — Executive Email Assistant & Decision OS",
  description: "An AI executive assistant designed for single-question clarity: What do I need to pay attention to today?",
};

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] antialiased selection:bg-indigo-500 selection:text-white overflow-hidden transition-colors duration-200">
      {/* ===================================================================
         1. ATMOSPHERIC BACKGROUND ORBS & SPATIAL LIGHTING
         =================================================================== */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {/* Large Indigo Orb (Top Left) */}
        <div className="absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-indigo-500/15 dark:bg-indigo-600/20 blur-[140px] animate-pulse-subtle" />
        
        {/* Deep Violet Core Orb (Top Right) */}
        <div className="absolute -right-40 top-20 h-[650px] w-[650px] rounded-full bg-indigo-600/10 dark:bg-indigo-900/15 blur-[150px] animate-pulse-subtle" />

        {/* Spatial Micro-Grid Texture */}
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(rgba(99, 102, 241, 0.4) 1px, transparent 1px)`,
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      {/* ===================================================================
         2. TRANSLUCENT FLOATING NAVIGATION HEADER
         =================================================================== */}
      <div className="sticky top-4 z-40 px-4 md:px-8">
        <header className="mx-auto flex h-14 max-w-5xl items-center justify-between rounded-full border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-slate-950/60 px-6 backdrop-blur-xl shadow-glass transition-all">
          <Link href="/" className="flex items-center space-x-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600/15 dark:bg-indigo-600/25 border border-indigo-500/30 text-indigo-600 dark:text-indigo-300 shadow-2xs group-hover:scale-105 transition-transform">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
              Priora
            </span>
          </Link>

          {/* System Status Pill */}
          <div className="hidden sm:flex items-center space-x-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3.5 py-1 text-[11px] font-mono text-indigo-700 dark:text-indigo-300 font-semibold">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
            <span>EXECUTIVE OS • v2.0</span>
          </div>

          <div className="flex items-center space-x-3">
            <Link href="/login">
              <button className="frosted-button rounded-full px-4 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                Sign In
              </button>
            </Link>
            <Link href="/dashboard">
              <button className="rounded-full bg-indigo-600 hover:bg-indigo-500 px-4 py-1.5 text-xs font-semibold text-white shadow-sm shadow-indigo-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]">
                Launch OS
              </button>
            </Link>
          </div>
        </header>
      </div>

      {/* ===================================================================
         3. HERO SECTION: EDITORIAL TYPOGRAPHY & VISION STATEMENT
         =================================================================== */}
      <main className="relative z-10 mx-auto max-w-6xl px-6 pt-16 md:pt-24 pb-20 space-y-20">
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          {/* Editorial Pill */}
          <div className="inline-flex items-center space-x-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-[11px] font-semibold tracking-wider text-indigo-700 dark:text-indigo-300 uppercase shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
            <span>Single-Question Executive Clarity</span>
          </div>

          {/* Large Editorial Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 leading-[1.08] font-sans">
            Transform email chaos <br />
            into <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-slate-900 dark:from-indigo-300 dark:via-indigo-200 dark:to-white bg-clip-text text-transparent">calm executive decisions.</span>
          </h1>

          <p className="text-base sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-normal leading-relaxed">
            Priora eliminates inbox anxiety by answering one question within 3 seconds of opening:
            <span className="block mt-2 font-semibold text-slate-900 dark:text-slate-200 text-lg sm:text-2xl italic">
              &ldquo;What do I need to pay attention to today?&rdquo;
            </span>
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/login" className="w-full sm:w-auto">
              <button className="frosted-button group w-full sm:w-auto flex items-center justify-center space-x-3 rounded-full px-8 py-3.5 text-sm font-semibold text-slate-900 dark:text-slate-100 border-slate-300 dark:border-white/20">
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Continue with Google</span>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>

            <Link href="/dashboard" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto flex items-center justify-center space-x-2 rounded-full border border-indigo-500/30 bg-indigo-600/10 dark:bg-indigo-600/20 px-8 py-3.5 text-sm font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-600/20 dark:hover:bg-indigo-600/30 transition-all shadow-xs">
                <span>Enter Live Workstation</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
          </div>

          {/* Micro Hotkey Legend */}
          <div className="flex items-center justify-center space-x-4 pt-2 text-xs text-slate-500">
            <span className="flex items-center space-x-1">
              <Command className="h-3.5 w-3.5 text-slate-400" />
              <span>Press <ShortcutKey>⌘K</ShortcutKey> for instant actions</span>
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="flex items-center space-x-1">
              <Lock className="h-3.5 w-3.5 text-slate-400" />
              <span>Zero AI Training Policy</span>
            </span>
          </div>
        </div>

        {/* ===================================================================
           4. FLOATING VISIONOS WORKSTATION CANVAS (HERO DEMONSTRATION)
           =================================================================== */}
        <div className="relative pt-8 pb-12">
          {/* Ambient Surface Glow */}
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 via-indigo-500/5 to-transparent blur-3xl rounded-3xl" />

          <div className="relative mx-auto max-w-5xl">
            {/* LAYER 1: Main Executive Workstation Base Container */}
            <div className="vision-glass-card rounded-2xl p-6 md:p-8 space-y-6 relative z-10 border-slate-200/80 dark:border-white/15">
              {/* Header Bar */}
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="flex space-x-1.5">
                    <div className="h-3 w-3 rounded-full bg-rose-500/80" />
                    <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                    <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400">
                    Priora Executive Focus Center
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <Badge variant="urgent" className="px-2.5 py-1">2 Urgent Actions Pending</Badge>
                  <Badge variant="ai-glow" className="hidden sm:inline-flex px-2.5 py-1">AI Engine Active</Badge>
                </div>
              </div>

              {/* Main Executive Digest Box */}
              <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/5 dark:bg-gradient-to-r dark:from-indigo-950/40 dark:via-slate-900/60 dark:to-indigo-950/30 p-5 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-indigo-700 dark:text-indigo-400">
                  <span className="flex items-center space-x-1.5">
                    <Sparkles className="h-4 w-4" />
                    <span>Morning Executive Briefing</span>
                  </span>
                  <span className="font-mono text-[11px]">Tuesday, July 28</span>
                </div>
                <p className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                  Sarah Lin (Sequoia Capital) requires your signature on clause 4.2 of the Series B term sheet before 3:00 PM EST today for the board deck package.
                </p>
              </div>

              {/* Thread Feed Row Items */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 hover:border-indigo-500/40 transition-all cursor-pointer">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600/10 dark:bg-indigo-600/20 text-indigo-700 dark:text-indigo-300 font-bold text-xs border border-indigo-500/30">
                      SL
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-semibold text-slate-900 dark:text-slate-200">Sarah Lin</span>
                        <Badge variant="urgent">Urgent</Badge>
                        <Badge variant="vip">VIP</Badge>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 truncate mt-0.5 font-medium">
                        URGENT: Final Sign-off on Series B Term Sheet & Board Deck
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <Clock className="h-3.5 w-3.5 text-amber-500" />
                    <span>Due 3:00 PM</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-white/5 opacity-80">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs border border-slate-300 dark:border-slate-700">
                      MV
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-semibold text-slate-900 dark:text-slate-200">Marcus Vance (AWS)</span>
                        <Badge variant="warning">Action Needed</Badge>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        AWS Enterprise Discount Agreement Renewal (18% Commit)
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400">Expires Midnight</span>
                </div>
              </div>
            </div>

            {/* LAYER 2: FLOATING CARD TOP-RIGHT (TRANSLUCENT ACTION CARD) */}
            <div className="hidden lg:block absolute -top-10 -right-12 z-20 w-80 vision-glass-card rounded-xl p-5 border-slate-200/80 dark:border-white/20 shadow-2xl animate-float-slow transform rotate-2 hover:rotate-0 transition-transform">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
                <Badge variant="urgent">Extracted Action Item</Badge>
                <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400 flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>3h 45m left</span>
                </span>
              </div>
              <div className="py-3 space-y-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Sign Series B Term Sheet (Clause 4.2)</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">&ldquo;Legal adjusted option pool dilution per yesterday&apos;s call...&rdquo;</p>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-white/10 flex justify-end">
                <button className="rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 px-3 py-1.5 text-[11px] font-semibold flex items-center space-x-1 shadow-2xs">
                  <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>1-Click Approve Reply</span>
                </button>
              </div>
            </div>

            {/* LAYER 3: FLOATING CARD BOTTOM-LEFT (TRANSLUCENT AI DRAFT COMPOSER) */}
            <div className="hidden lg:block absolute -bottom-10 -left-12 z-20 w-88 vision-glass-card rounded-xl p-5 border-slate-200/80 dark:border-white/20 shadow-2xl animate-float-reverse transform -rotate-2 hover:rotate-0 transition-transform">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
                <div className="flex items-center space-x-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                  <span>AI Draft Ready</span>
                </div>
                <div className="flex space-x-1">
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-medium">Concise Tone</span>
                </div>
              </div>
              <div className="py-3 space-y-2">
                <p className="text-[11px] text-slate-700 dark:text-slate-300 font-mono leading-relaxed bg-slate-100 dark:bg-slate-950/80 p-2.5 rounded-md border border-slate-200 dark:border-slate-800">
                  &ldquo;Hi Sarah, Clause 4.2 looks good. Please send the DocuSign link right away and I will sign it before 3:00 PM EST.&rdquo;
                </p>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-white/10">
                <span className="text-[10px] text-slate-400">Press <ShortcutKey>⌘</ShortcutKey> <ShortcutKey>Enter</ShortcutKey></span>
                <button className="rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 text-[11px] font-semibold flex items-center space-x-1 shadow-2xs">
                  <Send className="h-3 w-3" />
                  <span>Dispatch Email</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ===================================================================
           5. EXECUTIVE PILLARS GRID (LINEAR / RAYCAST STYLE)
           =================================================================== */}
        <div className="space-y-10 pt-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Built like a high-performance operating system.
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Priora is engineered specifically to eliminate decision fatigue for leaders and founders.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="vision-glass-card p-6 rounded-2xl space-y-4 border-slate-200/80 dark:border-white/10 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/10 dark:bg-indigo-600/20 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">01. 5-Second Clarity</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Open Priora and instantly see your top 3 urgent action items, extracted deadlines, and a 2-sentence morning executive digest.
              </p>
            </div>

            <div className="vision-glass-card p-6 rounded-2xl space-y-4 border-slate-200/80 dark:border-white/10 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/10 dark:bg-indigo-600/20 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">02. Autonomous AI Drafts</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Context-aware reply drafts are pre-compiled matching your tone before you open the message. Review, adjust tone, and approve with 1 click.
              </p>
            </div>

            <div className="vision-glass-card p-6 rounded-2xl space-y-4 border-slate-200/80 dark:border-white/10 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                <Command className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">03. Keyboard-First Velocity</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Triage your inbox zero at lightning speed without touching the mouse. Navigate threads with <ShortcutKey>J</ShortcutKey>/<ShortcutKey>K</ShortcutKey>, archive with <ShortcutKey>E</ShortcutKey>, and reply with <ShortcutKey>R</ShortcutKey>.
              </p>
            </div>
          </div>
        </div>

        {/* ===================================================================
           6. PRIVACY & SECURITY VAULT CARD
           =================================================================== */}
        <div className="vision-glass-card rounded-2xl p-8 border-slate-200/80 dark:border-white/10 space-y-6 max-w-4xl mx-auto text-center relative overflow-hidden">
          <div className="absolute -right-16 -bottom-16 h-48 w-48 rounded-full bg-indigo-600/10 blur-2xl" />

          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600/10 dark:bg-indigo-600/20 border border-indigo-500/40 text-indigo-600 dark:text-indigo-300 shadow-2xs">
            <Lock className="h-6 w-6" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">Executive Privacy & Data Security Pledge</h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
              Your email communication is confidential. Priora runs with read/send scopes, strictly guarantees zero AI model training on your private data, and requires 100% human-in-the-loop approval.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 pt-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span className="flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>No Persistent Email Storage</span>
            </span>
            <span className="flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Zero AI Training</span>
            </span>
            <span className="flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Explicit 1-Click Approval</span>
            </span>
          </div>
        </div>

        {/* ===================================================================
           7. CINEMATIC CLOSING CALL TO ACTION
           =================================================================== */}
        <div className="text-center space-y-6 pt-12 pb-8">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Ready for inbox calm?
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Experience Priora executive workstation today.
          </p>

          <div className="flex justify-center pt-2">
            <Link href="/login">
              <button className="frosted-button rounded-full px-8 py-3.5 text-sm font-bold text-slate-900 dark:text-white shadow-2xs hover:scale-105 transition-all">
                Get Started with Google OAuth
              </button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-200 dark:border-white/10 py-8 text-center text-xs text-slate-500">
        <p>Priora Technologies © 2026. Designed for Executive Focus.</p>
      </footer>
    </div>
  );
}
