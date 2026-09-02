import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { RelationshipService } from "@/lib/relationship-service";

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
      return NextResponse.json(
        { error: "threadId query parameter is required" },
        { status: 400 }
      );
    }

    const context = await RelationshipService.getThreadRelationshipContext(
      session.user.id,
      threadId
    );

    return NextResponse.json({ success: true, data: context });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    console.error("[GET /api/ai/relationship-context] Error:", error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
