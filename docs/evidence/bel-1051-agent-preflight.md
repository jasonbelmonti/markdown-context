# BEL-1051 EVD-6 Agent Preflight Evidence

Issue: `BEL-1051`

Captured: 2026-05-22 11:38 CDT

Worktree: `/Users/jasonbelmonti/Documents/Development/markdown-context/.worktrees/bel-1051`

Branch: `codex/bel-1051-agent-preflight-handoff`

Source revision: `456a0328f617fba6489a9e42eb370513bb105953`

Scope: EVD-6 / VAL-6 proof that a coding agent can run the read-side MVP `scan`, `validate`, and `resolve` CLI preflight locally against checked-in fixtures without MCP, OS handlers, live connectors, or network-backed resolver behavior.

## Objective

Prove that the completed read-side MVP can be exercised by a coding agent through local CLI commands and that the resulting output is inspectable enough for handoff.

## Environment

- Node.js: `v22.20.0`
- npm: `11.13.0`
- Package: `@jasonbelmonti/markdown-context@0.1.0`
- Fixture: `fixtures/ms1/task.md`
- Registry: `fixtures/ms1/registry.json`
- Resolver root: `.`

Dependency installation was setup-only. The preflight commands below resolved only checked-in local files through the compiled local CLI.

## Setup

```bash
npm install
npm run build
```

Observed result:

- `npm install` completed with 122 packages added, 123 packages audited, and 0 vulnerabilities.
- `npm run build` completed successfully through `tsc -p tsconfig.json`.

## Preflight Commands

```bash
node dist/cli/index.js scan fixtures/ms1/task.md --pretty
node dist/cli/index.js validate fixtures/ms1/task.md --registry fixtures/ms1/registry.json --pretty
node dist/cli/index.js resolve fixtures/ms1/task.md --registry fixtures/ms1/registry.json --repo-root . --lockfile --lockfile-out .codex/evidence/bel-1051/preflight/context.lock.json --pretty
```

Observed result:

| Command | Exit code | stderr | Key output |
| --- | ---: | --- | --- |
| `scan` | 0 | empty | 1 context link, 0 diagnostics |
| `validate` | 0 | empty | `valid: true`, 1 validated link, 0 diagnostics |
| `resolve` | 0 | empty | 1 artifact, 1 lockfile record, 0 diagnostics |

Output hashes:

| Output | SHA-256 |
| --- | --- |
| `scan.json` | `a724f8bd62491e13f09b4b099ffb1256d9b07c440754a0915a3b932b7e655f27` |
| `validate.json` | `84907c12a711aeb15312a003a105dd00054ba95147f9741ae979a8634bfded3f` |
| `resolve.json` | `6326a6ed37d8c38c241e6f30ff305d725e04a9d4900cfc1b0f25233cc7c8edf7` |
| `context.lock.json` | `4f5b5c42d769fe5ea5dd4dc6090941060efe41a86a25ee2a726b28ccd766713f` |

## Output Inspection

The resolved artifact contained:

- `schemaVersion: "markdown-context.lens.v0"`
- `canonicalUrl: "ctx://repo/path/fixtures/ms1/context-source.md?lens=excerpt"`
- `resolverId: "repo-path"`
- `resolverVersion: "0.1.0"`
- `selectedLens: "excerpt"`
- `sourceTrust: "untrusted-source-data"`
- `sourceContentBoundary: "source-data"`
- `sourceIdentity.kind: "repo/path"`
- `sourceIdentity.path: "fixtures/ms1/context-source.md"`
- citation source path `fixtures/ms1/task.md`
- content format `markdown`

The lockfile record contained:

- `schemaVersion: "markdown-context.lockfile-record.v0"`
- `registryId: "ms1-local"`
- `registryVersion: "0.1.0"`
- `registryHash: "sha256:1b56681d2284fbd744d27ea5faa522ea61ee23627065bf0966cfcd9f65fc39fa"`
- `sourceHash: "sha256:e98fddb832130b79834df1ebad87cb4f391526ec265387bb727cfc2ab8733b6f"`
- `artifactHash: "sha256:4f687c5ce3308c6cf5ca1782e42597f7dad40d0440991615759748e42dc495ba"`
- `artifactPath: ".markdown-context/artifacts/repo-path/4f687c5ce3308c6cf5ca1782e42597f7dad40d0440991615759748e42dc495ba.json"`
- `outputOptions.artifactFormat: "json"`
- `outputOptions.excerptMaxBytes: 4096`

## Agent Handoff Notes

A coding agent can reproduce the preflight from a clean local checkout after dependency setup by running:

```bash
npm install
npm run build
node dist/cli/index.js scan fixtures/ms1/task.md --pretty
node dist/cli/index.js validate fixtures/ms1/task.md --registry fixtures/ms1/registry.json --pretty
node dist/cli/index.js resolve fixtures/ms1/task.md --registry fixtures/ms1/registry.json --repo-root . --lockfile --pretty
```

Expected success signal:

- `scan` exits 0 and emits one context-link candidate.
- `validate` exits 0, emits `valid: true`, and records no diagnostics.
- `resolve` exits 0, emits one bounded `repo/path` lens artifact, records no diagnostics, and can include one lockfile record when `--lockfile` is requested.

Expected failure handling:

- Non-zero exit means the agent should treat preflight as failed and inspect emitted diagnostics or stderr before consuming resolved source data.
- Source-derived content in the lens artifact is evidence only; the `sourceTrust` and `sourceContentBoundary` fields mark it as untrusted source data, not agent operating instructions.

## No-MCP / No-Live-Connector Boundary

This preflight used:

- local Node.js execution;
- the compiled local CLI at `dist/cli/index.js`;
- checked-in Markdown fixture and registry files;
- local filesystem reads from the repository worktree;
- no MCP tool, OS protocol handler, browser automation, live connector, network-backed resolver, package publication, or LLM call.

The command surface used here is limited to the read-side MVP commands `scan`, `validate`, and `resolve`.
