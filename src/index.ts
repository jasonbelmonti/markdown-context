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
export { scanMarkdown } from "./core/scan.js";
export { loadRegistry, validateScanResult } from "./registry/registry.js";
export { resolveRepoPathLink } from "./resolvers/repo-path.js";
