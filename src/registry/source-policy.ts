import type { RegistryResourceSourcePolicy } from "./types.js";

export function isRepoPathAllowedBySourcePolicy(
  id: string,
  sourcePolicy: RegistryResourceSourcePolicy | undefined,
): boolean {
  if (sourcePolicy === undefined) {
    return true;
  }

  const normalizedId = normalizeRepoPathId(id);

  if (matchesPathPrefix(normalizedId, sourcePolicy.deniedPathPrefixes)) {
    return false;
  }

  if (sourcePolicy.allowedPathPrefixes === undefined) {
    return true;
  }

  return matchesPathPrefix(normalizedId, sourcePolicy.allowedPathPrefixes);
}

function matchesPathPrefix(id: string, prefixes: readonly string[] | undefined): boolean {
  return prefixes?.some((prefix) => id.startsWith(prefix)) ?? false;
}

function normalizeRepoPathId(id: string): string {
  const segments: string[] = [];

  for (const segment of id.replaceAll("\\", "/").split("/")) {
    if (segment.length === 0 || segment === ".") {
      continue;
    }

    if (segment === ".." && segments.length > 0 && segments[segments.length - 1] !== "..") {
      segments.pop();
      continue;
    }

    segments.push(segment);
  }

  return segments.join("/");
}
