import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncUserGmailInbox, isUserSyncing, SYNC_COOLDOWN_MS } from "@/lib/gmail-sync";
import { setupGmailWatch } from "@/lib/gmail-watch";
import { EmailThread, PriorityLevel, CategoryTag } from "@/types/email";
import { getRetentionCutoffDate } from "@/lib/retention";

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

    // 1. Find user's connected Gmail account in Neon PostgreSQL
    const account = await prisma.gmailAccount.findFirst({
      where: { userId: session.user.id },
      include: { syncState: true },
    });

    const isMemorySyncing = isUserSyncing(session.user.id);
    const isDbSyncing =
      account?.syncState?.status === "syncing" &&
      account?.syncState?.updatedAt &&
      Date.now() - new Date(account.syncState.updatedAt).getTime() < 2 * 60 * 1000;

    // Auto-heal stale "syncing" state in database if older than 2 minutes
    if (account?.syncState?.status === "syncing" && !isMemorySyncing && !isDbSyncing) {
      prisma.syncState
        .update({
          where: { id: account.syncState.id },
          data: { status: "completed" },
        })
        .catch(() => {});
    }

    const isActivelySyncing = isMemorySyncing || isDbSyncing;
    const needsBackgroundSync =
      !account ||
      !account.lastSyncedAt ||
      Date.now() - new Date(account.lastSyncedAt).getTime() >= SYNC_COOLDOWN_MS;

    if (needsBackgroundSync && !isActivelySyncing) {
      syncUserGmailInbox(session.user.id, { force: false }).catch((err) =>
        console.error("[GET /api/gmail/threads] Background sync error:", err)
      );
    }

    if (!account) {
      return NextResponse.json({
        isSyncing: true,
        threads: [],
        message: "Initial sync started in background",
      });
    }

    // Auto-register real-time Gmail Push Watch if configured and not yet active
    if (!account.historyId && process.env.GMAIL_PUBSUB_TOPIC_NAME) {
      setupGmailWatch(session.user.id).catch((watchErr) => {
        console.warn("[GET /api/gmail/threads] Auto watch registration notice:", watchErr);
      });
    }

    // 2. Fetch rolling 15-day threads from Neon PostgreSQL cache with lightweight email projection
    const cutoffDate = getRetentionCutoffDate(15);
    const dbThreads = await prisma.thread.findMany({
      where: {
        accountId: account.id,
        OR: [
          { lastMessageAt: { gte: cutoffDate } },
          { lastMessageAt: null },
        ],
      },
      orderBy: { lastMessageAt: "desc" },
      include: {
        emails: {
          select: {
            id: true,
            fromName: true,
            fromEmail: true,
            toName: true,
            toEmail: true,
            subject: true,
            snippet: true,
            internalDate: true,
            isUnread: true,
          },
          orderBy: { internalDate: "asc" },
        },
      },
    });

    // 3. Transform Neon PostgreSQL Prisma models to Priora EmailThread types
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
        bodyText: e.snippet || "",
        timestamp: e.internalDate
          ? new Date(e.internalDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : "Recently",
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
        aiSummary: t.aiSummary || undefined,
        executiveBrief: t.executiveBrief || undefined,
        urgencyScore: t.urgencyScore ?? undefined,
        importanceScore: t.importanceScore ?? undefined,
        actionRequired: t.actionRequired ?? undefined,
        analyzedAt: t.analyzedAt ? t.analyzedAt.toISOString() : undefined,
        messages,
        unreadCount: messages.filter((m) => m.isUnread).length,
      };
    });

    const isSyncing = isActivelySyncing || isUserSyncing(session.user.id);

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
