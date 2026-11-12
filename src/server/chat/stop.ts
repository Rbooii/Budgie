/** Hard safety cap; the natural stop is a step with no tool calls. */
export const MAX_CHAT_STEPS = 8;

type StepLike = { toolCalls: readonly unknown[] };

/**
 * Continue the tool loop while the model is still calling tools. The old
 * `stepCountIs(4)` stopped right after the fourth tool result, before the model
 * could write its answer. This stops only once a step produces no tool calls.
 *
 * Used as `stopWhen: ({ steps }) => shouldStopChat({ steps })` in the route so
 * the callback inherits the exact tool-set types from `streamText`.
 */
export function shouldStopChat({ steps }: { steps: readonly StepLike[] }): boolean {
  if (steps.length >= MAX_CHAT_STEPS) return true;
  const last = steps[steps.length - 1];
  return !last || last.toolCalls.length === 0;
}
