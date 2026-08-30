import { prisma } from "@/lib/prisma";
import { getValidAccessToken } from "@/lib/gmail-service";

export interface WatchResponse {
  success: boolean;
  historyId?: string;
  expiration?: string;
  message?: string;
}

/**
 * Registers a Gmail watch push notification on Google Cloud Pub/Sub.
 * When new emails arrive, Gmail will publish a message to the specified Pub/Sub topic.
 */
export async function setupGmailWatch(userId: string): Promise<WatchResponse> {
  const topicName = process.env.GMAIL_PUBSUB_TOPIC_NAME;
  if (!topicName) {
    console.log("[Gmail Watch] GMAIL_PUBSUB_TOPIC_NAME not configured in environment. Skipping watch setup.");
    return {
      success: false,
      message: "GMAIL_PUBSUB_TOPIC_NAME environment variable not configured",
    };
  }

  const accessToken = await getValidAccessToken(userId);
  if (!accessToken) {
    return { success: false, message: "No access token available" };
  }

  try {
    const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/watch", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        topicName,
        labelIds: ["INBOX"],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[Gmail Watch] Watch registration failed: ${res.status} ${errText}`);
      return { success: false, message: `Watch registration failed: ${res.status}` };
    }

    const data = await res.json();
    const historyId = data.historyId;
    const expiration = data.expiration;

    // Update account with initial historyId from watch
    const account = await prisma.gmailAccount.findFirst({
      where: { userId },
    });

    if (account && historyId) {
      await prisma.gmailAccount.update({
        where: { id: account.id },
        data: { historyId: String(historyId) },
      });

      await prisma.syncState.upsert({
        where: { accountId: account.id },
        update: { lastHistoryId: String(historyId) },
        create: {
          accountId: account.id,
          userId,
          lastHistoryId: String(historyId),
          status: "idle",
        },
      });
    }

    console.log(`[Gmail Watch] Successfully registered watch for user ${userId}. Expiration: ${new Date(Number(expiration)).toISOString()}`);
    return {
      success: true,
      historyId,
      expiration,
    };
  } catch (error) {
    console.error("[Gmail Watch] Error setting up watch:", error);
    return { success: false, message: String(error) };
  }
}

/**
 * Stops Gmail push notifications for a user.
 */
export async function stopGmailWatch(userId: string): Promise<boolean> {
  const accessToken = await getValidAccessToken(userId);
  if (!accessToken) return false;

  try {
    const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/stop", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return res.ok;
  } catch (error) {
    console.error("[Gmail Watch] Error stopping watch:", error);
    return false;
  }
}
