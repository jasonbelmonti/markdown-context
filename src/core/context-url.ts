import type { ContextDiagnostic, SourceRange } from "./types.js";

export interface ParsedContextUrl {
  canonicalUrl: string;
  scheme: string;
  namespace: string;
  kind: string;
  id: string;
  requestedLens?: string;
  params: Record<string, string>;
}

export function parseContextUrl(
  rawUrl: string,
  sourceRange?: SourceRange,
): { parsed?: ParsedContextUrl; diagnostics: ContextDiagnostic[] } {
  let url: URL;

  try {
    url = new URL(rawUrl);
  } catch {
    return {
      diagnostics: [
        diagnostic("ctx.url.invalid", `Invalid context URL: ${rawUrl}`, rawUrl, sourceRange),
      ],
    };
  }

  const scheme = url.protocol.replace(/:$/, "").toLowerCase();
  if (scheme !== "ctx") {
    return { diagnostics: [] };
  }

  let pathSegments: string[];
  const namespace = url.hostname.toLowerCase();
  try {
    pathSegments = url.pathname
      .split("/")
      .filter((segment) => segment.length > 0)
      .map((segment) => decodeURIComponent(segment));
  } catch {
    return {
      diagnostics: [
        diagnostic("ctx.url.invalid", `Invalid context URL: ${rawUrl}`, rawUrl, sourceRange),
      ],
    };
  }
  const [kind, ...idSegments] = pathSegments;

  if (namespace.length === 0 || kind === undefined || idSegments.length === 0) {
    return {
      diagnostics: [
        diagnostic(
          "ctx.url.incomplete",
          "Context URL must include namespace, kind, and id.",
          rawUrl,
          sourceRange,
        ),
      ],
    };
  }

  const params = emptyStringRecord();
  let requestedLens: string | undefined;
  const diagnostics: ContextDiagnostic[] = [];
  const seen = new Set<string>();

  for (const [key, value] of url.searchParams.entries()) {
    if (seen.has(key)) {
      diagnostics.push(
        diagnostic(
          "ctx.param.duplicate",
          `Duplicate context URL parameter: ${key}`,
          rawUrl,
          sourceRange,
        ),
      );
      continue;
    }
    seen.add(key);

    if (key === "lens") {
      requestedLens = value;
    } else {
      params[key] = value;
    }
  }

  const parsedWithoutCanonical: Omit<ParsedContextUrl, "canonicalUrl"> = {
    scheme,
    namespace,
    kind,
    id: idSegments.join("/"),
    ...(requestedLens !== undefined ? { requestedLens } : {}),
    params: sortedRecord(params),
  };
  const parsed: ParsedContextUrl = {
    canonicalUrl: canonicalContextUrl(parsedWithoutCanonical),
    ...parsedWithoutCanonical,
  };

  return { parsed, diagnostics };
}

function canonicalContextUrl(input: Omit<ParsedContextUrl, "canonicalUrl">): string {
  const idPath = input.id
    .split("/")
    .filter((segment) => segment.length > 0)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  const params = new URLSearchParams();
  const queryEntries: Array<[string, string]> = [];

  if (input.requestedLens !== undefined && input.requestedLens.length > 0) {
    queryEntries.push(["lens", input.requestedLens]);
  }

  for (const key of Object.keys(input.params).sort()) {
    queryEntries.push([key, input.params[key] ?? ""]);
  }

  for (const [key, value] of queryEntries.sort(compareQueryEntries)) {
    params.append(key, value);
  }

  const query = params.toString();

  return `ctx://${input.namespace}/${input.kind}/${idPath}${query.length > 0 ? `?${query}` : ""}`;
}

function compareQueryEntries(
  [leftKey, leftValue]: [string, string],
  [rightKey, rightValue]: [string, string],
): number {
  const keyOrder = leftKey.localeCompare(rightKey);

  if (keyOrder !== 0) {
    return keyOrder;
  }

  return leftValue.localeCompare(rightValue);
}

function sortedRecord(record: Record<string, string>): Record<string, string> {
  const sorted = emptyStringRecord();

  for (const key of Object.keys(record).sort()) {
    sorted[key] = record[key] ?? "";
  }

  return sorted;
}

function emptyStringRecord(): Record<string, string> {
  return Object.create(null) as Record<string, string>;
}

function diagnostic(
  code: string,
  message: string,
  url: string,
  sourceRange?: SourceRange,
): ContextDiagnostic {
  return {
    code,
    message,
    severity: "error",
    url,
    ...(sourceRange !== undefined ? { sourceRange } : {}),
  };
}
