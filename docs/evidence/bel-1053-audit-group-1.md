# BEL-1053 Audit Group 1 Evidence

Issue: `BEL-1053`

Scope: Scanner and URL canonicalization foundation after merged PR #6. Primary audit targets were `src/core/scan.ts`, `src/core/context-url.ts`, `src/core/types.ts`, `test/ms1.test.ts`, and `fixtures/ms1/**`.

## Objective

Audit whether `ctx://` links are discovered, rejected, and canonicalized deterministically before validation or resolution consumes them.

## Findings

### F-1: Canonical query sorting used locale-sensitive comparison

Recommendation: Accept and fix.

Evidence:

- Before this audit, `src/core/context-url.ts` sorted canonical query entries with `localeCompare`, which is locale/collation oriented and not the right primitive for deterministic URL byte stability.
- The implementation now sorts by direct string code-unit comparison in `src/core/context-url.ts:131`.
- Regression coverage in `test/ms1.test.ts:109` proves decoded query keys are sorted deterministically as `A`, `a`, `lens`, `z`.

### F-2: `scanMarkdown` uses public `markdown-engine` linkReferences and blocks missing source ranges

Recommendation: Accept.

Evidence:

- `src/core/scan.ts:16` parses Markdown through `markdown-engine` and normalizes with a document version.
- `src/core/scan.ts:22` reads candidates through public `documentQueries.linkReferences`.
- `src/core/scan.ts:27` requires `sourceRange`; `src/core/scan.ts:29` records `ctx.sourceRange.unavailable` and skips the candidate when the engine cannot supply a range.
- `test/ms1.test.ts:50` now covers inline links, images, definitions, link reference usages, and image reference usages with source ranges from `linkReferences`.

### F-3: Scan-time URL errors do not survive into validation or resolution inputs

Recommendation: Accept.

Evidence:

- `src/core/scan.ts:38` parses the URL and appends parse diagnostics.
- `src/core/scan.ts:41` skips any candidate with parse errors, so malformed or duplicate-parameter links are not emitted as link candidates.
- `src/registry/registry.ts:109` exposes `validateScanResult`, which fails closed and returns no links when a full scan result contains errors.
- `src/index.ts:12` exports `validateScanResult`, so package consumers have a public fail-closed validation entrypoint for full scan results.
- `test/ms1.test.ts:120` covers malformed path escapes.
- `test/ms1.test.ts:133` covers duplicate parameters after URL query decoding.
- `test/ms1.test.ts:148`, `test/ms1.test.ts:233`, and `test/ms1.test.ts:257` cover no-link validation and CLI validation/resolution propagation for scan-time duplicate parameter errors.

### F-4: Prototype-named query parameters remain visible and are rejected by validation

Recommendation: Accept.

Evidence:

- `src/core/context-url.ts:63` stores non-lens query params in a null-prototype record created at `src/core/context-url.ts:166`.
- `src/core/context-url.ts:156` preserves sorted params in a null-prototype record before canonicalization.
- `src/registry/registry.ts:74` validates params using `Object.keys`, so prototype-named own keys remain visible.
- `test/ms1.test.ts:198` proves `__proto__` remains an own param and is rejected as `ctx.param.unsupported`.

## Validation

Command:

```bash
npm test
```

Result:

- Passed on 2026-05-15.
- `test/ms1.test.ts`: 21 tests passed.

## Follow-Up Recommendations

- No blocking follow-up remains for BEL-1053 scope.
- Later MS-2 work should keep the broader `linkReferences` source-range form coverage as release evidence, because the execution spec already treats full link-form coverage as `VAL-8`.
