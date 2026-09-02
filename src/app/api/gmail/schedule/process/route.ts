import { NextResponse } from "next/server";
import { ScheduledEmailService } from "@/lib/scheduled-email-service";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const workerId = body.workerId || `cron_${Date.now()}`;

    const summary = await ScheduledEmailService.processDueScheduledEmails(workerId);

    return NextResponse.json({
      success: true,
      data: summary,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    console.error("[POST /api/gmail/schedule/process] Error:", error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function GET() {
  try {
    const summary = await ScheduledEmailService.processDueScheduledEmails("get_trigger");
    return NextResponse.json({
      success: true,
      data: summary,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
