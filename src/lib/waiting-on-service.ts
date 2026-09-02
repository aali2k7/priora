import { prisma } from "@/lib/prisma";

export interface WaitingOnItem {
  id: string;
  threadId: string;
  topic: string;
  deliverable: string;
  ownerName: string;
  ownerEmail?: string;
  status: "PENDING" | "OVERDUE" | "UPCOMING";
  dueDateText?: string;
  daysWaiting: number;
}

export class WaitingOnService {
  /**
   * Aggregates external bottlenecks and pending counterparty deliverables across all active threads.
   */
  static async getWaitingOnDependencies(userId: string): Promise<WaitingOnItem[]> {
    const activeThreads = await prisma.thread.findMany({
      where: {
        account: { userId },
        isArchived: false,
        OR: [
          { keyDecisionRequired: { not: null } },
          { actionRequired: true },
        ],
      },
      include: {
        emails: {
          orderBy: { internalDate: "desc" },
          take: 1,
        },
      },
      orderBy: { lastMessageAt: "desc" },
      take: 25,
    });

    const items: WaitingOnItem[] = [];

    for (const thread of activeThreads) {
      const latestEmail = thread.emails[0];
      const counterpartyEmail = latestEmail?.fromEmail || latestEmail?.toEmail || "External Counterparty";
      const counterpartyName = counterpartyEmail.includes("<")
        ? counterpartyEmail.split("<")[0].trim().replace(/"/g, "")
        : counterpartyEmail.split("@")[0];

      const daysWaiting = Math.max(
        1,
        Math.round(
          (Date.now() - new Date(thread.lastMessageAt || new Date()).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      );

      const status: "PENDING" | "OVERDUE" | "UPCOMING" =
        daysWaiting >= 4 ? "OVERDUE" : daysWaiting >= 2 ? "PENDING" : "UPCOMING";

      const deliverable =
        thread.keyDecisionRequired ||
        thread.executiveBrief ||
        thread.snippet?.slice(0, 100) ||
        "Pending deliverable / decision";

      items.push({
        id: `wo_${thread.id}`,
        threadId: thread.id,
        topic: thread.subject?.replace(/^Re:\s*/i, "") || "Strategic Topic",
        deliverable,
        ownerName: counterpartyName,
        ownerEmail: counterpartyEmail,
        status,
        dueDateText: status === "OVERDUE" ? `Delayed by ${daysWaiting}d` : `${daysWaiting}d elapsed`,
        daysWaiting,
      });
    }

    return items;
  }
}
