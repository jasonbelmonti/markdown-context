# BEL-1178 Release Readiness Synthesis

Issue: `BEL-1178`

Captured: 2026-06-01 20:59 CDT

Worktree: `/Users/jasonbelmonti/Documents/Development/markdown-context/.worktrees/bel-1178-post-1207-reconciliation`

Branch: `codex/bel-1178-post-1207-reconciliation`

Source revision under audit: `8b89fe5e508d7aa71dc0f499a975f602ed3b6843`

## Verdict

APPROVE first-release readiness for `markdown-context` under the current read-side MVP release boundary.

This approval is limited to the shipped local, read-only `scan`, `validate`, and offline `repo/path` `resolve` workflow. It does not authorize package publication, release tagging, GitHub Release creation, npm dist-tag mutation, future mission/write-side/MCP scope, network-backed resolvers, or broad untrusted-Markdown safety claims outside the documented operator contract.

The previous landed BEL-1178 synthesis rejected release readiness because `BEL-1186`, `BEL-1187`, and `BEL-1189` were missing. Current `origin/main` now contains those evidence artifacts, Linear marks all required child tracks done, and the later repo/path hardening follow-ups for source policy, source-size limits, and concurrent-mutation containment have landed. No unresolved release blocker remains inside the BEL-1178 parent boundary.

## Source Authority

| Source | Status | Controls |
| --- | --- | --- |
| Linear `BEL-1178` | loaded | Defines parent objective, required child coverage, validation evidence, review boundary, and final synthesis requirement. |
| Linear `markdown-context Release Readiness Audit` project | loaded | Requires six functional audit groups, five cross-cutting tracks, and final release-readiness synthesis after evidence is captured. |
| Linear child issues under `BEL-1178` | loaded | Controls child issue completion status and dependency state. |
| Linear `BEL-1178` comments | loaded | Newer 2026-05-31 comment approves final readiness; older 2026-05-26 rejection is stale. |
| Linear `BEL-1205`, `BEL-1206`, `BEL-1207`, `BEL-1208` | loaded | Controls follow-up hardening status and remaining non-blocking work; this pass reconciles stale completed follow-up state. |
| `docs/evidence/**` at `origin/main` | reviewed | Local evidence authority for completed audit tracks and hardening evidence. |
| `README.md` and `docs/user-guide.md` | reviewed | Current operator contract for trusted Markdown, narrow repo-root selection, source policy, source-size limits, post-open containment validation, and source-data boundaries. |
| Current source tree at `8b89fe5e508d7aa71dc0f499a975f602ed3b6843` | validated | Current implementation state for command validation and package dry run. |

## Current Release Target

Commands:

```bash
date -u +%Y-%m-%dT%H:%M:%SZ
git rev-parse HEAD
git status --short --branch
node --version
npm --version
```

Observed result:

```text
2026-06-02T01:59:03Z
8b89fe5e508d7aa71dc0f499a975f602ed3b6843
## codex/bel-1178-post-1207-reconciliation...origin/main
 M docs/evidence/bel-1178-release-readiness-synthesis.md
 M docs/user-guide.md
v22.20.0
11.13.0
```

Interpretation:

- The synthesis target is current `origin/main` after PR #48 merged `BEL-1207`.
- The primary checkout remains untouched; this artifact was authored from a project-local worktree.
- This PR's intended product changes are this refreshed BEL-1178 evidence artifact and a small `docs/user-guide.md` wording reconciliation for `BEL-1208`.

## Child Issue And Evidence Inventory

### Functional Audit Groups

| Issue | Linear status | Evidence artifact | Parent synthesis classification |
| --- | --- | --- | --- |
| `BEL-1179` Scope and evidence reconciliation | Done | `docs/evidence/bel-1179-release-audit-group-1-scope-evidence-reconciliation.md` | Complete. Establishes current-source evidence baseline and audit scope. |
| `BEL-1180` Scanner and context URL contract | Done | `docs/evidence/bel-1180-release-audit-group-2-scanner-context-url-contract.md` | Complete. Approves scanner/context URL boundary. |
| `BEL-1181` Registry validation and fail-closed input policy | Done | `docs/evidence/bel-1181-registry-validation-fail-closed.md` | Complete. Approves registry validation boundary. |
| `BEL-1182` Public API, CLI, and operator contract | Done | `docs/evidence/bel-1182-public-api-cli-operator-contract.md` | Complete. Approves root API and CLI operator boundary. |
| `BEL-1183` Repo/path resolver and source safety | Done | `docs/evidence/bel-1183-release-audit-group-5-repo-path-resolver-source-safety.md` | Complete. Approves stable-worktree resolver/source-safety boundary and records follow-up hardening. |
| `BEL-1184` Lockfile, determinism, and package artifact | Done | `docs/evidence/bel-1184-release-audit-group-6-lockfile-determinism-package-artifact.md` | Complete after `BEL-1223` closure. Package artifact and lockfile boundary approved. |

### Cross-Cutting Review Tracks

| Issue | Linear status | Evidence artifact | Parent synthesis classification |
| --- | --- | --- | --- |
| `BEL-1185` Security and inert-data boundaries | Done | `docs/evidence/bel-1185-release-audit-security-inert-data-boundaries.md` | Complete. Approves security/inert-data boundary under stable local worktree trust model. |
| `BEL-1186` Determinism and reproducibility | Done | `docs/evidence/bel-1186-release-audit-track-determinism-reproducibility.md` | Complete. Approves deterministic current read-side, offline `repo/path` release boundary. |
| `BEL-1187` Fail-closed behavior across accepted paths | Done | `docs/evidence/bel-1187-release-audit-track-fail-closed-behavior.md` | Complete. Approves rejected-input fail-closed behavior across supported paths. |
| `BEL-1188` Package, documentation, and release controls | Done | `docs/evidence/bel-1188-release-audit-track-package-documentation-release-controls.md` | Complete. Approves package/docs/release-control boundary without performing publication. |
| `BEL-1189` Test value and regression detection | Done | `docs/evidence/bel-1189-release-audit-track-test-value-regression-detection.md` | Complete. Approves current test portfolio as high-value release regression coverage. |

### Closure And Hardening Follow-Up State

| Issue | Linear status | Evidence | Parent synthesis classification |
| --- | --- | --- | --- |
| `BEL-1223` MIT LICENSE artifact | Done | Top-level `LICENSE`; referenced by `BEL-1184`. | Complete. Clears original package metadata blocker. |
| `BEL-1205` repo/path source policy parent | Done | Child issues `BEL-1261`, `BEL-1262`, and `BEL-1263` are Done and landed through PRs #43, #44, and #45. | Complete. Parent issue state reconciled after child completion. |
| `BEL-1206` repo/path source-size limit | Done | PR #46 merged; `README.md`, `docs/user-guide.md`, `src/resolvers/repo-path/source.ts`, and tests include the fixed source-size policy. | Complete. Retires the previous full-source resource-hardening follow-up for stable files above 1048576 bytes. |
| `BEL-1207` concurrent mutation containment | Done | PR #48 merged; `README.md`, `docs/user-guide.md`, `src/resolvers/repo-path/source.ts`, and `test/repo-path.test.ts` include post-open containment validation and deterministic mutation coverage. | Complete. Retires the previous stable-worktree-only containment follow-up for local symlink or directory-replacement races. |
| `BEL-1208` trusted Markdown/repo-root docs | Done | `docs/user-guide.md` now tells operators to resolve only Markdown whose `repo/path` ids they are willing to read from the selected root, choose the narrowest practical `--repo-root`, and use `sourcePolicy` for untrusted Markdown. | Complete. Operator contract is explicit without claiming broad untrusted-Markdown or OS-sandbox safety. |

## Current Controls

- Scanner and context URL parsing canonicalize and source-locate supported `ctx://` links.
- Registry validation is fail-closed for unsupported resources, lenses, params, duplicate params, malformed URLs, and source-policy rejection.
- Root public API exposes the safe scan -> validate -> resolve path through `resolveScanResult`.
- CLI commands emit structured diagnostics and stop before resolution on validation failures.
- `repo/path` resolver rejects unsupported lenses before source read or artifact rendering.
- Repo-root containment rejects missing paths, parent traversal, and symlink escapes in stable worktrees.
- Optional registry `sourcePolicy` constrains `repo/path` ids before resolver reads.
- `repo/path` source files larger than 1048576 bytes are rejected before full read and hash with `ctx.repoPath.sourceTooLarge`.
- `repo/path` source reads use post-open containment validation before trusting source bytes; local symlink or directory-replacement mutation outside `repoRoot` produces a resolver diagnostic and no artifact or lockfile record.
- Emitted excerpt artifacts remain capped at 4096 UTF-8 bytes, cited, normalized, and marked as `untrusted-source-data` / `source-data`.
- Lockfile provenance records registry identity/hash, source identity/hash, artifact hash/path, `excerptMaxBytes`, and `sourceMaxBytes`.
- Release controls contain no publication, tag, GitHub Release, or npm dist-tag mutation path.

## Accepted Risks And Follow-Up

| Risk or follow-up | Current status | Approval impact | Required before stronger claim |
| --- | --- | --- | --- |
| Broad in-root reads when no `sourcePolicy` is configured | Mitigated by optional sourcePolicy and docs, but no-policy trusted-local behavior remains intentionally compatible. | Non-blocking because docs require operator-controlled Markdown/root selection or policy configuration. | Require sourcePolicy or richer controls before broad untrusted-Markdown claims. |
| Hard-link aliases, concurrent writes to the same opened file, and general OS sandboxing | Explicitly outside the `BEL-1207` implementation boundary and documented in README/user guide. | Non-blocking for current local read-side MVP release boundary. | Add separate hardening only before making broader filesystem isolation or snapshot-consistency claims. |
| Dependency lockfile policy is undocumented | Still accepted release-process follow-up from `BEL-1184`, `BEL-1186`, and `BEL-1188`. | Non-blocking for package artifact governed by `package.json`. | Document policy before stronger source-build reproducibility claims. |
| `package.json` lacks `repository`, `homepage`, and `bugs` metadata | Still metadata polish follow-up. | Non-blocking for install, bin, root import, and safe basic usage. | Add metadata before broader npm registry discoverability polish. |
| `docs/**` excluded from packed tarball | Still docs-packaging follow-up. | Non-blocking because packed README links docs and contains safe usage guidance. | Decide whether docs remain website/repository-only before external docs packaging review. |
| Package smoke automation | Manual pack/install smoke evidence exists in audit artifacts. | Non-blocking. | Automate packed tarball install/bin/root import smoke if release cadence requires it. |
| Large mixed-responsibility test files | Current suite is high-value and release-critical behavior is covered. | Non-blocking maintainability follow-up. | Split `test/ms1.test.ts` and `test/cli.test.ts` during the next meaningful test-editing pass. |

## Validation

### Execution Estimation

Command:

```bash
python3 /Users/jasonbelmonti/.codex/skill-checkouts/execution-estimation/scripts/estimate_execution.py \
  --repo-root /Users/jasonbelmonti/Documents/Development/markdown-context/.worktrees/bel-1178-post-1207-reconciliation \
  --base-ref origin/main \
  --head-ref HEAD \
  --include-working-tree
```

Observed summary:

```text
schemaVersion: execution-estimation.v5
mode: diff
execution.action: proceed
planning.blocksExecution: false
estimation.decompositionRecommended: false
risk.blastRadius.lowImpactOnly: true
risk.blastRadius.level: low
change.filesTouched: 2
change.linesChanged: 54
```

Result: pass. No decomposition or blocking planning gate applied.

### Typecheck

Command:

```bash
npm run typecheck
```

Observed result:

```text
> @jasonbelmonti/markdown-context@0.1.0 typecheck
> tsc -p tsconfig.json --noEmit
```

Result: pass.

### Full Regression

Command:

```bash
npm test
```

Observed result:

```text
Test Files  6 passed (6)
Tests       131 passed (131)

test/source-path.test.ts 5 tests passed
test/lockfile.test.ts 12 tests passed
test/wp2.test.ts 26 tests passed
test/repo-path.test.ts 18 tests passed
test/ms1.test.ts 43 tests passed
test/cli.test.ts 27 tests passed
```

Result: pass.

### Package Dry Run

Command:

```bash
npm pack --dry-run --json
```

Observed result:

```text
filename: jasonbelmonti-markdown-context-0.1.0.tgz
size: 21974
unpackedSize: 90568
entryCount: 78
shasum: cf6f0d84eb5e5f059afee1ca06fcbb55116d65ae
integrity: sha512-zqIT6Xwl4Oj1gD5YmHyICj927Wbn0CyytyEaSybPefAXrOSTjmKy0adL70dJu8eZJJ5kf+ccsw1v16CSnah1Pg==
```

Result: pass. The package dry run built the current `dist/**` output and did not perform publication.

### Diff Hygiene

Command:

```bash
git diff --check
```

Observed result:

```text
no whitespace errors
```

Result: pass.

## Release-Control Statement

No package publication, release tag, GitHub Release, npm dist-tag mutation, external adoption claim, implementation hardening, or future-scope approval was performed as part of this synthesis.

Publication or tagging still requires a separate explicit release operation and any release-owner checks outside this evidence artifact.

## Final BEL-1178 Classification

The `markdown-context` read-side MVP is release-ready at the BEL-1178 audit boundary:

- all required functional audit groups exist, are Done, and have local evidence artifacts;
- all required cross-cutting review tracks exist, are Done, and have local evidence artifacts;
- the original missing LICENSE blocker is closed;
- current source validation, full regression, and package dry run pass on `origin/main@8b89fe5e508d7aa71dc0f499a975f602ed3b6843`;
- no unresolved release blocker remains inside the parent audit boundary.

Remaining work is non-blocking follow-up unless a future release claim expands beyond the current local read-side MVP, stable-worktree, operator-selected-root, and source-data boundaries.
