# BEL-1181 Registry Validation And Fail-Closed Input Policy

Date: 2026-05-22

## Verdict

APPROVE for the BEL-1181 registry-validation release boundary after the CLI fail-closed dispatch gap in mixed valid plus registry-rejected scans was fixed in this branch.

This approval is limited to registry loading, registry validation, closed parameter vocabulary, deterministic diagnostics, and fail-closed resolver entry through supported validation paths. It does not approve filesystem containment, artifact rendering, package publication, release tagging, or future registry capabilities.

## Source Authority

| Source | Status | Evidence |
| --- | --- | --- |
| `src/registry/parse.ts` | reviewed | Registry schema and resource parsing fail closed before a registry object is accepted. |
| `src/registry/validate.ts` | reviewed | Link candidates are matched to registry resources and rejected for unsupported identity, id, lens, or params. |
| `src/core/context-url.ts` | reviewed | Query params are stored on null-prototype records, so prototype-named params remain visible to validation. |
| `src/cli/index.ts` | changed | CLI `resolve` now stops before resolver dispatch when validation is invalid. |
| `test/ms1.test.ts` | changed | MS-1 now covers mixed valid plus registry-rejected CLI resolve behavior. |
| `test/wp2.test.ts` | reviewed | WP-2 covers registry identity, id pattern, lenses, and closed params. |
| `fixtures/ms1/registry.json` | reviewed | Declares only `ctx://repo/path`, default `excerpt`, one allowed lens, and no non-lens params. |
| `fixtures/wp2/registry.json` | reviewed | Declares `ctx://repo/path`, id pattern, `excerpt`/`summary` lenses, default `excerpt`, and closed `section` param. |

## Registry Parsing Findings

`src/registry/parse.ts:9` through `src/registry/parse.ts:32` require the registry to be a JSON object with a `resources` array, schema version `markdown-context.registry.v0`, non-empty registry identity fields, parsed resources, and unique resource declarations before returning a `Registry`.

`src/registry/parse.ts:35` through `src/registry/parse.ts:66` require every resource to be an object with `scheme: "ctx"`, non-empty namespace, kind, default lens, and lenses. Optional `idPattern` must compile as a Unicode regular expression. Optional `params` must be a string array.

`src/registry/parse.ts:69` through `src/registry/parse.ts:80` reject duplicate resource declarations after scheme and namespace normalization.

`src/registry/parse.ts:111` through `src/registry/parse.ts:137` reject empty or duplicate lens and param declarations and return sorted arrays for deterministic registry shape.

Test coverage:

- `test/ms1.test.ts:466` through `test/ms1.test.ts:475` rejects unsupported registry schema versions.
- `test/ms1.test.ts:478` through `test/ms1.test.ts:524` rejects default lenses outside declared lenses, empty lenses, empty lens names, duplicate lens names, empty params, and duplicate params.
- `test/ms1.test.ts:526` through `test/ms1.test.ts:544` rejects duplicate resource declarations after scheme and namespace normalization.
- `test/wp2.test.ts:136` through `test/wp2.test.ts:151` rejects unsupported registry schemes and invalid `idPattern`.

Assessment: malformed registries fail deterministically before registry acceptance. No release-blocking parsing gap remains inside BEL-1181.

## Link Validation Findings

`src/registry/validate.ts:14` through `src/registry/validate.ts:47` validates candidates one by one, emits diagnostics for rejected candidates, and only appends links that pass resource validation with a selected lens.

`src/registry/validate.ts:70` through `src/registry/validate.ts:101` enforces the closed non-`lens` param vocabulary, optional `idPattern`, and requested/default lens membership before a link can be validated.

`src/registry/validate.ts:104` through `src/registry/validate.ts:143` reports deterministic diagnostics for unsupported scheme, namespace, and kind.

Test coverage:

- `test/wp2.test.ts:71` through `test/wp2.test.ts:90` confirms a valid `ctx://repo/path` link with no requested lens selects the registry default lens.
- `test/wp2.test.ts:92` through `test/wp2.test.ts:134` confirms unsupported scheme, namespace, kind, id pattern, lens, and params produce error diagnostics and no validated links.
- `test/ms1.test.ts:391` through `test/ms1.test.ts:411` confirms prompt-like params are rejected with `ctx.param.unsupported`.
- `test/ms1.test.ts:413` through `test/ms1.test.ts:441` confirms omitted lens stays out of scanner canonical URL and validation selects the registry default.

Assessment: unsupported registry-controlled link fields produce deterministic diagnostics and no validated link for the rejected input. No release-blocking validation gap remains inside BEL-1181.

## Prototype-Named And Prompt-Like Params

`src/core/context-url.ts:63` through `src/core/context-url.ts:87` stores non-`lens` query params in a null-prototype record. `src/core/context-url.ts:156` through `src/core/context-url.ts:168` preserves that null-prototype shape after sorting.

`src/registry/validate.ts:74` through `src/registry/validate.ts:81` enumerates own param keys with `Object.keys` and rejects any key outside the resource `params` vocabulary.

Test coverage:

- `test/ms1.test.ts:391` through `test/ms1.test.ts:411` rejects `prompt=ignore-previous-instructions`.
- `test/ms1.test.ts:443` through `test/ms1.test.ts:464` confirms `__proto__` remains an own visible param and is rejected.

Assessment: prompt-like and prototype-named params cannot become hidden resolver behavior through the scanner-to-validator path. No release-blocking param-policy gap remains inside BEL-1181.

## Fail-Closed Resolver Entry

`src/registry/validate.ts:50` through `src/registry/validate.ts:68` makes full scan-result validation fail closed when scanner diagnostics contain an error by returning `valid: false`, `links: []`, and the scan diagnostics.

`src/cli/index.ts:57` through `src/cli/index.ts:90` now uses `validateScanResult` for CLI validation and stops `resolve` before resolver dispatch when validation is invalid. The invalid response returns zero artifacts, propagates validation diagnostics, and emits an empty lockfile when requested.

Test coverage:

- `test/ms1.test.ts:546` through `test/ms1.test.ts:568` confirms CLI `validate` returns scanner diagnostics and zero links for duplicate decoded params.
- `test/ms1.test.ts:570` through `test/ms1.test.ts:593` confirms CLI `resolve` returns zero artifacts for scan diagnostics.
- `test/ms1.test.ts:635` through `test/ms1.test.ts:677` confirms CLI `resolve` returns zero artifacts and an empty lockfile for a mixed valid plus registry-rejected scan.
- `test/ms1.test.ts:244` through `test/ms1.test.ts:267` confirms the public safe pipeline returns zero artifacts and an empty lockfile for a mixed valid plus registry-rejected scan.

Assessment: the supported CLI and public safe pipeline now fail closed before artifact emission when validation has any error diagnostics. The previously identified CLI mixed-scan dispatch gap is fixed in this branch.

## Command Evidence

Command:

```bash
npm test -- --run wp2 ms1
```

Output:

```text
> @jasonbelmonti/markdown-context@0.1.0 test
> npm run build && vitest run "--exclude=.worktrees/**" --run wp2 ms1

> @jasonbelmonti/markdown-context@0.1.0 build
> tsc -p tsconfig.json

 RUN  v3.2.4 /Users/jasonbelmonti/Documents/Development/markdown-context/.worktrees/bel-1181

 ✓ test/wp2.test.ts (13 tests) 14ms
 ✓ test/ms1.test.ts (35 tests) 669ms

 Test Files  2 passed (2)
      Tests  48 passed (48)
```

Full regression command:

```bash
npm test
```

Output:

```text
> @jasonbelmonti/markdown-context@0.1.0 test
> npm run build && vitest run "--exclude=.worktrees/**"

> @jasonbelmonti/markdown-context@0.1.0 build
> tsc -p tsconfig.json

 RUN  v3.2.4 /Users/jasonbelmonti/Documents/Development/markdown-context/.worktrees/bel-1181

 ✓ test/source-path.test.ts (5 tests) 9ms
 ✓ test/lockfile.test.ts (10 tests) 8ms
 ✓ test/wp2.test.ts (13 tests) 19ms
 ✓ test/repo-path.test.ts (14 tests) 95ms
 ✓ test/ms1.test.ts (35 tests) 771ms
 ✓ test/cli.test.ts (23 tests) 4562ms

 Test Files  6 passed (6)
      Tests  100 passed (100)
```

## Registry Policy Gap Classification

| Gap | Classification | Approval impact | Rationale |
| --- | --- | --- | --- |
| Future path allowlist or source-class policy | follow-up | non-blocking | BEL-1181 and BEL-1178 classify this as future hardening unless current release claims require it. Current registry validation constrains accepted resolver identity, lenses, id pattern, and params. |
| Filesystem containment | out-of-scope | non-blocking | Owned by a different audit boundary. This artifact does not approve repo/path source safety. |
| Future schemes, namespaces, kinds, and lenses | follow-up | non-blocking | Current MVP registry is fail-closed for undeclared resource identities and lenses. New capabilities require explicit future registry declarations and tests. |

## Consensus Review

Packet:

- Path: `.codex/consensus-review/bel-1181/consensus-review-packet.md`
- SHA-256: `869f941c7da33b2740a8ce44e41dd3a7fff975271bbba148e57965a4cfafcd8a`

Reviewer verdicts:

- Reviewer 1: APPROVE, no findings.
- Reviewer 2: APPROVE, no findings.
- Reviewer 3: APPROVE, no findings.

Supervising consensus verdict: APPROVE. No validated blocking findings remain inside the BEL-1181 review boundary.

## Final BEL-1181 Classification

The registry validation contract is release-ready for the current MVP scope after the CLI fail-closed fix. No remaining registry policy gap is classified as a release blocker inside the BEL-1181 review boundary.
