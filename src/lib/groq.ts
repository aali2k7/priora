import {
  GeminiEmailAnalysis,
  ToneModifier,
  KeyInformationData,
} from "@/types/ai";

/**
 * Server-side Groq High-Speed Inference Client.
 * Uses fast models (default: openai/gpt-oss-20b or groq/compound-mini) for sub-second responses.
 */
const CANDIDATE_MODELS = [
  process.env.GROQ_MODEL,
  "openai/gpt-oss-20b",
  "groq/compound-mini",
  "qwen/qwen3.6-27b",
  "qwen/qwen3.8-27b",
].filter(Boolean) as string[];

let activeWorkingModel = "openai/gpt-oss-20b";
export const GROQ_MODEL = activeWorkingModel;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export function getGroqApiKey(): string {
  const apiKey = process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "[Groq Service] GROQ_API_KEY (or GEMINI_API_KEY) is not configured in environment."
    );
  }
  return apiKey;
}

export function isAIAvailable(): boolean {
  return !!(process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY);
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
 * Direct call to Groq's OpenAI-compatible Chat Completions API with native JSON schema formatting.
 * Automatically fails over to candidate models if a model is unavailable or rate limited (429).
 */
async function callGroqChat(
  messages: { role: string; content: string }[],
  temperature = 0.2
): Promise<string> {
  const apiKey = getGroqApiKey();
  const modelsToTry = [
    activeWorkingModel,
    ...CANDIDATE_MODELS.filter((m) => m !== activeWorkingModel),
  ];

  let lastError: Error | null = null;

  for (const model of modelsToTry) {
    try {
      const response = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages,
          response_format: { type: "json_object" },
          temperature,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();

        // If 404 (model not found) or 429 (rate limited), fail over to next candidate model
        if (
          response.status === 404 ||
          response.status === 429 ||
          errorText.includes("model_not_found") ||
          errorText.includes("rate_limit_exceeded")
        ) {
          console.warn(
            `[Groq Service] Model ${model} returned ${response.status} (${errorText.slice(0, 120)}...). Trying next candidate model...`
          );
          lastError = new Error(
            `Groq API error ${response.status}: ${errorText}`
          );
          continue;
        }

        console.error(
          `[Groq Service] Groq API returned ${response.status}: ${errorText}`
        );
        throw new Error(`Groq API error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error(
          "[Groq Service] Empty completion content returned by Groq."
        );
      }

      // Cache the working model for future calls
      activeWorkingModel = model;
      return content;
    } catch (err: unknown) {
      const isRecoverable =
        err instanceof Error &&
        (err.message.includes("404") ||
          err.message.includes("429") ||
          err.message.includes("model_not_found") ||
          err.message.includes("rate_limit"));

      if (!isRecoverable) {
        throw err;
      }
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  // If all candidate models failed, wait 2.5s for TPM bucket replenishment and retry primary model once
  console.warn(
    "[Groq Service] All candidate models busy. Waiting 2.5s before final retry..."
  );
  await new Promise((resolve) => setTimeout(resolve, 2500));

  const fallbackResponse = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: CANDIDATE_MODELS[0] || "openai/gpt-oss-20b",
      messages,
      response_format: { type: "json_object" },
      temperature,
    }),
  });

  if (fallbackResponse.ok) {
    const data = await fallbackResponse.json();
    return data.choices?.[0]?.message?.content || "";
  }

  throw (
    lastError || new Error("[Groq Service] All candidate Groq models failed.")
  );
}

/**
 * Tests Groq API connectivity and latency.
 */
export async function testGroqConnection(): Promise<{
  success: boolean;
  model: string;
  message: string;
  latencyMs?: number;
}> {
  const startTime = Date.now();
  try {
    const text = await callGroqChat([
      {
        role: "system",
        content:
          'You are a health check system. Return valid JSON: {"status": "ok", "service": "Groq"}',
      },
      { role: "user", content: "ping" },
    ]);
    const latencyMs = Date.now() - startTime;
    return {
      success: true,
      model: activeWorkingModel,
      message: text,
      latencyMs,
    };
  } catch (error) {
    return {
      success: false,
      model: activeWorkingModel,
      message: String(error),
    };
  }
}

/**
 * Analyzes an email thread using Groq and returns structured JSON intelligence.
 * Compacts messages to the most recent 3 items and trims text to 500 chars to minimize TPM token usage.
 */
export async function analyzeEmailThreadWithGroq(
  input: ThreadAnalysisInput
): Promise<GeminiEmailAnalysis> {
  // Use last 3 messages max and truncate to 500 chars to stay well under TPM limits (<300 tokens)
  const recentMessages = input.messages.slice(-3);
  const conversationText = recentMessages
    .map((m, idx) => {
      const cleanBody = (m.bodyText || m.snippet || "(Empty Body)")
        .replace(/\s+/g, " ")
        .slice(0, 500);
      return `--- Message #${idx + 1} ---\nFrom: ${m.sender}\nTo: ${m.recipient}\nDate: ${m.timestamp}\n\n${cleanBody}`;
    })
    .join("\n\n");

  const systemInstruction = `You are Priora's Executive Email Intelligence & Decision Engine.
Analyze the provided email thread objectively and return ONLY valid, parseable JSON conforming strictly to the requested schema.

JSON Schema format:
{
  "summary": "1-2 sentence overview of the email contents",
  "executiveBrief": "2-sentence crisp executive briefing focusing on what happened and what action is required",
  "priority": "urgent" | "high" | "normal" | "low",
  "category": "action_required" | "deadline_today" | "vip" | "fyi" | "newsletter",
  "urgencyScore": 0-100,
  "importanceScore": 0-100,
  "actionRequired": true | false,
  "actionItems": ["item 1", "item 2"],
  "deadline": "string or null",
  "keyDecisionRequired": "string or null",
  "sentiment": "positive" | "neutral" | "urgent" | "frustrated" | "professional",
  "reason": "short explanation",
  "keyInformation": {
    "studentName": "string or null",
    "studentId": "string or null",
    "program": "string or null",
    "reason": "string or null",
    "requestedDates": "string or null",
    "parentsCCd": "string or null",
    "attachments": ["string"],
    "confidenceScore": 0-100
  },
  "aiInsights": ["bullet 1", "bullet 2"],
  "suggestedAction": "specific recommended action",
  "suggestedReply": "professional draft reply ready to send"
}`;

  const userPrompt = `Subject: ${input.subject || "(No Subject)"}
User Account: ${input.accountEmail || "Executive"}

Thread History:
${conversationText}

Produce the structured JSON analysis.`;

  const rawJson = await callGroqChat(
    [
      { role: "system", content: systemInstruction },
      { role: "user", content: userPrompt },
    ],
    0.1
  );

  const parsed = parseGroqJSON(rawJson);
  return normalizeAnalysis(parsed, input);
}

/**
 * Generates an email response draft using Groq for a specific tone.
 */
export async function generateDraftWithGroq(
  subject: string,
  messages: ThreadMessageInput[],
  tone: ToneModifier = "concise",
  customInstructions?: string
): Promise<{ draftText: string; intentStrategy: string }> {
  // Focus on the most recent 3 messages for high-speed, context-accurate drafting
  const recentMessages = messages.slice(-3);
  const conversationText = recentMessages
    .map((m, idx) => {
      const rawBody = m.bodyText || m.snippet || "";
      const trimmedBody = rawBody.length > 750 ? rawBody.slice(0, 750) + "..." : rawBody;
      return `--- Message #${idx + 1} ---\nFrom: ${m.sender}\nTo: ${m.recipient}\nDate: ${m.timestamp}\n\n${trimmedBody}`;
    })
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

  const systemInstruction =
    "You are Priora's Executive Email Ghostwriter. Draft clear, polite, and effective responses matching the specified tone. Return valid JSON only with 'draftText' and 'intentStrategy' keys.";

  const rawJson = await callGroqChat(
    [
      { role: "system", content: systemInstruction },
      { role: "user", content: prompt },
    ],
    0.3
  );

  const parsed = parseGroqJSON(rawJson);
  const draftText =
    typeof parsed.draftText === "string"
      ? parsed.draftText
      : "Thank you for your email. I have received your message and will follow up shortly.";
  const intentStrategy =
    typeof parsed.intentStrategy === "string"
      ? parsed.intentStrategy
      : `Strategy: Formulating ${tone} response.`;

  return {
    draftText,
    intentStrategy,
  };
}

/**
 * Composes a completely new standalone email draft using Groq/Gemini inference strictly based on user instructions.
 */
export async function generateNewEmailDraftWithGroq(
  instruction: string,
  recipient?: string,
  subject?: string,
  tone: ToneModifier = "concise",
  senderName?: string
): Promise<{ draftText: string; intentStrategy: string }> {
  const systemInstruction = `You are Priora's Executive Email Assistant. Compose a completely NEW email based strictly on the user's instructions.
Rules:
1. The user's instruction is the primary source of truth. Fulfill the intent directly and accurately.
2. This is a NEW email, NOT a reply. Do NOT reference previous notes, previous conversations, or past reviews unless explicitly stated in the instruction.
3. Do NOT invent facts, fake meeting times, or fabricated details.
4. Output ONLY the email body in "draftText". Do NOT include a "Subject:" header or line in "draftText".
5. Tone requirements:
   - concise: Direct, succinct, minimal pleasantries, getting straight to the point.
   - formal: Professional, polished, elevated corporate tone.
   - friendly: Warm, natural, collaborative, and approachable.
6. Return valid JSON only with keys "draftText" and "intentStrategy".`;

  const userPrompt = `User Instruction: ${instruction}
Recipient: ${recipient || "Not specified"}
Subject: ${subject || "Not specified"}
Tone: ${tone}
Sender Name: ${senderName || ""}

Compose the new email draft. Respond ONLY in valid JSON format:
{
  "draftText": "...",
  "intentStrategy": "..."
}`;

  const rawJson = await callGroqChat(
    [
      { role: "system", content: systemInstruction },
      { role: "user", content: userPrompt },
    ],
    0.2
  );

  const parsed = parseGroqJSON(rawJson);
  const draftText =
    typeof parsed.draftText === "string" ? parsed.draftText.trim() : "";
  const intentStrategy =
    typeof parsed.intentStrategy === "string"
      ? parsed.intentStrategy.trim()
      : `Composing ${tone} email`;

  if (!draftText) {
    throw new Error("[Groq Service] Failed to generate email draft text.");
  }

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
    case "friendly":
      return "Warm, natural, collaborative, and approachable.";
    case "direct_refusal":
      return "Firm yet courteous refusal/declination with a clear professional reason.";
    case "request_call":
      return "Suggest scheduling a short call to align on key details.";
    default:
      return "Professional and balanced.";
  }
}

function parseGroqJSON(raw: string): Record<string, unknown> {
  try {
    const cleaned = raw
      .replace(/^```json\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();
    return JSON.parse(cleaned) as Record<string, unknown>;
  } catch (err: unknown) {
    console.error("[Groq Service] Failed to parse JSON response:", raw, err);
    throw new Error("[Groq Service] Invalid JSON returned by model.");
  }
}

function normalizeAnalysis(
  data: Record<string, unknown>,
  input: ThreadAnalysisInput
): GeminiEmailAnalysis {
  const validPriorities = ["urgent", "high", "normal", "low"];
  const validCategories = [
    "action_required",
    "deadline_today",
    "vip",
    "fyi",
    "newsletter",
  ];
  const validSentiments = [
    "positive",
    "neutral",
    "urgent",
    "frustrated",
    "professional",
  ];

  const rawPriority =
    typeof data.priority === "string" ? data.priority.toLowerCase() : "normal";
  const priority = validPriorities.includes(rawPriority)
    ? (rawPriority as "urgent" | "high" | "normal" | "low")
    : "normal";

  const rawCategory =
    typeof data.category === "string" ? data.category.toLowerCase() : "";
  const category = validCategories.includes(rawCategory)
    ? (rawCategory as
        "action_required" | "deadline_today" | "vip" | "fyi" | "newsletter")
    : priority === "urgent"
      ? "action_required"
      : "fyi";

  const rawSentiment =
    typeof data.sentiment === "string"
      ? data.sentiment.toLowerCase()
      : "neutral";
  const sentiment = validSentiments.includes(rawSentiment)
    ? (rawSentiment as
        "positive" | "neutral" | "urgent" | "frustrated" | "professional")
    : "neutral";

  const urgencyScore =
    typeof data.urgencyScore === "number"
      ? Math.max(0, Math.min(100, Math.round(data.urgencyScore)))
      : priority === "urgent"
        ? 90
        : priority === "high"
          ? 70
          : 30;

  const importanceScore =
    typeof data.importanceScore === "number"
      ? Math.max(0, Math.min(100, Math.round(data.importanceScore)))
      : priority === "urgent"
        ? 85
        : priority === "high"
          ? 75
          : 40;

  const rawKeyInfo = (
    typeof data.keyInformation === "object" && data.keyInformation !== null
      ? data.keyInformation
      : {}
  ) as Record<string, unknown>;

  const keyInfo: KeyInformationData = {
    studentName:
      typeof rawKeyInfo.studentName === "string"
        ? rawKeyInfo.studentName
        : undefined,
    studentId:
      typeof rawKeyInfo.studentId === "string"
        ? rawKeyInfo.studentId
        : undefined,
    program:
      typeof rawKeyInfo.program === "string" ? rawKeyInfo.program : undefined,
    reason:
      typeof rawKeyInfo.reason === "string" ? rawKeyInfo.reason : undefined,
    requestedDates:
      typeof rawKeyInfo.requestedDates === "string"
        ? rawKeyInfo.requestedDates
        : undefined,
    parentsCCd:
      typeof rawKeyInfo.parentsCCd === "string"
        ? rawKeyInfo.parentsCCd
        : undefined,
    attachments: Array.isArray(rawKeyInfo.attachments)
      ? rawKeyInfo.attachments.filter(
          (item): item is string => typeof item === "string"
        )
      : undefined,
    confidenceScore:
      typeof rawKeyInfo.confidenceScore === "number"
        ? Math.max(0, Math.min(100, Math.round(rawKeyInfo.confidenceScore)))
        : 95,
  };

  const actionItems: string[] = Array.isArray(data.actionItems)
    ? data.actionItems.filter(
        (item): item is string => typeof item === "string"
      )
    : [];

  const rawAiInsights = Array.isArray(data.aiInsights)
    ? data.aiInsights.filter((ins): ins is string => typeof ins === "string")
    : [];

  const aiInsights: string[] =
    rawAiInsights.length > 0
      ? rawAiInsights
      : [
          `Identified ${input.messages.length} message(s) in thread regarding "${input.subject}".`,
          typeof data.reason === "string"
            ? data.reason
            : "Analysis completed based on message context.",
        ];

  const suggestedAction =
    typeof data.suggestedAction === "string" && data.suggestedAction.trim()
      ? data.suggestedAction
      : actionItems.length > 0
        ? actionItems[0]
        : "Review conversation details";

  const suggestedReply =
    typeof data.suggestedReply === "string" && data.suggestedReply.trim()
      ? data.suggestedReply
      : "Thank you for the update. I have reviewed the details and will proceed accordingly.";

  const summary =
    typeof data.summary === "string" && data.summary.trim()
      ? data.summary
      : input.subject || "Email thread analysis";

  const executiveBrief =
    typeof data.executiveBrief === "string" && data.executiveBrief.trim()
      ? data.executiveBrief
      : summary;

  const deadline = typeof data.deadline === "string" ? data.deadline : null;
  const keyDecisionRequired =
    typeof data.keyDecisionRequired === "string"
      ? data.keyDecisionRequired
      : null;
  const reason =
    typeof data.reason === "string"
      ? data.reason
      : "Evaluated by Priora AI Intelligence.";

  return {
    summary,
    executiveBrief,
    priority,
    category,
    urgencyScore,
    importanceScore,
    actionRequired: Boolean(
      data.actionRequired ?? (actionItems.length > 0 || priority === "urgent")
    ),
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
