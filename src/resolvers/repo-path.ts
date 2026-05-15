import type {
  ContextDiagnostic,
  RepoPathLensArtifact,
  ResolveResult,
  ValidatedContextLink,
} from "../core/types.js";
import { renderRepoPathLensArtifact } from "./repo-path/artifact.js";
import { readRepoPathSource } from "./repo-path/source.js";

export async function resolveRepoPathLink(
  links: readonly ValidatedContextLink[],
  options: { repoRoot: string },
): Promise<ResolveResult> {
  const artifacts: RepoPathLensArtifact[] = [];
  const diagnostics: ContextDiagnostic[] = [];

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

    artifacts.push(renderRepoPathLensArtifact(link, source));
  }

  return {
    schemaVersion: "markdown-context.resolve-result.v0",
    artifacts,
    diagnostics,
  };
}
