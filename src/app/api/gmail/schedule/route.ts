import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { ScheduledEmailService } from "@/lib/scheduled-email-service";
import { prisma } from "@/lib/prisma";

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

    const scheduledEmails = await ScheduledEmailService.getScheduledEmails(
      session.user.id
    );

    return NextResponse.json({
      success: true,
      data: scheduledEmails,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    console.error("[GET /api/gmail/schedule] Error:", error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

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
    const { action, scheduledId, newScheduledAt, userTimezone, userFormattedTime } = body;

    // 1. Handle Cancel Action
    if (action === "cancel") {
      if (!scheduledId) {
        return NextResponse.json(
          { success: false, error: "Missing scheduledId parameter" },
          { status: 400 }
        );
      }
      const cancelled = await ScheduledEmailService.cancelScheduledEmail(
        session.user.id,
        scheduledId
      );
      return NextResponse.json({ success: true, data: cancelled });
    }

    // 2. Handle Reschedule Action
    if (action === "reschedule") {
      if (!scheduledId || !newScheduledAt) {
        return NextResponse.json(
          { success: false, error: "Missing scheduledId or newScheduledAt parameter" },
          { status: 400 }
        );
      }
      const rescheduled = await ScheduledEmailService.rescheduleEmail(
        session.user.id,
        scheduledId,
        newScheduledAt,
        userTimezone,
        userFormattedTime
      );
      return NextResponse.json({ success: true, data: rescheduled });
    }

    // 3. Handle New Scheduled Email Creation
    const { to, subject, bodyText, cc, bcc, threadId, scheduledAt } = body;

    if (!bodyText || typeof bodyText !== "string" || !bodyText.trim()) {
      return NextResponse.json(
        { success: false, error: "Email body content is required" },
        { status: 400 }
      );
    }

    if (!scheduledAt) {
      return NextResponse.json(
        { success: false, error: "scheduledAt timestamp is required" },
        { status: 400 }
      );
    }

    // Resolve active Gmail account for user
    const gmailAccount = await prisma.gmailAccount.findFirst({
      where: { userId: session.user.id },
    });

    if (!gmailAccount) {
      return NextResponse.json(
        { success: false, error: "No connected Gmail account found for this user." },
        { status: 400 }
      );
    }

    const scheduled = await ScheduledEmailService.createScheduledEmail({
      userId: session.user.id,
      accountId: gmailAccount.id,
      threadId: threadId || undefined,
      to: to || gmailAccount.email,
      cc,
      bcc,
      subject: subject || "(No Subject)",
      bodyText: bodyText.trim(),
      scheduledAt,
      userTimezone: userTimezone || "UTC",
      userFormattedTime: userFormattedTime || undefined,
    });

    return NextResponse.json({
      success: true,
      scheduledId: scheduled.id,
      scheduledAt: scheduled.scheduledAt,
      status: scheduled.status,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    console.error("[POST /api/gmail/schedule] Error:", error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
