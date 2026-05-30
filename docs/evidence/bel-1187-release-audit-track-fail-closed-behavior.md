# BEL-1187 Release Audit Track: Fail-Closed Behavior Across Accepted Paths

Issue: `BEL-1187`

## Verdict

APPROVE for the BEL-1187 fail-closed release-audit boundary.

Current-source evidence confirms that invalid, unsupported, or rejected `ctx://` input does not contribute resolved artifact content through supported scanner, validator, root public API, CLI, or repo/path resolver paths. The approval is limited to supported package root exports, CLI commands, and current internal resolver behavior as reached by validated links. It does not approve unsupported deep imports, future commands, future connectors, release publication, or broader untrusted-Markdown claims.

## Source Authority

| Source | Status | Evidence |
| --- | --- | --- |
| Linear `BEL-1187` | loaded | Defines rejected-input trace requirements, review boundary, and release-blocking fail-closed criteria. |
| Linear `BEL-1178` | loaded | Parent release audit program; prohibits publication, tagging, and release-state mutation. |
| Linear `BEL-1180` through `BEL-1183` | loaded | Functional dependency tracks for scanner, registry, public API/CLI, and repo/path resolver behavior. |
| `docs/evidence/bel-1059-fail-closed-audit.md` | reviewed | Historical fail-closed audit that identified the prior raw-resolver root export gap. |
| `docs/evidence/bel-1062-public-api-misuse-resistance.md` | reviewed | Confirms the prior raw-resolver root export gap was fixed by `resolveScanResult`. |
| `docs/evidence/bel-1180-release-audit-group-2-scanner-context-url-contract.md` | reviewed | Current scanner and context URL evidence. |
| `docs/evidence/bel-1181-registry-validation-fail-closed.md` | reviewed | Current registry fail-closed evidence. |
| `docs/evidence/bel-1182-public-api-cli-operator-contract.md` | reviewed | Current root API and CLI operator evidence. |
| `docs/evidence/bel-1183-release-audit-group-5-repo-path-resolver-source-safety.md` | reviewed | Current repo/path resolver source-safety evidence. |
| `src/core`, `src/registry`, `src/pipeline`, `src/cli`, `src/resolvers` | reviewed | Current source under audit at `d42be18c66ac842049a467d77c72889d8382bdd3`. |
| `test/ms1.test.ts`, `test/cli.test.ts`, `test/repo-path.test.ts`, `test/wp2.test.ts` | run and reviewed | Existing regression coverage for rejected-input behavior. |

## Current Release Target

Command:

```bash
git rev-parse HEAD
git status --short --branch
```

Result:

```text
d42be18c66ac842049a467d77c72889d8382bdd3
## codex/bel-1187-fail-closed-audit
```

## Command Evidence

### Planning And Estimation Gates

Commands:

```bash
npx -y @jasonbelmonti/markdown-engine@2.0.0 validate --file ./.codex/execution-briefs/bel-1187/execution-brief.md --profile /Users/jasonbelmonti/.codex/skills/execution-brief/profiles/execution-brief.yaml
python3 /Users/jasonbelmonti/.codex/skills/execution-plan/scripts/validate_execution_plan.py --file ./.codex/execution-plans/bel-1187/execution-plan.md
python3 /Users/jasonbelmonti/.codex/skill-checkouts/execution-estimation/scripts/estimate_execution.py --repo-root /Users/jasonbelmonti/Documents/Development/markdown-context/.worktrees/bel-1187 --proposed-files ./.codex/execution-plans/bel-1187/proposed-files.txt
```

Result: pass. The brief and plan validation profiles passed. The execution estimator returned `execution.action: "proceed"`, `estimation.decompositionRecommended: false`, adjusted story points `3`, and low blast radius.

### Build And Targeted Tests

Commands:

```bash
npm install --no-package-lock
npm run build
npm test -- --run ms1 cli repo-path wp2
```

Result:

```text
npm install --no-package-lock: added 122 packages; found 0 vulnerabilities.
npm run build: passed.
test/wp2.test.ts: 13 tests passed.
test/repo-path.test.ts: 14 tests passed.
test/ms1.test.ts: 39 tests passed.
test/cli.test.ts: 26 tests passed.
Test Files: 4 passed.
Tests: 92 passed.
```

### Manual Rejected-Input Probes

Command:

```bash
node --input-type=module
```

Result:

```json
{
  "generatedAt": "2026-05-30T04:16:35.028Z",
  "cliPreflight": {
    "case": "scan-command-rejects-unsupported-registry-option",
    "exitCode": 2,
    "stderrEmpty": true,
    "schemaVersion": "markdown-context.cli-error.v0",
    "diagnosticCodes": ["cli.option.unsupported"]
  },
  "rootExports": {
    "scanMarkdown": true,
    "validateScanResult": true,
    "resolveScanResult": true,
    "validateContextLinks": false,
    "resolveRepoPathLink": false
  },
  "cliResolve": [
    {"case": "duplicate-param", "exitCode": 1, "stderrEmpty": true, "artifactCount": 0, "diagnosticCodes": ["ctx.param.duplicate"], "lockfileRecordCount": 0},
    {"case": "unsupported-param", "exitCode": 1, "stderrEmpty": true, "artifactCount": 0, "diagnosticCodes": ["ctx.param.unsupported"], "lockfileRecordCount": 0},
    {"case": "unsupported-lens", "exitCode": 1, "stderrEmpty": true, "artifactCount": 0, "diagnosticCodes": ["ctx.lens.unsupported"], "lockfileRecordCount": 0},
    {"case": "malformed-url", "exitCode": 1, "stderrEmpty": true, "artifactCount": 0, "diagnosticCodes": ["ctx.url.invalid"], "lockfileRecordCount": 0},
    {"case": "missing-file", "exitCode": 1, "stderrEmpty": true, "artifactCount": 0, "diagnosticCodes": ["ctx.repoPath.unresolved"], "lockfileRecordCount": 0},
    {"case": "outside-root", "exitCode": 1, "stderrEmpty": true, "artifactCount": 0, "diagnosticCodes": ["ctx.repoPath.outsideRoot"], "lockfileRecordCount": 0},
    {"case": "mixed-valid-invalid", "exitCode": 1, "stderrEmpty": true, "artifactCount": 0, "diagnosticCodes": ["ctx.param.unsupported"], "lockfileRecordCount": 0}
  ],
  "publicApi": [
    {"case": "duplicate-param", "scanLinkCount": 0, "scanDiagnosticCodes": ["ctx.param.duplicate"], "artifactCount": 0, "diagnosticCodes": ["ctx.param.duplicate"], "lockfileRecordCount": 0},
    {"case": "unsupported-param", "scanLinkCount": 1, "scanDiagnosticCodes": [], "artifactCount": 0, "diagnosticCodes": ["ctx.param.unsupported"], "lockfileRecordCount": 0},
    {"case": "unsupported-lens", "scanLinkCount": 1, "scanDiagnosticCodes": [], "artifactCount": 0, "diagnosticCodes": ["ctx.lens.unsupported"], "lockfileRecordCount": 0},
    {"case": "malformed-url", "scanLinkCount": 0, "scanDiagnosticCodes": ["ctx.url.invalid"], "artifactCount": 0, "diagnosticCodes": ["ctx.url.invalid"], "lockfileRecordCount": 0},
    {"case": "missing-file", "scanLinkCount": 1, "scanDiagnosticCodes": [], "artifactCount": 0, "diagnosticCodes": ["ctx.repoPath.unresolved"], "lockfileRecordCount": 0},
    {"case": "outside-root", "scanLinkCount": 1, "scanDiagnosticCodes": [], "artifactCount": 0, "diagnosticCodes": ["ctx.repoPath.outsideRoot"], "lockfileRecordCount": 0},
    {"case": "mixed-valid-invalid", "scanLinkCount": 2, "scanDiagnosticCodes": [], "artifactCount": 0, "diagnosticCodes": ["ctx.param.unsupported"], "lockfileRecordCount": 0}
  ]
}
```

Result: pass. Every rejected-input probe produced zero artifacts. CLI resolve probes exited `1`, emitted machine-readable diagnostics on stdout, left stderr empty, and produced zero lockfile records when `--lockfile` was requested. The CLI preflight probe exited `2` with `markdown-context.cli-error.v0` and `cli.option.unsupported`.

### Full Regression And Diff Hygiene

Commands:

```bash
npm test
git diff --check
git status --short --branch
```

Result:

```text
npm test: passed.
test/source-path.test.ts: 5 tests passed.
test/lockfile.test.ts: 11 tests passed.
test/wp2.test.ts: 13 tests passed.
test/repo-path.test.ts: 14 tests passed.
test/ms1.test.ts: 39 tests passed.
test/cli.test.ts: 26 tests passed.
Test Files: 6 passed.
Tests: 108 passed.
git diff --check: passed.
git status --short --branch:
## codex/bel-1187-fail-closed-audit
?? docs/evidence/bel-1187-release-audit-track-fail-closed-behavior.md
```

## Rejected-Input Trace Matrix

| Trace | Rejection layer | CLI result | Root public API result | Release classification |
| --- | --- | --- | --- | --- |
| Duplicate decoded params | Scanner | `exitCode: 1`, `ctx.param.duplicate`, `artifactCount: 0` | `scanLinkCount: 0`, `ctx.param.duplicate`, `artifactCount: 0` | fail-closed |
| Unsupported params | Registry | `exitCode: 1`, `ctx.param.unsupported`, `artifactCount: 0` | `ctx.param.unsupported`, `artifactCount: 0` | fail-closed |
| Unsupported lens | Registry before supported resolution | `exitCode: 1`, `ctx.lens.unsupported`, `artifactCount: 0` | `ctx.lens.unsupported`, `artifactCount: 0` | fail-closed |
| Malformed URL | Scanner | `exitCode: 1`, `ctx.url.invalid`, `artifactCount: 0` | `scanLinkCount: 0`, `ctx.url.invalid`, `artifactCount: 0` | fail-closed |
| Missing file | Resolver-local source read | `exitCode: 1`, `ctx.repoPath.unresolved`, `artifactCount: 0` | `ctx.repoPath.unresolved`, `artifactCount: 0` | fail-closed |
| Outside-root path | Resolver-local containment | `exitCode: 1`, `ctx.repoPath.outsideRoot`, `artifactCount: 0` | `ctx.repoPath.outsideRoot`, `artifactCount: 0` | fail-closed |
| Mixed valid and invalid input | Whole-result validation | `exitCode: 1`, `ctx.param.unsupported`, `artifactCount: 0`, `lockfileRecordCount: 0` | `ctx.param.unsupported`, `artifactCount: 0`, `lockfileRecordCount: 0` | acceptable release behavior |

## Scanner Findings

`src/core/scan.ts:20` defines `scanMarkdown`. `src/core/scan.ts:26` consumes public `markdown-engine` link references, and `src/core/scan.ts:42` parses each `ctx://` URL through `parseContextUrl`. `src/core/scan.ts:45` through `src/core/scan.ts:47` skip candidate emission when parsing fails or any parser diagnostic has severity `error`.

`src/core/context-url.ts:13` defines `parseContextUrl`. Invalid URL construction returns `ctx.url.invalid` at `src/core/context-url.ts:19` through `src/core/context-url.ts:26`; malformed decoded path segments return `ctx.url.invalid` at `src/core/context-url.ts:36` through `src/core/context-url.ts:46`; incomplete URLs return `ctx.url.incomplete` at `src/core/context-url.ts:50` through `src/core/context-url.ts:60`; duplicate decoded query params return `ctx.param.duplicate` at `src/core/context-url.ts:68` through `src/core/context-url.ts:78`.

Regression anchors:

- `test/ms1.test.ts:140` covers malformed path escape diagnostics with `ctx.url.invalid`.
- `test/ms1.test.ts:153` covers duplicate decoded params with `ctx.param.duplicate`.
- `test/ms1.test.ts:172` through `test/ms1.test.ts:190` proves duplicate-param scan diagnostics yield zero scan links and invalid full validation.

Assessment: malformed URLs and duplicate decoded params fail in the scan phase before accepted candidates can reach validation, public resolve, CLI resolve, or resolver dispatch.

## Registry Validation Findings

`src/registry/validate.ts:16` defines link validation over scan candidates. Rejected candidates are not appended to `validatedLinks`; only links passing resource policy and resource-specific validation reach `validatedLinks.push` at `src/registry/validate.ts:42` through `src/registry/validate.ts:45`.

`src/registry/validate.ts:56` through `src/registry/validate.ts:64` make full `ScanResult` validation fail closed when scanner diagnostics already contain errors, returning `valid: false`, `links: []`, and propagated scan diagnostics. `src/registry/validate.ts:80` through `src/registry/validate.ts:88` reject unsupported params as `ctx.param.unsupported`; `src/registry/validate.ts:98` through `src/registry/validate.ts:105` reject unsupported requested lenses as `ctx.lens.unsupported`; `src/registry/validate.ts:118` through `src/registry/validate.ts:153` reject unsupported scheme, namespace, and kind identities.

Regression anchors:

- `test/wp2.test.ts:92` through `test/wp2.test.ts:134` covers unsupported schemes, namespaces, kinds, id patterns, lenses, and params with deterministic diagnostics and zero validated links.
- `test/ms1.test.ts:231` through `test/ms1.test.ts:238` proves registry-rejected unsupported params return zero public artifacts.
- `test/ms1.test.ts:467` through `test/ms1.test.ts:477` covers unsupported params through link validation.

Assessment: registry validation is closed over the current MVP vocabulary. Unsupported registry-controlled identity, lens, id, or param input does not produce validated links and does not reach supported artifact production.

## Root Public API Findings

`src/index.ts:25` exports `scanMarkdown`; `src/index.ts:39` exports `loadRegistry` and `validateScanResult`; `src/index.ts:40` exports `resolveScanResult`. The root package does not export `validateContextLinks` or `resolveRepoPathLink`, and `package.json` exposes only the package root.

`src/pipeline/resolve.ts:15` defines `resolveScanResult(scanResult, registry, options)`. `src/pipeline/resolve.ts:20` calls `validateScanResult` before any resolver dispatch. `src/pipeline/resolve.ts:21` through `src/pipeline/resolve.ts:27` return a `markdown-context.resolve-result.v0` result with zero artifacts and an empty lockfile when validation is invalid. `src/pipeline/resolve.ts:38` dispatches only links returned from successful validation.

Regression anchors:

- `test/ms1.test.ts:203` through `test/ms1.test.ts:207` proves the root public API omits the raw repo/path resolver and exposes `resolveScanResult`.
- `test/ms1.test.ts:214` through `test/ms1.test.ts:221` proves scan-rejected duplicate params produce zero public artifacts.
- `test/ms1.test.ts:244` through `test/ms1.test.ts:263` proves mixed accepted plus registry-rejected input produces zero public artifacts.

Assessment: the prior BEL-1059 public raw-resolver gap is resolved for supported package consumers. Root API consumers have a safe public resolve path that validates the whole scan result before artifact production.

## CLI Findings

`src/cli/index.ts:24` through `src/cli/index.ts:31` wrap command execution and emit structured `markdown-context.cli-error.v0` JSON for thrown preflight/runtime failures. `src/cli/errors.ts:10` through `src/cli/errors.ts:17` build the CLI error body; `src/cli/options.ts:38` through `src/cli/options.ts:47` reject missing or unknown commands; `src/cli/options.ts:94` through `src/cli/options.ts:130` reject unsupported command-specific options and missing required value options.

`src/cli/index.ts:37` through `src/cli/index.ts:48` parse and validate command/options before reading the target Markdown file. `src/cli/index.ts:60` calls `validateScanResult`. `src/cli/index.ts:76` through `src/cli/index.ts:91` stop `resolve` before resolver dispatch when validation is invalid, returning zero artifacts, diagnostics, and an empty lockfile when requested. `src/cli/index.ts:115` through `src/cli/index.ts:123` return nonzero exits when output diagnostics contain an error.

Regression anchors:

- `test/cli.test.ts:707` through `test/cli.test.ts:727` proves validation-rejected links produce zero lockfile records.
- `test/cli.test.ts:729` through `test/cli.test.ts:760` proves validation diagnostics stay visible when lockfile output cannot be written.
- `test/cli.test.ts:767` through `test/cli.test.ts:803` proves mixed valid plus rejected inputs produce zero artifacts and zero lockfile records.
- `test/ms1.test.ts:649` through `test/ms1.test.ts:688` proves CLI `validate` and `resolve` propagate duplicate-param diagnostics and zero artifacts.

Assessment: CLI failed preflight is detectable through nonzero exit code and machine-readable diagnostics. CLI rejected-input resolve behavior is fail-closed for artifacts and lockfile records.

## Resolver-Local Findings

`src/resolvers/repo-path.ts:24` defines the internal repo/path resolver. Unsupported resolver identity is diagnosed and skipped at `src/resolvers/repo-path.ts:32` through `src/resolvers/repo-path.ts:42`. Unsupported repo/path selected lenses are diagnosed and skipped at `src/resolvers/repo-path.ts:44` through `src/resolvers/repo-path.ts:53`. Source read diagnostics are appended and skipped at `src/resolvers/repo-path.ts:55` through `src/resolvers/repo-path.ts:59`. Artifact append occurs only after these checks at `src/resolvers/repo-path.ts:65` through `src/resolvers/repo-path.ts:69`.

`src/resolvers/repo-path/source.ts:22` defines source reads. Missing or unreadable files become `ctx.repoPath.unresolved` at `src/resolvers/repo-path/source.ts:39` through `src/resolvers/repo-path/source.ts:43` and `src/resolvers/repo-path/source.ts:56` through `src/resolvers/repo-path/source.ts:67`. Realpath containment failures become `ctx.repoPath.outsideRoot` at `src/resolvers/repo-path/source.ts:88` through `src/resolvers/repo-path/source.ts:108`.

`src/resolvers/repo-path/artifact.ts:6` caps excerpt output at 4096 bytes. `src/resolvers/repo-path/artifact.ts:29` and `src/resolvers/repo-path/artifact.ts:30` mark emitted content as untrusted source data, preserving the source-data boundary for accepted links.

Regression anchors:

- `test/repo-path.test.ts:297` through `test/repo-path.test.ts:313` proves symlink escapes produce `ctx.repoPath.outsideRoot` and zero artifacts.
- `test/repo-path.test.ts:320` through `test/repo-path.test.ts:333` proves lexical parent traversal produces `ctx.repoPath.outsideRoot` and zero artifacts.
- `test/ms1.test.ts:697` through `test/ms1.test.ts:725` proves missing files through CLI resolve produce `ctx.repoPath.unresolved` and zero artifacts.

Assessment: resolver-local rejection paths do not emit artifacts. Accepted links remain bounded and labeled as source data, but unsupported deep imports remain outside the approved public package contract.

## Mixed Valid And Invalid Input Classification

Classification: acceptable release behavior.

Mixed valid and invalid input fails closed at whole-result validation boundaries for supported root public API and CLI resolve paths. The current behavior is intentionally conservative: when any scan or validation error is present, supported `resolveScanResult` and CLI `resolve` return zero artifacts and zero lockfile records, even if another link in the same document would otherwise be valid.

Evidence:

- Manual probe `mixed-valid-invalid`: CLI `exitCode: 1`, `ctx.param.unsupported`, `artifactCount: 0`, `lockfileRecordCount: 0`.
- Manual probe `mixed-valid-invalid`: root public API `scanLinkCount: 2`, `ctx.param.unsupported`, `artifactCount: 0`, `lockfileRecordCount: 0`.
- `test/ms1.test.ts:244` through `test/ms1.test.ts:263` covers mixed input through the root public API.
- `test/cli.test.ts:767` through `test/cli.test.ts:803` covers mixed input through CLI resolve.

Release impact: non-blocking. This behavior avoids partial consumption from mixed rejected input and is suitable for release.

## Release Risk Classification

| Risk or gap | Classification | Approval impact | Notes |
| --- | --- | --- | --- |
| Unsupported deep imports of internal resolver helpers | out-of-scope | non-blocking | `package.json` exposes only `"."`; root exports omit `resolveRepoPathLink`. BEL-1187 approval does not approve deep imports. |
| Additional negative fixtures beyond the required traces | follow-up | non-blocking | Current tests and manual probes cover the release-critical rejected paths named by BEL-1187. |
| Incomplete URL branch direct automated coverage | follow-up | non-blocking | BEL-1180 already classified this as non-blocking; parser source and probe evidence cover the branch. |
| Broad in-root read policy, full-source read, and check-then-read containment | accepted sibling-track risk | non-blocking inside BEL-1187 | Classified by BEL-1183 under the stable-worktree trust model; current fail-closed probes do not change that status. |

## Final BEL-1187 Classification

BEL-1187 is complete for the stated review boundary.

Approval means fail-closed behavior is release-ready for supported scan, validate, resolve, CLI, and root API paths. Approval does not approve unsupported deep imports, package publication, release tagging, or future feature scope.

## Follow-up / Non-Blocking Work

- Add a focused parser regression for incomplete `ctx://` URLs if later reviewers require direct branch-level coverage.
- Keep lower-level resolver helpers out of the package root unless future runtime provenance is added.
- Carry BEL-1183 follow-ups for path policy, source-size limits, and check-then-read hardening before broader untrusted Markdown claims.
