import { createHash } from "node:crypto";
import { readFile, realpath } from "node:fs/promises";
import path from "node:path";

import type {
  ContextDiagnostic,
  RepoPathSourceIdentity,
  ValidatedContextLink,
} from "../../core/types.js";

type RepoPathResolution =
  | { path: string }
  | { diagnosticCode: "ctx.repoPath.outsideRoot" | "ctx.repoPath.unresolved"; message: string };

export interface RepoPathSource {
  text: string;
  sourceIdentity: RepoPathSourceIdentity;
  contentHash: string;
}

export async function readRepoPathSource(
  repoRoot: string,
  link: ValidatedContextLink,
): Promise<RepoPathSource | { diagnostic: ContextDiagnostic }> {
  const resolvedPath = await resolveRealPathInsideRoot(repoRoot, link.id);
  if ("diagnosticCode" in resolvedPath) {
    return {
      diagnostic: {
        code: resolvedPath.diagnosticCode,
        message: resolvedPath.message,
        severity: "error",
        sourceRange: link.sourceRange,
        url: link.url,
      },
    };
  }

  let rawText: string;
  try {
    rawText = await readFile(resolvedPath.path, "utf8");
  } catch {
    return unresolvedRepoPathDiagnostic(link);
  }

  const text = normalizeLineEndings(rawText);
  const contentHash = sha256(text);

  return {
    text,
    contentHash,
    sourceIdentity: buildRepoPathSourceIdentity(link.id, contentHash),
  };
}

function unresolvedRepoPathDiagnostic(
  link: ValidatedContextLink,
): { diagnostic: ContextDiagnostic } {
  return {
    diagnostic: {
      code: "ctx.repoPath.unresolved",
      message: "Repo path could not be resolved inside the repository root.",
      severity: "error",
      sourceRange: link.sourceRange,
      url: link.url,
    },
  };
}

function buildRepoPathSourceIdentity(
  repoPath: string,
  contentHash: string,
): RepoPathSourceIdentity {
  return {
    kind: "repo/path",
    path: repoPath,
    contentHash,
  };
}

async function resolveRealPathInsideRoot(
  repoRoot: string,
  relativePath: string,
): Promise<RepoPathResolution> {
  let root: string;
  let candidate: string;

  try {
    root = await realpath(repoRoot);
    const lexicalCandidate = path.resolve(root, ...relativePath.split("/"));
    candidate = await realpath(lexicalCandidate);
  } catch {
    return {
      diagnosticCode: "ctx.repoPath.unresolved",
      message: "Repo path could not be resolved inside the repository root.",
    };
  }

  const relative = path.relative(root, candidate);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    return {
      diagnosticCode: "ctx.repoPath.outsideRoot",
      message: "Repo path resolves outside the repository root.",
    };
  }

  return { path: candidate };
}

function sha256(content: string): string {
  return `sha256:${createHash("sha256").update(content, "utf8").digest("hex")}`;
}

function normalizeLineEndings(text: string): string {
  return text.replace(/\r\n?/g, "\n");
}
