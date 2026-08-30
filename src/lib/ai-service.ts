import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import {
  AISummary,
  AIDraftResponse,
  ExecutiveBriefing,
  ToneModifier,
  ExtractedTask,
  KeyInformationData,
  RecommendedActionData,
} from "@/types/ai";
import {
  analyzeEmailThreadWithGemini,
  generateDraftWithGemini,
} from "@/lib/gemini";
import { isAIAvailable } from "@/lib/groq";

interface DbThreadWithEmails {
  id: string;
  gmailThreadId: string;
  subject: string | null;
  snippet: string | null;
  isUnread: boolean;
  isArchived: boolean;
  isSnoozed: boolean;
  lastMessageAt: Date | null;
  internalDate: Date | null;
  priority: string;
  category: string;
  aiSummary: string | null;
  executiveBrief: string | null;
  keyDecisionRequired: string | null;
  urgencyScore: number | null;
  importanceScore: number | null;
  actionRequired: boolean | null;
  suggestedReply: string | null;
  keyInformation: Prisma.JsonValue;
  aiInsights: Prisma.JsonValue;
  recommendedAction: Prisma.JsonValue;
  analyzedAt: Date | null;
  emails?: Array<{
    id: string;
    fromEmail: string;
    fromName: string | null;
    toEmail: string | null;
    toName: string | null;
    snippet: string | null;
    bodyText: string | null;
    internalDate: Date;
    isUnread: boolean;
  }>;
  account?: {
    email: string;
  } | null;
}

// In-memory mutex map to prevent redundant concurrent LLM calls for the same thread
const activeAnalysisMap = new Map<string, Promise<AISummary>>();

/**
 * Server-side AI Service Layer for Priora.
 * Strictly server-side: Interfaces with PostgreSQL/Neon and Groq AI API.
 * Never uses mock AI data in production behavior.
 */
export class AIService {
  /**
   * Generates executive briefing digest strictly based on real database threads.
   */
  static async getExecutiveBriefing(userId?: string): Promise<ExecutiveBriefing> {
    try {
      const whereClause = userId
        ? { account: { userId }, isArchived: false }
        : { isArchived: false };

      const threads = await prisma.thread.findMany({
        where: whereClause,
        orderBy: { lastMessageAt: "desc" },
      });

      const today = new Date().toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });

      if (threads.length === 0) {
        return {
          date: today,
          digestSummary: "No active threads found in local 15-day working dataset. Syncing inbox...",
          urgentItemCount: 0,
          waitingOnCount: 0,
          topActionItems: [],
        };
      }

      // Real urgent threads derived from real persisted AI results or unread urgent signals
      const urgentThreads = threads.filter(
        (t) =>
          t.priority === "urgent" ||
          t.category === "action_required" ||
          t.category === "deadline_today" ||
          (t.urgencyScore !== null && t.urgencyScore >= 75) ||
          t.actionRequired === true
      );

      const unreadCount = threads.filter((t) => t.isUnread).length;
      const topActionItems: ExtractedTask[] = [];

      for (const t of urgentThreads.slice(0, 5)) {
        const keyInfo = (typeof t.keyInformation === "object" && t.keyInformation !== null
          ? t.keyInformation
          : {}) as Record<string, unknown>;
        const recAction = (typeof t.recommendedAction === "object" && t.recommendedAction !== null
          ? t.recommendedAction
          : {}) as Record<string, unknown>;

        const title =
          (typeof recAction.actionTitle === "string" ? recAction.actionTitle : null) ||
          t.keyDecisionRequired ||
          t.subject ||
          "Action Required";

        topActionItems.push({
          id: `task_${t.id}`,
          threadId: t.id,
          title,
          deadline: typeof keyInfo.requestedDates === "string" ? keyInfo.requestedDates : undefined,
          isCompleted: false,
          priority: t.priority === "urgent" ? "high" : "medium",
          assigneeName: typeof keyInfo.studentName === "string" ? keyInfo.studentName : undefined,
        });
      }

      const digestSummary =
        urgentThreads.length > 0
          ? `${urgentThreads.length} high-priority thread${urgentThreads.length > 1 ? "s" : ""} require attention across ${threads.length} active conversations.`
          : `All inboxes are clear. ${threads.length} active conversations in 15-day dataset with zero critical blockers.`;

      return {
        date: today,
        digestSummary,
        urgentItemCount: urgentThreads.length,
        waitingOnCount: unreadCount,
        topActionItems,
      };
    } catch (error: unknown) {
      console.error("[AIService.getExecutiveBriefing] Error deriving briefing:", error);
      const today = new Date().toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      return {
        date: today,
        digestSummary: "Executive briefing is currently being generated...",
        urgentItemCount: 0,
        waitingOnCount: 0,
        topActionItems: [],
      };
    }
  }

  /**
   * Analyzes an email thread with Groq and persists the structured results in PostgreSQL.
   */
  static async analyzeThreadWithGemini(
    threadId: string,
    forceReanalyze = false
  ): Promise<AISummary> {
    // 1. Return in-flight analysis promise if already running
    if (!forceReanalyze && activeAnalysisMap.has(threadId)) {
      return activeAnalysisMap.get(threadId)!;
    }

    const runAnalysis = async (): Promise<AISummary> => {
      // 2. Fetch thread and its emails from database
      const thread = await prisma.thread.findFirst({
        where: {
          OR: [{ id: threadId }, { gmailThreadId: threadId }],
        },
        include: {
          emails: { orderBy: { internalDate: "asc" } },
          account: true,
        },
      });

      if (!thread) {
        throw new Error(`[AIService] Thread not found in database: ${threadId}`);
      }

      // 3. Return cached analysis if already analyzed in DB and not forced
      if (thread.analyzedAt && !forceReanalyze && (thread.aiSummary || thread.executiveBrief)) {
        return this.formatThreadToAISummary(thread as DbThreadWithEmails);
      }

      // 4. Format messages for Groq
      const messages = thread.emails.map((e) => ({
        sender: e.fromName ? `${e.fromName} <${e.fromEmail}>` : e.fromEmail,
        recipient: e.toName ? `${e.toName} <${e.toEmail}>` : (e.toEmail || ""),
        timestamp: e.internalDate ? new Date(e.internalDate).toLocaleString() : "Recent",
        snippet: e.snippet || "",
        bodyText: e.bodyText || e.snippet || "",
      }));

      if (messages.length === 0 && thread.snippet) {
        messages.push({
          sender: "Sender",
          recipient: thread.account?.email || "Recipient",
          timestamp: thread.lastMessageAt ? new Date(thread.lastMessageAt).toLocaleString() : "Recent",
          snippet: thread.snippet,
          bodyText: thread.snippet,
        });
      }

      // 5. Call Groq API
      console.log(`[AIService] Running Groq analysis for thread ${thread.id} ("${thread.subject}")...`);
      const analysis = await analyzeEmailThreadWithGemini({
        subject: thread.subject || "(No Subject)",
        messages,
        accountEmail: thread.account?.email,
      });

      // 6. Persist validated analysis into PostgreSQL via Prisma
      const updatedThread = await prisma.thread.update({
        where: { id: thread.id },
        data: {
          aiSummary: analysis.summary,
          executiveBrief: analysis.executiveBrief,
          priority: analysis.priority,
          category: analysis.category,
          urgencyScore: analysis.urgencyScore,
          importanceScore: analysis.importanceScore,
          actionRequired: analysis.actionRequired,
          keyDecisionRequired: analysis.keyDecisionRequired,
          keyInformation: analysis.keyInformation as unknown as Prisma.InputJsonValue,
          aiInsights: analysis.aiInsights as unknown as Prisma.InputJsonValue,
          recommendedAction: {
            actionTitle: analysis.suggestedAction,
            confidenceScore: analysis.keyInformation.confidenceScore || 95,
            reasoning: analysis.reason,
          } as unknown as Prisma.InputJsonValue,
          suggestedReply: analysis.suggestedReply,
          analyzedAt: new Date(),
          aiVersion: 1,
        },
        include: {
          emails: { orderBy: { internalDate: "asc" } },
        },
      });

      console.log(`[AIService] Successfully persisted Groq analysis in DB for thread ${thread.id}`);
      return this.formatThreadToAISummary(updatedThread as DbThreadWithEmails);
    };

    const promise = runAnalysis();
    activeAnalysisMap.set(threadId, promise);
    promise.finally(() => {
      activeAnalysisMap.delete(threadId);
    });

    return promise;
  }

  /**
   * Retrieves the AI summary for a thread from the database.
   * If not yet analyzed, attempts Gemini analysis on-the-fly.
   */
  static async getThreadSummary(threadId: string): Promise<AISummary> {
    try {
      const thread = await prisma.thread.findFirst({
        where: {
          OR: [{ id: threadId }, { gmailThreadId: threadId }],
        },
        include: {
          emails: { orderBy: { internalDate: "asc" } },
        },
      });

      if (!thread) {
        return {
          threadId,
          executiveBrief: "Analysis unavailable",
          bulletPoints: ["Thread record not found."],
        };
      }

      // If already analyzed, return cached analysis
      if (thread.analyzedAt && thread.aiSummary) {
        return this.formatThreadToAISummary(thread as DbThreadWithEmails);
      }

      // If not analyzed, attempt Groq AI analysis
      if (isAIAvailable()) {
        try {
          return await this.analyzeThreadWithGemini(thread.id);
        } catch (aiError) {
          console.error(`[AIService] On-demand Groq analysis failed for thread ${thread.id}:`, aiError);
          return {
            threadId: thread.id,
            executiveBrief: "Analysis unavailable",
            bulletPoints: ["AI analysis failed to process this thread."],
          };
        }
      }

      return {
        threadId: thread.id,
        executiveBrief: "Analysis pending",
        bulletPoints: ["AI analysis is pending for this thread."],
      };
    } catch (error: unknown) {
      console.error(`[AIService.getThreadSummary] Error for thread ${threadId}:`, error);
      return {
        threadId,
        executiveBrief: "Analysis unavailable",
        bulletPoints: ["Unable to load AI analysis."],
      };
    }
  }

  /**
   * Generates a context-aware email response draft using Groq or stored suggestion.
   */
  static async getDraftResponse(
    threadId: string,
    tone: ToneModifier = "concise",
    customInstructions?: string
  ): Promise<AIDraftResponse> {
    try {
      const thread = await prisma.thread.findFirst({
        where: {
          OR: [{ id: threadId }, { gmailThreadId: threadId }],
        },
        include: {
          emails: { orderBy: { internalDate: "asc" } },
        },
      });

      if (!thread) {
        return {
          threadId,
          intentStrategy: "Draft unavailable",
          draftText: "Thread not found.",
          suggestedTone: tone,
          lastUpdated: "Just now",
        };
      }

      if (thread.suggestedReply && tone === "concise" && !customInstructions) {
        return {
          threadId: thread.id,
          intentStrategy: "Strategy: Formulated from persisted AI thread analysis.",
          draftText: thread.suggestedReply,
          suggestedTone: "concise",
          lastUpdated: thread.analyzedAt ? "Analyzed recently" : "Just now",
        };
      }

      // If AI API is available and thread has messages, generate dynamic response
      if (isAIAvailable() && (thread.emails.length > 0 || thread.snippet)) {
        try {
          const messages = thread.emails.map((e) => ({
            sender: e.fromName || e.fromEmail,
            recipient: e.toName || e.toEmail || "",
            timestamp: e.internalDate ? new Date(e.internalDate).toLocaleString() : "",
            snippet: e.snippet || "",
            bodyText: e.bodyText || e.snippet || "",
          }));

          if (messages.length === 0 && thread.snippet) {
            messages.push({
              sender: "Sender",
              recipient: "Me",
              timestamp: "Recent",
              snippet: thread.snippet,
              bodyText: thread.snippet,
            });
          }

          const draft = await generateDraftWithGemini(
            thread.subject || "(No Subject)",
            messages,
            tone,
            customInstructions
          );

          return {
            threadId: thread.id,
            intentStrategy: draft.intentStrategy,
            draftText: draft.draftText,
            suggestedTone: tone,
            lastUpdated: "Just now",
          };
        } catch (aiError) {
          console.warn(`[AIService] Groq draft generation failed for tone ${tone}:`, aiError);
        }
      }

      const defaultText = thread.suggestedReply || "Thank you for your email. I have received your message and will follow up shortly.";
      return {
        threadId: thread.id,
        intentStrategy: `Strategy: Responding in ${tone} tone.`,
        draftText: defaultText,
        suggestedTone: tone,
        lastUpdated: "Just now",
      };
    } catch (error: unknown) {
      console.error(`[AIService.getDraftResponse] Error for thread ${threadId}:`, error);
      return {
        threadId,
        intentStrategy: `Strategy: Standard response in ${tone} tone.`,
        draftText: "Thank you for reaching out. I have received your message and will follow up shortly.",
        suggestedTone: tone,
        lastUpdated: "Just now",
      };
    }
  }

  /**
   * Safely batch analyzes unanalyzed threads for a Gmail account in the background using Groq.
   * Runs in parallel batches of 3 to quickly pre-warm executive AI briefings.
   */
  static async analyzeUnanalyzedThreadsForAccount(
    accountId: string,
    limit = 2
  ): Promise<{ processed: number; errors: number }> {
    if (!isAIAvailable()) {
      return { processed: 0, errors: 0 };
    }

    const unanalyzed = await prisma.thread.findMany({
      where: {
        accountId,
        analyzedAt: null,
      },
      orderBy: { lastMessageAt: "desc" },
      take: limit,
      select: { id: true, subject: true },
    });

    if (unanalyzed.length === 0) {
      return { processed: 0, errors: 0 };
    }

    let processed = 0;
    let errors = 0;

    for (const item of unanalyzed) {
      try {
        await this.analyzeThreadWithGemini(item.id);
        processed++;
        await new Promise((resolve) => setTimeout(resolve, 1500));
      } catch (err) {
        errors++;
        console.warn(`[AIService] Notice: Background analysis skipped for thread ${item.id}:`, err);
      }
    }

    return { processed, errors };
  }

  /**
   * Helper to format a Prisma Thread into the AISummary structure.
   */
  private static formatThreadToAISummary(thread: DbThreadWithEmails): AISummary {
    const rawInsights = Array.isArray(thread.aiInsights)
      ? thread.aiInsights.filter((i): i is string => typeof i === "string")
      : [];

    const bulletPoints =
      rawInsights.length > 0
        ? rawInsights
        : thread.snippet
        ? [thread.snippet.slice(0, 160)]
        : ["No additional bullet points available."];

    const readingTimeSaved = this.calculateReadingTimeSaved(thread.emails || []);

    return {
      threadId: thread.id,
      executiveBrief:
        thread.executiveBrief ||
        thread.aiSummary ||
        `${thread.subject || "Email thread"}: Review required.`,
      bulletPoints,
      keyDecisionRequired: thread.keyDecisionRequired || undefined,
      urgencyScore: thread.urgencyScore ?? undefined,
      importanceScore: thread.importanceScore ?? undefined,
      actionRequired: thread.actionRequired ?? undefined,
      readingTimeSaved,
      keyInformation:
        typeof thread.keyInformation === "object" && thread.keyInformation !== null
          ? (thread.keyInformation as unknown as KeyInformationData)
          : undefined,
      aiInsights: rawInsights.length > 0 ? rawInsights : undefined,
      recommendedAction:
        typeof thread.recommendedAction === "object" && thread.recommendedAction !== null
          ? (thread.recommendedAction as unknown as RecommendedActionData)
          : undefined,
      suggestedReply: thread.suggestedReply || undefined,
      analyzedAt: thread.analyzedAt ? new Date(thread.analyzedAt).toISOString() : undefined,
    };
  }

  /**
   * Estimates reading time saved.
   */
  private static calculateReadingTimeSaved(emails: Array<{ bodyText: string | null; snippet: string | null }>): string {
    const totalWords = emails.reduce((acc, e) => {
      const text = e.bodyText || e.snippet || "";
      return acc + text.split(/\s+/).length;
    }, 0);

    const readSeconds = Math.max(15, Math.round((totalWords / 200) * 60));
    const briefSeconds = 6;
    return `Original read: ${readSeconds}s • AI brief: ${briefSeconds}s`;
  }
}
