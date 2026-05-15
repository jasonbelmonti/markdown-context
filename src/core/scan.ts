import {
  documentQueries,
  normalize,
  parse,
  type EngineLinkReference,
} from "@jasonbelmonti/markdown-engine";

import { parseContextUrl } from "./context-url.js";
import type {
  ContextDiagnostic,
  ContextLinkCandidate,
  ScanResult,
  SourceRange,
} from "./types.js";

export function scanMarkdown(markdown: string, filePath?: string): ScanResult {
  const parseResult = parse(markdown, filePath === undefined ? {} : { path: filePath });
  const normalized = normalize(parseResult.parsed, { documentVersion: "1.0.0" });
  const links: ContextLinkCandidate[] = [];
  const diagnostics: ContextDiagnostic[] = [];

  for (const reference of documentQueries.linkReferences(normalized.document)) {
    if (!isContextUrl(reference.url)) {
      continue;
    }

    const sourceRange = reference.sourceRange;
    if (sourceRange === undefined) {
      diagnostics.push({
        code: "ctx.sourceRange.unavailable",
        message: "Context link is missing sourceRange from markdown-engine.",
        severity: "error",
        url: reference.url,
      });
      continue;
    }

    const parsed = parseContextUrl(reference.url, sourceRange);
    diagnostics.push(...parsed.diagnostics);

    if (parsed.parsed === undefined || hasError(parsed.diagnostics)) {
      continue;
    }

    links.push({
      schemaVersion: "markdown-context.scan.v0",
      label: labelForReference(reference),
      url: reference.url,
      canonicalUrl: parsed.parsed.canonicalUrl,
      scheme: parsed.parsed.scheme,
      namespace: parsed.parsed.namespace,
      kind: parsed.parsed.kind,
      id: parsed.parsed.id,
      ...(parsed.parsed.requestedLens !== undefined
        ? { requestedLens: parsed.parsed.requestedLens }
        : {}),
      params: parsed.parsed.params,
      ...(filePath !== undefined ? { sourcePath: filePath } : {}),
      sourceRange: cloneSourceRange(sourceRange),
    });
  }

  return {
    schemaVersion: "markdown-context.scan-result.v0",
    ...(filePath !== undefined ? { filePath } : {}),
    links,
    diagnostics,
  };
}

function isContextUrl(url: string | undefined): url is string {
  return url?.slice(0, 4).toLowerCase() === "ctx:";
}

function hasError(diagnostics: readonly ContextDiagnostic[]): boolean {
  return diagnostics.some((diagnostic) => diagnostic.severity === "error");
}

function labelForReference(reference: EngineLinkReference): string {
  return (
    reference.text ??
    reference.alt ??
    reference.label ??
    reference.identifier ??
    reference.url ??
    ""
  );
}

function cloneSourceRange(sourceRange: SourceRange): SourceRange {
  return {
    start: { ...sourceRange.start },
    end: { ...sourceRange.end },
  };
}
