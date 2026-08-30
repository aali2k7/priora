import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendGmailReply, modifyGmailThreadLabels } from "@/lib/gmail-service";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { action, threadId, value, archiveAfterSend } = body;

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

      // Synchronize label removal with live Gmail
      modifyGmailThreadLabels(session.user.id, thread.gmailThreadId, [], ["INBOX"]).catch((e) =>
        console.warn("[POST /api/gmail/action] Live Gmail archive label update warning:", e)
      );

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

      // Synchronize label removal with live Gmail
      modifyGmailThreadLabels(session.user.id, thread.gmailThreadId, [], ["UNREAD"]).catch((e) =>
        console.warn("[POST /api/gmail/action] Live Gmail markRead label update warning:", e)
      );

      return NextResponse.json({ success: true, message: "Marked as read" });
    }

    if (action === "reply") {
      if (!value || typeof value !== "string" || !value.trim()) {
        return NextResponse.json(
          { error: "Reply text content cannot be empty" },
          { status: 400 }
        );
      }

      const result = await sendGmailReply(
        session.user.id,
        thread.id,
        value.trim(),
        archiveAfterSend !== false
      );

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || "Failed to send Gmail reply" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Reply sent successfully",
        messageId: result.messageId,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("[POST /api/gmail/action] Error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

