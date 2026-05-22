# BEL-1180 Release Audit Group 2: Scanner and Context URL Contract

Issue: `BEL-1180`

Captured: 2026-05-22 13:33 CDT

Worktree: `/Users/jasonbelmonti/Documents/Development/markdown-context/.worktrees/bel-1180`

Branch: `codex/bel-1180-scanner-url-contract`

Source revision under audit: `dc8229938bf83a9062a48230c7e6edfba268a3e0`

## Objective

Audit scanner and context URL behavior so `ctx://` links are discovered, rejected, source-located, and canonicalized deterministically before validation or resolution.

This artifact approves only the scanner and context URL contract for the read-side MVP release boundary. It does not approve registry policy, repo/path resolution, CLI option parsing beyond scanner command evidence, package publication, final release readiness, or future link forms.

## Source Authority

| Source | Status | Controls |
| --- | --- | --- |
| Linear `BEL-1180` | loaded | Defines this audit group's objective, scope, success criteria, review boundary, and required evidence. |
| Linear `BEL-1178` | loaded | Parent release-readiness audit program; prohibits publication, tagging, release approval, and code fixes inside this audit track. |
| `src/core/scan.ts` | loaded | Scanner implementation and sourceRange fail-closed behavior. |
| `src/core/context-url.ts` | loaded | `ctx://` parser, canonicalizer, decoded query handling, malformed URL diagnostics. |
| `src/core/types.ts` | loaded | Scan result, link candidate, diagnostic, and source range schemas. |
| `test/ms1.test.ts` | loaded | Critical-path scanner/parser, fail-closed, and CLI diagnostic regression coverage. |
| `test/wp2.test.ts` | loaded | Link-form, canonicalization, registry validation, and diagnostic regression coverage. |
| `fixtures/ms1/**` and `fixtures/wp2/**` | loaded | Current fixture inputs for accepted and rejected scan paths. |

## Current Release Target

Command:

```bash
git status --short --branch
git rev-parse HEAD
git log -1 --pretty=fuller --decorate=short
```

Observed result before this evidence file was authored:

```text
## codex/bel-1180-scanner-url-contract...origin/main
dc8229938bf83a9062a48230c7e6edfba268a3e0
commit dc8229938bf83a9062a48230c7e6edfba268a3e0 (HEAD -> codex/bel-1180-scanner-url-contract, origin/main, origin/HEAD)
Merge: 75cd5c3 b355c2d
Author:     Jason Belmonti <jasonbelmonti@gmail.com>
AuthorDate: Fri May 22 13:30:07 2026 -0500
Commit:     GitHub <noreply@github.com>
CommitDate: Fri May 22 13:30:07 2026 -0500

    Merge pull request #29 from jasonbelmonti/codex/bel-1179-scope-evidence-reconciliation

    [codex] Add BEL-1179 release audit baseline
```

Interpretation:

- The scanner/URL audit target is `origin/main` commit `dc8229938bf83a9062a48230c7e6edfba268a3e0`.
- Local `.codex/**` files are execution and review artifacts for this audit.
- This PR's intended product change is this BEL-1180 evidence artifact.

## Command Evidence

### Targeted Tests

Command:

```bash
node --version
npm --version
npm test -- --run ms1 wp2
```

Observed result:

```text
v22.20.0
11.13.0

> @jasonbelmonti/markdown-context@0.1.0 test
> npm run build && vitest run "--exclude=.worktrees/**" --run ms1 wp2

> @jasonbelmonti/markdown-context@0.1.0 build
> tsc -p tsconfig.json

 RUN  v3.2.4 /Users/jasonbelmonti/Documents/Development/markdown-context/.worktrees/bel-1180

 ✓ test/wp2.test.ts (13 tests) 13ms
 ✓ test/ms1.test.ts (34 tests) 636ms

 Test Files  2 passed (2)
      Tests  47 passed (47)
   Start at  13:33:58
   Duration  1.17s (transform 127ms, setup 0ms, collect 511ms, tests 649ms, environment 0ms, prepare 168ms)
```

Result: pass.

### TypeScript Contract Check

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

### Required Link-Form Scan

Command:

```bash
node dist/cli/index.js scan fixtures/wp2/link-forms.md --pretty
```

Observed result summary:

```text
schemaVersion: markdown-context.scan-result.v0
filePath: fixtures/wp2/link-forms.md
diagnostics: []
links: 7
labels: inline fixture, inline image fixture, definition-only, link-reference, image-reference, reference fixture, image reference fixture
sourceRange: present on all 7 links, including start line/column/offset and end line/column/offset
duplicate canonical reference definitions/usages:
  ctx://repo/path/fixtures/wp2/reference.md?lens=excerpt -> 2 source-located candidates
  ctx://repo/path/fixtures/wp2/image-reference.md?lens=excerpt -> 2 source-located candidates
```

Representative emitted candidate:

```json
{
  "schemaVersion": "markdown-context.scan.v0",
  "label": "inline fixture",
  "url": "ctx://repo/path/fixtures/wp2/inline.md?lens=excerpt",
  "canonicalUrl": "ctx://repo/path/fixtures/wp2/inline.md?lens=excerpt",
  "scheme": "ctx",
  "namespace": "repo",
  "kind": "path",
  "id": "fixtures/wp2/inline.md",
  "requestedLens": "excerpt",
  "params": {},
  "sourcePath": "fixtures/wp2/link-forms.md",
  "sourceRange": {
    "start": { "line": 3, "column": 14, "offset": 39 },
    "end": { "line": 3, "column": 83, "offset": 108 }
  }
}
```

Result: pass. The CLI scan output confirms required Markdown link forms are discovered through the scanner with source ranges and no diagnostics.

### Required Link-Form Validation

Command:

```bash
node dist/cli/index.js validate fixtures/wp2/link-forms.md --registry fixtures/wp2/registry.json --pretty
```

Observed result summary:

```text
schemaVersion: markdown-context.validate-result.v0
valid: true
diagnostics: []
links: 7
selectedLens: excerpt on all 7 links
sourceRange: preserved on all 7 validated links
```

Result: pass. This confirms scanner output feeds validation without losing source locations.

### Duplicate Decoded Parameter Rejection

Command:

```bash
node dist/cli/index.js validate fixtures/ms1/duplicate-param.md --registry fixtures/ms1/registry.json --pretty
```

Observed result:

```json
{
  "diagnostics": [
    {
      "code": "ctx.param.duplicate",
      "message": "Duplicate context URL parameter: lens",
      "severity": "error",
      "sourceRange": {
        "start": { "line": 3, "column": 44, "offset": 79 },
        "end": { "line": 3, "column": 137, "offset": 172 }
      },
      "url": "ctx://repo/path/fixtures/ms1/context-source.md?lens=excerpt&lens=excerpt"
    }
  ],
  "links": [],
  "schemaVersion": "markdown-context.validate-result.v0",
  "valid": false
}
```

Result: expected failure with exit code 1. Duplicate decoded parameters do not produce accepted scan links.

### Parser Probe For Malformed, Incomplete, And Equivalent URLs

Command:

```bash
node --input-type=module - <<'EOF'
import { parseContextUrl } from './dist/core/context-url.js';
const samples = [
  'ctx://repo/path/%E0%A4%A?lens=excerpt',
  'ctx://repo/path/fixtures/ms1/context-source.md?lens=excerpt&%6Cens=full',
  'ctx://repo/path/fixtures/wp2/inline.md?z=last&section=intro&lens=excerpt',
  'ctx://repo/path/fixtures/wp2/inline.md?lens=excerpt&section=intro&z=last',
  'ctx://repo',
];
for (const sample of samples) {
  const result = parseContextUrl(sample, { start: { line: 1, column: 1 }, end: { line: 1, column: sample.length + 1 } });
  console.log(JSON.stringify({ sample, canonicalUrl: result.parsed?.canonicalUrl, diagnostics: result.diagnostics.map(({ code, severity }) => ({ code, severity })) }));
}
EOF
```

Observed result:

```text
{"sample":"ctx://repo/path/%E0%A4%A?lens=excerpt","diagnostics":[{"code":"ctx.url.invalid","severity":"error"}]}
{"sample":"ctx://repo/path/fixtures/ms1/context-source.md?lens=excerpt&%6Cens=full","canonicalUrl":"ctx://repo/path/fixtures/ms1/context-source.md?lens=excerpt","diagnostics":[{"code":"ctx.param.duplicate","severity":"error"}]}
{"sample":"ctx://repo/path/fixtures/wp2/inline.md?z=last&section=intro&lens=excerpt","canonicalUrl":"ctx://repo/path/fixtures/wp2/inline.md?lens=excerpt&section=intro&z=last","diagnostics":[]}
{"sample":"ctx://repo/path/fixtures/wp2/inline.md?lens=excerpt&section=intro&z=last","canonicalUrl":"ctx://repo/path/fixtures/wp2/inline.md?lens=excerpt&section=intro&z=last","diagnostics":[]}
{"sample":"ctx://repo","diagnostics":[{"code":"ctx.url.incomplete","severity":"error"}]}
```

Result: pass. Malformed path escapes and incomplete URLs emit error diagnostics. Equivalent query parameter order canonicalizes to the same identity. Duplicate decoded params still return an error diagnostic; the scanner excludes parsed results that have any error diagnostic.

## Scanner Contract Findings

### Public `markdown-engine` API Use

Source references:

- `src/core/scan.ts:3` imports `documentQueries`, `normalize`, `parse`, and `EngineLinkReference` from `@jasonbelmonti/markdown-engine`.
- `src/core/scan.ts:20` parses Markdown with `parse(markdown, ...)`.
- `src/core/scan.ts:22` normalizes through `normalize(parseResult.parsed, { documentVersion: "1.0.0" })`.
- `src/core/scan.ts:26` iterates `documentQueries.linkReferences(normalized.document)`.

Audit result: pass.

The scanner consumes package-level public `markdown-engine` APIs. No custom Markdown traversal, private engine import, AST visitor, URL execution, OS handler dispatch, network call, or process spawn appears in the scanner path. The source inspection query found the scanner's only `markdown-engine` dependency at `src/core/scan.ts:3`.

### Context URL Discovery And Source-Range Requirement

Source references:

- `src/core/scan.ts:26` processes only engine-provided link references.
- `src/core/scan.ts:27` skips non-`ctx:` URLs.
- `src/core/scan.ts:31` reads `reference.sourceRange`.
- `src/core/scan.ts:32` through `src/core/scan.ts:39` emit `ctx.sourceRange.unavailable` and skip the candidate when the engine does not provide source range data.
- `src/core/scan.ts:49` through `src/core/scan.ts:64` emit accepted candidates only after parsing succeeds and include `schemaVersion`, label, raw URL, canonical URL, parsed URL parts, optional requested lens, params, source path, and a cloned source range.
- `src/core/types.ts:24` through `src/core/types.ts:37` require every `ContextLinkCandidate` to carry `schemaVersion`, `label`, `url`, `canonicalUrl`, parsed URL fields, `params`, optional `sourcePath`, and `sourceRange`.

Test references:

- `test/wp2.test.ts:11` through `test/wp2.test.ts:34` verify required Markdown link forms produce 7 candidates, no diagnostics, positive start/end source lines, labels, and duplicate canonical URLs for definition plus usage pairs.
- `fixtures/wp2/link-forms.md:3` through `fixtures/wp2/link-forms.md:15` cover inline links, inline images, definition-only references, link reference definitions, image reference definitions, link reference usages, and image reference usages.
- `test/ms1.test.ts:19` through `test/ms1.test.ts:36` verify the critical fixture scans one `ctx://repo/path` link with source range.
- `test/ms1.test.ts:53` through `test/ms1.test.ts:95` independently cover link-like Markdown references and positive source ranges.

Audit result: pass.

Supported link forms are source-located. If `markdown-engine` ever reports a `ctx:` URL without `sourceRange`, the scanner records an error diagnostic and does not emit that candidate. The required fixture forms are covered by automated tests and current CLI output.

### Label And Scan Schema

Source references:

- `src/core/scan.ts:49` through `src/core/scan.ts:64` define accepted scan candidate fields.
- `src/core/scan.ts:67` through `src/core/scan.ts:72` define the scan-result schema as `markdown-context.scan-result.v0`, with `links` and `diagnostics`.
- `src/core/scan.ts:93` through `src/core/scan.ts:101` chooses labels from reference text, alt text, definition label, identifier, URL, or empty string.

Test references:

- `test/wp2.test.ts:19` through `test/wp2.test.ts:28` verify expected labels for all required link forms.
- CLI scan evidence above confirms emitted `schemaVersion` and source fields.

Audit result: pass.

The scanner result schema and labels are deterministic for the covered link reference forms.

## Context URL Contract Findings

### Parsing, Normalization, And Incomplete URLs

Source references:

- `src/core/context-url.ts:19` through `src/core/context-url.ts:27` parse with the platform `URL` constructor and emit `ctx.url.invalid` on constructor failure.
- `src/core/context-url.ts:29` through `src/core/context-url.ts:31` lower-case the protocol and ignore non-`ctx` schemes.
- `src/core/context-url.ts:35` lower-cases the namespace host.
- `src/core/context-url.ts:36` through `src/core/context-url.ts:47` split and percent-decode path segments and emit `ctx.url.invalid` on malformed escapes.
- `src/core/context-url.ts:50` through `src/core/context-url.ts:61` require namespace, kind, and id, otherwise emitting `ctx.url.incomplete`.

Test and command references:

- `test/wp2.test.ts:36` through `test/wp2.test.ts:53` verify mixed-case scheme/namespace and decoded path canonicalization.
- `test/ms1.test.ts:140` through `test/ms1.test.ts:151` verify malformed path escapes produce `ctx.url.invalid` and no links.
- Parser probe above verifies `ctx://repo` produces `ctx.url.incomplete`.

Audit result: pass.

Malformed path escapes and incomplete URLs fail closed with diagnostics. No malformed or incomplete parser input is accepted as a scanner link when an error diagnostic is present.

### Query Param Decoding, Duplicate Handling, And Case Sensitivity

Source references:

- `src/core/context-url.ts:63` through `src/core/context-url.ts:87` use decoded `URLSearchParams.entries()`, track decoded keys in `seen`, emit `ctx.param.duplicate` for duplicates, treat `lens` specially, and preserve other params.
- `src/core/context-url.ts:89` through `src/core/context-url.ts:100` sort params before building the parsed output and canonical URL.
- `src/core/context-url.ts:156` through `src/core/context-url.ts:168` build params from a null-prototype object, keeping prototype-named params visible to validation.

Test references:

- `test/ms1.test.ts:112` through `test/ms1.test.ts:121` verify decoded keys and case-sensitive keys sort deterministically as `A`, `a`, `lens`, `z`.
- `test/ms1.test.ts:123` through `test/ms1.test.ts:138` verify equivalent query parameter order produces identical canonical URLs and preserves case-sensitive keys.
- `test/ms1.test.ts:153` through `test/ms1.test.ts:166` verify `%6Cens` is decoded to duplicate `lens`, emits `ctx.param.duplicate`, and produces no links.
- `test/ms1.test.ts:168` through `test/ms1.test.ts:194` verify scan errors are not lost by the fail-closed public validation path.
- `test/ms1.test.ts:443` through `test/ms1.test.ts:464` verify prototype-named params remain visible and are rejected by validation instead of disappearing into object prototypes.

Audit result: pass.

Duplicate decoded params do not produce accepted scan links. Case-sensitive keys remain distinct. Query params are sorted by deterministic code-unit ordering before canonical output.

### Canonical URL Stability And Omitted Lenses

Source references:

- `src/core/context-url.ts:105` through `src/core/context-url.ts:129` encode canonical id path segments, omit empty lens values, sort all query entries, and return a canonical `ctx://namespace/kind/id` URL.
- `src/core/context-url.ts:131` through `src/core/context-url.ts:154` compare query entries by code-unit key and value ordering.

Test references:

- `test/ms1.test.ts:97` through `test/ms1.test.ts:110` verify `lens` sorts consistently with other query params.
- `test/ms1.test.ts:112` through `test/ms1.test.ts:138` verify decoded query keys, case-sensitive keys, and equivalent query order.
- `test/wp2.test.ts:55` through `test/wp2.test.ts:69` verify equivalent query order for WP-2 fixtures.
- `test/ms1.test.ts:413` through `test/ms1.test.ts:441` verify an omitted `lens` remains omitted from the scan canonical URL, then validation selects the registry default lens and resolution records `selectedLens: "excerpt"`.

Audit result: pass.

Canonical URLs are stable for query order, decoded keys, case-sensitive keys, and omitted lenses. The parser does not silently add the registry default lens to scanner canonical identity; that selection happens later in validation/resolution metadata.

### Rejection Before Validation Or Resolution

Source references:

- `src/core/scan.ts:42` parses each context URL with its source range.
- `src/core/scan.ts:43` preserves parser diagnostics in the scan result.
- `src/core/scan.ts:45` through `src/core/scan.ts:47` skip candidates when parsing fails or any parser diagnostic has severity `error`.
- `src/core/scan.ts:89` through `src/core/scan.ts:91` define the error gate used by the scanner.

Test references:

- `test/ms1.test.ts:168` through `test/ms1.test.ts:194` verify duplicate-param scan diagnostics yield zero scan links and public validation returns `valid: false`.
- `test/ms1.test.ts:210` through `test/ms1.test.ts:225` verify duplicate-param inputs cannot resolve through the public API.
- `test/ms1.test.ts:546` through `test/ms1.test.ts:568` verify CLI `validate` returns scan diagnostics for duplicate params.
- `test/ms1.test.ts:570` through `test/ms1.test.ts:593` verify CLI `resolve` does not resolve links from a scan result with errors.

Audit result: pass.

Malformed and duplicate-param `ctx://` inputs are rejected in the scan phase before accepted candidates can enter validation or resolution.

## Coverage Classification

| Area | Current coverage | Release impact | Notes |
| --- | --- | --- | --- |
| Public engine API use | Source inspection and dependency query | non-blocking after this artifact | Scanner imports from the package root and uses public `documentQueries.linkReferences`. |
| Required Markdown link forms | Automated tests plus CLI scan/validate command output | non-blocking | Inline links, inline images, definitions, reference definitions, and reference usages are covered with source ranges. |
| Missing sourceRange branch | Source fail-closed branch only | non-blocking follow-up | No synthetic regression test forces `markdown-engine` to omit `sourceRange`; required public link forms currently provide source ranges, and source code skips missing-range candidates. |
| Malformed path escapes | Automated test and parser probe | non-blocking | `ctx.url.invalid` covered by `test/ms1.test.ts`. |
| Incomplete URL diagnostics | Parser probe and source inspection | non-blocking follow-up | `ctx.url.incomplete` branch is not directly asserted by the automated suite. Add a focused parser test if later reviewers require branch-level coverage. |
| Duplicate decoded params | Automated tests, CLI validation, parser probe | non-blocking | Duplicate `lens` and encoded `%6Cens` are rejected with no accepted links. |
| Query canonicalization | Automated tests and parser probe | non-blocking | Query order, decoded keys, case-sensitive keys, and omitted lens behavior are covered. |
| Registry, resolver, package, final release synthesis | Out of scope | non-blocking | Covered by sibling audit tracks and parent `BEL-1178`. |

## Audit Verdict

Recommendation: accept the Group 2 scanner and context URL contract for the read-side MVP release boundary.

No release-blocking scanner or context URL defect was found inside `BEL-1180` scope. Current source and tests support the following conclusions:

- Scanner extraction uses public `markdown-engine` APIs and does not custom-traverse Markdown or execute links.
- Required Markdown link forms are source-located; missing source ranges are coded to fail closed with `ctx.sourceRange.unavailable`.
- Context URL canonicalization is deterministic for query order, decoded keys, case-sensitive keys, and omitted lenses.
- Malformed path escapes, incomplete URLs, and duplicate decoded params produce error diagnostics.
- Scan-phase parser errors prevent links from entering validation or resolution.

Approval of this artifact does not approve registry policy, resolver behavior, package publication, final release readiness, or future link forms.

## Follow-up / Non-Blocking Work

- Consider adding a direct parser regression test for `ctx.url.incomplete`.
- Consider adding a synthetic scanner regression test for `ctx.sourceRange.unavailable` if `markdown-engine` exposes a stable way to construct a missing-sourceRange link reference.
- Keep future schemes, richer lenses, and broader link forms out of the current release approval unless a sibling audit track promotes them with current-source evidence.
