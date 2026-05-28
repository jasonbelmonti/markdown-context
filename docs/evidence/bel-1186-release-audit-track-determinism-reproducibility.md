# BEL-1186 Release Audit Track: Determinism And Reproducibility

Issue: `BEL-1186`

Captured: 2026-05-28 11:36 CDT

Worktree: `/Users/jasonbelmonti/Documents/Development/markdown-context/.worktrees/bel-1186`

Branch: `codex/bel-1186-determinism-reproducibility-audit`

Source revision under audit: `7225acafdcb8781225744124999018ba0f9bcc26`

## Verdict

APPROVE for the BEL-1186 determinism and reproducibility release-audit boundary.

Current-source review and command evidence support deterministic release claims for the present read-side, offline `repo/path` scope:

- canonical `ctx://` URL identity is stable for equivalent logical query inputs;
- JSON, canonical JSON, registry snapshots, lockfile records, and lockfile hashes use code-unit key ordering and canonical byte inputs rather than locale-sensitive ordering;
- source hashes, artifact hashes, registry hashes, artifact paths, and lockfile hashes derive from documented stable inputs;
- repeated `resolve` runs over the fixture input produce byte-identical stdout and byte-identical lockfile files;
- repeated package dry-runs produce matching package filename, size, unpacked size, entry count, shasum, and integrity metadata, with the expected runtime and metadata payload.

No release-blocking nondeterminism was found inside the BEL-1186 boundary.

Approval of this artifact does not approve external or network resolver determinism, future mission aggregation, package publication, release tagging, GitHub Release creation, npm dist-tag mutation, dependency-lockfile policy, or final parent release-readiness synthesis.

## Source Authority

| Source | Status | Evidence |
| --- | --- | --- |
| Linear `BEL-1186` | loaded | Defines objective, scope, success criteria, evidence requirements, review boundary, and follow-up policy. |
| Linear `BEL-1178` | loaded | Parent release-audit program; prohibits publication, tagging, release mutation, and implementation fixes inside audit-only tracks. |
| Linear `BEL-1180` | loaded | Functional dependency for scanner and canonical URL determinism. |
| Linear `BEL-1183` | loaded | Functional dependency for repo/path source normalization, artifact bytes, and accepted stable-worktree assumptions. |
| Linear `BEL-1184` | loaded | Functional dependency for canonical JSON, lockfile, package artifact, and npm pack evidence. |
| `.codex/execution-briefs/bel-1186/execution-brief.md` | validated | Durable execution context, scope, validation gates, stop conditions, and review boundary. |
| `.codex/execution-plans/bel-1186/execution-plan.md` | validated | Executable route, file touch plan, viability review, estimation inputs, and validation gates. |
| `docs/evidence/bel-1060-determinism-audit.md` | reviewed | Prior cross-cutting determinism evidence for canonical URLs, CLI JSON, repo/path artifacts, and repeated resolver output. |
| `docs/evidence/bel-1050-lockfile-determinism.md` | reviewed | Prior EVD-5 evidence for repeated resolve and lockfile byte identity with stable provenance hashes. |
| `docs/evidence/bel-1180-release-audit-group-2-scanner-context-url-contract.md` | reviewed | Current release-audit evidence for scanner and context URL canonicalization. |
| `docs/evidence/bel-1183-release-audit-group-5-repo-path-resolver-source-safety.md` | reviewed | Current release-audit evidence for source normalization, bounded artifacts, and accepted resolver risks. |
| `docs/evidence/bel-1184-release-audit-group-6-lockfile-determinism-package-artifact.md` | reviewed | Current release-audit evidence for lockfile, deterministic output, and package artifact. |
| Current source under `src/core`, `src/resolvers`, `src/lockfile`, and `src/cli` | reviewed | Direct implementation evidence for canonicalization, hashing, serialization, resolver output, and CLI emission. |
| Current tests under `test/**` | reviewed and run | Regression evidence for canonical URL identity, canonical JSON, lockfile determinism, repeated CLI output, and source/artifact hashes. |
| Current command output on this branch | run | Typecheck, targeted tests, full tests, repeated byte comparisons, provenance extraction, and package dry-runs. |

## Current Release Target

Commands:

```bash
git status --short --branch
git rev-parse HEAD
node --version
npm --version
```

Observed target identity before this evidence artifact was added:

```text
## codex/bel-1186-determinism-reproducibility-audit...origin/main
7225acafdcb8781225744124999018ba0f9bcc26
node: v22.20.0
npm: 11.13.0
```

Interpretation:

- The audit target is current `origin/main` after PR #39 merged BEL-1178 synthesis.
- Local `.codex/**` files are execution artifacts for this audit.
- This branch's intended product change is this BEL-1186 evidence artifact.

## Command Evidence

### Planning Validation And Estimation

Execution Brief validation:

```bash
npx -y @jasonbelmonti/markdown-engine@2.0.0 validate --file ./.codex/execution-briefs/bel-1186/execution-brief.md --profile /Users/jasonbelmonti/.codex/skills/execution-brief/profiles/execution-brief.yaml
shasum -a 256 -c ./.codex/execution-briefs/bel-1186/execution-brief.sha256
```

Result: pass.

Execution Plan validation:

```bash
python3 /Users/jasonbelmonti/.codex/skills/execution-plan/scripts/validate_execution_plan.py --file ./.codex/execution-plans/bel-1186/execution-plan.md
shasum -a 256 -c ./.codex/execution-plans/bel-1186/execution-plan.sha256
```

Result: pass.

Execution estimation:

```bash
python3 /Users/jasonbelmonti/.codex/skill-checkouts/execution-estimation/scripts/estimate_execution.py --repo-root /Users/jasonbelmonti/Documents/Development/markdown-context/.worktrees/bel-1186 --proposed-files /Users/jasonbelmonti/Documents/Development/markdown-context/.worktrees/bel-1186/.codex/execution-plans/bel-1186/proposed-files.txt --proposal-lines-changed 360
```

Observed summary:

```text
schemaVersion: execution-estimation.v5
mode: proposal
execution.action: proceed
planning.blocksExecution: false
estimation.decompositionRecommended: false
estimation.adjustedStoryPoints: 5
risk.blastRadius.level: low
```

Result: pass. No decomposition or blocking planning gate applied.

### Dependency Prep

Command:

```bash
npm install --ignore-scripts --no-package-lock
```

Observed result:

```text
added 123 packages, and audited 124 packages in 5s
found 0 vulnerabilities
```

Result: pass. The command intentionally avoided creating a dependency lockfile.

### Typecheck And Regression

Commands:

```bash
npm run typecheck
npm test -- --run lockfile cli repo-path
npm test
```

Observed result:

```text
npm run typecheck: pass

Targeted tests:
Test Files  3 passed (3)
Tests       51 passed (51)

Full tests:
Test Files  6 passed (6)
Tests       108 passed (108)
```

Result: pass.

### Repeated Resolve And Lockfile Byte Comparison

Command shape:

```bash
tmpdir=$(mktemp -d /tmp/bel-1186-determinism.XXXXXX)
node dist/cli/index.js resolve fixtures/ms1/task.md --registry fixtures/ms1/registry.json --repo-root . --lockfile --lockfile-out "$tmpdir/first.lock.json" --pretty > "$tmpdir/first.resolve.json"
node dist/cli/index.js resolve fixtures/ms1/task.md --registry fixtures/ms1/registry.json --repo-root . --lockfile --lockfile-out "$tmpdir/second.lock.json" --pretty > "$tmpdir/second.resolve.json"
cmp -s "$tmpdir/first.resolve.json" "$tmpdir/second.resolve.json"
cmp -s "$tmpdir/first.lock.json" "$tmpdir/second.lock.json"
shasum -a 256 "$tmpdir/first.resolve.json" "$tmpdir/second.resolve.json" "$tmpdir/first.lock.json" "$tmpdir/second.lock.json"
```

Observed result:

```text
resolve_cmp=match
lockfile_cmp=match
6326a6ed37d8c38c241e6f30ff305d725e04a9d4900cfc1b0f25233cc7c8edf7  first.resolve.json
6326a6ed37d8c38c241e6f30ff305d725e04a9d4900cfc1b0f25233cc7c8edf7  second.resolve.json
4f5b5c42d769fe5ea5dd4dc6090941060efe41a86a25ee2a726b28ccd766713f  first.lock.json
4f5b5c42d769fe5ea5dd4dc6090941060efe41a86a25ee2a726b28ccd766713f  second.lock.json
```

Extracted provenance:

```json
{
  "artifactCount": 1,
  "diagnosticCount": 0,
  "lockfileRecordCount": 1,
  "canonicalUrlsMatch": true,
  "stableJsonHash": "sha256:fb2425ec49bcb17aa5051740d75b5ce6b5087053327e503dcbe23b6ab4e48793",
  "artifactHash": "sha256:4f687c5ce3308c6cf5ca1782e42597f7dad40d0440991615759748e42dc495ba",
  "computedArtifactHash": "sha256:4f687c5ce3308c6cf5ca1782e42597f7dad40d0440991615759748e42dc495ba",
  "artifactPath": ".markdown-context/artifacts/repo-path/4f687c5ce3308c6cf5ca1782e42597f7dad40d0440991615759748e42dc495ba.json",
  "artifactPathMatchesHash": true,
  "registryHash": "sha256:1b56681d2284fbd744d27ea5faa522ea61ee23627065bf0966cfcd9f65fc39fa",
  "sourceHash": "sha256:e98fddb832130b79834df1ebad87cb4f391526ec265387bb727cfc2ab8733b6f",
  "sourceIdentity": {
    "kind": "repo/path",
    "path": "fixtures/ms1/context-source.md"
  },
  "lockfileHash": "sha256:4f5b5c42d769fe5ea5dd4dc6090941060efe41a86a25ee2a726b28ccd766713f",
  "stdoutHasEmbeddedLockfile": true,
  "artifactCanonicalUrl": "ctx://repo/path/fixtures/ms1/context-source.md?lens=excerpt",
  "selectedLens": "excerpt",
  "contentHash": "sha256:e98fddb832130b79834df1ebad87cb4f391526ec265387bb727cfc2ab8733b6f",
  "sourceContentBoundary": "source-data",
  "sourceTrust": "untrusted-source-data"
}
```

Result: pass. The repeated stdout and lockfile files are byte-identical, and recorded hashes match computed canonical inputs.

### Package Dry-Run Reproducibility Signals

Commands:

```bash
npm pack --dry-run --json
npm pack --dry-run --json --silent
npm pack --dry-run --json --silent
```

Observed repeated dry-run summary:

```json
{
  "filename": "jasonbelmonti-markdown-context-0.1.0.tgz",
  "entryCount": 75,
  "size": 19500,
  "unpackedSize": 80547,
  "shasum": "3ce953b120e743464a36754c6ad44a471c0a11c8",
  "integrity": "sha512-Cxx2Llj2SQOBv9KGvVTw9YqfrN0IPChKX+Jtl+FlNNyIfY8WXuy0pWhg6no3tmB/iV3U/prS2RUPsSvXwefxxA==",
  "repeatMatches": true,
  "includes": true,
  "excludes": true
}
```

Included payload checks:

- `LICENSE`
- `README.md`
- `package.json`
- `dist/index.js`
- `dist/index.d.ts`
- `dist/cli/index.js`

Excluded payload checks:

- `src/core/context-url.ts`
- `test/cli.test.ts`
- `fixtures/ms1/task.md`
- `docs/evidence/bel-1186-release-audit-track-determinism-reproducibility.md`
- `.codex/execution-briefs/bel-1186/execution-brief.md`

Result: pass. Repeated dry-run package metadata matched, and the file set remained within the intended runtime and metadata payload.

## Determinism Findings

### F-1: Canonical URL identity is stable for equivalent logical inputs

Status: accepted.

Source references:

- `src/core/context-url.ts:29` through `src/core/context-url.ts:35` lower-case the scheme and namespace.
- `src/core/context-url.ts:63` through `src/core/context-url.ts:87` stores decoded query params, tracks duplicate decoded keys, and separates `lens` from other params.
- `src/core/context-url.ts:89` through `src/core/context-url.ts:100` builds parsed output from sorted params before assigning `canonicalUrl`.
- `src/core/context-url.ts:105` through `src/core/context-url.ts:128` serializes a canonical id path and sorted query entries.
- `src/core/context-url.ts:131` through `src/core/context-url.ts:154` compares query entries with direct string code-unit ordering, not locale collation.

Test and command references:

- `test/ms1.test.ts:97` through `test/ms1.test.ts:138` cover lens sorting, decoded key ordering, equivalent query order, and case-sensitive key order.
- `test/wp2.test.ts:55` through `test/wp2.test.ts:69` covers equivalent query ordering for WP-2 fixture URLs.
- The BEL-1186 provenance probe parsed two reordered URLs and reported `canonicalUrlsMatch: true`.

Judgment:

Canonical URL determinism is release-ready for current supported `ctx://repo/path` inputs.

### F-2: Stable JSON and canonical JSON use deterministic byte ordering

Status: accepted.

Source references:

- `src/core/stable-json.ts:1` through `src/core/stable-json.ts:3` emits exactly one final LF.
- `src/core/stable-json.ts:17` through `src/core/stable-json.ts:31` preserves array order and normalizes array values through JSON serialization rules.
- `src/core/stable-json.ts:33` through `src/core/stable-json.ts:52` sorts object entries before serialization.
- `src/core/stable-json.ts:54` through `src/core/stable-json.ts:62` compares keys with direct string code-unit ordering.
- `src/lockfile/canonical-json.ts:10` through `src/lockfile/canonical-json.ts:14` validates canonical values before serializing through stable JSON.
- `src/lockfile/canonical-json.ts:48` through `src/lockfile/canonical-json.ts:85` rejects unsupported canonical JSON values before hashing.
- `src/lockfile/hash.ts:10` through `src/lockfile/hash.ts:15` hashes the exact canonical UTF-8 string.

Test and command references:

- `test/lockfile.test.ts:18` through `test/lockfile.test.ts:27` verifies sorted object keys and stable array order.
- `test/lockfile.test.ts:29` through `test/lockfile.test.ts:40` verifies unsupported canonical values are rejected before hashing.
- `test/cli.test.ts:324` through `test/cli.test.ts:327` verifies sparse arrays serialize as JSON `null` entries.
- The BEL-1186 provenance probe produced stable JSON bytes and `stableJsonHash: sha256:fb2425ec49bcb17aa5051740d75b5ce6b5087053327e503dcbe23b6ab4e48793`.

Judgment:

Release-critical JSON serialization avoids locale-sensitive or platform-sensitive object ordering.

### F-3: Source, artifact, registry, and lockfile hashes derive from stable inputs

Status: accepted.

Source references:

- `src/resolvers/repo-path/source.ts:39` through `src/resolvers/repo-path/source.ts:52` reads source text, normalizes it, hashes normalized text, and records source identity.
- `src/resolvers/repo-path/source.ts:111` through `src/resolvers/repo-path/source.ts:116` defines source hashing as SHA-256 over normalized UTF-8 text.
- `src/resolvers/repo-path/artifact.ts:13` through `src/resolvers/repo-path/artifact.ts:35` renders artifact metadata and hashes rendered content text.
- `src/resolvers/repo-path/artifact.ts:38` through `src/resolvers/repo-path/artifact.ts:68` canonicalizes excerpts to final-newline form and caps emitted bytes.
- `src/resolvers/repo-path/lockfile.ts:11` through `src/resolvers/repo-path/lockfile.ts:31` hashes canonical artifact JSON, builds the artifact path from that hash, and records source, registry, resolver, and output-option inputs.
- `src/lockfile/lockfile.ts:30` through `src/lockfile/lockfile.ts:49` builds lockfile records with canonical URL, selected lens, artifact path/hash, registry identity/hash, resolver identity, source identity/hash, and output options.
- `src/lockfile/lockfile.ts:52` through `src/lockfile/lockfile.ts:67` sorts records and hashes the canonical lockfile.
- `src/lockfile/lockfile.ts:77` through `src/lockfile/lockfile.ts:93` hashes registries from normalized snapshots with sorted resources and ignored resources.
- `src/lockfile/lockfile.ts:123` through `src/lockfile/lockfile.ts:137` sorts lockfile records by deterministic canonical fields.

Test and command references:

- `test/repo-path.test.ts:60` through `test/repo-path.test.ts:89` checks lockfile record provenance and verifies artifact, registry, and source hashes.
- `test/repo-path.test.ts:92` through `test/repo-path.test.ts:113` verifies artifact paths differ when artifact bytes differ and paths derive from artifact hashes.
- `test/repo-path.test.ts:116` through `test/repo-path.test.ts:139` verifies direct resolver lockfiles are stable across relative and absolute citation source paths.
- `test/repo-path.test.ts:227` through `test/repo-path.test.ts:246` verifies large artifact bounding and distinct source versus artifact hashes.
- `test/repo-path.test.ts:249` through `test/repo-path.test.ts:271` verifies source line-ending normalization before rendering and hashing.
- `test/lockfile.test.ts:113` through `test/lockfile.test.ts:150` verifies registry hashes ignore file formatting and normalize resource ordering.
- `test/lockfile.test.ts:229` through `test/lockfile.test.ts:273` verifies lockfile records include explicit registry, source, artifact, and option provenance.
- `test/lockfile.test.ts:276` through `test/lockfile.test.ts:310` verifies lockfile serialization and hashing are deterministic regardless of record input order.
- The BEL-1186 provenance probe computed the artifact hash from the emitted artifact and matched the lockfile `artifactHash`.

Judgment:

Hash provenance is deterministic and auditable for current offline `repo/path` output.

### F-4: CLI resolve output and lockfile output are byte-reproducible for fixture inputs

Status: accepted.

Source references:

- `src/cli/index.ts:24` through `src/cli/index.ts:30` writes CLI result bodies through stable JSON.
- `src/cli/index.ts:70` through `src/cli/index.ts:123` handles `resolve`, lockfile request state, validation failures, resolver dispatch, output diagnostics, and lockfile-in-stdout behavior.
- `src/cli/index.ts:134` through `src/cli/index.ts:147` writes `--lockfile-out` data through `serializeContextLockfile`.
- `src/resolvers/repo-path.ts:61` through `src/resolvers/repo-path.ts:79` stabilizes lockfile source paths, renders artifacts, and creates lockfile records.
- `src/resolvers/repo-path.ts:82` through `src/resolvers/repo-path.ts:87` returns artifacts, diagnostics, and sorted lockfile data.

Test and command references:

- `test/cli.test.ts:329` through `test/cli.test.ts:356` verifies byte-identical repeated resolve JSON.
- `test/cli.test.ts:358` through `test/cli.test.ts:403` verifies deterministic lockfile data when requested.
- `test/cli.test.ts:405` through `test/cli.test.ts:470` verifies repeated artifact bytes, lockfile bytes, artifact hash, registry hash, source hash, and artifact path stability.
- `test/cli.test.ts:519` through `test/cli.test.ts:556` verifies `--lockfile-out` data is stable across relative and absolute Markdown paths.
- BEL-1186 repeated-run evidence produced matching stdout hashes and matching lockfile hashes, with zero diagnostics.

Judgment:

CLI output and `--lockfile-out` output are byte-reproducible for the current fixture input and current release scope.

### F-5: Package dry-run reproducibility signals are stable for the release payload

Status: accepted.

Source references:

- `package.json:1` through `package.json:19` defines package name, version, MIT license, bin, root export map, types, and files allowlist.
- `package.json:20` through `package.json:24` defines build, prepack, test, and typecheck scripts.
- `package.json:34` through `package.json:36` defines supported Node engines.
- `README.md:8` through `README.md:19` states the read-side scope and excludes mission, write-side, MCP, OS handlers, browser automation, live connectors, network resolvers, and publication.
- `README.md:46` through `README.md:52` documents the installed `markdown-context` bin surface.
- `LICENSE:1` through `LICENSE:21` provides the top-level MIT license artifact.

Command references:

- `npm pack --dry-run --json` succeeded.
- Two repeated `npm pack --dry-run --json --silent` runs matched on filename, entry count, size, unpacked size, shasum, and integrity.
- Package payload checks confirmed `LICENSE`, `README.md`, `package.json`, `dist/index.js`, `dist/index.d.ts`, and `dist/cli/index.js` are included.
- Package payload checks confirmed source, tests, fixtures, docs, and `.codex` execution artifacts are excluded.

Judgment:

Package artifact reproducibility signals are stable enough for the BEL-1186 release-readiness boundary. This does not approve publication or stronger source-build reproducibility claims.

## Blocking Findings

None.

## Accepted Risks And Follow-Up

| Risk or gap | Classification | Release impact | Follow-up |
| --- | --- | --- | --- |
| Dependency lockfile policy remains undocumented for stronger source-build reproducibility claims. | accepted risk | non-blocking for current package artifact and CLI output reproducibility | Document dependency-lockfile policy before claiming stronger source-build reproducibility. |
| `npm pack --dry-run` proves local package metadata and file-list reproducibility signals, not registry publication behavior. | accepted scope limit | non-blocking because BEL-1186 does not approve publication | Keep publication, tag, and registry checks in release-control tasks. |
| Full-source read, normalization, and hashing happen before excerpt bounding. | accepted inherited risk | non-blocking for determinism under stable local files; already classified by BEL-1183 and BEL-1185 | Add source-size policy or streaming reads before claiming hostile large-file resource resilience. |
| Repo/path source containment assumes stable local worktree during resolution. | accepted inherited risk | non-blocking for deterministic repeated runs in stable worktrees | Add race-hardening before claiming concurrent-mutation safety. |
| Future network resolvers and mission aggregation have no determinism evidence here. | out of scope | non-blocking for current offline `repo/path` scope | Create future phase determinism tasks if those features are implemented. |

## Materially Verifiable Success Criteria Status

- [x] Review proves canonical URL identity is stable for equivalent logical inputs.
- [x] Review proves repeated `resolve` output and lockfile outputs are byte-identical for fixture inputs.
- [x] Review confirms source hash, artifact hash, registry hash, and lockfile hash inputs are documented and stable.
- [x] Review confirms no locale-sensitive or platform-sensitive ordering remains in release-critical serialization.
- [x] Review records package artifact reproducibility signals from repeated `npm pack --dry-run --json --silent` runs.

## Review Boundary

Approval means deterministic behavior is release-ready for current read-side, offline `repo/path` scope. Approval does not authorize claims about future connectors, external state, mission aggregation, release publication, package tagging, GitHub Release creation, npm dist-tag mutation, dependency-lockfile policy, or final parent release readiness.

Reviewers should reject this artifact only for correctness, safety, regression, or maintainability issues inside the determinism and reproducibility boundary stated above. Planned follow-up and out-of-scope future determinism work are non-blocking unless this artifact claims that scope.

## Final BEL-1186 Recommendation

Accept BEL-1186 for the current release-audit boundary.

No nondeterministic release output was found in canonical URL identity, stable JSON serialization, source/artifact/registry/lockfile hash provenance, repeated CLI output, lockfile output, or package dry-run reproducibility signals for the current offline `repo/path` release candidate.
