import type {
  ContextDiagnostic,
  RepoPathLensArtifact,
  ResolveResult,
  ValidatedContextLink,
} from "../core/types.js";
import { stableSourcePathInsideBase } from "../core/source-path.js";
import { createContextLockfile } from "../lockfile/lockfile.js";
import type { ContextLockfileRecord } from "../lockfile/types.js";
import type { Registry } from "../registry/registry.js";
import { renderRepoPathLensArtifact } from "./repo-path/artifact.js";
import { createRepoPathLockfileRecord } from "./repo-path/lockfile.js";
import { readRepoPathSource } from "./repo-path/source.js";

export interface ResolveRepoPathLinkOptions {
  repoRoot: string;
  lockfile?: {
    registry: Registry;
    preserveArtifactSourcePaths?: boolean;
    sourcePathsAlreadyStable?: boolean;
  };
}

export async function resolveRepoPathLink(
  links: readonly ValidatedContextLink[],
  options: ResolveRepoPathLinkOptions,
): Promise<ResolveResult> {
  const artifacts: RepoPathLensArtifact[] = [];
  const diagnostics: ContextDiagnostic[] = [];
  const lockfileRecords: ContextLockfileRecord[] = [];

  for (const link of links) {
    if (link.namespace !== "repo" || link.kind !== "path") {
      diagnostics.push({
        code: "ctx.resolver.unsupported",
        message: "Only ctx://repo/path/... links are supported in WP-1.",
        severity: "error",
        sourceRange: link.sourceRange,
        url: link.url,
      });
      continue;
    }

    if (link.selectedLens !== "excerpt") {
      diagnostics.push({
        code: "ctx.repoPath.lens.unsupported",
        message: `Unsupported repo/path lens: ${link.selectedLens}`,
        severity: "error",
        sourceRange: link.sourceRange,
        url: link.url,
      });
      continue;
    }

    const source = await readRepoPathSource(options.repoRoot, link);
    if ("diagnostic" in source) {
      diagnostics.push(source.diagnostic);
      continue;
    }

    const lockfileArtifactLink =
      options.lockfile !== undefined && options.lockfile.sourcePathsAlreadyStable !== true
        ? withStableLockfileSourcePath(link, options.repoRoot)
        : link;
    const artifact =
      options.lockfile?.preserveArtifactSourcePaths === true
        ? renderRepoPathLensArtifact(link, source)
        : renderRepoPathLensArtifact(lockfileArtifactLink, source);
    artifacts.push(artifact);

    if (options.lockfile !== undefined) {
      const lockfileArtifact =
        options.lockfile.preserveArtifactSourcePaths === true
          ? renderRepoPathLensArtifact(lockfileArtifactLink, source)
          : artifact;
      lockfileRecords.push(
        createRepoPathLockfileRecord(lockfileArtifact, options.lockfile.registry),
      );
    }
  }

  return {
    schemaVersion: "markdown-context.resolve-result.v0",
    artifacts,
    diagnostics,
    ...(options.lockfile !== undefined ? { lockfile: createContextLockfile(lockfileRecords) } : {}),
  };
}

function withStableLockfileSourcePath(
  link: ValidatedContextLink,
  repoRoot: string,
): ValidatedContextLink {
  if (link.sourcePath === undefined) {
    return link;
  }

  const stableSourcePath = stableSourcePathInsideBase(link.sourcePath, repoRoot);
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
