# BEL-1055 Audit Group 3 Evidence

Issue: `BEL-1055`

Scope: Repo/path resolver and artifact boundary after merged read-side MVP work. Primary audit targets were `src/resolvers/repo-path.ts`, `src/resolvers/repo-path/source.ts`, `src/resolvers/repo-path/artifact.ts`, `src/core/types.ts`, and resolver tests.

## Objective

Audit the offline `repo/path` resolver so local file reads stay inside the repository, selected lenses are honored, and generated artifacts are bounded and deterministic.

## Findings

### F-1: Filesystem containment and symlink handling fail closed

Recommendation: Accept.

Evidence:

- `src/resolvers/repo-path/source.ts:88` resolves the repository root with `realpath`.
- `src/resolvers/repo-path/source.ts:89` builds the candidate path relative to the real repository root.
- `src/resolvers/repo-path/source.ts:90` resolves the candidate through filesystem realpath, so symlink targets are evaluated before the file is read.
- `src/resolvers/repo-path/source.ts:98` checks the real candidate path against the real root with `path.relative`.
- `src/resolvers/repo-path/source.ts:100` rejects resolved candidates outside the root with `ctx.repoPath.outsideRoot`.
- `src/resolvers/repo-path/source.ts:55` returns a structured unresolved diagnostic for missing or unreadable local files.
- `test/repo-path.test.ts:146` covers an inside-root symlink pointing outside the repo.
- `test/repo-path.test.ts:168` adds direct resolver coverage for a lexical `../outside.md` escape before any file read.

### F-2: Lens dispatch is narrow and source text remains attributed data

Recommendation: Accept.

Evidence:

- `src/resolvers/repo-path.ts:18` rejects non-`repo/path` links as unsupported resolver input.
- `src/resolvers/repo-path.ts:29` rejects non-`excerpt` lenses before reading or rendering source content.
- `src/resolvers/repo-path.ts:40` reads source only after namespace, kind, and selected lens checks pass.
- `src/resolvers/repo-path/artifact.ts:23` records citations from the original Markdown source range.
- `src/resolvers/repo-path/artifact.ts:29` marks resolved content with `sourceTrust: "untrusted-source-data"`.
- `src/resolvers/repo-path/artifact.ts:30` marks resolved content with `sourceContentBoundary: "source-data"`.
- `test/repo-path.test.ts:46` covers non-excerpt lens rejection.
- `test/repo-path.test.ts:189` covers hostile source text staying inside an untrusted source-data artifact boundary.

### F-3: Excerpt artifacts are bounded, normalized, and hashable

Recommendation: Accept.

Evidence:

- `src/resolvers/repo-path/artifact.ts:6` sets a fixed 4096-byte excerpt budget.
- `src/resolvers/repo-path/artifact.ts:38` canonicalizes excerpt text to final-newline form before size checks.
- `src/resolvers/repo-path/artifact.ts:45` reserves byte budget for the truncation marker.
- `src/resolvers/repo-path/artifact.ts:50` walks characters while counting UTF-8 bytes, avoiding over-budget output.
- `src/resolvers/repo-path/artifact.ts:63` hashes rendered artifact content with deterministic `sha256:<hex>` formatting.
- `src/resolvers/repo-path/source.ts:45` normalizes source line endings before source hashing.
- `src/resolvers/repo-path/source.ts:51` records the normalized source content hash in `sourceIdentity`.
- `test/repo-path.test.ts:76` covers bounded output and truncation.
- `test/repo-path.test.ts:98` covers LF normalization and hash stability across LF/CRLF sources.
- `test/repo-path.test.ts:123` covers final-newline normalization and stable artifact hashes.

### F-4: Resolver tests were mixed into the broad MS-1 suite

Recommendation: Accept and fix.

Evidence:

- Before this audit, resolver safety, artifact, and source hashing assertions lived in `test/ms1.test.ts` alongside scanner, registry, and CLI critical-path assertions.
- The resolver-specific coverage now lives in `test/repo-path.test.ts`, which owns the repo/path resolver boundary tests.
- `test/ms1.test.ts` remains focused on the MS-1 scanner, validation, registry, and CLI path.

## Validation

Command:

```bash
npm test
```

Result:

- Passed on 2026-05-16 in `.worktrees/bel-1055`.
- `test/ms1.test.ts`: 23 tests passed.
- `test/repo-path.test.ts`: 8 tests passed.

## Follow-Up Recommendations

- No blocking follow-up remains for BEL-1055 scope.
- Future lockfile provenance remains part of the broader read-side MVP design, but this audit group stayed bounded to the current repo/path resolver and generated lens artifact boundary.
