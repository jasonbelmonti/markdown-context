import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { stableSourcePathInsideBase } from "../src/core/source-path.js";

describe("stable source paths", () => {
  it("keeps repo-contained paths whose first segment starts with two dots", async () => {
    await withTempRepo(async (repoRoot) => {
      const sourceDir = path.join(repoRoot, "..docs");
      const sourcePath = path.join(sourceDir, "task.md");

      await mkdir(sourceDir);
      await writeFile(sourcePath, "# Task\n", "utf8");

      expect(stableSourcePathInsideBase(sourcePath, repoRoot)).toBe("..docs/task.md");
    });
  });

  it("rejects paths outside the base directory", async () => {
    await withTempRepo(async (repoRoot, tempRoot) => {
      const outsidePath = path.join(tempRoot, "task.md");

      await writeFile(outsidePath, "# Task\n", "utf8");

      expect(stableSourcePathInsideBase(outsidePath, repoRoot)).toBeUndefined();
    });
  });

  it("resolves relative source paths from cwd rather than the base directory", () => {
    const basePath = path.join(process.cwd(), "fixtures", "ms1");

    expect(stableSourcePathInsideBase("package.json", basePath)).toBeUndefined();
  });

  it("maps cwd-relative source paths into a non-cwd base directory", () => {
    const basePath = path.join(process.cwd(), "fixtures");

    expect(stableSourcePathInsideBase("fixtures/ms1/task.md", basePath)).toBe("ms1/task.md");
  });

  it("resolves relative source paths from an explicit source path base", () => {
    const basePath = path.join(process.cwd(), "fixtures");

    expect(
      stableSourcePathInsideBase("ms1/task.md", basePath, { relativePathBase: basePath }),
    ).toBe("ms1/task.md");
  });
});

async function withTempRepo<T>(
  run: (repoRoot: string, tempRoot: string) => Promise<T>,
): Promise<T> {
  const tempRoot = await mkdtemp(path.join(tmpdir(), "markdown-context-source-path-"));
  const repoRoot = path.join(tempRoot, "repo");

  try {
    await mkdir(repoRoot);
    return await run(repoRoot, tempRoot);
  } finally {
    await rm(tempRoot, { force: true, recursive: true });
  }
}
