import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  decryptSecret,
  encryptSecret,
  hasEncryptionSecret,
} from "@/server/crypto";

beforeEach(() => {
  process.env.AI_KEY_ENCRYPTION_SECRET = "unit-test-secret";
});

afterEach(() => {
  delete process.env.AI_KEY_ENCRYPTION_SECRET;
});

describe("chat provider secret encryption", () => {
  it("round-trips a secret", () => {
    const encrypted = encryptSecret("sk-live-123456");
    expect(encrypted.ciphertext).not.toContain("sk-live");
    expect(decryptSecret(encrypted)).toBe("sk-live-123456");
  });

  it("uses a fresh IV per encryption", () => {
    const first = encryptSecret("same-key");
    const second = encryptSecret("same-key");
    expect(first.iv).not.toBe(second.iv);
    expect(first.ciphertext).not.toBe(second.ciphertext);
  });

  it("rejects a tampered tag", () => {
    const encrypted = encryptSecret("same-key");
    expect(() =>
      decryptSecret({ ...encrypted, tag: Buffer.from("tampered").toString("base64") }),
    ).toThrow();
  });

  it("reports whether a secret is configured", () => {
    expect(hasEncryptionSecret()).toBe(true);
    delete process.env.AI_KEY_ENCRYPTION_SECRET;
    delete process.env.BETTER_AUTH_SECRET;
    expect(hasEncryptionSecret()).toBe(false);
  });

  it("requires a secret to encrypt", () => {
    delete process.env.AI_KEY_ENCRYPTION_SECRET;
    delete process.env.BETTER_AUTH_SECRET;
    expect(() => encryptSecret("x")).toThrow(/Missing AI_KEY_ENCRYPTION_SECRET/);
  });
});
