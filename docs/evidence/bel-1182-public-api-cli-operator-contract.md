# BEL-1182 Public API And CLI Operator Contract

Date: 2026-05-22

## Verdict

APPROVE for the BEL-1182 public API and CLI operator-contract release boundary after the CLI preflight/runtime diagnostic gap and the `--lockfile-out` validation-diagnostic masking gap were fixed in this branch.

This approval is limited to the package root export surface, public `resolveScanResult` composition, CLI command routing and option validation, CLI stdout/stderr/exit behavior, mixed valid and invalid input handling, and lockfile flags at the operator boundary. It does not approve scanner internals, registry policy, full resolver path safety, package publication, release tagging, or future MCP/write-side behavior.

## Source Authority

| Source | Status | Evidence |
| --- | --- | --- |
| Linear `BEL-1182` | loaded | Defines the audit objective, source authority, scope, success criteria, and review boundary. |
| Linear `BEL-1178` | loaded | Parent release-readiness audit program; prohibits release publication, tagging, and release-state mutation. |
| `src/index.ts` | reviewed | Defines supported package root exports. |
| `src/pipeline/resolve.ts` | reviewed | Defines public `resolveScanResult` composition. |
| `src/cli/index.ts` | changed | CLI now emits structured JSON for thrown preflight/runtime failures, keeps validate-before-resolve behavior, and reports lockfile write failures without hiding validation diagnostics. |
| `src/cli/options.ts` | changed | CLI usage failures now carry stable machine-readable diagnostic codes. |
| `src/cli/errors.ts` | added | Converts thrown CLI failures into `markdown-context.cli-error.v0` JSON bodies. |
| `src/cli/json.ts` | reviewed | CLI error bodies and normal results use the same stable JSON serializer. |
| `package.json` | reviewed | Root package exports only `"."`; deep imports are not part of the supported package export surface. |
| `test/cli.test.ts` | changed | Covers structured CLI error output, mixed-error resolve, lockfile output, and deterministic CLI behavior. |
| `test/ms1.test.ts` | reviewed | Covers root API export safety and public fail-closed resolve behavior. |

## Public Root API Findings

`src/index.ts:25` exports `scanMarkdown` as the scanner entrypoint. `src/index.ts:39` exports `loadRegistry` and `validateScanResult`. `src/index.ts:40` exports `resolveScanResult`.

`src/index.ts` does not root-export `validateContextLinks` or `resolveRepoPathLink`. `package.json:10` through `package.json:15` declare only the package root export, so internal deep imports are unsupported package-contract surface.

Test coverage:

- `test/ms1.test.ts:196` through `test/ms1.test.ts:201` proves the root API omits `validateContextLinks` and exposes `validateScanResult`.
- `test/ms1.test.ts:203` through `test/ms1.test.ts:208` proves the root API omits `resolveRepoPathLink` and exposes `resolveScanResult`.

Assessment: normal root package consumers are guided through scan-result validation and are not given a root-exported raw resolver helper that bypasses validation. Unsupported deep imports remain out of the public package contract.

## Public Resolve Findings

`src/pipeline/resolve.ts:15` through `src/pipeline/resolve.ts:20` define `resolveScanResult(scanResult, registry, options)` and call `validateScanResult` before resolver dispatch.

`src/pipeline/resolve.ts:21` through `src/pipeline/resolve.ts:27` return zero artifacts, propagated validation diagnostics, and an empty lockfile when requested if the whole scan result is invalid.

`src/pipeline/resolve.ts:30` through `src/pipeline/resolve.ts:44` dispatch only the validated links returned by `validateScanResult`, then merges validation and resolver diagnostics in the final resolve result.

Test coverage:

- `test/ms1.test.ts:210` through `test/ms1.test.ts:225` keeps rejected scan inputs from resolving through the root public API.
- `test/ms1.test.ts:227` through `test/ms1.test.ts:242` keeps registry-rejected inputs from resolving through the root public API.
- `test/ms1.test.ts:244` through `test/ms1.test.ts:267` keeps mixed accepted and registry-rejected inputs from emitting artifacts or lockfile records through the root public API.
- `test/ms1.test.ts:269` through `test/ms1.test.ts:288` proves valid links still resolve through the public safe pipeline.

Assessment: public `resolveScanResult` validates the whole `ScanResult` before artifact production. No public root resolver bypass remains inside the BEL-1182 boundary.

## CLI Routing And Option Validation Findings

`src/cli/index.ts:36` through `src/cli/index.ts:47` parse the command, parse options, validate command-specific option compatibility, then read the target Markdown file. This order rejects unknown commands/options and unsupported command-specific flags before file or registry IO.

`src/cli/options.ts:38` through `src/cli/options.ts:130` assign stable diagnostic codes to missing commands, unknown commands, duplicate options, missing option values, unknown options, positional count failures, unsupported command-specific options, and missing required registry options.

Test coverage:

- `test/cli.test.ts:17` through `test/cli.test.ts:35` proves unknown commands exit `2`, emit `cli.command.unknown`, include usage, and do not attempt file IO or registry checks.
- `test/cli.test.ts:37` through `test/cli.test.ts:55` proves unknown options exit `2` and emit `cli.option.unknown`.
- `test/cli.test.ts:75` through `test/cli.test.ts:111` proves unsupported command-specific flags are rejected instead of ignored.
- `test/cli.test.ts:113` through `test/cli.test.ts:141` proves validate and resolve require `--registry <path>` before execution continues.

Assessment: CLI preflight now fails before IO where required and reports parseable operator diagnostics.

## Machine-Readable Diagnostics And Exit Semantics

`src/cli/errors.ts:4` through `src/cli/errors.ts:18` define the structured CLI error result schema `markdown-context.cli-error.v0` with diagnostics and optional usage.

`src/cli/errors.ts:20` through `src/cli/errors.ts:34` map usage errors to their stable diagnostic codes and map other thrown failures to `cli.execution.failed`.

`src/cli/index.ts:23` through `src/cli/index.ts:30` write all normal result bodies and thrown error bodies to stdout through stable JSON, leave stderr empty for handled CLI outcomes, and set exit code `2` for thrown preflight/runtime failures.

`src/cli/index.ts:49` through `src/cli/index.ts:51`, `src/cli/index.ts:61` through `src/cli/index.ts:65`, and `src/cli/index.ts:115` through `src/cli/index.ts:123` preserve existing result-body exit behavior for scan, validate, and resolve: exit `1` when diagnostics contain an error and exit `0` otherwise.

Test coverage:

- `test/cli.test.ts:164` through `test/cli.test.ts:178` proves file IO failures emit machine-readable `markdown-context.cli-error.v0` diagnostics.
- `test/cli.test.ts:769` through `test/cli.test.ts:777` defines the expected CLI error result shape for tests.
- `test/cli.test.ts:835` through `test/cli.test.ts:843` proves CLI error bodies are parseable JSON with error diagnostics and empty stderr.
- `test/ms1.test.ts:546` through `test/ms1.test.ts:568` proves validate returns scan diagnostics in structured JSON with exit `1`.
- `test/ms1.test.ts:570` through `test/ms1.test.ts:593` proves resolve returns scan diagnostics in structured JSON with zero artifacts and exit `1`.
- `test/ms1.test.ts:595` through `test/ms1.test.ts:633` proves unresolved repo paths return structured resolver diagnostics.

Assessment: the previous release-blocking gap for unparseable failed-preflight diagnostics is fixed. Operators can parse stdout JSON across handled success, validation failure, resolution failure, preflight failure, and runtime failure paths.

## Mixed Valid And Invalid Input Classification

`src/cli/index.ts:58` through `src/cli/index.ts:60` loads the registry and validates the complete scan result before `validate` or `resolve` output.

`src/cli/index.ts:76` through `src/cli/index.ts:91` returns a `markdown-context.resolve-result.v0` body with zero artifacts, validation diagnostics, any `--lockfile-out` write diagnostic, and an empty stdout lockfile when requested if validation is invalid.

Test coverage:

- `test/cli.test.ts:660` through `test/cli.test.ts:680` proves invalid registry input produces no lockfile records.
- `test/cli.test.ts:682` through `test/cli.test.ts:718` proves validation diagnostics remain visible when `--lockfile-out` cannot be written.
- `test/cli.test.ts:720` through `test/cli.test.ts:760` proves mixed valid plus registry-rejected input exits `1`, emits zero artifacts, includes `ctx.param.unsupported`, and emits zero lockfile records.
- `test/ms1.test.ts:635` through `test/ms1.test.ts:677` covers the same mixed-error CLI fail-closed behavior in the MS-1 suite.

Classification: acceptable release behavior. Mixed valid and invalid inputs are fail-closed for artifact output and lockfile records. Diagnostics remain structured and machine-readable, and `--lockfile-out` write failures are appended rather than replacing validation diagnostics.

## Lockfile Flag Findings

`src/cli/index.ts:70` through `src/cli/index.ts:74` derive `--lockfile`, `--lockfile-out`, and the lockfile-requested state.

`src/cli/index.ts:94` through `src/cli/index.ts:104` request lockfile metadata from the resolver when stdout lockfile output or lockfile file output is requested.

`src/cli/index.ts:110` through `src/cli/index.ts:123` write a lockfile to `--lockfile-out` when requested and include the lockfile in stdout only when `--lockfile` is set.

`src/cli/index.ts:141` through `src/cli/index.ts:157` convert lockfile write failures into `cli.lockfile.writeFailed` diagnostics instead of throwing away validation or resolver diagnostics.

Test coverage:

- `test/cli.test.ts:429` through `test/cli.test.ts:470` proves `--lockfile-out` writes canonical lockfile data without changing resolve stdout.
- `test/cli.test.ts:472` through `test/cli.test.ts:508` proves `--lockfile-out` outputs are stable across relative and absolute Markdown paths.
- `test/cli.test.ts:511` through `test/cli.test.ts:607` proves lockfile output remains stable across invocation working directories and symlinked repo root aliases.
- `test/cli.test.ts:682` through `test/cli.test.ts:718` proves `--lockfile-out` write failure appends `cli.lockfile.writeFailed` while preserving `ctx.param.unsupported`.

Assessment: lockfile flags remain deterministic and do not hide validation failure behavior, including when the requested lockfile output path cannot be written.

## Command Evidence

### Targeted Tests

Command:

```bash
npm test -- --run cli ms1
```

Output:

```text
> @jasonbelmonti/markdown-context@0.1.0 test
> npm run build && vitest run "--exclude=.worktrees/**" --run cli ms1

> @jasonbelmonti/markdown-context@0.1.0 build
> tsc -p tsconfig.json

 RUN  v3.2.4 /Users/jasonbelmonti/Documents/Development/markdown-context/.worktrees/bel-1182

 ✓ test/ms1.test.ts (35 tests) 665ms
 ✓ test/cli.test.ts (25 tests) 3910ms

 Test Files  2 passed (2)
      Tests  60 passed (60)
```

Result: pass.

### TypeScript Contract Check

Command:

```bash
npm run typecheck
```

Output:

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

Output:

```text
> @jasonbelmonti/markdown-context@0.1.0 test
> npm run build && vitest run "--exclude=.worktrees/**"

> @jasonbelmonti/markdown-context@0.1.0 build
> tsc -p tsconfig.json

 RUN  v3.2.4 /Users/jasonbelmonti/Documents/Development/markdown-context/.worktrees/bel-1182

 ✓ test/source-path.test.ts (5 tests) 16ms
 ✓ test/lockfile.test.ts (10 tests) 6ms
 ✓ test/wp2.test.ts (13 tests) 35ms
 ✓ test/repo-path.test.ts (14 tests) 119ms
 ✓ test/ms1.test.ts (35 tests) 1317ms
 ✓ test/cli.test.ts (25 tests) 4634ms

 Test Files  6 passed (6)
      Tests  102 passed (102)
```

Result: pass.

### Required CLI Probes

Command:

```bash
node --input-type=module <probe script>
```

Observed summarized output, including the lockfile-write failure probe added after consensus review identified the masking gap:

```json
{
  "results": [
    {
      "label": "unknown command",
      "code": 2,
      "stdout": {
        "schemaVersion": "markdown-context.cli-error.v0",
        "diagnostics": [
          {
            "code": "cli.command.unknown",
            "message": "Unknown command: inspect.",
            "severity": "error"
          }
        ],
        "usage": [
          "Usage:",
          "  markdown-context scan <markdown-file> [--pretty]",
          "  markdown-context validate <markdown-file> --registry <registry.json> [--pretty]",
          "  markdown-context resolve <markdown-file> --registry <registry.json> [--repo-root <path>] [--lockfile] [--lockfile-out <path>] [--pretty]"
        ]
      },
      "stderr": ""
    },
    {
      "label": "unknown option",
      "code": 2,
      "stdout": {
        "schemaVersion": "markdown-context.cli-error.v0",
        "diagnostics": [
          {
            "code": "cli.option.unknown",
            "message": "Unknown option: --format.",
            "severity": "error"
          }
        ]
      },
      "stderr": ""
    },
    {
      "label": "missing scan file",
      "code": 2,
      "stdout": {
        "schemaVersion": "markdown-context.cli-error.v0",
        "diagnostics": [
          {
            "code": "cli.execution.failed",
            "message": "ENOENT: no such file or directory, open 'missing.md'",
            "severity": "error"
          }
        ]
      },
      "stderr": ""
    },
    {
      "label": "validate rejected scan",
      "code": 1,
      "stdout": {
        "schemaVersion": "markdown-context.validate-result.v0",
        "valid": false,
        "links": 0,
        "diagnostics": [
          {
            "code": "ctx.param.duplicate",
            "severity": "error"
          }
        ]
      },
      "stderr": ""
    },
    {
      "label": "resolve mixed valid and invalid",
      "code": 1,
      "stdout": {
        "schemaVersion": "markdown-context.resolve-result.v0",
        "artifacts": 0,
        "diagnostics": [
          {
            "code": "ctx.param.unsupported",
            "severity": "error"
          }
        ],
        "lockfileRecords": 0,
        "hasLockfile": true
      },
      "stderr": ""
    },
    {
      "label": "resolve validation plus lockfile-out write failure",
      "code": 1,
      "stdout": {
        "schemaVersion": "markdown-context.resolve-result.v0",
        "artifacts": 0,
        "diagnostics": [
          {
            "code": "ctx.param.unsupported",
            "severity": "error"
          },
          {
            "code": "cli.lockfile.writeFailed",
            "severity": "error"
          }
        ],
        "hasLockfile": false
      },
      "stderr": ""
    },
    {
      "label": "resolve with lockfile",
      "code": 0,
      "stdout": {
        "schemaVersion": "markdown-context.resolve-result.v0",
        "artifacts": 1,
        "diagnostics": [],
        "lockfileRecords": 1,
        "hasLockfile": true
      },
      "stderr": ""
    },
    {
      "label": "resolve with lockfile-out",
      "code": 0,
      "stdout": {
        "schemaVersion": "markdown-context.resolve-result.v0",
        "artifacts": 1,
        "diagnostics": [],
        "hasLockfile": false
      },
      "stderr": ""
    }
  ],
  "lockfileOutRecords": 1
}
```

Result: pass.

## Follow-Up / Non-blocking Work

- README or usage documentation may later describe `markdown-context.cli-error.v0`, but current command behavior and tests are unambiguous from release artifacts.
- Future MCP, write-side, or mission command behavior remains outside this release boundary.
