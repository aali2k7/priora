import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { AIService } from "@/lib/ai-service";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const threadId = searchParams.get("threadId");

    if (!threadId) {
      return NextResponse.json({ error: "threadId query parameter is required" }, { status: 400 });
    }

    const summary = await AIService.getThreadSummary(threadId);
    return NextResponse.json({ summary });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to get thread summary";
    console.error("[GET /api/ai/summary] Error:", error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
