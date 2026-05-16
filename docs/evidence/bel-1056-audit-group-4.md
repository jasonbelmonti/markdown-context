# BEL-1056 Audit Group 4 Evidence

Issue: `BEL-1056`

Scope: CLI orchestration and operator behavior after merged read-side MVP work. Primary audit targets were `src/cli/index.ts`, `src/cli/options.ts`, `src/cli/json.ts`, `package.json`, and CLI-facing tests.

## Objective

Audit the CLI orchestration layer so `scan`, `validate`, and `resolve` behave predictably for agent preflight usage and fail with clear exit semantics.

## Findings

### F-1: Command routing and argument validation now fail before file reads

Recommendation: Accept and fix.

Evidence:

- Before this audit, unknown commands and unsupported options could pass into the shared command body before the CLI had established a valid command contract.
- `src/cli/index.ts:26` now parses and validates the command before option validation.
- `src/cli/index.ts:27` parses options before any target file read.
- `src/cli/index.ts:28` validates the command-specific option contract before any target file read.
- `src/cli/index.ts:36` reads the Markdown file only after command and option validation have succeeded.
- `src/cli/options.ts:22` rejects missing commands with usage.
- `src/cli/options.ts:31` rejects unknown commands with usage.
- `src/cli/options.ts:64` rejects unknown options instead of treating them as positional file paths.
- `src/cli/options.ts:74` requires exactly one Markdown file positional.
- `src/cli/options.ts:79` rejects command-specific options that would otherwise be ignored.
- `src/cli/options.ts:86` enforces required value options for `validate` and `resolve`.
- `test/cli.test.ts:13` covers unknown command rejection before file IO or registry checks.
- `test/cli.test.ts:27` covers unknown option rejection.
- `test/cli.test.ts:41` covers extra positional rejection.
- `test/cli.test.ts:53` covers ignored-option rejection for `scan` and `validate`.
- `test/cli.test.ts:77` covers required registry enforcement for `validate` and `resolve`.
- `test/cli.test.ts:95` covers duplicate value-option rejection.

### F-2: JSON output stability no longer depends on locale collation

Recommendation: Accept and fix.

Evidence:

- Before this audit, `src/cli/json.ts` sorted JSON object keys with `localeCompare`, which is locale/collation oriented instead of a deterministic code-unit comparator.
- `src/cli/json.ts:5` now compares JSON object keys with direct string code-unit ordering.
- `src/cli/json.ts:15` serializes JSON directly instead of rebuilding normal objects whose integer-like keys would be reordered by `JSON.stringify`.
- `src/cli/json.ts:40` sorts object entries before writing each key/value pair.
- `src/cli/json.ts:43` omits object entries that JSON cannot represent, matching JSON object omission semantics.
- `src/cli/json.ts:44` uses the deterministic comparator for all object key ordering.
- `test/cli.test.ts:129` covers numeric query parameter key ordering in built `scan` CLI output.
- `test/cli.test.ts:191` covers uppercase/lowercase and integer-like key ordering in nested JSON output.

### F-3: Resolve repo-root behavior and diagnostic merging are command-level covered

Recommendation: Accept.

Evidence:

- `src/cli/index.ts:60` defaults `resolve --repo-root` to `process.cwd()` when omitted.
- `src/cli/index.ts:64` merges validation diagnostics with resolver diagnostics for `resolve`.
- `src/cli/index.ts:70` returns the resolver body with the merged diagnostics array.
- `src/cli/index.ts:71` exits non-zero when either validation or resolver diagnostics contain an error.
- `test/cli.test.ts:110` covers current-working-directory repo-root default behavior.
- `test/cli.test.ts:152` covers merged validation and resolver diagnostics in one `resolve` output.

### F-4: Exit semantics are clear for operator and diagnostic failures

Recommendation: Accept.

Evidence:

- `src/cli/index.ts:17` routes thrown command, option, JSON parse, registry load, and file read failures to `stderr`.
- `src/cli/index.ts:19` sets exit code `2` for thrown operator or infrastructure failures.
- `src/cli/index.ts:39` returns scan JSON on `stdout` and uses diagnostics to choose exit `0` or `1`.
- `src/cli/index.ts:51` returns validate JSON on `stdout` and uses diagnostics to choose exit `0` or `1`.
- `src/cli/index.ts:59` returns resolve JSON on `stdout` and uses merged diagnostics to choose exit `0` or `1`.
- `test/cli.test.ts:13`, `test/cli.test.ts:27`, `test/cli.test.ts:41`, `test/cli.test.ts:53`, `test/cli.test.ts:77`, and `test/cli.test.ts:95` cover operator failures exiting `2` with no stdout payload.
- `test/cli.test.ts:152` covers diagnostic failure exiting `1` with JSON on stdout.

## Validation

Command:

```bash
npm test
```

Result:

- Passed on 2026-05-16 in `.worktrees/bel-1056`.
- `test/ms1.test.ts`: 23 tests passed.
- `test/repo-path.test.ts`: 8 tests passed.
- `test/cli.test.ts`: 10 tests passed.
- Total: 41 tests passed.

## Follow-Up Recommendations

- No blocking follow-up remains for BEL-1056 scope.
- Future CLI expansion should add new commands by extending the command-specific option contract before adding command body behavior, so unsupported options continue to fail before file IO.
