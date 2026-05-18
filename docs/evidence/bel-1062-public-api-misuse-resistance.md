# BEL-1062 Public API Misuse Resistance Evidence

Issue: `BEL-1062`

Scope: Root package exports, public type contracts, CLI/public API composition, and consumer misuse resistance for the read-side scan, validate, and resolve path.

## Objective

Verify that library consumers are guided toward the safe scan, validate, and resolve pipeline and cannot easily bypass rejection semantics by combining exported functions incorrectly.

## Success Criteria Status

- [x] Root exports and type contracts are reviewed for safe composition by external consumers.
- [x] Internal-only validation or resolution helpers needed for safety are identified and withheld intentionally from the root package export.
- [x] Public API naming and documentation gaps that could lead to resolving rejected links are recorded with concrete follow-up recommendations.

## Audit Verdict

Recommendation: Accept after the BEL-1062 hardening patch.

Before this audit, the package root exported `resolveRepoPathLink`, which accepted `ValidatedContextLink[]`. Because TypeScript validation is structural and has no runtime provenance check, a consumer could fabricate a validated-link-shaped object and call the raw resolver directly. That was a material misuse-resistance gap already identified by BEL-1059.

The root package now exports a safe public resolver pipeline, `resolveScanResult`, and no longer exports the raw repo/path resolver. Consumers following the root package surface are guided through scan result validation before artifact rendering.

## Public Surface Review

### Root exports

Status: Safe for obvious consumer composition.

Evidence:

- `src/index.ts:1` through `src/index.ts:11` export public result and link types, including `ValidatedContextLink` only as a type.
- `src/index.ts:12` exports `Registry` and `RegistryResource` types for consumers that load or pass registries.
- `src/index.ts:13` exports `ResolveScanResultOptions`.
- `src/index.ts:14` exports `scanMarkdown`.
- `src/index.ts:15` exports `loadRegistry` and `validateScanResult`.
- `src/index.ts:16` exports `resolveScanResult`.
- `src/index.ts` does not export `validateContextLinks`.
- `src/index.ts` no longer exports `resolveRepoPathLink`.

Impact:

- Root consumers can scan Markdown, validate the full scan result, and resolve through a public function that re-runs validation internally.
- Root consumers are not given the link-only validator or raw resolver as obvious composition points.
- Deep imports remain outside the package export contract because `package.json` exposes only `"."`.

### Safe public resolve pipeline

Status: Fail-closed for scan and registry rejection paths.

Evidence:

- `src/pipeline/resolve.ts:10` through `src/pipeline/resolve.ts:14` define `resolveScanResult(scanResult, registry, options)`.
- `src/pipeline/resolve.ts:15` calls `validateScanResult` before resolution.
- `src/pipeline/resolve.ts:16` through `src/pipeline/resolve.ts:22` return zero artifacts when validation reports any error.
- `src/pipeline/resolve.ts:25` resolves only `validateResult.links` after validation succeeds.
- `src/pipeline/resolve.ts:26` merges validation and resolver diagnostics into the public resolve result.
- `test/ms1.test.ts:186` through `test/ms1.test.ts:190` prove the root API omits `resolveRepoPathLink` and exposes `resolveScanResult`.
- `test/ms1.test.ts:193` through `test/ms1.test.ts:208` prove scan-rejected duplicate params return zero public artifacts.
- `test/ms1.test.ts:210` through `test/ms1.test.ts:225` prove registry-rejected unsupported params return zero public artifacts.
- `test/ms1.test.ts:227` through `test/ms1.test.ts:248` prove mixed valid and registry-rejected inputs return zero public artifacts.
- `test/ms1.test.ts:250` through `test/ms1.test.ts:265` prove accepted links still resolve through the root public API.

### CLI comparison

Status: CLI and root public API both validate before resolving; the root public API is intentionally stricter for package consumers by returning zero artifacts when validation reports any error.

Evidence:

- `src/cli/index.ts:36` through `src/cli/index.ts:40` scan Markdown and fail the scan command when scan diagnostics contain errors.
- `src/cli/index.ts:48` through `src/cli/index.ts:56` load the registry and call `validateScanResult` for validate.
- `src/cli/index.ts:59` through `src/cli/index.ts:72` resolve only validated links, merge validation and resolver diagnostics, and exit non-zero when either layer reports errors.
- `src/pipeline/resolve.ts:15` through `src/pipeline/resolve.ts:26` apply the same validate-before-resolve rule for root public API consumers and fail closed before resolution when validation fails.

Note: The CLI may still emit artifacts for other valid links while also returning validation diagnostics and a non-zero exit code. BEL-1062 hardens the root package API so library consumers using the obvious exported resolve path receive zero artifacts for any invalid scan or validation result.

## Finding Resolved

### F-1: Root export exposed raw resolver without validated-link provenance

Recommendation: Resolved.

Evidence before fix:

- BEL-1059 documented that `src/index.ts` exported `resolveRepoPathLink`.
- The raw resolver accepts `ValidatedContextLink[]`, a structural TypeScript shape with no runtime provenance check.
- A fabricated object with `selectedLens: "excerpt"` could reach artifact rendering.

Resolution:

- `src/index.ts:16` now exports `resolveScanResult` instead of `resolveRepoPathLink`.
- `src/pipeline/resolve.ts:15` validates the complete `ScanResult` before calling the internal resolver.
- `src/pipeline/resolve.ts:16` through `src/pipeline/resolve.ts:22` return an empty artifact list for any invalid validation result, including mixed valid and invalid links.
- `test/ms1.test.ts:186` through `test/ms1.test.ts:248` lock the public API boundary and rejected-input behavior.

## Validation

Commands:

```bash
npm install --no-package-lock
npm test
```

Result on 2026-05-17 20:41 CDT in `.worktrees/bel-1062`:

- `npm test`: passed.
- `test/repo-path.test.ts`: 8 tests passed.
- `test/ms1.test.ts`: 29 tests passed.
- `test/cli.test.ts`: 10 tests passed.
- Total: 47 tests passed.

## Follow-Up Recommendations

- Add README usage documentation for the safe public sequence: `scanMarkdown` -> `validateScanResult` for inspection, or `resolveScanResult` for artifact production.
- Keep `validateContextLinks` and `resolveRepoPathLink` out of the root package export unless future runtime provenance is added.
- If a future SDK needs lower-level resolver composition, expose a branded validated-link token produced only by validation rather than accepting plain structural objects.
