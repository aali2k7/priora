import { prisma } from "@/lib/prisma";
import { AIService } from "@/lib/ai-service";
import { ScheduledEmailService } from "@/lib/scheduled-email-service";
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
    allowlistSenders?: string[];
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

// In-memory Emergency Kill Switch registry (can also be persisted in Redis / DB)
const userEmergencyKillSwitches = new Set<string>();

export class AutomationService {
  /**
   * Sets the global Emergency Kill Switch state for a user.
   */
  static setEmergencyKillSwitch(userId: string, isFrozen: boolean) {
    if (isFrozen) {
      userEmergencyKillSwitches.add(userId);
    } else {
      userEmergencyKillSwitches.delete(userId);
    }
  }

  static isKillSwitchActive(userId: string): boolean {
    return userEmergencyKillSwitches.has(userId);
  }

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
   * Evaluates all active automation rules for a user against a newly synced thread.
   */
  static async evaluateThreadRules(
    userId: string,
    thread: {
      id: string;
      accountId?: string;
      subject?: string | null;
      senderEmail?: string | null;
      category?: string | null;
      priorityLevel?: string | null;
      urgencyScore?: number | null;
      sentiment?: string | null;
      hasAttachments?: boolean;
    }
  ) {
    // 1. Check Global Emergency Kill Switch
    if (this.isKillSwitchActive(userId)) {
      await prisma.automationLog.create({
        data: {
          userId,
          threadId: thread.id,
          actionExecuted: "ABORTED",
          status: "BLOCKED_GUARDRAIL",
          diagnostics: { reason: "Global Emergency Kill Switch is currently ACTIVE" },
        },
      });
      return { matched: false, blockedByKillSwitch: true };
    }

    const activeRules = await prisma.automationRule.findMany({
      where: { userId, isActive: true },
      orderBy: { priorityOrder: "desc" },
    });

    if (activeRules.length === 0) return { matched: false, evaluated: 0 };

    const senderEmail = (thread.senderEmail || "").toLowerCase();
    const senderDomain = senderEmail.includes("@")
      ? senderEmail.split("@")[1]
      : "";

    // 2. Loop Prevention Check (No-reply, Mailer-daemon, automated bounces)
    const isBotOrLoop =
      senderEmail.includes("no-reply") ||
      senderEmail.includes("noreply") ||
      senderEmail.includes("mailer-daemon") ||
      senderEmail.includes("bounce") ||
      senderEmail.includes("notifications@");

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

      // Evaluate condition set
      const isMatch =
        conditions.length > 0 &&
        conditions.every((cond) => this.evaluateCondition(cond, threadContext));

      if (isMatch) {
        for (const action of actions) {
          // Action 1: GENERATE_AI_DRAFT
          if (action.type === "GENERATE_AI_DRAFT") {
            try {
              const tone = action.parameters?.tone || "concise";
              const draft = await AIService.getDraftResponse(thread.id, tone);

              await prisma.thread.update({
                where: { id: thread.id },
                data: { suggestedReply: draft.draftText },
              });

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

          // Action 2: SAFE_AUTO_SEND with Multi-Layered Guardrails
          else if (action.type === "SAFE_AUTO_SEND") {
            // Guardrail A: Loop Prevention
            if (isBotOrLoop) {
              await prisma.automationLog.create({
                data: {
                  userId,
                  ruleId: rule.id,
                  threadId: thread.id,
                  emailSubject: thread.subject || null,
                  senderEmail: senderEmail || null,
                  actionExecuted: "AUTO_SENT",
                  status: "BLOCKED_GUARDRAIL",
                  diagnostics: { reason: "Loop Prevention: Blocked auto-send to automated/no-reply sender" },
                },
              });
              continue;
            }

            // Guardrail B: Negative Sentiment / Escalation Bailout
            if (
              threadContext.sentiment === "NEGATIVE" ||
              threadContext.sentiment === "URGENT_COMPLAINT" ||
              threadContext.priority === "URGENT" ||
              threadContext.urgencyScore >= 8
            ) {
              await prisma.automationLog.create({
                data: {
                  userId,
                  ruleId: rule.id,
                  threadId: thread.id,
                  emailSubject: thread.subject || null,
                  senderEmail: senderEmail || null,
                  actionExecuted: "AUTO_SENT",
                  status: "BLOCKED_GUARDRAIL",
                  diagnostics: {
                    reason: "Sentiment / Escalation Guardrail: Negative sentiment or high urgency detected. Downgraded to manual review.",
                  },
                },
              });
              continue;
            }

            // Guardrail C: Rate Limiter (Max 5 auto-sends per hour)
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
            const autoSendsInLastHour = await prisma.automationLog.count({
              where: {
                userId,
                actionExecuted: "AUTO_SENT",
                status: "SUCCESS",
                createdAt: { gte: oneHourAgo },
              },
            });

            if (autoSendsInLastHour >= 5) {
              await prisma.automationLog.create({
                data: {
                  userId,
                  ruleId: rule.id,
                  threadId: thread.id,
                  emailSubject: thread.subject || null,
                  senderEmail: senderEmail || null,
                  actionExecuted: "AUTO_SENT",
                  status: "BLOCKED_GUARDRAIL",
                  diagnostics: { reason: "Hourly rate limit exceeded (Max 5 auto-sends per hour)" },
                },
              });
              continue;
            }

            // Guardrail D: Recipient Allowlist verification
            const allowlistDomains = action.parameters?.allowlistDomains || [];
            const allowlistSenders = action.parameters?.allowlistSenders || [];

            if (
              allowlistDomains.length > 0 &&
              !allowlistDomains.includes(senderDomain)
            ) {
              await prisma.automationLog.create({
                data: {
                  userId,
                  ruleId: rule.id,
                  threadId: thread.id,
                  emailSubject: thread.subject || null,
                  senderEmail: senderEmail || null,
                  actionExecuted: "AUTO_SENT",
                  status: "BLOCKED_GUARDRAIL",
                  diagnostics: {
                    reason: `Domain ${senderDomain} not in rule allowlist domains: [${allowlistDomains.join(", ")}]`,
                  },
                },
              });
              continue;
            }

            // All Guardrails Passed: Queue delayed dispatch (with 60-second grace cancellation window)
            try {
              const account = thread.accountId
                ? await prisma.gmailAccount.findUnique({ where: { id: thread.accountId } })
                : await prisma.gmailAccount.findFirst({ where: { userId } });

              if (!account) {
                throw new Error("No linked Gmail account found for dispatch");
              }

              const draft = await AIService.getDraftResponse(
                thread.id,
                action.parameters?.tone || "formal"
              );

              const scheduledDispatchAt = new Date(Date.now() + 60 * 1000); // 60s delay window

              await ScheduledEmailService.createScheduledEmail({
                userId,
                accountId: account.id,
                threadId: thread.id,
                to: senderEmail,
                subject: thread.subject?.startsWith("Re:")
                  ? thread.subject
                  : `Re: ${thread.subject || ""}`,
                bodyText: draft.draftText,
                scheduledAt: scheduledDispatchAt,
                userFormattedTime: "Auto-send (60s grace period)",
              });

              await prisma.automationLog.create({
                data: {
                  userId,
                  ruleId: rule.id,
                  threadId: thread.id,
                  emailSubject: thread.subject || null,
                  senderEmail: senderEmail || null,
                  actionExecuted: "AUTO_SENT",
                  status: "SUCCESS",
                  diagnostics: {
                    ruleName: rule.name,
                    scheduledAt: scheduledDispatchAt.toISOString(),
                    gracePeriodSeconds: 60,
                  },
                },
              });

              await prisma.automationRule.update({
                where: { id: rule.id },
                data: {
                  totalTriggered: { increment: 1 },
                  lastTriggeredAt: new Date(),
                },
              });

              results.push({
                ruleId: rule.id,
                action: "AUTO_SENT",
                status: "QUEUED_SAFE_SEND",
              });
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : "Error executing safe auto-send";
              await prisma.automationLog.create({
                data: {
                  userId,
                  ruleId: rule.id,
                  threadId: thread.id,
                  actionExecuted: "AUTO_SENT",
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
   * Creates a new automation rule with validation.
   */
  static async createRule(userId: string, input: CreateRuleInput) {
    // Validate auto-send rules require explicit configuration
    const hasAutoSend = input.actions.some((a) => a.type === "SAFE_AUTO_SEND");
    if (hasAutoSend) {
      if (input.conditions.length === 0) {
        throw new Error("Safe auto-send rules require at least one specific condition.");
      }
    }

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
