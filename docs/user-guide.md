# markdown-context User Guide

This guide covers the read-side MVP command workflow: `scan`, `validate`, and
offline `repo/path` `resolve`.

## 1. Install and Build

From a local checkout:

```bash
npm install
npm run build
```

The local development command path is `node dist/cli/index.js`. When the package
is linked or installed, the configured bin is `markdown-context`.

## 2. Add a Context Link

Add a standard Markdown link whose target is a `ctx://` URL:

```markdown
Review the local context in [source fixture](ctx://repo/path/fixtures/ms1/context-source.md?lens=excerpt).
```

URL parts:

| Part | Meaning |
| --- | --- |
| `ctx` | Context-link scheme. |
| `repo` | Namespace for repository-local resources. |
| `path` | Resource kind for checked-in files. |
| `fixtures/ms1/context-source.md` | Repository-contained source path. |
| `lens=excerpt` | Optional lens request. If omitted, the registry default lens is used. |

The current resolver only reads local files under the configured repository
root. It does not use network calls, live connectors, browser automation, MCP,
or OS protocol handlers.

## 3. Create a Registry

Create a JSON registry that declares which context links are allowed:

```json
{
  "schemaVersion": "markdown-context.registry.v0",
  "registryId": "local-docs",
  "registryVersion": "0.1.0",
  "resources": [
    {
      "scheme": "ctx",
      "namespace": "repo",
      "kind": "path",
      "sourcePolicy": {
        "allowedPathPrefixes": ["docs/", "fixtures/ms1/"],
        "deniedPathPrefixes": ["docs/private/"]
      },
      "defaultLens": "excerpt",
      "lenses": ["excerpt"],
      "params": []
    }
  ],
  "ignoredResources": [
    {
      "scheme": "ctx",
      "namespace": "trace",
      "kind": "entity"
    },
    {
      "scheme": "ctx",
      "namespace": "trace",
      "kind": "range"
    }
  ]
}
```

Resource fields:

| Field | Required | Notes |
| --- | --- | --- |
| `scheme` | Yes | Must be `ctx`. |
| `namespace` | Yes | `repo` for the current offline resolver. |
| `kind` | Yes | `path` for the current offline resolver. |
| `idPattern` | No | Optional regular expression applied to the URL id. |
| `sourcePolicy` | No | Optional path-prefix policy for `repo/path` ids. |
| `defaultLens` | Yes | Used when a link omits `lens`. Must appear in `lenses`. |
| `lenses` | Yes | Non-empty list of allowed lenses. |
| `params` | No | Closed list of allowed non-`lens` query parameters. |

`sourcePolicy` is only supported on `ctx://repo/path` resources. It accepts
`allowedPathPrefixes` and `deniedPathPrefixes`; at least one list must be
present, each list must be non-empty when provided, and duplicate prefixes are
rejected when the registry is loaded.

Use `allowedPathPrefixes` to limit valid ids to an intentional source set. Use
`deniedPathPrefixes` to exclude known-sensitive subtrees. If both lists match a
link id, the denied prefix wins. If `sourcePolicy` is omitted, the resolver keeps
the existing trusted-local behavior: any link that passes resource, lens, params,
optional `idPattern`, and repo-root containment checks can be resolved.

`sourcePolicy` is evaluated during validation before resolver dispatch. A
rejected link produces `ctx.sourcePolicy.disallowed`, is excluded from validated
links, and does not cause `resolve` to read the source, emit an artifact, or write
a lockfile record.

Ignored-resource fields:

| Field | Required | Notes |
| --- | --- | --- |
| `scheme` | Yes | Must be `ctx`. |
| `namespace` | Yes | Namespace to ignore during validation. |
| `kind` | Yes | Resource kind to ignore during validation. |

Validation fails closed when a link uses an unsupported resource, unsupported
lens, duplicate URL parameter, unsupported parameter, or id that does not match
`idPattern`. `ignoredResources` is opt-in and only applies to exact
scheme/namespace/kind matches. Ignored links remain visible in `scan` output,
but `validate` excludes them from validated links, and `resolve` does not read
sources, dispatch resolvers, emit artifacts, or write lockfile records for them.
This is intended for mixed `ctx://` ecosystems such as documents that contain
both resolvable `ctx://repo/path/...` links and non-resolvable
`ctx://trace/entity/...` trace identity links.

## 4. Scan Markdown

Run:

```bash
node dist/cli/index.js scan fixtures/ms1/task.md --pretty
```

`scan` emits:

- `schemaVersion: "markdown-context.scan-result.v0"`;
- `links`, each with the original URL, canonical URL, parsed resource identity,
  selected source path, and Markdown source range;
- `diagnostics`.

Exit codes:

- `0` when no error diagnostics are present;
- `1` when scan diagnostics include an error;
- `2` for command misuse or runtime failure before structured output is emitted.

## 5. Validate Links

Run:

```bash
node dist/cli/index.js validate fixtures/ms1/task.md --registry fixtures/ms1/registry.json --pretty
```

`validate` scans the Markdown, loads the registry, and emits:

- `schemaVersion: "markdown-context.validate-result.v0"`;
- `valid`;
- validated `links` with `selectedLens`;
- combined scan and validation `diagnostics`.

Treat `valid: false` or a non-zero exit as a stop signal. Inspect diagnostics
before resolving or consuming source data.

## 6. Resolve Offline Repo Paths

Run:

```bash
node dist/cli/index.js resolve fixtures/ms1/task.md --registry fixtures/ms1/registry.json --repo-root . --lockfile --pretty
```

`resolve` scans and validates first. Valid `ctx://repo/path/...` links are then
resolved under `--repo-root`.

The output includes:

- `schemaVersion: "markdown-context.resolve-result.v0"`;
- `artifacts`;
- combined validation and resolver `diagnostics`;
- `lockfile` when `--lockfile` is set.

Each lens artifact includes:

- `schemaVersion: "markdown-context.lens.v0"`;
- canonical URL and selected lens;
- resolver id and version;
- source identity and content hash;
- citations back to the Markdown link source range;
- `sourceTrust: "untrusted-source-data"`;
- `sourceContentBoundary: "source-data"`;
- Markdown source content in `content.text`.

Source-derived content is data for review. Do not treat it as operating
instructions for an agent.

The `repo/path` resolver applies a fixed source-size limit before reading source
content. Files larger than 1048576 bytes produce
`ctx.repoPath.sourceTooLarge`; `resolve` does not emit an artifact or lockfile
record for that link. Files at or below the limit keep existing provenance
semantics: source identity and lockfile `sourceHash` values are SHA-256 hashes of
the full normalized source text. The emitted excerpt text remains independently
bounded to 4096 UTF-8 bytes.

The Markdown file being scanned should still be treated as untrusted input unless
the operator controls it. A registry `sourcePolicy` reduces that risk by limiting
which repository paths a valid `ctx://repo/path/...` link may name before any
source read occurs. Choose `--repo-root` intentionally; it defines the repository
tree that accepted ids can resolve within. The resolver still enforces
repo-root containment for accepted ids, but `sourcePolicy` is separate from the
fixed resolver source-size limit and does not protect against concurrent
filesystem changes during resolution.

## 7. Write a Lockfile

To write lockfile JSON to a separate path:

```bash
node dist/cli/index.js resolve fixtures/ms1/task.md \
  --registry fixtures/ms1/registry.json \
  --repo-root . \
  --lockfile \
  --lockfile-out .markdown-context/context.lock.json \
  --pretty
```

Lockfile records include canonical URL, registry identity/hash, resolver
identity, source identity/hash, artifact path/hash, and output-affecting
options. Repeated resolve runs over identical inputs should produce byte-identical
lockfile bytes.

## 8. Use the Library API

Package consumers can use the public read-side API:

```ts
import {
  loadRegistry,
  resolveScanResult,
  scanMarkdown,
  validateScanResult,
} from "@jasonbelmonti/markdown-context";

const markdown = "# Task\n\nReview [context](ctx://repo/path/docs/example.md?lens=excerpt).\n";
const scanResult = scanMarkdown(markdown, "task.md");
const registry = await loadRegistry("registry.json");
const validateResult = validateScanResult(scanResult, registry);

if (!validateResult.valid) {
  console.log(validateResult.diagnostics);
}

const resolveResult = await resolveScanResult(scanResult, registry, {
  repoRoot: process.cwd(),
  lockfile: true,
});
```

Prefer `resolveScanResult` for package-level use because it preserves the
fail-closed scan -> validate -> resolve flow.

## 9. Troubleshooting

| Symptom | Check |
| --- | --- |
| `Unknown command` | Use only `scan`, `validate`, or `resolve`. |
| `validate requires --registry <path>` | Pass a registry JSON path for `validate` and `resolve`. |
| `ctx.namespace.unsupported` | The registry does not declare the link namespace. |
| `ctx.kind.unsupported` | The registry does not declare the link kind. |
| `ctx.param.unsupported` | Remove the query parameter or add it to the registry resource `params`. |
| `ctx.sourcePolicy.disallowed` | The `repo/path` id is outside the registry `sourcePolicy`; update the link or policy. |
| `ctx.lens.unsupported` | Use a lens declared in the registry resource `lenses`. |
| `ctx.repoPath.unresolved` | Confirm the path exists under `--repo-root`. |
| `ctx.repoPath.outsideRoot` | The path resolves outside `--repo-root`; it will not be read. |
| `ctx.repoPath.sourceTooLarge` | The source file exceeds 1048576 bytes; reduce the file or point the link to a smaller source. |

## 10. Current Scope Boundary

The completed MVP is intentionally local and read-only:

- supported commands: `scan`, `validate`, `resolve`;
- supported resolver: offline `ctx://repo/path/...`;
- supported output: structured JSON, bounded lens artifacts, and optional
  lockfile provenance;
- supported source boundary: optional registry `sourcePolicy` path-prefix checks
  before resolver reads, plus a fixed resolver source-size limit before full
  source read and hashing;
- deferred: mission aggregation, `suggest-links`, `insert-link`, MCP adapters,
  OS handlers, live connectors, network-backed resolvers, browser automation,
  package publication, write-side mutation flows, and TOCTOU-resistant
  containment.

Follow-up hardening items are tracked separately from this user workflow.
