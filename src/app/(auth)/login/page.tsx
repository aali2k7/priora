"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, ArrowRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);

  const handleGoogleAuth = () => {
    setIsLoggingIn(true);
    // Simulate OAuth consent redirect -> onboarding sync
    setTimeout(() => {
      router.push("/onboarding");
    }, 800);
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-slate-950 text-slate-100">
      <Card variant="glass" className="w-full max-w-md p-6 space-y-6 border-slate-800 shadow-2xl">
        <CardHeader className="p-0 text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl font-bold text-slate-100">Sign in to Priora</CardTitle>
          <CardDescription className="text-xs text-slate-400">
            Connect your executive Gmail account to start triaging priorities.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0 space-y-4">
          <Button
            variant="primary"
            size="lg"
            onClick={handleGoogleAuth}
            disabled={isLoggingIn}
            className="w-full space-x-3 text-sm py-2.5"
          >
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>{isLoggingIn ? "Connecting Gmail..." : "Sign in with Google"}</span>
          </Button>

          <div className="relative flex items-center justify-center text-2xs uppercase text-slate-500 my-4">
            <span className="bg-slate-900 px-2 z-10">Or Demo Experience</span>
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800" /></div>
          </div>

          <Link href="/onboarding" className="block">
            <Button variant="outline" size="md" className="w-full text-xs space-x-2">
              <span>Enter Instant Demo Session</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>

          <div className="rounded-lg bg-slate-900/60 p-3 text-2xs text-slate-400 space-y-1 border border-slate-800/80">
            <div className="flex items-center space-x-1 text-slate-300 font-medium">
              <Lock className="h-3 w-3 text-indigo-400" />
              <span>Privacy & Security Pledge</span>
            </div>
            <p>Priora uses Google OAuth with minimal read/send scopes. Your email data is never stored on persistent servers or trained on by AI models.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
