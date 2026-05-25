# BEL-1185 Release Audit Track: Security And Inert-Data Boundaries

Issue: `BEL-1185`

Captured: 2026-05-25 07:47 CDT

Worktree: `/Users/jasonbelmonti/Documents/Development/markdown-context/.worktrees/bel-1185`

Branch: `codex/bel-1185-security-inert-data-boundaries`

Source revision under audit: `ac5e62b5c315b318fd97ea027dee5d91a7217af0`

## Verdict

APPROVE for the BEL-1185 security and inert-data release-audit boundary under the current first-release trust model: local CLI or library execution against a stable caller-selected `repoRoot`, no live connector runtime, and no future untrusted Markdown guarantee beyond the stated model.

The current release candidate preserves the security boundaries required for the read-side MVP:

- `ctx://` links are parsed as inert Markdown link data, not executed.
- malformed, duplicate, prompt-like, unsupported, and registry-rejected inputs fail closed before artifact emission through the scanner, validator, public API, and CLI paths;
- resolver source text is emitted only as bounded source data with `sourceTrust: "untrusted-source-data"` and `sourceContentBoundary: "source-data"`;
- current source contains no MCP, OS handler, browser automation, live connector, `fetch`, HTTP, HTTPS, network, WebSocket, or network-backed resolver path;
- repo/path containment prevents parent traversal and symlink escapes in stable worktrees.

Three residual risks are accepted follow-up items, not release blockers inside this boundary:

- valid in-root `repo/path` links can read any in-root file accepted by the registry resource;
- the resolver reads, normalizes, and hashes the full source file before excerpt bounding;
- containment uses check-then-read filesystem operations and assumes the repository tree is stable while resolution runs.

Approval of this artifact does not approve future untrusted Markdown operation, future network/live connector resolvers, MCP adapters, OS protocol handlers, browser automation, package publication, release tagging, GitHub Release creation, or npm dist-tag mutation.

## Source Authority

| Source | Status | Controls |
| --- | --- | --- |
| Linear `BEL-1185` | loaded | Defines this cross-cutting security audit objective, success criteria, evidence expectations, review boundary, and follow-up policy. |
| Linear `BEL-1178` | indirectly loaded through dependent release-audit evidence | Parent release-readiness audit program and non-release-mutation constraint. |
| `docs/evidence/bel-1061-security-source-content-boundary-audit.md` | reviewed | Prior security baseline and residual-risk map for path containment, source-size behavior, and source-data boundaries. |
| `docs/evidence/bel-1180-release-audit-group-2-scanner-context-url-contract.md` | reviewed | Scanner and context URL parsing evidence. |
| `docs/evidence/bel-1181-registry-validation-fail-closed.md` | reviewed | Registry validation, prompt-like parameter rejection, and fail-closed resolver-entry evidence. |
| `docs/evidence/bel-1182-public-api-cli-operator-contract.md` | reviewed | Public API and CLI operator-boundary evidence. |
| `docs/evidence/bel-1183-release-audit-group-5-repo-path-resolver-source-safety.md` | reviewed | Repo/path resolver, source safety, artifact boundary, and residual-risk evidence. |
| `docs/evidence/bel-1184-release-audit-group-6-lockfile-determinism-package-artifact.md` | reviewed | Package and lockfile context where security claims depend on release artifact boundaries. |
| `docs/evidence/bel-1188-release-audit-track-package-documentation-release-controls.md` | reviewed | Documentation and package release-control context. |
| `docs/design/markdown-context-operational-design-spec.md` | reviewed | Design constraints: inert links, prompt firewall, source-data boundary, offline local resolver, no OS handlers, and no live connectors. |
| Current source under `src/core`, `src/registry`, `src/cli`, `src/pipeline`, and `src/resolvers` | reviewed | Current implementation evidence for the final release-audit verdict. |
| Current tests under `test/**` and fixtures under `fixtures/**` | reviewed and run | Regression evidence for accepted and rejected boundary behavior. |

## Current Release Target

Commands:

```bash
git status --short --branch
git rev-parse HEAD
```

Observed result:

```text
## codex/bel-1185-security-inert-data-boundaries...origin/main
ac5e62b5c315b318fd97ea027dee5d91a7217af0
```

Interpretation:

- The audit target is `origin/main` commit `ac5e62b5c315b318fd97ea027dee5d91a7217af0`.
- Local `.codex/**` files are execution artifacts for this audit.
- This PR's intended product change is this BEL-1185 evidence artifact.

## Dependent Evidence Map

| Dependency | Security claim used by BEL-1185 | Current classification |
| --- | --- | --- |
| `BEL-1180` scanner/context URL | Scanner uses `markdown-engine` link references, preserves source ranges, rejects malformed/incomplete URLs and duplicate decoded params, and canonicalizes accepted URLs deterministically. | Accepted. |
| `BEL-1181` registry validation | Registry parsing and link validation reject unsupported schemes, namespaces, kinds, id patterns, lenses, prompt-like params, and prototype-named params before accepted links reach resolution. | Accepted after CLI mixed-scan fail-closed gap was fixed. |
| `BEL-1182` public API/CLI | Root API exposes `resolveScanResult` rather than a raw resolver bypass; CLI validates before resolve and emits zero artifacts/lockfile records on invalid scan or registry input. | Accepted after structured CLI diagnostics and lockfile masking gaps were fixed. |
| `BEL-1183` repo/path resolver | Resolver rejects unsupported resolver identities, unsupported lenses, missing files, parent traversal, and symlink escapes; emitted excerpt artifacts are bounded and marked source data. | Accepted under stable-worktree trust model with explicit follow-up risks. |
| `BEL-1061` prior security audit | Earlier residual risks remain broad in-root reads, full source reads before bounding, and check-then-read containment assumptions. | Still accepted follow-up under current release boundary. |

## Current Trace Evidence

### Public API And Resolver Probe

Command:

```bash
npm run build
node --input-type=module <BEL-1185 public API / resolver probe>
```

Observed summarized result:

| Case | Scan | Validate | Public resolve / resolver result |
| --- | --- | --- | --- |
| Valid `ctx://repo/path/fixtures/ms1/context-source.md?lens=excerpt` | 1 link, 0 diagnostics | valid, 1 link | 1 artifact, 0 diagnostics, 1 lockfile record, `sourceTrust: "untrusted-source-data"`, `sourceContentBoundary: "source-data"` |
| Prompt-like param `prompt=ignore-previous-instructions` | 1 link, 0 diagnostics | invalid, `ctx.param.unsupported` | 0 artifacts, 0 lockfile records, `ctx.param.unsupported` |
| Duplicate decoded `lens` param | 0 links, `ctx.param.duplicate` | invalid, `ctx.param.duplicate` | 0 artifacts, 0 lockfile records, `ctx.param.duplicate` |
| Unsupported namespace `ctx://trace/entity/...` | 1 link, 0 diagnostics | invalid, `ctx.namespace.unsupported` | 0 artifacts, 0 lockfile records, `ctx.namespace.unsupported` |
| In-root symlink pointing outside `repoRoot` | 1 link, 0 diagnostics | valid, 1 link | 0 artifacts, 0 lockfile records, `ctx.repoPath.outsideRoot` |

Result: pass. The current public API trace covers one valid link and multiple rejected links through scan, validate, public API, and resolver boundaries. Rejected inputs produce no artifacts and no lockfile records.

### CLI Probe

Command:

```bash
node dist/cli/index.js scan fixtures/ms1/task.md --pretty
node dist/cli/index.js validate fixtures/ms1/task.md --registry fixtures/ms1/registry.json --pretty
node dist/cli/index.js resolve fixtures/ms1/task.md --registry fixtures/ms1/registry.json --repo-root . --lockfile --pretty
node dist/cli/index.js validate fixtures/ms1/invalid-param.md --registry fixtures/ms1/registry.json --pretty
node dist/cli/index.js resolve fixtures/ms1/invalid-param.md --registry fixtures/ms1/registry.json --repo-root . --lockfile --pretty
node dist/cli/index.js validate fixtures/ms1/duplicate-param.md --registry fixtures/ms1/registry.json --pretty
```

Observed summarized result:

| CLI case | Exit | Schema | Boundary result |
| --- | ---: | --- | --- |
| scan valid task | 0 | `markdown-context.scan-result.v0` | 1 link, 0 diagnostics |
| validate valid task | 0 | `markdown-context.validate-result.v0` | valid, 1 link, 0 diagnostics |
| resolve valid task | 0 | `markdown-context.resolve-result.v0` | 1 artifact, 1 lockfile record, 0 diagnostics |
| validate prompt param | 1 | `markdown-context.validate-result.v0` | invalid, 0 links, `ctx.param.unsupported` |
| resolve prompt param | 1 | `markdown-context.resolve-result.v0` | 0 artifacts, 0 lockfile records, `ctx.param.unsupported` |
| validate duplicate decoded lens | 1 | `markdown-context.validate-result.v0` | invalid, 0 links, `ctx.param.duplicate` |

Result: pass. The CLI maintains the same inert-data and fail-closed boundary as the public API.

## Boundary Findings

### Scanner And Context URL Boundary

Status: accepted.

Source references:

- `src/core/scan.ts:20` through `src/core/scan.ts:26` parse Markdown through `markdown-engine`, normalize it, and iterate `documentQueries.linkReferences`.
- `src/core/scan.ts:26` through `src/core/scan.ts:29` only inspects URL-bearing references whose URL begins with `ctx:`.
- `src/core/scan.ts:42` through `src/core/scan.ts:46` records context URL diagnostics and skips any parsed result that has error diagnostics.
- `src/core/context-url.ts:19` through `src/core/context-url.ts:27` convert invalid URL construction into `ctx.url.invalid`.
- `src/core/context-url.ts:36` through `src/core/context-url.ts:47` fail malformed percent-decoded path segments as `ctx.url.invalid`.
- `src/core/context-url.ts:68` through `src/core/context-url.ts:87` preserve query params as data and report duplicate decoded params.

Security judgment:

- The scanner treats Markdown links as data and does not dispatch handlers, tools, network, browser automation, or connector calls.
- Malformed path escapes and duplicate decoded params are rejected before validation and cannot reach resolution.

### Registry Validation And Prompt-Like Params

Status: accepted.

Source references:

- `src/registry/validate.ts:56` through `src/registry/validate.ts:64` fail closed when scanner diagnostics already contain errors.
- `src/registry/validate.ts:76` through `src/registry/validate.ts:88` reject all params outside the resource vocabulary.
- `src/registry/validate.ts:90` through `src/registry/validate.ts:105` reject unsupported id patterns and lenses.
- `src/registry/validate.ts:110` through `src/registry/validate.ts:153` reject unsupported scheme, namespace, and kind before a resource is accepted.
- `fixtures/ms1/registry.json:6` through `fixtures/ms1/registry.json:12` declare the current `repo/path` resource with only the `excerpt` lens and no non-lens params.
- `fixtures/wp2/registry.json:6` through `fixtures/wp2/registry.json:13` prove the broader registry model can declare an `idPattern`, controlled lenses, and a closed `section` param.

Test and probe coverage:

- `test/ms1.test.ts:462` through `test/ms1.test.ts:479` cover prompt-like param rejection.
- `test/ms1.test.ts:519` through `test/ms1.test.ts:532` cover prototype-named param visibility and rejection.
- `test/wp2.test.ts:94` through `test/wp2.test.ts:121` cover unsupported scheme, namespace, kind, id pattern, lens, and params.
- BEL-1185 probe confirms `prompt=ignore-previous-instructions` produces zero artifacts and zero lockfile records through public API and CLI paths.

Security judgment:

- Prompt-like and unsupported params remain inert URL data and fail validation before resolver dispatch.
- Registry id policy is available (`idPattern`) but not required by the MS-1 fixture; broad in-root reads remain an accepted follow-up risk under the current trust model.

### Public API And CLI Boundary

Status: accepted.

Source references:

- `src/pipeline/resolve.ts:15` through `src/pipeline/resolve.ts:28` run `validateScanResult` before public API resolver dispatch and return zero artifacts on invalid input.
- `src/pipeline/resolve.ts:38` through `src/pipeline/resolve.ts:49` dispatch only validated links and merge validation and resolver diagnostics.
- `src/cli/index.ts:37` through `src/cli/index.ts:48` parse command/options before reading the Markdown target and scan the file as data.
- `src/cli/index.ts:59` through `src/cli/index.ts:67` validate before CLI `validate` output.
- `src/cli/index.ts:70` through `src/cli/index.ts:92` make CLI `resolve` return zero artifacts and an empty lockfile when validation is invalid.
- `src/cli/index.ts:94` through `src/cli/index.ts:123` resolve only validated links and return non-zero when resolver or output diagnostics include errors.

Test and probe coverage:

- `test/ms1.test.ts:227` through `test/ms1.test.ts:267` cover public API registry-rejected and mixed valid plus invalid fail-closed behavior.
- `test/cli.test.ts:707` through `test/cli.test.ts:803` cover CLI validation-rejected and mixed valid plus invalid fail-closed behavior with lockfile records withheld.
- BEL-1185 CLI probe confirms valid task resolution emits one artifact/lockfile record, while prompt-param and duplicate-param inputs emit zero artifacts.

Security judgment:

- The supported public API and CLI do not expose an approval-relevant path where rejected scan or registry input can still produce artifacts.
- Handled CLI failures remain structured JSON diagnostics, which lets agents and CI treat non-zero output as a failed preflight rather than partial approval.

### Repo/path Resolver And Source-Data Boundary

Status: accepted under stable-worktree trust model.

Source references:

- `src/resolvers/repo-path.ts:32` through `src/resolvers/repo-path.ts:53` reject unsupported resolver identities and unsupported `repo/path` lenses before source reads.
- `src/resolvers/repo-path/source.ts:26` resolves every accepted link id through `resolveRealPathInsideRoot`.
- `src/resolvers/repo-path/source.ts:88` through `src/resolvers/repo-path/source.ts:108` realpath both repo root and candidate and rejects candidates outside the real root.
- `src/resolvers/repo-path/source.ts:40` through `src/resolvers/repo-path/source.ts:47` read, normalize, and hash the full source after containment succeeds.
- `src/resolvers/repo-path/artifact.ts:6` caps emitted excerpt content at 4096 UTF-8 bytes.
- `src/resolvers/repo-path/artifact.ts:15` through `src/resolvers/repo-path/artifact.ts:35` emit artifact schema, source identity, content hash, citations, `sourceTrust`, `sourceContentBoundary`, and Markdown content.
- `src/core/types.ts:63` through `src/core/types.ts:80` encode the public artifact contract, including trust and boundary fields.

Test and probe coverage:

- `test/repo-path.test.ts:227` through `test/repo-path.test.ts:247` cover large source excerpt truncation.
- `test/repo-path.test.ts:297` through `test/repo-path.test.ts:317` cover symlink escape rejection.
- `test/repo-path.test.ts:319` through `test/repo-path.test.ts:338` cover parent traversal rejection.
- `test/repo-path.test.ts:362` through `test/repo-path.test.ts:375` cover hostile source text remaining inside an untrusted source-data artifact boundary.
- BEL-1185 probe confirms an in-root symlink pointing outside `repoRoot` produces `ctx.repoPath.outsideRoot` with zero artifacts and zero lockfile records.

Security judgment:

- The resolver does not promote source text to instructions. Hostile source text can appear only inside bounded artifact content and is labeled as untrusted source data.
- Parent traversal and symlink escapes are blocked in stable worktrees.
- Broad in-root reads, full-source pre-bounding reads, and check-then-read containment remain accepted follow-up risks rather than blockers for the current release trust model.

## Excluded Runtime Surface Search

Commands:

```bash
rg -n "fetch\\(|WebSocket|XMLHttpRequest|node:http|node:https|node:net|child_process|execFile|spawn\\(|osascript|open\\(|MCP|mcp|browser|live connector|OS protocol|network-backed" src README.md docs/user-guide.md package.json
rg -n "from \\\"node:(http|https|net|child_process)\\\"|from 'node:(http|https|net|child_process)'|fetch\\(|WebSocket|XMLHttpRequest|undici|axios|got|puppeteer|playwright|mcp|MCP|osascript|open\\(" src package.json
```

Observed result:

```text
docs/user-guide.md:37:root. It does not use network calls, live connectors, browser automation, MCP,
docs/user-guide.md:38:or OS protocol handlers.
docs/user-guide.md:244:- deferred: mission aggregation, `suggest-links`, `insert-link`, MCP adapters,
docs/user-guide.md:245:  OS handlers, live connectors, network-backed resolvers, browser automation,
README.md:17:It does not implement mission aggregation, write-side commands, MCP transport,
README.md:18:OS protocol handlers, browser automation, live connectors, network-backed
```

The source/package-only search returned no matches.

Interpretation:

- Current runtime source and package metadata contain no HTTP/HTTPS/net imports, no `fetch`, no WebSocket/XHR client, no MCP runtime, no browser automation dependency, no OS handler dispatch, and no live connector path.
- Matches in README and user guide are explicit exclusions or deferred future scope.

## Accepted-Risk Table

| Risk | Classification | Approval impact | Evidence | Follow-up |
| --- | --- | --- | --- | --- |
| Valid `repo/path` links can read any in-root file accepted by the registry resource. | accepted risk | non-blocking for first release trust model | `src/registry/validate.ts:76` through `src/registry/validate.ts:105` validate resource identity, optional `idPattern`, lenses, and params; `fixtures/ms1/registry.json` intentionally has no `idPattern`; `src/resolvers/repo-path/source.ts:26` resolves the accepted id. | Add path allowlists, denied globs, source classes, or stronger default registry policy before claiming untrusted Markdown safety. |
| Resolver reads, normalizes, and hashes full source before excerpt bounding. | accepted risk | non-blocking for current bounded-output claim; resource hardening follow-up | `src/resolvers/repo-path/source.ts:40` through `src/resolvers/repo-path/source.ts:47` read and hash full source; `src/resolvers/repo-path/artifact.ts:38` through `src/resolvers/repo-path/artifact.ts:60` bound emitted content afterward. | Add source byte limits or streaming excerpt reads; decide how hashes behave above source limits. |
| Containment is check-then-read and assumes stable worktree. | accepted risk | non-blocking for stable local agent/CLI use; blocker only for concurrent-mutation safety claims | `src/resolvers/repo-path/source.ts:88` through `src/resolvers/repo-path/source.ts:108` realpath and validate candidate, then `src/resolvers/repo-path/source.ts:40` reads the path in a separate operation. | Harden with open/stat/read sequence or equivalent no-symlink-after-open strategy before claiming protection under concurrent local mutation. |

## Validation

### Execution Estimation

Command:

```bash
python3 /Users/jasonbelmonti/.codex/skills/execution-estimation/scripts/estimate_execution.py --repo-root /Users/jasonbelmonti/Documents/Development/markdown-context --proposed-files <proposed-files> --proposal-lines-changed 260
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

### Execution Brief

Command:

```bash
npx -y @jasonbelmonti/markdown-engine@2.0.0 validate --file ./.codex/execution-briefs/bel-1185/execution-brief.md --profile /Users/jasonbelmonti/.codex/skills/execution-brief/profiles/execution-brief.yaml
shasum -a 256 -c ./.codex/execution-briefs/bel-1185/execution-brief.sha256
```

Result: pass.

### Build, Typecheck, And Full Regression

Commands:

```bash
npm run build
npm run typecheck
npm test
```

Observed result:

```text
npm run build: pass
npm run typecheck: pass

Test Files  6 passed (6)
Tests       108 passed (108)
```

Result: pass.

## Final BEL-1185 Classification

No release-blocking security or inert-data boundary gap was found inside the BEL-1185 review boundary.

The release candidate is acceptable for the first-release trust model after this audit: local, deterministic read-side `ctx://repo/path` operation in a stable worktree with caller-controlled registry and repo root. The accepted risks above must remain explicit follow-up work before stronger claims about untrusted Markdown, source-size resilience, or concurrent filesystem mutation safety.
