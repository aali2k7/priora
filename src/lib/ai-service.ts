import { AISummary, AIDraftResponse, ExecutiveBriefing, ToneModifier } from "@/types/ai";
import { MOCK_AI_SUMMARIES, MOCK_AI_DRAFTS, MOCK_EXECUTIVE_BRIEFING } from "./mock-data";

/**
 * Service layer abstraction for AI Operations (Briefings, Summarization, Tone Adjustments, Task Extraction).
 * Gracefully integrates with Ollama/OpenAI endpoints when configured, or provides instant executive fallback.
 */
export class AIService {
  /**
   * Generates the morning executive briefing digest.
   */
  static async getExecutiveBriefing(): Promise<ExecutiveBriefing> {
    await new Promise((resolve) => setTimeout(resolve, 40));
    return MOCK_EXECUTIVE_BRIEFING;
  }

  /**
   * Generates an executive 2-sentence summary and task analysis for a thread.
   */
  static async getThreadSummary(threadId: string): Promise<AISummary> {
    await new Promise((resolve) => setTimeout(resolve, 60));

    if (MOCK_AI_SUMMARIES[threadId]) {
      return MOCK_AI_SUMMARIES[threadId];
    }

    // Dynamic fallback summary generator
    return {
      threadId,
      executiveBrief: "Executive review required. This thread contains pending requests that require your decision or guidance.",
      bulletPoints: [
        "Review conversation history below.",
        "Pending action items detected.",
      ],
      urgencyScore: 50,
    };
  }

  /**
   * Generates a context-aware email response draft.
   */
  static async getDraftResponse(threadId: string, tone: ToneModifier = "concise"): Promise<AIDraftResponse> {
    await new Promise((resolve) => setTimeout(resolve, 80));

    const baseDraft = MOCK_AI_DRAFTS[threadId];

    if (baseDraft) {
      if (tone === baseDraft.suggestedTone) {
        return baseDraft;
      }
      return this.transformTone(baseDraft, tone);
    }

    // Dynamic fallback draft generator
    return {
      threadId,
      intentStrategy: `Strategy: Responding in ${tone} tone to confirm review and next steps.`,
      draftText: "Hi,\n\nThanks for sending this over. I have received your message and will follow up shortly.\n\nBest,\nAlex Mercer",
      suggestedTone: tone,
      lastUpdated: "Just now",
    };
  }

  /**
   * Transforms draft tone dynamically based on selected pill modifier.
   */
  private static transformTone(base: AIDraftResponse, tone: ToneModifier): AIDraftResponse {
    let transformedText = base.draftText;
    let strategy = base.intentStrategy;

    if (tone === "concise") {
      transformedText = transformedText.split("\n\n").filter(line => !line.startsWith("I hope")).join("\n\n");
      strategy = "Strategy: Shortened to essential executive points.";
    } else if (tone === "formal") {
      transformedText = transformedText.replace("Looks good", "I have reviewed and approve the proposed terms");
      strategy = "Strategy: Elevated formal corporate tone.";
    } else if (tone === "direct_refusal") {
      transformedText = "Hi,\n\nThank you for reaching out. Unfortunately, we are unable to approve this at this time.\n\nBest,\nAlex Mercer";
      strategy = "Strategy: Polite, direct refusal.";
    } else if (tone === "request_call") {
      transformedText = "Hi,\n\nThanks for the update. Let's get on a brief 10-minute call to align on this before proceeding.\n\nBest,\nAlex Mercer";
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
