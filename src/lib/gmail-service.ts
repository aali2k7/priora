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

export interface SendEmailOptions {
  from: string;
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  bodyText: string;
  inReplyTo?: string;
  references?: string;
}

/**
 * Formats a valid RFC 2822 email message with Base64 content transfer encoding
 * and returns it encoded as RFC 4648 Base64URL (no padding) ready for Gmail API.
 */
export function buildRFC2822Message(options: SendEmailOptions): string {
  const toList = Array.isArray(options.to) ? options.to : [options.to];
  const lines: string[] = [];

  lines.push(`From: ${options.from}`);
  lines.push(`To: ${toList.filter(Boolean).join(", ")}`);

  if (options.cc) {
    const ccList = Array.isArray(options.cc) ? options.cc : [options.cc];
    const validCc = ccList.filter(Boolean);
    if (validCc.length > 0) {
      lines.push(`Cc: ${validCc.join(", ")}`);
    }
  }

  if (options.bcc) {
    const bccList = Array.isArray(options.bcc) ? options.bcc : [options.bcc];
    const validBcc = bccList.filter(Boolean);
    if (validBcc.length > 0) {
      lines.push(`Bcc: ${validBcc.join(", ")}`);
    }
  }

  // Encode UTF-8 subject per RFC 2047 MIME
  const encodedSubject = `=?UTF-8?B?${Buffer.from(options.subject || "(No Subject)", "utf-8").toString("base64")}?=`;
  lines.push(`Subject: ${encodedSubject}`);

  if (options.inReplyTo) {
    lines.push(`In-Reply-To: ${options.inReplyTo}`);
  }
  if (options.references) {
    lines.push(`References: ${options.references}`);
  }

  lines.push("MIME-Version: 1.0");
  lines.push('Content-Type: text/plain; charset="UTF-8"');
  lines.push("Content-Transfer-Encoding: base64");
  lines.push("");
  lines.push(Buffer.from(options.bodyText || "", "utf-8").toString("base64"));

  const raw = lines.join("\r\n");
  return Buffer.from(raw, "utf-8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export interface SendGmailMessageParams {
  userId: string;
  to: string | string[];
  subject: string;
  bodyText: string;
  threadId?: string; // Database thread ID or Gmail thread ID
  inReplyTo?: string;
  references?: string;
  cc?: string | string[];
  bcc?: string | string[];
}

/**
 * Dispatches an email message using the user's connected Gmail OAuth token,
 * and updates the local PostgreSQL database cache via Prisma.
 */
export async function sendGmailMessage(params: SendGmailMessageParams): Promise<{
  success: boolean;
  messageId?: string;
  threadId?: string;
  error?: string;
}> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: params.userId },
      include: {
        gmailAccounts: true,
      },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    const gmailAccount = user.gmailAccounts[0];
    const senderEmail = gmailAccount?.email || user.email;

    if (!senderEmail) {
      return { success: false, error: "No sender email associated with account" };
    }

    const senderName = user.name || "Priora User";
    const fromHeader = `${senderName} <${senderEmail}>`;

    let targetDbThread = null;
    let gmailThreadId: string | undefined = undefined;

    if (params.threadId) {
      targetDbThread = await prisma.thread.findFirst({
        where: {
          OR: [{ id: params.threadId }, { gmailThreadId: params.threadId }],
          ...(gmailAccount ? { accountId: gmailAccount.id } : { account: { userId: user.id } }),
        },
        include: {
          emails: { orderBy: { internalDate: "asc" } },
        },
      });

      if (targetDbThread) {
        gmailThreadId = targetDbThread.gmailThreadId;
      }
    }

    // Retrieve valid Google OAuth Access Token
    const accessToken = await getValidAccessToken(user.id);

    if (!accessToken) {
      return {
        success: false,
        error: "No Google OAuth access token found. Please sign in with Google to enable sending emails.",
      };
    }

    const base64UrlMessage = buildRFC2822Message({
      from: fromHeader,
      to: params.to,
      cc: params.cc,
      bcc: params.bcc,
      subject: params.subject,
      bodyText: params.bodyText,
      inReplyTo: params.inReplyTo,
      references: params.references,
    });

    const sendPayload: { raw: string; threadId?: string } = {
      raw: base64UrlMessage,
    };

    if (gmailThreadId) {
      sendPayload.threadId = gmailThreadId;
    }

    console.log(`[Gmail Service] Sending email via Gmail API for ${senderEmail} (thread: ${gmailThreadId || "new"})...`);

    const sendRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(sendPayload),
    });

    if (!sendRes.ok) {
      const errText = await sendRes.text();
      console.error(`[Gmail Service] Gmail API send failed (${sendRes.status}):`, errText);

      if (sendRes.status === 403) {
        return {
          success: false,
          error:
            "Permission denied by Google. Please sign out and sign in again to grant the required email sending permission (gmail.send).",
        };
      }

      return {
        success: false,
        error: `Gmail API error (${sendRes.status}): ${errText}`,
      };
    }

    const result = await sendRes.json();
    const sentGmailId = result.id as string;
    const sentThreadId = (result.threadId || gmailThreadId || sentGmailId) as string;

    console.log(`[Gmail Service] Email dispatched successfully. Message ID: ${sentGmailId}, Thread ID: ${sentThreadId}`);

    // Persist sent email to PostgreSQL via Prisma
    if (gmailAccount) {
      try {
        let dbThread = targetDbThread;

        if (!dbThread) {
          dbThread = await prisma.thread.upsert({
            where: {
              accountId_gmailThreadId: {
                accountId: gmailAccount.id,
                gmailThreadId: sentThreadId,
              },
            },
            update: {
              subject: params.subject,
              snippet: params.bodyText.slice(0, 160),
              lastMessageAt: new Date(),
            },
            create: {
              accountId: gmailAccount.id,
              gmailThreadId: sentThreadId,
              subject: params.subject,
              snippet: params.bodyText.slice(0, 160),
              lastMessageAt: new Date(),
              internalDate: new Date(),
              priority: "normal",
              category: "fyi",
            },
            include: {
              emails: { orderBy: { internalDate: "asc" } },
            },
          });
        } else {
          await prisma.thread.update({
            where: { id: dbThread.id },
            data: {
              lastMessageAt: new Date(),
              snippet: params.bodyText.slice(0, 160),
            },
          });
        }

        const toStr = Array.isArray(params.to) ? params.to.join(", ") : params.to;

        await prisma.email.upsert({
          where: {
            accountId_gmailId: {
              accountId: gmailAccount.id,
              gmailId: sentGmailId,
            },
          },
          update: {
            subject: params.subject,
            snippet: params.bodyText.slice(0, 160),
            bodyText: params.bodyText,
            internalDate: new Date(),
          },
          create: {
            accountId: gmailAccount.id,
            gmailId: sentGmailId,
            gmailThreadId: sentThreadId,
            threadId: dbThread.id,
            subject: params.subject,
            fromEmail: senderEmail,
            fromName: senderName,
            toEmail: toStr,
            toName: toStr,
            snippet: params.bodyText.slice(0, 160),
            bodyText: params.bodyText,
            internalDate: new Date(),
            isUnread: false,
          },
        });
      } catch (dbErr) {
        console.warn("[Gmail Service] Failed to persist sent email to PostgreSQL:", dbErr);
      }
    }

    return {
      success: true,
      messageId: sentGmailId,
      threadId: sentThreadId,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal error sending email";
    console.error("[Gmail Service] Unexpected error in sendGmailMessage:", error);
    return { success: false, error: msg };
  }
}

/**
 * Sends a reply to an existing email thread using the user's Gmail account.
 */
export async function sendGmailReply(
  userId: string,
  threadId: string,
  replyText: string,
  archiveAfterSend: boolean = false
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const thread = await prisma.thread.findFirst({
      where: {
        OR: [{ id: threadId }, { gmailThreadId: threadId }],
        account: { userId },
      },
      include: {
        emails: { orderBy: { internalDate: "asc" } },
        account: true,
      },
    });

    if (!thread) {
      return { success: false, error: "Thread not found" };
    }

    // Determine recipient: find the most recent incoming email's fromEmail
    const incomingEmails = thread.emails.filter((e) => e.fromEmail !== thread.account.email);
    const lastIncoming = incomingEmails[incomingEmails.length - 1] || thread.emails[0];
    const recipientEmail = lastIncoming?.fromEmail || thread.account.email;

    const subject = thread.subject?.startsWith("Re:") ? thread.subject : `Re: ${thread.subject || ""}`;

    const sendResult = await sendGmailMessage({
      userId,
      threadId: thread.id,
      to: recipientEmail,
      subject,
      bodyText: replyText,
    });

    if (!sendResult.success) {
      return sendResult;
    }

    if (archiveAfterSend) {
      await prisma.thread.update({
        where: { id: thread.id },
        data: { isArchived: true },
      });

      modifyGmailThreadLabels(userId, thread.gmailThreadId, [], ["INBOX"]).catch((e) =>
        console.warn("[Gmail Service] Archive thread label update warning:", e)
      );
    }

    return {
      success: true,
      messageId: sendResult.messageId,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to send thread reply";
    console.error("[Gmail Service] Error in sendGmailReply:", err);
    return { success: false, error: msg };
  }
}

/**
 * Modifies labels for a thread in live Gmail (e.g. archive by removing INBOX, mark as read by removing UNREAD).
 */
export async function modifyGmailThreadLabels(
  userId: string,
  gmailThreadId: string,
  addLabelIds: string[] = [],
  removeLabelIds: string[] = []
): Promise<boolean> {
  try {
    const accessToken = await getValidAccessToken(userId);
    if (!accessToken) return false;

    const res = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/threads/${gmailThreadId}/modify`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          addLabelIds,
          removeLabelIds,
        }),
      }
    );

    return res.ok;
  } catch (err) {
    console.warn("[Gmail Service] Failed to modify Gmail thread labels:", err);
    return false;
  }
}

