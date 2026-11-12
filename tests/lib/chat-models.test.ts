import { describe, it, expect } from "vitest";
import {
  CUSTOM_MODEL_ID,
  DEFAULT_MODEL,
  MODEL_CHAIN,
  MODEL_LABELS,
  isCustomModel,
  isRateLimitError,
  modelLabel,
  modelSelectionLabel,
  resolveChatModel,
  resolveModel,
  thinkingConfigFor,
} from "@/lib/chat-models";

describe("modelLabel", () => {
  it("maps model ids to display names", () => {
    expect(modelLabel("gemini-2.5-flash")).toBe("Gemini 2.5 Flash");
    expect(modelLabel("gemini-3.5-flash-lite")).toBe("Gemini 3.5 Flash Lite");
  });

  it("covers every model in the chain", () => {
    for (const id of MODEL_CHAIN) {
      expect(MODEL_LABELS[id]).toBeTruthy();
    }
  });

  it("falls back to the raw id for unknown models", () => {
    expect(modelLabel("mystery-model" as never)).toBe("mystery-model");
  });
});

describe("resolveModel", () => {
  it("returns the default for unknown input", () => {
    expect(resolveModel(undefined)).toBe(DEFAULT_MODEL);
    expect(resolveModel("")).toBe(DEFAULT_MODEL);
    expect(resolveModel("gpt-4o")).toBe(DEFAULT_MODEL);
    expect(resolveModel(42)).toBe(DEFAULT_MODEL);
    expect(resolveModel({})).toBe(DEFAULT_MODEL);
  });

  it("accepts only allowlisted models", () => {
    expect(resolveModel("gemini-2.5-flash")).toBe("gemini-2.5-flash");
    expect(resolveModel("gemini-3.5-flash-lite")).toBe("gemini-3.5-flash-lite");
  });

  it("exposes a two-step chain ending at the lite model", () => {
    expect(MODEL_CHAIN).toEqual([
      "gemini-2.5-flash",
      "gemini-3.5-flash-lite",
    ]);
  });
});

describe("isRateLimitError", () => {
  it("matches quota and 429 errors", () => {
    expect(
      isRateLimitError(
        new Error("You exceeded your current quota, please check your plan"),
      ),
    ).toBe(true);
    expect(isRateLimitError(new Error("AI_APICallError: 429 rate limit"))).toBe(true);
    expect(isRateLimitError(new Error("RESOURCE_EXHAUSTED"))).toBe(true);
    expect(isRateLimitError(new Error("rate-limit exceeded"))).toBe(true);
    expect(isRateLimitError("quota exceeded")).toBe(true);
  });

  it("does not match unrelated errors", () => {
    expect(isRateLimitError(new Error("boom"))).toBe(false);
    expect(isRateLimitError(new Error("Insufficient balance"))).toBe(false);
    expect(isRateLimitError(undefined)).toBe(false);
    expect(isRateLimitError(null)).toBe(false);
  });
});

describe("thinkingConfigFor", () => {
  it("caps thinking on the primary model", () => {
    expect(thinkingConfigFor("gemini-2.5-flash")).toEqual({
      thinkingBudget: 256,
      includeThoughts: true,
    });
  });

  it("disables thinking on the lite model", () => {
    expect(thinkingConfigFor("gemini-3.5-flash-lite")).toEqual({
      includeThoughts: false,
    });
  });
});
describe("custom model selection", () => {
  it("resolves the custom sentinel and rejects arbitrary ids", () => {
    expect(resolveChatModel(CUSTOM_MODEL_ID)).toBe(CUSTOM_MODEL_ID);
    expect(resolveChatModel("gpt-4o")).toBe(DEFAULT_MODEL);
    expect(resolveChatModel("gemini-3.5-flash-lite")).toBe(
      "gemini-3.5-flash-lite",
    );
  });

  it("labels a custom model with its configured label", () => {
    expect(isCustomModel(CUSTOM_MODEL_ID)).toBe(true);
    expect(isCustomModel(DEFAULT_MODEL)).toBe(false);
    expect(modelSelectionLabel(CUSTOM_MODEL_ID, "My model")).toBe("My model");
    expect(modelSelectionLabel(CUSTOM_MODEL_ID)).toBe("Your model");
    expect(modelSelectionLabel(DEFAULT_MODEL)).toBe("Gemini 2.5 Flash");
  });
});
