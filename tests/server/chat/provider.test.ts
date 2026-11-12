import { describe, expect, it } from "vitest";
import {
  CUSTOM_PROVIDER_OPTIONS,
  CUSTOM_PROVIDER_OPTIONS_KEY,
  assertSafeProviderUrl,
  isPrivateAddress,
  normalizeBaseUrl,
} from "@/server/chat/provider";

const publicResolver = async () => ["104.18.0.1"];

describe("provider URL validation", () => {
  it("accepts a public https endpoint", async () => {
    await expect(
      assertSafeProviderUrl("https://api.openai.com/v1", {
        production: true,
        resolve: publicResolver,
      }),
    ).resolves.toBeInstanceOf(URL);
  });

  it("rejects http in production", async () => {
    await expect(
      assertSafeProviderUrl("http://api.openai.com/v1", {
        production: true,
        resolve: publicResolver,
      }),
    ).rejects.toThrow(/https/);
  });

  it("rejects localhost and private literals in production", async () => {
    for (const url of [
      "https://localhost:11434/v1",
      "https://127.0.0.1/v1",
      "https://10.0.0.5/v1",
      "https://192.168.1.20/v1",
      "https://169.254.169.254/latest",
    ]) {
      await expect(
        assertSafeProviderUrl(url, {
          production: true,
          resolve: publicResolver,
        }),
      ).rejects.toThrow(/not allowed/);
    }
  });

  it("rejects a public hostname that resolves to a private address", async () => {
    await expect(
      assertSafeProviderUrl("https://evil.example.com/v1", {
        production: true,
        resolve: async () => ["10.0.0.7"],
      }),
    ).rejects.toThrow(/private address/);
  });

  it("rejects credentials in the URL", async () => {
    await expect(
      assertSafeProviderUrl("https://user:pass@api.example.com/v1", {
        production: true,
        resolve: publicResolver,
      }),
    ).rejects.toThrow(/credentials/);
  });

  it("allows localhost http only in development", async () => {
    await expect(
      assertSafeProviderUrl("http://localhost:11434/v1", {
        production: false,
      }),
    ).resolves.toBeInstanceOf(URL);
    await expect(
      assertSafeProviderUrl("http://127.0.0.1:11434/v1", {
        production: false,
      }),
    ).resolves.toBeInstanceOf(URL);
    await expect(
      assertSafeProviderUrl("http://api.example.com/v1", {
        production: false,
      }),
    ).rejects.toThrow(/https/);
  });

  it("detects private IPv4 and IPv6 ranges", () => {
    expect(isPrivateAddress("10.1.2.3")).toBe(true);
    expect(isPrivateAddress("172.16.0.1")).toBe(true);
    expect(isPrivateAddress("192.168.0.1")).toBe(true);
    expect(isPrivateAddress("169.254.169.254")).toBe(true);
    expect(isPrivateAddress("::1")).toBe(true);
    expect(isPrivateAddress("fc00::1")).toBe(true);
    expect(isPrivateAddress("8.8.8.8")).toBe(false);
  });

  it("normalizes trailing slashes", () => {
    expect(normalizeBaseUrl("https://api.openai.com/v1/")).toBe(
      "https://api.openai.com/v1",
    );
  });
});

describe("custom provider request options", () => {
  it("requests the lowest reasoning effort", () => {
    expect(CUSTOM_PROVIDER_OPTIONS).toEqual({
      [CUSTOM_PROVIDER_OPTIONS_KEY]: { reasoningEffort: "low" },
    });
  });
});
