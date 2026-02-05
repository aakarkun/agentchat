import { createHmac } from "crypto";
import type { TokenPayload } from "./types.js";

const DEFAULT_SECRET =
  process.env.AGENTCHAT_TOKEN_SECRET ?? "agentchat-dev-secret-change-in-prod";
const EXPIRY_DAYS = 7;
const SEP = ".";

function getSecret(): string {
  return DEFAULT_SECRET;
}

function base64UrlEncode(str: string): string {
  return Buffer.from(str, "utf8").toString("base64url");
}

function base64UrlDecode(str: string): string {
  return Buffer.from(str, "base64url").toString("utf8");
}

function hmacSign(message: string, secret: string): string {
  return createHmac("sha256", secret).update(message).digest("base64url");
}

export function signToken(username: string): string {
  const secret = getSecret();
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + EXPIRY_DAYS * 24 * 60 * 60;
  const payload: TokenPayload = { username, exp, iat };
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const signature = hmacSign(payloadB64, secret);
  return payloadB64 + SEP + signature;
}

export function verifyToken(token: string): TokenPayload | null {
  const secret = getSecret();
  const idx = token.lastIndexOf(SEP);
  if (idx === -1) return null;
  const payloadB64 = token.slice(0, idx);
  const signature = token.slice(idx + 1);
  const expectedSig = hmacSign(payloadB64, secret);
  if (signature !== expectedSig) return null;
  try {
    const payload = JSON.parse(base64UrlDecode(payloadB64)) as TokenPayload;
    if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    if (typeof payload.username !== "string") return null;
    return payload;
  } catch {
    return null;
  }
}
