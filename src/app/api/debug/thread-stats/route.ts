import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const account = await prisma.gmailAccount.findFirst({
      where: { userId: session.user.id },
    });

    if (!account) {
      return NextResponse.json({
        total: 0,
        archived: 0,
        nonArchived: 0,
        archivedThreads: [],
      });
    }

    const [total, archived, nonArchived, archivedThreads] = await Promise.all([
      prisma.thread.count({
        where: { accountId: account.id },
      }),
      prisma.thread.count({
        where: { accountId: account.id, isArchived: true },
      }),
      prisma.thread.count({
        where: { accountId: account.id, isArchived: false },
      }),
      prisma.thread.findMany({
        where: { accountId: account.id, isArchived: true },
        select: {
          id: true,
          subject: true,
        },
      }),
    ]);

    return NextResponse.json({
      total,
      archived,
      nonArchived,
      archivedThreads,
    });
  } catch (error) {
    console.error("[GET /api/debug/thread-stats] Error reading thread stats:", error);
    return NextResponse.json(
      { error: "Error reading thread stats" },
      { status: 500 }
    );
  }
}
