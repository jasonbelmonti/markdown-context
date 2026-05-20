import type {
  ContextDiagnostic,
  ContextLinkCandidate,
  ScanResult,
  ValidatedContextLink,
  ValidateResult,
} from "../core/types.js";
import type { Registry, RegistryResource } from "./types.js";

type RegistryResourceMatch =
  | { resource: RegistryResource; diagnostic?: never }
  | { resource?: never; diagnostic: ContextDiagnostic };

export function validateContextLinks(
  links: readonly ContextLinkCandidate[],
  registry: Registry,
): ValidateResult {
  const validatedLinks: ValidatedContextLink[] = [];
  const diagnostics: ContextDiagnostic[] = [];

  for (const link of links) {
    const resourceMatch = findRegistryResource(link, registry);

    if (resourceMatch.diagnostic !== undefined) {
      diagnostics.push(resourceMatch.diagnostic);
      continue;
    }

    const resource = resourceMatch.resource;
    const invalidDiagnostic = validateLinkAgainstResource(link, resource);
    if (invalidDiagnostic !== undefined) {
      diagnostics.push(invalidDiagnostic);
      continue;
    }

    validatedLinks.push({
      ...link,
      selectedLens: link.requestedLens ?? resource.defaultLens,
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

function validateLinkAgainstResource(
  link: ContextLinkCandidate,
  resource: RegistryResource,
): ContextDiagnostic | undefined {
  const allowedParams = new Set(resource.params ?? []);
  const unsupportedParam = Object.keys(link.params).find((key) => !allowedParams.has(key));
  if (unsupportedParam !== undefined) {
    return linkDiagnostic(
      "ctx.param.unsupported",
      `Unsupported context URL parameter: ${unsupportedParam}`,
      link,
    );
  }

  if (resource.idPattern !== undefined && !new RegExp(resource.idPattern, "u").test(link.id)) {
    return linkDiagnostic(
      "ctx.id.unsupported",
      "Context URL id does not match the registry resource idPattern.",
      link,
    );
  }

  const selectedLens = link.requestedLens ?? resource.defaultLens;
  if (!resource.lenses.includes(selectedLens)) {
    return linkDiagnostic(
      "ctx.lens.unsupported",
      `Unsupported context lens: ${selectedLens}`,
      link,
    );
  }

  return undefined;
}

function findRegistryResource(
  link: ContextLinkCandidate,
  registry: Registry,
): RegistryResourceMatch {
  const schemeResources = registry.resources.filter((resource) => resource.scheme === link.scheme);
  if (schemeResources.length === 0) {
    return {
      diagnostic: linkDiagnostic(
        "ctx.scheme.unsupported",
        `Unsupported context URL scheme: ${link.scheme}`,
        link,
      ),
    };
  }

  const namespaceResources = schemeResources.filter(
    (resource) => resource.namespace === link.namespace,
  );
  if (namespaceResources.length === 0) {
    return {
      diagnostic: linkDiagnostic(
        "ctx.namespace.unsupported",
        `Unsupported context namespace: ${link.namespace}`,
        link,
      ),
    };
  }

  const resource = namespaceResources.find((candidate) => candidate.kind === link.kind);
  if (resource === undefined) {
    return {
      diagnostic: linkDiagnostic(
        "ctx.kind.unsupported",
        `Unsupported context resource kind: ${link.kind}`,
        link,
      ),
    };
  }

  return { resource };
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
