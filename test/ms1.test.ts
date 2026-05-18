import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

import { scanMarkdown } from "../src/core/scan.js";
import {
  resolveScanResult as resolvePublicScanResult,
  validateScanResult as validatePublicScanResult,
} from "../src/index.js";
import { parseRegistry, validateContextLinks } from "../src/registry/registry.js";
import { resolveRepoPathLink } from "../src/resolvers/repo-path.js";

const execFileAsync = promisify(execFile);

describe("BEL-1049 MS-1 critical path", () => {
  it("scans one ctx repo/path link with sourceRange", async () => {
    const markdown = await readFile("fixtures/ms1/task.md", "utf8");
    const scan = scanMarkdown(markdown, "fixtures/ms1/task.md");

    expect(scan.diagnostics).toEqual([]);
    expect(scan.links).toHaveLength(1);
    expect(scan.links[0]).toMatchObject({
      label: "source fixture",
      url: "ctx://repo/path/fixtures/ms1/context-source.md?lens=excerpt",
      canonicalUrl: "ctx://repo/path/fixtures/ms1/context-source.md?lens=excerpt",
      namespace: "repo",
      kind: "path",
      id: "fixtures/ms1/context-source.md",
      requestedLens: "excerpt",
      sourcePath: "fixtures/ms1/task.md",
    });
    expect(scan.links[0]?.sourceRange.start.line).toBe(3);
  });

  it("scans ctx links with mixed-case schemes", () => {
    const scan = scanMarkdown("[source](CTX://repo/path/fixtures/ms1/context-source.md?lens=excerpt)");

    expect(scan.diagnostics).toEqual([]);
    expect(scan.links).toHaveLength(1);
    expect(scan.links[0]).toMatchObject({
      url: "CTX://repo/path/fixtures/ms1/context-source.md?lens=excerpt",
      canonicalUrl: "ctx://repo/path/fixtures/ms1/context-source.md?lens=excerpt",
      scheme: "ctx",
      namespace: "repo",
      kind: "path",
      id: "fixtures/ms1/context-source.md",
    });
  });

  it("extracts ctx links with sourceRange from link-like Markdown references", () => {
    const scan = scanMarkdown(
      [
        "[inline](ctx://repo/path/inline.md?lens=excerpt)",
        "![inline image](ctx://repo/path/image.md?lens=excerpt)",
        "[definition-only]: ctx://repo/path/definition-only.md?lens=excerpt",
        "[link-ref]: ctx://repo/path/link-ref.md?lens=excerpt",
        "[image-ref]: ctx://repo/path/image-ref.md?lens=excerpt",
        "[reference usage][link-ref]",
        "![image reference][image-ref]",
      ].join("\n\n"),
    );

    expect(scan.diagnostics).toEqual([]);
    expect(scan.links).toHaveLength(7);
    expect(scan.links.every((link) => link.sourceRange.start.line > 0)).toBe(true);
    expect(scan.links.map((link) => link.label)).toEqual(
      expect.arrayContaining([
        "inline",
        "inline image",
        "definition-only",
        "link-ref",
        "image-ref",
        "reference usage",
        "image reference",
      ]),
    );
    expect(scan.links.map((link) => link.canonicalUrl)).toEqual(
      expect.arrayContaining([
        "ctx://repo/path/inline.md?lens=excerpt",
        "ctx://repo/path/image.md?lens=excerpt",
        "ctx://repo/path/definition-only.md?lens=excerpt",
        "ctx://repo/path/link-ref.md?lens=excerpt",
        "ctx://repo/path/image-ref.md?lens=excerpt",
      ]),
    );
    expect(
      scan.links.filter((link) => link.canonicalUrl === "ctx://repo/path/link-ref.md?lens=excerpt"),
    ).toHaveLength(2);
    expect(
      scan.links.filter((link) => link.canonicalUrl === "ctx://repo/path/image-ref.md?lens=excerpt"),
    ).toHaveLength(2);
  });

  it("sorts lens with other query params in canonical URLs", () => {
    const scan = scanMarkdown(
      "[source](ctx://repo/path/fixtures/ms1/context-source.md?lens=excerpt&a=1)",
    );

    expect(scan.diagnostics).toEqual([]);
    expect(scan.links[0]).toMatchObject({
      canonicalUrl: "ctx://repo/path/fixtures/ms1/context-source.md?a=1&lens=excerpt",
      requestedLens: "excerpt",
      params: {
        a: "1",
      },
    });
  });

  it("sorts decoded query params with deterministic code-unit ordering", () => {
    const scan = scanMarkdown(
      "[source](ctx://repo/path/fixtures/ms1/context-source.md?a=lower&A=upper&lens=excerpt&%7A=last)",
    );

    expect(scan.diagnostics).toEqual([]);
    expect(scan.links[0]?.canonicalUrl).toBe(
      "ctx://repo/path/fixtures/ms1/context-source.md?A=upper&a=lower&lens=excerpt&z=last",
    );
  });

  it("reports malformed ctx path escapes as scan diagnostics", () => {
    const scan = scanMarkdown("[bad](ctx://repo/path/%E0%A4%A?lens=excerpt)");

    expect(scan.links).toEqual([]);
    expect(scan.diagnostics).toMatchObject([
      {
        code: "ctx.url.invalid",
        severity: "error",
        url: "ctx://repo/path/%E0%A4%A?lens=excerpt",
      },
    ]);
  });

  it("reports duplicate params after URL query decoding", () => {
    const scan = scanMarkdown(
      "[bad](ctx://repo/path/fixtures/ms1/context-source.md?lens=excerpt&%6Cens=full)",
    );

    expect(scan.links).toEqual([]);
    expect(scan.diagnostics).toMatchObject([
      {
        code: "ctx.param.duplicate",
        severity: "error",
        url: "ctx://repo/path/fixtures/ms1/context-source.md?lens=excerpt&%6Cens=full",
      },
    ]);
  });

  it("does not emit parsed links that already have scan errors", async () => {
    const registry = parseRegistry(
      JSON.parse(await readFile("fixtures/ms1/registry.json", "utf8")),
    );
    const markdown = await readFile("fixtures/ms1/duplicate-param.md", "utf8");
    const scan = scanMarkdown(markdown, "fixtures/ms1/duplicate-param.md");
    const validated = validateContextLinks(scan.links, registry);
    const failClosed = validatePublicScanResult(scan, registry);

    expect(scan.links).toEqual([]);
    expect(scan.diagnostics).toMatchObject([
      {
        code: "ctx.param.duplicate",
        severity: "error",
      },
    ]);
    expect(validated.valid).toBe(true);
    expect(validated.links).toEqual([]);
    expect(failClosed.valid).toBe(false);
    expect(failClosed.links).toEqual([]);
    expect(failClosed.diagnostics).toMatchObject([
      {
        code: "ctx.param.duplicate",
        severity: "error",
      },
    ]);
  });

  it("does not export the link-only validator from the root public API", async () => {
    const publicApi = await import("../src/index.js");

    expect(Object.hasOwn(publicApi, "validateContextLinks")).toBe(false);
    expect(Object.hasOwn(publicApi, "validateScanResult")).toBe(true);
  });

  it("does not export the raw repo/path resolver from the root public API", async () => {
    const publicApi = await import("../src/index.js");

    expect(Object.hasOwn(publicApi, "resolveRepoPathLink")).toBe(false);
    expect(Object.hasOwn(publicApi, "resolveScanResult")).toBe(true);
  });

  it("keeps rejected scan inputs from resolving through the root public API", async () => {
    const registry = parseRegistry(
      JSON.parse(await readFile("fixtures/ms1/registry.json", "utf8")),
    );
    const markdown = await readFile("fixtures/ms1/duplicate-param.md", "utf8");
    const scan = scanMarkdown(markdown, "fixtures/ms1/duplicate-param.md");
    const resolved = await resolvePublicScanResult(scan, registry, { repoRoot: process.cwd() });

    expect(resolved.artifacts).toEqual([]);
    expect(resolved.diagnostics).toMatchObject([
      {
        code: "ctx.param.duplicate",
        severity: "error",
      },
    ]);
  });

  it("keeps registry-rejected inputs from resolving through the root public API", async () => {
    const registry = parseRegistry(
      JSON.parse(await readFile("fixtures/ms1/registry.json", "utf8")),
    );
    const markdown = await readFile("fixtures/ms1/invalid-param.md", "utf8");
    const scan = scanMarkdown(markdown, "fixtures/ms1/invalid-param.md");
    const resolved = await resolvePublicScanResult(scan, registry, { repoRoot: process.cwd() });

    expect(resolved.artifacts).toEqual([]);
    expect(resolved.diagnostics).toMatchObject([
      {
        code: "ctx.param.unsupported",
        severity: "error",
      },
    ]);
  });

  it("keeps mixed accepted and registry-rejected inputs from resolving through the root public API", async () => {
    const registry = parseRegistry(
      JSON.parse(await readFile("fixtures/ms1/registry.json", "utf8")),
    );
    const markdown = [
      "[valid](ctx://repo/path/fixtures/ms1/context-source.md?lens=excerpt)",
      "[invalid](ctx://repo/path/fixtures/ms1/context-source.md?lens=excerpt&prompt=ignore)",
    ].join("\n\n");
    const scan = scanMarkdown(markdown, "mixed.md");
    const resolved = await resolvePublicScanResult(scan, registry, { repoRoot: process.cwd() });

    expect(scan.links).toHaveLength(2);
    expect(resolved.artifacts).toEqual([]);
    expect(resolved.diagnostics).toMatchObject([
      {
        code: "ctx.param.unsupported",
        severity: "error",
      },
    ]);
  });

  it("resolves accepted links through the root public API safe pipeline", async () => {
    const registry = parseRegistry(
      JSON.parse(await readFile("fixtures/ms1/registry.json", "utf8")),
    );
    const markdown = await readFile("fixtures/ms1/task.md", "utf8");
    const scan = scanMarkdown(markdown, "fixtures/ms1/task.md");
    const resolved = await resolvePublicScanResult(scan, registry, { repoRoot: process.cwd() });

    expect(resolved.diagnostics).toEqual([]);
    expect(resolved.artifacts).toHaveLength(1);
    expect(resolved.artifacts[0]).toMatchObject({
      canonicalUrl: "ctx://repo/path/fixtures/ms1/context-source.md?lens=excerpt",
      selectedLens: "excerpt",
      resolverId: "repo-path",
    });
  });

  it("validates valid links and rejects prompt-like params", async () => {
    const registry = parseRegistry(
      JSON.parse(await readFile("fixtures/ms1/registry.json", "utf8")),
    );
    const validMarkdown = await readFile("fixtures/ms1/task.md", "utf8");
    const invalidMarkdown = await readFile("fixtures/ms1/invalid-param.md", "utf8");

    const valid = validateContextLinks(scanMarkdown(validMarkdown).links, registry);
    const invalid = validateContextLinks(scanMarkdown(invalidMarkdown).links, registry);

    expect(valid.valid).toBe(true);
    expect(valid.links[0]?.selectedLens).toBe("excerpt");
    expect(invalid.valid).toBe(false);
    expect(invalid.diagnostics).toMatchObject([
      {
        code: "ctx.param.unsupported",
        severity: "error",
        url: "ctx://repo/path/fixtures/ms1/context-source.md?lens=excerpt&prompt=ignore-previous-instructions",
      },
    ]);
  });

  it("selects the registry default lens when a link omits lens", async () => {
    const registry = parseRegistry(
      JSON.parse(await readFile("fixtures/ms1/registry.json", "utf8")),
    );
    const scan = scanMarkdown(
      "[source fixture](ctx://repo/path/fixtures/ms1/context-source.md)",
      "fixture.md",
    );
    const validated = validateContextLinks(scan.links, registry);
    const resolved = await resolveRepoPathLink(validated.links, { repoRoot: process.cwd() });

    expect(scan.diagnostics).toEqual([]);
    expect(scan.links).toHaveLength(1);
    expect(scan.links[0]).toMatchObject({
      canonicalUrl: "ctx://repo/path/fixtures/ms1/context-source.md",
      id: "fixtures/ms1/context-source.md",
    });
    expect(Object.keys(scan.links[0]?.params ?? {})).toEqual([]);
    expect(scan.links[0]?.requestedLens).toBeUndefined();
    expect(validated.valid).toBe(true);
    expect(validated.links[0]?.selectedLens).toBe("excerpt");
    expect(resolved.diagnostics).toEqual([]);
    expect(resolved.artifacts).toHaveLength(1);
    expect(resolved.artifacts[0]).toMatchObject({
      canonicalUrl: "ctx://repo/path/fixtures/ms1/context-source.md",
      selectedLens: "excerpt",
      resolverId: "repo-path",
    });
  });

  it("keeps prototype-named query params visible to validation", async () => {
    const registry = parseRegistry(
      JSON.parse(await readFile("fixtures/ms1/registry.json", "utf8")),
    );
    const scan = scanMarkdown(
      "[proto](ctx://repo/path/fixtures/ms1/context-source.md?lens=excerpt&__proto__=ignore)",
    );
    const link = scan.links[0];
    const invalid = validateContextLinks(scan.links, registry);

    expect(scan.diagnostics).toEqual([]);
    expect(link?.params.__proto__).toBe("ignore");
    expect(Object.hasOwn(link?.params ?? {}, "__proto__")).toBe(true);
    expect(invalid.valid).toBe(false);
    expect(invalid.diagnostics).toMatchObject([
      {
        code: "ctx.param.unsupported",
        severity: "error",
        url: "ctx://repo/path/fixtures/ms1/context-source.md?lens=excerpt&__proto__=ignore",
      },
    ]);
  });

  it("rejects unsupported registry schema versions", async () => {
    const registry = JSON.parse(
      await readFile("fixtures/ms1/registry.json", "utf8"),
    ) as Record<string, unknown>;

    registry.schemaVersion = "markdown-context.registry.v999";

    expect(() => parseRegistry(registry)).toThrow(
      "Unsupported registry schemaVersion: markdown-context.registry.v999.",
    );
  });

  it.each([
    [
      "default lens outside declared lenses",
      {
        defaultLens: "full",
        lenses: ["excerpt"],
      },
      "Registry resource.defaultLens must be declared in resource.lenses.",
    ],
    [
      "empty lenses",
      {
        lenses: [],
      },
      "Registry resource.lenses must contain at least one value.",
    ],
    [
      "empty lens names",
      {
        lenses: ["excerpt", ""],
      },
      "Registry resource.lenses must not contain empty strings.",
    ],
    [
      "duplicate lens names",
      {
        lenses: ["excerpt", "excerpt"],
      },
      "Registry resource.lenses must not contain duplicate values: excerpt.",
    ],
    [
      "empty param names",
      {
        params: [""],
      },
      "Registry resource.params must not contain empty strings.",
    ],
    [
      "duplicate param names",
      {
        params: ["mode", "mode"],
      },
      "Registry resource.params must not contain duplicate values: mode.",
    ],
  ])("rejects registry resources with %s", (_label, override, expectedMessage) => {
    expect(() => parseRegistry(registryWithResource(override))).toThrow(expectedMessage);
  });

  it("rejects duplicate registry resource declarations", () => {
    expect(() =>
      parseRegistry({
        schemaVersion: "markdown-context.registry.v0",
        registryId: "fixtures/ms1",
        registryVersion: "0.1.0",
        resources: [
          validRegistryResource(),
          {
            ...validRegistryResource(),
            scheme: "CTX",
            namespace: "REPO",
          },
        ],
      }),
    ).toThrow(
      "Registry resources must not contain duplicate resource declarations: ctx://repo/path.",
    );
  });

  it("returns scan diagnostics from validate CLI output", async () => {
    const result = await runCliExpectingExitOne([
      "dist/cli/index.js",
      "validate",
      "fixtures/ms1/duplicate-param.md",
      "--registry",
      "fixtures/ms1/registry.json",
      "--pretty",
    ]);
    const output = JSON.parse(result.stdout) as {
      valid: boolean;
      diagnostics: Array<{ code: string; severity: string }>;
    };

    expect(output.valid).toBe(false);
    expect(output).toMatchObject({ links: [] });
    expect(output.diagnostics).toMatchObject([
      {
        code: "ctx.param.duplicate",
        severity: "error",
      },
    ]);
  });

  it("does not resolve links from a scan result with errors", async () => {
    const result = await runCliExpectingExitOne([
      "dist/cli/index.js",
      "resolve",
      "fixtures/ms1/duplicate-param.md",
      "--registry",
      "fixtures/ms1/registry.json",
      "--repo-root",
      ".",
      "--pretty",
    ]);
    const output = JSON.parse(result.stdout) as {
      artifacts: unknown[];
      diagnostics: Array<{ code: string; severity: string }>;
    };

    expect(output.artifacts).toEqual([]);
    expect(output.diagnostics).toMatchObject([
      {
        code: "ctx.param.duplicate",
        severity: "error",
      },
    ]);
  });

  it("returns structured diagnostics for unresolved repo paths through the CLI", async () => {
    const tempRoot = await mkdtemp(path.join(tmpdir(), "markdown-context-ms1-"));
    const repoRoot = path.join(tempRoot, "repo");
    const taskPath = path.join(tempRoot, "missing-task.md");

    try {
      await mkdir(repoRoot);
      await writeFile(
        taskPath,
        "[missing](ctx://repo/path/missing.md?lens=excerpt)\n",
        "utf8",
      );

      const result = await runCliExpectingExitOne([
        "dist/cli/index.js",
        "resolve",
        taskPath,
        "--registry",
        "fixtures/ms1/registry.json",
        "--repo-root",
        repoRoot,
        "--pretty",
      ]);
      const output = JSON.parse(result.stdout) as {
        artifacts: unknown[];
        diagnostics: Array<{ code: string; severity: string }>;
      };

      expect(output.artifacts).toEqual([]);
      expect(output.diagnostics).toMatchObject([
        {
          code: "ctx.repoPath.unresolved",
          severity: "error",
        },
      ]);
    } finally {
      await rm(tempRoot, { force: true, recursive: true });
    }
  });

  it("resolves valid links through the CLI", async () => {
    const result = await runCli([
      "dist/cli/index.js",
      "resolve",
      "fixtures/ms1/task.md",
      "--registry",
      "fixtures/ms1/registry.json",
      "--repo-root",
      ".",
      "--pretty",
    ]);
    const output = JSON.parse(result.stdout) as {
      artifacts: Array<{
        content: { text: string };
        resolverId: string;
        sourceIdentity: { path: string };
      }>;
      diagnostics: unknown[];
    };

    expect(output.diagnostics).toEqual([]);
    expect(output.artifacts).toHaveLength(1);
    expect(output.artifacts[0]).toMatchObject({
      resolverId: "repo-path",
      sourceIdentity: {
        path: "fixtures/ms1/context-source.md",
      },
      content: {
        text: "# Source Fixture\n\nThis is bounded source data for the read-side MVP proof.\n",
      },
    });
  });
});

function registryWithResource(override: Partial<ReturnType<typeof validRegistryResource>>) {
  return {
    schemaVersion: "markdown-context.registry.v0",
    registryId: "fixtures/ms1",
    registryVersion: "0.1.0",
    resources: [{ ...validRegistryResource(), ...override }],
  };
}

function validRegistryResource() {
  return {
    scheme: "ctx",
    namespace: "repo",
    kind: "path",
    defaultLens: "excerpt",
    lenses: ["excerpt"],
    params: [],
  };
}

async function runCli(args: string[]): Promise<{ stdout: string }> {
  const result = await execFileAsync(process.execPath, args);

  return {
    stdout: result.stdout,
  };
}

async function runCliExpectingExitOne(args: string[]): Promise<{ stdout: string }> {
  try {
    await execFileAsync(process.execPath, args);
  } catch (error) {
    const result = error as { code?: unknown; stdout?: unknown };

    expect(result.code).toBe(1);
    return {
      stdout: typeof result.stdout === "string" ? result.stdout : "",
    };
  }

  throw new Error("Expected CLI command to exit with code 1.");
}
