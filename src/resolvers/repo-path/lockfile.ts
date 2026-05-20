import type { RepoPathLensArtifact } from "../../core/types.js";
import type { CanonicalJsonObject } from "../../lockfile/canonical-json.js";
import { hashCanonicalJson } from "../../lockfile/hash.js";
import { createContextLockfileRecord } from "../../lockfile/lockfile.js";
import type { ContextLockfileRecord, Sha256Hash } from "../../lockfile/types.js";
import type { Registry } from "../../registry/registry.js";
import { REPO_PATH_EXCERPT_MAX_BYTES } from "./artifact.js";

const ARTIFACT_PATH_PREFIX = ".markdown-context/artifacts/repo-path";

export function createRepoPathLockfileRecord(
  artifact: RepoPathLensArtifact,
  registry: Registry,
): ContextLockfileRecord {
  const artifactHash = hashCanonicalJson(artifact);

  return createContextLockfileRecord({
    canonicalUrl: artifact.canonicalUrl,
    selectedLens: artifact.selectedLens,
    artifactPath: buildRepoPathArtifactPath(artifactHash),
    artifactHash,
    registry,
    resolverId: artifact.resolverId,
    resolverVersion: artifact.resolverVersion,
    sourceIdentity: {
      kind: artifact.sourceIdentity.kind,
      path: artifact.sourceIdentity.path,
    },
    sourceHash: artifact.sourceIdentity.contentHash as Sha256Hash,
    outputOptions: repoPathOutputOptions(),
  });
}

export function buildRepoPathArtifactPath(artifactHash: Sha256Hash): string {
  return `${ARTIFACT_PATH_PREFIX}/${artifactHash.slice("sha256:".length)}.json`;
}

function repoPathOutputOptions(): CanonicalJsonObject {
  return {
    artifactFormat: "json",
    excerptMaxBytes: REPO_PATH_EXCERPT_MAX_BYTES,
  };
}
