import { describe, expect, it } from "vitest";
import {
  MAX_CHAT_STEPS,
  shouldStopChat,
} from "@/server/chat/stop";

const toolStep = { toolCalls: [{}] };
const answerStep = { toolCalls: [] };

describe("chat stop condition", () => {
  it("does not stop after four tool steps", () => {
    expect(
      shouldStopChat({
        steps: [toolStep, toolStep, toolStep, toolStep],
      }),
    ).toBe(false);
  });

  it("stops when a step produces no tool calls", () => {
    expect(
      shouldStopChat({ steps: [toolStep, answerStep] }),
    ).toBe(true);
  });

  it("stops immediately when the first step is an answer", () => {
    expect(shouldStopChat({ steps: [answerStep] })).toBe(true);
  });

  it("stops at the hard safety cap", () => {
    expect(
      shouldStopChat({
        steps: Array.from({ length: MAX_CHAT_STEPS }, () => toolStep),
      }),
    ).toBe(true);
    expect(
      shouldStopChat({
        steps: Array.from({ length: MAX_CHAT_STEPS - 1 }, () => toolStep),
      }),
    ).toBe(false);
  });
});
