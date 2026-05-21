# BEL-1050 / BEL-1082 Lockfile Determinism Evidence

Issue: `BEL-1082`

Captured: 2026-05-21 13:40 CDT

Scope: EVD-5 proof for WP-3 / MS-2. This evidence verifies repeated `resolve` runs over identical fixture inputs produce byte-identical artifact output and lockfile output, with stable registry, source, artifact, and lockfile hashes.

## Objective

Prove that the completed lockfile path from `BEL-1081` is deterministic without adding resolver capability or expanding the read-side MVP scope.

## Context / Constraints

- Parent issue: `BEL-1050`.
- Dependency `BEL-1081` is complete and merged through PR #22 on `origin/main`.
- The proof uses the checked-in MS-1 fixture: `fixtures/ms1/task.md` and `fixtures/ms1/registry.json`.
- Deferred scope remains out of bounds: no mission aggregation, write-side commands, MCP, OS handlers, live connectors, network-backed resolvers, or package publication were added.

## Q-3 Output-Format Decision

Generated lens artifacts default to JSON for persisted artifact identity and lockfile provenance.

- Lockfile records declare `outputOptions.artifactFormat: "json"`.
- The artifact content payload continues to identify the source projection as Markdown with `content.format: "markdown"`.
- The read-side MVP does not emit a Markdown sidecar artifact or dual output format.

## EVD-5: Repeated-Run Byte Comparison

Command:

```bash
tmpdir=$(mktemp -d /tmp/bel-1082-determinism.XXXXXX)
node dist/cli/index.js resolve fixtures/ms1/task.md --registry fixtures/ms1/registry.json --repo-root . --lockfile --lockfile-out "$tmpdir/first.lock.json" --pretty > "$tmpdir/first.resolve.json"
node dist/cli/index.js resolve fixtures/ms1/task.md --registry fixtures/ms1/registry.json --repo-root . --lockfile --lockfile-out "$tmpdir/second.lock.json" --pretty > "$tmpdir/second.resolve.json"
shasum -a 256 "$tmpdir/first.resolve.json" "$tmpdir/second.resolve.json"
shasum -a 256 "$tmpdir/first.lock.json" "$tmpdir/second.lock.json"
cmp -s "$tmpdir/first.resolve.json" "$tmpdir/second.resolve.json"
cmp -s "$tmpdir/first.lock.json" "$tmpdir/second.lock.json"
```

Observed result:

- Repeated resolve stdout bytes matched: `6326a6ed37d8c38c241e6f30ff305d725e04a9d4900cfc1b0f25233cc7c8edf7`.
- Repeated lockfile bytes matched: `4f5b5c42d769fe5ea5dd4dc6090941060efe41a86a25ee2a726b28ccd766713f`.
- `cmp` returned success for both resolve stdout and lockfile byte comparisons.
- Resolve diagnostics count was `0`.

Stable provenance fields:

- `artifactHash`: `sha256:4f687c5ce3308c6cf5ca1782e42597f7dad40d0440991615759748e42dc495ba`
- `registryHash`: `sha256:1b56681d2284fbd744d27ea5faa522ea61ee23627065bf0966cfcd9f65fc39fa`
- `sourceHash`: `sha256:e98fddb832130b79834df1ebad87cb4f391526ec265387bb727cfc2ab8733b6f`
- `lockfileHash`: `sha256:4f5b5c42d769fe5ea5dd4dc6090941060efe41a86a25ee2a726b28ccd766713f`
- `artifactPath`: `.markdown-context/artifacts/repo-path/4f687c5ce3308c6cf5ca1782e42597f7dad40d0440991615759748e42dc495ba.json`

## Regression Coverage

Added `test/cli.test.ts` coverage for repeated `resolve --lockfile --lockfile-out` runs. The test verifies:

- stdout bytes remain identical across repeated runs;
- lockfile bytes remain identical across repeated runs;
- canonical artifact bytes remain identical across repeated runs;
- artifact, registry, source, and lockfile hashes are stable and valid `sha256:` values;
- lockfile `artifactPath` is derived from the artifact hash;
- output format remains JSON while artifact content remains Markdown source data.

## Validation Commands

```bash
npm test -- --run test/cli.test.ts
npm test
```

Current result:

- `npm test -- --run test/cli.test.ts` passed: 23 tests.
- `npm test` passed: 6 test files, 99 tests.
