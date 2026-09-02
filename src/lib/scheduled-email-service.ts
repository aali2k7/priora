import { prisma } from "@/lib/prisma";
import { sendGmailMessage, getValidAccessToken } from "@/lib/gmail-service";

export interface CreateScheduledEmailInput {
  userId: string;
  accountId: string;
  threadId?: string;
  to: string | string[];
  toNames?: string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  bodyText: string;
  scheduledAt: string | Date;
  userTimezone?: string;
  userFormattedTime?: string;
  idempotencyKey?: string;
}

export class ScheduledEmailService {
  /**
   * Schedules an email for future delivery in the database.
   */
  static async createScheduledEmail(input: CreateScheduledEmailInput) {
    const toEmails = Array.isArray(input.to) ? input.to : [input.to];
    const ccEmails = input.cc
      ? Array.isArray(input.cc)
        ? input.cc
        : [input.cc]
      : [];
    const bccEmails = input.bcc
      ? Array.isArray(input.bcc)
        ? input.bcc
        : [input.bcc]
      : [];

    const scheduledDate = new Date(input.scheduledAt);
    const idempotencyKey =
      input.idempotencyKey ||
      `sched_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Verify account exists and belongs to user
    const account = await prisma.gmailAccount.findFirst({
      where: { id: input.accountId, userId: input.userId },
    });

    if (!account) {
      throw new Error("Target Gmail account not found or access unauthorized.");
    }

    return await prisma.scheduledEmail.create({
      data: {
        userId: input.userId,
        accountId: input.accountId,
        threadId: input.threadId || null,
        toEmails: toEmails,
        toNames: input.toNames || [],
        ccEmails: ccEmails,
        bccEmails: bccEmails,
        subject: input.subject.trim() || "(No Subject)",
        bodyTextEncrypted: input.bodyText.trim(),
        scheduledAt: scheduledDate,
        userTimezone: input.userTimezone || "UTC",
        userFormattedTime: input.userFormattedTime || null,
        status: "SCHEDULED",
        idempotencyKey,
      },
    });
  }

  /**
   * Retrieves all scheduled emails for a user.
   */
  static async getScheduledEmails(userId: string) {
    return await prisma.scheduledEmail.findMany({
      where: { userId },
      orderBy: { scheduledAt: "asc" },
      include: {
        account: {
          select: {
            email: true,
          },
        },
      },
    });
  }

  /**
   * Cancels a scheduled email if not yet actively sending or sent.
   */
  static async cancelScheduledEmail(userId: string, scheduledId: string) {
    const item = await prisma.scheduledEmail.findFirst({
      where: { id: scheduledId, userId },
    });

    if (!item) {
      throw new Error("Scheduled email not found.");
    }

    if (item.status === "SENT") {
      throw new Error("Email has already been sent.");
    }

    if (item.status === "SENDING") {
      throw new Error(
        "Email is currently being dispatched and cannot be cancelled."
      );
    }

    return await prisma.scheduledEmail.update({
      where: { id: scheduledId },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
      },
    });
  }

  /**
   * Reschedules an email to a new future time.
   */
  static async rescheduleEmail(
    userId: string,
    scheduledId: string,
    newScheduledAt: string | Date,
    userTimezone?: string,
    userFormattedTime?: string
  ) {
    const targetDate = new Date(newScheduledAt);
    if (targetDate.getTime() <= Date.now()) {
      throw new Error("Scheduled time must be in the future.");
    }

    const item = await prisma.scheduledEmail.findFirst({
      where: { id: scheduledId, userId },
    });

    if (!item) {
      throw new Error("Scheduled email not found.");
    }

    if (item.status === "SENT") {
      throw new Error("Cannot reschedule an already sent email.");
    }

    return await prisma.scheduledEmail.update({
      where: { id: scheduledId },
      data: {
        scheduledAt: targetDate,
        userTimezone: userTimezone || item.userTimezone,
        userFormattedTime: userFormattedTime || item.userFormattedTime,
        status: "SCHEDULED",
        attempts: 0,
        lastErrorMessage: null,
      },
    });
  }

  /**
   * Core Background Delivery Engine: Scans for due emails (scheduledAt <= now),
   * locks records with atomic status change, refreshes OAuth tokens,
   * dispatches via Gmail API, and handles retries / terminal failures.
   */
  static async processDueScheduledEmails(workerId: string = `worker_${Date.now()}`) {
    const now = new Date();
    const leaseCutoff = new Date(now.getTime() - 5 * 60 * 1000); // 5-minute lease timeout

    // Find due items that are SCHEDULED or have a stale SENDING lease
    const dueCandidates = await prisma.scheduledEmail.findMany({
      where: {
        scheduledAt: { lte: now },
        OR: [
          { status: "SCHEDULED" },
          {
            status: "SENDING",
            lockAcquiredAt: { lte: leaseCutoff },
          },
        ],
      },
      take: 20,
    });

    const results = [];

    for (const candidate of dueCandidates) {
      // Atomic Lock Acquisition via CAS update
      const lockAcquired = await prisma.scheduledEmail.updateMany({
        where: {
          id: candidate.id,
          status: candidate.status, // Verify status hasn't changed in race
        },
        data: {
          status: "SENDING",
          lockWorkerId: workerId,
          lockAcquiredAt: now,
          attempts: { increment: 1 },
          lastAttemptAt: now,
        },
      });

      if (lockAcquired.count === 0) {
        // Lost race to another worker
        continue;
      }

      try {
        // Retrieve fresh OAuth access token for account
        const accessToken = await getValidAccessToken(candidate.userId);
        if (!accessToken) {
          throw new Error("Unable to retrieve valid Google OAuth token for account.");
        }

        const toList = candidate.toEmails as string[];
        const ccList = (candidate.ccEmails as string[]) || [];
        const bccList = (candidate.bccEmails as string[]) || [];

        // Dispatch via Gmail REST API
        const sendResult = await sendGmailMessage({
          userId: candidate.userId,
          to: toList.join(", "),
          cc: ccList.length > 0 ? ccList.join(", ") : undefined,
          bcc: bccList.length > 0 ? bccList.join(", ") : undefined,
          subject: candidate.subject,
          bodyText: candidate.bodyTextEncrypted,
          threadId: candidate.threadId || undefined,
        });

        if (!sendResult.success) {
          throw new Error(sendResult.error || "Gmail API send failed");
        }

        // Mark as SENT
        await prisma.scheduledEmail.update({
          where: { id: candidate.id },
          data: {
            status: "SENT",
            sentGmailMessageId: sendResult.messageId || null,
            sentGmailThreadId: sendResult.threadId || null,
            sentAt: new Date(),
            lastErrorMessage: null,
          },
        });

        results.push({ id: candidate.id, status: "SENT", messageId: sendResult.messageId });
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : "Unknown dispatch error";
        console.error(`[ScheduledEmailService] Failed to dispatch ${candidate.id}:`, err);

        const isTerminal =
          errorMsg.includes("invalid_grant") ||
          errorMsg.includes("Access Denied") ||
          errorMsg.includes("Unauthorized") ||
          candidate.attempts >= candidate.maxAttempts;

        await prisma.scheduledEmail.update({
          where: { id: candidate.id },
          data: {
            status: isTerminal ? "FAILED" : "SCHEDULED", // Re-queue if transient
            lastErrorMessage: errorMsg,
          },
        });

        results.push({ id: candidate.id, status: isTerminal ? "FAILED" : "RETRY_QUEUED", error: errorMsg });
      }
    }

    return {
      processedCount: results.length,
      results,
    };
  }
}
