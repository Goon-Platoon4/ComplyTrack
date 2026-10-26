
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "node:crypto";

function getEncryptionKey() {
  const value = process.env.MFA_ENCRYPTION_KEY;

  if (!value) {
    throw new Error("MFA_ENCRYPTION_KEY is not configured");
  }

  const key = Buffer.from(value, "base64");

  if (
    key.length !== 32 ||
    key.toString("base64") !== value
  ) {
    throw new Error(
      "MFA_ENCRYPTION_KEY must be a valid Base64-encoded 32-byte key",
    );
  }

  return key;
}

export function encryptSecret(plainText) {
  if (typeof plainText !== "string" || plainText.length === 0) {
    throw new Error("Secret must be a non-empty string");
  }

  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);

  const encrypted = Buffer.concat([
    cipher.update(plainText, "utf8"),
    cipher.final(),
  ]);

  return [
    iv.toString("base64url"),
    cipher.getAuthTag().toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

export function decryptSecret(value) {
  if (typeof value !== "string") {
    throw new Error("Encrypted secret must be a string");
  }

  const parts = value.split(".");

  if (parts.length !== 3 || parts.some((part) => !part)) {
    throw new Error("Encrypted secret is malformed");
  }

  const [ivPart, tagPart, encryptedPart] = parts;
  const iv = Buffer.from(ivPart, "base64url");
  const tag = Buffer.from(tagPart, "base64url");
  const encrypted = Buffer.from(encryptedPart, "base64url");

  if (iv.length !== 12 || tag.length !== 16 || encrypted.length === 0) {
    throw new Error("Encrypted secret has invalid component lengths");
  }

  const decipher = createDecipheriv("aes-256-gcm", getEncryptionKey(), iv);
  decipher.setAuthTag(tag);

  return Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]).toString("utf8");
}
