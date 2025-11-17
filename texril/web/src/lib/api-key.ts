import crypto from "crypto";

export function generateApiKey() {
  return `tex_${crypto.randomBytes(24).toString("hex")}`;
}

export function hashApiKey(key: string) {
  return crypto.createHash("sha256").update(key).digest("hex");
}
