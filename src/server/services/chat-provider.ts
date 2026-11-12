import { prisma } from "@/lib/prisma";
import { decryptSecret, encryptSecret } from "@/server/crypto";
import {
  assertSafeProviderUrl,
  normalizeBaseUrl,
  testCustomProvider,
} from "@/server/chat/provider";

export type ChatProviderPublic = {
  configured: boolean;
  baseUrl: string | null;
  model: string | null;
  label: string | null;
  hasKey: boolean;
};

export type ChatProviderSecret = {
  baseUrl: string;
  model: string;
  apiKey: string;
};

function toPublic(row: {
  baseUrl: string;
  model: string;
  label: string | null;
} | null): ChatProviderPublic {
  if (!row) {
    return {
      configured: false,
      baseUrl: null,
      model: null,
      label: null,
      hasKey: false,
    };
  }
  return {
    configured: true,
    baseUrl: row.baseUrl,
    model: row.model,
    label: row.label,
    hasKey: true,
  };
}

export async function getChatProviderPublic(
  userId: string,
): Promise<ChatProviderPublic> {
  const row = await prisma.chatProviderConfig.findUnique({
    where: { userId },
    select: { baseUrl: true, model: true, label: true },
  });
  return toPublic(row);
}

/** Server-only: decrypts the key for the chat route. Never expose this. */
export async function getChatProviderSecret(
  userId: string,
): Promise<ChatProviderSecret | null> {
  const row = await prisma.chatProviderConfig.findUnique({
    where: { userId },
  });
  if (!row) return null;

  try {
    return {
      baseUrl: row.baseUrl,
      model: row.model,
      apiKey: decryptSecret({
        ciphertext: row.keyCipher,
        iv: row.keyIv,
        tag: row.keyTag,
      }),
    };
  } catch {
    throw new Error(
      "Stored provider key cannot be decrypted. Reconnect your model in settings.",
    );
  }
}

export async function saveChatProvider(
  userId: string,
  input: {
    baseUrl: string;
    model: string;
    label?: string;
    apiKey?: string;
  },
): Promise<ChatProviderPublic> {
  await assertSafeProviderUrl(input.baseUrl);
  const baseUrl = normalizeBaseUrl(input.baseUrl);
  const model = input.model.trim();
  const label = input.label?.trim() || null;
  const apiKey = input.apiKey?.trim();

  const existing = await prisma.chatProviderConfig.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!apiKey && !existing) {
    throw new Error("API key is required");
  }

  if (apiKey) {
    const encrypted = encryptSecret(apiKey);
    await prisma.chatProviderConfig.upsert({
      where: { userId },
      create: {
        userId,
        baseUrl,
        model,
        label,
        keyCipher: encrypted.ciphertext,
        keyIv: encrypted.iv,
        keyTag: encrypted.tag,
      },
      update: {
        baseUrl,
        model,
        label,
        keyCipher: encrypted.ciphertext,
        keyIv: encrypted.iv,
        keyTag: encrypted.tag,
      },
    });
  } else {
    await prisma.chatProviderConfig.update({
      where: { userId },
      data: { baseUrl, model, label },
    });
  }

  return getChatProviderPublic(userId);
}

export async function deleteChatProvider(userId: string): Promise<void> {
  await prisma.chatProviderConfig.deleteMany({ where: { userId } });
}

/**
 * Validate a draft (or the saved config) with a tiny completion. The key is
 * never returned; only success/failure reaches the client.
 */
export async function testChatProvider(
  userId: string,
  input: {
    baseUrl: string;
    model: string;
    apiKey?: string;
  },
): Promise<void> {
  await assertSafeProviderUrl(input.baseUrl);

  let apiKey = input.apiKey?.trim();
  if (!apiKey) {
    const saved = await getChatProviderSecret(userId);
    if (!saved) throw new Error("API key is required");
    apiKey = saved.apiKey;
  }

  await testCustomProvider({
    baseUrl: normalizeBaseUrl(input.baseUrl),
    model: input.model.trim(),
    apiKey,
  });
}
