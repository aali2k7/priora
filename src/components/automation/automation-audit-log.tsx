"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Download,
  Filter,
  Activity,
  Power,
  Sparkles,
  Mail,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface AutomationLogEntry {
  id: string;
  userId: string;
  ruleId?: string | null;
  rule?: {
    id: string;
    name: string;
  } | null;
  threadId?: string | null;
  emailSubject?: string | null;
  senderEmail?: string | null;
  actionExecuted: string;
  status: "SUCCESS" | "BLOCKED_GUARDRAIL" | "ERROR";
  diagnostics?: Record<string, unknown> | null;
  createdAt: string;
}

export function AutomationAuditLogView() {
  const [logs, setLogs] = useState<AutomationLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"ALL" | "SUCCESS" | "BLOCKED_GUARDRAIL" | "ERROR">("ALL");
  const [isKillSwitchActive, setIsKillSwitchActive] = useState(false);
  const [isTogglingKillSwitch, setIsTogglingKillSwitch] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchLogs = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [logsRes, killSwitchRes] = await Promise.all([
        fetch("/api/automation/logs"),
        fetch("/api/automation/kill-switch"),
      ]);

      if (logsRes.ok) {
        const data = await logsRes.json();
        setLogs(data.data || []);
      }
      if (killSwitchRes.ok) {
        const data = await killSwitchRes.json();
        setIsKillSwitchActive(!!data.isKillSwitchActive);
      }
    } catch (err) {
      console.error("[AutomationAuditLog] Fetch error:", err);
      setErrorMessage("Failed to load audit logs.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleToggleKillSwitch = async () => {
    setIsTogglingKillSwitch(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/automation/kill-switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ freeze: !isKillSwitchActive }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsKillSwitchActive(data.isKillSwitchActive);
        setSuccessMessage(data.message);
        fetchLogs();
      } else {
        setErrorMessage(data.error || "Failed to update Emergency Kill Switch.");
      }
    } catch {
      setErrorMessage("Error updating Emergency Kill Switch.");
    } finally {
      setIsTogglingKillSwitch(false);
    }
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `priora_automation_audit_log_${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const filteredLogs = logs.filter((log) => {
    if (activeFilter === "ALL") return true;
    return log.status === activeFilter;
  });

  const totalSuccess = logs.filter((l) => l.status === "SUCCESS").length;
  const totalBlocked = logs.filter((l) => l.status === "BLOCKED_GUARDRAIL").length;
  const totalError = logs.filter((l) => l.status === "ERROR").length;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[var(--bg-canvas)]">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-6 py-4 gap-3">
        <div className="flex items-center space-x-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#3F5F8F]/10 text-[#3F5F8F] dark:bg-[#7CA1D8]/10 dark:text-[#7CA1D8]">
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
              Automation Audit Trail & Safety Monitor
            </h2>
            <p className="text-[11px] text-[var(--text-secondary)]">
              Full transparency log of all declarative rule evaluations, AI draft generations, and guardrail decisions.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Emergency Kill Switch Button */}
          <Button
            variant={isKillSwitchActive ? "danger" : "outline"}
            size="sm"
            onClick={handleToggleKillSwitch}
            disabled={isTogglingKillSwitch}
            className="text-xs space-x-1 font-semibold"
          >
            <Power className="h-3.5 w-3.5" />
            <span>{isKillSwitchActive ? "Resume Automation" : "Emergency Kill Switch"}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportJSON}
            disabled={logs.length === 0}
            className="text-xs space-x-1"
          >
            <Download className="h-3 w-3" />
            <span>Export Logs</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchLogs}
            disabled={isLoading}
            className="text-xs space-x-1"
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Kill Switch Active Warning Banner */}
      {isKillSwitchActive && (
        <div className="bg-rose-500/10 border-b border-rose-500/20 px-6 py-2.5 flex items-center justify-between text-xs text-rose-600 dark:text-rose-400">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="h-4 w-4" />
            <span className="font-semibold">
              Emergency Kill Switch is ACTIVE: All automated reply and drafting triggers are frozen.
            </span>
          </div>
          <button
            onClick={handleToggleKillSwitch}
            className="underline font-bold hover:opacity-80 cursor-pointer"
          >
            Deactivate Now
          </button>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-6 pb-2">
        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3">
          <span className="text-[11px] font-medium text-[var(--text-secondary)]">Total Evaluated</span>
          <p className="text-lg font-bold text-[var(--text-primary)] mt-0.5">{logs.length}</p>
        </div>
        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3">
          <span className="text-[11px] font-medium text-[var(--text-secondary)]">Executed Successfully</span>
          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{totalSuccess}</p>
        </div>
        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3">
          <span className="text-[11px] font-medium text-[var(--text-secondary)]">Blocked by Guardrails</span>
          <p className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-0.5">{totalBlocked}</p>
        </div>
        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3">
          <span className="text-[11px] font-medium text-[var(--text-secondary)]">Execution Errors</span>
          <p className="text-lg font-bold text-rose-600 dark:text-rose-400 mt-0.5">{totalError}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-1 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-6 py-2">
        {(
          [
            { id: "ALL", label: "All Activity" },
            { id: "SUCCESS", label: "Success" },
            { id: "BLOCKED_GUARDRAIL", label: "Guardrail Blocks" },
            { id: "ERROR", label: "Errors" },
          ] as const
        ).map((tab) => {
          const isSelected = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`flex items-center space-x-1.5 rounded-md px-3 py-1 text-xs transition-colors cursor-pointer ${
                isSelected
                  ? "bg-[var(--bg-surface-selected)] font-semibold text-[#3F5F8F] dark:text-[#7CA1D8]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]"
              }`}
            >
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Log Feed */}
      <div className="flex-1 overflow-y-auto p-6 space-y-2.5">
        {isLoading && logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-xs text-[var(--text-muted)] space-y-2">
            <RefreshCw className="h-6 w-6 animate-spin text-[#3F5F8F] dark:text-[#7CA1D8]" />
            <p>Loading automation logs...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border-subtle)] py-16 text-center space-y-2">
            <Activity className="h-8 w-8 text-[var(--text-muted)] stroke-1" />
            <p className="text-xs font-medium text-[var(--text-primary)]">
              No automation events found in {activeFilter.toLowerCase()} status
            </p>
            <p className="text-[11px] text-[var(--text-muted)] max-w-xs">
              When email rules trigger background draft generation or guardrail evaluations, events are logged here in real-time.
            </p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const isSuccess = log.status === "SUCCESS";
            const isBlocked = log.status === "BLOCKED_GUARDRAIL";
            return (
              <div
                key={log.id}
                className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3.5 shadow-2xs space-y-2 hover:border-[var(--border-focus)] transition-all"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`inline-flex items-center space-x-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        isSuccess
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          : isBlocked
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                          : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                      }`}
                    >
                      {isSuccess && <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />}
                      {isBlocked && <ShieldAlert className="h-2.5 w-2.5 mr-0.5" />}
                      <span>{log.status.replace("_", " ")}</span>
                    </span>

                    <span className="font-semibold text-[var(--text-primary)]">
                      {log.actionExecuted.replace("_", " ")}
                    </span>

                    {log.rule && (
                      <span className="text-[11px] text-[var(--text-muted)]">
                        via Rule: <span className="font-medium text-[var(--text-secondary)]">{log.rule.name}</span>
                      </span>
                    )}
                  </div>

                  <span className="text-[10px] text-[var(--text-muted)]">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>

                <div className="text-xs space-y-0.5">
                  {log.emailSubject && (
                    <p className="text-[var(--text-primary)] font-medium">
                      Subject: {log.emailSubject}
                    </p>
                  )}
                  {log.senderEmail && (
                    <p className="text-[11px] text-[var(--text-secondary)]">
                      Sender: {log.senderEmail}
                    </p>
                  )}
                </div>

                {/* Diagnostics inspection */}
                {log.diagnostics && (
                  <div className="rounded bg-[var(--bg-canvas)] p-2 text-[11px] text-[var(--text-secondary)] border border-[var(--border-subtle)] font-mono text-[10px]">
                    {JSON.stringify(log.diagnostics, null, 2)}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
