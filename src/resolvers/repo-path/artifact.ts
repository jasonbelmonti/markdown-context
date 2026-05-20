import { createHash } from "node:crypto";

import type { RepoPathLensArtifact, ValidatedContextLink } from "../../core/types.js";
import type { RepoPathSource } from "./source.js";

export const REPO_PATH_EXCERPT_MAX_BYTES = 4096;
const EXCERPT_TRUNCATION_MARKER = "\n\n[markdown-context: excerpt truncated]\n";

export function renderRepoPathLensArtifact(
  link: ValidatedContextLink,
  source: RepoPathSource,
): RepoPathLensArtifact {
  const contentText = renderBoundedExcerpt(source.text);

  return {
    schemaVersion: "markdown-context.lens.v0",
    canonicalUrl: link.canonicalUrl,
    selectedLens: link.selectedLens,
    resolverId: "repo-path",
    resolverVersion: "0.1.0",
    sourceIdentity: source.sourceIdentity,
    contentHash: sha256(contentText),
    citations: [
      {
        ...(link.sourcePath !== undefined ? { sourcePath: link.sourcePath } : {}),
        sourceRange: link.sourceRange,
      },
    ],
    sourceTrust: "untrusted-source-data",
    sourceContentBoundary: "source-data",
    content: {
      format: "markdown",
      text: contentText,
    },
  };
}

function renderBoundedExcerpt(text: string): string {
  const canonicalText = ensureFinalNewline(text);

  if (Buffer.byteLength(canonicalText, "utf8") <= REPO_PATH_EXCERPT_MAX_BYTES) {
    return canonicalText;
  }

  const markerBudget = Buffer.byteLength(EXCERPT_TRUNCATION_MARKER, "utf8");
  const textBudget = REPO_PATH_EXCERPT_MAX_BYTES - markerBudget;
  let output = "";
  let outputBytes = 0;

  for (const character of canonicalText) {
    const characterBytes = Buffer.byteLength(character, "utf8");
    if (outputBytes + characterBytes > textBudget) {
      break;
    }

    output += character;
    outputBytes += characterBytes;
  }

  return `${output.trimEnd()}${EXCERPT_TRUNCATION_MARKER}`;
}

function sha256(content: string): string {
  return `sha256:${createHash("sha256").update(content, "utf8").digest("hex")}`;
}

function ensureFinalNewline(text: string): string {
  return `${text.replace(/\n*$/, "")}\n`;
}
