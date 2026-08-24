"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MOCK_EXECUTIVE_USER } from "@/lib/mock-data";
import { RefreshCw, LogOut, CheckCircle2, Lock, Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { authClient, useSession } from "@/lib/auth-client";

export default function SettingsPage() {
  const router = useRouter();
  const [isSyncing, setIsSyncing] = React.useState(false);
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();

  const activeUser = session?.user
    ? {
        name: session.user.name || MOCK_EXECUTIVE_USER.name,
        email: session.user.email || MOCK_EXECUTIVE_USER.email,
        avatarUrl: session.user.image || MOCK_EXECUTIVE_USER.avatarUrl,
      }
    : MOCK_EXECUTIVE_USER;

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await fetch("/api/gmail/sync", { method: "POST" });
    } catch (err) {
      console.error("Sync error:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSignOut = async () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("priora-demo-session");
      }
      await authClient.signOut();
    } catch (err) {
      console.error("Sign out error:", err);
    } finally {
      router.push("/login");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Settings & Preferences</h1>
        <p className="text-xs text-[var(--text-muted)]">Manage your appearance, connected Gmail account, and security guardrails.</p>
      </div>

      {/* Theme Preference Selector Card */}
      <Card variant="glass" className="p-6 space-y-4 border-slate-200 dark:border-slate-800">
        <CardHeader className="p-0 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Appearance Theme</CardTitle>
            <CardDescription className="text-xs">Choose between Light, Dark, or System theme preferences.</CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-0 pt-2">
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: "light", label: "Light", icon: Sun, desc: "Clean Apple white design" },
              { id: "dark", label: "Dark", icon: Moon, desc: "Refined dark slate mode" },
              { id: "system", label: "System", icon: Monitor, desc: "Follow OS preference" },
            ].map((t) => {
              const Icon = t.icon;
              const isSelected = theme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id as "light" | "dark" | "system")}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all cursor-pointer text-center space-y-2 focus-ring ${
                    isSelected
                      ? "bg-indigo-500/10 dark:bg-indigo-500/15 border-indigo-500 text-indigo-700 dark:text-indigo-300 shadow-2xs font-semibold"
                      : "bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isSelected ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"}`} />
                  <div>
                    <p className="text-xs font-semibold">{t.label}</p>
                    <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{t.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Account & Sync Status Card */}
      <Card variant="glass" className="p-6 space-y-6 border-slate-200 dark:border-slate-800">
        <CardHeader className="p-0 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Gmail Integration (Better Auth)</CardTitle>
            <CardDescription className="text-xs">Connected Google OAuth credentials & session state.</CardDescription>
          </div>
          <Badge variant="success" className="space-x-1">
            <CheckCircle2 className="h-3 w-3" />
            <span>Connected</span>
          </Badge>
        </CardHeader>

        <CardContent className="p-0 space-y-4 pt-2">
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-sm font-bold overflow-hidden">
                {activeUser.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={activeUser.avatarUrl} alt={activeUser.name} className="h-full w-full object-cover" />
                ) : (
                  activeUser.name.charAt(0)
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-200">{activeUser.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{activeUser.email}</p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={isSyncing}
              className="text-xs space-x-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin text-indigo-500" : ""}`} />
              <span>{isSyncing ? "Syncing..." : "Sync Now"}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Guardrails Disclosure Card */}
      <Card variant="glass" className="p-6 space-y-4 border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 font-semibold text-sm">
          <Lock className="h-4 w-4" />
          <span>Executive Data Privacy & AI Ethics</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1.5">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-200">Zero AI Training Guarantee</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Your email messages, thread history, and contact details are never used to train public AI models or stored in external vector stores.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1.5">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-200">100% Human-in-the-Loop</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Priora never sends emails automatically without explicit executive review and one-click approval in the draft composer.
            </p>
          </div>
        </div>
      </Card>

      {/* Disconnect Action */}
      <div className="pt-4 flex justify-end">
        <Button
          variant="danger"
          size="sm"
          onClick={handleSignOut}
          className="space-x-1.5 text-xs cursor-pointer"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Disconnect Gmail & Sign Out</span>
        </Button>
      </div>
    </div>
  );
}
