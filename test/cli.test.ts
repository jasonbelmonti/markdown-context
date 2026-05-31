import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

import { stableJson } from "../src/cli/json.js";
import { hashCanonicalJson, hashUtf8Bytes, serializeCanonicalJson } from "../src/index.js";
import type { ContextLockfile, RepoPathLensArtifact } from "../src/index.js";

const SHA256_PATTERN = /^sha256:[a-f0-9]{64}$/;

const execFileAsync = promisify(execFile);

describe("CLI operator contract", () => {
  it("rejects unknown commands before file IO or registry checks", async () => {
    const result = await runCliExpectingExit([
      "dist/cli/index.js",
      "inspect",
      "missing.md",
    ], 2);
    const output = parseCliError(result);

    expect(output.diagnostics).toMatchObject([
      {
        code: "cli.command.unknown",
        message: "Unknown command: inspect.",
        severity: "error",
      },
    ]);
    expect(output.usage?.join("\n")).toContain("Usage:");
    expect(result.stdout).not.toContain("ENOENT");
    expect(result.stdout).not.toContain("requires --registry");
  });

  it("rejects unknown options instead of treating them as files", async () => {
    const result = await runCliExpectingExit([
      "dist/cli/index.js",
      "scan",
      "fixtures/ms1/task.md",
      "--format",
      "json",
    ], 2);
    const output = parseCliError(result);

    expect(output.diagnostics).toMatchObject([
      {
        code: "cli.option.unknown",
        message: "Unknown option: --format.",
        severity: "error",
      },
    ]);
    expect(output.usage?.join("\n")).toContain("Usage:");
  });

  it("rejects extra positional arguments", async () => {
    const result = await runCliExpectingExit([
      "dist/cli/index.js",
      "scan",
      "fixtures/ms1/task.md",
      "fixtures/ms1/context-source.md",
    ], 2);
    const output = parseCliError(result);

    expect(output.diagnostics).toMatchObject([
      {
        code: "cli.argument.count",
        message: "Expected exactly one <markdown-file> argument.",
        severity: "error",
      },
    ]);
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
    const scanOutput = parseCliError(scanResult);
    const validateOutput = parseCliError(validateResult);
    const scanLockfileOutput = parseCliError(scanLockfileResult);

    expect(scanOutput.diagnostics).toMatchObject([
      { code: "cli.option.unsupported", message: "scan does not support --registry." },
    ]);
    expect(validateOutput.diagnostics).toMatchObject([
      { code: "cli.option.unsupported", message: "validate does not support --repo-root." },
    ]);
    expect(scanLockfileOutput.diagnostics).toMatchObject([
      { code: "cli.option.unsupported", message: "scan does not support --lockfile." },
    ]);
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
    const validateOutput = parseCliError(validateResult);
    const resolveOutput = parseCliError(resolveResult);

    expect(validateOutput.diagnostics).toMatchObject([
      {
        code: "cli.option.required",
        message: "validate requires --registry <path>.",
        severity: "error",
      },
    ]);
    expect(resolveOutput.diagnostics).toMatchObject([
      {
        code: "cli.option.required",
        message: "resolve requires --registry <path>.",
        severity: "error",
      },
    ]);
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
    const output = parseCliError(result);

    expect(output.diagnostics).toMatchObject([
      {
        code: "cli.option.duplicate",
        message: "Duplicate option: --registry.",
        severity: "error",
      },
    ]);
  });

  it("emits machine-readable diagnostics for file IO failures", async () => {
    const result = await runCliExpectingExit([
      "dist/cli/index.js",
      "scan",
      "missing.md",
    ], 2);
    const output = parseCliError(result);

    expect(output.diagnostics).toHaveLength(1);
    expect(output.diagnostics[0]).toMatchObject({
      code: "cli.execution.failed",
      severity: "error",
    });
    expect(output.diagnostics[0]?.message).toContain("ENOENT");
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

  it("does not resolve any links after validation errors", async () => {
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
        artifacts: unknown[];
        diagnostics: Array<{ code: string }>;
      };

      expect(output.artifacts).toEqual([]);
      expect(output.diagnostics.map((diagnostic) => diagnostic.code)).toEqual([
        "ctx.param.unsupported",
      ]);
    } finally {
      await rm(tempRoot, { force: true, recursive: true });
    }
  });

  it("resolves repo/path links and omits ignored trace links from CLI lockfiles", async () => {
    const tempRoot = await mkdtemp(path.join(tmpdir(), "markdown-context-cli-trace-"));
    const taskPath = path.join(tempRoot, "mixed-trace.md");
    const lockfilePath = path.join(tempRoot, "context.lock.json");

    try {
      await writeFile(taskPath, mixedTraceMarkdown(), "utf8");

      const result = await runCli([
        "dist/cli/index.js",
        "resolve",
        taskPath,
        "--registry",
        "fixtures/ms1/registry-ignored-trace.json",
        "--repo-root",
        ".",
        "--lockfile",
        "--lockfile-out",
        lockfilePath,
        "--pretty",
      ]);
      const output = JSON.parse(result.stdout) as {
        artifacts: Array<{ canonicalUrl: string; resolverId: string }>;
        diagnostics: unknown[];
        lockfile: { records: Array<{ canonicalUrl: string }> };
      };
      const writtenLockfile = JSON.parse(await readFile(lockfilePath, "utf8")) as {
        records: Array<{ canonicalUrl: string }>;
      };

      expect(result.stderr).toBe("");
      expect(output.diagnostics).toEqual([]);
      expect(output.artifacts).toEqual([
        expect.objectContaining({
          canonicalUrl: "ctx://repo/path/fixtures/ms1/context-source.md?lens=excerpt",
          resolverId: "repo-path",
        }),
      ]);
      expect(output.lockfile.records.map((record) => record.canonicalUrl)).toEqual([
        "ctx://repo/path/fixtures/ms1/context-source.md?lens=excerpt",
      ]);
      expect(writtenLockfile.records).toEqual(output.lockfile.records);
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

  it("proves repeated resolve artifact bytes, lockfile bytes, and hashes stay stable", async () => {
    const tempRoot = await mkdtemp(path.join(tmpdir(), "markdown-context-cli-determinism-"));
    const firstLockfilePath = path.join(tempRoot, "first.lock.json");
    const secondLockfilePath = path.join(tempRoot, "second.lock.json");

    try {
      const first = await runCli(resolveWithLockfileArgs(firstLockfilePath));
      const second = await runCli(resolveWithLockfileArgs(secondLockfilePath));
      const firstLockfileBytes = await readFile(firstLockfilePath, "utf8");
      const secondLockfileBytes = await readFile(secondLockfilePath, "utf8");
      const firstOutput = JSON.parse(first.stdout) as ResolveWithLockfileOutput;
      const secondOutput = JSON.parse(second.stdout) as ResolveWithLockfileOutput;
      const firstArtifact = firstOutput.artifacts[0];
      const secondArtifact = secondOutput.artifacts[0];
      const firstRecord = firstOutput.lockfile.records[0];
      const secondRecord = secondOutput.lockfile.records[0];

      expect(first.stderr).toBe("");
      expect(second.stderr).toBe("");
      expect(firstOutput.diagnostics).toEqual([]);
      expect(secondOutput.diagnostics).toEqual([]);
      expect(first.stdout).toBe(second.stdout);
      expect(firstLockfileBytes).toBe(secondLockfileBytes);
      expect(firstArtifact).toBeDefined();
      expect(secondArtifact).toBeDefined();
      expect(firstRecord).toBeDefined();
      expect(secondRecord).toBeDefined();

      if (
        firstArtifact === undefined ||
        secondArtifact === undefined ||
        firstRecord === undefined ||
        secondRecord === undefined
      ) {
        throw new Error("Expected repeated resolve runs to emit one artifact and one lockfile record.");
      }

      const firstArtifactBytes = serializeCanonicalJson(firstArtifact);
      const secondArtifactBytes = serializeCanonicalJson(secondArtifact);
      const firstLockfileHash = hashUtf8Bytes(firstLockfileBytes);
      const secondLockfileHash = hashUtf8Bytes(secondLockfileBytes);

      expect(secondArtifactBytes).toBe(firstArtifactBytes);
      expect(secondOutput.lockfile).toEqual(firstOutput.lockfile);
      expect(JSON.parse(secondLockfileBytes)).toEqual(JSON.parse(firstLockfileBytes));
      expect(secondLockfileHash).toBe(firstLockfileHash);
      expect(firstRecord.artifactHash).toBe(hashCanonicalJson(firstArtifact));
      expect(secondRecord.artifactHash).toBe(firstRecord.artifactHash);
      expect(secondRecord.registryHash).toBe(firstRecord.registryHash);
      expect(secondRecord.sourceHash).toBe(firstRecord.sourceHash);
      expect(hashUtf8Bytes(firstArtifactBytes)).toMatch(SHA256_PATTERN);
      expect(firstLockfileHash).toMatch(SHA256_PATTERN);
      expect(firstRecord).toMatchObject({
        artifactHash: expect.stringMatching(SHA256_PATTERN),
        artifactPath: `.markdown-context/artifacts/repo-path/${firstRecord.artifactHash.slice("sha256:".length)}.json`,
        outputOptions: {
          artifactFormat: "json",
          excerptMaxBytes: 4096,
        },
        registryHash: expect.stringMatching(SHA256_PATTERN),
        sourceHash: expect.stringMatching(SHA256_PATTERN),
        sourceIdentity: {
          kind: "repo/path",
          path: "fixtures/ms1/context-source.md",
        },
      });
    } finally {
      await rm(tempRoot, { force: true, recursive: true });
    }
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

  it("does not emit artifacts or lockfile records when sourcePolicy rejects links", async () => {
    const tempRoot = await mkdtemp(path.join(tmpdir(), "markdown-context-cli-policy-"));
    const taskPath = path.join(tempRoot, "policy-task.md");
    const registryPath = path.join(tempRoot, "registry.json");
    const lockfilePath = path.join(tempRoot, "context.lock.json");

    try {
      await writeFile(
        taskPath,
        "[private](ctx://repo/path/fixtures/ms1/context-source.md?lens=excerpt)",
        "utf8",
      );
      await writeFile(
        registryPath,
        JSON.stringify(
          {
            schemaVersion: "markdown-context.registry.v0",
            registryId: "policy-local",
            registryVersion: "0.1.0",
            resources: [
              {
                scheme: "ctx",
                namespace: "repo",
                kind: "path",
                defaultLens: "excerpt",
                lenses: ["excerpt"],
                params: [],
                sourcePolicy: {
                  allowedPathPrefixes: ["fixtures/ms1/public/"],
                },
              },
            ],
          },
          null,
          2,
        ),
        "utf8",
      );

      const result = await runCliExpectingExit([
        "dist/cli/index.js",
        "resolve",
        taskPath,
        "--registry",
        registryPath,
        "--repo-root",
        ".",
        "--lockfile",
        "--lockfile-out",
        lockfilePath,
        "--pretty",
      ], 1);
      const output = JSON.parse(result.stdout) as {
        artifacts: unknown[];
        diagnostics: Array<{ code: string; severity: string }>;
        lockfile: { records: unknown[] };
      };
      const writtenLockfile = JSON.parse(await readFile(lockfilePath, "utf8")) as {
        records: unknown[];
      };

      expect(result.stderr).toBe("");
      expect(output.artifacts).toEqual([]);
      expect(output.lockfile.records).toEqual([]);
      expect(writtenLockfile.records).toEqual([]);
      expect(output.diagnostics).toMatchObject([
        {
          code: "ctx.sourcePolicy.disallowed",
          severity: "error",
        },
      ]);
    } finally {
      await rm(tempRoot, { force: true, recursive: true });
    }
  });

  it("keeps validation diagnostics visible when lockfile-out cannot be written", async () => {
    const tempRoot = await mkdtemp(path.join(tmpdir(), "markdown-context-cli-lockfile-fail-"));
    const blockingPath = path.join(tempRoot, "not-a-directory");
    const lockfilePath = path.join(blockingPath, "context.lock.json");

    try {
      await writeFile(blockingPath, "blocking file", "utf8");

      const result = await runCliExpectingExit([
        "dist/cli/index.js",
        "resolve",
        "fixtures/ms1/invalid-param.md",
        "--registry",
        "fixtures/ms1/registry.json",
        "--repo-root",
        ".",
        "--lockfile-out",
        lockfilePath,
        "--pretty",
      ], 1);
      const output = JSON.parse(result.stdout) as {
        artifacts: unknown[];
        diagnostics: Array<{ code: string; severity: string }>;
      };

      expect(result.stderr).toBe("");
      expect(output.artifacts).toEqual([]);
      expect(output.diagnostics).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ code: "ctx.param.unsupported", severity: "error" }),
          expect.objectContaining({ code: "cli.lockfile.writeFailed", severity: "error" }),
        ]),
      );
    } finally {
      await rm(tempRoot, { force: true, recursive: true });
    }
  });

  it("does not emit artifacts or lockfile records when other links are rejected", async () => {
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
      expect(output.artifacts).toEqual([]);
      expect(output.diagnostics.map((diagnostic) => diagnostic.code)).toContain(
        "ctx.param.unsupported",
      );
      expect(output.lockfile.records).toEqual([]);
    } finally {
      await rm(tempRoot, { force: true, recursive: true });
    }
  });
});

interface ResolveWithLockfileOutput {
  artifacts: RepoPathLensArtifact[];
  diagnostics: unknown[];
  lockfile: ContextLockfile;
}

interface CliErrorOutput {
  schemaVersion: "markdown-context.cli-error.v0";
  diagnostics: Array<{
    code: string;
    message: string;
    severity: string;
  }>;
  usage?: string[];
}

function resolveWithLockfileArgs(lockfilePath: string): string[] {
  return [
    "dist/cli/index.js",
    "resolve",
    "fixtures/ms1/task.md",
    "--registry",
    "fixtures/ms1/registry.json",
    "--repo-root",
    ".",
    "--lockfile",
    "--lockfile-out",
    lockfilePath,
    "--pretty",
  ];
}

function mixedTraceMarkdown(): string {
  return [
    "[valid](ctx://repo/path/fixtures/ms1/context-source.md?lens=excerpt)",
    "[trace entity](ctx://trace/entity/TASK-1?lens=graph&prompt=ignore)",
    "[trace range](ctx://trace/range/TASK-1/TASK-2)",
  ].join("\n\n");
}

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

function parseCliError(result: { stdout: string; stderr: string }): CliErrorOutput {
  expect(result.stderr).toBe("");

  const output = JSON.parse(result.stdout) as CliErrorOutput;

  expect(output.schemaVersion).toBe("markdown-context.cli-error.v0");
  expect(output.diagnostics.every((diagnostic) => diagnostic.severity === "error")).toBe(true);

  return output;
}
