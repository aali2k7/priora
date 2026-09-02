import { prisma } from "@/lib/prisma";

export interface RelatedThreadSummary {
  id: string;
  subject: string;
  lastMessageAt: string;
  snippet: string;
  summary?: string | null;
}

export interface RelationshipContext {
  counterpartyEmail: string;
  counterpartyDomain: string;
  totalHistoricalThreads: number;
  firstInteractionDate?: string;
  lastInteractionDate?: string;
  cadenceNote: string;
  historicalContextSummary: string;
  relatedThreads: RelatedThreadSummary[];
}

export class RelationshipService {
  /**
   * Generates relationship and cross-thread context for an active thread.
   */
  static async getThreadRelationshipContext(
    userId: string,
    threadId: string
  ): Promise<RelationshipContext | null> {
    const activeThread = await prisma.thread.findFirst({
      where: {
        OR: [{ id: threadId }, { gmailThreadId: threadId }],
        account: { userId },
      },
      include: {
        emails: {
          orderBy: { internalDate: "desc" },
          take: 1,
        },
        account: true,
      },
    });

    if (!activeThread) return null;

    const userEmail = activeThread.account.email.toLowerCase();
    const latestEmail = activeThread.emails[0];
    const rawSender = latestEmail?.fromEmail || "";
    const counterpartyEmail = (
      rawSender.toLowerCase() === userEmail
        ? latestEmail?.toEmail || ""
        : rawSender
    ).toLowerCase();

    if (!counterpartyEmail || !counterpartyEmail.includes("@")) {
      return null;
    }

    const counterpartyDomain = counterpartyEmail.split("@")[1];

    // Query past threads involving this counterparty across the user's account
    const historicalThreads = await prisma.thread.findMany({
      where: {
        account: { userId },
        id: { not: activeThread.id },
        emails: {
          some: {
            OR: [
              { fromEmail: { contains: counterpartyEmail, mode: "insensitive" } },
              { toEmail: { contains: counterpartyEmail, mode: "insensitive" } },
            ],
          },
        },
      },
      orderBy: { lastMessageAt: "desc" },
      take: 5,
      select: {
        id: true,
        subject: true,
        snippet: true,
        aiSummary: true,
        lastMessageAt: true,
      },
    });

    const totalCount = historicalThreads.length + 1;
    const lastThread = historicalThreads[0];
    const oldestThread = historicalThreads[historicalThreads.length - 1];

    let cadenceNote = "First conversation with this contact.";
    if (historicalThreads.length > 0 && lastThread.lastMessageAt) {
      const daysSinceLast = Math.round(
        (Date.now() - new Date(lastThread.lastMessageAt).getTime()) /
          (1000 * 60 * 60 * 24)
      );

      if (daysSinceLast === 0) {
        cadenceNote = "Active exchange today.";
      } else if (daysSinceLast === 1) {
        cadenceNote = "Last interaction yesterday.";
      } else if (daysSinceLast < 30) {
        cadenceNote = `Frequent contact (last active ${daysSinceLast} days ago).`;
      } else {
        cadenceNote = `Periodic contact (last active ${Math.round(daysSinceLast / 30)} months ago).`;
      }
    }

    // Synthesize historical relationship summary
    let historicalContextSummary = `Established communication history with ${counterpartyDomain}.`;
    if (historicalThreads.length > 0) {
      const recentTopics = historicalThreads
        .map((t) => t.subject?.replace(/^Re:\s*/i, ""))
        .filter(Boolean)
        .slice(0, 2)
        .join(" and ");
      historicalContextSummary = `Previous discussions centered around "${recentTopics}".`;
    }

    return {
      counterpartyEmail,
      counterpartyDomain,
      totalHistoricalThreads: totalCount,
      firstInteractionDate: oldestThread?.lastMessageAt
        ? oldestThread.lastMessageAt.toISOString()
        : undefined,
      lastInteractionDate: lastThread?.lastMessageAt
        ? lastThread.lastMessageAt.toISOString()
        : undefined,
      cadenceNote,
      historicalContextSummary,
      relatedThreads: historicalThreads.map((t) => ({
        id: t.id,
        subject: t.subject || "(No Subject)",
        lastMessageAt: t.lastMessageAt
          ? t.lastMessageAt.toISOString()
          : new Date().toISOString(),
        snippet: t.snippet || "",
        summary: t.aiSummary,
      })),
    };
  }
}
