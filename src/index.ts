export type {
  ContextDiagnostic,
  ContextLinkCandidate,
  RepoPathLensArtifact,
  RepoPathSourceIdentity,
  ResolveResult,
  ScanResult,
  SourceRange,
  ValidateResult,
} from "./core/types.js";
export { scanMarkdown } from "./core/scan.js";
export { loadRegistry, validateContextLinks } from "./registry/registry.js";
