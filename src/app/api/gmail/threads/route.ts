import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { fetchLiveGmailThreads } from "@/lib/gmail-service";
import { MOCK_THREADS } from "@/lib/mock-data";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({
        isLive: false,
        threads: MOCK_THREADS,
        message: "No active authenticated session",
      });
    }

    const result = await fetchLiveGmailThreads(session.user.id);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[API /api/gmail/threads] Error:", error);
    return NextResponse.json({
      isLive: false,
      threads: MOCK_THREADS,
      error: "Internal server error fetching Gmail threads",
    });
  }
}
