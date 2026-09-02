import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { WaitingOnService } from "@/lib/waiting-on-service";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const items = await WaitingOnService.getWaitingOnDependencies(
      session.user.id
    );

    return NextResponse.json({ success: true, data: items });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    console.error("[GET /api/ai/waiting-on] Error:", error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
