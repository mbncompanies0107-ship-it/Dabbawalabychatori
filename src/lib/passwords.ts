import crypto from "crypto";

export const DEMO_PASSWORD = "MiniIndiaDemo!";

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const verify = crypto.scryptSync(password, salt, 32);
  const left = Buffer.from(hash, "hex");
  if (left.length !== verify.length) return false;
  return crypto.timingSafeEqual(left, verify);
}
