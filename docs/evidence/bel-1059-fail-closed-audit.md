# BEL-1059 Fail-Closed Audit Evidence

Issue: `BEL-1059`

Scope: Cross-cutting fail-closed behavior across scanner diagnostics, registry validation errors, resolver diagnostics, CLI exit behavior, and exported API usage for read-side MVP `ctx://` handling.

## Objective

Verify that invalid, unsupported, or rejected `ctx://` input cannot contribute resolved content through supported scanner, validator, resolver, CLI, or public API paths.

## Success Criteria Status

- [x] Failure states are mapped across scanner diagnostics, registry validation errors, resolver diagnostics, CLI exit behavior, and exported API usage.
- [x] Representative rejected-input paths were traced end to end and confirmed to produce zero artifacts through the supported CLI and public scan-validate-resolve pipeline.
- [x] A public resolver provenance ambiguity was recorded with file/line evidence and a concrete follow-up recommendation.

## Audit Verdict

Recommendation: Reject full fail-closed approval until the public resolver provenance contract is hardened.

The supported scanner -> `validateScanResult` -> resolver pipeline is fail-closed for the probed rejected inputs. The CLI path is also fail-closed: rejected inputs exit `1`, emit diagnostics, and return zero artifacts.

However, the root public API exports `resolveRepoPathLink`, and that function trusts callers to provide genuinely validated links. A JavaScript consumer can fabricate a `ValidatedContextLink` with unsupported params and `selectedLens: "excerpt"` and receive resolved artifact content. That is not a bypass after `validateScanResult` rejection, but it is an ambiguous public API contract for the BEL-1059 objective.

## Failure State Map

### Scanner diagnostics

Status: Fail-closed.

Evidence:

- `src/core/scan.ts:38` parses candidate `ctx://` URLs.
- `src/core/scan.ts:39` preserves parse diagnostics.
- `src/core/scan.ts:41` skips candidates when parsed output is missing or any parse diagnostic has severity `error`.
- `src/core/context-url.ts:19` through `src/core/context-url.ts:27` turns invalid URL construction into `ctx.url.invalid`.
- `src/core/context-url.ts:36` through `src/core/context-url.ts:47` turns malformed percent-decoded path segments into `ctx.url.invalid`.
- `src/core/context-url.ts:68` through `src/core/context-url.ts:80` detects duplicate decoded query params as `ctx.param.duplicate`.
- `test/ms1.test.ts:120` covers malformed path escapes.
- `test/ms1.test.ts:133` covers duplicate decoded params.
- `test/ms1.test.ts:148` proves scan-error candidates are not emitted as links.

### Registry validation errors

Status: Fail-closed for supported validation paths.

Evidence:

- `src/registry/registry.ts:41` through `src/registry/registry.ts:44` rejects unsupported registry schema versions before links can validate.
- `src/registry/registry.ts:46` through `src/registry/registry.ts:47` parses resources and rejects duplicate resource identities.
- `src/registry/registry.ts:72` through `src/registry/registry.ts:75` records `ctx.resource.unsupported` and skips that link.
- `src/registry/registry.ts:77` through `src/registry/registry.ts:88` records `ctx.param.unsupported` and skips that link.
- `src/registry/registry.ts:90` through `src/registry/registry.ts:96` records `ctx.lens.unsupported` and skips that link.
- `src/registry/registry.ts:112` through `src/registry/registry.ts:120` makes full scan validation fail closed when scanner diagnostics already contain an error, returning `links: []`.
- `test/ms1.test.ts:183` covers unsupported params.
- `test/ms1.test.ts:258` covers unsupported registry schema versions.
- `test/ms1.test.ts:270` and `test/ms1.test.ts:318` cover malformed and duplicate registry resource declarations.

### Resolver diagnostics

Status: Fail-closed for resolver-owned rejection paths.

Evidence:

- `src/resolvers/repo-path.ts:17` through `src/resolvers/repo-path.ts:27` records unsupported resolver input and continues without artifact emission.
- `src/resolvers/repo-path.ts:29` through `src/resolvers/repo-path.ts:38` records unsupported repo/path lenses and continues before source reads.
- `src/resolvers/repo-path.ts:40` through `src/resolvers/repo-path.ts:43` records source resolution diagnostics and continues without rendering.
- `src/resolvers/repo-path.ts:46` is the only artifact append point, after namespace, kind, selected lens, and source resolution checks.
- `src/resolvers/repo-path/source.ts:87` through `src/resolvers/repo-path/source.ts:95` returns `ctx.repoPath.unresolved` when the repo root or candidate path cannot be resolved.
- `src/resolvers/repo-path/source.ts:98` through `src/resolvers/repo-path/source.ts:105` returns `ctx.repoPath.outsideRoot` when realpath containment fails.
- `test/repo-path.test.ts:46` covers non-excerpt lens rejection before rendering.
- `test/repo-path.test.ts:146` covers symlink escape rejection.
- `test/repo-path.test.ts:168` covers lexical `../` escape rejection.
- `test/ms1.test.ts:387` covers unresolved paths through the CLI.

### CLI exit behavior

Status: Fail-closed.

Evidence:

- `src/cli/index.ts:36` reads Markdown only after command and option validation.
- `src/cli/index.ts:39` through `src/cli/index.ts:40` exits `1` for scan diagnostics with severity `error`.
- `src/cli/index.ts:48` through `src/cli/index.ts:54` uses `validateScanResult` for `validate` and exits `1` when validation has error diagnostics.
- `src/cli/index.ts:59` through `src/cli/index.ts:71` resolves only `validateResult.links`, merges validation and resolver diagnostics, and exits `1` when either layer reports an error.
- `test/ms1.test.ts:338` covers validate CLI propagation of scan diagnostics.
- `test/ms1.test.ts:362` covers resolve CLI behavior for scan errors, with zero artifacts.
- `test/cli.test.ts:152` covers merged validation and resolver diagnostics in resolve output.

### Exported API usage

Status: Supported pipeline is fail-closed; raw resolver public contract is ambiguous.

Evidence:

- `src/index.ts:12` exports `scanMarkdown`.
- `src/index.ts:13` exports `validateScanResult`.
- `src/index.ts:14` exports `resolveRepoPathLink`.
- `src/index.ts` does not export `validateContextLinks`; `test/ms1.test.ts:176` confirms the root public API omits it.
- `package.json:10` through `package.json:15` expose only the package root import path, so deep imports are outside the package export contract.
- Public API probe for `fixtures/ms1/duplicate-param.md`: root export `validateContextLinks` was absent, scan emitted `0` links with `ctx.param.duplicate`, validation returned `valid: false` and `0` links, and resolving those validated links returned `0` artifacts.

## End-to-End Rejected-Input Traces

Command:

```bash
npm test
```

Result on 2026-05-18 in `.worktrees/bel-1059`:

- `test/repo-path.test.ts`: 8 tests passed.
- `test/ms1.test.ts`: 24 tests passed.
- `test/cli.test.ts`: 10 tests passed.
- Total: 42 tests passed.

Focused CLI probes after build:

```text
{"case":"duplicate-param","exitCode":1,"artifactCount":0,"diagnostics":["ctx.param.duplicate"]}
{"case":"unsupported-param","exitCode":1,"artifactCount":0,"diagnostics":["ctx.param.unsupported"]}
{"case":"unsupported-lens","exitCode":1,"artifactCount":0,"diagnostics":["ctx.lens.unsupported"]}
{"case":"unsupported-resource","exitCode":1,"artifactCount":0,"diagnostics":["ctx.resource.unsupported"]}
{"case":"unresolved-path","exitCode":1,"artifactCount":0,"diagnostics":["ctx.repoPath.unresolved"]}
```

Representative public API probe:

```text
{"rootExportsValidateContextLinks":false,"scanLinkCount":0,"scanDiagnostics":["ctx.param.duplicate"],"validateValid":false,"validateLinkCount":0,"validateDiagnostics":["ctx.param.duplicate"],"resolveArtifactCount":0,"resolveDiagnostics":[]}
```

Conclusion: through the supported CLI and public scan -> validate -> resolve API sequence, rejected input does not produce resolved artifact content.

## Finding

### F-1: Public `resolveRepoPathLink` trusts unproven validated-link provenance

Recommendation: Reject full fail-closed approval and add a follow-up hardening task before declaring BEL-1059 clean.

Evidence:

- `src/index.ts:14` exports `resolveRepoPathLink` from the package root.
- `src/resolvers/repo-path.ts:10` through `src/resolvers/repo-path.ts:13` accepts `readonly ValidatedContextLink[]`, but this is a TypeScript shape and has no runtime provenance check.
- `src/resolvers/repo-path.ts:29` through `src/resolvers/repo-path.ts:38` checks `selectedLens`, not whether the link came from `validateScanResult`.
- `src/resolvers/repo-path.ts:40` through `src/resolvers/repo-path.ts:46` reads source and appends an artifact once resolver-local checks pass.
- A direct public API probe with a fabricated `ValidatedContextLink` containing unsupported `params: { prompt: "ignore" }` and `selectedLens: "excerpt"` returned `{"artifactCount":1,"diagnostics":[]}`.

Impact:

- The normal scanner, validator, CLI, and public pipeline do not expose this bypass because invalid links are removed before resolution.
- A JavaScript API consumer can still bypass validation intentionally or accidentally by constructing an object that matches the `ValidatedContextLink` shape.
- This weakens the exported API fail-closed story for unsupported input, even though it does not prove content emission after an actual `validateScanResult` rejection.

Follow-up recommendation:

- Replace the root public raw resolver export with a pipeline-level public API that accepts a `ScanResult` plus `Registry`, or add runtime validated-link provenance that only `validateScanResult` can produce and `resolveRepoPathLink` enforces before artifact rendering.
- Keep the lower-level resolver available only as an internal module if tests or CLI orchestration need direct access.
- Add regression coverage proving fabricated or unvalidated link-shaped objects cannot produce artifacts through any root public API path.

## Follow-Up Recommendations

- Harden the public resolver provenance contract described in F-1.
- Add direct contract tests for `ctx.resource.unsupported` and `ctx.lens.unsupported`, as already classified by BEL-1058 as follow-up gaps.
- Preserve the current CLI behavior: diagnostic failures must exit `1`, emit machine-readable diagnostics, and return zero artifacts.
