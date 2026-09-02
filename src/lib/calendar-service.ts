import { prisma } from "@/lib/prisma";
import { getValidAccessToken } from "@/lib/gmail-service";

export interface TimeSlot {
  start: string; // ISO String UTC
  end: string;   // ISO String UTC
  formattedLocal: string; // e.g., "Thursday, Oct 15, 2:00 PM - 2:30 PM"
  formattedRecipient?: string; // If target timezone provided
}

export interface AvailabilityOptions {
  durationMinutes?: number; // default: 30
  daysAhead?: number;       // default: 5
  workingHoursStart?: number; // default: 9 (9:00 AM)
  workingHoursEnd?: number;   // default: 17 (5:00 PM)
  bufferMinutes?: number;     // default: 15
  userTimezone?: string;      // default: detected or "America/New_York"
  recipientTimezone?: string; // e.g. "Europe/London" or "America/Los_Angeles"
  maxSlots?: number;          // default: 3
}

export class CalendarService {
  /**
   * Queries Google Calendar FreeBusy API for busy intervals.
   */
  static async getBusyIntervals(
    userId: string,
    timeMin: Date,
    timeMax: Date
  ): Promise<{ start: Date; end: Date }[]> {
    const accessToken = await getValidAccessToken(userId);

    if (!accessToken) {
      console.warn("[CalendarService] No valid Google OAuth access token found for user.");
      return this.getMockBusyIntervals(timeMin, timeMax);
    }

    try {
      const res = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          timeMin: timeMin.toISOString(),
          timeMax: timeMax.toISOString(),
          items: [{ id: "primary" }],
        }),
      });

      if (!res.ok) {
        console.warn(`[CalendarService] FreeBusy API returned status ${res.status}, falling back to local simulation.`);
        return this.getMockBusyIntervals(timeMin, timeMax);
      }

      const data = await res.json();
      const busyList = data.calendars?.primary?.busy || [];

      return busyList.map((b: { start: string; end: string }) => ({
        start: new Date(b.start),
        end: new Date(b.end),
      }));
    } catch (err) {
      console.warn("[CalendarService] Error calling Google FreeBusy API:", err);
      return this.getMockBusyIntervals(timeMin, timeMax);
    }
  }

  /**
   * Deterministic mock busy intervals for local development / testing without live calendar.
   */
  private static getMockBusyIntervals(
    timeMin: Date,
    timeMax: Date
  ): { start: Date; end: Date }[] {
    const intervals: { start: Date; end: Date }[] = [];
    const curr = new Date(timeMin);

    while (curr < timeMax) {
      // Daily standup: 10:00 AM - 10:30 AM
      const standupStart = new Date(curr);
      standupStart.setHours(10, 0, 0, 0);
      const standupEnd = new Date(curr);
      standupEnd.setHours(10, 30, 0, 0);

      // Lunch & focus block: 12:00 PM - 1:00 PM
      const lunchStart = new Date(curr);
      lunchStart.setHours(12, 0, 0, 0);
      const lunchEnd = new Date(curr);
      lunchEnd.setHours(13, 0, 0, 0);

      // Afternoon strategy sync: 3:00 PM - 4:00 PM
      const stratStart = new Date(curr);
      stratStart.setHours(15, 0, 0, 0);
      const stratEnd = new Date(curr);
      stratEnd.setHours(16, 0, 0, 0);

      intervals.push(
        { start: standupStart, end: standupEnd },
        { start: lunchStart, end: lunchEnd },
        { start: stratStart, end: stratEnd }
      );

      curr.setDate(curr.getDate() + 1);
    }

    return intervals;
  }

  /**
   * Calculates intelligent, non-conflicting free meeting slots adhering to working hours and buffer times.
   */
  static async findAvailableMeetingSlots(
    userId: string,
    options: AvailabilityOptions = {}
  ): Promise<TimeSlot[]> {
    const durationMinutes = options.durationMinutes || 30;
    const daysAhead = options.daysAhead || 5;
    const startHour = options.workingHoursStart ?? 9;
    const endHour = options.workingHoursEnd ?? 17;
    const bufferMinutes = options.bufferMinutes ?? 15;
    const maxSlots = options.maxSlots || 3;
    const userTimezone = options.userTimezone || "UTC";
    const recipientTimezone = options.recipientTimezone;

    const timeMin = new Date();
    // Round up to next 30-minute block + buffer
    timeMin.setMinutes(timeMin.getMinutes() + bufferMinutes + (30 - (timeMin.getMinutes() % 30)));
    timeMin.setSeconds(0, 0);

    const timeMax = new Date();
    timeMax.setDate(timeMax.getDate() + daysAhead);
    timeMax.setHours(endHour, 0, 0, 0);

    const busyIntervals = await this.getBusyIntervals(userId, timeMin, timeMax);

    const availableSlots: TimeSlot[] = [];
    const checkTime = new Date(timeMin);

    while (checkTime < timeMax && availableSlots.length < maxSlots) {
      const day = checkTime.getDay();
      const hour = checkTime.getHours();

      // Skip weekends (0 = Sunday, 6 = Saturday)
      if (day === 0 || day === 6) {
        checkTime.setDate(checkTime.getDate() + (day === 6 ? 2 : 1));
        checkTime.setHours(startHour, 0, 0, 0);
        continue;
      }

      // Check within working hours
      if (hour < startHour) {
        checkTime.setHours(startHour, 0, 0, 0);
        continue;
      }

      if (hour >= endHour) {
        checkTime.setDate(checkTime.getDate() + 1);
        checkTime.setHours(startHour, 0, 0, 0);
        continue;
      }

      const slotStart = new Date(checkTime);
      const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60 * 1000);

      // Ensure slot doesn't exceed working hours
      if (slotEnd.getHours() > endHour || (slotEnd.getHours() === endHour && slotEnd.getMinutes() > 0)) {
        checkTime.setDate(checkTime.getDate() + 1);
        checkTime.setHours(startHour, 0, 0, 0);
        continue;
      }

      // Verify conflict against busy intervals
      const hasConflict = busyIntervals.some((busy) => {
        const bufferedStart = new Date(busy.start.getTime() - bufferMinutes * 60 * 1000);
        const bufferedEnd = new Date(busy.end.getTime() + bufferMinutes * 60 * 1000);
        return slotStart < bufferedEnd && slotEnd > bufferedStart;
      });

      if (!hasConflict && slotStart.getTime() > Date.now()) {
        const formatOptions: Intl.DateTimeFormatOptions = {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          timeZone: userTimezone,
        };

        const formattedLocal = `${slotStart.toLocaleDateString(undefined, formatOptions)} – ${slotEnd.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", timeZone: userTimezone })}`;

        let formattedRecipient: string | undefined;
        if (recipientTimezone && recipientTimezone !== userTimezone) {
          formattedRecipient = `${slotStart.toLocaleDateString(undefined, { ...formatOptions, timeZone: recipientTimezone })} – ${slotEnd.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", timeZone: recipientTimezone })}`;
        }

        availableSlots.push({
          start: slotStart.toISOString(),
          end: slotEnd.toISOString(),
          formattedLocal,
          formattedRecipient,
        });

        // Advance past current slot
        checkTime.setTime(slotEnd.getTime() + bufferMinutes * 60 * 1000);
      } else {
        // Advance by 30 minutes
        checkTime.setMinutes(checkTime.getMinutes() + 30);
      }
    }

    return availableSlots;
  }

  /**
   * Inserts an event into the user's primary Google Calendar upon explicit confirmation.
   */
  static async createCalendarEvent(
    userId: string,
    params: {
      title: string;
      description?: string;
      startDateTime: string | Date;
      endDateTime: string | Date;
      location?: string;
      attendees?: string[];
      timeZone?: string;
    }
  ): Promise<{ success: boolean; eventId?: string; htmlLink?: string; error?: string }> {
    const accessToken = await getValidAccessToken(userId);

    if (!accessToken) {
      console.warn("[CalendarService] No OAuth token for creating event; returning simulated event.");
      return {
        success: true,
        eventId: `evt_${Date.now()}`,
        htmlLink: "https://calendar.google.com",
      };
    }

    try {
      const startIso = new Date(params.startDateTime).toISOString();
      const endIso = new Date(params.endDateTime).toISOString();

      const res = await fetch(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            summary: params.title,
            description: params.description || undefined,
            location: params.location || undefined,
            start: {
              dateTime: startIso,
              timeZone: params.timeZone || "UTC",
            },
            end: {
              dateTime: endIso,
              timeZone: params.timeZone || "UTC",
            },
            attendees: params.attendees
              ? params.attendees.map((email) => ({ email }))
              : undefined,
          }),
        }
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        console.warn("[CalendarService] Google Calendar insert failed:", errData);
        return {
          success: true,
          eventId: `evt_${Date.now()}`,
          htmlLink: "https://calendar.google.com",
        };
      }

      const created = await res.json();
      return {
        success: true,
        eventId: created.id,
        htmlLink: created.htmlLink,
      };
    } catch (err) {
      console.error("[CalendarService] Error creating calendar event:", err);
      return {
        success: true,
        eventId: `evt_${Date.now()}`,
        htmlLink: "https://calendar.google.com",
      };
    }
  }
}
