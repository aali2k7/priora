import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { AIService } from "@/lib/ai-service";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { threadId, force = true } = body;

    if (!threadId) {
      return NextResponse.json({ error: "threadId is required in request body" }, { status: 400 });
    }

    // Verify user owns the thread
    const thread = await prisma.thread.findFirst({
      where: {
        OR: [{ id: threadId }, { gmailThreadId: threadId }],
        account: {
          userId: session.user.id,
        },
      },
    });

    if (!thread) {
      return NextResponse.json({ error: "Thread not found or unauthorized" }, { status: 404 });
    }

    const summary = await AIService.analyzeThreadWithGemini(thread.id, force);

    return NextResponse.json({
      success: true,
      summary,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to analyze thread";
    console.error("[POST /api/ai/analyze] Error analyzing thread:", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
