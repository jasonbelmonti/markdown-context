import { readFile } from "node:fs/promises";

import { registryResourceIdentityKey } from "./resource-identity.js";
import type {
  Registry,
  RegistryIgnoredResource,
  RegistryResource,
  RegistryResourceSourcePolicy,
} from "./types.js";

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

  const ignoredResources = value.ignoredResources;
  const parsedIgnoredResources =
    ignoredResources === undefined ? [] : parseIgnoredResources(ignoredResources);
  validateNoResourcePolicyOverlap(parsedResources, parsedIgnoredResources);

  return {
    schemaVersion,
    registryId: stringValue(value.registryId, "registryId"),
    registryVersion: stringValue(value.registryVersion, "registryVersion"),
    resources: parsedResources,
    ...(parsedIgnoredResources.length > 0 ? { ignoredResources: parsedIgnoredResources } : {}),
  };
}

function parseResource(value: unknown): RegistryResource {
  if (!isRecord(value)) {
    throw new Error("Registry resource must be an object.");
  }

  const scheme = stringValue(value.scheme, "resource.scheme").toLowerCase();
  if (scheme !== "ctx") {
    throw new Error(`Registry resource.scheme must be ctx: ${scheme}.`);
  }

  const namespace = stringValue(value.namespace, "resource.namespace").toLowerCase();
  const kind = stringValue(value.kind, "resource.kind");
  const idPattern = optionalStringValue(value.idPattern, "resource.idPattern");
  if (idPattern !== undefined) {
    assertValidRegExp(idPattern, "resource.idPattern");
  }

  const sourcePolicy = parseOptionalSourcePolicy(value.sourcePolicy);
  if (sourcePolicy !== undefined && (namespace !== "repo" || kind !== "path")) {
    throw new Error(
      "Registry resource.sourcePolicy is only supported for ctx://repo/path resources.",
    );
  }

  const defaultLens = stringValue(value.defaultLens, "resource.defaultLens");
  const lenses = nonEmptyUniqueStringArray(value.lenses, "resource.lenses");
  if (!lenses.includes(defaultLens)) {
    throw new Error("Registry resource.defaultLens must be declared in resource.lenses.");
  }

  const params = value.params;

  return {
    scheme,
    namespace,
    kind,
    ...(idPattern !== undefined ? { idPattern } : {}),
    ...(sourcePolicy !== undefined ? { sourcePolicy } : {}),
    defaultLens,
    lenses,
    ...(params !== undefined ? { params: uniqueStringArray(params, "resource.params") } : {}),
  };
}

function parseOptionalSourcePolicy(
  value: unknown,
): RegistryResourceSourcePolicy | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!isRecord(value)) {
    throw new Error("Registry resource.sourcePolicy must be an object.");
  }

  const allowedPathPrefixes = optionalNonEmptyUniqueStringArray(
    value.allowedPathPrefixes,
    "resource.sourcePolicy.allowedPathPrefixes",
  );
  const deniedPathPrefixes = optionalNonEmptyUniqueStringArray(
    value.deniedPathPrefixes,
    "resource.sourcePolicy.deniedPathPrefixes",
  );

  if (allowedPathPrefixes === undefined && deniedPathPrefixes === undefined) {
    throw new Error(
      "Registry resource.sourcePolicy must declare allowedPathPrefixes or deniedPathPrefixes.",
    );
  }

  if (allowedPathPrefixes !== undefined && deniedPathPrefixes !== undefined) {
    return { allowedPathPrefixes, deniedPathPrefixes };
  }

  if (allowedPathPrefixes !== undefined) {
    return { allowedPathPrefixes };
  }

  if (deniedPathPrefixes !== undefined) {
    return { deniedPathPrefixes };
  }

  throw new Error("Registry resource.sourcePolicy must declare a path-prefix policy.");
}

function parseIgnoredResources(value: unknown): RegistryIgnoredResource[] {
  if (!Array.isArray(value)) {
    throw new Error("Registry ignoredResources must be an array.");
  }

  const ignoredResources = value.map(parseIgnoredResource);
  validateUniqueIgnoredResources(ignoredResources);

  return ignoredResources;
}

function parseIgnoredResource(value: unknown): RegistryIgnoredResource {
  if (!isRecord(value)) {
    throw new Error("Registry ignoredResource must be an object.");
  }

  const scheme = stringValue(value.scheme, "ignoredResource.scheme").toLowerCase();
  if (scheme !== "ctx") {
    throw new Error(`Registry ignoredResource.scheme must be ctx: ${scheme}.`);
  }

  return {
    scheme,
    namespace: stringValue(value.namespace, "ignoredResource.namespace").toLowerCase(),
    kind: stringValue(value.kind, "ignoredResource.kind"),
  };
}

function validateUniqueResources(resources: readonly RegistryResource[]): void {
  const seen = new Set<string>();

  for (const resource of resources) {
    const key = registryResourceIdentityKey(resource);
    if (seen.has(key)) {
      throw new Error(
        `Registry resources must not contain duplicate resource declarations: ${resource.scheme}://${resource.namespace}/${resource.kind}.`,
      );
    }
    seen.add(key);
  }
}

function validateUniqueIgnoredResources(
  ignoredResources: readonly RegistryIgnoredResource[],
): void {
  const seen = new Set<string>();

  for (const ignoredResource of ignoredResources) {
    const key = registryResourceIdentityKey(ignoredResource);
    if (seen.has(key)) {
      throw new Error(
        `Registry ignoredResources must not contain duplicate resource declarations: ${ignoredResource.scheme}://${ignoredResource.namespace}/${ignoredResource.kind}.`,
      );
    }
    seen.add(key);
  }
}

function validateNoResourcePolicyOverlap(
  resources: readonly RegistryResource[],
  ignoredResources: readonly RegistryIgnoredResource[],
): void {
  const resolvableResourceKeys = new Set(resources.map(registryResourceIdentityKey));

  for (const ignoredResource of ignoredResources) {
    if (resolvableResourceKeys.has(registryResourceIdentityKey(ignoredResource))) {
      throw new Error(
        `Registry ignoredResources must not overlap resource declarations: ${ignoredResource.scheme}://${ignoredResource.namespace}/${ignoredResource.kind}.`,
      );
    }
  }
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

function optionalStringValue(value: unknown, field: string): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  return stringValue(value, field);
}

function assertValidRegExp(pattern: string, field: string): void {
  try {
    new RegExp(pattern, "u");
  } catch {
    throw new Error(`Registry ${field} must be a valid regular expression: ${pattern}.`);
  }
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

function optionalNonEmptyUniqueStringArray(
  value: unknown,
  field: string,
): string[] | undefined {
  if (value === undefined) {
    return undefined;
  }

  return nonEmptyUniqueStringArray(value, field);
}
