import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { AIService } from "@/lib/ai-service";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const briefing = await AIService.getExecutiveBriefing(session.user.id);
    return NextResponse.json({ briefing });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to retrieve executive briefing";
    console.error("[GET /api/ai/briefing] Error:", error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
