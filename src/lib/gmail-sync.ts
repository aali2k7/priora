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

export interface SyncResult {
  success: boolean;
  totalSynced: number;
  message?: string;
  cached?: boolean;
}

// In-memory mutex to ensure only one sync job runs per user at any given time
const activeSyncMap = new Map<string, Promise<SyncResult>>();
export const SYNC_COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes

export function isUserSyncing(userId: string): boolean {
  return activeSyncMap.has(userId);
}

/**
 * High-performance concurrent Gmail inbox synchronization engine.
 * Respects a 10-minute cooldown unless force is specified.
 * Deduplicates in-flight requests and avoids duplicate DB writes.
 */
export async function syncUserGmailInbox(
  userId: string,
  options?: { force?: boolean }
): Promise<SyncResult> {
  const force = !!options?.force;

  // 1. If a sync is already running for this user, join the existing in-flight promise
  const existingSync = activeSyncMap.get(userId);
  if (existingSync) {
    console.log(`[Gmail Sync] Joining already in-flight sync for user ${userId}`);
    return existingSync;
  }

  const syncPromise = (async (): Promise<SyncResult> => {
    try {
      // 2. Check 10-minute cooldown if not forced
      if (!force) {
        const existingAccount = await prisma.gmailAccount.findFirst({
          where: { userId },
          include: { syncState: true },
        });

        if (
          existingAccount &&
          existingAccount.lastSyncedAt &&
          existingAccount.syncState?.status === "completed"
        ) {
          const timeSinceSync = Date.now() - new Date(existingAccount.lastSyncedAt).getTime();
          if (timeSinceSync < SYNC_COOLDOWN_MS) {
            const minutesLeft = Math.ceil((SYNC_COOLDOWN_MS - timeSinceSync) / 60000);
            console.log(
              `[Gmail Sync] Cooldown active for user ${userId}. Last synced ${Math.round(
                timeSinceSync / 1000
              )}s ago. Next automatic sync in ~${minutesLeft}m.`
            );
            return {
              success: true,
              totalSynced: 0,
              message: `Sync cooldown active (${minutesLeft}m remaining)`,
              cached: true,
            };
          }
        }
      }

      const accessToken = await getValidAccessToken(userId);
      if (!accessToken) {
        console.log(`[Gmail Sync] No access token available for user ${userId}`);
        return { success: false, totalSynced: 0, message: "No access token" };
      }

      // 3. Fetch user record from Prisma
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!dbUser) {
        console.log(`[Gmail Sync] User ${userId} not found in PostgreSQL DB`);
        return { success: false, totalSynced: 0, message: "User not found" };
      }

      const userEmail = dbUser.email || "user@gmail.com";

      // 4. Upsert GmailAccount in Neon PostgreSQL
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

      // 5. Upsert SyncState -> status: "syncing"
      const syncState = await prisma.syncState.upsert({
        where: { accountId: gmailAccount.id },
        update: { status: "syncing", errorMessage: null },
        create: {
          accountId: gmailAccount.id,
          userId: dbUser.id,
          status: "syncing",
        },
      });

      console.log(
        `[Gmail Sync] Starting high-speed sync for account ${gmailAccount.email} (force=${force})...`
      );

    // 4. Fetch all threads within the rolling 15-day window using pagination
    const fifteenDaysAgoSeconds = Math.floor((Date.now() - 15 * 24 * 60 * 60 * 1000) / 1000);
    const gmailQuery = `after:${fifteenDaysAgoSeconds}`;
    const allThreadItems: { id: string }[] = [];
    let pageToken: string | undefined = undefined;
    let lastHistoryId: string | null = null;
    let pageCount = 0;
    const MAX_PAGES = 5;

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

    console.log(`[Gmail Sync] Discovered ${allThreadItems.length} threads in 15-day window.`);

    if (allThreadItems.length === 0) {
      await prisma.syncState.update({
        where: { id: syncState.id },
        data: { status: "completed", lastSyncedAt: new Date(), totalThreadsSynced: 0 },
      });
      return { success: true, totalSynced: 0, message: "No threads found" };
    }

    // Pre-load existing labels for this account into memory cache to prevent redundant queries
    const existingLabels = await prisma.label.findMany({
      where: { accountId: gmailAccount.id },
      select: { id: true, gmailLabelId: true },
    });
    const labelCache = new Map<string, string>(
      existingLabels.map((l) => [l.gmailLabelId, l.id])
    );

    // 5. Process threads in concurrent batches (Concurrency pool of 8)
    const BATCH_SIZE = 8;
    let threadsSyncedCount = 0;

    for (let i = 0; i < allThreadItems.length; i += BATCH_SIZE) {
      const batchItems = allThreadItems.slice(i, i + BATCH_SIZE);

      // Concurrent fetch from Gmail API
      const fetchResults = await Promise.allSettled(
        batchItems.map(async (item) => {
          const res = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/threads/${item.id}?format=full`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          if (!res.ok) throw new Error(`Thread detail failed: ${res.status}`);
          return (await res.json()) as RawGmailThread;
        })
      );

      const rawThreads: RawGmailThread[] = [];
      for (const result of fetchResults) {
        if (result.status === "fulfilled" && result.value && result.value.messages?.length) {
          rawThreads.push(result.value);
        }
      }

      if (rawThreads.length === 0) continue;

      // 5a. Identify and upsert all new unique labels across this batch in one step
      const batchLabelIds = new Set<string>();
      for (const t of rawThreads) {
        for (const m of t.messages || []) {
          for (const lid of m.labelIds || []) {
            batchLabelIds.add(lid);
          }
        }
      }

      for (const labelId of batchLabelIds) {
        if (!labelCache.has(labelId)) {
          const dbLabel = await prisma.label.upsert({
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
          labelCache.set(labelId, dbLabel.id);
        }
      }

      // 5b. Persist each thread and its messages in this batch concurrently
      await Promise.all(
        rawThreads.map(async (rawThread) => {
          try {
            const messages = rawThread.messages || [];
            if (messages.length === 0) return;

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

            // Upsert Thread
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

            // Upsert Messages in parallel
            await Promise.all(
              messages.map(async (msg) => {
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
              })
            );

            // Link labels to Thread
            const threadLabels = new Set<string>();
            for (const m of messages) {
              for (const lid of m.labelIds || []) {
                const labelDbId = labelCache.get(lid);
                if (labelDbId) threadLabels.add(labelDbId);
              }
            }

            await Promise.all(
              Array.from(threadLabels).map((labelId) =>
                prisma.labelOnThread.upsert({
                  where: {
                    threadId_labelId: {
                      threadId: dbThread.id,
                      labelId,
                    },
                  },
                  update: {},
                  create: {
                    threadId: dbThread.id,
                    labelId,
                  },
                })
              )
            );

            threadsSyncedCount++;
          } catch (threadErr) {
            console.error(`[Gmail Sync] Error processing thread ${rawThread.id}:`, threadErr);
          }
        })
      );

      // Progressive status update so client gets incremental data
      await prisma.syncState.update({
        where: { id: syncState.id },
        data: { totalThreadsSynced: threadsSyncedCount },
      });
    }

    // 6. Update SyncState -> status: "completed"
    await prisma.syncState.update({
      where: { id: syncState.id },
      data: {
        status: "completed",
        lastSyncedAt: new Date(),
        totalThreadsSynced: threadsSyncedCount,
        lastHistoryId: lastHistoryId || null,
      },
    });

    // 7. Run local rolling 15-day retention cleanup
    cleanupExpiredLocalData(gmailAccount.id, 15).catch((retErr) => {
      console.error("[Gmail Sync] Retention cleanup warning:", retErr);
    });

    console.log(`[Gmail Sync] Speed-sync complete: ${threadsSyncedCount} threads synced for user ${userId}.`);

    // 8. Trigger background AI pre-analysis for top unanalyzed threads
    if (process.env.GEMINI_API_KEY) {
      AIService.analyzeUnanalyzedThreadsForAccount(gmailAccount.id, 10).catch((aiErr) => {
        console.error(`[Gmail Sync -> Gemini Analysis] Background analysis warning:`, aiErr);
      });
    }

    return { success: true, totalSynced: threadsSyncedCount };
  } catch (error) {
    console.error("[Gmail Sync] Critical error in syncUserGmailInbox:", error);
    return { success: false, totalSynced: 0, message: String(error) };
  }
  })();

  activeSyncMap.set(userId, syncPromise);
  syncPromise.finally(() => {
    activeSyncMap.delete(userId);
  });

  return syncPromise;
}
