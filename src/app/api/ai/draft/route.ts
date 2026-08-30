import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { AIService } from "@/lib/ai-service";
import { ToneModifier } from "@/types/ai";
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
    const tone = (searchParams.get("tone") as ToneModifier) || "concise";

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

    const draft = await AIService.getDraftResponse(thread.id, tone);
    return NextResponse.json({ draft });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to generate AI draft";
    console.error("[GET /api/ai/draft] Error:", error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
