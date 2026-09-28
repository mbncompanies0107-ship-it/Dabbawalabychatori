import crypto from "crypto";

export interface SessionPayload {
  uid: string;
  role: "CUSTOMER" | "ADMIN" | "STORE_OPERATOR" | "RIDER";
  exp: number;
}

function secret(): string {
  return process.env.JWT_SECRET || "demo-only-not-for-production";
}

export function signSession(payload: Omit<SessionPayload, "exp">, days = 14): string {
  const body = Buffer.from(
    JSON.stringify({ ...payload, exp: Date.now() + days * 24 * 60 * 60 * 1000 }),
  ).toString("base64url");
  const sig = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function readSession(token: string | null | undefined): SessionPayload | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  const left = Buffer.from(sig);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !crypto.timingSafeEqual(left, right)) return null;
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString()) as SessionPayload;
    if (!data.exp || data.exp < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

export function tokenFromRequest(req: Request): string | null {
  const header = req.headers.get("authorization");
  if (header?.toLowerCase().startsWith("bearer ")) return header.slice(7).trim();
  const cookie = req.headers.get("cookie") || "";
  const match = cookie.match(/(?:^|;\s*)mi_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function cartIdFromRequest(req: Request): string | null {
  const cookie = req.headers.get("cookie") || "";
  const match = cookie.match(/(?:^|;\s*)mi_cart=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}
