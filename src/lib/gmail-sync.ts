import { prisma } from "@/lib/prisma";
import { getValidAccessToken } from "@/lib/gmail-service";
import { AIService } from "@/lib/ai-service";
import { cleanupExpiredLocalData } from "@/lib/retention";

interface GmailHeader {
  name: string;
  value: string;
}

interface GmailMessagePart {
  mimeType: string;
  body?: {
    data?: string;
    size?: number;
  };
  parts?: GmailMessagePart[];
  filename?: string;
}

interface RawGmailMessagePayload {
  headers?: GmailHeader[];
  mimeType?: string;
  body?: {
    data?: string;
    size?: number;
  };
  parts?: GmailMessagePart[];
}

interface RawGmailMessage {
  id: string;
  threadId: string;
  snippet?: string;
  labelIds?: string[];
  internalDate?: string;
  payload?: RawGmailMessagePayload;
}

interface RawGmailThread {
  id: string;
  historyId?: string;
  messages?: RawGmailMessage[];
}

// Decode base64url encoded body text
function decodeBase64Url(input: string): string {
  try {
    const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
    return Buffer.from(base64, "base64").toString("utf-8");
  } catch {
    return "";
  }
}

// Recursively extract plain text body from message payload
function extractPlainTextBody(payload?: RawGmailMessagePayload): string {
  if (!payload) return "";

  if (payload.mimeType === "text/plain" && payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }

  if (payload.parts && payload.parts.length > 0) {
    for (const part of payload.parts) {
      if (part.mimeType === "text/plain" && part.body?.data) {
        return decodeBase64Url(part.body.data);
      }
      if (part.parts && part.parts.length > 0) {
        const nested = extractPlainTextBody(part as RawGmailMessagePayload);
        if (nested) return nested;
      }
    }
  }

  return "";
}

// Parse email address string like "John Doe <john@example.com>"
function parseEmailAddress(input: string): { name: string; email: string } {
  if (!input) return { name: "", email: "" };
  const match = input.match(/^(.*?)\s*<([^>]+)>/);
  if (match) {
    const name = match[1].replace(/^["']|["']$/g, "").trim() || match[2];
    return { name, email: match[2].trim() };
  }
  return { name: input.trim(), email: input.trim() };
}

export async function syncUserGmailInbox(userId: string): Promise<{
  success: boolean;
  totalSynced: number;
  message?: string;
}> {
  try {
    const accessToken = await getValidAccessToken(userId);
    if (!accessToken) {
      console.log(`[Gmail Sync] No access token available for user ${userId}`);
      return { success: false, totalSynced: 0, message: "No access token" };
    }

    // 1. Fetch user record from Prisma
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!dbUser) {
      console.log(`[Gmail Sync] User ${userId} not found in PostgreSQL DB`);
      return { success: false, totalSynced: 0, message: "User not found" };
    }

    const userEmail = dbUser.email || "user@gmail.com";

    // 2. Upsert GmailAccount in Neon PostgreSQL
    const gmailAccount = await prisma.gmailAccount.upsert({
      where: {
        userId_email: {
          userId: dbUser.id,
          email: userEmail,
        },
      },
      update: { lastSyncedAt: new Date() },
      create: {
        userId: dbUser.id,
        email: userEmail,
        lastSyncedAt: new Date(),
      },
    });

    // 3. Upsert SyncState -> status: "syncing"
    const syncState = await prisma.syncState.upsert({
      where: { accountId: gmailAccount.id },
      update: { status: "syncing", errorMessage: null },
      create: {
        accountId: gmailAccount.id,
        userId: dbUser.id,
        status: "syncing",
      },
    });

    console.log(`[Gmail Sync] Starting sync for account ${gmailAccount.email} (SyncState: ${syncState.id})...`);

    // 4. Fetch all threads within the rolling 15-day window using pagination (nextPageToken)
    const fifteenDaysAgoSeconds = Math.floor((Date.now() - 15 * 24 * 60 * 60 * 1000) / 1000);
    const gmailQuery = `after:${fifteenDaysAgoSeconds}`;
    const allThreadItems: { id: string }[] = [];
    let pageToken: string | undefined = undefined;
    let lastHistoryId: string | null = null;
    let pageCount = 0;
    const MAX_PAGES = 10; // Safety boundary per sync batch

    do {
      pageCount++;
      const queryParams = new URLSearchParams({
        maxResults: "100",
        q: gmailQuery,
      });
      if (pageToken) {
        queryParams.set("pageToken", pageToken);
      }
      const fetchUrl = `https://gmail.googleapis.com/gmail/v1/users/me/threads?${queryParams.toString()}`;

      const threadsListRes = await fetch(fetchUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!threadsListRes.ok) {
        const errText = await threadsListRes.text();
        console.error(`[Gmail Sync] Gmail API thread list error on page ${pageCount}: ${threadsListRes.status} ${errText}`);
        if (pageCount === 1) {
          await prisma.syncState.update({
            where: { id: syncState.id },
            data: { status: "error", errorMessage: `Gmail API error ${threadsListRes.status}` },
          });
          return { success: false, totalSynced: 0, message: `Gmail API error ${threadsListRes.status}` };
        }
        break;
      }

      const threadsListData = await threadsListRes.json();
      if (threadsListData.historyId) {
        lastHistoryId = threadsListData.historyId;
      }

      const items = (threadsListData.threads || []) as { id: string }[];
      allThreadItems.push(...items);
      pageToken = threadsListData.nextPageToken;
    } while (pageToken && pageCount < MAX_PAGES);

    console.log(`[Gmail Sync] Retrieved ${allThreadItems.length} threads in 15-day window across ${pageCount} page(s).`);

    if (allThreadItems.length === 0) {
      await prisma.syncState.update({
        where: { id: syncState.id },
        data: { status: "completed", lastSyncedAt: new Date(), totalThreadsSynced: 0 },
      });
      return { success: true, totalSynced: 0, message: "No threads found" };
    }

    // 5. Process each thread and its messages
    let threadsSyncedCount = 0;

    for (const item of allThreadItems) {
      try {
        const threadDetailRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/threads/${item.id}?format=full`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        if (!threadDetailRes.ok) continue;

        const rawThread = (await threadDetailRes.json()) as RawGmailThread;
        const messages = rawThread.messages || [];
        if (messages.length === 0) continue;

        const firstMsg = messages[0];
        const lastMsg = messages[messages.length - 1];

        const getHeader = (msgs: RawGmailMessage, name: string) => {
          const headers = msgs.payload?.headers || [];
          return headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || "";
        };

        const subject = getHeader(firstMsg, "Subject") || "(No Subject)";
        const firstFrom = getHeader(firstMsg, "From");
        const snippet = firstMsg.snippet || "";

        const isUnread = messages.some((m) => m.labelIds?.includes("UNREAD"));
        const isArchived = !messages.some((m) => m.labelIds?.includes("INBOX"));
        const isSnoozed = messages.some((m) => m.labelIds?.includes("SNOOZED"));

        const internalTime = lastMsg.internalDate ? parseInt(lastMsg.internalDate, 10) : Date.now();
        const lastMessageAt = new Date(internalTime);
        const firstInternalTime = firstMsg.internalDate ? parseInt(firstMsg.internalDate, 10) : Date.now();

        // 6. Upsert Thread in Prisma (preserving Gemini analysis if already analyzed)
        const dbThread = await prisma.thread.upsert({
          where: {
            accountId_gmailThreadId: {
              accountId: gmailAccount.id,
              gmailThreadId: rawThread.id,
            },
          },
          update: {
            subject,
            snippet,
            isUnread,
            isArchived,
            isSnoozed,
            lastMessageAt,
            internalDate: new Date(firstInternalTime),
          },
          create: {
            accountId: gmailAccount.id,
            gmailThreadId: rawThread.id,
            subject,
            snippet,
            isUnread,
            isArchived,
            isSnoozed,
            lastMessageAt,
            internalDate: new Date(firstInternalTime),
            priority: "normal",
            category: "fyi",
          },
        });

        // 7. Upsert Labels and Emails for this thread
        for (const msg of messages) {
          const msgHeaders = msg.payload?.headers || [];
          const getMHeader = (n: string) =>
            msgHeaders.find((h) => h.name.toLowerCase() === n.toLowerCase())?.value || "";

          const mFrom = getMHeader("From") || firstFrom;
          const { name: mFromName, email: mFromEmail } = parseEmailAddress(mFrom);
          const mTo = getMHeader("To");
          const { name: mToName, email: mToEmail } = parseEmailAddress(mTo);
          const mSubject = getMHeader("Subject") || subject;
          const mSnippet = msg.snippet || "";
          const plainTextBody = extractPlainTextBody(msg.payload) || mSnippet;

          const mInternalTime = msg.internalDate ? parseInt(msg.internalDate, 10) : Date.now();
          const mDate = new Date(mInternalTime);

          // Upsert Email in Prisma
          await prisma.email.upsert({
            where: {
              accountId_gmailId: {
                accountId: gmailAccount.id,
                gmailId: msg.id,
              },
            },
            update: {
              subject: mSubject,
              fromEmail: mFromEmail,
              fromName: mFromName,
              toEmail: mToEmail,
              toName: mToName,
              snippet: mSnippet,
              bodyText: plainTextBody,
              internalDate: mDate,
              isUnread: msg.labelIds?.includes("UNREAD") || false,
            },
            create: {
              accountId: gmailAccount.id,
              gmailId: msg.id,
              gmailThreadId: rawThread.id,
              threadId: dbThread.id,
              subject: mSubject,
              fromEmail: mFromEmail,
              fromName: mFromName,
              toEmail: mToEmail,
              toName: mToName,
              snippet: mSnippet,
              bodyText: plainTextBody,
              internalDate: mDate,
              isUnread: msg.labelIds?.includes("UNREAD") || false,
            },
          });

          // Upsert Labels
          if (msg.labelIds && msg.labelIds.length > 0) {
            for (const labelId of msg.labelIds) {
              const label = await prisma.label.upsert({
                where: {
                  accountId_gmailLabelId: {
                    accountId: gmailAccount.id,
                    gmailLabelId: labelId,
                  },
                },
                update: {},
                create: {
                  accountId: gmailAccount.id,
                  gmailLabelId: labelId,
                  name: labelId,
                  type: labelId.startsWith("CATEGORY_") ? "system" : "user",
                },
              });

              // Link Label to Thread via LabelOnThread
              await prisma.labelOnThread.upsert({
                where: {
                  threadId_labelId: {
                    threadId: dbThread.id,
                    labelId: label.id,
                  },
                },
                update: {},
                create: {
                  threadId: dbThread.id,
                  labelId: label.id,
                },
              });
            }
          }
        }

        threadsSyncedCount++;
      } catch (threadErr) {
        console.error(`[Gmail Sync] Error processing thread ${item.id}:`, threadErr);
      }
    }

    // 8. Update SyncState -> status: "completed"
    await prisma.syncState.update({
      where: { id: syncState.id },
      data: {
        status: "completed",
        lastSyncedAt: new Date(),
        totalThreadsSynced: threadsSyncedCount,
        lastHistoryId: lastHistoryId || null,
      },
    });

    // 9. Run local rolling 15-day retention cleanup
    await cleanupExpiredLocalData(gmailAccount.id, 15).catch((retErr) => {
      console.error("[Gmail Sync] Retention cleanup warning:", retErr);
    });

    console.log(`[Gmail Sync] Successfully synced ${threadsSyncedCount} threads for user ${userId}.`);

    // 10. Trigger background analysis for unanalyzed threads without blocking sync
    if (process.env.GEMINI_API_KEY) {
      AIService.analyzeUnanalyzedThreadsForAccount(gmailAccount.id, 5).catch((aiErr) => {
        console.error(`[Gmail Sync -> Gemini Analysis] Background analysis warning:`, aiErr);
      });
    }

    return { success: true, totalSynced: threadsSyncedCount };
  } catch (error) {
    console.error("[Gmail Sync] Critical error in syncUserGmailInbox:", error);
    return { success: false, totalSynced: 0, message: String(error) };
  }
}
