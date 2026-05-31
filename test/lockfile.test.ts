import { describe, expect, it } from "vitest";

import type { RepoPathLensArtifact } from "../src/core/types.js";
import { parseRegistry } from "../src/registry/registry.js";
import {
  cloneCanonicalJsonObject,
  createContextLockfile,
  createContextLockfileRecord,
  hashCanonicalJson,
  hashContextLockfile,
  hashRegistry,
  serializeCanonicalJson,
  serializeCanonicalRegistry,
  serializeContextLockfile,
} from "../src/index.js";

describe("lockfile contract", () => {
  it("serializes canonical JSON with sorted object keys and stable array order", () => {
    expect(
      serializeCanonicalJson({
        z: 3,
        a: [{ beta: true, alpha: false }],
        A: 2,
        nested: { z: "last", a: "first" },
      }),
    ).toBe('{"A":2,"a":[{"alpha":false,"beta":true}],"nested":{"a":"first","z":"last"},"z":3}\n');
  });

  it("rejects unsupported values before hashing canonical JSON", () => {
    expect(() => serializeCanonicalJson({ ok: true, missing: undefined })).toThrow(
      "must not contain undefined field missing",
    );
    expect(() => serializeCanonicalJson(Number.NaN)).toThrow("must be finite");
    expect(() => serializeCanonicalJson(new Date("2026-05-18T00:00:00Z"))).toThrow(
      "Unsupported canonical JSON value",
    );
    expect(() => serializeCanonicalJson(new Array(1))).toThrow(
      "must not contain empty slots",
    );
  });

  it("clones canonical JSON objects so caller mutation cannot change records", () => {
    const sourceIdentity = { kind: "repo/path", path: "a.md" };
    const outputOptions = { excerptMaxBytes: 4096 };
    const record = createContextLockfileRecord({
      canonicalUrl: "ctx://repo/path/a.md?lens=excerpt",
      selectedLens: "excerpt",
      artifactPath: ".markdown-context/lenses/a.json",
      artifactHash: hashCanonicalJson({ artifact: "a" }),
      registry: fixtureRegistry(),
      resolverId: "repo-path",
      resolverVersion: "0.1.0",
      sourceIdentity,
      sourceHash: hashCanonicalJson({ source: "a" }),
      outputOptions,
    });

    sourceIdentity.path = "changed.md";
    outputOptions.excerptMaxBytes = 1;

    expect(record.sourceIdentity.path).toBe("a.md");
    expect(record.outputOptions.excerptMaxBytes).toBe(4096);
  });

  it("preserves __proto__ as canonical JSON data when cloning records", () => {
    const sourceIdentity = JSON.parse(
      '{"kind":"repo/path","__proto__":"source-prototype-data"}',
    ) as { kind: "repo/path"; __proto__: string };
    const outputOptions = JSON.parse(
      '{"artifactFormat":"json","__proto__":"option-prototype-data"}',
    ) as { artifactFormat: "json"; __proto__: string };
    const record = createContextLockfileRecord({
      canonicalUrl: "ctx://repo/path/a.md?lens=excerpt",
      selectedLens: "excerpt",
      artifactPath: ".markdown-context/lenses/a.json",
      artifactHash: hashCanonicalJson({ artifact: "a" }),
      registry: fixtureRegistry(),
      resolverId: "repo-path",
      resolverVersion: "0.1.0",
      sourceIdentity,
      sourceHash: hashCanonicalJson({ source: "a" }),
      outputOptions,
    });

    expect(Object.keys(record.sourceIdentity)).toEqual(["__proto__", "kind"]);
    expect(Object.keys(record.outputOptions)).toEqual(["__proto__", "artifactFormat"]);
    expect(record.sourceIdentity.__proto__).toBe("source-prototype-data");
    expect(record.outputOptions.__proto__).toBe("option-prototype-data");
    expect(serializeCanonicalJson(record.sourceIdentity)).toBe(
      '{"__proto__":"source-prototype-data","kind":"repo/path"}\n',
    );
  });

  it("requires source identity to remain a canonical JSON object with a kind", () => {
    expect(() => cloneCanonicalJsonObject(["not", "an", "object"])).toThrow(
      "must be an object",
    );
    expect(() =>
      createContextLockfileRecord({
        canonicalUrl: "ctx://repo/path/a.md?lens=excerpt",
        selectedLens: "excerpt",
        artifactPath: ".markdown-context/lenses/a.json",
        artifactHash: hashCanonicalJson({ artifact: "a" }),
        registry: fixtureRegistry(),
        resolverId: "repo-path",
        resolverVersion: "0.1.0",
        sourceIdentity: { kind: "" },
        sourceHash: hashCanonicalJson({ source: "a" }),
      }),
    ).toThrow("sourceIdentity.kind must be a non-empty string");
  });

  it("hashes registries from their normalized contract instead of file formatting", () => {
    const first = parseRegistry({
      schemaVersion: "markdown-context.registry.v0",
      registryId: "local",
      registryVersion: "0.1.0",
      resources: [
        {
          scheme: "ctx",
          namespace: "repo",
          kind: "path",
          defaultLens: "excerpt",
          lenses: ["excerpt"],
          params: ["depth", "format"],
        },
        {
          scheme: "ctx",
          namespace: "doc",
          kind: "section",
          defaultLens: "summary",
          lenses: ["summary", "excerpt"],
          params: ["anchor"],
        },
      ],
    });
    const second = parseRegistry({
      resources: [
        {
          params: ["anchor"],
          lenses: ["excerpt", "summary"],
          defaultLens: "summary",
          kind: "section",
          namespace: "doc",
          scheme: "CTX",
        },
        {
          params: ["format", "depth"],
          lenses: ["excerpt"],
          defaultLens: "excerpt",
          kind: "path",
          namespace: "repo",
          scheme: "ctx",
        },
      ],
      registryVersion: "0.1.0",
      registryId: "local",
      schemaVersion: "markdown-context.registry.v0",
    });

    expect(serializeCanonicalRegistry(first)).toBe(serializeCanonicalRegistry(second));
    expect(hashRegistry(first)).toBe(hashRegistry(second));
    expect(hashRegistry(first)).toMatch(/^sha256:[a-f0-9]{64}$/);
  });

  it("treats omitted registry params and empty registry params as the same contract", () => {
    const omittedParams = parseRegistry({
      schemaVersion: "markdown-context.registry.v0",
      registryId: "local",
      registryVersion: "0.1.0",
      resources: [
        {
          scheme: "ctx",
          namespace: "repo",
          kind: "path",
          defaultLens: "excerpt",
          lenses: ["excerpt"],
        },
      ],
    });
    const emptyParams = parseRegistry({
      schemaVersion: "markdown-context.registry.v0",
      registryId: "local",
      registryVersion: "0.1.0",
      resources: [
        {
          scheme: "ctx",
          namespace: "repo",
          kind: "path",
          defaultLens: "excerpt",
          lenses: ["excerpt"],
          params: [],
        },
      ],
    });

    expect(serializeCanonicalRegistry(omittedParams)).toBe(serializeCanonicalRegistry(emptyParams));
    expect(hashRegistry(omittedParams)).toBe(hashRegistry(emptyParams));
  });

  it("includes ignored resources in the canonical registry contract", () => {
    const withoutIgnored = fixtureRegistry();
    const withIgnored = parseRegistry({
      schemaVersion: "markdown-context.registry.v0",
      registryId: "ms1-local",
      registryVersion: "0.1.0",
      resources: [
        {
          scheme: "ctx",
          namespace: "repo",
          kind: "path",
          defaultLens: "excerpt",
          lenses: ["excerpt"],
          params: [],
        },
      ],
      ignoredResources: [
        { scheme: "ctx", namespace: "trace", kind: "range" },
        { scheme: "CTX", namespace: "TRACE", kind: "entity" },
      ],
    });

    expect(serializeCanonicalRegistry(withIgnored)).toContain(
      '"ignoredResources":[{"kind":"entity","namespace":"trace","scheme":"ctx"},{"kind":"range","namespace":"trace","scheme":"ctx"}]',
    );
    expect(hashRegistry(withIgnored)).not.toBe(hashRegistry(withoutIgnored));
  });

  it("includes source policy in the canonical registry contract", () => {
    const withoutPolicy = fixtureRegistry();
    const withPolicy = parseRegistry({
      schemaVersion: "markdown-context.registry.v0",
      registryId: "ms1-local",
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
            allowedPathPrefixes: ["fixtures/ms1/public/", "fixtures/ms1/"],
            deniedPathPrefixes: ["fixtures/ms1/private/", "fixtures/ms1/generated/"],
          },
        },
      ],
    });

    expect(serializeCanonicalRegistry(withPolicy)).toContain(
      '"sourcePolicy":{"allowedPathPrefixes":["fixtures/ms1/","fixtures/ms1/public/"],"deniedPathPrefixes":["fixtures/ms1/generated/","fixtures/ms1/private/"]}',
    );
    expect(hashRegistry(withPolicy)).not.toBe(hashRegistry(withoutPolicy));
  });

  it("builds lockfile records with explicit registry, source, artifact, and option provenance", () => {
    const registry = fixtureRegistry();
    const artifact = fixtureArtifact();
    const artifactHash = hashCanonicalJson(artifact);
    const sourceHash = artifact.sourceIdentity.contentHash;
    const record = createContextLockfileRecord({
      canonicalUrl: artifact.canonicalUrl,
      selectedLens: artifact.selectedLens,
      artifactPath: ".markdown-context/lenses/source.json",
      artifactHash,
      registry,
      resolverId: artifact.resolverId,
      resolverVersion: artifact.resolverVersion,
      sourceIdentity: {
        kind: artifact.sourceIdentity.kind,
        path: artifact.sourceIdentity.path,
      },
      sourceHash,
      outputOptions: {
        artifactFormat: "json",
        excerptMaxBytes: 4096,
      },
    });

    expect(record).toEqual({
      schemaVersion: "markdown-context.lockfile-record.v0",
      canonicalUrl: "ctx://repo/path/fixtures/ms1/context-source.md?lens=excerpt",
      selectedLens: "excerpt",
      artifactPath: ".markdown-context/lenses/source.json",
      artifactHash,
      registryId: "ms1-local",
      registryVersion: "0.1.0",
      registryHash: hashRegistry(registry),
      resolverId: "repo-path",
      resolverVersion: "0.1.0",
      sourceIdentity: {
        kind: "repo/path",
        path: "fixtures/ms1/context-source.md",
      },
      sourceHash,
      outputOptions: {
        artifactFormat: "json",
        excerptMaxBytes: 4096,
      },
    });
  });

  it("serializes and hashes lockfiles deterministically regardless of record input order", () => {
    const registry = fixtureRegistry();
    const first = createContextLockfileRecord({
      canonicalUrl: "ctx://repo/path/b.md?lens=excerpt",
      selectedLens: "excerpt",
      artifactPath: ".markdown-context/lenses/b.json",
      artifactHash: hashCanonicalJson({ artifact: "b" }),
      registry,
      resolverId: "repo-path",
      resolverVersion: "0.1.0",
      sourceIdentity: { kind: "repo/path", path: "b.md" },
      sourceHash: hashCanonicalJson({ source: "b" }),
      outputOptions: { excerptMaxBytes: 4096 },
    });
    const second = createContextLockfileRecord({
      canonicalUrl: "ctx://repo/path/a.md?lens=excerpt",
      selectedLens: "excerpt",
      artifactPath: ".markdown-context/lenses/a.json",
      artifactHash: hashCanonicalJson({ artifact: "a" }),
      registry,
      resolverId: "repo-path",
      resolverVersion: "0.1.0",
      sourceIdentity: { kind: "repo/path", path: "a.md" },
      sourceHash: hashCanonicalJson({ source: "a" }),
      outputOptions: { excerptMaxBytes: 4096 },
    });
    const ordered = createContextLockfile([second, first]);
    const reversed = createContextLockfile([first, second]);

    expect(ordered.records.map((record) => record.canonicalUrl)).toEqual([
      "ctx://repo/path/a.md?lens=excerpt",
      "ctx://repo/path/b.md?lens=excerpt",
    ]);
    expect(serializeContextLockfile(ordered)).toBe(serializeContextLockfile(reversed));
    expect(hashContextLockfile(ordered)).toBe(hashContextLockfile(reversed));
  });

  it("uses the full canonical record as a deterministic tie-breaker", () => {
    const registry = fixtureRegistry();
    const first = createContextLockfileRecord({
      canonicalUrl: "ctx://repo/path/a.md?lens=excerpt",
      selectedLens: "excerpt",
      artifactPath: ".markdown-context/lenses/a.json",
      artifactHash: hashCanonicalJson({ artifact: "b" }),
      registry,
      resolverId: "repo-path",
      resolverVersion: "0.1.0",
      sourceIdentity: { kind: "repo/path", path: "a.md" },
      sourceHash: hashCanonicalJson({ source: "a" }),
      outputOptions: { excerptMaxBytes: 4096 },
    });
    const second = createContextLockfileRecord({
      canonicalUrl: "ctx://repo/path/a.md?lens=excerpt",
      selectedLens: "excerpt",
      artifactPath: ".markdown-context/lenses/a.json",
      artifactHash: hashCanonicalJson({ artifact: "a" }),
      registry,
      resolverId: "repo-path",
      resolverVersion: "0.1.0",
      sourceIdentity: { kind: "repo/path", path: "a.md" },
      sourceHash: hashCanonicalJson({ source: "a" }),
      outputOptions: { excerptMaxBytes: 4096 },
    });
    const ordered = createContextLockfile([first, second]);
    const reversed = createContextLockfile([second, first]);

    expect(ordered.records.map((record) => record.artifactHash)).toEqual(
      reversed.records.map((record) => record.artifactHash),
    );
    expect(serializeContextLockfile(ordered)).toBe(serializeContextLockfile(reversed));
    expect(hashContextLockfile(ordered)).toBe(hashContextLockfile(reversed));
  });
});

function fixtureRegistry() {
  return parseRegistry({
    schemaVersion: "markdown-context.registry.v0",
    registryId: "ms1-local",
    registryVersion: "0.1.0",
    resources: [
      {
        scheme: "ctx",
        namespace: "repo",
        kind: "path",
        defaultLens: "excerpt",
        lenses: ["excerpt"],
        params: [],
      },
    ],
  });
}

function fixtureArtifact(): RepoPathLensArtifact {
  return {
    schemaVersion: "markdown-context.lens.v0",
    canonicalUrl: "ctx://repo/path/fixtures/ms1/context-source.md?lens=excerpt",
    selectedLens: "excerpt",
    resolverId: "repo-path",
    resolverVersion: "0.1.0",
    sourceIdentity: {
      kind: "repo/path",
      path: "fixtures/ms1/context-source.md",
      contentHash: "sha256:1111111111111111111111111111111111111111111111111111111111111111",
    },
    contentHash: "sha256:2222222222222222222222222222222222222222222222222222222222222222",
    citations: [
      {
        sourcePath: "fixtures/ms1/task.md",
        sourceRange: {
          start: { line: 3, column: 1 },
          end: { line: 3, column: 73 },
        },
      },
    ],
    sourceTrust: "untrusted-source-data",
    sourceContentBoundary: "source-data",
    content: {
      format: "markdown",
      text: "# Source Fixture\n\nThis is bounded source data.\n",
    },
  };
}
