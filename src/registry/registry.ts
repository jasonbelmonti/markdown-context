import { readFile } from "node:fs/promises";

import type {
  ContextDiagnostic,
  ContextLinkCandidate,
  ScanResult,
  ValidatedContextLink,
  ValidateResult,
} from "../core/types.js";

export interface Registry {
  schemaVersion: "markdown-context.registry.v0";
  registryId: string;
  registryVersion: string;
  resources: RegistryResource[];
}

export interface RegistryResource {
  scheme: string;
  namespace: string;
  kind: string;
  defaultLens: string;
  lenses: string[];
  params?: string[];
}

export async function loadRegistry(path: string): Promise<Registry> {
  return parseRegistry(JSON.parse(await readFile(path, "utf8")));
}

export function parseRegistry(value: unknown): Registry {
  if (!isRecord(value)) {
    throw new Error("Registry must be a JSON object.");
  }

  const resources = value.resources;
  if (!Array.isArray(resources)) {
    throw new Error("Registry resources must be an array.");
  }

  const schemaVersion = stringValue(value.schemaVersion, "schemaVersion");
  if (schemaVersion !== "markdown-context.registry.v0") {
    throw new Error(`Unsupported registry schemaVersion: ${schemaVersion}.`);
  }

  const parsedResources = resources.map(parseResource);
  validateUniqueResources(parsedResources);

  return {
    schemaVersion,
    registryId: stringValue(value.registryId, "registryId"),
    registryVersion: stringValue(value.registryVersion, "registryVersion"),
    resources: parsedResources,
  };
}

export function validateContextLinks(
  links: readonly ContextLinkCandidate[],
  registry: Registry,
): ValidateResult {
  const validatedLinks: ValidatedContextLink[] = [];
  const diagnostics: ContextDiagnostic[] = [];

  for (const link of links) {
    const resource = registry.resources.find(
      (candidate) =>
        candidate.scheme === link.scheme &&
        candidate.namespace === link.namespace &&
        candidate.kind === link.kind,
    );

    if (resource === undefined) {
      diagnostics.push(linkDiagnostic("ctx.resource.unsupported", "Unsupported context resource.", link));
      continue;
    }

    const allowedParams = new Set(resource.params ?? []);
    const unsupportedParam = Object.keys(link.params).find((key) => !allowedParams.has(key));
    if (unsupportedParam !== undefined) {
      diagnostics.push(
        linkDiagnostic(
          "ctx.param.unsupported",
          `Unsupported context URL parameter: ${unsupportedParam}`,
          link,
        ),
      );
      continue;
    }

    const selectedLens = link.requestedLens ?? resource.defaultLens;
    if (!resource.lenses.includes(selectedLens)) {
      diagnostics.push(
        linkDiagnostic("ctx.lens.unsupported", `Unsupported context lens: ${selectedLens}`, link),
      );
      continue;
    }

    validatedLinks.push({
      ...link,
      selectedLens,
    });
  }

  return {
    schemaVersion: "markdown-context.validate-result.v0",
    valid: diagnostics.every((diagnostic) => diagnostic.severity !== "error"),
    links: validatedLinks,
    diagnostics,
  };
}

export function validateScanResult(scanResult: ScanResult, registry: Registry): ValidateResult {
  if (hasError(scanResult.diagnostics)) {
    return {
      schemaVersion: "markdown-context.validate-result.v0",
      valid: false,
      links: [],
      diagnostics: scanResult.diagnostics,
    };
  }

  const validateResult = validateContextLinks(scanResult.links, registry);
  const diagnostics = [...scanResult.diagnostics, ...validateResult.diagnostics];

  return {
    ...validateResult,
    valid: !hasError(diagnostics),
    diagnostics,
  };
}

function parseResource(value: unknown): RegistryResource {
  if (!isRecord(value)) {
    throw new Error("Registry resource must be an object.");
  }

  const params = value.params;
  const defaultLens = stringValue(value.defaultLens, "resource.defaultLens");
  const lenses = nonEmptyUniqueStringArray(value.lenses, "resource.lenses");
  if (!lenses.includes(defaultLens)) {
    throw new Error("Registry resource.defaultLens must be declared in resource.lenses.");
  }

  return {
    scheme: stringValue(value.scheme, "resource.scheme").toLowerCase(),
    namespace: stringValue(value.namespace, "resource.namespace").toLowerCase(),
    kind: stringValue(value.kind, "resource.kind"),
    defaultLens,
    lenses,
    ...(params !== undefined ? { params: uniqueStringArray(params, "resource.params") } : {}),
  };
}

function validateUniqueResources(resources: readonly RegistryResource[]): void {
  const seen = new Set<string>();

  for (const resource of resources) {
    const key = `${resource.scheme}\0${resource.namespace}\0${resource.kind}`;
    if (seen.has(key)) {
      throw new Error(
        `Registry resources must not contain duplicate resource declarations: ${resource.scheme}://${resource.namespace}/${resource.kind}.`,
      );
    }
    seen.add(key);
  }
}

function linkDiagnostic(
  code: string,
  message: string,
  link: ContextLinkCandidate,
): ContextDiagnostic {
  return {
    code,
    message,
    severity: "error",
    sourceRange: link.sourceRange,
    url: link.url,
  };
}

function hasError(diagnostics: readonly ContextDiagnostic[]): boolean {
  return diagnostics.some((diagnostic) => diagnostic.severity === "error");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown, field: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Registry ${field} must be a non-empty string.`);
  }

  return value;
}

function uniqueStringArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) {
    throw new Error(`Registry ${field} must be an array of strings.`);
  }

  const seen = new Set<string>();
  for (const item of value) {
    if (item.length === 0) {
      throw new Error(`Registry ${field} must not contain empty strings.`);
    }
    if (seen.has(item)) {
      throw new Error(`Registry ${field} must not contain duplicate values: ${item}.`);
    }
    seen.add(item);
  }

  return [...value].sort();
}

function nonEmptyUniqueStringArray(value: unknown, field: string): string[] {
  const items = uniqueStringArray(value, field);
  if (items.length === 0) {
    throw new Error(`Registry ${field} must contain at least one value.`);
  }

  return items;
}
