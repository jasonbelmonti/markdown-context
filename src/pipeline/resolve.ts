import type { Registry } from "../registry/registry.js";
import { validateScanResult } from "../registry/registry.js";
import { resolveRepoPathLink } from "../resolvers/repo-path.js";
import { stableSourcePathInsideBase } from "../core/source-path.js";
import { sourcePathBaseForScanResult } from "../core/scan.js";
import type { ResolveResult, ScanResult, ValidatedContextLink } from "../core/types.js";
import { createContextLockfile } from "../lockfile/lockfile.js";

export interface ResolveScanResultOptions {
  repoRoot: string;
  lockfile?: boolean;
  sourcePathBase?: string;
}

export async function resolveScanResult(
  scanResult: ScanResult,
  registry: Registry,
  options: ResolveScanResultOptions,
): Promise<ResolveResult> {
  const validateResult = validateScanResult(scanResult, registry);
  if (!validateResult.valid) {
    return {
      schemaVersion: "markdown-context.resolve-result.v0",
      artifacts: [],
      diagnostics: validateResult.diagnostics,
      ...(options.lockfile === true ? { lockfile: createContextLockfile([]) } : {}),
    };
  }

  const links =
    options.lockfile === true
      ? withStableLockfileSourcePaths(
          validateResult.links,
          options.repoRoot,
          options.sourcePathBase ?? sourcePathBaseForScanResult(scanResult),
        )
      : validateResult.links;
  const resolveResult = await resolveRepoPathLink(links, {
    repoRoot: options.repoRoot,
    ...(options.lockfile === true
      ? { lockfile: { registry, sourcePathsAlreadyStable: true } }
      : {}),
  });
  const diagnostics = [...validateResult.diagnostics, ...resolveResult.diagnostics];

  return {
    ...resolveResult,
    diagnostics,
  };
}

function withStableLockfileSourcePaths(
  links: readonly ValidatedContextLink[],
  repoRoot: string,
  sourcePathBase: string | undefined,
): ValidatedContextLink[] {
  return links.map((link) => withStableLockfileSourcePath(link, repoRoot, sourcePathBase));
}

function withStableLockfileSourcePath(
  link: ValidatedContextLink,
  repoRoot: string,
  sourcePathBase: string | undefined,
): ValidatedContextLink {
  if (link.sourcePath === undefined) {
    return link;
  }

  const stableSourcePath =
    sourcePathBase === undefined
      ? stableSourcePathInsideBase(link.sourcePath, repoRoot)
      : stableSourcePathInsideBase(link.sourcePath, repoRoot, { relativePathBase: sourcePathBase });
  if (stableSourcePath === link.sourcePath) {
    return link;
  }

  if (stableSourcePath === undefined) {
    const { sourcePath: _sourcePath, ...linkWithoutSourcePath } = link;
    return linkWithoutSourcePath;
  }

  return {
    ...link,
    sourcePath: stableSourcePath,
  };
}
