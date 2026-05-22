# BEL-1183 Release Audit Group 5: Repo/path Resolver And Source Safety

Issue: `BEL-1183`

Captured: 2026-05-22 18:45 CDT

Worktree: `/Users/jasonbelmonti/Documents/Development/markdown-context/.worktrees/bel-1183`

Branch: `codex/bel-1183-repo-path-resolver-source-safety`

Source revision under audit: `ba271359108504b87ed7a17f03f1cece4a633033`

## Verdict

APPROVE for the BEL-1183 `repo/path` resolver source-safety release boundary, limited to the stable-worktree trust model.

The current resolver rejects unsupported resolver identities, unsupported `repo/path` lenses, missing files, parent traversal, and symlink escapes before emitting artifacts. Emitted excerpt artifacts are capped at 4096 UTF-8 bytes, normalized, cited, and marked as untrusted source data. No source evidence or probe result showed filesystem escape, unbounded emitted content, or source text promoted to instruction data.

Three residual risks remain non-blocking follow-up for the current release boundary:

- valid in-root `repo/path` links can read any in-root file allowed by the registry resource;
- the resolver reads, normalizes, and hashes the full source file before excerpt bounding;
- containment is check-then-read and assumes the repository tree is stable while resolution runs.

Approval of this artifact does not approve broader untrusted Markdown operation, concurrent local mutation containment, future network resolvers, package publication, release tagging, or final release readiness.

## Source Authority

| Source | Status | Evidence |
| --- | --- | --- |
| Linear `BEL-1183` | loaded | Defines the audit objective, source authority, scope, success criteria, review boundary, validation evidence, and follow-up expectations. |
| Linear `BEL-1178` | loaded | Parent release-audit program; prohibits publication, tagging, release mutation, and broad implementation fixes in this audit track. |
| `src/resolvers/repo-path.ts` | reviewed | Dispatches supported `repo/path` `excerpt` links, collects diagnostics, renders artifacts, and creates lockfile records. |
| `src/resolvers/repo-path/source.ts` | reviewed | Resolves real paths, checks root containment, reads source text, normalizes line endings, and records source identity. |
| `src/resolvers/repo-path/artifact.ts` | reviewed | Renders bounded excerpt artifacts, trust metadata, citations, and content hashes. |
| `src/core/source-path.ts` | reviewed | Provides shared base-containment logic for stable citation source paths. |
| `src/core/types.ts` | reviewed | Defines the public artifact trust and source-content boundary fields. |
| `test/repo-path.test.ts` | reviewed and run | Covers unsupported lenses, large excerpt bounding, line-ending normalization, symlink escape rejection, parent traversal rejection, and hostile source-data boundary behavior. |
| `test/source-path.test.ts` | reviewed and run | Covers stable source path containment and base-relative behavior. |
| `README.md` and `docs/user-guide.md` | reviewed | Document current repo/path shape, repo-root behavior, validation stops, source-data fields, and current MVP scope. |
| `docs/evidence/bel-1061-security-source-content-boundary-audit.md` | reviewed | Historical source-boundary audit; current evidence confirms its residual risks remain follow-up under the stable-worktree release model. |

## Current Release Target

Command:

```bash
git status --short --branch
git rev-parse HEAD
git log -1 --pretty=fuller --decorate=short
```

Observed result before this evidence file was authored:

```text
## codex/bel-1183-repo-path-resolver-source-safety...origin/main
?? .codex/
ba271359108504b87ed7a17f03f1cece4a633033
commit ba271359108504b87ed7a17f03f1cece4a633033 (HEAD -> codex/bel-1183-repo-path-resolver-source-safety, origin/main, origin/HEAD)
Merge: 982ee0d db9b210
Author:     Jason Belmonti <jasonbelmonti@gmail.com>
AuthorDate: Fri May 22 18:12:53 2026 -0500
Commit:     GitHub <noreply@github.com>
CommitDate: Fri May 22 18:12:53 2026 -0500

    Merge pull request #32 from jasonbelmonti/codex/bel-1182-public-api-cli-contract

    [codex] Add BEL-1182 operator contract hardening
```

Interpretation:

- The resolver/source-safety audit target is `origin/main` commit `ba271359108504b87ed7a17f03f1cece4a633033`.
- Local `.codex/**` files are execution and review artifacts for this audit.
- This PR's intended product change is this BEL-1183 evidence artifact.

## Command Evidence

### Execution Artifact Validation And Estimation

Execution Brief validation:

```bash
npx -y @jasonbelmonti/markdown-engine@2.0.0 validate --file ./.codex/execution-briefs/bel-1183/execution-brief.md --profile /Users/jasonbelmonti/.codex/skills/execution-brief/profiles/execution-brief.yaml
```

Result: pass.

Execution Plan validation:

```bash
python3 /Users/jasonbelmonti/.codex/skills/execution-plan/scripts/validate_execution_plan.py --file ./.codex/execution-plans/bel-1183/execution-plan.md
```

Result: pass.

Execution estimation:

```bash
python3 /Users/jasonbelmonti/.codex/skill-checkouts/execution-estimation/scripts/estimate_execution.py --repo-root /Users/jasonbelmonti/Documents/Development/markdown-context/.worktrees/bel-1183 --proposed-files ./.codex/execution-plans/bel-1183/proposed-files.txt
```

Observed summary:

```text
schemaVersion: execution-estimation.v5
mode: proposal
execution.action: proceed
planning.blocksExecution: false
estimation.decompositionRecommended: false
risk.blastRadius.level: low
```

Result: pass. No decomposition or blocking planning gate applied.

### Targeted Tests

Command:

```bash
npm test -- --run repo-path source-path
```

Observed result:

```text
> @jasonbelmonti/markdown-context@0.1.0 test
> npm run build && vitest run "--exclude=.worktrees/**" --run repo-path source-path

> @jasonbelmonti/markdown-context@0.1.0 build
> tsc -p tsconfig.json

 RUN  v3.2.4 /Users/jasonbelmonti/Documents/Development/markdown-context/.worktrees/bel-1183

 ✓ test/source-path.test.ts (5 tests) 7ms
 ✓ test/repo-path.test.ts (14 tests) 141ms

 Test Files  2 passed (2)
      Tests  19 passed (19)
```

Result: pass.

### Full Regression

Command:

```bash
npm test
```

Observed result:

```text
> @jasonbelmonti/markdown-context@0.1.0 test
> npm run build && vitest run "--exclude=.worktrees/**"

> @jasonbelmonti/markdown-context@0.1.0 build
> tsc -p tsconfig.json

 RUN  v3.2.4 /Users/jasonbelmonti/Documents/Development/markdown-context/.worktrees/bel-1183

 ✓ test/source-path.test.ts (5 tests) 14ms
 ✓ test/lockfile.test.ts (10 tests) 7ms
 ✓ test/wp2.test.ts (13 tests) 108ms
 ✓ test/repo-path.test.ts (14 tests) 305ms
 ✓ test/ms1.test.ts (35 tests) 2123ms
 ✓ test/cli.test.ts (25 tests) 12781ms

 Test Files  6 passed (6)
      Tests  102 passed (102)
```

Result: pass.

### Manual Source-Safety Probes

Command:

```bash
node --input-type=module <BEL-1183 probe script>
```

Probe coverage:

- symlink inside `repoRoot` pointing outside `repoRoot`;
- direct parent traversal id `../outside.md`;
- missing in-root path;
- unsupported `full` lens after registry validation accepts the lens;
- large in-root source file exceeding the 4096-byte excerpt cap.

Observed summarized output:

```json
{
  "symlinkEscape": {
    "artifacts": 0,
    "diagnostics": [{ "code": "ctx.repoPath.outsideRoot", "severity": "error" }]
  },
  "parentTraversal": {
    "artifacts": 0,
    "diagnostics": [{ "code": "ctx.repoPath.outsideRoot", "severity": "error" }]
  },
  "missingFile": {
    "artifacts": 0,
    "diagnostics": [{ "code": "ctx.repoPath.unresolved", "severity": "error" }]
  },
  "unsupportedLens": {
    "artifacts": 0,
    "diagnostics": [{ "code": "ctx.repoPath.lens.unsupported", "severity": "error" }]
  },
  "largeFile": {
    "diagnostics": [],
    "artifacts": 1,
    "byteLength": 4096,
    "containsTail": false,
    "hasTruncationMarker": true,
    "sourceTrust": "untrusted-source-data",
    "sourceContentBoundary": "source-data",
    "citationCount": 1
  }
}
```

Result: pass. The probe produced no artifacts for rejected paths or unsupported lenses. The large-file artifact stayed within the byte cap, omitted the tail sentinel, retained a truncation marker, and carried the expected source-trust fields.

## Resolver Dispatch Findings

`src/resolvers/repo-path.ts:32` through `src/resolvers/repo-path.ts:42` reject links whose namespace or kind is not `repo/path` with `ctx.resolver.unsupported`.

`src/resolvers/repo-path.ts:44` through `src/resolvers/repo-path.ts:53` reject non-`excerpt` `repo/path` lenses with `ctx.repoPath.lens.unsupported`.

`src/resolvers/repo-path.ts:55` through `src/resolvers/repo-path.ts:59` reads source only after dispatch checks pass and carries resolver diagnostics forward without artifact rendering.

`src/resolvers/repo-path.ts:65` through `src/resolvers/repo-path.ts:69` renders and pushes an artifact only after a source read succeeds.

Test and probe coverage:

- `test/repo-path.test.ts:197` through `test/repo-path.test.ts:225` proves non-`excerpt` repo/path lenses produce diagnostics and no artifact.
- Manual probe `unsupportedLens` confirmed zero artifacts and `ctx.repoPath.lens.unsupported`.

Assessment: unsupported namespace, kind, and selected lens dispatch is fail-closed before source read or artifact rendering. No release-blocking dispatch gap remains inside BEL-1183.

## Repo-Root Containment And Diagnostics Findings

`src/resolvers/repo-path/source.ts:26` resolves every accepted link id through `resolveRealPathInsideRoot`.

`src/resolvers/repo-path/source.ts:88` through `src/resolvers/repo-path/source.ts:96` realpath both the configured repo root and lexical candidate, returning `ctx.repoPath.unresolved` when either cannot resolve.

`src/resolvers/repo-path/source.ts:99` through `src/resolvers/repo-path/source.ts:106` rejects real candidates whose relative path is outside the real root with `ctx.repoPath.outsideRoot`.

`src/resolvers/repo-path/source.ts:40` through `src/resolvers/repo-path/source.ts:43` convert read failures into the same unresolved diagnostic path.

`src/core/source-path.ts:32` through `src/core/source-path.ts:37` define outside-base detection for `..`, `../...`, and absolute relative paths.

Test and probe coverage:

- `test/repo-path.test.ts:297` through `test/repo-path.test.ts:317` proves symlink escapes produce `ctx.repoPath.outsideRoot` and no artifact.
- `test/repo-path.test.ts:319` through `test/repo-path.test.ts:338` proves parent traversal ids produce `ctx.repoPath.outsideRoot` and no artifact.
- `test/repo-path.test.ts:340` through `test/repo-path.test.ts:356` proves repo-contained paths whose first segment starts with two dots remain accepted.
- `test/source-path.test.ts:21` through `test/source-path.test.ts:28` proves stable citation paths outside the base return `undefined`.
- Manual probes confirmed symlink escape, parent traversal, and missing-file diagnostics with zero artifacts.

Assessment: parent traversal, symlink escapes, and missing files fail closed in stable worktrees. No release-blocking containment or diagnostic gap remains inside BEL-1183.

## Artifact Boundary Findings

`src/resolvers/repo-path/artifact.ts:6` sets the excerpt cap at 4096 UTF-8 bytes.

`src/resolvers/repo-path/artifact.ts:13` renders artifact content through `renderBoundedExcerpt`.

`src/resolvers/repo-path/artifact.ts:15` through `src/resolvers/repo-path/artifact.ts:35` emits schema, canonical URL, selected lens, resolver identity, source identity, content hash, citations, `sourceTrust: "untrusted-source-data"`, `sourceContentBoundary: "source-data"`, and Markdown content text.

`src/resolvers/repo-path/artifact.ts:38` through `src/resolvers/repo-path/artifact.ts:60` normalizes final newlines, checks UTF-8 byte length, reserves truncation-marker budget, and stops appending characters before the byte budget is exceeded.

`src/core/types.ts:63` through `src/core/types.ts:80` encode the public artifact contract, including citations, trust, boundary, and Markdown content.

Test and probe coverage:

- `test/repo-path.test.ts:227` through `test/repo-path.test.ts:247` proves large excerpts are truncated, tail content is omitted, artifact bytes stay at or below 4096, and artifact hash differs from the source hash.
- `test/repo-path.test.ts:249` through `test/repo-path.test.ts:271` proves CRLF source text normalizes to LF before rendering and hashing.
- `test/repo-path.test.ts:274` through `test/repo-path.test.ts:294` proves small excerpts normalize to exactly one final newline.
- `test/repo-path.test.ts:358` through `test/repo-path.test.ts:378` proves hostile source text remains inside an `untrusted-source-data` / `source-data` artifact.
- Manual large-file probe confirmed `byteLength: 4096`, no tail sentinel, truncation marker present, one citation, and expected trust fields.

Assessment: emitted artifact text is bounded, normalized, cited, and marked as untrusted source data. No release-blocking artifact-boundary gap remains inside BEL-1183.

## Residual Risk Classification

| Risk | Evidence | Classification | Approval impact | Rationale | Follow-up |
| --- | --- | --- | --- | --- | --- |
| Broad in-root file reads | `src/resolvers/repo-path/source.ts:26` resolves validated `link.id`; `src/resolvers/repo-path/source.ts:40` through `src/resolvers/repo-path/source.ts:47` reads, normalizes, and hashes the accepted file. `src/registry/validate.ts:70` through `src/registry/validate.ts:88` can enforce an optional `idPattern`, but the resolver itself has no allowlist or denylist beyond root containment. | accepted release risk with hardening follow-up | non-blocking | Current release approval is limited to trusted local Markdown and selected repo roots. The resolver does not escape `repoRoot`, and registry `idPattern` can narrow ids today, but broad in-root reads are not safe to advertise for arbitrary untrusted Markdown against broad roots. | Add registry-controlled path policy guidance or richer allow/deny/source-class controls before broader untrusted Markdown claims. |
| Full-source read before excerpt bounding | `src/resolvers/repo-path/source.ts:40` through `src/resolvers/repo-path/source.ts:47` reads the full UTF-8 file, normalizes the full string, and hashes the full string before `src/resolvers/repo-path/artifact.ts:13` bounds emitted text. | resource-hardening follow-up | non-blocking | The emitted artifact is capped and the tail probe was not emitted. The current release boundary does not claim large untrusted file DoS resistance. | Add source-size limits, streaming excerpt reads, or documented hash tradeoffs before claiming resilience against large hostile in-root files. |
| Check-then-read containment | `src/resolvers/repo-path/source.ts:88` through `src/resolvers/repo-path/source.ts:108` validates realpath containment, then `src/resolvers/repo-path/source.ts:40` through `src/resolvers/repo-path/source.ts:41` later reads by path. | stable-worktree assumption with hardening follow-up | non-blocking | Symlink and traversal probes pass when the worktree is stable. The implementation does not claim containment under concurrent local mutation. | Add open/stat/read hardening or equivalent post-open validation before claiming concurrent-mutation resistance. |
| Trusted Markdown and repo-root operator documentation | README lines 69-70 state repo/path ids are repository-contained. `docs/user-guide.md:36` through `docs/user-guide.md:38` says the resolver reads local files under configured root and uses no network or handlers. `docs/user-guide.md:114` through `docs/user-guide.md:147` tells operators to stop on invalid validation and treat source-derived content as data. `docs/user-guide.md:207` through `docs/user-guide.md:208` document unresolved and outside-root diagnostics. | documentation follow-up | non-blocking for this audit track | Existing docs cover repo-root containment and source-data semantics, but they do not yet explicitly say to resolve only Markdown whose repo/path ids the operator is willing to read from the selected root. | Add a clearer trusted-Markdown and repo-root selection warning before broader public release or untrusted-input positioning. |

## Release Documentation Requirement

No documentation gap blocks this BEL-1183 resolver-safety approval because the current docs already state that `repo/path` reads local files under `--repo-root`, that validation failures are stop signals, and that source-derived content is untrusted source data.

Before broader external release claims, the docs should explicitly warn operators to choose `--repo-root` narrowly and to resolve only Markdown whose `ctx://repo/path/...` ids they are willing to read. That requirement is non-blocking for this audit artifact but should be considered by the parent release-readiness synthesis.

## Accepted Controls

- Unsupported resolver identity and non-`excerpt` repo/path lenses fail before source read and artifact rendering.
- Stable-worktree containment uses filesystem `realpath` for root and candidate paths before read.
- Parent traversal and symlink escapes produce `ctx.repoPath.outsideRoot`, diagnostics, and zero artifacts.
- Missing paths produce `ctx.repoPath.unresolved`, diagnostics, and zero artifacts.
- Emitted excerpt artifacts are capped at 4096 UTF-8 bytes and receive deterministic content hashes.
- Artifact payloads carry citations and explicit `sourceTrust: "untrusted-source-data"` and `sourceContentBoundary: "source-data"` fields.
- Source-derived hostile text remains data inside the artifact boundary.

## Internal Review Passes

SOLID analysis found no abstraction issue in the product diff because this PR adds evidence only and does not alter resolver abstractions, module contracts, or dependency direction.

Code simplification review found the artifact structure consistent with prior release-audit evidence and did not identify redundant sections that could be removed without losing required BEL-1183 evidence.

Code-boundary review found the evidence belongs under `docs/evidence/` with the existing audit corpus. No runtime code or test boundary movement is warranted for this audit-only change.

Test-value review classified `test/repo-path.test.ts` and `test/source-path.test.ts` as high-value/supporting coverage because they protect observable resolver and containment contracts. The manual probes add acceptance-style evidence for the same release boundary without replacing the automated tests.

## Consensus Review

Packet:

- Path: `.codex/consensus-review/bel-1183/consensus-review-packet.md`
- SHA-256: `3e340f38706ca15c451ee062f847d57aca88e1ac75b23dd2bf258df64277da35`

Reviewer verdicts:

- Reviewer 1: APPROVE, no blocking findings.
- Reviewer 2: APPROVE, no findings.
- Reviewer 3: APPROVE, no findings.

Validated findings: none.

Non-blocking observations outside scope:

- One reviewer noted that saving the exact inline probe script would improve replayability. The summarized output, targeted tests, and full regression are sufficient for the BEL-1183 review boundary, so this does not affect approval.

Supervising consensus verdict: APPROVE. No validated blocking findings remain inside the BEL-1183 review boundary.

## Follow-up / Non-Blocking Work

- `BEL-1205`: Harden repo/path source policy for untrusted Markdown.
- `BEL-1206`: Add repo/path source-size limit or streaming excerpt policy.
- `BEL-1207`: Harden repo/path containment against concurrent mutation.
- `BEL-1208`: Document trusted Markdown and repo-root selection for repo/path resolve.

## Final BEL-1183 Classification

The offline `repo/path` resolver is acceptable for the current read-side MVP release trust model: trusted local Markdown, caller-selected repo roots, stable worktrees, bounded emitted artifacts, and source-derived content treated as untrusted source data.

No validated release blocker remains inside the BEL-1183 review boundary. Residual broad in-root read policy, full-source memory cost, stable-worktree race assumptions, and explicit trusted-Markdown documentation are non-blocking follow-up items unless the parent release synthesis decides to make broader untrusted-input or concurrent-mutation claims.
