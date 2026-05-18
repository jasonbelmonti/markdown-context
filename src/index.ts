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
export type { Registry, RegistryResource } from "./registry/registry.js";
export type { ResolveScanResultOptions } from "./pipeline/resolve.js";
export { scanMarkdown } from "./core/scan.js";
export { loadRegistry, validateScanResult } from "./registry/registry.js";
export { resolveScanResult } from "./pipeline/resolve.js";
