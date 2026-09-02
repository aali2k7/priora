import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { FollowUpService } from "@/lib/followup-service";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const minDays = Number(searchParams.get("minDays")) || 2;

    const candidates = await FollowUpService.detectFollowUpCandidates(
      session.user.id,
      minDays
    );

    return NextResponse.json({ success: true, data: candidates });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    console.error("[GET /api/ai/followups] Error:", error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { threadId } = body;

    if (!threadId) {
      return NextResponse.json(
        { error: "threadId is required" },
        { status: 400 }
      );
    }

    const draft = await FollowUpService.generateFollowUpDraft(
      session.user.id,
      threadId
    );

    return NextResponse.json({ success: true, draft });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    console.error("[POST /api/ai/followups] Error:", error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
