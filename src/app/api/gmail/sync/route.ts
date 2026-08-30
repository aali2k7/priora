import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { syncUserGmailInbox } from "@/lib/gmail-sync";

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: No active session" },
        { status: 401 }
      );
    }

    let force = true;
    try {
      const body = await req.json();
      if (typeof body?.force === "boolean") {
        force = body.force;
      }
    } catch {
      // Empty or non-JSON body defaults to force=true for manual sync trigger
    }

    const result = await syncUserGmailInbox(session.user.id, { force });
    return NextResponse.json(result);
  } catch (error) {
    console.error("[POST /api/gmail/sync] Internal error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error during Gmail sync" },
      { status: 500 }
    );
  }
}
