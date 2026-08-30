import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { AIService } from "@/lib/ai-service";
import { prisma } from "@/lib/prisma";

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

    // Verify thread ownership
    const thread = await prisma.thread.findFirst({
      where: {
        OR: [{ id: threadId }, { gmailThreadId: threadId }],
        account: {
          userId: session.user.id,
        },
      },
      select: { id: true },
    });

    if (!thread) {
      return NextResponse.json({ error: "Thread not found or unauthorized" }, { status: 404 });
    }

    const summary = await AIService.getThreadSummary(thread.id);
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
