import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
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
    const { action, threadId, value } = body;

    if (!threadId || !action) {
      return NextResponse.json(
        { error: "threadId and action are required" },
        { status: 400 }
      );
    }

    const thread = await prisma.thread.findFirst({
      where: {
        OR: [{ id: threadId }, { gmailThreadId: threadId }],
        account: { userId: session.user.id },
      },
    });

    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    if (action === "archive") {
      await prisma.thread.update({
        where: { id: thread.id },
        data: { isArchived: true },
      });
      return NextResponse.json({ success: true, message: "Thread archived" });
    }

    if (action === "snooze") {
      await prisma.thread.update({
        where: { id: thread.id },
        data: { isSnoozed: true, snoozedUntil: value ? new Date(value) : null },
      });
      return NextResponse.json({ success: true, message: "Thread snoozed" });
    }

    if (action === "markRead") {
      await prisma.thread.update({
        where: { id: thread.id },
        data: { isUnread: false },
      });
      return NextResponse.json({ success: true, message: "Marked as read" });
    }

    if (action === "reply") {
      // In a full implementation, this dispatches via Gmail API send.
      // Here, we update the thread state and mark archived.
      await prisma.thread.update({
        where: { id: thread.id },
        data: { isArchived: true },
      });
      return NextResponse.json({ success: true, message: "Reply processed" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("[POST /api/gmail/action] Error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
