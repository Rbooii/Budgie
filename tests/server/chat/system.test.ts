import { describe, it, expect } from "vitest";
import { buildSystemPrompt } from "@/server/chat/system";

describe("buildSystemPrompt", () => {
  const prompt = buildSystemPrompt({
    userName: "Raka",
    now: new Date("2026-08-18T10:00:00Z"),
  });

  it("includes the user name", () => {
    expect(prompt).toContain("Raka");
  });

  it("includes today's date", () => {
    expect(prompt).toContain("18 August 2026");
  });

  it("instructs the model to reply in the user's language", () => {
    expect(prompt).toContain("same language the user writes in");
  });

  it("forbids inventing financial data", () => {
    expect(prompt).toMatch(/never invent/i);
  });

  it("requires explicit user intent before creating a transaction", () => {
    expect(prompt).toMatch(/explicitly asked/i);
    expect(prompt).toMatch(/create_transaction/i);
  });

  it("requires a real account id from the tool", () => {
    expect(prompt).toContain("never fabricate one");
  });

  it("formats money as Rupiah", () => {
    expect(prompt).toContain("Rp 1.234.567");
  });

  it("instructs concise answers", () => {
    expect(prompt).toContain("2-3 short sentences");
  });

  it("forbids inventing financial data", () => {
    expect(prompt).toMatch(/never invent/i);
  });
});