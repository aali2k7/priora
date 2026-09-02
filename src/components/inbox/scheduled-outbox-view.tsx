"use client";

import React, { useState, useEffect } from "react";
import {
  Clock,
  Calendar,
  RefreshCw,
  Send,
  XCircle,
  AlertCircle,
  CheckCircle2,
  Edit2,
  Play,
  Trash2,
  Globe,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface ScheduledEmailItem {
  id: string;
  userId: string;
  accountId: string;
  threadId?: string | null;
  toEmails: string[];
  toNames?: string[];
  ccEmails?: string[];
  bccEmails?: string[];
  subject: string;
  bodyTextEncrypted: string;
  scheduledAt: string;
  userTimezone: string;
  userFormattedTime?: string | null;
  status: "DRAFT" | "SCHEDULED" | "SENDING" | "SENT" | "FAILED" | "CANCELLED";
  idempotencyKey: string;
  attempts: number;
  maxAttempts: number;
  lastErrorMessage?: string | null;
  sentAt?: string | null;
  cancelledAt?: string | null;
  createdAt: string;
  account?: {
    email: string;
  };
}

export function ScheduledOutboxView() {
  const [items, setItems] = useState<ScheduledEmailItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<
    "ALL" | "SCHEDULED" | "SENT" | "FAILED" | "CANCELLED"
  >("SCHEDULED");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Reschedule Modal State
  const [reschedulingItem, setReschedulingItem] =
    useState<ScheduledEmailItem | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("08:00");
  const [isSubmittingReschedule, setIsSubmittingReschedule] = useState(false);

  const fetchScheduled = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/gmail/schedule");
      if (res.ok) {
        const data = await res.json();
        if (data.data) {
          setItems(data.data);
        }
      } else {
        setErrorMessage("Failed to load scheduled emails.");
      }
    } catch (err) {
      console.error("[ScheduledOutboxView] Error fetching:", err);
      setErrorMessage("Network error fetching scheduled emails.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchScheduled();
  }, []);

  const handleCancel = async (id: string) => {
    setErrorMessage(null);
    try {
      const res = await fetch("/api/gmail/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel", scheduledId: id }),
      });
      if (res.ok) {
        setSuccessMessage("Scheduled email cancelled successfully.");
        fetchScheduled();
      } else {
        const data = await res.json();
        setErrorMessage(data.error || "Failed to cancel email.");
      }
    } catch {
      setErrorMessage("Error cancelling email.");
    }
  };

  const handleProcessDueNow = async () => {
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/gmail/schedule/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workerId: "manual_trigger" }),
      });
      if (res.ok) {
        const data = await res.json();
        setSuccessMessage(
          `Processed due queue: ${data.data.processedCount} email(s) evaluated.`
        );
        fetchScheduled();
      }
    } catch {
      setErrorMessage("Failed to trigger queue processing.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenReschedule = (item: ScheduledEmailItem) => {
    setReschedulingItem(item);
    const d = new Date(item.scheduledAt);
    setRescheduleDate(d.toISOString().split("T")[0]);
    const hours = String(d.getHours()).padStart(2, "0");
    const mins = String(d.getMinutes()).padStart(2, "0");
    setRescheduleTime(`${hours}:${mins}`);
  };

  const handleConfirmReschedule = async () => {
    if (!reschedulingItem || !rescheduleDate || !rescheduleTime) return;

    setIsSubmittingReschedule(true);
    setErrorMessage(null);

    const [year, month, day] = rescheduleDate.split("-").map(Number);
    const [hours, mins] = rescheduleTime.split(":").map(Number);
    const targetDate = new Date(year, month - 1, day, hours, mins, 0);

    if (targetDate.getTime() <= Date.now()) {
      setErrorMessage("New scheduled time must be in the future.");
      setIsSubmittingReschedule(false);
      return;
    }

    const formattedTime = targetDate.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

    try {
      const res = await fetch("/api/gmail/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reschedule",
          scheduledId: reschedulingItem.id,
          newScheduledAt: targetDate.toISOString(),
          userFormattedTime: formattedTime,
        }),
      });

      if (res.ok) {
        setSuccessMessage(`Email rescheduled for ${formattedTime}.`);
        setReschedulingItem(null);
        fetchScheduled();
      } else {
        const data = await res.json();
        setErrorMessage(data.error || "Failed to reschedule.");
      }
    } catch {
      setErrorMessage("Error rescheduling email.");
    } finally {
      setIsSubmittingReschedule(false);
    }
  };

  const filteredItems = items.filter((item) => {
    if (activeFilter === "ALL") return true;
    return item.status === activeFilter;
  });

  const scheduledCount = items.filter((i) => i.status === "SCHEDULED").length;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[var(--bg-canvas)]">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-6 py-4">
        <div className="flex items-center space-x-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#3F5F8F]/10 text-[#3F5F8F] dark:bg-[#7CA1D8]/10 dark:text-[#7CA1D8]">
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                Scheduled Outbox
              </h2>
              <span className="rounded-full bg-[#3F5F8F]/10 px-2 py-0.5 text-[10px] font-bold text-[#3F5F8F] dark:bg-[#7CA1D8]/10 dark:text-[#7CA1D8]">
                {scheduledCount} pending
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)]">
              Emails queued for asynchronous automated dispatch via Gmail API
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchScheduled}
            disabled={isLoading}
            className="text-xs space-x-1"
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleProcessDueNow}
            disabled={isProcessing}
            className="text-xs space-x-1"
          >
            <Play className={`h-3 w-3 ${isProcessing ? "animate-spin text-[#3F5F8F]" : ""}`} />
            <span>Process Due Now</span>
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {errorMessage && (
        <div className="mx-6 mt-4 flex items-center space-x-2 rounded-md border border-[var(--status-urgent-border)] bg-[var(--status-urgent-subtle)] p-3 text-xs text-[var(--status-urgent)]">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="mx-6 mt-4 flex items-center space-x-2 rounded-md border border-[var(--status-success-border)] bg-[var(--status-success-subtle)] p-3 text-xs text-[var(--status-success)]">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center space-x-1 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-6 py-2">
        {(
          [
            { id: "SCHEDULED", label: "Scheduled" },
            { id: "ALL", label: "All Items" },
            { id: "SENT", label: "Sent" },
            { id: "FAILED", label: "Failed" },
            { id: "CANCELLED", label: "Cancelled" },
          ] as const
        ).map((tab) => {
          const count = items.filter((i) =>
            tab.id === "ALL" ? true : i.status === tab.id
          ).length;
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
              <span className="text-[10px] opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        {isLoading && items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-xs text-[var(--text-muted)] space-y-2">
            <RefreshCw className="h-6 w-6 animate-spin text-[#3F5F8F] dark:text-[#7CA1D8]" />
            <p>Loading scheduled emails...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border-subtle)] py-16 text-center space-y-2">
            <Clock className="h-8 w-8 text-[var(--text-muted)] stroke-1" />
            <p className="text-xs font-medium text-[var(--text-primary)]">
              No emails in {activeFilter.toLowerCase()} status
            </p>
            <p className="text-[11px] text-[var(--text-muted)] max-w-xs">
              When you schedule emails via Compose or Reply, they will appear here until automated dispatch.
            </p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isDue = new Date(item.scheduledAt).getTime() <= Date.now();
            return (
              <div
                key={item.id}
                className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 shadow-2xs transition-all hover:border-[var(--border-focus)] space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-2.5">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        item.status === "SCHEDULED"
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                          : item.status === "SENDING"
                          ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                          : item.status === "SENT"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          : item.status === "FAILED"
                          ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                          : "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20"
                      }`}
                    >
                      {item.status}
                    </span>

                    <span className="flex items-center space-x-1 text-xs text-[var(--text-secondary)] font-medium">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {item.userFormattedTime ||
                          new Date(item.scheduledAt).toLocaleString()}
                      </span>
                    </span>

                    <span className="flex items-center space-x-0.5 text-[10px] text-[var(--text-muted)]">
                      <Globe className="h-2.5 w-2.5" />
                      <span>{item.userTimezone}</span>
                    </span>
                  </div>

                  {/* Actions for Scheduled Items */}
                  {item.status === "SCHEDULED" && (
                    <div className="flex items-center space-x-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenReschedule(item)}
                        className="h-7 px-2 text-[11px] space-x-1"
                      >
                        <Edit2 className="h-3 w-3" />
                        <span>Reschedule</span>
                      </Button>

                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleCancel(item.id)}
                        className="h-7 px-2 text-[11px] space-x-1"
                      >
                        <XCircle className="h-3 w-3" />
                        <span>Cancel</span>
                      </Button>
                    </div>
                  )}
                </div>

                {/* Email Metadata */}
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="font-semibold text-[var(--text-primary)]">
                      To:
                    </span>
                    <span className="text-[var(--text-secondary)]">
                      {(item.toEmails as string[]).join(", ")}
                    </span>
                  </div>

                  <h3 className="text-xs font-semibold text-[var(--text-primary)]">
                    {item.subject}
                  </h3>

                  <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2 leading-relaxed bg-[var(--bg-canvas)] p-2 rounded border border-[var(--border-subtle)]">
                    {item.bodyTextEncrypted}
                  </p>
                </div>

                {/* Diagnostic Banner if Failed */}
                {item.status === "FAILED" && item.lastErrorMessage && (
                  <div className="rounded border border-[var(--status-urgent-border)] bg-[var(--status-urgent-subtle)] p-2 text-[11px] text-[var(--status-urgent)]">
                    <p className="font-semibold">Dispatch Failure:</p>
                    <p className="opacity-90">{item.lastErrorMessage}</p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Reschedule Modal */}
      {reschedulingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-2xl space-y-4">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              Reschedule Email
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Update the scheduled dispatch date and time.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">
                  New Date
                </label>
                <input
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 py-1.5 text-xs text-[var(--text-primary)] focus:border-[#3F5F8F] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">
                  New Time
                </label>
                <input
                  type="time"
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 py-1.5 text-xs text-[var(--text-primary)] focus:border-[#3F5F8F] focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[var(--border-subtle)]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReschedulingItem(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmReschedule}
                disabled={isSubmittingReschedule}
              >
                {isSubmittingReschedule ? "Saving..." : "Save Reschedule"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
