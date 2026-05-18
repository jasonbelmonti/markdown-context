import { execFile } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
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

    expect(scanResult.stdout).toBe("");
    expect(scanResult.stderr).toContain("scan does not support --registry.");
    expect(validateResult.stdout).toBe("");
    expect(validateResult.stderr).toContain("validate does not support --repo-root.");
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
});

async function runCli(args: string[]): Promise<{ stdout: string; stderr: string }> {
  const result = await execFileAsync(process.execPath, args);

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
