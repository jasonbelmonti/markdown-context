# BEL-1188 Release Audit Track: Package, Documentation, And Release Controls

Issue: `BEL-1188`

Captured: 2026-05-24 10:28 CDT

Worktree: `/Users/jasonbelmonti/Documents/Development/markdown-context/.worktrees/bel-1188`

Branch: `codex/bel-1188-release-audit-controls`

Source revision under audit: `751f96bd3a216d049fb96a581ad9bb8deeef3e31`

## Verdict

APPROVE for the BEL-1188 package, documentation, and release-control audit boundary.

The current release candidate has a safe packed npm artifact for the reviewed read-side MVP scope: `npm pack --dry-run --json` includes the built runtime, root type declarations, CLI entrypoint, `README.md`, `LICENSE`, and `package.json`; it excludes source, tests, fixtures, docs, `.codex`, and `.worktrees` artifacts. A packed tarball install smoke passed, the installed `markdown-context` bin resolved the fixture successfully with one artifact and one lockfile record, and the package root import exposed the supported public API functions.

The documentation and metadata surface is sufficient for a release decision: the packed README includes requirements, quick-start commands, CLI syntax, context-link shape, registry shape, and root API usage; the top-level MIT `LICENSE` file is present and packed; Node engine constraints are declared and the local validation runtime satisfies them. No publication, release creation, tag mutation, dist-tag mutation, `publishConfig`, `prepublishOnly`, or release script was found or performed.

Two residual items are non-blocking follow-up: the repository intentionally omits `package-lock.json` and should document dependency-lockfile policy before stronger source-build reproducibility claims; `package.json` does not currently declare `repository`, `homepage`, or `bugs` metadata, so npm registry discoverability can be improved even though the packed README already links the project site and contains enough usage guidance to install, run, and understand the release safely.

Approval of this artifact does not approve npm publication, release tagging, GitHub Release creation, npm dist-tag mutation, or final parent release-readiness synthesis.

## Source Authority

| Source | Status | Evidence |
| --- | --- | --- |
| Linear `BEL-1188` | loaded | Defines this audit track's objective, source authority, scope, success criteria, review boundary, validation evidence, and non-goals. |
| Linear `BEL-1178` | loaded | Parent release-readiness audit program; prohibits publication, tagging, release mutation, release approval, and implementation fixes inside child audit tracks. |
| Linear `BEL-1179` | loaded | Establishes the current-source evidence discipline and release baseline expectations for downstream tracks. |
| Linear `BEL-1182` | loaded | Provides public API and CLI operator-contract context for package bin and root import readiness. |
| Linear `BEL-1184` | loaded | Provides package artifact, deterministic provenance, metadata classification, and packed smoke context. |
| `.codex/execution-briefs/bel-1188/execution-brief.md` | validated | Durable execution context, scope, validation gates, stop conditions, and review packet mapping. |
| `.codex/execution-plans/bel-1188/execution-plan.md` | validated | Executable route, file touch plan, viability review, estimator result, and validation gates. |
| `package.json` | reviewed | Package identity, bin, export map, type declarations, files allowlist, scripts, engines, dependency metadata, and absence of release publish controls. |
| `README.md` | reviewed and packed | Consumer-facing package README, quick start, CLI syntax, registry shape, root API usage, and project site link. |
| `LICENSE` | reviewed and packed | Top-level MIT license artifact matching `package.json` license declaration. |
| `docs/**` and `.github/workflows/pages.yml` | reviewed | User guide, design, execution, prior evidence, and GitHub Pages docs deployment context. |
| `npm pack --dry-run --json` | run | Packed artifact file list, tarball metadata, required file presence, and exclusion proof. |
| Packed tarball install smoke | run | Local install from generated tarball, installed bin execution, and root ESM import. |

## Current Release Target

Commands:

```bash
git status --short --branch
git rev-parse HEAD
git log -1 --pretty=fuller --decorate=short
git tag --points-at HEAD
node --version
npm --version
```

Observed result:

```text
## codex/bel-1188-release-audit-controls...origin/main
751f96bd3a216d049fb96a581ad9bb8deeef3e31
commit 751f96bd3a216d049fb96a581ad9bb8deeef3e31 (HEAD -> codex/bel-1188-release-audit-controls, origin/main, origin/HEAD)
Merge: 81ffe7d 45da7a3
AuthorDate: Sun May 24 10:08:39 2026 -0500
CommitDate: Sun May 24 10:08:39 2026 -0500

    Merge pull request #36 from jasonbelmonti/codex/bel-1223-license-artifact

    [codex] Add MIT license artifact

git tag --points-at HEAD: no output
node: v22.20.0
npm: 11.13.0
```

Interpretation:

- The current release target for this audit is `origin/main` commit `751f96bd3a216d049fb96a581ad9bb8deeef3e31`.
- No tag points at the audited commit.
- Local Node `v22.20.0` satisfies `package.json` engine declaration `^20.19.0 || >=22.12.0`.
- Local `.codex/**` files are execution and review artifacts for this PR, not package release payload.

## Command Evidence

### Planning Artifact Validation And Estimation

Execution Brief validation:

```bash
npx -y @jasonbelmonti/markdown-engine@2.0.0 validate --file ./.codex/execution-briefs/bel-1188/execution-brief.md --profile /Users/jasonbelmonti/.codex/skills/execution-brief/profiles/execution-brief.yaml
shasum -a 256 -c ./.codex/execution-briefs/bel-1188/execution-brief.sha256
```

Result: pass.

Execution Plan validation:

```bash
python3 /Users/jasonbelmonti/.codex/skills/execution-plan/scripts/validate_execution_plan.py --file ./.codex/execution-plans/bel-1188/execution-plan.md
shasum -a 256 -c ./.codex/execution-plans/bel-1188/execution-plan.sha256
```

Result: pass.

Execution estimation:

```bash
python3 /Users/jasonbelmonti/.codex/skill-checkouts/execution-estimation/scripts/estimate_execution.py --repo-root /Users/jasonbelmonti/Documents/Development/markdown-context/.worktrees/bel-1188 --proposed-files /Users/jasonbelmonti/Documents/Development/markdown-context/.worktrees/bel-1188/.codex/execution-plans/bel-1188/proposed-files.txt
```

Observed summary:

```text
schemaVersion: execution-estimation.v5
mode: proposal
execution.action: proceed-with-controls
planning.blocksExecution: false
estimation.decompositionRecommended: false
estimation.adjustedStoryPoints: 8
risk.blastRadius.level: low
risk.blastRadius.requiresHeightenedControls: false
```

Result: pass. The estimator recommended targeted verification controls but did not block execution or recommend decomposition.

### Dependency Prep

Command:

```bash
npm install --ignore-scripts --no-package-lock
```

Observed result:

```text
added 123 packages, and audited 124 packages in 7s
found 0 vulnerabilities
```

Result: pass. The command intentionally avoided creating a dependency lockfile.

### Typecheck And Full Regression

Commands:

```bash
npm run typecheck
npm test
```

Observed result:

```text
npm run typecheck: pass

Test Files  6 passed (6)
Tests       108 passed (108)
```

Result: pass.

### Package Dry Run

Command:

```bash
npm pack --dry-run --json
```

Observed package summary:

```json
{
  "id": "@jasonbelmonti/markdown-context@0.1.0",
  "filename": "jasonbelmonti-markdown-context-0.1.0.tgz",
  "size": 19500,
  "unpackedSize": 80547,
  "entryCount": 75,
  "shasum": "3ce953b120e743464a36754c6ad44a471c0a11c8",
  "integrity": "sha512-Cxx2Llj2SQOBv9KGvVTw9YqfrN0IPChKX+Jtl+FlNNyIfY8WXuy0pWhg6no3tmB/iV3U/prS2RUPsSvXwefxxA=="
}
```

Required file presence:

| File | Present in packed artifact |
| --- | --- |
| `README.md` | yes |
| `LICENSE` | yes |
| `package.json` | yes |
| `dist/index.js` | yes |
| `dist/index.d.ts` | yes |
| `dist/cli/index.js` | yes |
| `dist/cli/index.d.ts` | yes |

Packed file groups:

| Group | Count |
| --- | ---: |
| Root files | 3: `LICENSE`, `README.md`, `package.json` |
| `dist/**` | 72 |
| `src/**` | 0 |
| `test/**` | 0 |
| `fixtures/**` | 0 |
| `docs/**` | 0 |
| `site/**` | 0 |
| `.codex/**` | 0 |
| `.worktrees/**` | 0 |

Result: pass. The package file allowlist plus npm's default root metadata inclusions produce a package that contains built runtime files, type declarations, CLI entrypoint, README, LICENSE, and package metadata while excluding worktrees, test fixtures, source files, docs, and scratch artifacts.

### Packed Tarball Install And CLI Smoke

Command shape:

```bash
TMPDIR_AUDIT="$(mktemp -d)"
npm pack --json --pack-destination "$TMPDIR_AUDIT" > "$TMPDIR_AUDIT/pack.json"
mkdir -p "$TMPDIR_AUDIT/smoke/fixtures/ms1"
cp fixtures/ms1/{task.md,registry.json,context-source.md} "$TMPDIR_AUDIT/smoke/fixtures/ms1/"
cd "$TMPDIR_AUDIT/smoke"
npm init -y
npm install "$TMPDIR_AUDIT/jasonbelmonti-markdown-context-0.1.0.tgz" --ignore-scripts --no-package-lock
./node_modules/.bin/markdown-context resolve fixtures/ms1/task.md --registry fixtures/ms1/registry.json --repo-root . --lockfile --pretty
```

Observed summary:

```json
{
  "pack": {
    "filename": "jasonbelmonti-markdown-context-0.1.0.tgz",
    "entryCount": 75,
    "size": 19500,
    "unpackedSize": 80547,
    "shasum": "3ce953b120e743464a36754c6ad44a471c0a11c8"
  },
  "binSmoke": {
    "schemaVersion": "markdown-context.resolve-result.v0",
    "artifactCount": 1,
    "diagnosticCount": 0,
    "lockfileRecords": 1,
    "firstArtifactCanonicalUrl": "ctx://repo/path/fixtures/ms1/context-source.md?lens=excerpt"
  }
}
```

Result: pass. The packed package installs locally without publication and the installed bin resolves the fixture through the package entrypoint.

### Packed Root Import Smoke

Command:

```bash
node --input-type=module -e "import { loadRegistry, resolveScanResult, scanMarkdown, validateScanResult } from '@jasonbelmonti/markdown-context'; console.log(JSON.stringify({ loadRegistry: typeof loadRegistry, resolveScanResult: typeof resolveScanResult, scanMarkdown: typeof scanMarkdown, validateScanResult: typeof validateScanResult }));"
```

Observed result:

```json
{
  "loadRegistry": "function",
  "resolveScanResult": "function",
  "scanMarkdown": "function",
  "validateScanResult": "function"
}
```

Result: pass. The root export map and type/runtime entrypoint are consumable from the packed package.

## Package Metadata And Export Contract

`package.json` declares:

```json
{
  "name": "@jasonbelmonti/markdown-context",
  "version": "0.1.0",
  "description": "CLI-first context link scanner, validator, and resolver for Markdown.",
  "license": "MIT",
  "type": "module",
  "bin": {
    "markdown-context": "dist/cli/index.js"
  },
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "types": "./dist/index.d.ts",
  "files": [
    "dist"
  ],
  "engines": {
    "node": "^20.19.0 || >=22.12.0"
  }
}
```

Assessment:

- Package identity, description, MIT license declaration, ESM mode, bin path, root export map, root type declaration, files allowlist, and Node engine compatibility are explicit.
- Packed output includes every file referenced by `bin`, `exports`, and `types`.
- The root import smoke proves the root API is usable from the installed packed tarball.
- The installed bin smoke proves `markdown-context` is executable from the installed packed tarball.

No release-blocking package metadata or entrypoint gap was found inside the BEL-1188 boundary.

## Documentation And Metadata Classification

| Item | Evidence | Classification | Approval impact | Notes |
| --- | --- | --- | --- | --- |
| Top-level README | `README.md` exists, has 146 lines, is included in the packed artifact, and documents requirements, quick start, CLI syntax, link shape, registry shape, root API usage, project site, and validation command. | ready | non-blocking | Sufficient for consumers to install, run, and understand the MVP release safely. |
| Top-level LICENSE | `LICENSE` exists, has 21 lines, is included in the packed artifact, and matches `package.json` declaring `"license": "MIT"`. | ready | non-blocking | BEL-1223 resolved the previous BEL-1184 license artifact blocker on `origin/main`. |
| User guide and design docs | `docs/user-guide.md`, design spec, execution spec, and evidence corpus exist in the repository. The packed artifact excludes `docs/**`; README links the project site and docs. | docs-packaging follow-up | non-blocking | Excluding docs keeps package size small. The packed README is enough for safe use, but npm registry discoverability can improve if package metadata adds `homepage` or `repository`. |
| Dependency lockfile | No top-level `package-lock.json`, `npm-shrinkwrap.json`, `pnpm-lock.yaml`, `yarn.lock`, or Bun lockfile exists outside `node_modules`; `.gitignore` excludes `package-lock.json`. | accepted release risk with follow-up | non-blocking | Acceptable for this library package artifact because the packed package depends on package metadata, not dev dependency lock state. Document policy before stronger source-build reproducibility claims. |
| `repository`, `homepage`, `bugs` metadata | Not declared in `package.json`; README includes the project site URL. | metadata follow-up | non-blocking | Improves npm registry UX but does not block install, bin execution, root import, or safe basic usage. |

## Release-Control Inspection

Commands:

```bash
rg -n "\b(npm publish|prepublishOnly|publishConfig|release|dist-tag|git tag|gh release|changeset|semantic-release)\b" package.json README.md docs site src test .github
find .github -maxdepth 3 -type f -print
sed -n '1,220p' .github/workflows/pages.yml
```

Findings:

- `package.json` scripts are limited to `build`, `prepack`, `test`, and `typecheck`.
- `prepack` runs `npm run build`; it does not publish or mutate release state.
- `package.json` has no `publishConfig`, no `prepublishOnly`, no release script, no changeset config, and no semantic-release config.
- `.github/workflows/pages.yml` deploys static `site/**` content to GitHub Pages on `main` path changes or manual dispatch. It does not publish npm packages, create GitHub Releases, mutate tags, or alter npm dist-tags.
- `git tag --points-at HEAD` produced no tag for the audited commit.
- No npm publication, GitHub Release creation, tag mutation, or npm dist-tag mutation was performed during this audit.

Release-control result: pass.

## Release Blockers

None found inside the BEL-1188 review boundary.

## Accepted Risks

| Risk | Classification | Approval impact | Rationale | Follow-up |
| --- | --- | --- | --- | --- |
| No tracked dependency lockfile | accepted release risk | non-blocking | The package is a library/CLI package whose packed artifact is governed by `package.json`; `.gitignore` intentionally excludes `package-lock.json`; install and packed smoke passed. | Document dependency-lockfile policy before claiming source-build reproducibility beyond package metadata. |
| `package.json` lacks `repository`, `homepage`, and `bugs` fields | metadata follow-up | non-blocking | README includes the project site and usage guidance; package install, bin, and root import are unaffected. | Add npm registry discoverability metadata before broader public release polish if desired. |
| `docs/**` are excluded from the packed tarball | docs-packaging follow-up | non-blocking | The packed README is sufficient for safe basic use and links the project site; excluding docs keeps runtime package small. | Decide whether to keep docs web-only or include selected docs in the package before external documentation-quality review. |

## Follow-up / Non-blocking Work

- Document the dependency-lockfile policy in release documentation or package maintenance notes.
- Consider adding `repository`, `homepage`, and `bugs` fields to `package.json`.
- Decide whether `docs/user-guide.md` should remain website/repository documentation only or be included in future package artifacts.
- Consider automating the packed tarball install, CLI smoke, and root import smoke in CI.

## Final Assessment

The current package, documentation, metadata, and release controls are ready for a release decision under the BEL-1188 boundary. The package can be built, tested, packed, locally installed from its tarball, executed through its installed bin, and imported through its root export. The packed file list includes required runtime and metadata files and excludes development, test, fixture, docs, worktree, and scratch surfaces.

No release-control mechanism in the repository publishes, tags, creates a GitHub Release, or mutates npm dist-tags. This audit remains evidence-only and does not itself authorize publication or final parent release readiness.
