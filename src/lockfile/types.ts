import type { CanonicalJsonObject, CanonicalJsonValue } from "./canonical-json.js";

export type Sha256Hash = `sha256:${string}`;

export interface LockfileSourceIdentity {
  kind: string;
  [key: string]: CanonicalJsonValue;
}

export interface ContextLockfileRecord {
  schemaVersion: "markdown-context.lockfile-record.v0";
  canonicalUrl: string;
  selectedLens: string;
  artifactPath: string;
  artifactHash: Sha256Hash;
  registryId: string;
  registryVersion: string;
  registryHash: Sha256Hash;
  resolverId: string;
  resolverVersion: string;
  sourceIdentity: LockfileSourceIdentity;
  sourceHash: Sha256Hash;
  outputOptions: CanonicalJsonObject;
}

export interface ContextLockfile {
  schemaVersion: "markdown-context.lockfile.v0";
  records: ContextLockfileRecord[];
}
