export type ToneModifier =
  "concise" | "formal" | "direct_refusal" | "request_call" | "friendly";

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

export interface ExtractedCommitment {
  id: string;
  task: string;
  owner: "YOU" | "COUNTERPARTY" | "THIRD_PARTY";
  ownerName?: string;
  deadlineType: "HARD_DEADLINE" | "RELATIVE" | "TENTATIVE";
  deadlineText?: string;
  confidenceScore: number; // 0..100
  isCompleted?: boolean;
}

export interface AISummary {
  threadId: string;
  executiveBrief: string; // 2-sentence executive summary
  bulletPoints: string[];
  keyDecisionRequired?: string;
  urgencyScore?: number; // 0 to 100
  importanceScore?: number; // 0 to 100
  actionRequired?: boolean;
  readingTimeSaved?: string; // E.g., "Original read: 45s • AI brief: 8s"
  keyInformation?: KeyInformationData;
  aiInsights?: string[];
  recommendedAction?: RecommendedActionData;
  commitments?: ExtractedCommitment[];
  suggestedReply?: string;
  analyzedAt?: string;
}

export interface GeminiEmailAnalysis {
  summary: string;
  executiveBrief: string;
  priority: "urgent" | "high" | "normal" | "low";
  category: "action_required" | "deadline_today" | "vip" | "fyi" | "newsletter";
  urgencyScore: number;
  importanceScore: number;
  actionRequired: boolean;
  actionItems: string[];
  commitments?: ExtractedCommitment[];
  deadline: string | null;
  keyDecisionRequired: string | null;
  sentiment: "positive" | "neutral" | "urgent" | "frustrated" | "professional";
  reason: string;
  keyInformation: KeyInformationData;
  aiInsights: string[];
  suggestedAction: string;
  suggestedReply: string;
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
