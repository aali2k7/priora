import { prisma } from "@/lib/prisma";

export const DEFAULT_RETENTION_DAYS = 15;

/**
 * Calculates the cutoff date for local PostgreSQL rolling retention.
 */
export function getRetentionCutoffDate(retentionDays: number = DEFAULT_RETENTION_DAYS): Date {
  return new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
}

/**
 * Returns a summary of dataset health and age distribution for an account.
 */
export async function getRetentionSummary(accountId: string, retentionDays: number = DEFAULT_RETENTION_DAYS) {
  const cutoff = getRetentionCutoffDate(retentionDays);

  const [totalThreads, totalEmails, expiredThreads, activeThreads, oldestThread, newestThread] =
    await Promise.all([
      prisma.thread.count({ where: { accountId } }),
      prisma.email.count({ where: { accountId } }),
      prisma.thread.count({
        where: {
          accountId,
          lastMessageAt: { lt: cutoff },
        },
      }),
      prisma.thread.count({
        where: {
          accountId,
          lastMessageAt: { gte: cutoff },
        },
      }),
      prisma.thread.findFirst({
        where: { accountId },
        orderBy: { lastMessageAt: "asc" },
        select: { id: true, subject: true, lastMessageAt: true },
      }),
      prisma.thread.findFirst({
        where: { accountId },
        orderBy: { lastMessageAt: "desc" },
        select: { id: true, subject: true, lastMessageAt: true },
      }),
    ]);

  return {
    accountId,
    retentionDays,
    cutoffDate: cutoff.toISOString(),
    totalThreads,
    totalEmails,
    expiredThreads,
    activeThreads,
    oldestThread,
    newestThread,
  };
}

/**
 * Cleans expired local PostgreSQL data older than the retention threshold.
 * 
 * Safety invariants:
 * 1. Gmail is NEVER touched or modified (permanent mailbox).
 * 2. User, Account, Session, Verification, GmailAccount records are NEVER touched.
 * 3. Expired individual Email records older than cutoffDate are deleted.
 * 4. Only Thread records with NO remaining retained emails (or lastMessageAt < cutoff) are deleted.
 * 5. Threads containing at least one retained recent message are preserved.
 */
export async function cleanupExpiredLocalData(
  accountId: string,
  retentionDays: number = DEFAULT_RETENTION_DAYS
): Promise<{ deletedEmails: number; deletedThreads: number }> {
  const cutoff = getRetentionCutoffDate(retentionDays);

  // 1. Delete individual emails older than the cutoff date
  const deletedEmailsResult = await prisma.email.deleteMany({
    where: {
      accountId,
      internalDate: { lt: cutoff },
    },
  });

  // 2. Delete threads that have no remaining emails or whose latest message is older than cutoff
  const deletedThreadsResult = await prisma.thread.deleteMany({
    where: {
      accountId,
      OR: [
        { emails: { none: {} } },
        { lastMessageAt: { lt: cutoff } },
      ],
    },
  });

  if (deletedEmailsResult.count > 0 || deletedThreadsResult.count > 0) {
    console.log(
      `[Retention] Cleaned ${deletedEmailsResult.count} expired emails and ${deletedThreadsResult.count} expired threads older than ${retentionDays} days (cutoff: ${cutoff.toISOString()})`
    );
  }

  return {
    deletedEmails: deletedEmailsResult.count,
    deletedThreads: deletedThreadsResult.count,
  };
}
