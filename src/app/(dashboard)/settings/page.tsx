"use client";

import React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MOCK_EXECUTIVE_USER } from "@/lib/mock-data";
import { RefreshCw, LogOut, CheckCircle2, Lock } from "lucide-react";

export default function SettingsPage() {
  const [isSyncing, setIsSyncing] = React.useState(false);

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 1200);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100">Settings & Privacy</h1>
        <p className="text-xs text-slate-400">Manage your connected Gmail account and security guardrails.</p>
      </div>

      {/* Account & Sync Status Card */}
      <Card variant="glass" className="p-6 space-y-6 border-slate-800">
        <CardHeader className="p-0 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Gmail Integration</CardTitle>
            <CardDescription className="text-xs">Connected Gmail OAuth credentials and live sync state.</CardDescription>
          </div>
          <Badge variant="success" className="space-x-1">
            <CheckCircle2 className="h-3 w-3" />
            <span>Connected</span>
          </Badge>
        </CardHeader>

        <CardContent className="p-0 space-y-4 pt-2">
          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-900/80 border border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-slate-200 border border-slate-700 text-sm font-bold">
                {MOCK_EXECUTIVE_USER.name.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-200">{MOCK_EXECUTIVE_USER.name}</p>
                <p className="text-xs text-slate-400">{MOCK_EXECUTIVE_USER.email}</p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={isSyncing}
              className="text-xs space-x-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin text-indigo-400" : ""}`} />
              <span>{isSyncing ? "Syncing..." : "Sync Now"}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Guardrails Disclosure Card */}
      <Card variant="glass" className="p-6 space-y-4 border-slate-800">
        <div className="flex items-center space-x-2 text-indigo-400 font-semibold text-sm">
          <Lock className="h-4 w-4" />
          <span>Executive Data Privacy & AI Ethics</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1.5">
            <h4 className="text-xs font-bold text-slate-200">Zero AI Training Guarantee</h4>
            <p className="text-2xs text-slate-400 leading-relaxed">
              Your email messages, thread history, and contact details are never used to train public AI models or stored in external vector stores.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1.5">
            <h4 className="text-xs font-bold text-slate-200">100% Human-in-the-Loop</h4>
            <p className="text-2xs text-slate-400 leading-relaxed">
              Priora never sends emails automatically without explicit executive review and one-click approval in the draft composer.
            </p>
          </div>
        </div>
      </Card>

      {/* Disconnect Action */}
      <div className="pt-4 flex justify-end">
        <Link href="/login">
          <Button variant="danger" size="sm" className="space-x-1.5 text-xs">
            <LogOut className="h-3.5 w-3.5" />
            <span>Disconnect Gmail & Sign Out</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
