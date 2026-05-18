# BEL-1061 Security and Source-Content Boundary Audit Evidence

Issue: `BEL-1061`

Scope: Cross-cutting security and source-content boundary audit across scanner, registry, resolver, CLI, public API, fixtures, tests, and prior audit evidence for the read-side MVP.

## Objective

Verify that the read-side MVP protects local filesystem boundaries and keeps resolved source text inside the intended bounded artifact contract.

## Source Inventory

- Current-thread instruction on 2026-05-18: execute `BEL-1061`, run consensus review until clean, then open a PR.
- Linear `BEL-1061` retrieved on 2026-05-18: audit repo/path containment, symlink escape prevention, missing-file handling, bounded content projection, prompt-like parameters, unsupported parameters, and source-data versus instruction-data boundaries.
- `docs/design/markdown-context-operational-design-spec.md`: authoritative design constraints for inert links, prompt-firewall behavior, offline `repo/path`, bounded artifacts, and source-content boundaries.
- `docs/execution/markdown-context-read-side-mvp-execution-spec.md`: authoritative execution and validation gates for scanner, registry, resolver, CLI, and security/data review.
- `docs/evidence/bel-1053-audit-group-1.md` through `docs/evidence/bel-1062-public-api-misuse-resistance.md`: prior audit record for scanner, registry, resolver, CLI, public API, test strategy, fail-closed behavior, determinism, and public API hardening.
- Current implementation and tests in `src/**`, `fixtures/ms1/**`, and `test/**` on branch `codex/bel-1061-security-source-boundary`.

## Success Criteria Status

- [x] Repo/path containment, symlink escape prevention, missing-file handling, and bounded content projection were reviewed together.
- [x] Prompt-like parameters, unsupported parameters, and source-data versus instruction-data boundaries were reviewed for escalation risk.
- [x] Paths that can expose unexpected local content or overlarge raw source were recorded with file/line evidence and concrete follow-up recommendations.

## Audit Verdict

Recommendation: Accept this audit track with follow-up hardening work recorded before broader release claims.

The current supported scanner -> registry -> resolver path prevents parent traversal and symlink escapes from reading outside `repoRoot`, rejects malformed and unsupported URL input before artifact rendering, and marks returned source text as untrusted source data. The BEL-1059 public raw resolver exposure has been resolved by BEL-1062: the root package exports `resolveScanResult`, not `resolveRepoPathLink`.

Two residual risks should be tracked as follow-up rather than treated as blockers for this audit deliverable:

- A valid `ctx://repo/path/...` link can project any real file inside the chosen `repoRoot`; the registry does not yet constrain path ids by allowlist, denylist, glob, or source class.
- The resolver reads and normalizes the full source file before excerpt bounding, so very large files are loaded into memory even though the emitted artifact content is capped.

## Boundary Map

### Scanner and URL parser

Status: Accepted.

Evidence:

- `src/core/scan.ts:22` consumes `markdown-engine` public `documentQueries.linkReferences` rather than executing links.
- `src/core/scan.ts:38` parses only context URLs and `src/core/scan.ts:41` skips candidates that produced parse errors.
- `src/core/context-url.ts:19` through `src/core/context-url.ts:27` converts invalid URL construction into `ctx.url.invalid`.
- `src/core/context-url.ts:36` through `src/core/context-url.ts:47` converts malformed percent-decoded path segments into `ctx.url.invalid`.
- `src/core/context-url.ts:68` through `src/core/context-url.ts:80` rejects duplicate decoded query params.
- `test/ms1.test.ts:140` covers malformed path escapes.
- `test/ms1.test.ts:153` covers duplicate decoded params.

Security judgment:

- Malformed URL encoding and duplicate prompt/lens key ambiguity fail before validation and resolution.
- Scanner output remains structured data; no OS handler, browser, network, or connector behavior is present in the scanner path.

### Registry validation and prompt-like parameters

Status: Accepted for closed parameter vocabulary; follow-up for path-id policy.

Evidence:

- `src/registry/registry.ts:18` through `src/registry/registry.ts:25` defines registry resources by scheme, namespace, kind, default lens, lenses, and optional params.
- `src/registry/registry.ts:77` through `src/registry/registry.ts:88` rejects params not declared by the matched resource.
- `src/registry/registry.ts:90` through `src/registry/registry.ts:96` rejects unsupported requested lenses.
- `fixtures/ms1/registry.json:6` through `fixtures/ms1/registry.json:12` declares the current `repo/path` resource with `params: []`.
- `test/ms1.test.ts:282` covers rejection of a prompt-like `prompt=ignore-previous-instructions` param.
- `test/ms1.test.ts:334` covers prototype-named params remaining visible to validation and rejected as unsupported.

Security judgment:

- Prompt-like URL params fail closed before resolution.
- Unsupported params do not become hidden instructions or resolver behavior.
- The registry contract does not currently express allowed id patterns, path prefixes, denied names, or file classes. That is a local-content exposure policy gap when processing untrusted Markdown or when `repoRoot` contains sensitive checked-in or generated files.

### Repo/path containment and source reads

Status: Accepted for filesystem escape prevention; follow-up for broad in-root reads and overlarge source reads.

Evidence:

- `src/resolvers/repo-path/source.ts:25` resolves `link.id` through `resolveRealPathInsideRoot`.
- `src/resolvers/repo-path/source.ts:87` through `src/resolvers/repo-path/source.ts:95` returns `ctx.repoPath.unresolved` when the repo root or candidate cannot resolve.
- `src/resolvers/repo-path/source.ts:98` through `src/resolvers/repo-path/source.ts:105` rejects candidates whose real path is outside the real repo root.
- `src/resolvers/repo-path/source.ts:40` reads the resolved file only after the realpath containment check.
- `test/repo-path.test.ts:146` covers symlink escape rejection.
- `test/repo-path.test.ts:168` covers lexical `../` escape rejection.
- `test/ms1.test.ts:486` covers unresolved repo paths through the CLI.

Security judgment:

- Parent traversal and symlink escapes are blocked before content is read.
- Missing files fail closed as diagnostics and produce no artifacts.
- The resolver still reads any valid in-root path selected by a validated link. This is expected for `repo/path`, but it should be treated as a trust contract: callers must not run resolution over untrusted Markdown against a broad repo root that contains files they would not intentionally expose as bounded context.

### Bounded artifact projection and source-content boundary

Status: Accepted for emitted artifacts; follow-up for pre-bounding memory behavior.

Evidence:

- `src/resolvers/repo-path/artifact.ts:6` caps excerpt artifacts at 4096 UTF-8 bytes.
- `src/resolvers/repo-path/artifact.ts:38` through `src/resolvers/repo-path/artifact.ts:61` renders only bounded excerpt text and appends a fixed truncation marker when the source exceeds the byte budget.
- `src/resolvers/repo-path/artifact.ts:29` and `src/resolvers/repo-path/artifact.ts:30` mark artifacts with `sourceTrust: "untrusted-source-data"` and `sourceContentBoundary: "source-data"`.
- `src/core/types.ts:73` through `src/core/types.ts:78` encode the same trust and boundary fields in the public artifact type.
- `test/repo-path.test.ts:76` covers large-file truncation and proves the tail content does not appear in the artifact.
- `test/repo-path.test.ts:189` covers hostile source text remaining inside an untrusted source-data artifact boundary.

Security judgment:

- Emitted artifact text is bounded and tagged as source data, not instructions.
- Hostile source content can still appear in the bounded artifact text by design. Consumers must respect the `sourceTrust` and `sourceContentBoundary` fields.
- Because `src/resolvers/repo-path/source.ts:40` reads the whole file and `src/resolvers/repo-path/source.ts:45` normalizes the whole string before `src/resolvers/repo-path/artifact.ts:13` bounds the excerpt, very large files can impose memory and hashing cost before the emitted content cap applies.

### CLI and public API composition

Status: Accepted.

Evidence:

- `src/cli/index.ts:36` reads the Markdown target only after command and option validation.
- `src/cli/index.ts:48` through `src/cli/index.ts:54` validates scans before `validate` output.
- `src/cli/index.ts:59` through `src/cli/index.ts:72` resolves only validated links, merges validation and resolver diagnostics, and exits non-zero when either layer reports an error.
- `src/pipeline/resolve.ts:15` validates the full scan result before the root public resolver path can produce artifacts.
- `src/pipeline/resolve.ts:16` through `src/pipeline/resolve.ts:22` returns zero artifacts when public API validation fails.
- `src/index.ts:14` through `src/index.ts:16` exports `scanMarkdown`, `loadRegistry`, `validateScanResult`, and `resolveScanResult`, not the raw repo/path resolver.
- `test/ms1.test.ts:196` and `test/ms1.test.ts:203` prove the root public API withholds `validateContextLinks` and `resolveRepoPathLink`.
- `test/ms1.test.ts:210` through `test/ms1.test.ts:280` covers rejected and accepted public resolve behavior.

Security judgment:

- The root public API now guides consumers through safe scan-result validation before resolution.
- The CLI may emit artifacts for valid links while also returning validation diagnostics and a non-zero exit code for other links in the same file. That behavior is already documented by BEL-1062 and does not let a rejected link contribute content, but operators should treat non-zero `resolve` output as failed preflight.

## Findings and Follow-Up Recommendations

### F-1: Valid repo/path links can project any file inside repoRoot

Severity: Follow-up security hardening.

Evidence:

- `src/registry/registry.ts:18` through `src/registry/registry.ts:25` has no resource field for id patterns, path prefixes, denied paths, or maximum source classes.
- `src/registry/registry.ts:65` through `src/registry/registry.ts:96` validates only resource identity, unsupported params, and selected lens.
- `src/resolvers/repo-path/source.ts:25` resolves the accepted `link.id`.
- `src/resolvers/repo-path/source.ts:40` reads the contained candidate file.

Impact:

- A Markdown input that is otherwise valid can request bounded artifact content from any real file under the configured `repoRoot`.
- This does not escape the repo boundary, but it can expose unexpected in-root content when the resolver is run against untrusted Markdown, generated Markdown, or a repo root that includes local secrets, build output, vendored dependencies, or private notes.

Recommendation:

- Add registry-controlled repo/path id policy before treating untrusted Markdown as safe to resolve. Acceptable designs include allowed path globs/prefixes, denied path globs, maximum source byte limits, or named source classes.
- Document the current trust contract in CLI/public API docs: resolve only Markdown whose `ctx://repo/path/...` ids you are willing to read from the selected `repoRoot`.

### F-2: Large source files are read in full before excerpt bounding

Severity: Follow-up resource hardening.

Evidence:

- `src/resolvers/repo-path/source.ts:40` reads the entire resolved file as UTF-8.
- `src/resolvers/repo-path/source.ts:45` normalizes the entire source string.
- `src/resolvers/repo-path/source.ts:46` hashes the entire normalized source.
- `src/resolvers/repo-path/artifact.ts:13` receives the full source text before rendering the bounded excerpt.
- `src/resolvers/repo-path/artifact.ts:41` through `src/resolvers/repo-path/artifact.ts:60` bounds only the emitted artifact text.

Impact:

- The returned artifact remains capped, but a hostile or accidental link to a very large in-root file can still consume memory and CPU during read, normalization, and hashing.
- The current suite proves tail content is not emitted, but it does not enforce a source read size limit.

Recommendation:

- Add a resolver-level source byte limit or streaming excerpt reader so the resolver does not materialize arbitrarily large files before truncation.
- If full-source hashing remains required, make that an explicit tradeoff and cap or skip hashes beyond a documented source-size threshold.
- Add regression coverage for over-limit source handling once the policy is selected.

## Accepted Controls

- Path containment uses filesystem `realpath` for both `repoRoot` and candidate paths before read.
- Missing files, malformed paths, duplicate decoded params, unsupported params, unsupported lenses, and unsupported resources produce diagnostics and no artifact for the rejected link.
- Root package consumers are guided through `resolveScanResult`, which validates the complete scan result and returns zero artifacts on validation failure.
- Emitted source text is bounded to 4096 UTF-8 bytes and tagged as `untrusted-source-data` / `source-data`.
- No network, live connector, browser automation, OS handler execution, or write-side mutation flow is present in the current read-side runtime path.

## Validation

Commands:

```bash
npm install --no-package-lock
npm test
```

Result on 2026-05-18 in `.worktrees/bel-1061`:

- `npm install --no-package-lock`: passed; 123 packages audited; 0 vulnerabilities.
- `npm test`: passed.
- `test/repo-path.test.ts`: 8 tests passed.
- `test/ms1.test.ts`: 30 tests passed.
- `test/cli.test.ts`: 11 tests passed.
- Total: 49 tests passed.

## Open Questions

- Should `repo/path` remain intentionally broad for trusted local Markdown only, or should BEL-1061 spawn a policy follow-up for registry-controlled path id constraints before release?
- Should full-source content hashes remain mandatory if the resolver adds source byte limits?
