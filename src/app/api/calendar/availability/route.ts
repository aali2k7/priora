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
    const {
      durationMinutes,
      daysAhead,
      workingHoursStart,
      workingHoursEnd,
      bufferMinutes,
      userTimezone,
      recipientTimezone,
      maxSlots,
    } = body;

    const slots = await CalendarService.findAvailableMeetingSlots(
      session.user.id,
      {
        durationMinutes: durationMinutes ? Number(durationMinutes) : 30,
        daysAhead: daysAhead ? Number(daysAhead) : 5,
        workingHoursStart: workingHoursStart ? Number(workingHoursStart) : 9,
        workingHoursEnd: workingHoursEnd ? Number(workingHoursEnd) : 17,
        bufferMinutes: bufferMinutes ? Number(bufferMinutes) : 15,
        userTimezone: userTimezone || "UTC",
        recipientTimezone: recipientTimezone || undefined,
        maxSlots: maxSlots ? Number(maxSlots) : 3,
      }
    );

    return NextResponse.json({
      success: true,
      slots,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    console.error("[POST /api/calendar/availability] Error:", error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function GET() {
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

    const slots = await CalendarService.findAvailableMeetingSlots(
      session.user.id,
      { durationMinutes: 30, maxSlots: 3 }
    );

    return NextResponse.json({
      success: true,
      slots,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
