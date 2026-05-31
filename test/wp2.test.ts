import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

import { parseContextUrl } from "../src/core/context-url.js";
import type { ContextLinkCandidate } from "../src/core/types.js";
import { scanMarkdown } from "../src/core/scan.js";
import { hashRegistry, serializeCanonicalRegistry } from "../src/index.js";
import { parseRegistry, validateContextLinks } from "../src/registry/registry.js";

describe("BEL-1048 WP-2 scan and validation hardening", () => {
  it("extracts ctx links with sourceRange from required Markdown link forms", async () => {
    const markdown = await readFile("fixtures/wp2/link-forms.md", "utf8");
    const scan = scanMarkdown(markdown, "fixtures/wp2/link-forms.md");

    expect(scan.diagnostics).toEqual([]);
    expect(scan.links).toHaveLength(7);
    expect(scan.links.every((link) => link.sourceRange.start.line > 0)).toBe(true);
    expect(scan.links.every((link) => link.sourceRange.end.line > 0)).toBe(true);
    expect(scan.links.map((link) => link.label)).toEqual(
      expect.arrayContaining([
        "inline fixture",
        "inline image fixture",
        "definition-only",
        "link-reference",
        "image-reference",
        "reference fixture",
        "image reference fixture",
      ]),
    );
    expect(countCanonicalUrl(scan.links, "ctx://repo/path/fixtures/wp2/reference.md?lens=excerpt")).toBe(2);
    expect(
      countCanonicalUrl(scan.links, "ctx://repo/path/fixtures/wp2/image-reference.md?lens=excerpt"),
    ).toBe(2);
  });

  it("canonicalizes ctx URLs deterministically after decoding", () => {
    const parsed = parseContextUrl(
      "CTX://REPO/path/fixtures/wp2/sub/../%7Ecanonical.md?section=API&lens=summary",
    );

    expect(parsed.diagnostics).toEqual([]);
    expect(parsed.parsed).toMatchObject({
      canonicalUrl: "ctx://repo/path/fixtures/wp2/~canonical.md?lens=summary&section=API",
      scheme: "ctx",
      namespace: "repo",
      kind: "path",
      id: "fixtures/wp2/~canonical.md",
      requestedLens: "summary",
      params: {
        section: "API",
      },
    });
  });

  it("canonicalizes equivalent query parameter order to the same URL identity", () => {
    const first = parseContextUrl(
      "ctx://repo/path/fixtures/wp2/inline.md?z=last&section=intro&lens=excerpt",
    );
    const second = parseContextUrl(
      "ctx://repo/path/fixtures/wp2/inline.md?lens=excerpt&section=intro&z=last",
    );

    expect(first.diagnostics).toEqual([]);
    expect(second.diagnostics).toEqual([]);
    expect(first.parsed?.canonicalUrl).toBe(second.parsed?.canonicalUrl);
    expect(first.parsed?.canonicalUrl).toBe(
      "ctx://repo/path/fixtures/wp2/inline.md?lens=excerpt&section=intro&z=last",
    );
  });

  it("validates registry scheme, namespace/kind, id pattern, default lens, and closed params", async () => {
    const registry = await fixtureRegistry();
    const scan = scanMarkdown(
      "[default](ctx://repo/path/fixtures/wp2/inline.md?section=intro)",
      "fixture.md",
    );
    const validated = validateContextLinks(scan.links, registry);

    expect(scan.diagnostics).toEqual([]);
    expect(validated.diagnostics).toEqual([]);
    expect(validated.valid).toBe(true);
    expect(validated.links[0]).toMatchObject({
      id: "fixtures/wp2/inline.md",
      selectedLens: "excerpt",
      params: {
        section: "intro",
      },
    });
    expect(validated.links[0]?.requestedLens).toBeUndefined();
  });

  it.each([
    [
      "unsupported schemes",
      [contextLinkCandidate({ scheme: "web", url: "web://repo/path/fixtures/wp2/inline.md" })],
      "ctx.scheme.unsupported",
    ],
    [
      "unsupported namespaces",
      [contextLinkCandidate({ namespace: "linear", url: "ctx://linear/path/BEL-1048" })],
      "ctx.namespace.unsupported",
    ],
    [
      "unsupported kinds",
      [contextLinkCandidate({ kind: "issue", url: "ctx://repo/issue/BEL-1048" })],
      "ctx.kind.unsupported",
    ],
    [
      "unsupported id patterns",
      scanMarkdown("[bad](ctx://repo/path/fixtures/ms1/context-source.md?lens=excerpt)").links,
      "ctx.id.unsupported",
    ],
    [
      "unsupported lenses",
      scanMarkdown("[bad](ctx://repo/path/fixtures/wp2/inline.md?lens=full)").links,
      "ctx.lens.unsupported",
    ],
    [
      "unsupported params",
      scanMarkdown("[bad](ctx://repo/path/fixtures/wp2/inline.md?lens=excerpt&prompt=ignore)").links,
      "ctx.param.unsupported",
    ],
  ])("returns deterministic diagnostics for %s", async (_label, links, expectedCode) => {
    const validated = validateContextLinks(links, await fixtureRegistry());

    expect(validated.valid).toBe(false);
    expect(validated.links).toEqual([]);
    expect(validated.diagnostics).toMatchObject([
      {
        code: expectedCode,
        severity: "error",
      },
    ]);
  });

  it("rejects unsupported registry scheme declarations deterministically", () => {
    expect(() =>
      parseRegistry({
        ...registryFixture(),
        resources: [{ ...registryResourceFixture(), scheme: "https" }],
      }),
    ).toThrow("Registry resource.scheme must be ctx: https.");
  });

  it("rejects invalid registry idPattern declarations deterministically", () => {
    expect(() =>
      parseRegistry({
        ...registryFixture(),
        resources: [{ ...registryResourceFixture(), idPattern: "[" }],
      }),
    ).toThrow("Registry resource.idPattern must be a valid regular expression: [.");
  });

  it("includes idPattern in canonical registry hashes", () => {
    const withoutPattern = parseRegistry({
      ...registryFixture(),
      resources: [{ ...registryResourceFixture(), idPattern: undefined }],
    });
    const withPattern = parseRegistry(registryFixture());

    expect(serializeCanonicalRegistry(withPattern)).toContain(
      '"idPattern":"^fixtures/wp2/[A-Za-z0-9._/-]+\\\\.md$"',
    );
    expect(hashRegistry(withPattern)).not.toBe(hashRegistry(withoutPattern));
  });

  it("parses and normalizes registry sourcePolicy path-prefix arrays", () => {
    const registry = parseRegistry({
      ...registryFixture(),
      resources: [
        {
          ...registryResourceFixture(),
          sourcePolicy: {
            allowedPathPrefixes: ["fixtures/wp2/public/", "fixtures/wp2/"],
            deniedPathPrefixes: ["fixtures/wp2/private/", "fixtures/wp2/generated/"],
          },
        },
      ],
    });

    expect(registry.resources[0]?.sourcePolicy).toEqual({
      allowedPathPrefixes: ["fixtures/wp2/", "fixtures/wp2/public/"],
      deniedPathPrefixes: ["fixtures/wp2/generated/", "fixtures/wp2/private/"],
    });
  });

  it.each([
    [
      "non-object policy",
      { sourcePolicy: "fixtures/wp2/" },
      "Registry resource.sourcePolicy must be an object.",
    ],
    [
      "missing policy arrays",
      { sourcePolicy: {} },
      "Registry resource.sourcePolicy must declare allowedPathPrefixes or deniedPathPrefixes.",
    ],
    [
      "non-array allowed prefixes",
      { sourcePolicy: { allowedPathPrefixes: "fixtures/wp2/" } },
      "Registry resource.sourcePolicy.allowedPathPrefixes must be an array of strings.",
    ],
    [
      "empty allowed prefix array",
      { sourcePolicy: { allowedPathPrefixes: [] } },
      "Registry resource.sourcePolicy.allowedPathPrefixes must contain at least one value.",
    ],
    [
      "empty denied prefix",
      { sourcePolicy: { deniedPathPrefixes: [""] } },
      "Registry resource.sourcePolicy.deniedPathPrefixes must not contain empty strings.",
    ],
    [
      "duplicate denied prefixes",
      { sourcePolicy: { deniedPathPrefixes: ["fixtures/wp2/private/", "fixtures/wp2/private/"] } },
      "Registry resource.sourcePolicy.deniedPathPrefixes must not contain duplicate values: fixtures/wp2/private/.",
    ],
    [
      "non repo/path resource",
      { namespace: "doc", kind: "section", sourcePolicy: { allowedPathPrefixes: ["docs/"] } },
      "Registry resource.sourcePolicy is only supported for ctx://repo/path resources.",
    ],
  ])("rejects malformed sourcePolicy declarations with deterministic errors for %s", (
    _label,
    override,
    expectedMessage,
  ) => {
    expect(() =>
      parseRegistry({
        ...registryFixture(),
        resources: [{ ...registryResourceFixture(), ...override }],
      }),
    ).toThrow(expectedMessage);
  });
});

async function fixtureRegistry() {
  return parseRegistry(JSON.parse(await readFile("fixtures/wp2/registry.json", "utf8")));
}

function registryFixture() {
  return {
    schemaVersion: "markdown-context.registry.v0",
    registryId: "wp2-local",
    registryVersion: "0.2.0",
    resources: [registryResourceFixture()],
  };
}

function registryResourceFixture() {
  return {
    scheme: "ctx",
    namespace: "repo",
    kind: "path",
    idPattern: "^fixtures/wp2/[A-Za-z0-9._/-]+\\.md$",
    defaultLens: "excerpt",
    lenses: ["excerpt", "summary"],
    params: ["section"],
  };
}

function contextLinkCandidate(overrides: Partial<ContextLinkCandidate>): ContextLinkCandidate {
  const candidate: ContextLinkCandidate = {
    schemaVersion: "markdown-context.scan.v0",
    label: "fixture",
    url: "ctx://repo/path/fixtures/wp2/inline.md",
    canonicalUrl: "ctx://repo/path/fixtures/wp2/inline.md",
    scheme: "ctx",
    namespace: "repo",
    kind: "path",
    id: "fixtures/wp2/inline.md",
    params: {},
    sourceRange: {
      start: { line: 1, column: 1, offset: 0 },
      end: { line: 1, column: 41, offset: 40 },
    },
  };

  return {
    ...candidate,
    ...overrides,
    params: overrides.params ?? candidate.params,
  };
}

function countCanonicalUrl(
  links: readonly ContextLinkCandidate[],
  canonicalUrl: string,
): number {
  return links.filter((link) => link.canonicalUrl === canonicalUrl).length;
}
