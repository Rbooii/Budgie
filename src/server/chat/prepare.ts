import { isDynamicToolUIPart, isReasoningUIPart, isToolUIPart, type UIMessage } from "ai";

const MAX_HISTORY = 10;
const KEEP_TOOL_TURNS = 2;
const KEEP_REASONING_TURNS = 1;

export function prepareMessagesForApi(messages: UIMessage[]): UIMessage[] {
  const trimmed = messages.slice(-MAX_HISTORY);
  const toolBoundary = Math.max(0, trimmed.length - KEEP_TOOL_TURNS);
  const reasoningBoundary = Math.max(0, trimmed.length - KEEP_REASONING_TURNS);

  return trimmed.map((message, index) => {
    const keepTools = index >= toolBoundary;
    const keepReasoning = index >= reasoningBoundary;
    if (keepTools && keepReasoning) return message;

    const parts = message.parts.filter((part) => {
      if (!keepTools && (isToolUIPart(part) || isDynamicToolUIPart(part))) {
        return false;
      }
      if (!keepReasoning && isReasoningUIPart(part)) {
        return false;
      }
      return true;
    });

    if (parts.length === message.parts.length) return message;
    return { ...message, parts };
  });
}