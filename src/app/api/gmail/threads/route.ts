import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncUserGmailInbox } from "@/lib/gmail-sync";
import { EmailThread, PriorityLevel, CategoryTag } from "@/types/email";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json(
        { isSyncing: false, threads: [], message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Find user's connected Gmail account in Neon PostgreSQL
    const account = await prisma.gmailAccount.findFirst({
      where: { userId: session.user.id },
      include: { syncState: true },
    });

    if (!account) {
      // Trigger initial sync automatically
      syncUserGmailInbox(session.user.id).catch((err) =>
        console.error("[GET /api/gmail/threads] Background sync error:", err)
      );
      return NextResponse.json({
        isSyncing: true,
        threads: [],
        message: "Initial sync started",
      });
    }

    // Fetch threads from Neon PostgreSQL
    const dbThreads = await prisma.thread.findMany({
      where: { accountId: account.id },
      orderBy: { lastMessageAt: "desc" },
      take: 100,
      include: {
        emails: {
          orderBy: { internalDate: "asc" },
        },
      },
    });

    if (dbThreads.length === 0) {
      // Trigger sync if empty
      syncUserGmailInbox(session.user.id).catch((err) =>
        console.error("[GET /api/gmail/threads] Background sync error:", err)
      );
      return NextResponse.json({
        isSyncing: true,
        threads: [],
        message: "Syncing in progress",
      });
    }

    // Transform Neon PostgreSQL Prisma models to Priora EmailThread types
    const threads: EmailThread[] = dbThreads.map((t) => {
      const messages = t.emails.map((e) => ({
        id: e.id,
        threadId: t.gmailThreadId,
        sender: {
          name: e.fromName || e.fromEmail,
          email: e.fromEmail,
        },
        recipients: [
          {
            name: e.toName || e.toEmail || "Me",
            email: e.toEmail || account.email,
          },
        ],
        subject: e.subject || t.subject || "(No Subject)",
        bodySnippet: e.snippet || "",
        bodyText: e.bodyText || e.snippet || "",
        timestamp: e.internalDate ? new Date(e.internalDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recently",
        isUnread: e.isUnread,
      }));

      const firstEmail = t.emails[0];
      const senderName = firstEmail?.fromName || firstEmail?.fromEmail || "Unknown Sender";
      const senderEmail = firstEmail?.fromEmail || "";

      return {
        id: t.id,
        subject: t.subject || "(No Subject)",
        participants: [{ name: senderName, email: senderEmail }],
        lastMessageTimestamp: t.lastMessageAt ? formatDateAgo(new Date(t.lastMessageAt)) : "Recently",
        snippet: t.snippet || "",
        isUnread: t.isUnread,
        isArchived: t.isArchived,
        isSnoozed: t.isSnoozed,
        priority: (t.priority as PriorityLevel) || "normal",
        category: (t.category as CategoryTag) || "fyi",
        messages,
        unreadCount: messages.filter((m) => m.isUnread).length,
      };
    });

    const isSyncing = account.syncState?.status === "syncing";

    return NextResponse.json({
      isSyncing,
      threads,
      accountEmail: account.email,
      lastSyncedAt: account.lastSyncedAt,
    });
  } catch (error) {
    console.error("[GET /api/gmail/threads] Error fetching threads from PostgreSQL:", error);
    return NextResponse.json({
      isSyncing: false,
      threads: [],
      error: "Error reading database threads",
    });
  }
}

function formatDateAgo(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
