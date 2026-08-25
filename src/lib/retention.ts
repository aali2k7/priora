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
 * Cleans expired local PostgreSQL threads older than the retention threshold.
 * 
 * Safety invariants:
 * 1. Gmail is NEVER touched or modified (permanent mailbox).
 * 2. User, Account, Session, Verification, GmailAccount records are NEVER touched.
 * 3. Only local PostgreSQL Thread records older than cutoffDate are deleted.
 * 4. Child Email and LabelOnThread records are automatically deleted via PostgreSQL CASCADE.
 */
export async function cleanupExpiredLocalData(
  accountId: string,
  retentionDays: number = DEFAULT_RETENTION_DAYS
): Promise<{ deletedThreads: number }> {
  const cutoff = getRetentionCutoffDate(retentionDays);

  const deleteResult = await prisma.thread.deleteMany({
    where: {
      accountId,
      lastMessageAt: { lt: cutoff },
    },
  });

  if (deleteResult.count > 0) {
    console.log(
      `[Retention] Cleaned ${deleteResult.count} local PostgreSQL threads older than ${retentionDays} days (cutoff: ${cutoff.toISOString()})`
    );
  }

  return {
    deletedThreads: deleteResult.count,
  };
}
