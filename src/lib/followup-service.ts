import { prisma } from "@/lib/prisma";
import { AIService } from "@/lib/ai-service";

export interface FollowUpCandidate {
  threadId: string;
  subject: string;
  recipientEmail: string;
  sentAt: string;
  daysWaiting: number;
  snippet: string;
  suggestedFollowUpTone?: string;
}

export class FollowUpService {
  /**
   * Identifies outgoing threads that have received no counterparty reply after a threshold.
   */
  static async detectFollowUpCandidates(
    userId: string,
    minDaysWaiting = 2
  ): Promise<FollowUpCandidate[]> {
    const userAccounts = await prisma.gmailAccount.findMany({
      where: { userId },
      select: { id: true, email: true },
    });

    if (userAccounts.length === 0) return [];
    const accountEmails = userAccounts.map((a) => a.email.toLowerCase());

    const cutoffDate = new Date(Date.now() - minDaysWaiting * 24 * 60 * 60 * 1000);

    // Find threads where last message is older than cutoff and not archived
    const threads = await prisma.thread.findMany({
      where: {
        account: { userId },
        isArchived: false,
        lastMessageAt: { lte: cutoffDate },
      },
      include: {
        emails: {
          orderBy: { internalDate: "desc" },
          take: 1,
        },
      },
      orderBy: { lastMessageAt: "asc" },
      take: 20,
    });

    const candidates: FollowUpCandidate[] = [];

    for (const thread of threads) {
      const latestEmail = thread.emails[0];
      if (!latestEmail) continue;

      const fromEmail = (latestEmail.fromEmail || "").toLowerCase();
      const isFromUser = accountEmails.some((acc) => fromEmail.includes(acc));

      // If the last email was sent BY the executive, and no reply was received
      if (isFromUser) {
        const daysWaiting = Math.max(
          1,
          Math.round(
            (Date.now() - new Date(latestEmail.internalDate).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        );

        candidates.push({
          threadId: thread.id,
          subject: thread.subject || "(No Subject)",
          recipientEmail: latestEmail.toEmail || "Recipient",
          sentAt: latestEmail.internalDate.toISOString(),
          daysWaiting,
          snippet: latestEmail.snippet || thread.snippet || "",
          suggestedFollowUpTone: daysWaiting > 5 ? "gentle_firm" : "polite",
        });
      }
    }

    return candidates;
  }

  /**
   * Generates a context-aware follow-up reminder draft.
   */
  static async generateFollowUpDraft(userId: string, threadId: string) {
    const thread = await prisma.thread.findFirst({
      where: {
        OR: [{ id: threadId }, { gmailThreadId: threadId }],
        account: { userId },
      },
      select: { id: true, subject: true },
    });

    if (!thread) {
      throw new Error("Thread not found or unauthorized");
    }

    return await AIService.getDraftResponse(thread.id, "concise");
  }
}
