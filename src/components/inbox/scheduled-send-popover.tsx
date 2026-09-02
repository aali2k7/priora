"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Send,
  Calendar,
  Clock,
  ChevronDown,
  Sparkles,
  Check,
  Globe,
  X,
} from "lucide-react";

export interface ScheduledTimeOption {
  label: string;
  sublabel: string;
  getUtcDate: () => Date;
}

export function getSmartSchedulePresets(): ScheduledTimeOption[] {
  const now = new Date();
  
  // 1. Tomorrow morning 8:00 AM
  const tomorrowMorning = new Date(now);
  tomorrowMorning.setDate(tomorrowMorning.getDate() + 1);
  tomorrowMorning.setHours(8, 0, 0, 0);

  // 2. Tomorrow afternoon 1:00 PM
  const tomorrowAfternoon = new Date(now);
  tomorrowAfternoon.setDate(tomorrowAfternoon.getDate() + 1);
  tomorrowAfternoon.setHours(13, 0, 0, 0);

  // 3. Next Monday 8:00 AM
  const nextMonday = new Date(now);
  const dayOfWeek = nextMonday.getDay();
  const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
  nextMonday.setDate(nextMonday.getDate() + daysUntilMonday);
  nextMonday.setHours(8, 0, 0, 0);

  const formatSublabel = (d: Date) => {
    return d.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return [
    {
      label: "Tomorrow morning",
      sublabel: formatSublabel(tomorrowMorning),
      getUtcDate: () => tomorrowMorning,
    },
    {
      label: "Tomorrow afternoon",
      sublabel: formatSublabel(tomorrowAfternoon),
      getUtcDate: () => tomorrowAfternoon,
    },
    {
      label: "Monday morning",
      sublabel: formatSublabel(nextMonday),
      getUtcDate: () => nextMonday,
    },
  ];
}

interface SplitSendButtonProps {
  onSendNow: () => void;
  onScheduleSend: (scheduledAt: Date, formattedTime: string, timezone: string) => void;
  isSending?: boolean;
  disabled?: boolean;
  sendLabel?: string;
  className?: string;
}

export function SplitSendButton({
  onSendNow,
  onScheduleSend,
  isSending = false,
  disabled = false,
  sendLabel = "Send Email",
  className = "",
}: SplitSendButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Custom date-time states
  const now = new Date();
  const defaultDate = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
  const [customDate, setCustomDate] = useState(defaultDate);
  const [customTime, setCustomTime] = useState("08:00");
  const [customError, setCustomError] = useState<string | null>(null);

  const userTimezone =
    typeof Intl !== "undefined"
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : "UTC";

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handlePresetSelect = (preset: ScheduledTimeOption) => {
    const targetDate = preset.getUtcDate();
    setIsOpen(false);
    onScheduleSend(targetDate, preset.sublabel, userTimezone);
  };

  const handleCustomConfirm = () => {
    setCustomError(null);
    if (!customDate || !customTime) {
      setCustomError("Please select both a valid date and time.");
      return;
    }

    const [year, month, day] = customDate.split("-").map(Number);
    const [hours, minutes] = customTime.split(":").map(Number);
    const targetDate = new Date(year, month - 1, day, hours, minutes, 0, 0);

    if (targetDate.getTime() <= Date.now() + 60 * 1000) {
      setCustomError("Scheduled time must be at least 1 minute in the future.");
      return;
    }

    const formattedTime = targetDate.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

    setIsCustomModalOpen(false);
    setIsOpen(false);
    onScheduleSend(targetDate, formattedTime, userTimezone);
  };

  const presets = getSmartSchedulePresets();

  return (
    <div className={`relative inline-flex items-center ${className}`} ref={dropdownRef}>
      {/* Primary Send Button */}
      <button
        type="button"
        onClick={onSendNow}
        disabled={disabled || isSending}
        className="inline-flex h-8 items-center space-x-1.5 rounded-l-md bg-[#3F5F8F] px-3 text-xs font-semibold text-white transition-all hover:bg-[#324D75] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#7CA1D8] dark:text-[#0C1420] dark:hover:bg-[#96B7E6]"
      >
        <Send className="h-3 w-3" />
        <span>{sendLabel}</span>
      </button>

      {/* Dropdown Toggle Trigger */}
      <button
        type="button"
        onClick={() => !disabled && !isSending && setIsOpen(!isOpen)}
        disabled={disabled || isSending}
        aria-label="More send options"
        className="inline-flex h-8 items-center justify-center rounded-r-md border-l border-white/20 bg-[#3F5F8F] px-1.5 text-white transition-all hover:bg-[#324D75] disabled:cursor-not-allowed disabled:opacity-50 dark:border-black/20 dark:bg-[#7CA1D8] dark:text-[#0C1420] dark:hover:bg-[#96B7E6]"
      >
        <ChevronDown className="h-3.5 w-3.5" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 bottom-full mb-1.5 z-50 w-64 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-1.5 shadow-xl transition-all animate-in fade-in zoom-in-95">
          <div className="px-2 py-1 border-b border-[var(--border-subtle)] mb-1 flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-wider text-[var(--text-muted)] uppercase">
              Schedule Send
            </span>
            <span className="flex items-center space-x-1 text-[10px] text-[var(--text-muted)]">
              <Globe className="h-2.5 w-2.5" />
              <span className="truncate max-w-[90px]">{userTimezone}</span>
            </span>
          </div>

          {/* Presets List */}
          <div className="space-y-0.5">
            {presets.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handlePresetSelect(p)}
                className="w-full flex items-center justify-between rounded px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-[var(--bg-surface-hover)] cursor-pointer"
              >
                <div>
                  <p className="font-medium text-[var(--text-primary)]">{p.label}</p>
                  <p className="text-[10px] text-[var(--text-secondary)]">{p.sublabel}</p>
                </div>
                <Clock className="h-3 w-3 text-[var(--text-muted)] shrink-0" />
              </button>
            ))}
          </div>

          <div className="my-1 border-t border-[var(--border-subtle)]" />

          {/* Custom Date & Time Button */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              setIsCustomModalOpen(true);
            }}
            className="w-full flex items-center space-x-2 rounded px-2.5 py-1.5 text-left text-xs text-[#3F5F8F] dark:text-[#7CA1D8] font-semibold hover:bg-[var(--bg-surface-hover)] cursor-pointer"
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>Select custom date & time...</span>
          </button>
        </div>
      )}

      {/* Custom Schedule Dialog */}
      {isCustomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-[#3F5F8F] dark:text-[#7CA1D8]">
                <Calendar className="h-4 w-4" />
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  Custom Schedule Send
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomModalOpen(false)}
                className="rounded p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-[var(--text-secondary)]">
              Specify the exact date and time in your local timezone (
              <span className="font-mono text-[11px] text-[var(--text-primary)]">
                {userTimezone}
              </span>
              ).
            </p>

            {customError && (
              <div className="rounded-md border border-[var(--status-urgent-border)] bg-[var(--status-urgent-subtle)] p-2 text-xs text-[var(--status-urgent)]">
                {customError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">
                  Dispatch Date
                </label>
                <input
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 py-1.5 text-xs text-[var(--text-primary)] focus:border-[#3F5F8F] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">
                  Dispatch Time
                </label>
                <input
                  type="time"
                  value={customTime}
                  onChange={(e) => setCustomTime(e.target.value)}
                  className="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 py-1.5 text-xs text-[var(--text-primary)] focus:border-[#3F5F8F] focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[var(--border-subtle)]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCustomModalOpen(false)}
                type="button"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleCustomConfirm}
                type="button"
                className="space-x-1.5"
              >
                <Check className="h-3 w-3" />
                <span>Confirm Schedule</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
