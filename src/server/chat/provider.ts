import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText, type LanguageModel } from "ai";

export const CUSTOM_PROVIDER_NAME = "budgie-user-provider";

/**
 * The provider options key is camelized by @ai-sdk/openai-compatible; using the
 * raw hyphenated name logs a deprecation warning.
 */
export const CUSTOM_PROVIDER_OPTIONS_KEY = "budgieUserProvider";

/**
 * Lowest reasoning effort for user models (DeepSeek and other compatible APIs).
 * The openai-compatible provider maps `reasoningEffort` to the API's
 * `reasoning_effort` request field.
 */
export const CUSTOM_PROVIDER_OPTIONS = {
  [CUSTOM_PROVIDER_OPTIONS_KEY]: { reasoningEffort: "low" },
} as const;

const REQUEST_TIMEOUT_MS = 60_000;
const TEST_TIMEOUT_MS = 15_000;

type Resolver = (hostname: string) => Promise<string[]>;

const defaultResolver: Resolver = async (hostname) => {
  const addresses = await lookup(hostname, { all: true, verbatim: true });
  return addresses.map((entry) => entry.address);
};

function normalizeHostname(hostname: string): string {
  return hostname
    .toLowerCase()
    .replace(/^\[/, "")
    .replace(/\]$/, "")
    .replace(/\.$/, "");
}

function isLoopback(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname === "::1" ||
    hostname === "0:0:0:0:0:0:0:1"
  );
}

export function isPrivateIpv4(address: string): boolean {
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part))) {
    return false;
  }
  const [a, b] = parts;
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  if (a === 169 && b === 254) return true; // link-local + metadata
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a >= 224) return true; // multicast + reserved
  return false;
}

export function isPrivateIpv6(address: string): boolean {
  const value = normalizeHostname(address);
  if (value === "::" || value === "::1") return true;
  if (value.startsWith("fc") || value.startsWith("fd")) return true; // unique local
  if (/^fe[89ab]/.test(value)) return true; // link-local
  if (value.startsWith("ff")) return true; // multicast
  if (value.startsWith("::ffff:")) {
    return isPrivateIpv4(value.slice("::ffff:".length));
  }
  return false;
}

export function isPrivateAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 4) return isPrivateIpv4(address);
  if (family === 6) return isPrivateIpv6(address);
  return false;
}

function isMetadataHost(hostname: string): boolean {
  return (
    hostname === "metadata.google.internal" ||
    hostname === "169.254.169.254" ||
    hostname === "fd00:ec2::254"
  );
}

function isPrivateHostname(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal")
  );
}

export type ProviderUrlCheck = {
  /** Force production rules (used by tests). Defaults to NODE_ENV. */
  production?: boolean;
  /** DNS resolver override (used by tests). */
  resolve?: Resolver;
};

/**
 * The server performs the provider request, so a user-supplied URL is an SSRF
 * surface. Production allows public HTTPS hosts only; local development may
 * point at localhost or a LAN model server.
 */
export async function assertSafeProviderUrl(
  raw: string,
  options: ProviderUrlCheck = {},
): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("Endpoint must be a valid URL");
  }

  const production = options.production ?? process.env.NODE_ENV === "production";

  if (url.username || url.password) {
    throw new Error("Endpoint must not include credentials");
  }

  const hostname = normalizeHostname(url.hostname);
  if (!hostname) throw new Error("Endpoint must include a hostname");

  const isLocal =
    isLoopback(hostname) ||
    isPrivateHostname(hostname) ||
    isPrivateAddress(hostname);

  if (url.protocol !== "https:") {
    if (!(url.protocol === "http:" && !production && isLocal)) {
      throw new Error("Endpoint must use https");
    }
  }

  if (isMetadataHost(hostname)) {
    throw new Error("Endpoint host is not allowed");
  }

  const family = isIP(hostname);
  if (family !== 0) {
    if (production && isPrivateAddress(hostname)) {
      throw new Error("Endpoint host is not allowed");
    }
    return url;
  }

  if (isPrivateHostname(hostname)) {
    if (production) throw new Error("Endpoint host is not allowed");
    return url;
  }

  if (production) {
    const addresses = await (options.resolve ?? defaultResolver)(hostname);
    if (addresses.length === 0) {
      throw new Error("Endpoint host did not resolve");
    }
    if (addresses.some((address) => isPrivateAddress(address))) {
      throw new Error("Endpoint host resolves to a private address");
    }
  }

  return url;
}

/** Remove trailing slashes so the provider's `/chat/completions` path stays clean. */
export function normalizeBaseUrl(raw: string): string {
  const url = new URL(raw.trim());
  url.hash = "";
  return url.toString().replace(/\/+$/, "");
}

function timeoutSignal(): AbortSignal {
  return AbortSignal.timeout(REQUEST_TIMEOUT_MS);
}

type ProviderFetch = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

function createGuardedFetch(): ProviderFetch {
  return async (input, init) => {
    const rawUrl =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    await assertSafeProviderUrl(rawUrl);
    return fetch(input, {
      ...init,
      signal: init?.signal ?? timeoutSignal(),
    });
  };
}

export function createCustomChatModel(config: {
  baseUrl: string;
  apiKey: string;
  model: string;
}): LanguageModel {
  const provider = createOpenAICompatible({
    name: CUSTOM_PROVIDER_NAME,
    baseURL: normalizeBaseUrl(config.baseUrl),
    apiKey: config.apiKey,
    includeUsage: true,
    // Bun's global fetch type carries a `preconnect` helper; the provider only
    // calls the function, so the narrower signature is safe at runtime.
    fetch: createGuardedFetch() as typeof fetch,
  });
  return provider.chatModel(config.model);
}

/** One tiny round-trip so the settings dialog can verify URL, key and model. */
export async function testCustomProvider(config: {
  baseUrl: string;
  apiKey: string;
  model: string;
}): Promise<void> {
  const model = createCustomChatModel(config);
  await generateText({
    model,
    prompt: "Reply with the single word ok.",
    maxOutputTokens: 16,
    abortSignal: AbortSignal.timeout(TEST_TIMEOUT_MS),
  });
}
