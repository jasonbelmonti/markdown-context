# Markdown Context Read-Side MVP Execution Specification

## Document Control

| Field | Value |
| --- | --- |
| Title | Markdown Context Read-Side MVP: CLI Scan, Validate, and Resolve |
| Status | In Review |
| Execution level | `E2 Standard Execution` |
| Execution level justification | This work creates durable CLI, schema, registry, resolver, lens artifact, lockfile, and package contracts for future agent workflows. It does not qualify for `E1` because the implementation creates reusable internal contracts. It does not trigger `E3` because the approved MVP excludes secrets, auth changes, irreversible migrations, live customer data, mandatory network execution, OS protocol handlers, MCP, and live external connectors. |
| Author(s) | Codex |
| Executor(s) | Implementation agent or engineer assigned to `BEL-1047` |
| Reviewers | Project owner, `markdown-engine` contract reviewer, coding-agent workflow reviewer, security/data reviewer |
| Decision owner | Project owner |
| Target branch, release, or milestone | `markdown-context` read-side MVP implementation |
| Last updated | 2026-05-14 |
| Related source docs | `docs/design/markdown-context-operational-design-spec.md` |
| Related tickets | Linear project `markdown-context MVP`; Linear issue `BEL-1047` |

## 0. Execution Summary

Decision requested: Approve to execute

Approved outcome: Execute `SRC-1` and `SRC-2` by delivering the read-side `markdown-context` MVP: a local TypeScript package and CLI that can `scan`, `validate`, and `resolve` `ctx://repo/path/...` links through `markdown-engine` `linkReferences`, producing deterministic lens and lockfile evidence without MCP or live connectors.

Execution approach: Use a risk-retiring vertical proving slice first, then harden package boundaries around engine-backed scanning, registry validation, offline repo-path resolution, deterministic artifacts, lockfile output, and CLI contracts. Validation is evidence-led: every milestone requires command output, fixture evidence, and human verification before promotion.

Entry condition: The merged design spec on `origin/main`, Linear project `markdown-context MVP`, and Linear issue `BEL-1047` exist before implementation begins.

Top risks or unknowns:

- RISK-1: `markdown-engine` `linkReferences` may not expose enough source metadata for the required `sourceRange` contract in all Markdown link forms.
- RISK-2: Registry parsing, URL canonicalization, resolver output, and lockfile hashing could drift or produce non-byte-identical output.
- Q-3: Generated lens artifacts default to Markdown, JSON, or both; this must be decided before CLI output contract review.

Section status: Complete

## Layer 1: Execution Basis

## 1. Source Authority and Scope

| ID | Source | Authority | Execution implication |
| --- | --- | --- | --- |
| SRC-1 | `docs/design/markdown-context-operational-design-spec.md` on `origin/main` after PR #4 | Approved design authority for `markdown-context` read-side MVP scope, constraints, and sequencing | Implement `ctx://`, `scan`, `validate`, and offline `repo/path` `resolve`; defer `mission`, write-side commands, MCP, OS handlers, and live connectors. |
| SRC-2 | Linear issue `BEL-1047` | Project-management authority for the first implementation work item | Keep execution tied to the `markdown-context MVP` project and satisfy the issue success criteria before completion. |
| SRC-3 | `markdown-engine` public `linkReferences` API from PR #104 | Dependency authority for Markdown parsing and URL-bearing reference extraction | Consume public engine APIs; do not implement custom Markdown traversal or private engine access. |

In scope: TypeScript package scaffold, CLI entrypoint, engine-backed scan, `ctx://` URL parsing and canonicalization, versioned registry schema/config loading, closed-parameter validation, deterministic diagnostics, offline `ctx://repo/path/...` resolver, bounded lens artifact output, lockfile records, fixtures, tests, and agent preflight evidence.

Out of scope: `mission`, `suggest-links`, `insert-link`, MCP transport, OS protocol handlers, browser automation, live Linear/GitHub/network connectors, write-side mutation flows, package publication, and generalized resolver ecosystems.

Definition of done: `BEL-1047` success criteria are satisfied, all `MS-*` gates in this spec have approval evidence, validation artifacts are captured, implementation PR is reviewed and merged, and handoff states what remains for the later mission/write-side milestones.

Re-decision boundaries: Do not reopen `ctx://` as the initial scheme, `repo/path` as the first resolver, CLI-first integration, or the exclusion of MCP/write-side/live connectors without a `DEV-*` deviation approved by the project owner. Escalate any `markdown-engine` API insufficiency before adding custom Markdown parsing.

Section status: Complete

## 2. Objectives and Non-Objectives

| ID | Statement | Completion horizon | Evidence |
| --- | --- | --- | --- |
| OBJ-1 | Provide a local CLI scaffold that runs `markdown-context scan`, `markdown-context validate`, and `markdown-context resolve`. | Read-side MVP merge | EVD-1 / EVD-6 |
| OBJ-2 | Extract `ctx://` candidates through `markdown-engine` `linkReferences` with required Markdown `sourceRange`. | MS-1 / MS-2 | EVD-2 / EVD-8 |
| OBJ-3 | Validate `ctx://` links through a versioned registry with closed parameters and deterministic diagnostics. | MS-1 / MS-2 | EVD-3 |
| OBJ-4 | Resolve offline `ctx://repo/path/...` links into bounded lens artifacts with citations and source identity. | MS-1 / MS-2 | EVD-4 |
| OBJ-5 | Prove deterministic repeated resolve output, registry hashes, and lockfile hashes for identical inputs. | MS-2 | EVD-5 |
| OBJ-6 | Prove a no-MCP agent preflight workflow for `scan`, `validate`, and `resolve`. | MS-3 | EVD-6 |
| NG-1 | This execution will not implement `mission`, mission aggregation, or mission packet rendering. | Entire execution | REV-2 / EVD-7 |
| NG-2 | This execution will not implement `suggest-links`, `insert-link`, write-side mutation, or patch proposal flows. | Entire execution | REV-2 / EVD-7 |
| NG-3 | This execution will not implement MCP, OS protocol handlers, browser automation, live Linear/GitHub/network connectors, or package publication. | Entire execution | REV-2 / REV-3 |

Section status: Complete

## 3. Ownership, Roles, and Decision Points

| Role or person | Responsibility | Required action |
| --- | --- | --- |
| Project owner | Approves scope, milestone gates, deviations, and confirms Q-3 is resolved before MS-2. | Approve |
| Implementation agent or engineer | Executes work packages inside assigned paths and captures evidence. | Execute |
| `markdown-engine` contract reviewer | Verifies public engine API use and no custom Markdown traversal. | Review |
| Coding-agent workflow reviewer | Owns Q-3 output-format decision and verifies local CLI agent preflight without MCP. | Review |
| Security/data reviewer | Verifies links remain inert, prompt-like params fail closed, and source content is bounded data. | Consult |

Decision points:

- DP-1: Before broad implementation, approve or reject `MS-1` critical-path proof.
- DP-2: Before CLI contract review, resolve Q-3 lens artifact default format.
- DP-3: Before merge, approve or reject `MS-2` read-side MVP contract.
- DP-4: Before completion, approve or reject `MS-3` agent preflight and handoff.

Escalation path: If implementation requires custom Markdown parsing, non-local resolver behavior, OS handler execution, live connector calls, write-side mutation, or a change to the initial scheme/resolver decision, pause execution and request project-owner approval through a `DEV-*` deviation before code continues.

Section status: Complete

## 4. Constraints, Assumptions, and Dependencies

| ID | Type | Statement | Owner | Blocking? | Validation or resolution plan |
| --- | --- | --- | --- | --- | --- |
| CON-1 | Constraint | `markdown-context` shall consume `markdown-engine` public APIs for Markdown parsing and `linkReferences`. | Implementation owner | No | Validate with dependency inspection and `VAL-2`. |
| CON-2 | Constraint | The initial context-link scheme shall be `ctx://`. | Project owner | No | Validate with registry fixtures and `VAL-3`. |
| CON-3 | Constraint | The first deterministic resolver shall support offline `repo/path`. | Project owner | No | Validate with `VAL-4` and `VAL-5`. |
| CON-4 | Constraint | MCP, OS handlers, live connectors, `mission`, and write-side commands shall remain out of this execution. | Project owner | No | Validate with review check `REV-2` and boundary inspection. |
| CON-5 | Invariant | Source-derived lens content shall be treated as attributed data, not agent instructions. | Security/data reviewer | No | Validate with hostile-source fixture in `VAL-4` or `VAL-6`. |
| ASM-1 | Assumption | TypeScript on Node.js is acceptable for the package and CLI. | Project owner | No | Confirm through scaffold in `WP-1`; escalate if toolchain selection fails. |
| ASM-2 | Assumption | `markdown-engine` source ranges are sufficient for required Markdown scan output. | Implementation owner | No | Retire the critical-path fixture in `MS-1`; retire full Markdown link-form coverage in `MS-2`; escalate if source metadata is missing at the applicable gate. |
| DEP-1 | Dependency | Linear project `markdown-context MVP` and issue `BEL-1047` exist. | Project owner | No | Satisfied before this spec was authored. |
| DEP-2 | Dependency | Q-3 lens artifact default format must be resolved before CLI output contract review. | Agent workflow reviewer | Yes for `MS-2`, no for `WP-1` | Decide at `MS-1` or before `MS-2`; record decision in implementation PR. |

Section status: Complete

## Layer 2: Execution Plan

## 5. Evidence-Led Execution Model

Observable outcome: A coding agent or human can run local CLI commands against a Markdown file containing `ctx://repo/path/...`, inspect scan and validation output, resolve the link to a bounded lens artifact, and verify deterministic lockfile evidence without MCP or network access.

Core value proposition: This proves the smallest useful `markdown-context` loop: Markdown references become portable, typed, validated, and resolvable context packets that agents can consume through files and shell commands.

Critical path hypothesis: If `markdown-engine` can provide source-located link references, then `markdown-context` can parse one `ctx://repo/path/...` link, validate it through a minimal registry, resolve it from a checked-in file, and emit deterministic lens and lockfile bytes. Failure on this path invalidates the MVP architecture earlier than building broad command coverage.

First proving slice: `WP-1` builds the smallest package/CLI and fixture that exercises `scan -> validate -> resolve` for one `ctx://repo/path/...` link and captures `EVD-1` through `EVD-4` for `MS-1`.

Sequencing principle: Risk retirement first, then progressive value. The first slice crosses the full approved path before broadening fixtures, diagnostics, canonicalization, and agent preflight.

Validation cadence: Each work package must produce targeted validation evidence before the next milestone gate. `WP-1` proves critical path, `WP-2` broadens scan/validation contracts, `WP-3` hardens resolver determinism and lockfiles, and `WP-4` proves agent preflight and handoff.

Deferred completeness: Mission aggregation, write-side commands, MCP adapters, live connectors, package publication, generalized resolver plug-ins, and exhaustive non-Markdown source support are deferred until after the read-side MVP passes.

Primary risks and unknowns:

| ID | Risk or unknown | Why it matters | Owner | Evidence required to retire | Decision gate |
| --- | --- | --- | --- | --- | --- |
| RISK-1 | Engine source metadata is insufficient for required Markdown `sourceRange`. | Scan output contract requires source locations for agent review and diagnostics. | Implementation owner | `VAL-2` proves the critical-path fixture before `MS-1`; `VAL-8` proves inline links, images, definitions, link reference usages, and image reference usages before `MS-2`. | MS-1 / MS-2 |
| RISK-2 | Canonicalization and hashing are non-deterministic. | Deterministic lens and lockfile proof is the central product claim. | Implementation owner | `VAL-5` repeated-run byte comparison and lockfile hash evidence. | MS-2 |
| RISK-3 | Resolver output can blur source data into agent instructions. | Hostile source content must remain evidence, not operating instructions. | Security/data reviewer | `VAL-4` or `VAL-6` hostile-source fixture and review. | MS-2 |
| Q-3 | Lens artifacts default to Markdown, JSON, or both. | CLI output contract and snapshots need one default before contract review. | Agent workflow reviewer | Explicit decision recorded in `EVD-7` or implementation PR notes. | Before MS-2 |

Section status: Complete

## 6. Change Surface Inventory

| ID | Surface | Change type | Owner | Read/write boundary | Review expectation |
| --- | --- | --- | --- | --- | --- |
| SURF-1 | Package scaffold and toolchain (`package.json`, tsconfig, test config, CLI bin config) | Code / Config | Implementation owner | Write during `WP-1`; no unrelated package publication metadata beyond local MVP needs. | REV-2 |
| SURF-2 | Core scanning and link model (`src/core` or equivalent) | Code / Contract | Implementation owner | Write public internal types and scan functions; read design spec and engine docs. | REV-2 / REV-3 |
| SURF-3 | Registry validation and diagnostics (`src/registry`, `src/diagnostics` or equivalent) | Code / Contract | Implementation owner | Write minimal registry schema, parser, and deterministic diagnostics. | REV-2 / REV-3 |
| SURF-4 | Repo-path resolver, lens renderer, lockfile writer (`src/resolvers`, `src/lens`, `src/lockfile` or equivalent) | Code / Contract | Implementation owner | Write offline resolver, bounded renderer, and deterministic lockfile records only. | REV-2 / REV-3 |
| SURF-5 | CLI command surface (`src/cli` or equivalent) | Code | Implementation owner | Write `scan`, `validate`, `resolve`; do not add deferred commands. | REV-2 |
| SURF-6 | Fixtures and tests (`fixtures`, `test`, `docs/evidence` or equivalent) | Test / Docs | Implementation owner | Write deterministic fixtures, snapshots, and evidence artifacts. | REV-2 / REV-4 |
| SURF-7 | Execution and handoff docs | Docs | Implementation owner | Write or update only execution evidence and handoff notes in scope. | REV-1 / REV-4 |

Section status: Complete

## 7. Agent-Focused Package Decomposition

Decomposition mission: Keep agent work bounded around durable internal contracts while allowing a single implementation agent to execute sequentially until the critical path proof stabilizes.

| ID | Unit | Ladder level | Mission | Observable value enabled | Risk retired | Public interface | Validation command | Promotion blockers |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PKG-1 | CLI shell | 2 | Own command parsing, file IO, exit codes, and command output for `scan`, `validate`, and `resolve`. | Agents can use one local CLI path. | RISK-2 | CLI bin and command handlers. | `npm test -- --run cli` or repo equivalent | No stable package/toolchain exists yet; command contract unreviewed. |
| PKG-2 | Context-link core and registry | 2 | Own engine-backed extraction, `ctx://` parsing, canonicalization, registry validation, and diagnostics. | Links become typed, validated context candidates. | RISK-1 / Q-3 | Core scan/validate functions and exported types. | `npm test -- --run core registry` or repo equivalent | Registry schema and output format need MS-2 approval. |
| PKG-3 | Offline resolver and artifact proof | 2 | Own `repo/path` resolution, bounded lens rendering, source identity, and lockfile hashing. | Valid links resolve to deterministic context artifacts. | RISK-2 / RISK-3 | Resolver interface, lens artifact writer, lockfile writer. | `npm test -- --run resolver determinism` or repo equivalent | Q-3 output format and deterministic artifact contract need MS-2 approval. |

### Package Boundary Card: PKG-1

Ladder level: 2

Mission: Provide the user-facing local CLI command surface without owning business rules.

Value / risk trace:
- Observable value enabled: `markdown-context scan`, `validate`, and `resolve` can run locally.
- Risk retired: Confirms CLI-first integration is viable without MCP.
- Validation evidence: EVD-1 / EVD-6.
- Blocking unknowns: None after package scaffold exists.

Owns:
- Files/directories: `src/cli/**`, CLI bin config, command output adapters.
- Concepts: command parsing, file input/output, exit codes, stdout/stderr shape.
- Runtime responsibilities: invoke core APIs and serialize results.

Does not own:
- Explicitly excluded behavior: Markdown parsing logic, registry rules, resolver semantics, write-side commands, MCP.
- Responsibilities delegated elsewhere: extraction/validation in PKG-2; resolution/artifacts in PKG-3.

Public interface:
- Exported types: CLI options as needed.
- Exported functions/classes/components: command runners.
- Events/messages/contracts: CLI JSON/text output.
- CLI/API surface: `scan`, `validate`, `resolve`.

Allowed dependencies:
- May import: PKG-2 and PKG-3 public exports.
- May call: filesystem reads/writes requested by command options.
- May read configuration from: explicit CLI args and local registry path.

Forbidden dependencies:
- Must not import: `markdown-engine` directly unless mediated by PKG-2; private files from PKG-2/PKG-3.
- Must not call: OS protocol handlers, MCP tools, live network connectors.
- Must not know about: resolver internals beyond public result contracts.

State boundary:
- Owns state: none beyond command-local options.
- Reads state: input files, registry file, output path arguments.
- Mutates state: output artifacts and lockfiles only when command options request writes.
- Persistence responsibility: none outside requested outputs.

Agent ownership boundary:
- Agent editable paths: `src/cli/**`, package bin config, CLI tests.
- Agent read-only paths: `src/core/**`, `src/registry/**`, `src/resolvers/**`, `src/lens/**`, `src/lockfile/**` unless implementing the assigned package.
- Required coordination before editing: CLI output schema changes require PKG-2/PKG-3 owner review.

Validation command: `npm test -- --run cli` or final repo equivalent.

Promotion blockers: CLI contract and package scaffold are not yet implemented or reviewed.

### Package Boundary Card: PKG-2

Ladder level: 2

Mission: Convert `markdown-engine` link references into canonical `ctx://` candidates and deterministic validation results.

Value / risk trace:
- Observable value enabled: scan and validate output exposes typed context-link records.
- Risk retired: Proves `markdown-engine` metadata can satisfy required `sourceRange`.
- Validation evidence: EVD-2 / EVD-3 / EVD-8.
- Blocking unknowns: Engine metadata coverage for every required Markdown link form.

Owns:
- Files/directories: `src/core/**`, `src/registry/**`, `src/diagnostics/**`.
- Concepts: link candidate model, URL canonicalization, registry grammar, closed param vocabulary, diagnostics.
- Runtime responsibilities: call `markdown-engine` public APIs and produce validated records.

Does not own:
- Explicitly excluded behavior: CLI command parsing, artifact persistence, resolver source reads.
- Responsibilities delegated elsewhere: PKG-1 command IO; PKG-3 resolver/lens/lockfile output.

Public interface:
- Exported types: context link candidate, registry config, validation diagnostic.
- Exported functions/classes/components: scan and validate functions.
- Events/messages/contracts: deterministic diagnostic codes.
- CLI/API surface: consumed by PKG-1.

Allowed dependencies:
- May import: public `markdown-engine` package APIs, standard URL/path helpers.
- May call: pure parsing and validation helpers.
- May read configuration from: explicit registry data passed by caller.

Forbidden dependencies:
- Must not import: private `markdown-engine` internals, PKG-1 CLI code, PKG-3 resolver internals.
- Must not call: filesystem source reads except explicit input file loading mediated by caller, network, OS handlers.
- Must not know about: live connector semantics.

State boundary:
- Owns state: none.
- Reads state: Markdown text and registry config passed in.
- Mutates state: none.
- Persistence responsibility: none.

Agent ownership boundary:
- Agent editable paths: `src/core/**`, `src/registry/**`, `src/diagnostics/**`, related tests/fixtures.
- Agent read-only paths: `src/cli/**`, `src/resolvers/**`, `src/lens/**`, `src/lockfile/**`.
- Required coordination before editing: public candidate or diagnostic schema changes require PKG-1 and PKG-3 review.

Validation command: `npm test -- --run core registry` or final repo equivalent.

Promotion blockers: Registry schema, diagnostic code set, and Q-3 output implication require MS-2 approval.

### Package Boundary Card: PKG-3

Ladder level: 2

Mission: Resolve validated `ctx://repo/path/...` links into bounded deterministic lens artifacts and lockfile records.

Value / risk trace:
- Observable value enabled: validated context links become auditable context artifacts.
- Risk retired: Proves offline deterministic resolution and source-content boundary.
- Validation evidence: EVD-4 / EVD-5.
- Blocking unknowns: Q-3 lens artifact default format.

Owns:
- Files/directories: `src/resolvers/**`, `src/lens/**`, `src/lockfile/**`.
- Concepts: resolver interface, repo path source identity, bounded lens content, citations, content hashes, registry hash recording.
- Runtime responsibilities: read checked-in files, render artifacts, write deterministic lockfile records.

Does not own:
- Explicitly excluded behavior: non-local resolvers, external adapters, mission aggregation, write-side Markdown mutation.
- Responsibilities delegated elsewhere: candidate extraction/validation in PKG-2; CLI IO in PKG-1.

Public interface:
- Exported types: resolver result, lens artifact, lockfile record.
- Exported functions/classes/components: repo-path resolver, lens renderer, lockfile serializer.
- Events/messages/contracts: artifact and lockfile schemas.
- CLI/API surface: consumed by PKG-1.

Allowed dependencies:
- May import: PKG-2 public validated-link types, Node filesystem/path/crypto APIs.
- May call: local file reads explicitly selected by validated links.
- May read configuration from: validated registry/resolver config passed by caller.

Forbidden dependencies:
- Must not import: PKG-1 CLI internals, live connector SDKs, MCP tooling.
- Must not call: network, OS handlers, LLM APIs, live Linear/GitHub/browser connectors.
- Must not know about: mission aggregation or write-side commands.

State boundary:
- Owns state: artifact bytes and lockfile records it writes.
- Reads state: repository files referenced by validated `repo/path` links.
- Mutates state: output artifact and lockfile paths only.
- Persistence responsibility: deterministic artifact and lockfile serialization.

Agent ownership boundary:
- Agent editable paths: `src/resolvers/**`, `src/lens/**`, `src/lockfile/**`, resolver fixtures/tests.
- Agent read-only paths: `src/cli/**`, `src/core/**`, `src/registry/**`.
- Required coordination before editing: output schema or hash semantics require project-owner and reviewer approval.

Validation command: `npm test -- --run resolver determinism` or final repo equivalent.

Promotion blockers: Output format Q-3 and compatibility policy are not yet closed.

Dependency direction rules:

- Allowed direction: PKG-1 may depend on PKG-2 and PKG-3 public exports; PKG-3 may depend on PKG-2 public validated-link types; PKG-2 must not depend on PKG-1 or PKG-3.
- Prohibited imports: private deep imports across package folders; app-specific imports in reusable core; external connector SDKs in read-side MVP code.
- Allowed cross-boundary communication: explicit typed function calls and serialized result objects.
- Disallowed cross-boundary communication: shared mutable globals, implicit filesystem conventions outside command options, copied types.

State boundary rules:

- Package-owned state: PKG-3 owns artifact and lockfile bytes; PKG-1 owns command-local options; PKG-2 owns no persistent state.
- Package-read state: PKG-1 reads command inputs; PKG-2 reads passed Markdown/config; PKG-3 reads validated local source files.
- Package-mutated state: only PKG-3 writes artifacts/lockfiles, mediated by PKG-1 command options.
- Persistence ownership: PKG-3 owns deterministic serialization and hashing.

Reusable package candidates:

| Candidate | Current level | Reuse rationale | Required decoupling | Promotion trigger |
| --- | --- | --- | --- | --- |
| Context-link core and registry | 2 | Could become reusable across later adapters and repos. | Stable schema docs, no app-specific assumptions, versioned compatibility policy. | After read-side MVP proves CLI and an adapter needs the same core. |
| Offline resolver/artifact proof | 2 | Could support future mission and adapter layers. | Q-3 output format closed, resolver interface documented, compatibility policy added. | After mission milestone requires reuse without CLI coupling. |

Coupling tripwires:

- A package requires knowledge of another package's internal file layout.
- Two packages must usually change together for one feature after MS-1.
- A reusable candidate imports CLI, connector, deployment, or product-specific runtime code.
- Resolver logic starts handling mission aggregation or write-side mutation.
- Package validation requires a full end-to-end CLI run when package-level validation should be possible.
- Types are copied instead of exported.
- Separate agents must edit the same files to complete nominally separate work packages.

N/A rationale: Not applicable; code, contracts, schemas, and package boundaries are affected, so package decomposition is required.

Section status: Complete

## 8. Work Packages and Sequencing

Planning strategy: Risk retirement followed by progressive value.

Critical path hypothesis: The smallest proof is a local CLI run that parses Markdown through `markdown-engine`, extracts one `ctx://repo/path/...` link, validates it against a minimal registry, resolves it to a bounded lens, and proves deterministic output.

First proving slice: `WP-1` implements that vertical path with minimal fixtures and evidence for `MS-1`.

Validation cadence: Produce evidence at the end of every work package. Do not start broad fixture expansion or contract hardening until `MS-1` is approved.

Deferred completeness: `mission`, write-side commands, MCP, live connectors, package publication, broad resolver catalog, and non-Markdown source support remain out of scope.

| ID | Objective | Owner | Package boundary | Editable paths | Read-only paths | Inputs | Outputs | Dependencies | Observable value enabled | Risk retired | Milestone gate | Validation checkpoint | Completion criteria |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| WP-1 | Build critical-path proof for local `scan -> validate -> resolve`. | Implementation owner | PKG-1 / PKG-2 / PKG-3 | `package.json`, toolchain config, `src/**`, `test/**`, `fixtures/**` | `docs/design/**`, this execution spec | SRC-1 / SRC-2 / SRC-3 | Minimal package, CLI, one fixture, proof evidence | DEP-1 satisfied | First end-to-end local context-link proof exists. | RISK-1 / RISK-2 | MS-1 | VAL-1 / VAL-2 / VAL-3 / VAL-4 | One fixture containing `ctx://repo/path/...` scans, validates, resolves, and emits bounded artifact evidence. |
| WP-2 | Harden scan, URL parsing, registry validation, and diagnostics breadth. | Implementation owner | PKG-2 | `src/core/**`, `src/registry/**`, `src/diagnostics/**`, tests/fixtures | `src/cli/**`, `src/resolvers/**`, `docs/design/**` | WP-1 proof | Expanded fixtures and deterministic diagnostics | MS-1 approval | Scan and validate behavior is contract-reviewable. | RISK-1 | MS-2 | VAL-3 / VAL-8 | Required Markdown link forms and invalid param/scheme/lens diagnostics pass. |
| WP-3 | Harden repo-path resolver, lens artifacts, source identity, and lockfile determinism. | Implementation owner | PKG-3 | `src/resolvers/**`, `src/lens/**`, `src/lockfile/**`, tests/fixtures | `src/core/**`, `src/registry/**`, `src/cli/**`, `docs/design/**` | WP-1 proof, Q-3 decision | Deterministic artifacts and lockfile evidence | Q-3 resolved before MS-2 | Valid links produce auditable context artifacts. | RISK-2 / RISK-3 / Q-3 | MS-2 | VAL-4 / VAL-5 | Repeated resolve output is byte-identical and records registry/source/resolver identity. |
| WP-4 | Finalize CLI contracts, agent preflight evidence, and handoff. | Implementation owner | PKG-1 / PKG-2 / PKG-3 | `src/cli/**`, `docs/evidence/**`, README or handoff docs if introduced, tests | Non-CLI package source (`src/core/**`, `src/registry/**`, `src/diagnostics/**`, `src/resolvers/**`, `src/lens/**`, `src/lockfile/**`) and `docs/design/**` | WP-2 / WP-3 | Agent preflight evidence and completion handoff | MS-2 approval | Agent can use the read-side MVP without MCP. | RISK-3 | MS-3 | VAL-6 | Human-verifiable preflight commands pass and deferred scope is documented. |

Execution sequence:

1. Execute `WP-1` in a fresh `.worktrees/` branch from `origin/main`.
2. Stop for `MS-1` approval before broadening fixtures or contracts.
3. Execute `WP-2` and `WP-3`; these may proceed in parallel only after PKG-2 public validated-link types stabilize.
4. Stop for `MS-2` before final CLI/handoff work.
5. Execute `WP-4`, then stop for `MS-3` completion approval.

Parallelization rules: No parallel work before `MS-1`. After `MS-1`, `WP-2` and `WP-3` may split only if editable paths remain disjoint and any public type/schema change is coordinated before either branch proceeds.

Integration points: PKG-1 command handlers integrate PKG-2 scan/validation and PKG-3 resolver outputs; PKG-3 consumes only PKG-2 public validated-link types; evidence is captured under a documented evidence path chosen during implementation.

Coordination triggers: Any change to CLI JSON shape, registry schema, diagnostic codes, validated-link type, lens artifact schema, lockfile hash semantics, or Q-3 output format requires project-owner awareness and reviewer signoff before merge.

Section status: Complete

## 9. Milestone Gates and Manual Verification

| ID | Gate objective | Covered work | Due point | Human verifier | Prerequisites | Review gate | Required evidence | Approval decision | Failure path |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| MS-1 | Approve the critical-path proof before broad implementation. | OBJ-1 / OBJ-2 / OBJ-3 / OBJ-4 / SURF-1 / SURF-2 / SURF-3 / SURF-4 / PKG-1 / PKG-2 / PKG-3 / WP-1 | Before WP-2 or WP-3 begins | Project owner | VAL-1 / VAL-2 / VAL-3 / VAL-4 / EVD-1 / EVD-2 / EVD-3 / EVD-4 | REV-1 / REV-2 | EVD-1 through EVD-4 | Approve / Reject / Conditional approval | If rejected, stop implementation and revise package boundaries or return to design. |
| MS-2 | Approve read-side MVP contract before merge. | OBJ-1 through OBJ-5 / WP-2 / WP-3 / PKG-2 / PKG-3 | Before implementation PR merge | Project owner and contract reviewer | MS-1 approval, Q-3 resolved, VAL-3 / VAL-4 / VAL-5 / VAL-8 / EVD-3 / EVD-4 / EVD-5 / EVD-8 | REV-2 / REV-3 | EVD-3 through EVD-5, EVD-8, and Q-3 decision record | Approve / Reject / Conditional approval | If rejected, block merge and fix contract, determinism, or safety findings. |
| MS-3 | Approve agent preflight and completion handoff. | OBJ-6 / WP-4 / SURF-5 / SURF-6 / SURF-7 | Before declaring `BEL-1047` complete | Project owner and coding-agent workflow reviewer | MS-2 approval, VAL-6 / EVD-6 / EVD-7 | REV-4 | EVD-6 and EVD-7 | Approve / Reject / Conditional approval | If rejected, keep issue open and repair preflight or handoff gaps. |

Manual verification guide:

| Step ID | Milestone | Operator action | Expected result | Evidence artifact |
| --- | --- | --- | --- | --- |
| MV-1 | MS-1 | Run the documented local install/build command. | Package builds without hidden global dependencies. | EVD-1 |
| MV-2 | MS-1 | Run `scan` on the critical-path fixture. | Output contains one `ctx://repo/path/...` candidate with `sourceRange`. | EVD-2 |
| MV-3 | MS-1 | Run `validate` on the same fixture and registry. | Valid link passes and invalid prompt-like param fixture fails closed. | EVD-3 |
| MV-4 | MS-1 | Run `resolve` on the valid fixture. | Bounded lens artifact is emitted with citation/source identity and no OS/network behavior. | EVD-4 |
| MV-5 | MS-2 | Run full scan source-range fixture suite across inline links, images, definitions, link reference usages, and image reference usages. | Every required Markdown link form emits the required `sourceRange` or a blocking diagnostic is recorded. | EVD-8 |
| MV-6 | MS-2 | Run full fixture test suite for validate and resolve twice. | Repeated outputs, registry hashes, and lockfile hashes are byte-identical. | EVD-5 |
| MV-7 | MS-2 | Inspect dependency and command surfaces. | No `mission`, write-side, MCP, OS handler, or live connector implementation is present. | EVD-7 |
| MV-8 | MS-3 | Follow the documented agent preflight from a clean checkout. | A coding agent can run scan, validate, and resolve locally and inspect the artifact. | EVD-6 |
| MV-9 | MS-3 | Review handoff/deferred scope notes. | Remaining work for mission/write-side/MCP is explicit and outside `BEL-1047`. | EVD-7 |

Section status: Complete

## 10. Execution Controls and Drift Management

| ID | Trigger | Required action | Owner | Evidence |
| --- | --- | --- | --- | --- |
| CTRL-1 | Implementation needs custom Markdown parsing or private `markdown-engine` imports. | Pause and escalate; either use public engine API or record approved `DEV-*`. | Implementation owner | REV-2 notes or DEV record |
| CTRL-2 | Implementation adds `mission`, write-side commands, MCP, OS handlers, or live connectors. | Remove from scope or obtain project-owner deviation approval before continuing. | Project owner | REV-2 / REV-3 |
| CTRL-3 | Output schema, diagnostic code, registry schema, or lockfile hash semantics change after MS-2. | Stop and re-run MS-2 review with updated evidence. | Implementation owner | EVD-5 / REV-2 |
| CTRL-4 | `scan`, `validate`, or `resolve` cannot be proven through the first vertical slice. | Stop broad implementation and revise execution plan or design. | Project owner | MS-1 decision |
| CTRL-5 | Two agents need to edit the same package paths in parallel. | Serialize work or revise package boundaries before edits continue. | Implementation owner | Updated execution notes |

Deviation rules: Any scope expansion, new resolver namespace, live connector, OS handler, MCP tool, write-side mutation, non-public engine access, or output contract change after MS-2 requires a `DEV-*` record with owner, approver, rationale, impact, and evidence.

Pause or escalation conditions: Pause for agent workflow reviewer and project-owner review if Q-3 is unresolved at MS-2, source ranges are unavailable for required Markdown constructs, deterministic repeated-run evidence fails, hostile source content can appear as instructions, or deferred features become necessary to satisfy `BEL-1047`.

Section status: Complete

## 11. Data, Schema, Config, and Contract Handling

| Change | Impact | Compatibility | Reversibility | Validation |
| --- | --- | --- | --- | --- |
| Context-link grammar | Introduces `ctx://<namespace>/<kind>/<id>?lens=<lens>&...` parsing in this package. | Pre-release contract; semver policy can be added before package publication. | Reversible before first release by changing fixtures/schema. | VAL-3 / VAL-5 |
| Registry config schema | Defines allowed schemes, namespaces, kinds, lenses, params, defaults, and resolver mapping. | Internal MVP schema until reviewed at MS-2. | Reversible before first release; changes require snapshot updates. | VAL-3 |
| CLI JSON/text output | Creates command output consumed by agents and CI. | Pre-release contract; breaking changes allowed only before MS-2 approval. | Reversible before merge; after MS-2 requires re-review. | VAL-6 / REV-2 |
| Lens artifact schema | Defines bounded resolved source output with citations and source-content boundary. | Q-3 controls default format before MS-2. | Reversible before package publication; after MS-2 requires review. | VAL-4 / VAL-5 |
| Context lockfile schema | Records canonical URL, registry identity/hash, resolver identity, source identity, artifact hash, and output-affecting options. | Pre-release deterministic proof contract. | Reversible before merge; after merge requires migration note if persisted examples exist. | VAL-5 |

N/A rationale: No database migration, customer data migration, auth, permission, event, or live service config changes are in scope.

Section status: Complete

## Layer 3: Validation, Release, and Handoff

## 12. Validation and Evidence Plan

| ID | Method | Claim verified | Timing | Owner | Evidence artifact |
| --- | --- | --- | --- | --- | --- |
| VAL-1 | Test / Build | Package scaffold builds and test runner executes locally. | Pre-MS-1 / Pre-merge | Implementation owner | EVD-1 |
| VAL-2 | Test | `scan` extracts one critical-path `ctx://repo/path/...` link through `markdown-engine` `linkReferences` with `sourceRange`. | Pre-MS-1 | Implementation owner | EVD-2 |
| VAL-3 | Test | `validate` enforces registry grammar, closed params, allowed scheme/kind/lens, and deterministic diagnostics. | Pre-MS-1 / Pre-MS-2 | Implementation owner | EVD-3 |
| VAL-4 | Test / Manual | `resolve` emits bounded offline `repo/path` lens artifacts with citations, source identity, and source-content boundary. | Pre-MS-1 / Pre-MS-2 | Implementation owner | EVD-4 |
| VAL-5 | Test / Snapshot | Repeated resolve runs produce byte-identical artifact bytes, registry hashes, and lockfile hashes. | Pre-MS-2 / Pre-merge | Implementation owner | EVD-5 |
| VAL-6 | Manual | Agent preflight runs scan, validate, and resolve without MCP or network access. | Pre-MS-3 / Pre-completion | Coding-agent workflow reviewer | EVD-6 |
| VAL-7 | Review / Inspection | Deferred scope is absent and handoff records remaining mission/write-side/MCP work. | Pre-MS-3 / Pre-completion | Project owner | EVD-7 |
| VAL-8 | Test | `scan` extracts `ctx://` links through `markdown-engine` `linkReferences` with `sourceRange` across required Markdown link forms: inline links, images, definitions, link reference usages, and image reference usages. | Pre-MS-2 / Pre-merge | Implementation owner | EVD-8 |

Section status: Complete

## 13. Review Plan

| ID | Reviewer | Review scope | Blocking? | Completion evidence |
| --- | --- | --- | --- | --- |
| REV-1 | Project owner | Execution spec source authority, scope, package boundaries, work packages, milestones, and final gate. | Yes | Approved execution spec PR or review comment. |
| REV-2 | `markdown-engine` contract reviewer | Public engine API usage, no custom Markdown traversal, package boundary integrity, CLI/core contracts. | Yes | PR approval or review note. |
| REV-3 | Security/data reviewer | Inert link handling, prompt-param rejection, source-content boundary, no OS/network/live connector behavior. | Yes | PR approval or review note. |
| REV-4 | Coding-agent workflow reviewer | Agent preflight commands, evidence readability, no MCP dependency, handoff clarity. | Yes | MS-3 approval note. |

Approval conditions: Do not merge implementation until `MS-2` is approved, `REV-2` and `REV-3` are satisfied, validation evidence exists for `VAL-1` through `VAL-5` and `VAL-8`, and no blocking `Q-*` or `RISK-*` remains unresolved. Do not close `BEL-1047` until `MS-3` and `REV-4` are satisfied.

Section status: Complete

## 14. Rollout, Migration, Rollback, and Recovery

| ID | Action | Timing | Owner | Abort trigger | Evidence |
| --- | --- | --- | --- | --- | --- |
| REL-1 | Merge implementation PR to `main` after MS-2 approval. | Pre-completion | Project owner | Missing validation, blocking review, or failed deterministic proof. | EVD-5 / review approvals |
| REL-2 | Keep package unpublished during this MVP unless a separate release decision is approved. | Entire execution | Project owner | Any attempted npm tag/publish without release approval. | Handoff note |
| REL-3 | Close `BEL-1047` after MS-3 approval and handoff evidence. | Completion | Project owner | Agent preflight or handoff incomplete. | EVD-6 / EVD-7 |

Rollback or containment plan: Before package publication, rollback is `git revert` of the implementation PR or removal of generated package files from `main`. Since no live service, database, migration, or external connector is introduced, containment is limited to reverting code/docs and removing any generated fixture artifacts.

Recovery limit: Recovery restores repository state only. It does not recover external user data because no external data or live integration is in scope.

Section status: Complete

## 15. Observability and Operational Readiness

| ID | Signal | Purpose | Consumer | Response |
| --- | --- | --- | --- | --- |
| OBS-1 | CLI exit code | Distinguish success, validation failure, resolver failure, and command misuse. | Agents, humans, CI | Inspect diagnostics and block completion on unexpected codes. |
| OBS-2 | Structured diagnostics | Explain invalid links, rejected params, unsupported registry declarations, and resolver failures. | Agents, reviewers, CI | Use diagnostic codes in tests and review evidence. |
| OBS-3 | Lockfile diff and artifact hash | Audit deterministic resolved context identity. | Reviewers, maintainers | Compare repeated runs and block on hash drift. |
| OBS-4 | Manual preflight transcript | Prove no-MCP agent workflow. | Project owner, agent workflow reviewer | Approve or reject MS-3. |

Operator actions: Maintainers run local build/test commands, `scan`, `validate`, and `resolve`; inspect diagnostics; compare repeated output hashes; and review evidence before approving milestone gates.

Monitoring window: No production monitoring window is required before package publication. If the package is later released, define a separate release-readiness plan.

N/A rationale: No daemon, live service, hosted runtime, or external connector is deployed in this MVP.

Section status: Complete

## 16. Risks, Questions, Deviations, and Waivers

Risks:

| ID | Risk | Impact | Likelihood | Owner | Mitigation | Validation |
| --- | --- | --- | --- | --- | --- | --- |
| RISK-1 | Engine source metadata is insufficient for `sourceRange` across required link forms. | Scan contract weakens or requires design change. | Medium | Implementation owner | Prove the critical-path fixture in WP-1, then prove full link-form coverage in WP-2 before merge. | VAL-2 / VAL-8 |
| RISK-2 | Deterministic artifact or lockfile output drifts across repeated runs. | Core product claim fails. | Medium | Implementation owner | Canonical serialization, hash exact bytes, snapshot repeated runs. | VAL-5 |
| RISK-3 | Resolved source content is presented as agent instructions. | Prompt-injection boundary fails. | Medium | Security/data reviewer | Source-content labels, citations, hostile-source fixture, review. | VAL-4 / VAL-6 |
| RISK-4 | Scope expands into mission, write-side, MCP, or live connectors. | MVP loses proof focus and reviewability. | Medium | Project owner | Enforce CTRL-2 and deferred scope review. | VAL-7 / REV-2 |

Open questions:

| ID | Question | Owner | Due date | Blocking? | Resolution path |
| --- | --- | --- | --- | --- | --- |
| Q-3 | Should generated lens artifacts default to Markdown, JSON, or both? | Agent workflow reviewer | Before MS-2 | Yes for MS-2, no for WP-1 | Decide after WP-1 evidence; record decision in implementation PR and update snapshots. |

Approved deviations:

| ID | Deviation | Owner | Approver | Rationale | Impact | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| None | No approved deviations. | Project owner | Project owner | Execution should follow source design and this spec. | None | N/A |

Approved waivers:

| ID | Waived rule or finding | Approver | Rationale | Boundary or expiry | Compensating control | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| None | No approved waivers. | Project owner | No waiver needed. | N/A | N/A | N/A |

Section status: Complete

## 17. Execution Traceability Matrix

| Source, objective, or evidence-led claim | Change surfaces | Package boundaries | Work packages | Milestones | Controls | Validation | Review | Release or ops | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SRC-1 | SURF-1 through SURF-7 | PKG-1 / PKG-2 / PKG-3 | WP-1 through WP-4 | MS-1 / MS-2 / MS-3 | CTRL-1 through CTRL-5 | VAL-1 through VAL-8 | REV-1 through REV-4 | REL-1 / REL-3 / OBS-1 through OBS-4 | EVD-1 through EVD-8 |
| SRC-2 | SURF-7 | PKG-1 / PKG-2 / PKG-3 | WP-1 through WP-4 | MS-3 | CTRL-4 | VAL-6 / VAL-7 | REV-4 | REL-3 | EVD-6 / EVD-7 |
| SRC-3 | SURF-2 | PKG-2 | WP-1 / WP-2 | MS-1 / MS-2 | CTRL-1 | VAL-2 / VAL-8 | REV-2 | N/A | EVD-2 / EVD-8 |
| OBJ-1 | SURF-1 / SURF-5 | PKG-1 | WP-1 / WP-4 | MS-1 / MS-3 | CTRL-2 | VAL-1 / VAL-6 | REV-2 / REV-4 | REL-1 / OBS-1 | EVD-1 / EVD-6 |
| OBJ-2 | SURF-2 / SURF-6 | PKG-2 | WP-1 / WP-2 | MS-1 / MS-2 | CTRL-1 | VAL-2 / VAL-8 | REV-2 | OBS-2 | EVD-2 / EVD-8 |
| OBJ-3 | SURF-3 / SURF-6 | PKG-2 | WP-1 / WP-2 | MS-1 / MS-2 | CTRL-3 | VAL-3 | REV-2 / REV-3 | OBS-2 | EVD-3 |
| OBJ-4 | SURF-4 / SURF-6 | PKG-3 | WP-1 / WP-3 | MS-1 / MS-2 | CTRL-2 / CTRL-3 | VAL-4 | REV-3 | OBS-3 | EVD-4 |
| OBJ-5 | SURF-4 / SURF-6 | PKG-3 | WP-3 | MS-2 | CTRL-3 | VAL-5 | REV-2 / REV-3 | OBS-3 | EVD-5 |
| OBJ-6 | SURF-5 / SURF-7 | PKG-1 / PKG-2 / PKG-3 | WP-4 | MS-3 | CTRL-4 | VAL-6 / VAL-7 | REV-4 | REL-3 / OBS-4 | EVD-6 / EVD-7 |
| Critical path hypothesis | SURF-1 through SURF-5 | PKG-1 / PKG-2 / PKG-3 | WP-1 | MS-1 | CTRL-4 | VAL-1 through VAL-4 | REV-1 / REV-2 | OBS-1 / OBS-2 | EVD-1 through EVD-4 |
| First proving slice | SURF-1 through SURF-6 | PKG-1 / PKG-2 / PKG-3 | WP-1 | MS-1 | CTRL-1 / CTRL-4 | VAL-1 through VAL-4 | REV-2 | OBS-1 / OBS-2 / OBS-3 | EVD-1 through EVD-4 |
| RISK-1 | SURF-2 / SURF-6 | PKG-2 | WP-1 / WP-2 | MS-1 / MS-2 | CTRL-1 | VAL-2 / VAL-8 | REV-2 | OBS-2 | EVD-2 / EVD-8 |
| RISK-2 | SURF-4 / SURF-6 | PKG-3 | WP-1 / WP-3 | MS-2 | CTRL-3 | VAL-5 | REV-2 / REV-3 | OBS-3 | EVD-5 |
| RISK-3 | SURF-4 | PKG-3 | WP-3 / WP-4 | MS-2 / MS-3 | CTRL-2 | VAL-4 / VAL-6 | REV-3 | OBS-4 | EVD-4 / EVD-6 |
| RISK-4 | SURF-5 / SURF-7 | PKG-1 | WP-4 | MS-3 | CTRL-2 | VAL-7 | REV-2 / REV-4 | REL-3 | EVD-7 |
| Q-3 | SURF-4 / SURF-6 | PKG-3 | WP-3 | MS-2 | CTRL-3 | VAL-4 / VAL-5 | REV-2 / REV-3 | N/A | EVD-7 |

Section status: Complete

## 18. Final Execution Gate

Entry gate: Source design is merged on `origin/main`; Linear project `markdown-context MVP` exists; Linear issue `BEL-1047` exists; this execution spec must be reviewed and approved before implementation code begins.

Milestone approval gate: `MS-1`, `MS-2`, and `MS-3` are fully specified with due points, named verifiers, manual verification steps, required evidence, approval decisions, and failure paths. `MS-1` approval is required before WP-2/WP-3, `MS-2` before implementation merge, and `MS-3` before closing `BEL-1047`.

Completion gate: Work is complete only when `BEL-1047` success criteria are satisfied, `VAL-1` through `VAL-8` evidence exists, `REV-2` through `REV-4` are satisfied, and `MS-3` is approved.

Release gate: Package publication is out of scope. Merging to `main` is allowed only after `MS-2`; any tag/npm publication requires a separate release-readiness decision and execution spec or approved extension.

Handoff record: Handoff shall link implementation PR, evidence artifacts `EVD-1` through `EVD-8`, milestone approval notes, unresolved Q-3 decision if deferred by approved deviation, and deferred mission/write-side/MCP scope.

Final readiness state: Not ready until `REV-1` approves this execution spec. After `REV-1` approval and no new blockers, the expected state is `Ready to execute`.

Section status: Complete
