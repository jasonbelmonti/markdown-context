import { createHash } from "node:crypto";

import { serializeCanonicalJson } from "./canonical-json.js";
import type { Sha256Hash } from "./types.js";

export function hashUtf8Bytes(content: string): Sha256Hash {
  return sha256(content);
}

export function hashCanonicalJson(value: unknown): Sha256Hash {
  return hashUtf8Bytes(serializeCanonicalJson(value));
}

function sha256(content: string): Sha256Hash {
  return `sha256:${createHash("sha256").update(content, "utf8").digest("hex")}`;
}
