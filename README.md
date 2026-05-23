# markdown-context

`markdown-context` is a CLI-first scanner, validator, and offline resolver for
`ctx://` context links in Markdown.

Project site: https://jasonbelmonti.github.io/markdown-context/

The current MVP is read-side only. It lets a coding agent or human run local
commands to:

- scan Markdown for `ctx://` links through `markdown-engine` link references;
- validate links against a versioned local registry;
- resolve supported `ctx://repo/path/...` links into bounded source-data
  artifacts;
- emit deterministic lockfile provenance for review.

It does not implement mission aggregation, write-side commands, MCP transport,
OS protocol handlers, browser automation, live connectors, network-backed
resolvers, or package publication.

## Requirements

- Node.js `^20.19.0 || >=22.12.0`
- npm

## Quick Start

From a local checkout:

```bash
npm install
npm run build

node dist/cli/index.js scan fixtures/ms1/task.md --pretty
node dist/cli/index.js validate fixtures/ms1/task.md --registry fixtures/ms1/registry.json --pretty
node dist/cli/index.js resolve fixtures/ms1/task.md --registry fixtures/ms1/registry.json --repo-root . --lockfile --pretty
```

Expected success signal:

- `scan` exits `0`, emits one context-link candidate, and reports no diagnostics.
- `validate` exits `0`, emits `valid: true`, and reports no diagnostics.
- `resolve` exits `0`, emits one bounded `repo/path` lens artifact, and can emit
  one lockfile record when `--lockfile` is set.

If this package is installed as a package or linked locally, the configured bin
exposes the same command surface as `markdown-context`:

```bash
markdown-context scan <markdown-file> [--pretty]
markdown-context validate <markdown-file> --registry <registry.json> [--pretty]
markdown-context resolve <markdown-file> --registry <registry.json> [--repo-root <path>] [--lockfile] [--lockfile-out <path>] [--pretty]
```

## Context Link Shape

The implemented MVP supports links shaped like:

```markdown
[source fixture](ctx://repo/path/fixtures/ms1/context-source.md?lens=excerpt)
```

The URL structure is:

```text
ctx://<namespace>/<kind>/<id>?lens=<lens>
```

For the current resolver, the supported namespace and kind are `repo/path`.
The `id` is a repository-contained path. `lens` is optional when the registry
declares a `defaultLens`.

## Registry Shape

Validation is controlled by a local JSON registry:

```json
{
  "schemaVersion": "markdown-context.registry.v0",
  "registryId": "ms1-local",
  "registryVersion": "0.1.0",
  "resources": [
    {
      "scheme": "ctx",
      "namespace": "repo",
      "kind": "path",
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

The registry is fail-closed: unsupported schemes, namespaces, kinds, lenses,
params, and optional `idPattern` mismatches produce diagnostics.

`ignoredResources` is optional and non-resolving. It lets one document contain
links from another `ctx://` ecosystem, such as `ctx://trace/entity/...`, without
blocking supported `ctx://repo/path/...` resolution. Ignored links are still
reported by `scan`, but validation excludes them from resolved links and they do
not create artifacts, source reads, lockfile records, or resolver diagnostics.

## Library API

The root package exports the read-side pipeline primitives:

```ts
import {
  loadRegistry,
  resolveScanResult,
  scanMarkdown,
  validateScanResult,
} from "@jasonbelmonti/markdown-context";
```

Use `scanMarkdown` and `validateScanResult` before resolving. `resolveScanResult`
keeps the safe scan -> validate -> resolve flow together for package consumers.

## Documentation

- [Project site](https://jasonbelmonti.github.io/markdown-context/)
- [User guide](docs/user-guide.md)
- [Operational design spec](docs/design/markdown-context-operational-design-spec.md)
- [Read-side MVP execution spec](docs/execution/markdown-context-read-side-mvp-execution-spec.md)
- [Final MVP scope-control evidence](docs/evidence/bel-1063-mvp-scope-control.md)

## Validation

```bash
npm test
```

The test script builds the package and runs Vitest.
