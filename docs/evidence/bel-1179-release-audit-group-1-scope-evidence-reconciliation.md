# BEL-1179 Release Audit Group 1: Scope and Evidence Reconciliation

Issue: `BEL-1179`

Captured: 2026-05-22 13:18 CDT

Worktree: `/Users/jasonbelmonti/Documents/Development/markdown-context/.worktrees/bel-1179`

Branch: `codex/bel-1179-scope-evidence-reconciliation`

Source revision under audit: `75cd5c38f0dc5f3c3f1afa592e0a211500952c42`

## Objective

Verify that the release-readiness audit baseline is grounded in the current `markdown-context` source tree, completed read-side MVP scope, and current command/package evidence rather than stale branch-captured claims.

This artifact establishes the current-source baseline for downstream audit groups. It does not approve the release, publish the package, tag the repository, or fix code/documentation defects.

## Source Authority

| Source | Status | Controls |
| --- | --- | --- |
| Linear `BEL-1179` | loaded | Defines this audit group's objective, scope, success criteria, review boundary, and required evidence. |
| Linear `BEL-1178` | loaded | Parent release-readiness audit program; prohibits publication, tagging, release approval, and code fixes inside this audit track. |
| `docs/design/markdown-context-operational-design-spec.md` | loaded | Design authority for the read-side MVP and deferred mission/write-side/MCP/live-connector scope. |
| `docs/execution/markdown-context-read-side-mvp-execution-spec.md` | loaded | Execution authority for `scan`, `validate`, offline `repo/path` `resolve`, lockfile evidence, and validation gates. |
| `docs/evidence/**` | loaded | Historical and current evidence corpus reconciled below. |
| `package.json` | loaded | Package identity, bin surface, scripts, dependency boundary, and packaging allowlist. |
| Current source tree on `75cd5c38f0dc5f3c3f1afa592e0a211500952c42` | loaded | Current implementation state under audit. |

## Current Release Target

Command:

```bash
git status --short --branch
git rev-parse HEAD
git log -1 --pretty=fuller --decorate=short
```

Observed result before this evidence file was authored:

```text
## codex/bel-1179-scope-evidence-reconciliation...origin/main
?? .codex/
75cd5c38f0dc5f3c3f1afa592e0a211500952c42
commit 75cd5c38f0dc5f3c3f1afa592e0a211500952c42 (HEAD -> codex/bel-1179-scope-evidence-reconciliation, origin/main, origin/HEAD)
Merge: 36a0a9f c532a62
Author:     Jason Belmonti <jasonbelmonti@gmail.com>
AuthorDate: Fri May 22 12:58:58 2026 -0500
Commit:     GitHub <noreply@github.com>
CommitDate: Fri May 22 12:58:58 2026 -0500

    Merge pull request #28 from jasonbelmonti/codex/add-readme-user-guide

    [codex] Add project site link to README
```

Interpretation:

- The release baseline under audit is `origin/main` commit `75cd5c38f0dc5f3c3f1afa592e0a211500952c42`.
- Local `.codex/` files are execution/review artifacts created for this audit and are not part of the package release target.
- This PR's intended tracked change is this BEL-1179 evidence artifact.

## Command Evidence

### `npm test`

Command:

```bash
node --version
npm --version
npm test
```

Observed result:

```text
v22.20.0
11.13.0

> @jasonbelmonti/markdown-context@0.1.0 test
> npm run build && vitest run "--exclude=.worktrees/**"

> @jasonbelmonti/markdown-context@0.1.0 build
> tsc -p tsconfig.json

 RUN  v3.2.4 /Users/jasonbelmonti/Documents/Development/markdown-context/.worktrees/bel-1179

 ✓ test/source-path.test.ts (5 tests) 6ms
 ✓ test/lockfile.test.ts (10 tests) 6ms
 ✓ test/wp2.test.ts (13 tests) 15ms
 ✓ test/repo-path.test.ts (14 tests) 58ms
 ✓ test/ms1.test.ts (34 tests) 594ms
 ✓ test/cli.test.ts (23 tests) 3847ms

 Test Files  6 passed (6)
      Tests  99 passed (99)
   Start at  13:18:12
   Duration  4.48s
```

Result: pass.

### `npm pack --dry-run --json`

Command:

```bash
npm pack --dry-run --json
```

Observed top-level package result:

```json
[
  {
    "id": "@jasonbelmonti/markdown-context@0.1.0",
    "name": "@jasonbelmonti/markdown-context",
    "version": "0.1.0",
    "size": 16879,
    "unpackedSize": 70207,
    "shasum": "5ef44221cb7ad15582af767d66b50ce884105112",
    "integrity": "sha512-ouDVQi1Nx30DYhbiRk0sm7F16ksfoBkojMbuVlW6KFYEkNEFTsNr1O79zwJQ7bIDZeHWKkQ6En+fYTh3b4DRmQ==",
    "filename": "jasonbelmonti-markdown-context-0.1.0.tgz",
    "entryCount": 68,
    "bundled": []
  }
]
```

Package file-surface summary from the JSON output:

| Included path group | Evidence |
| --- | --- |
| `README.md` | present |
| `package.json` | present |
| `dist/cli/**` | present |
| `dist/core/**` | present |
| `dist/index.*` | present |
| `dist/lockfile/**` | present |
| `dist/pipeline/**` | present |
| `dist/registry/**` | present |
| `dist/resolvers/**` | present |
| `src/**`, `test/**`, `fixtures/**`, `docs/**`, `site/**`, `.codex/**` | absent from the dry-run package file list |

Result: pass. The package artifact under audit is the dry-run tarball `jasonbelmonti-markdown-context-0.1.0.tgz` containing compiled runtime files, `README.md`, and `package.json`.

## Runtime Scope Confirmation

Approved runtime scope from the design and execution specs:

- CLI commands: `scan`, `validate`, `resolve`.
- Resolver scope: offline local `ctx://repo/path/...` resolution.
- Package support: deterministic artifacts and lockfiles.

Current command surface evidence:

```text
src/cli/options.ts:7:export type CliCommand = "scan" | "validate" | "resolve";
src/cli/options.ts:11:const COMMANDS = new Set<CliCommand>(["scan", "validate", "resolve"]);
src/cli/options.ts:114:    "  markdown-context scan <markdown-file> [--pretty]",
src/cli/options.ts:115:    "  markdown-context validate <markdown-file> --registry <registry.json> [--pretty]",
src/cli/options.ts:116:    "  markdown-context resolve <markdown-file> --registry <registry.json> [--repo-root <path>] [--lockfile] [--lockfile-out <path>] [--pretty]",
package.json:7:    "markdown-context": "dist/cli/index.js"
```

Deferred command and connector inspection:

```bash
rg -n "\b(mission|suggest-links|insert-link|mcp|protocol|handler|connector|node:https|node:http|fetch\(|http://|https://|npm publish|prepublishOnly|publishConfig)\b" src test package.json
```

Observed result:

```text
src/core/context-url.ts:29:  const scheme = url.protocol.replace(/:$/, "").toLowerCase();
```

Additional network/process inspection:

```bash
rg -n "\b(fetch|node:http|node:https|http://|https://|mcp|connector|protocol handler|OS handler|open\(|exec\(|spawn\()\b" src test package.json
```

Observed result: no matches.

Scope judgment:

- No `mission`, `suggest-links`, or `insert-link` command implementation is present in `src`, `test`, or `package.json`.
- No MCP runtime, live connector SDK, HTTP module import, `fetch`, network URL, OS handler, process spawn, package publication script, `prepublishOnly`, or `publishConfig` implementation is present in `src`, `test`, or `package.json`.
- The only broad deferred-scope term match is inert URL parsing via `url.protocol` while normalizing context-link schemes.
- Current runtime remains inside approved MVP scope.

## Existing Evidence Reconciliation

| Evidence | Current-state classification | Release impact | Notes |
| --- | --- | --- | --- |
| `docs/evidence/bel-1048-ms-2.md` | intentionally historical milestone evidence | non-blocking | Records WP-2 scan and validation coverage from 2026-05-18. Current `npm test` confirms the covered tests still pass on `75cd5c38f0dc5f3c3f1afa592e0a211500952c42`. |
| `docs/evidence/bel-1049-ms-1.md` | intentionally historical milestone evidence | non-blocking | Records WP-1 critical path. Current tests and source inspection supersede old command timing but do not contradict the scope claim. |
| `docs/evidence/bel-1050-lockfile-determinism.md` | current release evidence | non-blocking | Provides current EVD-5 lockfile determinism proof and is consistent with current `test/lockfile.test.ts`, `test/cli.test.ts`, and package surface. |
| `docs/evidence/bel-1051-agent-preflight.md` | branch-captured historical evidence | non-blocking | Captured branch `codex/bel-1051-agent-preflight-handoff` at `456a0328f617fba6489a9e42eb370513bb105953`. Use for historical EVD-6 context, but use this BEL-1179 artifact for current branch/commit/package baseline. |
| `docs/evidence/bel-1051-ms-3-handoff.md` | branch-captured historical evidence with current scope claims | non-blocking | Branch/revision fields are historical. Deferred-scope and lockfile availability claims are consistent with current source inspection. |
| `docs/evidence/bel-1053-audit-group-1.md` through `docs/evidence/bel-1057-audit-group-5.md` | historical audit group evidence | non-blocking | These artifacts include earlier "accept and fix" findings. Current tests and later evidence show their tracked fixes are incorporated into the current baseline. |
| `docs/evidence/bel-1058-audit-group-6.md` | partially stale historical audit evidence | non-blocking after this reconciliation | Its F-5 classification says lockfile and registry-hash evidence remained deferred for the foundation at that time. That claim is superseded by `docs/evidence/bel-1050-lockfile-determinism.md` and current tests. Downstream release review should not cite BEL-1058 F-5 as a current gap. |
| `docs/evidence/bel-1059-fail-closed-audit.md` | resolved historical blocker | non-blocking after this reconciliation | It rejected full fail-closed approval until public resolver provenance was hardened. `docs/evidence/bel-1062-public-api-misuse-resistance.md` records the hardening patch and current tests pass. |
| `docs/evidence/bel-1060-determinism-audit.md` | partially stale historical audit evidence | non-blocking after this reconciliation | It states lockfile output and registry-hash proof were deferred because the implementation did not emit lockfiles. Current source and `docs/evidence/bel-1050-lockfile-determinism.md` supersede that claim. |
| `docs/evidence/bel-1061-security-source-content-boundary-audit.md` | current risk-classification evidence with follow-up | non-blocking | Records three residual security/source-boundary follow-ups. They remain broader hardening work unless another audit group determines the current release boundary makes them blocking. |
| `docs/evidence/bel-1062-public-api-misuse-resistance.md` | current release evidence | non-blocking | Resolves the BEL-1059 public API blocker by exposing `resolveScanResult` and withholding the raw repo/path resolver from the root package export. |
| `docs/evidence/bel-1063-mvp-scope-control.md` | branch-captured scope-control evidence, superseded for branch/commit baseline | non-blocking after this reconciliation | Captured branch `codex/bel-1063-scope-control` at `1d538cb324c6ee863da0ab585b5c0ba8b220e6c5`. Its scope-control conclusion is confirmed by current BEL-1179 `rg` inspection, but its branch/revision should not be treated as the current release target. |

## Missing Or Stale Evidence Classification

| Item | Classification | Release impact | Required downstream handling |
| --- | --- | --- | --- |
| Current branch/commit/package baseline was not previously captured after PR #28. | missing evidence, now filled by this artifact | non-blocking after this artifact lands | Downstream audit groups should cite BEL-1179 for the current release target. |
| Older branch/revision fields in BEL-1051 and BEL-1063 evidence do not match `75cd5c38f0dc5f3c3f1afa592e0a211500952c42`. | intentionally historical | non-blocking | Treat those artifacts as milestone evidence, not as current release-target identity. |
| BEL-1058 and BEL-1060 state lockfile/registry-hash proof was deferred. | stale claim | non-blocking after this reconciliation | Treat as superseded by BEL-1050/BEL-1082 lockfile determinism evidence and current tests. |
| No final release-readiness synthesis exists in this artifact. | out of scope | non-blocking | Parent `BEL-1178` owns final synthesis after all child tracks complete. |
| Residual hardening items from BEL-1061 remain open follow-up candidates. | accepted risk/follow-up | non-blocking for Group 1 baseline | Downstream security/source-boundary review may promote any item to blocker only with current-source evidence inside its review boundary. |

No release-blocking stale evidence was found inside BEL-1179's review boundary after current command evidence and supersession rules are applied.

## Audit Verdict

Recommendation: accept the Group 1 baseline.

The current release audit should use `75cd5c38f0dc5f3c3f1afa592e0a211500952c42` as the source revision under audit until a newer branch/commit is intentionally selected. The current runtime and package evidence remain inside the approved read-side MVP boundary: `scan`, `validate`, offline `repo/path` `resolve`, deterministic artifacts, and lockfile support. Deferred mission/write-side/MCP/live-connector/network-backed behavior is absent from the current runtime surface.

Approval of this artifact means the release audit has a trustworthy current-state baseline. It does not approve release publication, tag creation, package publication, or downstream functional/security findings.

## Follow-up / Non-Blocking Work

- Use this artifact as the source-target baseline for downstream BEL-1178 child audit tracks.
- Do not cite BEL-1058 or BEL-1060 lockfile-deferred language as current release evidence without also citing the superseding BEL-1050/BEL-1082 determinism artifact.
- Keep BEL-1061 residual hardening items available for downstream review, but do not treat them as BEL-1179 blockers without a current-source release-boundary finding.
