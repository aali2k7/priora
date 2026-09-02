import { prisma } from "@/lib/prisma";
import { AIService } from "@/lib/ai-service";
import { ToneModifier } from "@/types/ai";

export interface RuleCondition {
  field:
    | "senderEmail"
    | "senderDomain"
    | "subject"
    | "category"
    | "priority"
    | "urgencyScore"
    | "sentiment"
    | "hasAttachments";
  operator:
    | "EQUALS"
    | "NOT_EQUALS"
    | "CONTAINS"
    | "NOT_CONTAINS"
    | "STARTS_WITH"
    | "IN"
    | "GREATER_THAN"
    | "LESS_THAN";
  value: string | number | string[];
}

export interface RuleAction {
  type:
    | "GENERATE_AI_DRAFT"
    | "APPLY_LABEL"
    | "AUTO_ARCHIVE"
    | "SCHEDULE_REPLY"
    | "SAFE_AUTO_SEND";
  parameters?: {
    tone?: ToneModifier;
    promptTemplate?: string;
    labelName?: string;
    scheduleDelayMinutes?: number;
    allowlistDomains?: string[];
  };
}

export interface CreateRuleInput {
  name: string;
  description?: string;
  isActive?: boolean;
  priorityOrder?: number;
  conditions: RuleCondition[];
  actions: RuleAction[];
}

export class AutomationService {
  /**
   * Evaluates if an email thread matches a given condition.
   */
  static evaluateCondition(
    condition: RuleCondition,
    threadContext: {
      senderEmail: string;
      senderDomain: string;
      subject: string;
      category: string;
      priority: string;
      urgencyScore: number;
      sentiment: string;
      hasAttachments: boolean;
    }
  ): boolean {
    const rawValue = threadContext[condition.field];
    const targetValue = condition.value;

    switch (condition.operator) {
      case "EQUALS":
        return String(rawValue).toLowerCase() === String(targetValue).toLowerCase();

      case "NOT_EQUALS":
        return String(rawValue).toLowerCase() !== String(targetValue).toLowerCase();

      case "CONTAINS":
        return String(rawValue)
          .toLowerCase()
          .includes(String(targetValue).toLowerCase());

      case "NOT_CONTAINS":
        return !String(rawValue)
          .toLowerCase()
          .includes(String(targetValue).toLowerCase());

      case "STARTS_WITH":
        return String(rawValue)
          .toLowerCase()
          .startsWith(String(targetValue).toLowerCase());

      case "IN":
        if (Array.isArray(targetValue)) {
          return targetValue
            .map((v) => String(v).toLowerCase())
            .includes(String(rawValue).toLowerCase());
        }
        return false;

      case "GREATER_THAN":
        return Number(rawValue) > Number(targetValue);

      case "LESS_THAN":
        return Number(rawValue) < Number(targetValue);

      default:
        return false;
    }
  }

  /**
   * Evaluates all active automation rules for a user against a newly synced or updated thread.
   */
  static async evaluateThreadRules(
    userId: string,
    thread: {
      id: string;
      subject?: string | null;
      senderEmail?: string | null;
      category?: string | null;
      priorityLevel?: string | null;
      urgencyScore?: number | null;
      sentiment?: string | null;
      hasAttachments?: boolean;
    }
  ) {
    const activeRules = await prisma.automationRule.findMany({
      where: { userId, isActive: true },
      orderBy: { priorityOrder: "desc" },
    });

    if (activeRules.length === 0) return { matched: false, evaluated: 0 };

    const senderEmail = (thread.senderEmail || "").toLowerCase();
    const senderDomain = senderEmail.includes("@")
      ? senderEmail.split("@")[1]
      : "";

    const threadContext = {
      senderEmail,
      senderDomain,
      subject: thread.subject || "",
      category: thread.category || "General",
      priority: thread.priorityLevel || "MEDIUM",
      urgencyScore: thread.urgencyScore ?? 5,
      sentiment: thread.sentiment || "NEUTRAL",
      hasAttachments: !!thread.hasAttachments,
    };

    const results = [];

    for (const rule of activeRules) {
      const conditions = (rule.conditions as unknown as RuleCondition[]) || [];
      const actions = (rule.actions as unknown as RuleAction[]) || [];

      // Check if all conditions match (AND logic)
      const isMatch =
        conditions.length > 0 &&
        conditions.every((cond) => this.evaluateCondition(cond, threadContext));

      if (isMatch) {
        // Execute rule actions
        for (const action of actions) {
          if (action.type === "GENERATE_AI_DRAFT") {
            try {
              const tone = action.parameters?.tone || "concise";
              const draft = await AIService.getDraftResponse(thread.id, tone);

              // Update thread with pre-generated draft
              await prisma.thread.update({
                where: { id: thread.id },
                data: {
                  suggestedReply: draft.draftText,
                },
              });

              // Log success
              await prisma.automationLog.create({
                data: {
                  userId,
                  ruleId: rule.id,
                  threadId: thread.id,
                  emailSubject: thread.subject || null,
                  senderEmail: senderEmail || null,
                  actionExecuted: "DRAFT_GENERATED",
                  status: "SUCCESS",
                  diagnostics: {
                    ruleName: rule.name,
                    tone,
                    intentStrategy: draft.intentStrategy,
                  },
                },
              });

              // Update rule execution counters
              await prisma.automationRule.update({
                where: { id: rule.id },
                data: {
                  totalTriggered: { increment: 1 },
                  lastTriggeredAt: new Date(),
                },
              });

              results.push({
                ruleId: rule.id,
                action: "DRAFT_GENERATED",
                status: "SUCCESS",
              });
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : "Error drafting";
              await prisma.automationLog.create({
                data: {
                  userId,
                  ruleId: rule.id,
                  threadId: thread.id,
                  actionExecuted: "DRAFT_GENERATED",
                  status: "ERROR",
                  diagnostics: { error: msg },
                },
              });
            }
          }
        }
      }
    }

    return {
      matched: results.length > 0,
      results,
    };
  }

  /**
   * Retrieves all automation rules for a user.
   */
  static async getRules(userId: string) {
    return await prisma.automationRule.findMany({
      where: { userId },
      orderBy: [{ priorityOrder: "desc" }, { createdAt: "desc" }],
    });
  }

  /**
   * Creates a new automation rule.
   */
  static async createRule(userId: string, input: CreateRuleInput) {
    return await prisma.automationRule.create({
      data: {
        userId,
        name: input.name,
        description: input.description || null,
        isActive: input.isActive ?? true,
        priorityOrder: input.priorityOrder ?? 0,
        conditions: input.conditions as object,
        actions: input.actions as object,
      },
    });
  }

  /**
   * Toggles rule activation state.
   */
  static async toggleRule(userId: string, ruleId: string, isActive: boolean) {
    return await prisma.automationRule.update({
      where: { id: ruleId, userId },
      data: { isActive },
    });
  }

  /**
   * Deletes an automation rule.
   */
  static async deleteRule(userId: string, ruleId: string) {
    return await prisma.automationRule.delete({
      where: { id: ruleId, userId },
    });
  }
}
