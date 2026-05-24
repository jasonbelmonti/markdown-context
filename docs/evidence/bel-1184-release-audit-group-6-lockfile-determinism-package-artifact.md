# BEL-1184 Release Audit Group 6: Lockfile, Determinism, And Package Artifact

Issue: `BEL-1184`

Captured: 2026-05-24 09:18 CDT

Worktree: `/Users/jasonbelmonti/Documents/Development/markdown-context/.worktrees/bel-1184`

Branch: `codex/bel-1184-lockfile-determinism-package-audit`

Source revision under audit: `be8050011bfc30f7f1dcb644eb02b8335f51f14c`

BEL-1223 closure update captured: 2026-05-24 09:50 CDT

BEL-1223 worktree: `/Users/jasonbelmonti/Documents/Development/markdown-context/.worktrees/bel-1223`

BEL-1223 branch: `codex/bel-1223-license-artifact`

BEL-1223 base revision: `81ffe7da04ea298ab8f4e34129bb8febb1ed8b55`

## Verdict

Original BEL-1184 verdict: REJECT first-release readiness for the BEL-1184 boundary until the release owner either adds a top-level `LICENSE` artifact or records an explicit waiver.

BEL-1223 closure update: CLEARS the missing release license artifact blocker for this audit boundary. The repository now has a top-level MIT `LICENSE` file consistent with `package.json` declaring `"license": "MIT"`, and `npm pack --dry-run --json` includes `LICENSE` in the packed file set.

Deterministic output, canonical lockfile provenance, hash derivation, package contents, bin entrypoint, root import, and type declaration evidence all passed for the source revision originally audited by BEL-1184. At original audit capture time, the only release-blocking gap found in this track was release metadata: `package.json` declared `"license": "MIT"`, but no top-level `LICENSE` file existed in the source tree or packed artifact. BEL-1223 supplies that artifact and package proof.

The missing dependency lockfile is classified as an accepted release risk with follow-up, not a blocker for this library package artifact, because `.gitignore` explicitly excludes `package-lock.json` and the packed artifact correctly relies on package metadata rather than shipping development dependency state. The release owner should still document dependency-lockfile policy before future reproducibility claims.

Approval of this artifact does not approve npm publication, release tagging, GitHub Release creation, or code fixes.

The BEL-1223 closure update does not approve npm publication, release tagging, GitHub Release creation, or dependency lockfile policy changes.

## Source Authority

| Source | Status | Evidence |
| --- | --- | --- |
| Linear `BEL-1184` | loaded | Defines the audit objective, source authority, scope, success criteria, review boundary, validation evidence, and follow-up expectations. |
| Linear `BEL-1223` | loaded | Defines the license-artifact closure task for the BEL-1184 release metadata blocker. |
| Linear `BEL-1178` | loaded | Parent release-audit program; prohibits publication, tagging, release mutation, and broad implementation fixes in this audit track. |
| `.codex/execution-briefs/bel-1184/execution-brief.md` | validated | Durable execution context for this audit. |
| `.codex/execution-plans/bel-1184/execution-plan.md` | validated | Executable route, file touch plan, viability review, and validation gates. |
| `src/core/stable-json.ts` | reviewed | Stable JSON object-key ordering, array handling, and final newline behavior. |
| `src/lockfile/**` | reviewed | Canonical JSON validation, SHA-256 hashing, registry hashing, lockfile record creation, sorting, and serialization. |
| `src/resolvers/repo-path/lockfile.ts` | reviewed | Artifact hash, artifact path, source identity, source hash, registry, and output-option lockfile inputs. |
| `src/cli/index.ts` and `src/cli/json.ts` | reviewed | CLI stable JSON output, lockfile emission, and `--lockfile-out` write path. |
| `package.json` | reviewed | Package name/version, license declaration, bin, exports, types, files allowlist, scripts, dependencies, and engines. |
| `test/lockfile.test.ts`, `test/cli.test.ts`, `test/repo-path.test.ts` | reviewed and run | Automated proof for canonical JSON, lockfile, CLI determinism, stable source paths, and hash expectations. |
| `npm pack --dry-run --json` | run | Packed artifact file list, tarball metadata, and exclusion proof. |

## Current Release Target

Command:

```bash
git status --short --branch
git rev-parse HEAD
```

Observed result:

```text
## codex/bel-1184-lockfile-determinism-package-audit
?? .codex/
be8050011bfc30f7f1dcb644eb02b8335f51f14c
```

Interpretation:

- The audit target is `origin/main` commit `be8050011bfc30f7f1dcb644eb02b8335f51f14c`.
- Local `.codex/**` files are execution artifacts for this audit.
- This branch's intended product change is this BEL-1184 evidence artifact plus planning artifacts.

## Command Evidence

### Execution Artifact Validation And Estimation

Execution Brief validation:

```bash
npx -y @jasonbelmonti/markdown-engine@2.0.0 validate --file ./.codex/execution-briefs/bel-1184/execution-brief.md --profile /Users/jasonbelmonti/.codex/skills/execution-brief/profiles/execution-brief.yaml
```

Result: pass.

Execution Plan validation:

```bash
python3 /Users/jasonbelmonti/.codex/skills/execution-plan/scripts/validate_execution_plan.py --file ./.codex/execution-plans/bel-1184/execution-plan.md
```

Result: pass.

Execution estimation:

```bash
python3 /Users/jasonbelmonti/.codex/skill-checkouts/execution-estimation/scripts/estimate_execution.py --repo-root /Users/jasonbelmonti/Documents/Development/markdown-context/.worktrees/bel-1184 --proposed-files /Users/jasonbelmonti/Documents/Development/markdown-context/.worktrees/bel-1184/.codex/execution-plans/bel-1184/proposed-files.txt
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
added 123 packages, and audited 124 packages in 8s
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
Tests       102 passed (102)
```

Result: pass.

### Repeated Resolve And Lockfile Determinism

Command shape:

```bash
node dist/cli/index.js resolve fixtures/ms1/task.md --registry fixtures/ms1/registry.json --repo-root . --lockfile --lockfile-out <path> --pretty
cmp first.resolve.json second.resolve.json
cmp first.lock.json second.lock.json
shasum -a 256 first.resolve.json second.resolve.json first.lock.json second.lock.json
```

Observed result:

```text
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
  "artifactHash": "sha256:4f687c5ce3308c6cf5ca1782e42597f7dad40d0440991615759748e42dc495ba",
  "artifactPath": ".markdown-context/artifacts/repo-path/4f687c5ce3308c6cf5ca1782e42597f7dad40d0440991615759748e42dc495ba.json",
  "registryHash": "sha256:1b56681d2284fbd744d27ea5faa522ea61ee23627065bf0966cfcd9f65fc39fa",
  "sourceHash": "sha256:e98fddb832130b79834df1ebad87cb4f391526ec265387bb727cfc2ab8733b6f",
  "sourceIdentity": {
    "kind": "repo/path",
    "path": "fixtures/ms1/context-source.md"
  },
  "lockfileHash": "sha256:4f5b5c42d769fe5ea5dd4dc6090941060efe41a86a25ee2a726b28ccd766713f",
  "stdoutHasEmbeddedLockfile": true,
  "artifactCanonicalUrl": "ctx://repo/path/fixtures/ms1/context-source.md?lens=excerpt",
  "selectedLens": "excerpt"
}
```

Result: pass. Repeated resolve stdout and lockfile bytes were byte-identical.

### Package Dry Run

Command:

```bash
npm pack --dry-run --json
```

Observed package summary:

```json
{
  "filename": "jasonbelmonti-markdown-context-0.1.0.tgz",
  "entryCount": 71,
  "size": 17722,
  "unpackedSize": 73967,
  "shasum": "8c01c14a82adc5fa0e353af5061c1293664ae8d6"
}
```

Included release payload categories:

- `README.md`
- `package.json`
- `dist/index.js`
- `dist/index.d.ts`
- `dist/cli/index.js`
- `dist/cli/*.d.ts`
- `dist/core/**`
- `dist/lockfile/**`
- `dist/pipeline/**`
- `dist/registry/**`
- `dist/resolvers/**`

Excluded payload categories:

- `src/**`
- `test/**`
- `fixtures/**`
- `docs/**`
- `site/**`
- `.codex/**`
- `.github/**`

Result: pass for package contents and exclusions. The dry-run package contains the intended runtime and type declaration files and excludes source-tree-only artifacts.

### BEL-1223 License Artifact Closure

Commands:

```bash
npm test
npm pack --dry-run --json
```

Observed test result:

```text
Test Files  6 passed (6)
Tests       108 passed (108)
```

Observed package summary after adding the top-level `LICENSE`:

```json
{
  "filename": "jasonbelmonti-markdown-context-0.1.0.tgz",
  "entryCount": 75,
  "size": 19500,
  "unpackedSize": 80547,
  "shasum": "3ce953b120e743464a36754c6ad44a471c0a11c8",
  "hasLicense": true,
  "licenseEntry": {
    "path": "LICENSE",
    "size": 1071,
    "mode": 420
  }
}
```

Result: pass. The packed artifact now includes the declared MIT license text at `LICENSE`.

### Packed Tarball Install Smoke

Command shape:

```bash
npm pack --json --pack-destination <temp-dir>
npm install <temp-dir>/jasonbelmonti-markdown-context-0.1.0.tgz --ignore-scripts --no-package-lock
./node_modules/.bin/markdown-context resolve task.md --registry registry.json --repo-root . --lockfile --pretty
node --input-type=module -e "import { scanMarkdown } from '@jasonbelmonti/markdown-context'"
```

Observed result:

```json
{
  "artifactCount": 1,
  "diagnosticCount": 0,
  "lockfileRecordCount": 1,
  "binResolved": "source.md",
  "importScanLinks": 1,
  "hasTypes": true,
  "hasBinEntrypoint": true
}
```

Result: pass. The packed artifact installs, its bin entrypoint resolves a repo/path link, the root package import works, and root type declarations are present.

## Determinism And Hash Findings

### F-1: CLI JSON output is deterministic

Assessment: pass.

Evidence:

- `src/core/stable-json.ts:1` through `src/core/stable-json.ts:2` always appends a final newline.
- `src/core/stable-json.ts:33` through `src/core/stable-json.ts:37` serializes object entries and sorts keys with code-unit comparison.
- `src/core/stable-json.ts:17` through `src/core/stable-json.ts:30` preserves array order while serializing array holes as `null` through the same stable value path.
- `src/cli/index.ts:24` through `src/cli/index.ts:30` writes command output through stable JSON for both success and error paths.
- `test/cli.test.ts:262` through `test/cli.test.ts:279` covers code-unit object ordering and sparse array behavior.
- `test/cli.test.ts:282` through `test/cli.test.ts:309` covers byte-identical repeated resolve JSON.

No nondeterministic CLI serialization source was found inside the BEL-1184 boundary.

### F-2: Canonical lockfile records are built from explicit stable inputs

Assessment: pass.

Evidence:

- `src/lockfile/canonical-json.ts:10` through `src/lockfile/canonical-json.ts:14` validates canonical JSON values before serializing with stable JSON.
- `src/lockfile/canonical-json.ts:48` through `src/lockfile/canonical-json.ts:85` rejects unsupported values, non-finite numbers, array holes, and undefined object fields before hashing.
- `src/lockfile/hash.ts:6` through `src/lockfile/hash.ts:15` hashes UTF-8 canonical bytes with SHA-256.
- `src/lockfile/lockfile.ts:25` through `src/lockfile/lockfile.ts:44` constructs records with canonical URL, selected lens, artifact path/hash, registry identity/hash, resolver identity, source identity/hash, and output options.
- `src/lockfile/lockfile.ts:47` through `src/lockfile/lockfile.ts:61` sorts records before serialization and hashing.
- `src/lockfile/lockfile.ts:72` through `src/lockfile/lockfile.ts:97` hashes registries from normalized registry snapshots, including sorted resources, lenses, and params.
- `src/lockfile/lockfile.ts:108` through `src/lockfile/lockfile.ts:122` uses deterministic record tie-breakers.
- `test/lockfile.test.ts:18` through `test/lockfile.test.ts:40` covers canonical JSON sorting and rejection of unsupported values.
- `test/lockfile.test.ts:113` through `test/lockfile.test.ts:199` covers normalized registry hashing independent of file formatting and omitted params.
- `test/lockfile.test.ts:201` through `test/lockfile.test.ts:245` covers explicit record provenance fields.
- `test/lockfile.test.ts:248` through `test/lockfile.test.ts:319` covers deterministic lockfile serialization and hashing independent of input order and tie cases.

No release-blocking lockfile construction gap was found.

### F-3: Repo/path artifact hashes and artifact paths derive from canonical artifact bytes

Assessment: pass.

Evidence:

- `src/resolvers/repo-path/lockfile.ts:11` through `src/resolvers/repo-path/lockfile.ts:31` hashes the artifact with `hashCanonicalJson`, builds the artifact path from that hash, records registry and resolver identity, preserves source identity path, records source hash, and records output options.
- `src/resolvers/repo-path/lockfile.ts:34` through `src/resolvers/repo-path/lockfile.ts:36` derives artifact path as `.markdown-context/artifacts/repo-path/<artifactHashHex>.json`.
- `src/resolvers/repo-path/source.ts:46` through `src/resolvers/repo-path/source.ts:53` normalizes source text, hashes it, and records `repo/path` source identity.
- `src/resolvers/repo-path/source.ts:111` through `src/resolvers/repo-path/source.ts:116` defines source hash input as normalized UTF-8 text.
- `src/resolvers/repo-path/artifact.ts:13` through `src/resolvers/repo-path/artifact.ts:35` renders artifact metadata and hashes rendered content text.
- `src/resolvers/repo-path/artifact.ts:38` through `src/resolvers/repo-path/artifact.ts:68` bounds excerpt output and enforces final-newline normalization.
- `test/cli.test.ts:358` through `test/cli.test.ts:423` proves repeated artifact bytes, lockfile bytes, and hashes stay stable, including artifact path derived from artifact hash.

The manual repeated-run evidence matched the test contract exactly: the artifact path suffix equals the `artifactHash` hex value.

### F-4: Lockfile source paths are stable in requested lockfile modes

Assessment: pass.

Evidence:

- `src/cli/index.ts:70` through `src/cli/index.ts:113` requests lockfile generation when `--lockfile` or `--lockfile-out` is supplied and writes canonical lockfile bytes through `serializeContextLockfile`.
- `src/cli/index.ts:167` through `src/cli/index.ts:178` stabilizes Markdown source paths relative to `--repo-root` when embedded lockfile output is requested.
- `test/cli.test.ts:429` through `test/cli.test.ts:470` proves `--lockfile-out` writes canonical lockfile data without changing resolve stdout.
- `test/cli.test.ts:472` through `test/cli.test.ts:607` covers lockfile stability across relative/absolute Markdown paths, invocation working directories, and symlinked repo-root aliases.

No unstable lockfile source-path issue was found.

## Package Artifact Findings

### F-5: Packed artifact contains intended runtime, bin, exports, and type declarations

Assessment: pass.

Evidence:

- `package.json:7` through `package.json:9` declares the `markdown-context` bin at `dist/cli/index.js`.
- `package.json:10` through `package.json:16` declares root package export and types at `dist/index.js` and `dist/index.d.ts`.
- `package.json:17` through `package.json:19` allowlists `dist` for package payload.
- `package.json:20` through `package.json:24` runs `npm run build` during `prepack`.
- `npm pack --dry-run --json` listed 71 entries including `README.md`, `package.json`, `dist/index.d.ts`, `dist/cli/index.js`, and `dist/lockfile/**`.
- The packed tarball install smoke verified the bin resolves a link, root import works, and type declaration files are present.

No package entrypoint, export, type declaration, or unintended payload blocker was found.

### F-6: Release metadata contains README and package license artifact

Assessment: resolved by BEL-1223.

Evidence:

- `README.md` exists at the repository root and is included by `npm pack --dry-run --json`.
- `package.json:5` declares `"license": "MIT"`.
- `LICENSE` exists at the repository root and contains standard MIT license text.
- BEL-1223 `npm pack --dry-run --json` includes `LICENSE` in the packed file set.

Classification:

| Item | Status | Classification | Rationale |
| --- | --- | --- | --- |
| Top-level README | present in source and package | pass | Included in dry-run package payload. |
| License declaration | present in `package.json` | pass | Declares MIT and is now paired with matching license text. |
| Top-level LICENSE file | present in source and package | pass | The package ships the declared MIT license text. |

Required action before release readiness approval: complete BEL-1223 review and merge so the license artifact is present on the release branch.

### F-7: Dependency lockfile is absent by repository policy and should be documented

Assessment: accepted risk with follow-up.

Evidence:

- `.gitignore:3` excludes `package-lock.json`.
- No top-level `package-lock.json` exists in the repository root.
- `package.json:26` through `package.json:32` uses semver-ranged dependency and devDependency declarations.
- Dependency prep for this audit used `npm install --ignore-scripts --no-package-lock`, preserving the current repository policy.

Classification: accepted release risk, not a BEL-1184 blocker.

Rationale: The published package artifact should not ship development dependency lock state, and the repository currently expresses an intentional no-lockfile policy through `.gitignore`. However, exact source-build reproducibility is not pinned. The release owner should document whether this library intentionally omits `package-lock.json` or should track one before future reproducibility claims.

## Success Criteria Status

- [x] Repeated `resolve` runs produce byte-identical stdout for identical inputs.
- [x] `--lockfile` and `--lockfile-out` produce deterministic canonical lockfile records.
- [x] Registry hashes, source hashes, artifact hashes, and artifact paths are derived from documented stable inputs.
- [x] `npm pack --dry-run --json` includes intended files and excludes unintended files.
- [x] BEL-1223 `npm pack --dry-run --json` includes top-level `LICENSE`.
- [x] Absence or presence of top-level README, LICENSE, and dependency lockfile is classified.

## Blocking Findings

- None remaining inside the BEL-1184 release metadata boundary after the BEL-1223 license artifact update.

Follow-up issue closure: Linear `BEL-1223` (`Add MIT LICENSE artifact to markdown-context package`) supplies the license artifact and package proof needed to clear this blocker once the BEL-1223 diff is reviewed and merged.

## Accepted Risks

- Dependency lockfile is absent and explicitly gitignored. This is accepted for the current library package artifact but should be documented as package policy before broader reproducibility claims.

## Follow-Up Recommendations

- Complete Linear `BEL-1223` review and merge so the top-level MIT `LICENSE` file is present on the release branch before first-release approval.
- Document dependency lockfile policy for this package.
- Consider adding package smoke-test automation that runs `npm pack`, installs the tarball, checks root import, checks type declarations, and exercises the installed bin.
