import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

import { stableJson } from "../src/cli/json.js";

const execFileAsync = promisify(execFile);

describe("CLI operator contract", () => {
  it("rejects unknown commands before file IO or registry checks", async () => {
    const result = await runCliExpectingExit([
      "dist/cli/index.js",
      "inspect",
      "missing.md",
    ], 2);

    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("Unknown command: inspect.");
    expect(result.stderr).toContain("Usage:");
    expect(result.stderr).not.toContain("ENOENT");
    expect(result.stderr).not.toContain("requires --registry");
  });

  it("rejects unknown options instead of treating them as files", async () => {
    const result = await runCliExpectingExit([
      "dist/cli/index.js",
      "scan",
      "fixtures/ms1/task.md",
      "--format",
      "json",
    ], 2);

    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("Unknown option: --format.");
    expect(result.stderr).toContain("Usage:");
  });

  it("rejects extra positional arguments", async () => {
    const result = await runCliExpectingExit([
      "dist/cli/index.js",
      "scan",
      "fixtures/ms1/task.md",
      "fixtures/ms1/context-source.md",
    ], 2);

    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("Expected exactly one <markdown-file> argument.");
  });

  it("rejects command-specific options that would otherwise be ignored", async () => {
    const scanResult = await runCliExpectingExit([
      "dist/cli/index.js",
      "scan",
      "fixtures/ms1/task.md",
      "--registry",
      "fixtures/ms1/registry.json",
    ], 2);
    const validateResult = await runCliExpectingExit([
      "dist/cli/index.js",
      "validate",
      "fixtures/ms1/task.md",
      "--registry",
      "fixtures/ms1/registry.json",
      "--repo-root",
      ".",
    ], 2);
    const scanLockfileResult = await runCliExpectingExit([
      "dist/cli/index.js",
      "scan",
      "fixtures/ms1/task.md",
      "--lockfile",
    ], 2);

    expect(scanResult.stdout).toBe("");
    expect(scanResult.stderr).toContain("scan does not support --registry.");
    expect(validateResult.stdout).toBe("");
    expect(validateResult.stderr).toContain("validate does not support --repo-root.");
    expect(scanLockfileResult.stdout).toBe("");
    expect(scanLockfileResult.stderr).toContain("scan does not support --lockfile.");
  });

  it("requires registries for validate and resolve", async () => {
    const validateResult = await runCliExpectingExit([
      "dist/cli/index.js",
      "validate",
      "fixtures/ms1/task.md",
    ], 2);
    const resolveResult = await runCliExpectingExit([
      "dist/cli/index.js",
      "resolve",
      "fixtures/ms1/task.md",
    ], 2);

    expect(validateResult.stdout).toBe("");
    expect(validateResult.stderr).toContain("validate requires --registry <path>.");
    expect(resolveResult.stdout).toBe("");
    expect(resolveResult.stderr).toContain("resolve requires --registry <path>.");
  });

  it("rejects duplicate value options", async () => {
    const result = await runCliExpectingExit([
      "dist/cli/index.js",
      "validate",
      "fixtures/ms1/task.md",
      "--registry",
      "fixtures/ms1/registry.json",
      "--registry",
      "fixtures/ms1/registry.json",
    ], 2);

    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("Duplicate option: --registry.");
  });

  it("defaults resolve repo root to the current working directory", async () => {
    const result = await runCli([
      "dist/cli/index.js",
      "resolve",
      "fixtures/ms1/task.md",
      "--registry",
      "fixtures/ms1/registry.json",
      "--pretty",
    ]);
    const output = JSON.parse(result.stdout) as {
      artifacts: Array<{ sourceIdentity: { path: string } }>;
      diagnostics: unknown[];
    };

    expect(output.diagnostics).toEqual([]);
    expect(output.artifacts).toHaveLength(1);
    expect(output.artifacts[0]?.sourceIdentity.path).toBe("fixtures/ms1/context-source.md");
  });

  it("keeps numeric query param keys in code-unit order in scan JSON", async () => {
    const tempRoot = await mkdtemp(path.join(tmpdir(), "markdown-context-cli-"));
    const taskPath = path.join(tempRoot, "task.md");

    try {
      await writeFile(
        taskPath,
        "[numeric](ctx://repo/path/fixtures/ms1/context-source.md?2=b&10=a&lens=excerpt)",
        "utf8",
      );

      const result = await runCli([
        "dist/cli/index.js",
        "scan",
        taskPath,
      ]);

      expect(result.stdout).toContain('"params":{"10":"a","2":"b"}');
    } finally {
      await rm(tempRoot, { force: true, recursive: true });
    }
  });

  it("merges validate and resolve diagnostics in resolve output", async () => {
    const tempRoot = await mkdtemp(path.join(tmpdir(), "markdown-context-cli-"));
    const repoRoot = path.join(tempRoot, "repo");
    const taskPath = path.join(tempRoot, "task.md");

    try {
      await mkdir(repoRoot);
      await writeFile(
        taskPath,
        [
          "[bad-param](ctx://repo/path/fixtures/ms1/context-source.md?lens=excerpt&prompt=ignore)",
          "[missing](ctx://repo/path/missing.md?lens=excerpt)",
        ].join("\n\n"),
        "utf8",
      );

      const result = await runCliExpectingExit([
        "dist/cli/index.js",
        "resolve",
        taskPath,
        "--registry",
        "fixtures/ms1/registry.json",
        "--repo-root",
        repoRoot,
        "--pretty",
      ], 1);
      const output = JSON.parse(result.stdout) as {
        diagnostics: Array<{ code: string }>;
      };

      expect(output.diagnostics.map((diagnostic) => diagnostic.code)).toEqual([
        "ctx.param.unsupported",
        "ctx.repoPath.unresolved",
      ]);
    } finally {
      await rm(tempRoot, { force: true, recursive: true });
    }
  });

  it("uses deterministic code-unit ordering for JSON object keys", () => {
    expect(
      stableJson({
        a: 1,
        A: 2,
        z: 3,
        2: "two",
        10: "ten",
        nested: { a: 1, A: 2, z: 3, 2: "two", 10: "ten" },
      }),
    ).toBe(
      '{"10":"ten","2":"two","A":2,"a":1,"nested":{"10":"ten","2":"two","A":2,"a":1,"z":3},"z":3}\n',
    );
  });

  it("serializes sparse arrays as valid JSON null entries", () => {
    expect(stableJson(new Array(2))).toBe("[null,null]\n");
    expect(stableJson(new Array(2), true)).toBe("[\n  null,\n  null\n]\n");
  });

  it("emits byte-identical resolve JSON across repeated runs", async () => {
    const args = [
      "dist/cli/index.js",
      "resolve",
      "fixtures/ms1/task.md",
      "--registry",
      "fixtures/ms1/registry.json",
      "--repo-root",
      ".",
      "--pretty",
    ];
    const first = await runCli(args);
    const second = await runCli(args);

    expect(first.stderr).toBe("");
    expect(second.stderr).toBe("");
    expect(second.stdout).toBe(first.stdout);
    expect(JSON.parse(first.stdout)).toMatchObject({
      artifacts: [
        {
          canonicalUrl: "ctx://repo/path/fixtures/ms1/context-source.md?lens=excerpt",
          contentHash: expect.stringMatching(/^sha256:[a-f0-9]{64}$/),
          resolverId: "repo-path",
        },
      ],
      diagnostics: [],
    });
  });

  it("emits deterministic lockfile data on request", async () => {
    const args = [
      "dist/cli/index.js",
      "resolve",
      "fixtures/ms1/task.md",
      "--registry",
      "fixtures/ms1/registry.json",
      "--repo-root",
      ".",
      "--lockfile",
      "--pretty",
    ];
    const first = await runCli(args);
    const second = await runCli(args);
    const output = JSON.parse(first.stdout) as {
      lockfile: {
        records: Array<{
          artifactHash: string;
          artifactPath: string;
          outputOptions: Record<string, unknown>;
          sourceHash: string;
          sourceIdentity: Record<string, unknown>;
        }>;
      };
    };

    expect(first.stderr).toBe("");
    expect(second.stderr).toBe("");
    expect(second.stdout).toBe(first.stdout);
    expect(output.lockfile.records).toHaveLength(1);
    expect(output.lockfile.records[0]).toMatchObject({
      artifactPath: expect.stringMatching(
        /^\.markdown-context\/artifacts\/repo-path\/[a-f0-9]{64}\.json$/,
      ),
      outputOptions: {
        artifactFormat: "json",
        excerptMaxBytes: 4096,
      },
      sourceHash: expect.stringMatching(/^sha256:[a-f0-9]{64}$/),
      sourceIdentity: {
        kind: "repo/path",
        path: "fixtures/ms1/context-source.md",
      },
    });
    expect(output.lockfile.records[0]?.artifactHash).toMatch(/^sha256:[a-f0-9]{64}$/);
  });

  it("writes canonical lockfile data without changing resolve stdout", async () => {
    const tempRoot = await mkdtemp(path.join(tmpdir(), "markdown-context-cli-lockfile-"));
    const lockfilePath = path.join(tempRoot, "nested", "context.lock.json");
    const targetPath = path.resolve("fixtures/ms1/task.md");

    try {
      const defaultResult = await runCli([
        "dist/cli/index.js",
        "resolve",
        targetPath,
        "--registry",
        "fixtures/ms1/registry.json",
        "--repo-root",
        ".",
      ]);
      const result = await runCli([
        "dist/cli/index.js",
        "resolve",
        targetPath,
        "--registry",
        "fixtures/ms1/registry.json",
        "--repo-root",
        ".",
        "--lockfile-out",
        lockfilePath,
      ]);
      const stdout = JSON.parse(result.stdout) as { lockfile?: unknown };
      const lockfile = JSON.parse(await readFile(lockfilePath, "utf8")) as {
        schemaVersion: string;
        records: unknown[];
      };

      expect(defaultResult.stderr).toBe("");
      expect(result.stderr).toBe("");
      expect(JSON.parse(result.stdout)).toEqual(JSON.parse(defaultResult.stdout));
      expect(stdout.lockfile).toBeUndefined();
      expect(lockfile.schemaVersion).toBe("markdown-context.lockfile.v0");
      expect(lockfile.records).toHaveLength(1);
    } finally {
      await rm(tempRoot, { force: true, recursive: true });
    }
  });

  it("keeps lockfile-out data stable across relative and absolute markdown paths", async () => {
    const tempRoot = await mkdtemp(path.join(tmpdir(), "markdown-context-cli-lockfile-out-"));
    const relativeLockfilePath = path.join(tempRoot, "relative.lock.json");
    const absoluteLockfilePath = path.join(tempRoot, "absolute.lock.json");

    try {
      const relative = await runCli([
        "dist/cli/index.js",
        "resolve",
        "fixtures/ms1/task.md",
        "--registry",
        "fixtures/ms1/registry.json",
        "--repo-root",
        ".",
        "--lockfile-out",
        relativeLockfilePath,
      ]);
      const absolute = await runCli([
        "dist/cli/index.js",
        "resolve",
        path.resolve("fixtures/ms1/task.md"),
        "--registry",
        "fixtures/ms1/registry.json",
        "--repo-root",
        ".",
        "--lockfile-out",
        absoluteLockfilePath,
      ]);

      expect(relative.stderr).toBe("");
      expect(absolute.stderr).toBe("");
      expect(await readFile(absoluteLockfilePath, "utf8")).toBe(
        await readFile(relativeLockfilePath, "utf8"),
      );
    } finally {
      await rm(tempRoot, { force: true, recursive: true });
    }
  });

  it("keeps resolve lockfiles stable across relative and absolute markdown paths", async () => {
    const relative = await runCli([
      "dist/cli/index.js",
      "resolve",
      "fixtures/ms1/task.md",
      "--registry",
      "fixtures/ms1/registry.json",
      "--repo-root",
      ".",
      "--lockfile",
    ]);
    const absolute = await runCli([
      "dist/cli/index.js",
      "resolve",
      path.resolve("fixtures/ms1/task.md"),
      "--registry",
      "fixtures/ms1/registry.json",
      "--repo-root",
      ".",
      "--lockfile",
    ]);

    expect(absolute.stderr).toBe("");
    expect(JSON.parse(absolute.stdout)).toEqual(JSON.parse(relative.stdout));
  });

  it("keeps resolve lockfiles stable across invocation working directories", async () => {
    const tempRoot = await mkdtemp(path.join(tmpdir(), "markdown-context-cli-cwd-"));

    try {
      const cliPath = path.resolve("dist/cli/index.js");
      const targetPath = path.resolve("fixtures/ms1/task.md");
      const registryPath = path.resolve("fixtures/ms1/registry.json");
      const repoRoot = process.cwd();
      const fromRepo = await runCli([
        cliPath,
        "resolve",
        targetPath,
        "--registry",
        registryPath,
        "--repo-root",
        repoRoot,
        "--lockfile",
      ]);
      const fromTemp = await runCliFrom(tempRoot, [
        cliPath,
        "resolve",
        targetPath,
        "--registry",
        registryPath,
        "--repo-root",
        repoRoot,
        "--lockfile",
      ]);

      expect(fromRepo.stderr).toBe("");
      expect(fromTemp.stderr).toBe("");
      expect(JSON.parse(fromTemp.stdout)).toEqual(JSON.parse(fromRepo.stdout));
    } finally {
      await rm(tempRoot, { force: true, recursive: true });
    }
  });

  it("keeps resolve lockfiles stable across symlinked repo root aliases", async () => {
    const tempRoot = await mkdtemp(path.join(tmpdir(), "markdown-context-cli-symlink-"));
    const repoLink = path.join(tempRoot, "repo-link");

    try {
      await symlink(process.cwd(), repoLink, "dir");

      const realRoot = await runCli([
        "dist/cli/index.js",
        "resolve",
        path.resolve("fixtures/ms1/task.md"),
        "--registry",
        "fixtures/ms1/registry.json",
        "--repo-root",
        ".",
        "--lockfile",
      ]);
      const symlinkRoot = await runCli([
        "dist/cli/index.js",
        "resolve",
        path.resolve("fixtures/ms1/task.md"),
        "--registry",
        "fixtures/ms1/registry.json",
        "--repo-root",
        repoLink,
        "--lockfile",
      ]);

      expect(symlinkRoot.stderr).toBe("");
      expect(JSON.parse(symlinkRoot.stdout)).toEqual(JSON.parse(realRoot.stdout));
    } finally {
      await rm(tempRoot, { force: true, recursive: true });
    }
  });

  it("preserves default resolve source paths when lockfile output is not requested", async () => {
    const absolutePath = path.resolve("fixtures/ms1/task.md");
    const result = await runCli([
      "dist/cli/index.js",
      "resolve",
      absolutePath,
      "--registry",
      "fixtures/ms1/registry.json",
      "--repo-root",
      ".",
    ]);
    const output = JSON.parse(result.stdout) as {
      artifacts: Array<{ citations: Array<{ sourcePath?: string }> }>;
    };

    expect(result.stderr).toBe("");
    expect(output.artifacts[0]?.citations[0]?.sourcePath).toBe(absolutePath);
  });

  it("omits unstable source paths for resolve inputs outside the repo root", async () => {
    const tempRoot = await mkdtemp(path.join(tmpdir(), "markdown-context-cli-external-"));
    const taskPath = path.join(tempRoot, "task.md");

    try {
      await writeFile(
        taskPath,
        "[valid](ctx://repo/path/fixtures/ms1/context-source.md?lens=excerpt)",
        "utf8",
      );

      const result = await runCli([
        "dist/cli/index.js",
        "resolve",
        taskPath,
        "--registry",
        "fixtures/ms1/registry.json",
        "--repo-root",
        ".",
        "--lockfile",
      ]);
      const output = JSON.parse(result.stdout) as {
        artifacts: Array<{ citations: Array<{ sourcePath?: string }> }>;
      };

      expect(result.stderr).toBe("");
      expect(output.artifacts[0]?.citations[0]?.sourcePath).toBeUndefined();
    } finally {
      await rm(tempRoot, { force: true, recursive: true });
    }
  });

  it("does not produce lockfile records when validation rejects links", async () => {
    const result = await runCliExpectingExit([
      "dist/cli/index.js",
      "resolve",
      "fixtures/ms1/invalid-param.md",
      "--registry",
      "fixtures/ms1/registry.json",
      "--repo-root",
      ".",
      "--lockfile",
      "--pretty",
    ], 1);
    const output = JSON.parse(result.stdout) as {
      artifacts: unknown[];
      lockfile: { records: unknown[] };
    };

    expect(result.stderr).toBe("");
    expect(output.artifacts).toEqual([]);
    expect(output.lockfile.records).toEqual([]);
  });

  it("keeps lockfile provenance for emitted artifacts when other links are rejected", async () => {
    const tempRoot = await mkdtemp(path.join(tmpdir(), "markdown-context-cli-mixed-"));
    const taskPath = path.join(tempRoot, "mixed.md");

    try {
      await writeFile(
        taskPath,
        [
          "[valid](ctx://repo/path/fixtures/ms1/context-source.md?lens=excerpt)",
          "[invalid](ctx://repo/path/fixtures/ms1/context-source.md?lens=excerpt&prompt=ignore)",
        ].join("\n\n"),
        "utf8",
      );

      const result = await runCliExpectingExit([
        "dist/cli/index.js",
        "resolve",
        taskPath,
        "--registry",
        "fixtures/ms1/registry.json",
        "--repo-root",
        ".",
        "--lockfile",
        "--pretty",
      ], 1);
      const output = JSON.parse(result.stdout) as {
        artifacts: unknown[];
        diagnostics: Array<{ code: string }>;
        lockfile: { records: unknown[] };
      };

      expect(result.stderr).toBe("");
      expect(output.artifacts).toHaveLength(1);
      expect(output.diagnostics.map((diagnostic) => diagnostic.code)).toContain(
        "ctx.param.unsupported",
      );
      expect(output.lockfile.records).toHaveLength(1);
    } finally {
      await rm(tempRoot, { force: true, recursive: true });
    }
  });
});

async function runCli(args: string[]): Promise<{ stdout: string; stderr: string }> {
  const result = await execFileAsync(process.execPath, args);

  return {
    stdout: result.stdout,
    stderr: result.stderr,
  };
}

async function runCliFrom(
  cwd: string,
  args: string[],
): Promise<{ stdout: string; stderr: string }> {
  const result = await execFileAsync(process.execPath, args, { cwd });

  return {
    stdout: result.stdout,
    stderr: result.stderr,
  };
}

async function runCliExpectingExit(
  args: string[],
  expectedCode: number,
): Promise<{ stdout: string; stderr: string }> {
  try {
    await execFileAsync(process.execPath, args);
  } catch (error) {
    const result = error as { code?: unknown; stdout?: unknown; stderr?: unknown };

    expect(result.code).toBe(expectedCode);
    return {
      stdout: typeof result.stdout === "string" ? result.stdout : "",
      stderr: typeof result.stderr === "string" ? result.stderr : "",
    };
  }

  throw new Error(`Expected CLI command to exit with code ${expectedCode}.`);
}
