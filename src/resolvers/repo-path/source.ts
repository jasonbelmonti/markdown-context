import { createHash } from "node:crypto";
import { constants, type Stats } from "node:fs";
import { open, realpath, stat, type FileHandle } from "node:fs/promises";
import path from "node:path";

import type {
  ContextDiagnostic,
  RepoPathSourceIdentity,
  ValidatedContextLink,
} from "../../core/types.js";
import { isOutsideBasePath } from "../../core/source-path.js";

type RepoPathResolution =
  | { root: string; path: string }
  | { diagnosticCode: "ctx.repoPath.outsideRoot" | "ctx.repoPath.unresolved"; message: string };

export const REPO_PATH_SOURCE_MAX_BYTES = 1024 * 1024;
const OPEN_CONTAINED_SOURCE_FLAGS = constants.O_RDONLY | constants.O_NOFOLLOW;

export interface RepoPathSource {
  text: string;
  sourceIdentity: RepoPathSourceIdentity;
  contentHash: string;
}

interface RepoPathSourceReadOptions {
  beforeOpen?: () => Promise<void>;
}

export async function readRepoPathSource(
  repoRoot: string,
  link: ValidatedContextLink,
  options: RepoPathSourceReadOptions = {},
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

  let sourceHandle: FileHandle | undefined;
  let rawText: string;
  try {
    await options.beforeOpen?.();
    sourceHandle = await open(resolvedPath.path, OPEN_CONTAINED_SOURCE_FLAGS);

    const sourceDiagnostic = await validateOpenedRepoPathSource(sourceHandle, resolvedPath, link);
    if (sourceDiagnostic !== undefined) {
      return { diagnostic: sourceDiagnostic };
    }

    rawText = await sourceHandle.readFile("utf8");
  } catch {
    return unresolvedRepoPathDiagnostic(link);
  } finally {
    await sourceHandle?.close().catch(() => undefined);
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

async function validateOpenedRepoPathSource(
  sourceHandle: FileHandle,
  resolvedPath: Extract<RepoPathResolution, { path: string }>,
  link: ValidatedContextLink,
): Promise<ContextDiagnostic | undefined> {
  const openedStats = await sourceHandle.stat();

  if (!openedStats.isFile()) {
    return unresolvedRepoPathDiagnostic(link).diagnostic;
  }

  const currentPath = await resolveRealPathInsideResolvedRoot(resolvedPath.root, resolvedPath.path);
  if ("diagnosticCode" in currentPath) {
    return {
      code: currentPath.diagnosticCode,
      message: currentPath.message,
      severity: "error",
      sourceRange: link.sourceRange,
      url: link.url,
    };
  }

  let currentStats: Stats;
  try {
    currentStats = await stat(currentPath.path);
  } catch {
    return unresolvedRepoPathDiagnostic(link).diagnostic;
  }

  if (!isSameFilesystemObject(openedStats, currentStats)) {
    return {
      code: "ctx.repoPath.unresolved",
      message: "Repo path changed during resolution before it could be validated inside the repository root.",
      severity: "error",
      sourceRange: link.sourceRange,
      url: link.url,
    };
  }

  if (openedStats.size > REPO_PATH_SOURCE_MAX_BYTES) {
    return {
      code: "ctx.repoPath.sourceTooLarge",
      message: `Repo path source is ${openedStats.size} bytes, exceeding the ${REPO_PATH_SOURCE_MAX_BYTES} byte source-size limit.`,
      severity: "error",
      sourceRange: link.sourceRange,
      url: link.url,
    };
  }

  return undefined;
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
  let lexicalCandidate: string;

  try {
    root = await realpath(repoRoot);
    lexicalCandidate = path.resolve(root, ...relativePath.split("/"));
  } catch {
    return {
      diagnosticCode: "ctx.repoPath.unresolved",
      message: "Repo path could not be resolved inside the repository root.",
    };
  }

  return resolveRealPathInsideResolvedRoot(root, lexicalCandidate);
}

async function resolveRealPathInsideResolvedRoot(
  root: string,
  candidatePath: string,
): Promise<RepoPathResolution> {
  let candidate: string;

  try {
    candidate = await realpath(candidatePath);
  } catch {
    return {
      diagnosticCode: "ctx.repoPath.unresolved",
      message: "Repo path could not be resolved inside the repository root.",
    };
  }

  const relative = path.relative(root, candidate);

  if (isOutsideBasePath(relative)) {
    return {
      diagnosticCode: "ctx.repoPath.outsideRoot",
      message: "Repo path resolves outside the repository root.",
    };
  }

  return { root, path: candidate };
}

function isSameFilesystemObject(left: Stats, right: Stats): boolean {
  return left.dev === right.dev && left.ino === right.ino;
}

function sha256(content: string): string {
  return `sha256:${createHash("sha256").update(content, "utf8").digest("hex")}`;
}

function normalizeLineEndings(text: string): string {
  return text.replace(/\r\n?/g, "\n");
}
