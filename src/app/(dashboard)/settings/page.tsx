"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MOCK_EXECUTIVE_USER } from "@/lib/mock-data";
import { RefreshCw, LogOut, Lock, Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { authClient, useSession } from "@/lib/auth-client";
import { clearClientCache } from "@/lib/client-cache";

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
      const res = await fetch("/api/gmail/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force: true }),
      });
      if (res.ok) {
        window.dispatchEvent(new CustomEvent("priora-email-synced"));
      }
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
        clearClientCache();
      }
      await authClient.signOut();
    } catch (err) {
      console.error("Sign out error:", err);
    } finally {
      router.push("/login");
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Settings & Preferences</h2>
        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
          Manage appearance, connected Gmail account, and privacy policies.
        </p>
      </div>

      {/* Theme Preference */}
      <Card className="p-5 space-y-4">
        <CardHeader className="p-0">
          <CardTitle className="text-sm font-semibold">Appearance Theme</CardTitle>
          <CardDescription className="text-xs">Select your visual appearance preference.</CardDescription>
        </CardHeader>

        <CardContent className="p-0 pt-1">
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: "light", label: "Light", icon: Sun, desc: "Direction C canvas" },
              { id: "dark", label: "Dark", icon: Moon, desc: "Refined dark mode" },
              { id: "system", label: "System", icon: Monitor, desc: "Match operating system" },
            ].map((t) => {
              const Icon = t.icon;
              const isSelected = theme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id as "light" | "dark" | "system")}
                  className={`flex flex-col items-center justify-center p-3 rounded border transition-colors cursor-pointer text-center space-y-1.5 focus-ring ${
                    isSelected
                      ? "bg-[var(--bg-surface-selected)] border-[#3F5F8F] text-[#3F5F8F] dark:text-[#7CA1D8] font-semibold"
                      : "bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isSelected ? "text-[#3F5F8F] dark:text-[#7CA1D8]" : "text-[var(--text-muted)]"}`} />
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

      {/* Gmail Account & Sync Status */}
      <Card className="p-5 space-y-4">
        <CardHeader className="p-0 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold">Gmail Integration</CardTitle>
            <CardDescription className="text-xs">Connected Google OAuth via Better Auth.</CardDescription>
          </div>
          <Badge variant="success" dot>
            <span>Connected</span>
          </Badge>
        </CardHeader>

        <CardContent className="p-0 pt-1 space-y-3">
          <div className="flex items-center justify-between p-3 rounded bg-[var(--bg-canvas)] border border-[var(--border-subtle)]">
            <div className="flex items-center space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-subtle)] text-xs font-bold overflow-hidden">
                {activeUser.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={activeUser.avatarUrl} alt={activeUser.name} className="h-full w-full object-cover" />
                ) : (
                  activeUser.name.charAt(0)
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-[var(--text-primary)]">{activeUser.name}</p>
                <p className="text-[11px] text-[var(--text-secondary)]">{activeUser.email}</p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={isSyncing}
              className="text-xs space-x-1.5"
            >
              <RefreshCw className={`h-3 w-3 ${isSyncing ? "animate-spin text-[#3F5F8F]" : "text-[var(--text-muted)]"}`} />
              <span>{isSyncing ? "Syncing..." : "Sync Now"}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security & Privacy */}
      <Card className="p-5 space-y-3">
        <div className="flex items-center space-x-2 text-[#3F5F8F] dark:text-[#7CA1D8] font-semibold text-xs uppercase tracking-wider">
          <Lock className="h-3.5 w-3.5" />
          <span>Privacy & Security</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          <div className="p-3 rounded bg-[var(--bg-canvas)] border border-[var(--border-subtle)] space-y-1">
            <h4 className="text-xs font-semibold text-[var(--text-primary)]">Zero AI Training</h4>
            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
              Email contents and metadata are processed through Gemini with structured parameters and never used to train foundation models.
            </p>
          </div>

          <div className="p-3 rounded bg-[var(--bg-canvas)] border border-[var(--border-subtle)] space-y-1">
            <h4 className="text-xs font-semibold text-[var(--text-primary)]">Human-in-the-Loop</h4>
            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
              Priora operates strictly in read-and-draft mode. No outgoing email is ever sent without explicit user review and click approval.
            </p>
          </div>
        </div>
      </Card>

      {/* Disconnect Action */}
      <div className="pt-2 flex justify-end">
        <Button
          variant="danger"
          size="sm"
          onClick={handleSignOut}
          className="space-x-1.5 text-xs"
        >
          <LogOut className="h-3 w-3" />
          <span>Sign Out</span>
        </Button>
      </div>
    </div>
  );
}
