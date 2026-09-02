"use client";

import React, { useState } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Check,
  ExternalLink,
  X,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface DetectedEventInfo {
  title: string;
  startDateTime: string; // ISO
  endDateTime: string;   // ISO
  formattedDate: string;
  location?: string;
  attendees?: string[];
  description?: string;
}

interface EventSuggestionBannerProps {
  event: DetectedEventInfo;
  onDismiss?: () => void;
}

export function EventSuggestionBanner({
  event,
  onDismiss,
}: EventSuggestionBannerProps) {
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createdLink, setCreatedLink] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Editable Modal State
  const [title, setTitle] = useState(event.title);
  const [location, setLocation] = useState(event.location || "");
  const [startDateTime, setStartDateTime] = useState(event.startDateTime);
  const [endDateTime, setEndDateTime] = useState(event.endDateTime);

  const handleConfirmAdd = async () => {
    setIsCreating(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/calendar/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          location: location || undefined,
          startDateTime,
          endDateTime,
          description: event.description || "Created from Priora Email Assistant",
          attendees: event.attendees,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.data?.success) {
        setCreatedLink(data.data.htmlLink || "https://calendar.google.com");
        setIsOpenModal(false);
      } else {
        setErrorMessage(data.error || "Failed to add event to Google Calendar.");
      }
    } catch {
      setErrorMessage("Error communicating with calendar service.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <div className="rounded-lg border border-[#3F5F8F]/30 bg-[#3F5F8F]/5 p-3.5 transition-all dark:bg-[#7CA1D8]/5">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-md bg-[#3F5F8F]/10 text-[#3F5F8F] dark:bg-[#7CA1D8]/10 dark:text-[#7CA1D8]">
              <Calendar className="h-4 w-4" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold tracking-wider text-[#3F5F8F] uppercase dark:text-[#7CA1D8]">
                  Event Detected in Thread
                </span>
                {createdLink && (
                  <span className="flex items-center space-x-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <Check className="h-3 w-3" />
                    <span>Added to Calendar</span>
                  </span>
                )}
              </div>

              <h4 className="text-xs font-semibold text-[var(--text-primary)]">
                {event.title}
              </h4>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[var(--text-secondary)]">
                <span className="flex items-center space-x-1">
                  <Clock className="h-3 w-3 text-[var(--text-muted)]" />
                  <span>{event.formattedDate}</span>
                </span>

                {event.location && (
                  <span className="flex items-center space-x-1">
                    <MapPin className="h-3 w-3 text-[var(--text-muted)]" />
                    <span className="truncate max-w-xs">{event.location}</span>
                  </span>
                )}

                {event.attendees && event.attendees.length > 0 && (
                  <span className="flex items-center space-x-1">
                    <Users className="h-3 w-3 text-[var(--text-muted)]" />
                    <span>{event.attendees.length} attendee(s)</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 shrink-0">
            {createdLink ? (
              <a
                href={createdLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 rounded px-2.5 py-1 text-xs font-semibold text-[#3F5F8F] hover:underline dark:text-[#7CA1D8]"
              >
                <span>Open in Calendar</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsOpenModal(true)}
                className="h-7 text-xs space-x-1"
              >
                <Calendar className="h-3 w-3" />
                <span>Add to Calendar</span>
              </Button>
            )}

            {onDismiss && (
              <button
                type="button"
                onClick={onDismiss}
                className="rounded p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation & Edit Modal */}
      {isOpenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-[#3F5F8F] dark:text-[#7CA1D8]">
                <Calendar className="h-4 w-4" />
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  Confirm Calendar Event
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpenModal(false)}
                className="rounded p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {errorMessage && (
              <div className="rounded border border-[var(--status-urgent-border)] bg-[var(--status-urgent-subtle)] p-2.5 text-xs text-[var(--status-urgent)] flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">
                  Event Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 py-1.5 text-xs text-[var(--text-primary)] focus:border-[#3F5F8F] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">
                  Location or Video Link
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Google Meet or Conference Room A"
                  className="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 py-1.5 text-xs text-[var(--text-primary)] focus:border-[#3F5F8F] focus:outline-hidden"
                />
              </div>

              <div className="rounded-md bg-[var(--bg-canvas)] p-2.5 text-xs text-[var(--text-secondary)] space-y-1 border border-[var(--border-subtle)]">
                <p className="font-semibold text-[var(--text-primary)]">Time Details:</p>
                <p>{event.formattedDate}</p>
                {event.attendees && event.attendees.length > 0 && (
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Invitees: {event.attendees.join(", ")}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[var(--border-subtle)]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOpenModal(false)}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmAdd}
                disabled={isCreating || !title.trim()}
                className="space-x-1"
              >
                <Check className="h-3 w-3" />
                <span>{isCreating ? "Adding..." : "Add to Google Calendar"}</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
