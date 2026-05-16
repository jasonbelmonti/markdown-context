# BEL-1054 Audit Group 2 Evidence

Issue: `BEL-1054`

Scope: Registry validation and validation contract after merged read-side MVP work. Primary audit targets were `src/registry/registry.ts`, `fixtures/ms1/registry.json`, `src/index.ts`, `src/core/types.ts`, and related validation tests.

## Objective

Audit registry loading and validation so accepted `ctx://` links are constrained by a fail-closed, versioned, deterministic registry contract.

## Initial Consensus Verdict

Recommendation: Reject and fix before accepting the current registry validation contract.

Consensus review result:

- Reviewer 1: `REJECT`
- Reviewer 2: `REJECT`
- Reviewer 3: `REJECT`

## Resolution

Status: Fixed in the BEL-1054 worktree on 2026-05-16.

Changes:

- `src/index.ts` no longer exports `validateContextLinks` from the package root. Public consumers now receive the fail-closed `validateScanResult` validation path from the root API.
- `src/registry/registry.ts` now rejects duplicate resource declarations, empty lens names, empty param names, duplicate lens names, duplicate param names, empty `lenses`, and `defaultLens` values not declared in `lenses`.
- `test/ms1.test.ts` now covers the root export contract and malformed registry declarations.

## Original Findings

### F-1: Public consumers can bypass scan diagnostics through `validateContextLinks`

Resolution: Fixed. Original recommendation was reject and fix.

Evidence:

- Before resolution, `src/index.ts:12` exported both `validateContextLinks` and `validateScanResult` from the package root.
- `src/registry/registry.ts:54` defines `validateContextLinks` over already-emitted link candidates only, so it cannot see scan diagnostics.
- `src/core/scan.ts:41` skips candidates with parse errors, leaving scan diagnostics as the only evidence of rejected links.
- `src/registry/registry.ts:109` defines the fail-closed full-scan path, and `src/registry/registry.ts:110` returns no links when scan diagnostics contain errors.
- `test/ms1.test.ts:148` demonstrates the low-level helper behavior: a duplicate-param scan has an error diagnostic and no emitted links, `validateContextLinks(scan.links, registry)` returns `valid: true`, while `validateScanResult(scan, registry)` returns `valid: false`.

Impact:

- The CLI path is safe because `src/cli/index.ts:47` uses `validateScanResult`.
- Before resolution, the public package contract was unsafe for consumers who imported the root API and chose the lower-level validator.

Applied follow-up:

- `validateContextLinks` was removed from the root public export.
- Regression coverage now proves the root public API exposes `validateScanResult` and does not expose `validateContextLinks`.

### F-2: Registry resource parsing accepts invalid or ambiguous declarations

Resolution: Fixed. Original recommendation was reject and fix.

Evidence:

- `src/registry/registry.ts:41` rejects unsupported registry schema versions, so schema-version handling is fail-closed.
- Before resolution, `src/registry/registry.ts:129` parsed each resource independently but did not reject duplicate `(scheme, namespace, kind)` declarations.
- Before resolution, `src/registry/registry.ts:135` accepted `defaultLens`, `lenses`, and `params` independently.
- Before resolution, `src/registry/registry.ts:140` and `src/registry/registry.ts:175` only verified that lens and param declarations were arrays of strings; they did not reject empty strings, duplicate names, or an empty lens set.
- Before resolution, `src/registry/registry.ts:87` trusted parsed registry state during lens selection, so a resource with `defaultLens` missing from `lenses` could still validate explicit requested lenses.
- Before resolution, `src/registry/registry.ts:62` selected the first matching resource, so duplicate resource declarations made accepted parameters and lenses depend on declaration order.

Impact:

- The checked-in fixture at `fixtures/ms1/registry.json:1` is narrow and safe for the current happy path.
- Before resolution, the loader did not enforce a fail-closed registry contract for malformed or ambiguous registry files before links could be accepted.

Applied follow-up:

- Reject duplicate resource identities.
- Reject empty resource fields, empty lens names, empty param names, duplicate lens names, duplicate param names, and empty `lenses`.
- Require `defaultLens` to be included in `lenses`.
- Add tests for invalid registry declarations and duplicate resource declarations.

## Accepted Controls

- Schema-version rejection is present in `src/registry/registry.ts:41`.
- Duplicate resource declarations are rejected by `src/registry/registry.ts:154`.
- Invalid lens and param declaration arrays are rejected by `src/registry/registry.ts:198`.
- Undeclared query params are rejected by `src/registry/registry.ts:77`.
- Unsupported requested lenses are rejected by `src/registry/registry.ts:90`.
- The CLI validation and resolution path uses the fail-closed `validateScanResult` path in `src/cli/index.ts:47`.
- Existing tests cover unsupported params, duplicate scan params, public fail-closed scan validation, and CLI propagation of scan diagnostics.

## Validation

Command:

```bash
npm test
```

Result:

- Passed on 2026-05-16 in `.worktrees/bel-1054`.
- `test/ms1.test.ts`: 29 tests passed.

## Consensus Review Evidence

Canonical packet:

- `.codex/bel-1054-consensus-review-packet.md`
- SHA-256: `e68138c07f6f4c59f60ec6038063282e5ef64c5a91d835e6411ce155d659afe8`

Consensus:

- All three independent reviewers returned `REJECT`.
- All three reviewers independently raised the public validation bypass.
- All three reviewers independently raised incomplete fail-closed registry resource validation.
