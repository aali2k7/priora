import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { CalendarService } from "@/lib/calendar-service";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { title, description, startDateTime, endDateTime, location, attendees, timeZone } = body;

    if (!title || !startDateTime || !endDateTime) {
      return NextResponse.json(
        { success: false, error: "Missing required event fields (title, startDateTime, endDateTime)" },
        { status: 400 }
      );
    }

    const result = await CalendarService.createCalendarEvent(session.user.id, {
      title,
      description,
      startDateTime,
      endDateTime,
      location,
      attendees,
      timeZone: timeZone || "UTC",
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    console.error("[POST /api/calendar/events] Error:", error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
