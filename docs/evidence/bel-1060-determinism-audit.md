# BEL-1060 Determinism and Canonical Artifact Bytes Evidence

Issue: `BEL-1060`

Scope: Cross-cutting determinism audit for canonical URLs, deterministic CLI JSON, repo/path text artifact bytes, source and artifact hashes, and repeated resolver runs after the BEL-1053 through BEL-1058 audit tracks and the BEL-1062 public API hardening patch.

## Objective

Verify that canonical URLs, JSON output, generated text, hashes, and repeated resolver runs are deterministic for identical logical inputs.

## Context / Constraints

This audit synthesizes evidence from scanner canonicalization, CLI serialization, repo/path resolver artifact generation, and tests.

The current scope is read-side deterministic output. Lockfile output and registry-hash proof remain outside the implemented surface and should not be redesigned inside this audit unless their absence creates a blocking contract gap for the current read-side commands.

## Materially Verifiable Success Criteria Status

- [x] Canonical URL construction is reviewed against decoded-key sorting and stable identity expectations.
- [x] Text artifact canonicalization is reviewed for LF normalization, final newline behavior, bounded projection, and hash inputs.
- [x] CLI JSON stability and repeated-run behavior are reviewed or covered by evidence, with gaps classified as blocking or follow-up.

## Audit Verdict

Recommendation: Accept for the current read-side output surface.

The implemented scanner, CLI JSON serializer, and repo/path resolver produce deterministic bytes for the currently supported `scan`, `validate`, and `resolve` path. The audit added focused regression coverage for two determinism claims that were previously evidenced but not directly locked in the suite: canonical URL identity across reordered query params and byte-identical repeated `resolve` CLI output.

Full VAL-5 lockfile and registry-hash proof remains deferred because the current implementation does not emit lockfiles or registry hashes. That is a milestone-scope gap, not a blocker for the current read-side command surface.

## Findings

### F-1: Canonical URL identity is deterministic for decoded query keys

Recommendation: Accept.

Evidence:

- `src/core/context-url.ts` parses URLs with the platform `URL` implementation and iterates decoded `url.searchParams.entries()`, so duplicate checks and canonical sorting operate on decoded keys.
- Query params are stored in a null-prototype record before canonicalization, preserving own keys such as `__proto__` without prototype interference.
- `canonicalContextUrl` serializes the canonical path and query string from parsed fields rather than preserving source query order.
- Query entries are sorted with direct code-unit comparison by key and then value, avoiding locale-sensitive collation.
- `test/ms1.test.ts` covers decoded query key ordering with `%7A` and now covers two logically equivalent query orderings producing the same canonical URL identity.

Impact:

- Reordered query params do not produce different canonical identities.
- Case-sensitive keys remain distinct and sort deterministically by code-unit order.
- Duplicate decoded query params fail closed before they can become accepted links.

### F-2: Repo/path text artifacts use deterministic canonical bytes and hash inputs

Recommendation: Accept.

Evidence:

- `src/resolvers/repo-path/source.ts` normalizes source line endings from LF, CRLF, or CR to LF before source hashing.
- `src/resolvers/repo-path/source.ts` hashes normalized source text with `sha256:<lowercase-hex>`.
- `src/resolvers/repo-path/artifact.ts` canonicalizes small excerpt content to exactly one final newline before artifact hashing.
- `src/resolvers/repo-path/artifact.ts` bounds excerpt text by UTF-8 byte length and appends a fixed truncation marker when content exceeds the budget.
- `src/resolvers/repo-path/artifact.ts` hashes the exact rendered excerpt text, not raw source bytes.
- `test/repo-path.test.ts` covers LF/CRLF source equivalence, final-newline equivalence, bounded output, and distinct source-vs-artifact hashes for truncated output.

Impact:

- Equivalent source files that differ only by line-ending style or missing final newline produce stable artifact text and stable content hashes.
- Truncated artifacts are bounded before returning source-derived text to consumers.

### F-3: CLI JSON output is deterministic and repeated resolve runs are byte-identical

Recommendation: Accept.

Evidence:

- `src/cli/json.ts` recursively serializes JSON object keys in direct code-unit order.
- `src/cli/json.ts` preserves array order, omits object properties that JSON cannot represent, serializes array `undefined` values as `null`, and always appends a final LF.
- `test/cli.test.ts` covers numeric-looking object keys, case-sensitive key ordering, and nested object key ordering.
- `test/cli.test.ts` now runs `resolve` twice with identical command options and asserts byte-identical stdout.
- BEL-1058 evidence recorded a manual repeated `resolve` byte comparison with matching SHA-256 hashes.

Impact:

- Agent and CI consumers can compare `resolve` output bytes directly for the implemented read-side command surface.
- Pretty output remains deterministic because indentation and key order are fixed.

## Gap Classification

Blocking:

- None for the current read-side `scan`, `validate`, and `resolve` output surface.

Follow-up before full MS-2 VAL-5 completion:

- Implement or explicitly descope lockfile output before claiming lockfile hash determinism.
- Add registry identity and registry hash output when the lockfile or equivalent provenance record exists.
- Extend repeated-run proof to that future provenance artifact once it is implemented.

Intentionally deferred:

- Multi-valued query param canonicalization. The current registry model does not declare multi-valued params, and duplicate decoded query params are rejected.
- Network-backed or external resolver determinism. The current supported resolver is offline `repo/path`.

## Validation

Commands:

```bash
npm test
tmp1=$(mktemp /tmp/bel-1060-resolve-a.XXXXXX)
tmp2=$(mktemp /tmp/bel-1060-resolve-b.XXXXXX)
node dist/cli/index.js resolve fixtures/ms1/task.md --registry fixtures/ms1/registry.json --repo-root . --pretty > "$tmp1"
node dist/cli/index.js resolve fixtures/ms1/task.md --registry fixtures/ms1/registry.json --repo-root . --pretty > "$tmp2"
shasum -a 256 "$tmp1" "$tmp2"
cmp -s "$tmp1" "$tmp2"
```

Result:

- Passed on 2026-05-17 21:38 CDT in `.worktrees/bel-1060`.
- `npm test`: passed.
- `test/repo-path.test.ts`: 8 tests passed.
- `test/ms1.test.ts`: 30 tests passed.
- `test/cli.test.ts`: 11 tests passed.
- Total: 49 tests passed.
- Repeated `resolve` output hash matched for both runs: `b4181fc4b34b81384ae19c13f81a0fc56f4e7f3416c5afc145c4606be70bc59d`.
- `cmp` returned `0` for the repeated `resolve` outputs.

## Consensus Review Evidence

Canonical packet:

- SHA-256: `b296401c5904d171513e063314d669934edc15dcf53754d26de8753b071a6f3f`

Consensus:

- Reviewer 1: `APPROVE`
- Reviewer 2: `APPROVE`
- Reviewer 3: `APPROVE`
- Validated blocking findings: none.

Initial consensus pass found one packaging blocker: this evidence file was untracked and would not have landed in the PR. The file was added to the branch diff, the packet was rebuilt from the actual `origin/main` diff, and the clean consensus rerun approved the corrected patch.

## Follow-Up Recommendations

- Keep direct code-unit comparators for canonical URL and stable JSON ordering; do not reintroduce locale-sensitive sorting.
- When lockfile behavior is implemented, hash the exact canonical bytes written and add repeated-run tests that compare both output bytes and recorded hashes.
- Keep deterministic proof focused on stable public contracts instead of broad snapshots of incidental implementation structure.
