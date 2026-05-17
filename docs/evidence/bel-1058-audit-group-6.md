# BEL-1058 Audit Group 6 Evidence

Issue: `BEL-1058`

Scope: Test and evidence strategy after merged read-side MVP foundation work. Primary audit targets were `test/ms1.test.ts`, `test/repo-path.test.ts`, `test/cli.test.ts`, `fixtures/ms1/**`, `docs/evidence/**`, `docs/design/**`, and `docs/execution/**`.

## Objective

Audit whether the current tests, fixtures, and evidence protect the foundation with high-value acceptance and regression coverage without creating brittle or noisy proof obligations.

## Review Method

The audit used the BEL-1058 Linear issue, the current thread instructions, the design and execution specifications, prior audit evidence, scoped tests, scoped fixtures, and the current implementation state in the BEL-1058 worktree.

Test-value standard:

- Prefer contract-facing tests that would fail on real scanner, registry, resolver, CLI, determinism, or local-safety regressions.
- Classify gaps as blocking, follow-up, or intentionally deferred based on the current foundation scope.
- Do not require broad WP-2 fixture expansion unless the gap blocks confidence in the merged foundation.

## Success Criteria Status

- [x] Existing tests were reviewed for whether they prove scanner, registry, resolver, CLI, determinism, and local-safety contracts at the right level.
- [x] Coverage gaps were classified as blocking, follow-up, or intentionally deferred based on MVP scope.
- [x] Findings were recorded with concrete file/line evidence and an explicit accept, reject, or follow-up recommendation.

## Portfolio Verdict

Recommendation: Accept the current foundation test and evidence strategy with targeted follow-up work before claiming full MS-2 deterministic and registry-completeness proof.

No blocking test-value gap was found for the current foundation. The suite is mostly acceptance, contract, and integration coverage over stable product behavior. The main gaps are narrow and should be tracked as follow-up evidence before later milestone claims, not treated as a reason to reject the current foundation.

## Findings

### F-1: Scanner coverage is contract-facing and protects source-located extraction

Recommendation: Accept.

Evidence:

- `src/core/scan.ts:16` parses Markdown through `markdown-engine`, and `src/core/scan.ts:22` consumes public `documentQueries.linkReferences`.
- `src/core/scan.ts:27` requires source ranges and records `ctx.sourceRange.unavailable` instead of silently emitting an incomplete link.
- `test/ms1.test.ts:16` covers the checked-in critical fixture and asserts parsed URL fields plus `sourceRange`.
- `test/ms1.test.ts:35` covers mixed-case `CTX://` input and canonical lowercase scheme output.
- `test/ms1.test.ts:50` covers inline links, images, definitions, link reference usages, and image reference usages with source ranges.
- `test/ms1.test.ts:94` and `test/ms1.test.ts:109` cover deterministic canonical query ordering.
- `test/ms1.test.ts:120` and `test/ms1.test.ts:133` cover malformed URL escapes and duplicate decoded query params as scan diagnostics.

Test-value judgment:

- These are high-value scanner contract tests. They assert externally meaningful scan output and diagnostics rather than parser internals.
- The link-form test is synthetic but justified: it directly exercises the public `linkReferences` contract without adding broad fixture maintenance.

### F-2: Registry validation has strong fail-closed coverage, with two narrow missing negative cases

Recommendation: Follow-up, not blocking.

Evidence:

- `src/registry/registry.ts:57` validates already-emitted links against the parsed registry, and `src/registry/registry.ts:112` provides the public fail-closed full-scan validation path.
- `test/ms1.test.ts:148` proves scan diagnostics fail closed through the public validation path while the internal link-only helper cannot see rejected scan candidates.
- `test/ms1.test.ts:183` covers rejection of prompt-like unsupported params.
- `test/ms1.test.ts:205` covers registry default-lens selection when `lens` is omitted.
- `test/ms1.test.ts:235` covers prototype-named query params remaining visible to validation.
- `test/ms1.test.ts:258`, `test/ms1.test.ts:270`, and `test/ms1.test.ts:318` cover unsupported registry schema versions, malformed resource declarations, and duplicate registry resources.
- `src/registry/registry.ts:73` emits `ctx.resource.unsupported` for unsupported resources, and `src/registry/registry.ts:93` emits `ctx.lens.unsupported` for unsupported requested lenses.

Gap classification:

- Follow-up: add direct tests for `ctx.resource.unsupported` and `ctx.lens.unsupported`.
- Rationale: the implementation paths are small and visible, and adjacent fail-closed behavior is tested, but the execution spec expects allowed scheme/kind/lens validation evidence before full MS-2 approval.

Test-value judgment:

- The existing registry tests are high-value and contract-facing.
- The missing tests would be cheap, stable contract tests that complete the negative validation matrix without over-expanding fixtures.

### F-3: Resolver and local-safety coverage is high-value and correctly separated from scanner tests

Recommendation: Accept.

Evidence:

- `test/repo-path.test.ts:12` covers a valid repo/path link resolving to a bounded lens artifact with resolver metadata, source identity, trust boundary, citation, and content hash.
- `test/repo-path.test.ts:46` covers non-`excerpt` lens rejection before rendering.
- `test/repo-path.test.ts:76` covers bounded excerpt output and truncation.
- `test/repo-path.test.ts:98` covers LF normalization and hash stability across LF and CRLF source files.
- `test/repo-path.test.ts:123` covers final-newline normalization and stable artifact hashes.
- `test/repo-path.test.ts:146` covers symlink escape rejection.
- `test/repo-path.test.ts:168` covers lexical `../` escape rejection before source read.
- `test/repo-path.test.ts:189` covers hostile source text staying inside an untrusted source-data artifact boundary.

Test-value judgment:

- These are high-value resolver boundary tests. They exercise real filesystem behavior where it matters and use direct resolver tests where CLI coverage would be more expensive without adding much confidence.
- The separation into `test/repo-path.test.ts` improves reviewability and keeps local-safety coverage close to the resolver boundary.

### F-4: CLI coverage protects operator behavior and agent preflight semantics

Recommendation: Accept.

Evidence:

- `test/cli.test.ts:13` covers unknown command rejection before file IO or registry checks.
- `test/cli.test.ts:27`, `test/cli.test.ts:41`, `test/cli.test.ts:53`, `test/cli.test.ts:77`, and `test/cli.test.ts:95` cover unknown options, extra positionals, command-specific option rejection, required registry options, and duplicate value options.
- `test/cli.test.ts:110` covers `resolve` defaulting `--repo-root` to the current working directory.
- `test/cli.test.ts:129` and `test/cli.test.ts:191` cover deterministic CLI JSON key ordering.
- `test/cli.test.ts:152` covers merged validation and resolver diagnostics in one `resolve` output.
- `test/ms1.test.ts:338`, `test/ms1.test.ts:362`, `test/ms1.test.ts:387`, and `test/ms1.test.ts:427` cover CLI validation failure, no resolution after scan errors, unresolved repo paths, and successful CLI resolution.

Test-value judgment:

- These are high-value CLI contract tests because they execute the built CLI and inspect stdout, stderr, exit codes, and JSON semantics visible to agents and operators.
- Some CLI checks live in `test/ms1.test.ts` as critical-path acceptance coverage. That is acceptable for the foundation, but future test edits should consider splitting scanner, registry, and MS-1 acceptance responsibilities into smaller files.

### F-5: Determinism proof is meaningful today, but lockfile and registry-hash evidence remains deferred

Recommendation: Follow-up before full MS-2 completion; not blocking for the current foundation.

Evidence:

- `test/ms1.test.ts:94` and `test/ms1.test.ts:109` cover canonical URL query sorting.
- `test/cli.test.ts:129` and `test/cli.test.ts:191` cover deterministic CLI JSON object-key ordering.
- `test/repo-path.test.ts:98` and `test/repo-path.test.ts:123` cover stable resolver output and hashing across line-ending and final-newline variants.
- `docs/execution/markdown-context-read-side-mvp-execution-spec.md:454` requires repeated resolve outputs, registry hashes, and lockfile hashes for VAL-5.
- `docs/design/markdown-context-operational-design-spec.md:315` defines minimum lockfile record fields, including registry identity and hashes.
- `src/core/types.ts:81` currently defines resolve results as artifacts plus diagnostics, and `src/cli/index.ts:69` emits the resolver result body with merged diagnostics. There is no current lockfile output path in the foundation implementation.

Gap classification:

- Accepted for the current output surface: this audit captured repeated-run CLI evidence for the exact JSON bytes now emitted by `resolve`.
- Deferred: registry-hash and lockfile-hash proof belongs to the later lockfile implementation or to an explicit spec adjustment if lockfiles remain outside the current milestone.

Test-value judgment:

- Current determinism tests have real value because they protect canonicalization and artifact bytes that agents consume today.
- A lockfile test cannot be high-value until the lockfile behavior exists. Recording it as deferred avoids noisy tests for a nonexistent surface while preserving the milestone gate.

### F-6: Existing evidence files are useful release evidence and avoid test-noise inflation

Recommendation: Accept.

Evidence:

- `docs/evidence/bel-1049-ms-1.md:7` records the original build/test evidence and CLI scan, validate, and resolve proof.
- `docs/evidence/bel-1053-audit-group-1.md:11` records scanner and URL canonicalization findings with line-specific evidence.
- `docs/evidence/bel-1054-audit-group-2.md:21` records rejected registry findings, applied fixes, accepted controls, validation, and consensus review evidence.
- `docs/evidence/bel-1055-audit-group-3.md:11` records resolver and artifact boundary findings.
- `docs/evidence/bel-1056-audit-group-4.md:11` records CLI orchestration findings.
- `docs/evidence/bel-1057-audit-group-5.md:11` records package surface and build contract findings.

Test-value judgment:

- The evidence strategy is working: each audit group records what was accepted, what was fixed, what was validated, and what remains outside scope.
- The project should continue using evidence docs for review conclusions and reserve automated tests for stable contracts that should fail on real regressions.

## Coverage Gap Classification

Blocking:

- None for the current foundation test/evidence strategy.

Follow-up:

- Add direct registry negative tests for unsupported resource and unsupported requested lens diagnostics.
- Extend deterministic proof to registry-hash and lockfile-hash evidence before claiming full VAL-5 completion, or amend the execution spec if lockfiles remain outside the current milestone.
- Consider splitting `test/ms1.test.ts` into smaller scanner, registry, and critical-path acceptance files during the next test-editing pass.

Intentionally deferred:

- Broad WP-2 fixture expansion beyond the current link-form scanner coverage.
- Lockfile and registry-hash determinism tests until lockfile behavior exists or the execution spec is amended.
- Performance fixture coverage for 100-link scan behavior until the performance gate is in scope.

## Validation

Commands:

```bash
npm install --ignore-scripts --no-package-lock
npm test
tmp1=$(mktemp /tmp/bel-1058-resolve-a.XXXXXX)
tmp2=$(mktemp /tmp/bel-1058-resolve-b.XXXXXX)
node dist/cli/index.js resolve fixtures/ms1/task.md --registry fixtures/ms1/registry.json --repo-root . --pretty > "$tmp1"
node dist/cli/index.js resolve fixtures/ms1/task.md --registry fixtures/ms1/registry.json --repo-root . --pretty > "$tmp2"
shasum -a 256 "$tmp1" "$tmp2"
cmp -s "$tmp1" "$tmp2"
```

Result:

- Passed on 2026-05-17 in `.worktrees/bel-1058`.
- `npm test`: 3 test files passed; 42 tests passed.
- Repeated `resolve` output hash matched for both runs: `b4181fc4b34b81384ae19c13f81a0fc56f4e7f3416c5afc145c4606be70bc59d`.
- `cmp` returned `0` for the repeated `resolve` outputs.

## Follow-Up Recommendations

- Add direct tests for `ctx.resource.unsupported` and `ctx.lens.unsupported` in the next registry-focused test pass.
- Decide whether lockfile output remains part of the current read-side MVP milestone before using VAL-5 as a completion gate.
- Keep future tests contract-facing. Do not add broad fixtures unless they prove a stable public behavior, close an MS-2 gate, or protect a real regression path.
