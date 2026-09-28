import crypto from "crypto";

export function idFrom(seed: string): string {
  const hex = crypto.createHash("sha256").update(`mini-india:${seed}`).digest("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

export function newId(): string {
  return crypto.randomUUID();
}
