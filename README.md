# @jasonbelmonti/markdown-context

CLI-first context link scanner, validator, and resolver for Markdown.

`markdown-context` consumes `@jasonbelmonti/markdown-engine` public APIs and
turns inert Markdown `ctx://` links into typed, validated, bounded context
artifacts. The current read-side MVP supports:

- `scan`: extract `ctx://` link candidates from Markdown link-like references.
- `validate`: validate extracted links against a versioned registry.
- `resolve`: resolve validated `ctx://repo/path/...` links to bounded excerpt
  artifacts.

Out of scope for the current MVP: mission aggregation, write-side link
insertion, MCP adapters, OS protocol handlers, live network connectors, and
package publication.

## Repository Operations

This repository is intended to be operated from a real Git checkout containing
`package.json`, `src/`, `test/`, `fixtures/`, and `docs/`.

If a local workspace directory contains only `docs/` and `.worktrees/`, that
directory is a worktree container, not the package root. Use one of its Git
worktrees for package commands.

See [Repository Layout](docs/operations/repository-layout.md) for the current
local layout, worktree commands, and guardrails.

## Commands

```sh
npm run build
npm test
npm run typecheck
```

After building, run the CLI locally:

```sh
node dist/cli/index.js scan fixtures/ms1/task.md --pretty
node dist/cli/index.js validate fixtures/ms1/task.md --registry fixtures/ms1/registry.json --pretty
node dist/cli/index.js resolve fixtures/ms1/task.md --registry fixtures/ms1/registry.json --repo-root . --pretty
```

## Current Contract

- Package version: `0.1.0`
- Registry schema: `markdown-context.registry.v0`
- Scan result schema: `markdown-context.scan-result.v0`
- Validation result schema: `markdown-context.validate-result.v0`
- Lens artifact schema: `markdown-context.lens.v0`
- Resolver supported in the read-side MVP: `ctx://repo/path/<path>?lens=excerpt`
