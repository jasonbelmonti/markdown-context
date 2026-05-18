export type {
  ContextDiagnostic,
  ContextLinkCandidate,
  RepoPathLensArtifact,
  RepoPathSourceIdentity,
  ResolveResult,
  ScanResult,
  SourceRange,
  ValidatedContextLink,
  ValidateResult,
} from "./core/types.js";
export type {
  CanonicalJsonObject,
  CanonicalJsonPrimitive,
  CanonicalJsonValue,
} from "./lockfile/canonical-json.js";
export type {
  ContextLockfile,
  ContextLockfileRecord,
  LockfileSourceIdentity,
  Sha256Hash,
} from "./lockfile/types.js";
export type { Registry, RegistryResource } from "./registry/registry.js";
export type { ResolveScanResultOptions } from "./pipeline/resolve.js";
export { scanMarkdown } from "./core/scan.js";
export {
  cloneCanonicalJsonObject,
  serializeCanonicalJson,
} from "./lockfile/canonical-json.js";
export { hashCanonicalJson, hashUtf8Bytes } from "./lockfile/hash.js";
export {
  createContextLockfile,
  createContextLockfileRecord,
  hashContextLockfile,
  hashRegistry,
  serializeCanonicalRegistry,
  serializeContextLockfile,
} from "./lockfile/lockfile.js";
export { loadRegistry, validateScanResult } from "./registry/registry.js";
export { resolveScanResult } from "./pipeline/resolve.js";
