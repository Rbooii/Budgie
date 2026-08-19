export const MODEL_CHAIN = [
  "gemini-2.5-flash",
  "gemini-3.5-flash-lite",
] as const;

export type ChatModelId = (typeof MODEL_CHAIN)[number];

export const DEFAULT_MODEL: ChatModelId = MODEL_CHAIN[0];

export const MODEL_LABELS: Record<ChatModelId, string> = {
  "gemini-2.5-flash": "Gemini 2.5 Flash",
  "gemini-3.5-flash-lite": "Gemini 3.5 Flash Lite",
};

export function modelLabel(model: ChatModelId): string {
  return MODEL_LABELS[model] ?? model;
}

export function resolveModel(input: unknown): ChatModelId {
  if (typeof input === "string" && (MODEL_CHAIN as readonly string[]).includes(input)) {
    return input as ChatModelId;
  }
  return DEFAULT_MODEL;
}

export function isRateLimitError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  const haystack = message.toLowerCase();
  return (
    haystack.includes("429") ||
    haystack.includes("quota") ||
    haystack.includes("resource_exhausted") ||
    haystack.includes("rate limit") ||
    haystack.includes("rate-limit")
  );
}

export function thinkingConfigFor(model: ChatModelId): {
  thinkingBudget?: number;
  includeThoughts?: boolean;
} {
  if (model === DEFAULT_MODEL) {
    return { thinkingBudget: 256, includeThoughts: true };
  }
  return { includeThoughts: false };
}