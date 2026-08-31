import {
  analyzeEmailThreadWithGroq,
  generateDraftWithGroq,
  generateNewEmailDraftWithGroq,
  testGroqConnection,
  ThreadMessageInput,
  ThreadAnalysisInput,
  GROQ_MODEL,
  isAIAvailable,
} from "./groq";

export type { ThreadMessageInput, ThreadAnalysisInput };

export const GEMINI_MODEL = GROQ_MODEL;

export async function testGeminiConnection(): Promise<{
  success: boolean;
  model: string;
  message: string;
  latencyMs?: number;
}> {
  const result = await testGroqConnection();
  return {
    success: result.success,
    model: result.model,
    message: result.message,
    latencyMs: result.latencyMs,
  };
}

export const analyzeEmailThreadWithGemini = analyzeEmailThreadWithGroq;
export const generateDraftWithGemini = generateDraftWithGroq;
export const generateNewEmailDraftWithGemini = generateNewEmailDraftWithGroq;
export { isAIAvailable };
