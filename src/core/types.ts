import type { ContextLockfile } from "../lockfile/types.js";

export interface SourcePosition {
  line: number;
  column: number;
  offset?: number;
}

export interface SourceRange {
  start: SourcePosition;
  end: SourcePosition;
}

export type ContextDiagnosticSeverity = "error" | "warning" | "info";

export interface ContextDiagnostic {
  code: string;
  message: string;
  severity: ContextDiagnosticSeverity;
  sourceRange?: SourceRange;
  url?: string;
}

export interface ContextLinkCandidate {
  schemaVersion: "markdown-context.scan.v0";
  label: string;
  url: string;
  canonicalUrl: string;
  scheme: string;
  namespace: string;
  kind: string;
  id: string;
  requestedLens?: string;
  params: Record<string, string>;
  sourcePath?: string;
  sourceRange: SourceRange;
}

export interface ScanResult {
  schemaVersion: "markdown-context.scan-result.v0";
  filePath?: string;
  links: ContextLinkCandidate[];
  diagnostics: ContextDiagnostic[];
}

export interface ValidatedContextLink extends ContextLinkCandidate {
  selectedLens: string;
}

export interface ValidateResult {
  schemaVersion: "markdown-context.validate-result.v0";
  valid: boolean;
  links: ValidatedContextLink[];
  diagnostics: ContextDiagnostic[];
}

export interface RepoPathSourceIdentity {
  kind: "repo/path";
  path: string;
  contentHash: string;
}

export interface RepoPathLensArtifact {
  schemaVersion: "markdown-context.lens.v0";
  canonicalUrl: string;
  selectedLens: string;
  resolverId: "repo-path";
  resolverVersion: "0.1.0";
  sourceIdentity: RepoPathSourceIdentity;
  contentHash: string;
  citations: Array<{
    sourcePath?: string;
    sourceRange: SourceRange;
  }>;
  sourceTrust: "untrusted-source-data";
  sourceContentBoundary: "source-data";
  content: {
    format: "markdown";
    text: string;
  };
}

export interface ResolveResult {
  schemaVersion: "markdown-context.resolve-result.v0";
  artifacts: RepoPathLensArtifact[];
  diagnostics: ContextDiagnostic[];
  lockfile?: ContextLockfile;
}
