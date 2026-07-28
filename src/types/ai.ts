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

export interface AISummary {
  threadId: string;
  executiveBrief: string; // 2-sentence executive summary
  bulletPoints: string[];
  keyDecisionRequired?: string;
  urgencyScore: number; // 0 to 100
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
