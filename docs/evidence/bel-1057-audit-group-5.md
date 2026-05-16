# BEL-1057 Audit Group 5 Evidence

Issue: `BEL-1057`

Scope: Public package surface and build contract after merged read-side MVP work. Primary audit targets were `src/index.ts`, `src/core/types.ts`, `package.json`, `tsconfig.json`, and generated build assumptions.

## Objective

Audit the package exports, type contracts, and build/release surface so downstream consumers get a safe and coherent read-side API.

## Findings

### F-1: Root exports expose the safe read-side pipeline and keep the link-only validator internal

Recommendation: Accept.

Evidence:

- `src/index.ts:12` exports `scanMarkdown` as the public scanner entrypoint.
- `src/index.ts:13` exports `validateScanResult`, which preserves scan diagnostics and fails closed before returning validated links.
- `src/index.ts:14` exports `resolveRepoPathLink`, whose parameter is `readonly ValidatedContextLink[]`.
- `src/index.ts` does not export `validateContextLinks`, so root consumers are steered away from validating link candidates without scan diagnostics.
- `test/ms1.test.ts:175` covers the root API contract by asserting `validateContextLinks` is not exported and `validateScanResult` is exported.

### F-2: The validated-link type was part of the public contract but was not root-exported

Recommendation: Accept and fix.

Evidence:

- Before this audit, `src/index.ts:1` re-exported `ValidateResult` and `ResolveResult` but not `ValidatedContextLink`.
- `src/core/types.ts:44` defines `ValidatedContextLink` as the post-validation link shape with `selectedLens`.
- `src/core/types.ts:51` exposes validated links through `ValidateResult.links`.
- `src/resolvers/repo-path.ts:10` requires validated links before resolution.

Resolution:

- `src/index.ts:9` now re-exports `ValidatedContextLink`, making the scan, validate, resolve type handoff explicit from the package root.
- The root still does not export `validateContextLinks`, preserving the fail-closed public validation path.

### F-3: Type contracts are explicit for diagnostics, candidates, validation, resolution, identity, and artifacts

Recommendation: Accept.

Evidence:

- `src/core/types.ts:14` defines diagnostics with code, message, severity, optional source range, and optional URL.
- `src/core/types.ts:22` defines scan candidates with schema version, original URL, canonical URL, parsed resource identity, params, and required source range.
- `src/core/types.ts:48` defines validation results with a versioned result schema, validity flag, validated links, and diagnostics.
- `src/core/types.ts:55` defines repo/path source identity with kind, path, and content hash.
- `src/core/types.ts:61` defines repo/path lens artifacts with schema version, canonical URL, selected lens, resolver identity, source identity, content hash, citations, trust boundary, and Markdown content.
- `src/core/types.ts:81` defines resolve results as artifacts plus resolver diagnostics.

### F-4: The npm package could publish an incoherent artifact set

Recommendation: Accept and fix.

Evidence:

- Before this audit, `package.json:10` pointed root imports at `./dist/index.js`, `package.json:12` pointed type consumers at `./dist/index.d.ts`, and `package.json:8` pointed the CLI bin at `dist/cli/index.js`.
- Before this audit, `package.json` had no `files` allowlist and no package lifecycle script that built `dist` before packing.
- `npm pack --dry-run --json` before building listed source, tests, fixtures, and docs but no `dist` files, leaving the declared export, type, and bin targets absent from the packed artifact.
- `npm pack --dry-run --json` after a manual build included both `dist` and internal source/test/docs files, exposing implementation and evidence files as package contents.

Resolution:

- `package.json:17` now allowlists `dist` as the only package payload directory.
- `package.json:22` now runs `npm run build` before pack, so `exports`, `types`, and `bin` targets exist when the package is packed.

## Validation

Commands:

```bash
npm test
npm pack --dry-run --json
npm pack --json --pack-destination <temp-dir>
```

Result:

- Passed on 2026-05-16 in `.worktrees/bel-1057`.
- `npm test`: 3 test files passed; 41 tests passed.
- `npm pack --dry-run --json`: ran `prepack`, built `dist`, and listed 34 packed files consisting of `package.json` plus `dist/**`.
- Tarball consumer smoke test passed from a temporary install: runtime root import exposed `loadRegistry`, `resolveRepoPathLink`, `scanMarkdown`, and `validateScanResult`; TypeScript accepted root type imports for `ValidatedContextLink` and `ValidateResult`; the installed `markdown-context` bin executed `scan`.

## Follow-Up Recommendations

- No publishing automation is required for BEL-1057 beyond the minimal `prepack` build contract.
- A future release-readiness task should decide whether to add package metadata such as README, repository, and provenance policy before first public publish.
