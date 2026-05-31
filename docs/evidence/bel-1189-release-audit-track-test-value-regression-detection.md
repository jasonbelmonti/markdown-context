# BEL-1189 Release Audit Track: Test Value And Regression Detection

Issue: `BEL-1189`

Branch: `codex/bel-1189-test-value-regression-detection`

Audited commit: `c944a459512d1a1e253effd446e19cb4c0875864`

Audit date: 2026-05-31

## Verdict

Accept BEL-1189 for the current read-side MVP release boundary.

No release-blocking test-value or regression-detection gap was found. The current suite is high-value overall because it exercises stable product contracts: scanner output, registry rejection, public root API safety, CLI operator behavior, repo/path resolver boundaries, deterministic lockfile provenance, stable JSON output, and package-facing expectations.

`npm test` is sufficient as the required code regression gate for the current MVP release candidate because it builds the package and runs 108 tests across all release-critical runtime boundaries. It is not, by itself, a complete release-publication gate. Package file-list and installed-tarball confidence should continue to use the package gate proven by BEL-1188 and rechecked here with `npm pack --dry-run --json`.

## Source Authority

| Source | Status | Audit use |
| --- | --- | --- |
| Linear `BEL-1189` | loaded | Controls objective, success criteria, source authority, validation evidence, and review boundary. |
| Linear `BEL-1178` through `BEL-1184` | loaded | Controls parent and functional release-risk boundaries. |
| `docs/evidence/bel-1058-audit-group-6.md` | loaded | Prior test-value baseline and historical gap classification. |
| `docs/evidence/bel-1179*.md` through `docs/evidence/bel-1188*.md` | loaded | Current release-audit evidence and accepted-risk classifications. |
| `test/*.ts` | loaded | Current automated regression suite under review. |
| `fixtures/**` | loaded | Checked-in realistic fixtures used by scanner, registry, CLI, and resolver tests. |
| `README.md`, `docs/user-guide.md`, `package.json` | loaded | Release scope, operator contract, and package script/package-gate context. |

Note: `docs/evidence/bel-1178-release-readiness-synthesis.md:75` through `docs/evidence/bel-1178-release-readiness-synthesis.md:79` is now partly stale for `BEL-1186` and `BEL-1187` because current `origin/main` contains those later evidence files. Its statement that `BEL-1189` was missing remains accurate until this artifact is added.

## Current Release Target

The current release target remains the read-side MVP:

- scan Markdown for `ctx://` links through `markdown-engine` link references;
- validate links against a versioned local registry;
- resolve supported offline `ctx://repo/path/...` links into bounded source-data artifacts;
- emit deterministic lockfile provenance for review.

`README.md:8` through `README.md:19` explicitly excludes mission aggregation, write-side commands, MCP transport, OS protocol handlers, browser automation, live connectors, network-backed resolvers, and package publication from the implemented MVP.

## Command Evidence

### Execution Estimation

Command:

```bash
python3 /Users/jasonbelmonti/.codex/skill-checkouts/execution-estimation/scripts/estimate_execution.py --repo-root /Users/jasonbelmonti/Documents/Development/markdown-context/.worktrees/bel-1189 --proposed-files /tmp/bel-1189-proposed-files.txt
```

Observed summary:

```text
schemaVersion: execution-estimation.v5
mode: proposal
execution.action: proceed
risk.blastRadius.level: low
estimation.adjustedStoryPoints: 5
estimation.decompositionRecommended: false
```

Result: pass. No decomposition or blocking planning gate applied.

### Durable Artifact Validation

Commands:

```bash
npx -y @jasonbelmonti/markdown-engine@2.0.0 validate --file ./.codex/execution-briefs/bel-1189/execution-brief.md --profile /Users/jasonbelmonti/.codex/skills/execution-brief/profiles/execution-brief.yaml
shasum -a 256 -c ./.codex/execution-briefs/bel-1189/execution-brief.sha256
python3 /Users/jasonbelmonti/.codex/skills/execution-plan/scripts/validate_execution_plan.py --file ./.codex/execution-plans/bel-1189/execution-plan.md
shasum -a 256 -c ./.codex/execution-plans/bel-1189/execution-plan.sha256
```

Observed result:

```text
execution brief validation: valid true
execution brief checksum: OK
execution plan validation: valid true
execution plan checksum: OK
```

Result: pass.

### Full Regression

Command:

```bash
npm test
```

Observed output:

```text
> @jasonbelmonti/markdown-context@0.1.0 test
> npm run build && vitest run "--exclude=.worktrees/**"

> @jasonbelmonti/markdown-context@0.1.0 build
> tsc -p tsconfig.json

RUN  v3.2.4 /Users/jasonbelmonti/Documents/Development/markdown-context/.worktrees/bel-1189

test/source-path.test.ts 5 tests passed
test/lockfile.test.ts 11 tests passed
test/wp2.test.ts 13 tests passed
test/repo-path.test.ts 14 tests passed
test/ms1.test.ts 39 tests passed
test/cli.test.ts 26 tests passed

Test Files 6 passed (6)
Tests 108 passed (108)
Duration 5.03s
```

Result: pass.

### Package Dry-Run Classification Check

Command:

```bash
npm pack --dry-run --json
```

Observed summary:

```text
id: @jasonbelmonti/markdown-context@0.1.0
filename: jasonbelmonti-markdown-context-0.1.0.tgz
entryCount: 75
size: 19500
unpackedSize: 80547
shasum: 3ce953b120e743464a36754c6ad44a471c0a11c8
included key files: LICENSE, README.md, package.json, dist/index.js, dist/index.d.ts, dist/cli/index.js
```

Result: pass. This check supports package-gate classification but does not replace `npm test`.

## Test-To-Risk Map

| Release-critical behavior | Primary automated anchors | Evidence anchors | Test-value verdict | Gap classification |
| --- | --- | --- | --- | --- |
| Scanner finds supported Markdown link forms, preserves source ranges, and emits stable scan schema. | `test/wp2.test.ts:11`, `test/ms1.test.ts:19`, `test/ms1.test.ts:53` | BEL-1180 source and test mapping at `docs/evidence/bel-1180-release-audit-group-2-scanner-context-url-contract.md:266` through `docs/evidence/bel-1180-release-audit-group-2-scanner-context-url-contract.md:286` | high-value contract coverage | no blocker |
| Context URL canonicalization is deterministic for query order, decoded keys, case-sensitive keys, and omitted lenses. | `test/ms1.test.ts:97`, `test/ms1.test.ts:112`, `test/ms1.test.ts:123`, `test/wp2.test.ts:55` | BEL-1180 canonicalization finding at `docs/evidence/bel-1180-release-audit-group-2-scanner-context-url-contract.md:347` through `docs/evidence/bel-1180-release-audit-group-2-scanner-context-url-contract.md:363` | high-value contract coverage | no blocker |
| Malformed scanner input and duplicate decoded params fail closed before validation or resolution. | `test/ms1.test.ts:140`, `test/ms1.test.ts:153`, `test/ms1.test.ts:168`, `test/ms1.test.ts:210` | BEL-1187 trace rows at `docs/evidence/bel-1187-release-audit-track-fail-closed-behavior.md:162` and `docs/evidence/bel-1187-release-audit-track-fail-closed-behavior.md:165` | high-value negative contract coverage | no blocker |
| Registry parsing rejects malformed registry contracts deterministically. | `test/ms1.test.ts:537`, `test/ms1.test.ts:597`, `test/ms1.test.ts:617`, `test/wp2.test.ts:136`, `test/wp2.test.ts:145` | BEL-1181 registry parsing finding at `docs/evidence/bel-1181-registry-validation-fail-closed.md:24` through `docs/evidence/bel-1181-registry-validation-fail-closed.md:41` | high-value contract coverage | no blocker |
| Registry validation rejects unsupported scheme, namespace, kind, id, lens, params, prompt-like params, and prototype-named params. | `test/wp2.test.ts:71`, `test/ms1.test.ts:462`, `test/ms1.test.ts:514` | BEL-1181 validation and param findings at `docs/evidence/bel-1181-registry-validation-fail-closed.md:43` through `docs/evidence/bel-1181-registry-validation-fail-closed.md:71` | high-value negative contract coverage | no blocker |
| Public root API keeps consumers on scan-result validation before resolve and withholds raw resolver helpers. | `test/ms1.test.ts:196`, `test/ms1.test.ts:203`, `test/ms1.test.ts:210`, `test/ms1.test.ts:244` | BEL-1182 public API findings at `docs/evidence/bel-1182-public-api-cli-operator-contract.md:27` through `docs/evidence/bel-1182-public-api-cli-operator-contract.md:55` | high-value package contract coverage | no blocker |
| CLI rejects misuse early and emits machine-readable diagnostics and exit semantics. | `test/cli.test.ts:17`, `test/cli.test.ts:37`, `test/cli.test.ts:75`, `test/cli.test.ts:164`, `test/ms1.test.ts:645` | BEL-1182 CLI and diagnostics findings at `docs/evidence/bel-1182-public-api-cli-operator-contract.md:57` through `docs/evidence/bel-1182-public-api-cli-operator-contract.md:91` | high-value operator contract coverage | no blocker |
| CLI and public API mixed valid plus invalid input fail closed with zero artifacts and zero lockfile records. | `test/ms1.test.ts:244`, `test/ms1.test.ts:734`, `test/cli.test.ts:707`, `test/cli.test.ts:729`, `test/cli.test.ts:767` | BEL-1187 mixed-input classification at `docs/evidence/bel-1187-release-audit-track-fail-closed-behavior.md:243` through `docs/evidence/bel-1187-release-audit-track-fail-closed-behavior.md:256` | high-value fail-closed acceptance coverage | no blocker |
| Repo/path resolver rejects unsupported lenses, missing files, symlink escapes, parent traversal, and emits no artifact for rejected paths. | `test/repo-path.test.ts:197`, `test/repo-path.test.ts:297`, `test/repo-path.test.ts:319`, `test/ms1.test.ts:694` | BEL-1183 resolver and containment findings at `docs/evidence/bel-1183-release-audit-group-5-repo-path-resolver-source-safety.md:227` through `docs/evidence/bel-1183-release-audit-group-5-repo-path-resolver-source-safety.md:264` | high-value filesystem boundary coverage | no blocker |
| Repo/path artifacts are bounded, normalized, cited, hashed, and labeled as untrusted source data. | `test/repo-path.test.ts:13`, `test/repo-path.test.ts:227`, `test/repo-path.test.ts:249`, `test/repo-path.test.ts:274`, `test/repo-path.test.ts:358` | BEL-1183 artifact boundary finding at `docs/evidence/bel-1183-release-audit-group-5-repo-path-resolver-source-safety.md:266` through `docs/evidence/bel-1183-release-audit-group-5-repo-path-resolver-source-safety.md:286` | high-value resolver integration coverage | no blocker |
| Stable source paths preserve repo-relative lockfile identity without leaking unstable absolute paths in lockfile modes. | `test/source-path.test.ts:9`, `test/source-path.test.ts:21`, `test/source-path.test.ts:31`, `test/cli.test.ts:519`, `test/cli.test.ts:558`, `test/cli.test.ts:584`, `test/cli.test.ts:621` | BEL-1184 and BEL-1186 lockfile source-path findings at `docs/evidence/bel-1184-release-audit-group-6-lockfile-determinism-package-artifact.md:358` through `docs/evidence/bel-1184-release-audit-group-6-lockfile-determinism-package-artifact.md:369` | supporting focused unit plus high-value CLI integration coverage | no blocker |
| Canonical JSON, registry hashes, lockfile records, artifact hashes, and lockfile ordering are deterministic. | `test/lockfile.test.ts:18`, `test/lockfile.test.ts:113`, `test/lockfile.test.ts:229`, `test/lockfile.test.ts:276`, `test/lockfile.test.ts:313`, `test/repo-path.test.ts:47` | BEL-1186 hash provenance finding at `docs/evidence/bel-1186-release-audit-track-determinism-reproducibility.md:309` through `docs/evidence/bel-1186-release-audit-track-determinism-reproducibility.md:340` | high-value invariant and provenance coverage | no blocker |
| CLI JSON, repeated resolve stdout, `--lockfile`, and `--lockfile-out` outputs are byte-reproducible. | `test/cli.test.ts:309`, `test/cli.test.ts:324`, `test/cli.test.ts:329`, `test/cli.test.ts:358`, `test/cli.test.ts:405`, `test/cli.test.ts:476` | BEL-1186 repeated-output finding at `docs/evidence/bel-1186-release-audit-track-determinism-reproducibility.md:341` through `docs/evidence/bel-1186-release-audit-track-determinism-reproducibility.md:363` | high-value CLI determinism coverage | no blocker |
| Package metadata, bin, root export, type declarations, README, and LICENSE are packable release artifacts. | `package.json` scripts and package dry-run evidence; no automated test file owns this entire boundary. | BEL-1188 package classification at `docs/evidence/bel-1188-release-audit-track-package-documentation-release-controls.md:271` through `docs/evidence/bel-1188-release-audit-track-package-documentation-release-controls.md:319`; current dry-run above | release evidence plus package gate, not `npm test` alone | no blocker; keep package gate |

## Test-Value Portfolio Assessment

### High-Value Contract And Integration Coverage

The suite's dominant coverage layer is contract/integration coverage over stable product behavior:

- `test/wp2.test.ts` protects scanner link-form extraction, source-range presence, URL canonicalization, and registry validation policy.
- `test/ms1.test.ts` protects the critical scan -> validate -> resolve path, root package API, ignored resources, fail-closed behavior, registry errors, and CLI critical-path behavior.
- `test/cli.test.ts` executes the built CLI and verifies stdout, stderr, exit codes, stable JSON, lockfile behavior, and mixed-error behavior.
- `test/repo-path.test.ts` uses real filesystem operations to protect resolver containment, symlink escape rejection, parent traversal rejection, source normalization, artifact bounding, and untrusted source-data labeling.

These tests would fail for meaningful regressions: accepting malformed links, emitting artifacts from rejected input, losing machine-readable diagnostics, changing canonical URL identity, leaking outside repo roots, emitting unbounded source text, or changing deterministic lockfile bytes.

### Supporting Focused Unit Coverage

`test/lockfile.test.ts` and `test/source-path.test.ts` are not low-value just because they are narrower than CLI or resolver tests. They protect stable deterministic invariants that are cheaper and clearer to test at the boundary where the invariant lives:

- canonical JSON rejects unsupported values before hashing;
- registry hashes are independent of registry file formatting;
- lockfile records preserve explicit provenance;
- lockfiles sort deterministically by canonical fields;
- source paths stay stable inside the configured base and reject outside-base paths.

These tests should remain focused. Promoting every invariant to a CLI acceptance test would raise runtime and diagnosis cost without materially improving release confidence.

### Low-Value Or Brittle Coverage

No inert, mock-heavy, or implementation-coupled test group was found.

The suite has maintainability pressure in `test/ms1.test.ts` and `test/cli.test.ts` because both files carry multiple adjacent responsibilities. That is not a release blocker: the assertions are still outcome-based and protect package-visible behavior. Future edits should split these files by scanner/registry/public API/CLI responsibility when doing test maintenance, but the current release should not block on restructuring.

## Coverage Gap Classification

| Gap or limitation | Classification | Approval impact | Rationale | Follow-up |
| --- | --- | --- | --- | --- |
| Direct automated parser test for incomplete `ctx://` URLs. | follow-up | non-blocking | BEL-1180 recorded parser probe/source evidence and classified this as non-blocking; malformed URLs and duplicate params already have automated negative tests. | Add a focused parser or scanner regression if later reviewers require branch-level coverage. |
| Direct automated test for missing `markdown-engine` sourceRange branch. | follow-up | non-blocking | Required public link forms currently provide source ranges; scanner source fails closed if sourceRange is absent. Forcing this branch would likely require synthetic engine behavior and may be lower ROI than current contract tests. | Add only if `markdown-engine` exposes a realistic sourceRange-absent fixture or if the dependency contract changes. |
| Package dry-run and packed install smoke are not part of `npm test`. | release-gate separation | non-blocking for BEL-1189 | `npm test` is sufficient for code regression. Package payload and installed tarball behavior are release controls proven by BEL-1188 and current dry-run evidence, not by the Vitest suite alone. | Keep `npm pack --dry-run --json` as the minimal package gate; consider automating packed install/bin/root-import smoke in CI. |
| Broad in-root read policy, full-source pre-bounding read, and stable-worktree containment assumption. | accepted sibling-track risk | non-blocking inside BEL-1189 | BEL-1183, BEL-1185, BEL-1186, and BEL-1187 classify these as accepted release risks for the current stable local trust model. Current tests detect the release-critical containment and bounded-output failures. | Carry existing hardening tasks before broader untrusted Markdown, resource-resilience, or concurrent-mutation claims. |
| `test/ms1.test.ts` and `test/cli.test.ts` are large mixed-responsibility test files. | maintainability follow-up | non-blocking | The tests assert stable outcomes and would catch real regressions; size affects future review ergonomics, not current release confidence. | Split by scanner, registry, public API, and CLI boundaries during the next meaningful test-editing pass. |
| Future mission, write-side, MCP, OS handler, live connector, browser, or network resolver behavior has no tests. | out of scope | non-blocking | These features are explicitly outside the current MVP release scope in README lines 17-19 and BEL-1189 scope. | Create future test strategy when those capabilities enter scope. |

Blocking gaps: none.

## `npm test` Release Gate Verdict

`npm test` should remain the mandatory release regression gate for current code behavior.

It is sufficient for the current read-side MVP code regression boundary because it runs:

- package build through `tsc -p tsconfig.json`;
- scanner and URL contract tests;
- registry parsing and validation tests;
- public API and CLI operator tests;
- repo/path resolver filesystem-boundary tests;
- source-path stability tests;
- lockfile/canonical JSON/hash provenance tests;
- repeated-run determinism tests;
- fail-closed negative-path tests.

Recommended minimal release gates:

1. Code regression gate: `npm test`.
2. Package gate before release approval or publication: `npm pack --dry-run --json` with inspection for `LICENSE`, `README.md`, `package.json`, `dist/index.js`, `dist/index.d.ts`, and `dist/cli/index.js`.
3. Publication-control gate: verify no release script, tag mutation, GitHub Release creation, npm publication, or dist-tag mutation is being invoked by the audit or package scripts.

The current audit ran gates 1 and 2. Gate 3 is covered by BEL-1188 release-control evidence at `docs/evidence/bel-1188-release-audit-track-package-documentation-release-controls.md:320` through `docs/evidence/bel-1188-release-audit-track-package-documentation-release-controls.md:339`.

## Materially Verifiable Success Criteria Status

- [x] Review maps current tests to release-critical behaviors from all functional groups.
- [x] Review distinguishes high-value contract tests from low-value implementation-coupled tests.
- [x] Review identifies release-critical behavior that lacks command, artifact, or test evidence: none found.
- [x] Review records whether current `npm test` is sufficient as a release regression gate: yes for code regression, with separate package/release-control gates retained.

## Review Boundary

Approval means current tests, fixtures, and evidence are adequate for first-release regression detection under the read-side MVP boundary.

Approval does not authorize publication, release tagging, GitHub Release creation, npm dist-tag mutation, future feature coverage claims, or deferral of existing accepted risks outside their stated boundaries.

Reviewers should reject this artifact only for materially unsupported test-value conclusions, missing release-critical behavior in the test-to-risk map, missing command evidence, or an incorrect blocker/follow-up classification inside the BEL-1189 boundary.

## Follow-Up / Non-Blocking Work

- Add direct parser coverage for incomplete `ctx://` URLs if branch-level parser evidence becomes required.
- Add a sourceRange-absent scanner regression only if a realistic `markdown-engine` fixture or contract change makes it high-value.
- Automate `npm pack --dry-run --json` and packed install/bin/root-import smoke if the release process needs a repeatable package gate.
- Split `test/ms1.test.ts` and `test/cli.test.ts` by behavior boundary during future test maintenance.
- Carry existing resolver hardening follow-ups for path policy, source-size limits, and concurrent-mutation containment before stronger trust claims.

## Final BEL-1189 Recommendation

Accept BEL-1189.

The current test portfolio should detect release-critical regressions before shipping the read-side MVP. Its value comes from exercising stable contracts and realistic boundaries, not from broad branch-count coverage. No release-critical behavior was found without test, command, or evidence proof, and the identified gaps are non-blocking follow-up work under the current release scope.
