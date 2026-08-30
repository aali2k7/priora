"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { authClient, useSession } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);

  useEffect(() => {
    if (session) {
      router.push("/dashboard");
    }
  }, [session, router]);

  const handleGoogleAuth = async () => {
    setIsLoggingIn(true);
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/dashboard",
      });
    } catch (err) {
      console.error("Google Auth error:", err);
      router.push("/onboarding");
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      <Card className="w-full max-w-sm p-6 space-y-5 border-[var(--border-subtle)] shadow-xs">
        <CardHeader className="p-0 text-center space-y-1.5">
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded bg-[#3F5F8F] text-white font-serif font-bold text-sm">
            P
          </div>
          <CardTitle className="text-base font-semibold text-[var(--text-primary)]">
            Priora Sign In
          </CardTitle>
          <CardDescription className="text-xs text-[var(--text-secondary)]">
            Connect your Gmail account via Google OAuth.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0 space-y-3 pt-1">
          <Button
            variant="primary"
            size="md"
            onClick={handleGoogleAuth}
            disabled={isLoggingIn || isPending}
            className="w-full space-x-2 text-xs py-2"
          >
            <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>{isLoggingIn ? "Connecting..." : "Sign in with Google"}</span>
          </Button>

          <div className="relative flex items-center justify-center text-[10px] uppercase text-[var(--text-muted)] my-3">
            <span className="bg-[var(--bg-surface)] px-2 z-10">Or Demo Mode</span>
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--border-subtle)]" />
            </div>
          </div>

          <Link href="/onboarding" className="block">
            <Button variant="secondary" size="md" className="w-full text-xs space-x-1.5">
              <span>Enter Demo Session</span>
              <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>

          <div className="rounded bg-[var(--bg-canvas)] p-2.5 text-[11px] text-[var(--text-secondary)] space-y-0.5 border border-[var(--border-subtle)]">
            <div className="flex items-center space-x-1 text-[var(--text-primary)] font-medium">
              <Lock className="h-3 w-3 text-[#3F5F8F] dark:text-[#7CA1D8]" />
              <span>Better Auth Security</span>
            </div>
            <p>Authentication tokens are stored securely in PostgreSQL with zero external vector sharing.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
