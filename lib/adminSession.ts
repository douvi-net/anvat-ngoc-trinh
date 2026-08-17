const ADMIN_COOKIE_NAME = "avnt_admin_auth";
const SESSION_VERSION = "v1";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

const encoder = new TextEncoder();

function getSessionSecret() {
  return String(
    process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || ""
  ).trim();
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlToBytes(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    "="
  );
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

async function importHmacKey(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function createAdminSessionToken() {
  const secret = getSessionSecret();
  if (!secret) {
    throw new Error(
      "Missing ADMIN_SESSION_SECRET (or ADMIN_PASSWORD fallback) for admin session."
    );
  }

  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = `${SESSION_VERSION}.${expiresAt}`;
  const key = await importHmacKey(secret);
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payload)
  );

  return `${payload}.${bytesToBase64Url(new Uint8Array(signature))}`;
}

export async function isAdminSessionTokenValid(token: string | null | undefined) {
  if (!token) return false;

  const secret = getSessionSecret();
  if (!secret) return false;

  const [version, expiresAtRaw, signatureRaw, ...extra] = token.split(".");
  if (
    version !== SESSION_VERSION ||
    !expiresAtRaw ||
    !signatureRaw ||
    extra.length > 0
  ) {
    return false;
  }

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || expiresAt <= Math.floor(Date.now() / 1000)) {
    return false;
  }

  try {
    const key = await importHmacKey(secret);
    const payload = `${version}.${expiresAtRaw}`;

    return await crypto.subtle.verify(
      "HMAC",
      key,
      base64UrlToBytes(signatureRaw),
      encoder.encode(payload)
    );
  } catch {
    return false;
  }
}

export { ADMIN_COOKIE_NAME, SESSION_TTL_SECONDS };
