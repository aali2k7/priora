import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncGmailHistoryDelta } from "@/lib/gmail-sync";

interface PubSubMessagePayload {
  message?: {
    data?: string;
    messageId?: string;
    publishTime?: string;
  };
  subscription?: string;
}

interface DecodedPushData {
  emailAddress?: string;
  historyId?: string | number;
}

/**
 * Webhook endpoint for Google Cloud Pub/Sub Gmail Push Notifications.
 * Google Pub/Sub POSTs notifications here in real-time when new emails arrive.
 */
export async function POST(req: Request) {
  try {
    const body: PubSubMessagePayload = await req.json().catch(() => ({}));

    if (!body?.message?.data) {
      console.warn("[Gmail Webhook] Received Pub/Sub POST without message data.");
      return NextResponse.json({ status: "ignored", message: "No message data" }, { status: 200 });
    }

    // 1. Decode base64 encoded Pub/Sub payload
    let pushData: DecodedPushData = {};
    try {
      const decodedRaw = Buffer.from(body.message.data, "base64").toString("utf-8");
      pushData = JSON.parse(decodedRaw);
    } catch (parseErr) {
      console.error("[Gmail Webhook] Failed to decode Pub/Sub base64 data:", parseErr);
      return NextResponse.json({ status: "error", message: "Invalid payload format" }, { status: 200 });
    }

    const { emailAddress, historyId } = pushData;
    console.log(`[Gmail Webhook] Push notification received for ${emailAddress} (historyId: ${historyId})`);

    if (!emailAddress) {
      return NextResponse.json({ status: "ignored", message: "No email address" }, { status: 200 });
    }

    // 2. Lookup connected account in PostgreSQL
    const account = await prisma.gmailAccount.findFirst({
      where: { email: emailAddress },
    });

    if (!account) {
      console.warn(`[Gmail Webhook] Received push for unregistered email: ${emailAddress}`);
      return NextResponse.json({ status: "ignored", message: "Account not found" }, { status: 200 });
    }

    // 3. Process incremental delta sync non-blockingly
    syncGmailHistoryDelta(account.userId, historyId ? String(historyId) : undefined).catch((err) => {
      console.error(`[Gmail Webhook] Delta sync error for ${emailAddress}:`, err);
    });

    // Always acknowledge Pub/Sub message with 200 OK immediately
    return NextResponse.json({ status: "ok", received: true }, { status: 200 });
  } catch (error) {
    console.error("[Gmail Webhook] Error processing Pub/Sub push:", error);
    return NextResponse.json({ status: "error", message: String(error) }, { status: 200 });
  }
}
