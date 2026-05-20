import { readFile } from "node:fs/promises";

import type { Registry, RegistryResource } from "./types.js";

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

function parseResource(value: unknown): RegistryResource {
  if (!isRecord(value)) {
    throw new Error("Registry resource must be an object.");
  }

  const scheme = stringValue(value.scheme, "resource.scheme").toLowerCase();
  if (scheme !== "ctx") {
    throw new Error(`Registry resource.scheme must be ctx: ${scheme}.`);
  }

  const idPattern = optionalStringValue(value.idPattern, "resource.idPattern");
  if (idPattern !== undefined) {
    assertValidRegExp(idPattern, "resource.idPattern");
  }

  const defaultLens = stringValue(value.defaultLens, "resource.defaultLens");
  const lenses = nonEmptyUniqueStringArray(value.lenses, "resource.lenses");
  if (!lenses.includes(defaultLens)) {
    throw new Error("Registry resource.defaultLens must be declared in resource.lenses.");
  }

  const params = value.params;

  return {
    scheme,
    namespace: stringValue(value.namespace, "resource.namespace").toLowerCase(),
    kind: stringValue(value.kind, "resource.kind"),
    ...(idPattern !== undefined ? { idPattern } : {}),
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
