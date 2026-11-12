import {
  createCipheriv,
  createDecipheriv,
  hkdfSync,
  randomBytes,
} from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;
const KEY_BYTES = 32;
const HKDF_INFO = "budgie:chat-provider-key";
const HKDF_SALT = "budgie:chat-provider-salt";

function encryptionSecret(): string {
  const secret =
    process.env.AI_KEY_ENCRYPTION_SECRET?.trim() ||
    process.env.BETTER_AUTH_SECRET?.trim();
  if (!secret) {
    throw new Error(
      "Missing AI_KEY_ENCRYPTION_SECRET (or BETTER_AUTH_SECRET) for chat provider encryption",
    );
  }
  return secret;
}

function encryptionKey(): Buffer {
  return Buffer.from(
    hkdfSync("sha256", encryptionSecret(), HKDF_SALT, HKDF_INFO, KEY_BYTES),
  );
}

export type EncryptedSecret = {
  ciphertext: string;
  iv: string;
  tag: string;
};

/** Encrypt a provider API key. Values are base64 so they fit Prisma strings. */
export function encryptSecret(plaintext: string): EncryptedSecret {
  if (!plaintext) throw new Error("Cannot encrypt an empty secret");
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, encryptionKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  return {
    ciphertext: ciphertext.toString("base64"),
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
  };
}

/** Decrypt a stored provider API key. Throws when the secret/tag is invalid. */
export function decryptSecret(encrypted: EncryptedSecret): string {
  const decipher = createDecipheriv(
    ALGORITHM,
    encryptionKey(),
    Buffer.from(encrypted.iv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(encrypted.tag, "base64"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(encrypted.ciphertext, "base64")),
    decipher.final(),
  ]);
  return plaintext.toString("utf8");
}

/** True when the env has a usable encryption secret. */
export function hasEncryptionSecret(): boolean {
  return Boolean(
    process.env.AI_KEY_ENCRYPTION_SECRET?.trim() ||
      process.env.BETTER_AUTH_SECRET?.trim(),
  );
}
