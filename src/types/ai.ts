export type ToneModifier = "concise" | "formal" | "direct_refusal" | "request_call";

export interface ExtractedTask {
  id: string;
  threadId: string;
  title: string;
  deadline?: string;
  isCompleted: boolean;
  priority: "high" | "medium" | "low";
  assigneeName?: string;
}

export interface KeyInformationData {
  studentName?: string;
  studentId?: string;
  program?: string;
  reason?: string;
  requestedDates?: string;
  parentsCCd?: string;
  attachments?: string[];
  urgency?: string;
  approvalNeeded?: string;
  confidenceScore?: number;
}

export interface RecommendedActionData {
  actionTitle: string;
  confidenceScore: number;
  reasoning: string;
}

export interface AISummary {
  threadId: string;
  executiveBrief: string; // 2-sentence executive summary
  bulletPoints: string[];
  keyDecisionRequired?: string;
  urgencyScore: number; // 0 to 100
  readingTimeSaved?: string; // E.g., "Original read: 45s • AI brief: 8s"
  keyInformation?: KeyInformationData;
  aiInsights?: string[];
  recommendedAction?: RecommendedActionData;
}

export interface AIDraftResponse {
  threadId: string;
  intentStrategy: string; // E.g., "Confirming Q3 Board Deck & confirming 2 PM meeting"
  draftText: string;
  suggestedTone: ToneModifier;
  lastUpdated: string;
}

export interface ExecutiveBriefing {
  date: string;
  digestSummary: string; // 2-bullet morning overview
  urgentItemCount: number;
  waitingOnCount: number;
  topActionItems: ExtractedTask[];
}
