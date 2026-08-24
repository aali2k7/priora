import { prisma } from "@/lib/prisma";
import { EmailThread, EmailMessage, PriorityLevel, CategoryTag } from "@/types/email";
import { MOCK_THREADS } from "@/lib/mock-data";

interface GmailHeader {
  name: string;
  value: string;
}

interface RawGmailMessage {
  id: string;
  threadId: string;
  snippet?: string;
  labelIds?: string[];
  payload?: {
    headers?: GmailHeader[];
  };
}

export async function getValidAccessToken(userId: string): Promise<string | null> {
  try {
    const account = await prisma.account.findFirst({
      where: {
        userId,
        providerId: "google",
      },
    });

    if (!account || !account.accessToken) {
      console.log(`[Gmail Service] No Google access token found for user ${userId}`);
      return null;
    }

    const now = Date.now();
    const expiresAt = account.accessTokenExpiresAt ? account.accessTokenExpiresAt.getTime() : null;
    const isExpired = expiresAt ? expiresAt < now + 60000 : false;

    // Token is still valid
    if (!isExpired) {
      return account.accessToken;
    }

    // Refresh token if expired and refreshToken is present
    if (account.refreshToken) {
      console.log(`[Gmail Service] Access token expired for user ${userId}. Refreshing token...`);
      const googleClientId = (process.env.GOOGLE_CLIENT_ID || "").trim();
      const googleClientSecret = (process.env.GOOGLE_CLIENT_SECRET || "").trim();

      const refreshRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: googleClientId,
          client_secret: googleClientSecret,
          refresh_token: account.refreshToken,
          grant_type: "refresh_token",
        }),
      });

      if (refreshRes.ok) {
        const tokenData = await refreshRes.json();
        const newAccessToken = tokenData.access_token;
        const newExpiresAt = new Date(Date.now() + (tokenData.expires_in || 3600) * 1000);

        // Persist updated token to PostgreSQL DB via Prisma
        await prisma.account.update({
          where: { id: account.id },
          data: {
            accessToken: newAccessToken,
            accessTokenExpiresAt: newExpiresAt,
          },
        });

        return newAccessToken;
      } else {
        const errText = await refreshRes.text();
        console.error(`[Gmail Service] Failed to refresh token (${refreshRes.status}): ${errText}`);
      }
    }

    return account.accessToken;
  } catch (error) {
    console.error("[Gmail Service] Error in getValidAccessToken:", error);
    return null;
  }
}

export async function fetchLiveGmailThreads(userId: string): Promise<{ threads: EmailThread[]; isLive: boolean }> {
  try {
    const accessToken = await getValidAccessToken(userId);

    if (!accessToken) {
      console.log("[Gmail Service] Falling back to demo data (No access token)");
      return { threads: MOCK_THREADS, isLive: false };
    }

    // 1. Fetch latest 20 messages from Gmail REST API
    const listRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=20", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!listRes.ok) {
      console.error(`[Gmail Service] Gmail API returned status ${listRes.status}`);
      return { threads: MOCK_THREADS, isLive: false };
    }

    const listData = await listRes.json();
    const messageList = listData.messages || [];

    if (messageList.length === 0) {
      return { threads: MOCK_THREADS, isLive: false };
    }

    // 2. Fetch full details for each message
    const messagePromises = messageList.map(async (msg: { id: string }) => {
      const msgRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (msgRes.ok) {
        return msgRes.json() as Promise<RawGmailMessage>;
      }
      return null;
    });

    const rawMessages = (await Promise.all(messagePromises)).filter(Boolean) as RawGmailMessage[];

    if (rawMessages.length === 0) {
      return { threads: MOCK_THREADS, isLive: false };
    }

    // 3. Group messages into threads
    const threadsMap = new Map<string, RawGmailMessage[]>();

    for (const msg of rawMessages) {
      const threadId = msg.threadId || msg.id;
      if (!threadsMap.has(threadId)) {
        threadsMap.set(threadId, []);
      }
      threadsMap.get(threadId)?.push(msg);
    }

    // 4. Transform raw Gmail messages into Priora EmailThread models
    const liveThreads: EmailThread[] = Array.from(threadsMap.entries()).map(([threadId, msgs]) => {
      const firstMsg = msgs[0];
      const headers = firstMsg.payload?.headers || [];

      const getHeader = (name: string) => {
        const h = headers.find((item) => item.name.toLowerCase() === name.toLowerCase());
        return h ? h.value : "";
      };

      const subject = getHeader("Subject") || "(No Subject)";
      const fromHeader = getHeader("From") || "Unknown Sender";
      const dateHeader = getHeader("Date") || new Date().toISOString();

      // Parse sender name & email
      let senderName = fromHeader;
      let senderEmail = fromHeader;
      const match = fromHeader.match(/^(.*?)\s*<([^>]+)>/);
      if (match) {
        senderName = match[1].replace(/^["']|["']$/g, "").trim() || match[2];
        senderEmail = match[2].trim();
      }

      const isUnread = msgs.some((m) => m.labelIds?.includes("UNREAD"));
      const snippet = firstMsg.snippet || "No preview snippet available.";

      // Determine priority and category heuristics
      let priority: PriorityLevel = "normal";
      if (isUnread && (subject.toLowerCase().includes("urgent") || subject.toLowerCase().includes("asap"))) {
        priority = "urgent";
      } else if (isUnread) {
        priority = "high";
      }

      let category: CategoryTag = "fyi";
      if (priority === "urgent") category = "action_required";
      else if (firstMsg.labelIds?.includes("STARRED")) category = "vip";

      const parsedMessages: EmailMessage[] = msgs.map((m) => {
        const mHeaders = m.payload?.headers || [];
        const getMHeader = (n: string) =>
          mHeaders.find((item) => item.name.toLowerCase() === n.toLowerCase())?.value || "";

        const mFrom = getMHeader("From") || senderName;
        let mName = mFrom;
        let mEmail = mFrom;
        const mMatch = mFrom.match(/^(.*?)\s*<([^>]+)>/);
        if (mMatch) {
          mName = mMatch[1].replace(/^["']|["']$/g, "").trim() || mMatch[2];
          mEmail = mMatch[2].trim();
        }

        return {
          id: m.id,
          threadId: threadId,
          sender: { name: mName, email: mEmail },
          recipients: [{ name: "Me", email: "user@gmail.com" }],
          subject: getMHeader("Subject") || subject,
          bodySnippet: m.snippet || "",
          bodyText: m.snippet || "",
          timestamp: getMHeader("Date") || dateHeader,
          isUnread: m.labelIds?.includes("UNREAD") || false,
        };
      });

      return {
        id: threadId,
        subject,
        participants: [{ name: senderName, email: senderEmail }],
        lastMessageTimestamp: dateHeader,
        snippet,
        isUnread,
        isArchived: false,
        isSnoozed: false,
        priority,
        category,
        messages: parsedMessages,
        unreadCount: parsedMessages.filter((m) => m.isUnread).length,
      };
    });

    return { threads: liveThreads, isLive: true };
  } catch (error) {
    console.error("[Gmail Service] Error fetching live Gmail threads:", error);
    return { threads: MOCK_THREADS, isLive: false };
  }
}
