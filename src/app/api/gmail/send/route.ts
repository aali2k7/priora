import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { sendGmailMessage, sendGmailReply } from "@/lib/gmail-service";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: No active session" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { to, subject, bodyText, threadId, cc, bcc, archiveAfterSend } = body;

    if (!bodyText || typeof bodyText !== "string" || !bodyText.trim()) {
      return NextResponse.json(
        { success: false, error: "Email body content is required" },
        { status: 400 }
      );
    }

    // If threadId is provided and no 'to' is specified, treat as reply
    if (threadId && !to) {
      const replyResult = await sendGmailReply(
        session.user.id,
        threadId,
        bodyText.trim(),
        !!archiveAfterSend
      );

      if (!replyResult.success) {
        return NextResponse.json(
          { success: false, error: replyResult.error || "Failed to send reply" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        messageId: replyResult.messageId,
        threadId,
      });
    }

    // Standalone or custom-addressed email
    if (!to) {
      return NextResponse.json(
        { success: false, error: "Recipient email ('to') is required" },
        { status: 400 }
      );
    }

    const sendResult = await sendGmailMessage({
      userId: session.user.id,
      to,
      subject: subject || "(No Subject)",
      bodyText: bodyText.trim(),
      threadId,
      cc,
      bcc,
    });

    if (!sendResult.success) {
      return NextResponse.json(
        { success: false, error: sendResult.error || "Failed to dispatch email via Gmail API" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: sendResult.messageId,
      threadId: sendResult.threadId,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    console.error("[POST /api/gmail/send] Error:", error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
