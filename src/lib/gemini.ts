import { GoogleGenAI } from "@google/genai";
import { GeminiEmailAnalysis, ToneModifier, KeyInformationData } from "@/types/ai";

/**
 * Server-side Google Gemini client instance.
 * Strictly server-side: GEMINI_API_KEY is never exposed to the client/browser.
 */
const GEMINI_MODEL = "gemini-3.6-flash";

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("[Gemini Service] GEMINI_API_KEY is not configured in environment.");
  }
  return new GoogleGenAI({ apiKey });
}

export interface ThreadMessageInput {
  sender: string;
  recipient: string;
  timestamp: string;
  snippet?: string;
  bodyText: string;
}

export interface ThreadAnalysisInput {
  subject: string;
  messages: ThreadMessageInput[];
  accountEmail?: string;
}

/**
 * Tests the Gemini API connectivity.
 */
export async function testGeminiConnection(): Promise<{ success: boolean; model: string; message: string }> {
  try {
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: "Respond with a simple JSON object: {\"status\": \"ok\", \"service\": \"Gemini\"}",
      config: {
        responseMimeType: "application/json",
      },
    });

    return {
      success: true,
      model: GEMINI_MODEL,
      message: response.text || "Connected successfully",
    };
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[Gemini Service] Connection test failed:", errorMsg);
    return {
      success: false,
      model: GEMINI_MODEL,
      message: errorMsg || "Gemini API connection failed",
    };
  }
}

/**
 * Analyzes an email thread using Gemini and returns structured JSON intelligence.
 */
export async function analyzeEmailThreadWithGemini(
  input: ThreadAnalysisInput
): Promise<GeminiEmailAnalysis> {
  const ai = getGeminiClient();

  const conversationText = input.messages
    .map(
      (m, idx) =>
        `--- Message #${idx + 1} ---\nFrom: ${m.sender}\nTo: ${m.recipient}\nDate: ${m.timestamp}\n\n${m.bodyText || m.snippet || "(Empty Body)"}`
    )
    .join("\n\n");

  const systemInstruction = `You are Priora's Executive Email Intelligence & Decision Engine.
Analyze the provided email thread objectively and return ONLY valid, parseable JSON conforming strictly to the requested schema.

Guidelines:
1. "summary": Concise 1-2 sentence overview of the email contents.
2. "executiveBrief": 2-sentence crisp executive briefing focusing on what happened and what action is required.
3. "priority": One of "urgent" | "high" | "normal" | "low".
   - "urgent": Immediate deadline (today/within 24h), critical blocker, emergency, or major executive decision required.
   - "high": Important action needed soon, key client/stakeholder request, or time-sensitive issue.
   - "normal": Standard business communication, regular updates, scheduling, or non-critical inquiries.
   - "low": Automated receipts, newsletters, marketing, promotional material, or general FYI notifications.
4. "category": One of "action_required" | "deadline_today" | "vip" | "fyi" | "newsletter".
5. "urgencyScore": Integer between 0 and 100 representing time sensitivity.
6. "importanceScore": Integer between 0 and 100 representing business/strategic impact.
7. "actionRequired": boolean (true if the recipient needs to do something, reply, approve, or decide).
8. "actionItems": Array of concise string tasks extracted from the thread.
9. "deadline": String representing detected deadline or null if none.
10. "keyDecisionRequired": String describing the specific decision or approval needed, or null.
11. "sentiment": One of "positive" | "neutral" | "urgent" | "frustrated" | "professional".
12. "reason": Brief justification of why this priority and urgency were assigned.
13. "keyInformation": Object containing extracted structured facts if applicable:
    - "studentName": student/client/person name if mentioned
    - "studentId": ID number if present
    - "program": course/project/program name if present
    - "reason": extracted reason/topic
    - "requestedDates": specific dates or times mentioned
    - "parentsCCd": names or emails of CC'd stakeholders/parents
    - "attachments": names of referenced files
    - "confidenceScore": integer 0-100
14. "aiInsights": Array of 2-4 bullet points summarizing key verification insights or factual findings from the email.
15. "suggestedAction": A specific, high-leverage recommended next action for the user (e.g. "Approve outing request & confirm CC list").
16. "suggestedReply": A polished, context-aware, ready-to-send draft reply that addresses all points in the email professionally.`;

  const userPrompt = `Subject: ${input.subject || "(No Subject)"}
User Account: ${input.accountEmail || "Executive"}

Thread History:
${conversationText}

Produce the structured JSON analysis.`;

  const runModel = async (modelName: string): Promise<string | undefined> => {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });
    return response.text;
  };

  let rawText: string | undefined;
  try {
    rawText = await runModel(GEMINI_MODEL);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[Gemini Service] Model (${GEMINI_MODEL}) generation failed:`, msg);
    throw new Error(`[Gemini Service] Analysis failed: ${msg}`);
  }

  if (!rawText) {
    throw new Error("[Gemini Service] Empty response from Gemini API");
  }

  const parsed = parseGeminiJSON(rawText);
  return normalizeAnalysis(parsed, input);
}

/**
 * Generates an email response draft using Gemini for a specific tone.
 */
export async function generateDraftWithGemini(
  subject: string,
  messages: ThreadMessageInput[],
  tone: ToneModifier = "concise",
  customInstructions?: string
): Promise<{ draftText: string; intentStrategy: string }> {
  const ai = getGeminiClient();

  const conversationText = messages
    .map(
      (m, idx) =>
        `--- Message #${idx + 1} ---\nFrom: ${m.sender}\nTo: ${m.recipient}\nDate: ${m.timestamp}\n\n${m.bodyText || m.snippet || ""}`
    )
    .join("\n\n");

  const prompt = `Subject: ${subject}
Requested Tone: ${tone} (${toneDescription(tone)})
${customInstructions ? `Additional User Instructions: ${customInstructions}` : ""}

Thread History:
${conversationText}

Respond ONLY in JSON format:
{
  "draftText": "...",
  "intentStrategy": "..."
}`;

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
    config: {
      systemInstruction: "You are Priora's Executive Email Ghostwriter. Draft clear, polite, and effective responses matching the specified tone. Return valid JSON only.",
      responseMimeType: "application/json",
      temperature: 0.3,
    },
  });

  const parsed = parseGeminiJSON(response.text || "{}");
  const draftText = typeof parsed.draftText === "string" ? parsed.draftText : "Thank you for your email. I have received your message and will follow up shortly.";
  const intentStrategy = typeof parsed.intentStrategy === "string" ? parsed.intentStrategy : `Strategy: Formulating ${tone} response.`;

  return {
    draftText,
    intentStrategy,
  };
}

function toneDescription(tone: ToneModifier): string {
  switch (tone) {
    case "concise":
      return "Direct, succinct, bulleted where appropriate, minimal pleasantries.";
    case "formal":
      return "Polite, elevated professional corporate tone, comprehensive.";
    case "direct_refusal":
      return "Firm yet courteous refusal/declination with a clear professional reason.";
    case "request_call":
      return "Suggest scheduling a short call to align on key details.";
    default:
      return "Professional and balanced.";
  }
}

function parseGeminiJSON(raw: string): Record<string, unknown> {
  try {
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
    return JSON.parse(cleaned) as Record<string, unknown>;
  } catch (err: unknown) {
    console.error("[Gemini Service] Failed to parse JSON response:", raw, err);
    throw new Error("[Gemini Service] Invalid JSON returned by model.");
  }
}

function normalizeAnalysis(data: Record<string, unknown>, input: ThreadAnalysisInput): GeminiEmailAnalysis {
  const validPriorities = ["urgent", "high", "normal", "low"];
  const validCategories = ["action_required", "deadline_today", "vip", "fyi", "newsletter"];
  const validSentiments = ["positive", "neutral", "urgent", "frustrated", "professional"];

  const rawPriority = typeof data.priority === "string" ? data.priority.toLowerCase() : "normal";
  const priority = validPriorities.includes(rawPriority)
    ? (rawPriority as "urgent" | "high" | "normal" | "low")
    : "normal";

  const rawCategory = typeof data.category === "string" ? data.category.toLowerCase() : "";
  const category = validCategories.includes(rawCategory)
    ? (rawCategory as "action_required" | "deadline_today" | "vip" | "fyi" | "newsletter")
    : (priority === "urgent" ? "action_required" : "fyi");

  const rawSentiment = typeof data.sentiment === "string" ? data.sentiment.toLowerCase() : "neutral";
  const sentiment = validSentiments.includes(rawSentiment)
    ? (rawSentiment as "positive" | "neutral" | "urgent" | "frustrated" | "professional")
    : "neutral";

  const urgencyScore = typeof data.urgencyScore === "number"
    ? Math.max(0, Math.min(100, Math.round(data.urgencyScore)))
    : (priority === "urgent" ? 90 : priority === "high" ? 70 : 30);

  const importanceScore = typeof data.importanceScore === "number"
    ? Math.max(0, Math.min(100, Math.round(data.importanceScore)))
    : (priority === "urgent" ? 85 : priority === "high" ? 75 : 40);

  const rawKeyInfo = (typeof data.keyInformation === "object" && data.keyInformation !== null ? data.keyInformation : {}) as Record<string, unknown>;

  const keyInfo: KeyInformationData = {
    studentName: typeof rawKeyInfo.studentName === "string" ? rawKeyInfo.studentName : undefined,
    studentId: typeof rawKeyInfo.studentId === "string" ? rawKeyInfo.studentId : undefined,
    program: typeof rawKeyInfo.program === "string" ? rawKeyInfo.program : undefined,
    reason: typeof rawKeyInfo.reason === "string" ? rawKeyInfo.reason : undefined,
    requestedDates: typeof rawKeyInfo.requestedDates === "string" ? rawKeyInfo.requestedDates : undefined,
    parentsCCd: typeof rawKeyInfo.parentsCCd === "string" ? rawKeyInfo.parentsCCd : undefined,
    attachments: Array.isArray(rawKeyInfo.attachments)
      ? rawKeyInfo.attachments.filter((item): item is string => typeof item === "string")
      : undefined,
    confidenceScore: typeof rawKeyInfo.confidenceScore === "number"
      ? Math.max(0, Math.min(100, Math.round(rawKeyInfo.confidenceScore)))
      : 95,
  };

  const actionItems: string[] = Array.isArray(data.actionItems)
    ? data.actionItems.filter((item): item is string => typeof item === "string")
    : [];

  const rawAiInsights = Array.isArray(data.aiInsights)
    ? data.aiInsights.filter((ins): ins is string => typeof ins === "string")
    : [];

  const aiInsights: string[] = rawAiInsights.length > 0
    ? rawAiInsights
    : [
        `Identified ${input.messages.length} message(s) in thread regarding "${input.subject}".`,
        typeof data.reason === "string" ? data.reason : "Analysis completed based on message context.",
      ];

  const suggestedAction = typeof data.suggestedAction === "string" && data.suggestedAction.trim()
    ? data.suggestedAction
    : (actionItems.length > 0 ? actionItems[0] : "Review conversation details");

  const suggestedReply = typeof data.suggestedReply === "string" && data.suggestedReply.trim()
    ? data.suggestedReply
    : "Thank you for the update. I have reviewed the details and will proceed accordingly.";

  const summary = typeof data.summary === "string" && data.summary.trim()
    ? data.summary
    : input.subject || "Email thread analysis";

  const executiveBrief = typeof data.executiveBrief === "string" && data.executiveBrief.trim()
    ? data.executiveBrief
    : summary;

  const deadline = typeof data.deadline === "string" ? data.deadline : null;
  const keyDecisionRequired = typeof data.keyDecisionRequired === "string" ? data.keyDecisionRequired : null;
  const reason = typeof data.reason === "string" ? data.reason : "Evaluated by Priora Gemini Intelligence.";

  return {
    summary,
    executiveBrief,
    priority,
    category,
    urgencyScore,
    importanceScore,
    actionRequired: Boolean(data.actionRequired ?? (actionItems.length > 0 || priority === "urgent")),
    actionItems,
    deadline,
    keyDecisionRequired,
    sentiment,
    reason,
    keyInformation: keyInfo,
    aiInsights,
    suggestedAction,
    suggestedReply,
  };
}
