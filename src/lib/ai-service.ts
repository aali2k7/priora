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
import { MOCK_AI_SUMMARIES, MOCK_AI_DRAFTS, MOCK_EXECUTIVE_BRIEFING } from "./mock-data";

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

/**
 * Server-side AI Service Layer for Priora.
 * Seamlessly interfaces with PostgreSQL/Neon and Google Gemini API.
 */
export class AIService {
  /**
   * Generates or fetches the executive briefing digest based on real database threads.
   */
  static async getExecutiveBriefing(userId?: string): Promise<ExecutiveBriefing> {
    try {
      const whereClause = userId
        ? { account: { userId } }
        : {};

      const threads = await prisma.thread.findMany({
        where: whereClause,
        orderBy: { lastMessageAt: "desc" },
        take: 50,
      });

      if (threads.length === 0) {
        return MOCK_EXECUTIVE_BRIEFING;
      }

      const urgentThreads = threads.filter(
        (t) => t.priority === "urgent" || t.category === "action_required"
      );
      const unreadCount = threads.filter((t) => t.isUnread).length;

      const topActionItems: ExtractedTask[] = [];

      for (const t of urgentThreads.slice(0, 5)) {
        const keyInfo = (typeof t.keyInformation === "object" && t.keyInformation !== null ? t.keyInformation : {}) as Record<string, unknown>;
        const recAction = (typeof t.recommendedAction === "object" && t.recommendedAction !== null ? t.recommendedAction : {}) as Record<string, unknown>;

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

      const today = new Date().toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });

      const digestSummary =
        urgentThreads.length > 0
          ? `${urgentThreads.length} critical priority thread${urgentThreads.length > 1 ? "s" : ""} require your executive attention today across ${threads.length} synced conversations.`
          : `All inboxes are up to date. ${threads.length} conversations synchronized with zero critical blockers.`;

      return {
        date: today,
        digestSummary,
        urgentItemCount: urgentThreads.length,
        waitingOnCount: unreadCount,
        topActionItems,
      };
    } catch (error: unknown) {
      console.error("[AIService.getExecutiveBriefing] Error deriving briefing:", error);
      return MOCK_EXECUTIVE_BRIEFING;
    }
  }

  /**
   * Analyzes an email thread with Gemini, persisting the structured results in PostgreSQL.
   */
  static async analyzeThreadWithGemini(
    threadId: string,
    forceReanalyze = false
  ): Promise<AISummary> {
    // 1. Fetch thread and its emails from database
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
      if (MOCK_AI_SUMMARIES[threadId]) {
        return MOCK_AI_SUMMARIES[threadId];
      }
      throw new Error(`[AIService] Thread not found: ${threadId}`);
    }

    // 2. Return cached analysis if already analyzed and not forced
    if (thread.analyzedAt && !forceReanalyze && thread.aiSummary) {
      return this.formatThreadToAISummary(thread as DbThreadWithEmails);
    }

    // 3. Format messages for Gemini
    const messages = thread.emails.map((e) => ({
      sender: e.fromName ? `${e.fromName} <${e.fromEmail}>` : e.fromEmail,
      recipient: e.toName ? `${e.toName} <${e.toEmail}>` : (e.toEmail || ""),
      timestamp: e.internalDate ? new Date(e.internalDate).toLocaleString() : "Unknown date",
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

    // 4. Call Gemini API
    console.log(`[AIService] Analyzing thread ${thread.id} ("${thread.subject}") with Gemini...`);
    const analysis = await analyzeEmailThreadWithGemini({
      subject: thread.subject || "(No Subject)",
      messages,
      accountEmail: thread.account?.email,
    });

    // 5. Persist Gemini analysis into PostgreSQL via Prisma
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

    console.log(`[AIService] Successfully persisted Gemini analysis for thread ${thread.id}`);
    return this.formatThreadToAISummary(updatedThread as DbThreadWithEmails);
  }

  /**
   * Retrieves the AI summary for a thread. Analyzes on-the-fly with Gemini if unanalyzed.
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
        if (MOCK_AI_SUMMARIES[threadId]) {
          return MOCK_AI_SUMMARIES[threadId];
        }
        return {
          threadId,
          executiveBrief: "Thread details are currently being processed.",
          bulletPoints: ["Review conversation history."],
          urgencyScore: 50,
        };
      }

      // If already analyzed, return cached analysis
      if (thread.analyzedAt && thread.aiSummary) {
        return this.formatThreadToAISummary(thread as DbThreadWithEmails);
      }

      // If not analyzed, attempt Gemini analysis
      if (process.env.GEMINI_API_KEY) {
        try {
          return await this.analyzeThreadWithGemini(thread.id);
        } catch (geminiError) {
          console.error(`[AIService] Gemini analysis failed for thread ${thread.id}:`, geminiError);
        }
      }

      // Fallback summary from DB thread fields
      return this.formatThreadToAISummary(thread as DbThreadWithEmails);
    } catch (error: unknown) {
      console.error(`[AIService.getThreadSummary] Error for thread ${threadId}:`, error);
      if (MOCK_AI_SUMMARIES[threadId]) {
        return MOCK_AI_SUMMARIES[threadId];
      }
      return {
        threadId,
        executiveBrief: "Executive review required. This thread contains pending items.",
        bulletPoints: ["Review conversation history below."],
        urgencyScore: 50,
      };
    }
  }

  /**
   * Generates a context-aware email response draft using Gemini or stored suggestion.
   */
  static async getDraftResponse(
    threadId: string,
    tone: ToneModifier = "concise"
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

      if (thread?.suggestedReply && tone === "concise") {
        return {
          threadId: thread.id,
          intentStrategy: "Strategy: Formulated from Gemini thread analysis.",
          draftText: thread.suggestedReply,
          suggestedTone: "concise",
          lastUpdated: thread.analyzedAt ? "Analyzed recently" : "Just now",
        };
      }

      // If tone is changed and Gemini API key is available, generate dynamic response
      if (thread && thread.emails.length > 0 && process.env.GEMINI_API_KEY) {
        try {
          const messages = thread.emails.map((e) => ({
            sender: e.fromName || e.fromEmail,
            recipient: e.toName || e.toEmail || "",
            timestamp: e.internalDate ? new Date(e.internalDate).toLocaleString() : "",
            snippet: e.snippet || "",
            bodyText: e.bodyText || e.snippet || "",
          }));

          const draft = await generateDraftWithGemini(
            thread.subject || "(No Subject)",
            messages,
            tone
          );

          return {
            threadId: thread.id,
            intentStrategy: draft.intentStrategy,
            draftText: draft.draftText,
            suggestedTone: tone,
            lastUpdated: "Just now",
          };
        } catch (geminiError) {
          console.warn(`[AIService] Gemini draft generation failed for tone ${tone}, using transform fallback:`, geminiError);
        }
      }

      // If base draft exists in thread
      if (thread?.suggestedReply) {
        return this.transformTone(
          {
            threadId: thread.id,
            intentStrategy: "Strategy: Adjusted tone.",
            draftText: thread.suggestedReply,
            suggestedTone: "concise",
            lastUpdated: "Just now",
          },
          tone
        );
      }

      // Mock data fallback
      const baseDraft = MOCK_AI_DRAFTS[threadId];
      if (baseDraft) {
        if (tone === baseDraft.suggestedTone) return baseDraft;
        return this.transformTone(baseDraft, tone);
      }

      return {
        threadId,
        intentStrategy: `Strategy: Responding in ${tone} tone.`,
        draftText: "Hi,\n\nThank you for the update. I have reviewed this and will follow up shortly.\n\nBest,\nAlex Mercer",
        suggestedTone: tone,
        lastUpdated: "Just now",
      };
    } catch (error: unknown) {
      console.error(`[AIService.getDraftResponse] Error for thread ${threadId}:`, error);
      return {
        threadId,
        intentStrategy: `Strategy: Standard response in ${tone} tone.`,
        draftText: "Hi,\n\nThank you for reaching out. I have received your email.\n\nBest regards,",
        suggestedTone: tone,
        lastUpdated: "Just now",
      };
    }
  }

  /**
   * Safely batch analyzes unanalyzed threads for a Gmail account.
   * Runs sequentially with delay to stay comfortably within free-tier limits.
   */
  static async analyzeUnanalyzedThreadsForAccount(
    accountId: string,
    limit = 5
  ): Promise<{ processed: number; errors: number }> {
    if (!process.env.GEMINI_API_KEY) {
      console.log("[AIService] Skipping background analysis: GEMINI_API_KEY not configured.");
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

    console.log(`[AIService] Found ${unanalyzed.length} unanalyzed threads for account ${accountId}.`);
    let processed = 0;
    let errors = 0;

    for (const item of unanalyzed) {
      try {
        await this.analyzeThreadWithGemini(item.id);
        processed++;
        // Small delay to respect rate limits
        await new Promise((resolve) => setTimeout(resolve, 800));
      } catch (err: unknown) {
        errors++;
        console.error(`[AIService] Failed background analysis for thread ${item.id}:`, err);
      }
    }

    return { processed, errors };
  }

  /**
   * Helper to format a Prisma Thread into the AISummary structure.
   */
  private static formatThreadToAISummary(thread: DbThreadWithEmails): AISummary {
    const rawInsights = Array.isArray(thread.aiInsights)
      ? (thread.aiInsights.filter((i): i is string => typeof i === "string"))
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
      urgencyScore: thread.urgencyScore ?? (thread.priority === "urgent" ? 90 : 50),
      importanceScore: thread.importanceScore ?? 50,
      actionRequired: thread.actionRequired ?? (thread.priority === "urgent"),
      readingTimeSaved,
      keyInformation: (typeof thread.keyInformation === "object" && thread.keyInformation !== null ? (thread.keyInformation as unknown as KeyInformationData) : undefined),
      aiInsights: rawInsights.length > 0 ? rawInsights : undefined,
      recommendedAction: (typeof thread.recommendedAction === "object" && thread.recommendedAction !== null ? (thread.recommendedAction as unknown as RecommendedActionData) : undefined),
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

  /**
   * Transforms draft tone dynamically.
   */
  private static transformTone(base: AIDraftResponse, tone: ToneModifier): AIDraftResponse {
    let transformedText = base.draftText;
    let strategy = base.intentStrategy;

    if (tone === "concise") {
      transformedText = transformedText
        .split("\n\n")
        .filter((line) => !line.startsWith("I hope") && !line.startsWith("I am writing"))
        .join("\n\n");
      strategy = "Strategy: Shortened to essential executive points.";
    } else if (tone === "formal") {
      transformedText = transformedText
        .replace(/thanks/gi, "Thank you")
        .replace(/looks good/gi, "I have reviewed and approve the proposed details");
      strategy = "Strategy: Elevated formal corporate tone.";
    } else if (tone === "direct_refusal") {
      transformedText =
        "Hi,\n\nThank you for reaching out. Unfortunately, we are unable to approve or proceed with this request at this time.\n\nBest regards,\nAlex Mercer";
      strategy = "Strategy: Direct and polite refusal.";
    } else if (tone === "request_call") {
      transformedText =
        "Hi,\n\nThanks for the update. Let's schedule a brief 10-minute call to align on this before proceeding.\n\nBest regards,\nAlex Mercer";
      strategy = "Strategy: Proposing a brief call to align.";
    }

    return {
      ...base,
      draftText: transformedText,
      suggestedTone: tone,
      intentStrategy: strategy,
      lastUpdated: "Just now",
    };
  }
}
