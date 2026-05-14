# Markdown Context Operational Design Specification

## Document Control

| Field | Value |
| --- | --- |
| Title | Markdown Context: Deterministic Context Links and Lens Resolution |
| Status | In Review |
| Rigor level | `R2 Standard Delivery` |
| Rigor justification | The project creates a durable CLI, schemas, resolver contract, generated lens artifacts, and compatibility surface for agentic coding workflows. It does not qualify for `R1` because the contract and write-side behavior are intended to become reusable infrastructure. It does not trigger `R3` because the initial design excludes secrets, auth changes, irreversible migrations, live customer data, and mandatory network execution. |
| Author(s) | Codex |
| Reviewers | Project owner, `markdown-engine` contract reviewer, coding-agent workflow reviewer, security/data reviewer |
| Decision owner | Project owner |
| Target milestone or release | `markdown-context` initial implementation approval |
| Last updated | 2026-05-14 |
| Related docs | `RUNTIME_ARCHITECTURE.md`, `docs/design/markdown-engine-operational-design-spec.md`, `docs/contracts/api.md` |
| Related tickets | Not yet assigned; create the `markdown-context` MVP implementation issue before starting code |

## 0. Executive Summary

Decision requested: Approve for implementation

Problem summary: Coding agents are unable to consume linked work context deterministically because Markdown links are currently passive URLs or ad hoc references, resulting in manual context gathering, prompt overloading, weak handoffs, and unreviewable assumptions about what context the agent actually used.

Proposed outcome: `markdown-context` provides a CLI-first context-link system that validates typed Markdown links, resolves them through deterministic lens projections, writes transparent lens artifacts and lockfiles, and gives coding agents a low-overhead way to read and create bounded context references without requiring MCP.

Why now: `markdown-engine` now has deterministic parsing, normalized IR, public `linkReferences` extraction for URL-bearing Markdown constructs, and allowed-scheme validation, so the next project can build on that stable foundation before downstream agent workflows hard-code weaker conventions.

Top risks or unknowns:

- RISK-1: Lens resolution could become hidden prompt injection if link parameters or resolved source text are treated as agent instructions.
- RISK-2: Resolver outputs could become non-deterministic if they depend on live external systems without lockfiles or source-version capture.
- RISK-3: Agents may ignore context links unless the CLI and bootloader contract are simpler than MCP setup.

Section status: Complete

## Layer 1: Problem and Requirements

## 1. Problem Definition

Problem declaration: Coding agents and agent operators are unable to retrieve bounded operational context from Markdown references because the current system has no portable context-link contract, resolver, lens registry, or deterministic proof of the resolved context, resulting in inconsistent planning, excessive prompt material, stale handoffs, and review gaps.

Affected actors or systems: Codex, Claude, other coding agents, repository maintainers, review agents, CI jobs, future `markdown-runtime`, future `markdown-mcp`, and humans authoring task, handoff, review, and design Markdown.

Current-state baseline: As of 2026-05-14, `markdown-engine` has public `linkReferences` extraction for URL-bearing Markdown constructs. `markdown-context` itself has 0 package scaffold, 0 CLI commands, 0 context-link registry, 0 resolvers, 0 lens artifacts, 0 context lockfile format, and 0 write-side helpers for inserting or validating context links.

Evidence or source: Direct repository inspection of `markdown-context` during design review on 2026-05-14, plus `markdown-engine` PR #104 adding public `linkReferences` extraction.

Consequence of inaction: Before the first `markdown-context` implementation begins, teams will keep encoding context as prose, raw URLs, or manual MCP calls, causing every agent workflow to rediscover context rules independently and making agent context use difficult to verify.

Decision deadline or trigger: Decide before creating the first `markdown-context` implementation ticket or repository scaffold.

Section status: Complete

## 2. Objectives and Non-Objectives

| ID | Statement | Measurement or decision horizon |
| --- | --- | --- |
| OBJ-1 | Provide a portable context-link contract for Markdown documents that identifies resource kind, identifier, lens request, and allowed parameters. | Initial implementation review |
| OBJ-2 | Provide a CLI-first resolver workflow that coding agents can use through shell commands and repository files, beginning with `scan`, `validate`, and one local `resolve` path. | Initial CLI milestone |
| OBJ-3 | Produce deterministic lens artifacts and lockfiles that record what context an agent received. | Deterministic proof milestone |
| OBJ-4 | Support later write-side workflows so agents can create, suggest, insert, and validate context links in task, handoff, PR, and design documents. | Write-side milestone after read-side MVP |
| OBJ-5 | Preserve an optional path to MCP without making MCP the primary integration dependency. | Adapter review milestone |
| NG-1 | The initial project will not execute context links, open OS protocol handlers, or dispatch application commands. | Initial implementation review |
| NG-2 | The initial project will not allow free-form prompt text in link parameters. | Security review |
| NG-3 | The initial project does not include live Linear, GitHub, browser, or network connectors as required runtime dependencies. | Initial release |
| NG-4 | The initial project will not replace `markdown-engine` parsing, normalization, validation, or diagnostics. | Contract review |
| NG-5 | MCP transport is out of scope for the core implementation and may be added as an adapter over the same resolver core. | Adapter review milestone |

Section status: Complete

## 3. Stakeholders and Decision Authorities

| Stakeholder or role | Interest | Required action |
| --- | --- | --- |
| Project owner | Confirms product direction, scope, and implementation priority. | Approve |
| `markdown-engine` contract reviewer | Confirms the new project depends on public engine contracts without leaking runtime concerns into the engine. | Review |
| Coding-agent workflow reviewer | Confirms Codex, Claude, and no-tool LLM workflows can consume the contract. | Review |
| Security/data reviewer | Confirms links, parameters, resolver behavior, and generated lenses do not create prompt-injection or data-leakage hazards. | Consult |
| Future MCP adapter owner | Confirms the CLI/core boundary can be exposed through MCP later. | Inform |

Decision owner: Project owner.

Section status: Complete

## 4. Constraints, Invariants, and Assumptions

| ID | Type | Statement | Source or rationale | Validation or resolution plan |
| --- | --- | --- | --- | --- |
| CON-1 | Constraint | `markdown-context` shall consume `markdown-engine` public APIs for Markdown parsing and `linkReferences` extraction. | Prevents duplicated Markdown parser and link-like reference traversal behavior. | Validate through dependency inspection and integration tests in VAL-1. |
| CON-2 | Invariant | Context-link parameters are declarative lens requests, not executable prompt text. | Maintains prompt firewall and agent safety. | Validate with negative prompt-param fixtures in VAL-5. |
| CON-3 | Invariant | Deterministic lens resolution shall not require an LLM. | Deterministic verification is a core product claim. | Validate through offline resolver tests in VAL-4. |
| CON-4 | Constraint | MCP shall remain an optional adapter over the resolver core. | Lower-overhead agent integration is a stated design goal. | Inspect package boundaries and CLI docs in VAL-8. |
| CON-5 | Invariant | The resolver shall record enough source and resolver identity to audit the context given to an agent. | Supports reproducibility and review. | Validate lockfile shape and content hashes in VAL-4. |
| CON-6 | Constraint | The initial implementation shall not open OS protocol handlers from Markdown content. | Prevents link execution from crossing a trust boundary. | Validate with misuse tests and code review in VAL-5. |
| CON-7 | Invariant | Source-derived lens and mission content shall be rendered as attributed data, not as agent operating instructions. | Prevents resolved content from crossing the instruction/data boundary. | Validate with hostile-source fixtures in VAL-5. |
| CON-8 | Constraint | The initial context-link scheme shall be `ctx://`. | Removes scheme ambiguity before registry fixtures and CLI parsing begin. | Validate through grammar fixtures and ACC-1. |
| CON-9 | Constraint | The first deterministic resolver shall support local repository paths through the `repo/path` namespace and kind. | Proves offline resolution without requiring Linear, GitHub, browser, or network connectors. | Validate through ACC-3 and VAL-4. |
| ASM-1 | Assumption | TypeScript on Node.js remains acceptable for `markdown-context`. | Matches `markdown-engine` and agent CLI ecosystem. | Confirm during scaffold; if false, revise section 12 before implementation. |
| ASM-2 | Assumption | Coding agents can reliably run a local CLI or read generated repository files. | Codex and Claude workflows commonly support shell or file access. | Validate through manual agent preflight exercise in VAL-7. |
| ASM-3 | Assumption | Useful initial lenses can be generated from deterministic local sources such as files, docs, and checked-in metadata. | Enables an offline MVP without connector complexity. | Validate through local-source lens fixtures in VAL-4. |

Section status: Complete

## 5. Requirements

| ID | Type | Priority | Requirement statement | Rationale | Verification |
| --- | --- | --- | --- | --- | --- |
| REQ-1 | Functional | Must | The system shall extract context-link candidates from `markdown-engine` normalized documents. | Consumers need extraction without writing recursive IR traversal. | VAL-1 |
| REQ-2 | Functional | Must | The system shall validate context-link URL grammar against a versioned registry. | Resource kinds, identifiers, lenses, and parameters need deterministic validation. | VAL-2 |
| REQ-3 | Functional | Must | The system shall reject link parameters outside the registry vocabulary. | Prevents hidden prompt instructions and unsupported behavior. | VAL-5 |
| REQ-4 | Functional | Must | The system shall resolve supported context links into bounded lens artifacts. | Agents need compact context packets instead of raw source dumps. | VAL-3 / VAL-4 |
| REQ-5 | Functional | Must | The system shall provide read-side MVP CLI commands for `scan`, `validate`, and `resolve` operations. | Agents and humans need the same low-overhead interface before optional adapters or write-side helpers. | VAL-6 |
| REQ-6 | Reliability | Must | The system shall produce byte-identical deterministic lens output for identical input files, registry config, resolver version, and command options. | Deterministic resolution is the central verification proof for the read-side MVP. | VAL-4 |
| REQ-7 | Reliability | Must | The system shall emit a context lockfile for resolved links with link URL, lens id, registry identity, registry version, registry hash, source identity, resolver version, and content hash. | Reviewers need to know what context an agent actually received and which registry contract produced it. | VAL-4 |
| REQ-8 | Operability | Must | The system shall support offline local-file resolution when resolver config declares offline mode. | Agent workflows must not depend on live network tools for the core path. | VAL-4 |
| REQ-9 | Security | Must | The system shall treat context links as inert data during scan, validation, resolution, and write operations. | Prevents Markdown from triggering commands, apps, network calls, or handlers. | VAL-5 |
| REQ-15 | Security | Must | The system shall preserve an explicit instruction/data boundary by marking source-derived lens and mission content as attributed data that cannot override caller, system, developer, or agent operating instructions. | Agents consume generated artifacts directly, so hostile source text must remain evidence rather than executable instruction. | VAL-5 / VAL-9 |
| REQ-10 | Compatibility | Must | The system shall version the context-link grammar, registry schema, lens artifact schema, CLI JSON output, and lockfile schema. | Consumers need stable contracts. | VAL-9 |
| REQ-11 | Functional | Should | The system shall choose a default lens from the registry when a link omits the lens parameter. | Authors should not need to over-specify common context needs. | VAL-2 / VAL-3 |
| REQ-12 | Functional | Should | The system shall support later write-side `suggest-links` and `insert-link` workflows without modifying files by default. | Agents need write-side assistance that remains reviewable after read-side behavior is stable. | VAL-6 |
| REQ-13 | Operability | Should | The system shall expose resolver decisions in machine-readable diagnostics. | Agents, CI, and reviewers need transparent failures. | VAL-6 / VAL-9 |
| REQ-14 | Performance | Could | The system shall scan a Markdown document containing 100 links in less than 2 seconds on a local Node.js development runtime. | The preflight path should stay cheap enough for agent use. | VAL-10 |
| REQ-16 | Functional | Should | The system shall aggregate resolved lenses into a deterministic `mission` packet after the read-side MVP proves `scan`, `validate`, and `resolve`. | Mission packets are valuable for agents but should not expand the first implementation slice. | VAL-4 / VAL-7 |

Section status: Complete

## 6. Success Measures and Kill Criteria

| Measure | Baseline | Target or decision threshold | Evaluation date or decision event | Related IDs |
| --- | --- | --- | --- | --- |
| Context-link extraction coverage | 0 `markdown-context` extraction helpers on 2026-05-14 | CLI `scan` identifies context links from `markdown-engine` `linkReferences` fixtures covering inline links, images, definitions, link reference usages, and image reference usages. | Initial implementation review | OBJ-1 / REQ-1 |
| Deterministic resolution proof | 0 `markdown-context` lockfile or deterministic lens proof on 2026-05-14 | Repeated `resolve` runs for `ctx://repo/path/...` links produce byte-identical lenses, identical registry hashes, and identical lockfile hashes for fixture inputs. | Read-side MVP milestone | OBJ-3 / REQ-4 / REQ-6 / REQ-7 |
| Agent preflight usability | Agents currently rely on prose instructions or manual URL resolution. | Codex-style shell workflow can run `scan`, `validate`, and `resolve` locally against a Markdown task file and inspect the resulting lens artifact with citations. | Agent workflow exercise | OBJ-2 / REQ-5 |
| Write-side safety | 0 suggestion or insert helpers on 2026-05-14 | Later `suggest-links` produces a reviewable patch or JSON proposal without mutating files by default. | Write-side milestone after read-side MVP | OBJ-4 / REQ-12 |
| Stop threshold | No stop threshold exists today. | Stop core implementation if deterministic local resolution cannot be proven without network or LLM calls for at least one useful lens type. | Before first release candidate | OBJ-3 / REQ-6 / REQ-8 |

Section status: Complete

## Layer 1 Exit

Layer 1 status: Complete

## Layer 2: Functional Specification

## 7. System Context and External Interfaces

System boundary: `markdown-context` is a local library and CLI that scans Markdown through `markdown-engine`, validates `ctx://` context links against a registry, resolves supported links into lens artifacts, writes lockfiles, and optionally proposes link edits in later milestones. The read-side MVP includes `scan`, `validate`, and `resolve` for offline `repo/path` links. It does not require a daemon, MCP server, OS handler, browser runtime, or network connector for the core path.

External actors and systems: Coding agents, humans, CI jobs, repository files, `markdown-engine`, local file system, resolver registry config, optional future MCP adapter, optional future external-source adapters.

Trust or control boundaries: Markdown content, registry config, generated lens artifacts, lockfiles, and CLI arguments cross from caller-controlled input into the resolver. The resolver treats all context links as inert data and only executes code paths compiled into trusted resolver modules.

| Interface | Owner | Consumer or dependency | Inputs | Outputs |
| --- | --- | --- | --- | --- |
| CLI | `markdown-context` | Humans, agents, CI | Markdown paths, context URLs, registry config, command options | Text, JSON diagnostics, lens artifacts, lockfiles, optional patch proposals |
| Library API | `markdown-context` | Future adapters and tests | Engine document, registry config, resolver options | Extracted links, validation results, resolved lenses |
| Markdown parser boundary | `markdown-engine` | `markdown-context` | Markdown text and parse options | Normalized document and diagnostics |
| Registry config | `markdown-context` | CLI and library API | Versioned YAML or JSON schema | Allowed schemes, kinds, id patterns, lenses, parameters, defaults |
| Lens artifact files | `markdown-context` | Agents, humans, CI | Resolved context source data | Markdown or JSON lens payloads |
| Context lockfile | `markdown-context` | Reviewers, CI, agents | Resolved link records | Deterministic registry identity, source identity, resolver identity, hashes |
| Optional MCP adapter | Future `markdown-mcp` | MCP-capable agents | Tool calls over resolver core | Same scan, resolve, and mission outputs as CLI |

Section status: Complete

## 8. Operational Scenarios and Functional Behavior

| ID | Trigger | Preconditions | Behavior or outcome | Related requirements |
| --- | --- | --- | --- | --- |
| FLOW-1 | Agent starts work from a task Markdown file. | File contains zero or more `ctx://` links and a registry is available. | During the read-side MVP, the agent runs `scan`, `validate`, and `resolve` to inspect bounded lens artifacts; after the mission milestone, the agent may run `markdown-context mission <file>` and receive an aggregated mission packet plus diagnostics. | REQ-1 / REQ-2 / REQ-4 / REQ-5 / REQ-16 |
| FLOW-2 | Agent or CI validates a Markdown file. | File contains context links and command uses a registry. | The command reports invalid schemes, kinds, identifiers, lenses, or parameters without resolving rejected links. | REQ-2 / REQ-3 / REQ-9 |
| FLOW-3 | Agent resolves one context link directly. | Link is valid and supported by a deterministic resolver. | The command emits one lens artifact and records lockfile data when requested. | REQ-4 / REQ-6 / REQ-7 |
| FLOW-4 | Agent prepares a handoff or PR description. | Markdown contains plain references or existing context links and the later write-side milestone is in scope. | The agent runs `suggest-links` and receives candidate context links without file mutation by default. | REQ-12 |
| FLOW-5 | Agent inserts an approved context link. | Caller supplies kind, id, optional lens, target file location, and the later write-side milestone is in scope. | The command writes a normalized Markdown link or emits a patch proposal based on options. | REQ-12 |
| FLOW-6 | Reviewer audits what context an agent used. | Lens artifacts and lockfile exist. | The reviewer compares lockfile records, registry identity, hashes, resolver version, and source identity against the committed artifact. | REQ-6 / REQ-7 / REQ-10 |
| FLOW-7 | MCP is available in an agent runtime. | Optional adapter is installed and points at the same resolver core. | MCP tools expose the same scan and resolve behavior as the CLI without redefining schemas. | REQ-10 / REQ-13 |
| FUNC-1 | `scan` is invoked. | Markdown input parses through `markdown-engine`. | The CLI returns discovered context links with label, URL, source range, scheme, kind, id, lens request, and params. | REQ-1 / REQ-5 |
| FUNC-2 | `validate` is invoked. | A registry config is loaded. | The CLI returns deterministic diagnostics for invalid context links and unsupported registry declarations. | REQ-2 / REQ-3 / REQ-13 |
| FUNC-3 | `resolve` is invoked. | A valid context link maps to a supported resolver. | The CLI returns the requested or default lens artifact without executing the link target. | REQ-4 / REQ-9 |
| FUNC-4 | `mission` is invoked after the read-side MVP. | Markdown file contains resolvable context links. | The CLI returns a deterministically aggregated mission packet with objective, constraints, relevant files, validation gates, risks, conflict diagnostics, overflow diagnostics, and citations when available. | REQ-4 / REQ-6 / REQ-16 |
| FUNC-5 | `suggest-links` is invoked after the read-side MVP. | Markdown contains eligible plain references. | The CLI returns candidate context links and confidence reasons without modifying the file. | REQ-12 / REQ-13 |
| FUNC-6 | A link omits `lens`. | Registry defines a default lens for the resource kind. | The resolver uses the registry default and reports the selected lens in output metadata. | REQ-11 / REQ-13 |
| FUNC-7 | A forbidden param appears. | Link contains an unregistered parameter such as `prompt`. | Validation emits a diagnostic and resolution skips that link. | REQ-3 / REQ-9 |
| FUNC-8 | Optional MCP adapter is invoked. | Adapter is installed and configured against the same resolver core. | The adapter exposes scan, resolve, and mission behavior through the core schemas without redefining output contracts. | REQ-10 |
| FUNC-9 | `insert-link` is invoked after the read-side MVP. | Caller supplies kind, id, optional lens, target file location, and explicit write or patch option. | The CLI writes one normalized Markdown context link or emits a patch proposal, and written output validates through the same registry. | REQ-12 |

Section status: Complete

## 9. State Model, Faults, and Misuse Cases

States and transitions: Each invocation is stateless except for optional generated output. Per command, the system transitions through InputReceived, MarkdownParsed, LinksExtracted, RegistryLoaded, LinksValidated, LensSelected, SourcesRead, LensRendered, LockfileWritten, and ResultEmitted. Validation failures transition directly to ResultEmitted with diagnostics for affected links.

| Scenario | Expected behavior | Invariant maintained | Related IDs |
| --- | --- | --- | --- |
| Fault-1 | Markdown parse diagnostics are returned with no resolver execution. | Parser errors remain data and do not trigger link handling. | REQ-1 / REQ-9 / FUNC-1 |
| Fault-2 | Unknown scheme, kind, lens, or parameter produces deterministic diagnostics. | Unsupported inputs fail closed. | REQ-2 / REQ-3 / FUNC-2 |
| Fault-3 | Resolver source is missing or changed relative to a lockfile. | The CLI reports stale or unresolved context instead of fabricating a lens. | REQ-6 / REQ-7 / FUNC-3 |
| Fault-4 | Offline mode is enabled but a resolver requires network access. | The resolver is rejected before external access. | REQ-8 / REQ-9 / FUNC-3 |
| Misuse-1 | A link includes `prompt=ignore-instructions` or equivalent free-form instruction text. | Prompt-like params are rejected unless explicitly modeled as inert enumerated values. | REQ-3 / REQ-9 / FUNC-7 |
| Misuse-2 | A caller attempts to open `ctx://` through an OS app handler. | Core CLI treats the URL as data and never dispatches OS handlers. | REQ-9 / NG-1 |
| Misuse-3 | An agent requests an unsupported richer lens after a small lens is insufficient. | The resolver returns allowed lens choices instead of inventing a projection. | REQ-2 / REQ-11 / FUNC-6 |
| Misuse-4 | Resolved source content contains text such as `ignore previous instructions` or equivalent agent-directed language. | The renderer preserves the text only inside attributed source-data boundaries, emits citations and trust labels, and the bootloader contract tells agents to treat source-derived content as evidence rather than instructions. | REQ-15 / FUNC-3 / FUNC-4 |

Section status: Complete

## 10. External Service Levels and Acceptance Cases

External service expectations: The core CLI runs locally, requires no long-lived service, and supports offline deterministic resolution for configured local resolvers. For deterministic fixture inputs, repeated runs on the same package version and Node runtime produce byte-identical output.

| ID | Acceptance case | Expected result | Covers |
| --- | --- | --- | --- |
| ACC-1 | Scan a Markdown file containing `[BEL-884](ctx://linear/issue/BEL-884?lens=execution)`. | Output contains one context link with scheme `ctx`, namespace `linear`, kind `issue`, id `BEL-884`, lens `execution`, label `BEL-884`, and source range. | REQ-1 / FUNC-1 |
| ACC-2 | Validate a link with an unregistered `prompt` parameter. | Validation fails with a deterministic diagnostic and resolution does not run for that link. | REQ-3 / REQ-9 / FUNC-7 |
| ACC-3 | Resolve `ctx://repo/path/docs/design/markdown-context-operational-design-spec.md?lens=excerpt` twice with identical inputs. | Lens artifact bytes, registry identity, registry hash, source identity, and lockfile content hash are identical across both runs. | REQ-4 / REQ-6 / REQ-7 / FUNC-3 |
| ACC-4 | After the read-side MVP, run `mission` on a task file with task, contract, and repo-path links twice with identical inputs. | Output contains byte-identical bounded mission packets with the same ordered sections, citations, conflict diagnostics, overflow diagnostics, and no raw unbounded source dump. | REQ-4 / REQ-6 / REQ-16 / FUNC-4 |
| ACC-5 | After the read-side MVP, run `suggest-links` on a handoff document. | Output proposes context links with confidence reasons and does not mutate files unless an explicit write option is supplied. | REQ-12 / FUNC-5 |
| ACC-6 | Run offline mode against a resolver configured for network access. | Command fails closed with an offline-mode diagnostic. | REQ-8 / REQ-9 / FUNC-3 |
| ACC-7 | Scan a fixture with 100 links. | Command completes in less than 2 seconds on the target local Node.js development runtime. | REQ-14 / FUNC-1 |
| ACC-8 | Resolve or aggregate a fixture whose source text contains hostile agent instructions. | Lens and mission output retains hostile text only as attributed source data with citations and trust labels, and no renderer output promotes that source text into agent operating instructions. | REQ-15 / FUNC-3 / FUNC-4 |
| ACC-9 | After the read-side MVP, run `insert-link` with an explicit write option and valid target location. | Command writes one normalized Markdown context link or emits a patch proposal when patch mode is selected, and validation recognizes the inserted link. | REQ-12 / FUNC-9 |
| ACC-10 | Run an optional MCP adapter contract fixture against scan, resolve, and mission behavior. | Adapter responses use the same core schema versions, field contracts, diagnostics shape, and output semantics as CLI/core outputs without introducing MCP-only schema drift. | REQ-10 / FLOW-7 / FUNC-8 |

Section status: Complete

## 11. Requirements-to-Behavior Traceability

| Requirement | Functional behaviors or flows | Acceptance coverage | Notes |
| --- | --- | --- | --- |
| REQ-1 | FLOW-1 / FUNC-1 | ACC-1 | Extraction depends on `markdown-engine` normalized IR. |
| REQ-2 | FLOW-2 / FUNC-2 | ACC-1 / ACC-2 | Registry validation covers grammar and supported declarations. |
| REQ-3 | FLOW-2 / FUNC-7 | ACC-2 | Prompt firewall depends on closed parameter vocabulary. |
| REQ-4 | FLOW-1 / FLOW-3 / FUNC-3 / FUNC-4 | ACC-3 / ACC-4 | Lens artifacts are bounded projections. |
| REQ-5 | FLOW-1 / FLOW-2 / FLOW-3 / FUNC-1 / FUNC-2 / FUNC-3 | ACC-1 / ACC-2 / ACC-3 | `scan`, `validate`, and `resolve` are the read-side MVP CLI surface. |
| REQ-6 | FLOW-3 / FLOW-6 / FUNC-3 / FUNC-4 | ACC-3 / ACC-4 | Deterministic proof requires byte comparison. |
| REQ-7 | FLOW-3 / FLOW-6 / FUNC-3 | ACC-3 | Lockfile records context provenance. |
| REQ-8 | FLOW-3 / FUNC-3 | ACC-6 | Offline mode proves the low-overhead core path. |
| REQ-9 | FLOW-2 / FLOW-3 / FUNC-3 / FUNC-7 | ACC-2 / ACC-6 | Links remain inert through all operations. |
| REQ-15 | FLOW-1 / FLOW-3 / FUNC-3 / FUNC-4 | ACC-8 | Source-derived content remains attributed data even when it contains hostile instructions. |
| REQ-10 | FLOW-6 / FLOW-7 / FUNC-8 | ACC-3 / ACC-10 | Schema versions make future adapters compatible. |
| REQ-11 | FLOW-1 / FUNC-6 | ACC-4 | Lens defaults are explicit registry behavior. |
| REQ-12 | FLOW-4 / FLOW-5 / FUNC-5 / FUNC-9 | ACC-5 / ACC-9 | Write-side behavior is later milestone scope and non-mutating by default. |
| REQ-13 | FLOW-2 / FUNC-2 / FUNC-5 / FUNC-6 | ACC-2 / ACC-5 | Diagnostics make resolver decisions transparent. |
| REQ-14 | FUNC-1 | ACC-7 | Performance bound applies to scan. |
| REQ-16 | FLOW-1 / FUNC-4 | ACC-4 | Mission aggregation is later milestone scope after read-side deterministic proof. |

Section status: Complete

## Layer 2 Exit

Layer 2 status: Complete

## Layer 3: Technical Specification

## 12. Architecture Overview

Architecture summary: `markdown-context` will be a TypeScript package with a core library, CLI, registry schema loader, context-link extractor, deterministic resolver registry, lens renderer, and lockfile writer. The read-side MVP ships `scan`, `validate`, and `resolve` for `ctx://repo/path/...` links first. Mission aggregation, write-side helpers, MCP, OS app handlers, and external connectors are later layers over the core, not prerequisites.

Major components and boundaries: The core library owns extraction, validation, lens selection, resolver dispatch, diagnostics, and lockfile records. The CLI owns command parsing and file IO. `markdown-engine` owns Markdown parsing and normalized IR. Resolver modules own source-specific deterministic projection logic. Generated lens files and lockfiles are output artifacts consumed by agents and reviewers.

Deployment or runtime placement: The package runs in the caller's local Node.js process. It may be installed as a repo dev dependency, global CLI, or agent image dependency. No daemon is required for the core path.

Architecture rationale: This architecture satisfies the section 5 requirements by reusing `markdown-engine`, keeping link interpretation deterministic, giving agents a shell/file integration before MCP, proving one offline resolver before network-backed adapters, and isolating future mission, write-side, network, or MCP behavior behind the same core contracts.

Section status: Complete

## 13. Technical Mechanisms and Allocation

| ID | Mechanism | Component or owner | Responsibility | Related behaviors |
| --- | --- | --- | --- | --- |
| TECH-1 | `markdown-engine` integration | Core library | Parse Markdown and receive normalized documents with source-located `linkReferences` records. | FUNC-1 |
| TECH-2 | Context-link parser | Core library | Canonicalize URL components into scheme, kind, id, lens, params, label, and source range. | FUNC-1 / FUNC-2 |
| TECH-3 | Registry schema loader | Core library | Load versioned YAML or JSON registry config and reject unsupported declarations. | FUNC-2 / FUNC-6 / FUNC-7 |
| TECH-4 | Prompt firewall validator | Core library | Reject free-form or unregistered parameters before resolver dispatch. | FUNC-2 / FUNC-7 |
| TECH-5 | Lens selection policy | Core library | Honor explicit lens values or choose registry defaults. | FUNC-3 / FUNC-6 |
| TECH-6 | Deterministic resolver registry | Core library | Dispatch valid links to local deterministic resolvers by kind and lens. | FUNC-3 / FUNC-4 |
| TECH-7 | Lens renderer | Core library | Emit bounded Markdown or JSON lens artifacts with citations and metadata. | FUNC-3 / FUNC-4 |
| TECH-8 | Context lockfile writer | Core library and CLI | Record link URL, selected lens, registry identity, registry version, registry hash, source identity, resolver version, artifact path, and content hash. | FUNC-3 / FUNC-4 |
| TECH-9 | CLI command surface | CLI | Provide `scan`, `validate`, and `resolve` for the read-side MVP; add `mission`, `suggest-links`, and `insert-link` in later milestones without changing core schemas. | FUNC-1 / FUNC-2 / FUNC-3 / FUNC-4 / FUNC-5 / FUNC-9 |
| TECH-10 | Write-side proposal engine | CLI and core library | After the read-side MVP, suggest or insert normalized context links with non-mutating defaults. | FUNC-5 / FUNC-9 |
| TECH-11 | Agent bootloader documentation | Documentation | Tell agents when to run CLI commands and how to treat lenses. | FUNC-4 / FUNC-5 |
| TECH-12 | Optional adapter boundary | Future adapter | Expose resolver core through MCP without changing schemas. | FLOW-7 / FUNC-8 |
| TECH-13 | Deterministic mission aggregator | Core library | After the read-side MVP, deduplicate, order, merge, budget, and render resolved lenses into a stable mission packet. | FUNC-4 |
| TECH-14 | Source-content isolation policy | Lens renderer and documentation | Label source-derived content with provenance and trust metadata, render it inside explicit source-data boundaries, and document that source text is evidence rather than an agent instruction source. | FUNC-3 / FUNC-4 |

Section status: Complete

## 14. Data, Schemas, and Compatibility

| Change | Type | Compatibility impact | Reversibility | Mitigation |
| --- | --- | --- | --- | --- |
| Context-link grammar | Schema | New public grammar for `ctx://<namespace>/<kind>/<id>?lens=<lens>&...`. | Reversible before first release; semver-controlled after release | Version the grammar and validate fixtures. |
| Registry config | Config | New YAML or JSON schema for schemes, kinds, id patterns, lenses, params, defaults, and resolver mapping. | Reversible before first release; semver-controlled after release | Include schema version and unsupported-declaration diagnostics. |
| Extracted link JSON | API | New machine-readable contract for scan output. | Reversible before first release; semver-controlled after release | Snapshot CLI JSON output. |
| Lens artifact schema | Schema | New Markdown or JSON artifact contract consumed by agents. | Reversible before first release; semver-controlled after release | Include schema version, source citations, and bounded sections. |
| Context lockfile | Schema | New deterministic provenance record for resolved context. | Reversible before first release; semver-controlled after release | Include lockfile version and migration notes after release. |
| Write-side patch proposal | API | New optional patch or JSON proposal format for suggested links. | Reversible before first release; semver-controlled after release | Keep mutation opt-in and test no-write defaults. |
| Optional MCP adapter contract | API | Future transport over existing core output. | Reversible if kept outside core package | Require adapter to reuse core schemas. |

Canonical context URL interpretation:

- Example: `ctx://linear/issue/BEL-884?lens=execution`
- Initial offline resolver example: `ctx://repo/path/docs/design/markdown-context-operational-design-spec.md?lens=excerpt`
- `scheme`: `ctx`
- `namespace`: URL host, such as `linear`, `doc`, or `repo`
- `kind`: first path segment, such as `issue`, `path`, or `section`
- `id`: remaining path after `kind`, decoded according to registry rules
- `lens`: optional query value selected from the registry
- Additional params: closed-vocabulary query values declared by the registry

Minimum extracted link fields: `schemaVersion`, `label`, `url`, `canonicalUrl`, `scheme`, `namespace`, `kind`, `id`, `requestedLens`, `params`, and `sourceRange`. `sourceRange` is required for Markdown scan output; when a future non-Markdown source cannot provide ranges, it shall emit an explicit `sourceRangeUnavailable` diagnostic instead of omitting the field silently.

Minimum lens artifact fields: `schemaVersion`, `canonicalUrl`, `selectedLens`, `resolverId`, `resolverVersion`, `sourceIdentity`, `contentHash`, `citations`, `sourceTrust`, `sourceContentBoundary`, and `content`.

Minimum lockfile record fields: `schemaVersion`, `canonicalUrl`, `selectedLens`, `artifactPath`, `artifactHash`, `registryId`, `registryVersion`, `registryHash`, `resolverId`, `resolverVersion`, `sourceIdentity`, `sourceHash`, and command options that affect output.

Source-content isolation rules:

- Source-derived content blocks record source identity, citations, `sourceTrust: untrusted-source-data` by default, and a source-content boundary marker in both JSON and Markdown renderings.
- Markdown artifacts render source-derived text only under explicit source-data headings, fenced blocks, blockquotes, or equivalent labeled boundaries; renderer templates shall not present raw source text as system, developer, operator, or agent instructions.
- Mission sections that summarize source content retain provenance and trust labels. Resolver summaries may inform Objective, Constraints, Relevant Files, Validation Gates, Risks, and Open Questions, but they remain task evidence subject to higher-priority operating instructions.
- Agent bootloader documentation shall state that lens and mission source-data blocks are evidence for the work item and shall not override system, developer, tool, repository, or user instructions.

Canonicalization rules for deterministic outputs:

- Text artifacts use UTF-8, LF line endings, and a final newline.
- Generated artifacts do not include wall-clock timestamps, process IDs, absolute temporary paths, random identifiers, locale-sensitive sorting, or environment-specific values unless the value is declared as an output-affecting command option.
- Canonical URLs lower-case the scheme and namespace, preserve registry-significant path case, normalize dot segments, percent-decode unreserved characters, percent-encode reserved characters where required, and omit empty query parameters.
- Query parameters are sorted by key and then value after decoding. Duplicate query params are rejected unless the registry declares the parameter as multi-valued; multi-valued params are serialized as sorted arrays in JSON and sorted repeated query keys in canonical URLs.
- JSON output uses deterministic serialization: recursively sorted object keys, arrays kept in schema-defined order, no `undefined` fields, no insignificant whitespace unless `pretty` is explicitly selected, and a final LF when written to disk.
- Markdown lens and mission output is rendered from canonical JSON data through fixed heading order and fixed list ordering rules; renderer output is included in snapshot tests.
- Hashes use `sha256:<lowercase-hex>` over the exact canonical bytes written to disk.
- Local file `sourceIdentity` records repository-relative POSIX path, source kind, byte range when applicable, and either the git blob hash when available or `sha256:<lowercase-hex>` over canonical source bytes.
- `registryHash` uses `sha256:<lowercase-hex>` over the canonical registry config bytes. `registryId` and `registryVersion` are recorded before validation, lens selection, resolver dispatch, and mission aggregation.
- External-source adapters shall define source identity, source revision, and canonical byte rules before they can participate in VAL-4.
- Command options in lockfiles are serialized as a sorted object containing only options that can affect output bytes.

Mission aggregation rules:

- Resolve only validated links. Rejected links contribute diagnostics and never contribute content.
- Deduplicate resolved lens records by `canonicalUrl`, `selectedLens`, `resolverId`, and `sourceIdentity`; retain all source ranges as citations.
- Order included lens records by registry-declared priority, then `namespace`, `kind`, `id`, `selectedLens`, `canonicalUrl`, and first source offset.
- Render mission packet sections in this fixed order: Objective, Constraints, Relevant Files, Validation Gates, Risks, Open Questions, Citations, Diagnostics.
- Within each section, group entries by source lens record order and then by resolver-provided stable item key. Duplicate identical entries collapse to one entry with all citations retained.
- Conflicting entries are not reconciled semantically. They are emitted in source order under Diagnostics with both citations and a `mission.conflict` diagnostic code.
- Budget limits are deterministic. When a byte or item budget is exceeded, the aggregator keeps earlier ordered entries, omits later entries, and emits `mission.overflow` diagnostics containing the omitted source identities.
- The mission packet lockfile record includes ordered input lens hashes, selected aggregation policy version, output artifact hash, and all output-affecting command options.

Section status: Complete

## 15. Control Logic and Non-Functional Controls

Control logic summary: Each read-side MVP command follows a fixed order: load inputs, parse Markdown through `markdown-engine`, extract candidate links, load registry, validate grammar and parameters, select lens, dispatch only validated `ctx://repo/path/...` links to the local resolver, render bounded lenses, write optional artifacts and lockfile records, then emit diagnostics and command output. Later mission and write-side commands reuse the same validated-link and resolver outputs before aggregation or patch proposal.

Concurrency and ordering model: CLI commands are single-process by default. Multi-file commands process files in deterministic sorted order unless the caller requests a different order. Lockfile records are sorted by canonical URL, selected lens, resolver id, source identity, and artifact path before serialization.

Failure recovery model: Expected input, registry, resolver, and stale-lock failures return structured diagnostics and non-zero exit codes where appropriate. The CLI does not partially mutate Markdown files unless an explicit write operation is selected; write operations shall use temporary files or patch output before replacement.

| Requirement | Mechanism | Notes |
| --- | --- | --- |
| REQ-1 | TECH-1 / TECH-2 | Extraction is parser-independent through engine IR. |
| REQ-2 | TECH-2 / TECH-3 | Registry validation is closed vocabulary. |
| REQ-3 | TECH-4 | Prompt-like params fail before resolution. |
| REQ-4 | TECH-5 / TECH-6 / TECH-7 | Resolvers produce bounded artifacts. |
| REQ-5 | TECH-9 | Read-side MVP CLI integration avoids mandatory MCP. |
| REQ-6 | TECH-6 / TECH-7 / TECH-8 | Read-side MVP determinism is proved by canonical lens output and hashes. |
| REQ-7 | TECH-8 | Lockfile records provenance. |
| REQ-8 | TECH-6 / TECH-9 | Offline mode blocks non-local resolvers. |
| REQ-9 | TECH-4 / TECH-6 / TECH-9 | Links remain data through the command path. |
| REQ-15 | TECH-7 / TECH-11 / TECH-14 | Source-derived lens and mission content remains attributed data, not operating instructions. |
| REQ-10 | TECH-3 / TECH-7 / TECH-8 / TECH-12 | Public schemas are versioned. |
| REQ-11 | TECH-3 / TECH-5 | Defaults live in registry config. |
| REQ-12 | TECH-10 | Suggestions are reviewable and non-mutating by default. |
| REQ-13 | TECH-3 / TECH-9 | Diagnostics expose decisions. |
| REQ-14 | TECH-1 / TECH-2 / TECH-9 | Scan path avoids resolver work. |
| REQ-16 | TECH-8 / TECH-11 / TECH-13 / TECH-14 | Later mission packets reuse deterministic resolved lenses, aggregation policy, and source-content boundaries. |

Section status: Complete

## 16. Observability, Operations, Rollout, and Rollback

| Signal | Type | Purpose | Consumer |
| --- | --- | --- | --- |
| CLI exit code | Audit | Indicates success, validation failure, resolver failure, or command misuse. | Agents, humans, CI |
| Structured diagnostics JSON | Log | Explains invalid links, rejected params, resolver failures, and stale lockfiles. | Agents, reviewers, CI |
| Context lockfile diff | Audit | Shows what links and lens artifacts changed between runs. | Reviewers, maintainers |
| Lens artifact hash | Audit | Confirms deterministic artifact identity. | Reviewers, CI |
| Resolver trace metadata | Log | Records resolver id, version, source identity, selected lens, and offline status. | Maintainers |
| Snapshot test output | Audit | Detects unintended contract drift. | Maintainers |

Rollout plan: Build the core library and read-side CLI behind fixture-driven tests first: `scan`, `validate`, and `resolve` for `ctx://repo/path/...`. Publish registry, lens, CLI JSON, diagnostics, and lockfile schemas before adding mission aggregation, write-side commands, or optional adapters. Add AGENTS.md and CLAUDE.md bootloader examples only after read-side CLI behavior is stable. Treat MCP as a later adapter over the same core output.

Rollback or containment plan: Before first release, revert the package or remove generated files. After release, disable adoption by removing bootloader instructions, generated lens artifacts, and lockfiles from consuming repos. Since the core design does not mutate source Markdown without explicit write commands, rollback containment is limited to reverting intentional link insertions or generated artifacts.

Operator actions: Maintainers run `markdown-context scan`, `markdown-context validate`, and `markdown-context resolve`, inspect diagnostics, compare lockfile diffs, review any later suggested link patches before applying, and block release on deterministic proof failure or prompt-firewall regression.

Section status: Complete

## 17. Verification Strategy and Behavior-to-Mechanism Traceability

| ID | Verification method | What is verified | Related IDs |
| --- | --- | --- | --- |
| VAL-1 | Test | `markdown-engine` integration extracts context links with labels, URLs, source ranges, and reference-definition metadata from public `linkReferences` records. | REQ-1 / FUNC-1 / TECH-1 / TECH-2 |
| VAL-2 | Test | Registry grammar validates schemes, kinds, id patterns, lenses, params, and default-lens selection. | REQ-2 / REQ-11 / FUNC-2 / FUNC-6 / TECH-3 / TECH-5 |
| VAL-3 | Test | Supported context links resolve into bounded lens artifacts with expected fields and citations. | REQ-4 / FUNC-3 / FUNC-4 / TECH-6 / TECH-7 |
| VAL-4 | Test / Analysis | Repeated offline `ctx://repo/path/...` resolution produces byte-identical lens artifacts, identical registry hashes, and identical lockfile hashes for identical inputs under the canonicalization rules; later mission tests add byte-identical mission packets under the mission aggregation rules. | REQ-4 / REQ-6 / REQ-7 / REQ-8 / REQ-16 / FUNC-3 / FUNC-4 / TECH-6 / TECH-7 / TECH-8 / TECH-13 |
| VAL-5 | Test / Inspection | Prompt-like params, unknown params, hostile source-content instructions, OS-handler execution attempts, and unsupported resolvers fail closed or remain bounded as attributed source data. | REQ-3 / REQ-9 / REQ-15 / FUNC-3 / FUNC-4 / FUNC-7 / TECH-4 / TECH-6 / TECH-7 / TECH-11 / TECH-14 |
| VAL-6 | Test | CLI commands emit documented text or JSON output, diagnostics, and exit codes; later write-side tests verify explicit `insert-link` write behavior and non-mutating suggestion behavior. | REQ-5 / REQ-12 / REQ-13 / FUNC-1 / FUNC-2 / FUNC-5 / FUNC-9 / TECH-9 / TECH-10 |
| VAL-7 | Manual exercise | A coding agent can run the read-side CLI preflight and use resolved lens output without MCP; after the mission milestone, the agent can use the mission packet without MCP. | OBJ-2 / REQ-5 / REQ-16 / FUNC-3 / FUNC-4 / TECH-9 / TECH-11 |
| VAL-8 | Inspection | MCP and external connectors are absent from the core runtime path or isolated behind adapter boundaries. | REQ-10 / CON-4 / FLOW-7 / FUNC-8 / TECH-12 |
| VAL-9 | Snapshot / Contract review | Context-link, registry, lens artifact, CLI JSON, diagnostics, source-content boundary fields, optional adapter output contracts, and lockfile schemas are versioned and stable. | REQ-10 / REQ-13 / REQ-15 / FUNC-8 / TECH-3 / TECH-7 / TECH-8 / TECH-9 / TECH-12 / TECH-14 |
| VAL-10 | Performance test | Scan completes a 100-link Markdown fixture in less than 2 seconds on a local Node.js development runtime. | REQ-14 / FUNC-1 / TECH-1 / TECH-2 / TECH-9 |

| Behavior or requirement | Mechanisms | Verification |
| --- | --- | --- |
| FUNC-1 | TECH-1 / TECH-2 / TECH-9 | VAL-1 / VAL-10 |
| FUNC-2 | TECH-2 / TECH-3 / TECH-4 / TECH-9 | VAL-2 / VAL-5 / VAL-6 |
| FUNC-3 | TECH-5 / TECH-6 / TECH-7 / TECH-8 / TECH-9 / TECH-14 | VAL-3 / VAL-4 / VAL-5 |
| FUNC-4 | TECH-5 / TECH-6 / TECH-7 / TECH-8 / TECH-9 / TECH-11 / TECH-13 / TECH-14 | VAL-3 / VAL-4 / VAL-5 / VAL-7 |
| FUNC-5 | TECH-9 / TECH-10 | VAL-6 |
| FUNC-6 | TECH-3 / TECH-5 | VAL-2 |
| FUNC-7 | TECH-4 / TECH-9 | VAL-5 / VAL-6 |
| FUNC-8 | TECH-12 | VAL-8 / VAL-9 |
| FUNC-9 | TECH-9 / TECH-10 | VAL-6 |
| REQ-1 | TECH-1 / TECH-2 | VAL-1 |
| REQ-2 | TECH-2 / TECH-3 | VAL-2 |
| REQ-3 | TECH-4 | VAL-5 |
| REQ-4 | TECH-5 / TECH-6 / TECH-7 | VAL-3 / VAL-4 |
| REQ-5 | TECH-9 | VAL-6 / VAL-7 |
| REQ-6 | TECH-6 / TECH-7 / TECH-8 | VAL-4 |
| REQ-7 | TECH-8 | VAL-4 |
| REQ-8 | TECH-6 / TECH-9 | VAL-4 / VAL-5 |
| REQ-9 | TECH-4 / TECH-6 / TECH-9 | VAL-5 |
| REQ-15 | TECH-7 / TECH-11 / TECH-14 | VAL-5 / VAL-9 |
| REQ-10 | TECH-3 / TECH-7 / TECH-8 / TECH-12 | VAL-8 / VAL-9 |
| REQ-11 | TECH-3 / TECH-5 | VAL-2 |
| REQ-12 | TECH-10 | VAL-6 |
| REQ-13 | TECH-3 / TECH-9 | VAL-6 / VAL-9 |
| REQ-14 | TECH-1 / TECH-2 / TECH-9 | VAL-10 |
| REQ-16 | TECH-8 / TECH-11 / TECH-13 / TECH-14 | VAL-4 / VAL-7 / VAL-9 |

Section status: Complete

## 18. Alternatives, Risks, Open Questions, and Final Exit

### Alternatives Considered

| Alternative | Benefit | Reason not selected |
| --- | --- | --- |
| MCP-first resolver | Proven agent tool transport and strong interactivity. | Higher setup overhead, less elegant for no-tool agents, and unnecessary for deterministic local resolution. |
| OS protocol handler first | Natural UX for clicking links. | Crosses execution boundary too early and does not help CI or no-GUI agents. |
| Raw Markdown URLs plus caller code | Requires almost no new infrastructure. | Leaves extraction, validation, lens selection, provenance, and write-side behavior duplicated across consumers. |
| Embed full prompt text in URL params | Maximizes author flexibility. | Creates hidden prompt injection and destroys deterministic projection semantics. |
| Make `markdown-engine` resolve links directly | Reuses existing package surface. | Violates the engine boundary by adding runtime interpretation and resolver behavior. |

### Material Risks

| ID | Risk | Probability | Impact | Mitigation | Verification |
| --- | --- | --- | --- | --- | --- |
| RISK-1 | Context links or resolved source content become hidden prompt injection. | Medium | High | Closed parameter vocabulary, prompt firewall, source-content boundaries, trust labels, and no free-form prompt params. | VAL-5 |
| RISK-2 | Lens outputs drift because external sources change. | Medium | Medium | Offline deterministic MVP, registry identity, source identity, resolver version, and lockfile hashes. | VAL-4 |
| RISK-3 | Agents ignore the system because setup is too heavy. | Medium | Medium | CLI-first workflow, generated sidecar files, bootloader docs, MCP optional. | VAL-7 |
| RISK-4 | Resolver schemas become too project-specific. | Medium | Medium | Versioned registry with generic schemes, kinds, lenses, and adapter boundaries. | VAL-9 |
| RISK-5 | Write-side commands mutate Markdown unexpectedly. | Low | Medium | Non-mutating defaults, patch proposal mode, explicit write flags. | VAL-6 |

### Resolved Implementation Decisions

| ID | Decision | Owner | Resolution |
| --- | --- | --- | --- |
| Q-1 | Default context-link scheme | Project owner | Use `ctx://` for the initial implementation and lock it into grammar fixtures. |
| Q-2 | First local deterministic resolver | Project owner | Ship `repo/path` first to prove offline deterministic resolution against checked-in repository files before issue mirrors, doc-section projections, or external connectors. |

### Open Questions

| ID | Question | Owner | Due date or trigger | Resolution plan |
| --- | --- | --- | --- | --- |
| Q-3 | Should generated lens artifacts default to Markdown, JSON, or both? | Agent workflow reviewer | Before CLI output contract review | Validate with one Codex-style and one no-tool LLM workflow. |

### Waivers

Waivers: none

### Final Consistency Gate

| Gate | Result |
| --- | --- |
| Rigor level matches risk | Pass. R2 is appropriate for durable CLI, schema, and resolver contracts. |
| Problem precedes mechanism | Pass. Layer 1 defines the context-control problem before CLI and resolver mechanisms. |
| Requirements are testable | Pass. Each `REQ-*` has a verification reference. |
| Functional behavior is externally visible | Pass. Section 8 defines CLI and artifact behavior. |
| Technical mechanisms trace to behavior | Pass. Sections 13 and 17 map mechanisms to functions and requirements. |
| Deterministic proof is explicit | Pass. REQ-6, REQ-7, VAL-4, ACC-3, TECH-8, and canonicalization rules define deterministic read-side lens and lockfile proof; REQ-16, ACC-4, TECH-13, and mission aggregation rules define the later mission proof. |
| Registry provenance is auditable | Pass. REQ-7, TECH-8, VAL-4, minimum lockfile fields, and canonicalization rules require registry id, version, and hash. |
| Source content remains data | Pass. REQ-15, Misuse-4, ACC-8, TECH-14, VAL-5, and source-content isolation rules define the instruction/data boundary. |
| Rollback and containment exist | Pass. Section 16 defines removal, disablement, and generated-artifact containment. |
| Open questions do not block approval | Pass. Q-1 and Q-2 are resolved for the read-side MVP; Q-3 affects output-format review before final CLI contract freeze but does not block package scaffold, `scan`, `validate`, or `repo/path` resolution. |

Final readiness statement: Ready for implementation

Implementation sequencing note: Begin with the read-side MVP: package scaffold, `scan`, `validate`, and `resolve` for `ctx://repo/path/...` links. Resolve Q-3 before CLI output contract review. The implementation shall not begin with mission aggregation, write-side commands, MCP, OS protocol handlers, or live external connectors until the CLI-first deterministic proof passes.

Section status: Complete

## Internal Review Record

| Field | Value |
| --- | --- |
| Document | `docs/design/markdown-context-operational-design-spec.md` |
| Review date | 2026-05-14 |
| Moderator | Codex |
| Decision owner | Project owner |
| Proposed rigor level | R2 |
| Reviewed rigor level | R2 |
| Calibration result | Accept |
| Structural result | Pass after revision |
| Semantic result | Pass after revision |
| Traceability result | Pass after revision |
| Verdict | Approve for implementation |
| Open findings | none |
| Resolved findings verified in this decision | ST-1 / ST-2 / ST-3 / SM-1 / SM-2 / SM-3 / SM-4 / TR-1 / TR-2 / TR-3 / TR-4 / TR-5 |
| Reviewed waivers | none |
| Required heightened controls | none |
| Approval conditions | none |
| Top blockers | none |
| Required follow-ups | Create the `markdown-context` MVP implementation issue before code begins; resolve Q-3 before CLI output contract review. |

### Review Findings Addressed

| Finding ID | Severity | Status | Section | Finding | Required action | Owner |
| --- | --- | --- | --- | --- | --- | --- |
| ST-1 | Major | Resolved | 5 / 17 | Initial draft did not make deterministic resolution proof explicit enough to be independently verified. | Add binding requirements, acceptance case, mechanism, and verification item for byte-identical lens and lockfile output. | Codex |
| SM-1 | Major | Resolved | 8 / 13 / 15 | Initial draft mixed lens links and prompt links too loosely, leaving prompt injection risk under-controlled. | Reframe params as closed-vocabulary declarative lens requests and add prompt-firewall validator. | Codex |
| TR-1 | Major | Resolved | 11 / 17 | Initial draft did not trace write-side behavior through requirements, mechanisms, and validation. | Add REQ-12, FLOW-4, FLOW-5, FUNC-5, TECH-10, ACC-5, and VAL-6 mappings. | Codex |
| TR-2 | Major | Resolved | 14 / 17 | Review found deterministic proof under-specified because canonical URL, serialization, hash, and source identity rules were missing. | Add canonicalization rules and update VAL-4, REQ-6, and section 17 mappings. | Codex |
| TR-3 | Major | Resolved | 8 / 13 / 14 / 17 | Review found `mission` aggregation under-specified for ordering, deduplication, conflicts, and budgets. | Add deterministic mission aggregation rules, TECH-13, updated FUNC-4, ACC-4, and VAL-4 mappings. | Codex |
| ST-2 | Major | Resolved | 18 | Consensus review found the final readiness statement did not use a controlled template value. | Replace conditional prose with `Final readiness statement: Ready for implementation` and move sequencing details to a non-readiness note. | Codex |
| SM-2 | Major | Resolved | 4 / 9 / 14 / 17 / 18 | Consensus review found prompt-injection controls did not cover hostile resolved source content consumed by agents. | Add source-content instruction/data boundary requirements, misuse case, acceptance case, artifact rules, mechanism, verification mapping, and risk mitigation. | Codex |
| TR-4 | Major | Resolved | 5 / 13 / 14 / 17 | Consensus review found lockfile proof omitted registry identity even though registry config affects validation, lens selection, resolver mapping, and output. | Add registry id, version, and hash to REQ-7, TECH-8, lockfile fields, canonicalization rules, VAL-4, and deterministic proof gates. | Codex |
| ST-3 | Major | Resolved | 1 / 18 | Follow-up review found readiness overstated because Q-1 and Q-2 were unresolved while implementation was labeled ready. | Resolve Q-1 and Q-2 in the spec and make sequencing target the read-side MVP. | Codex |
| SM-3 | Major | Resolved | 1 / 5 / 6 | Follow-up review found the baseline mixed upstream `markdown-engine` capability with missing `markdown-context` implementation. | Update the baseline to distinguish upstream `linkReferences` from this repo's zero implementation state. | Codex |
| SM-4 | Major | Resolved | 5 / 8 / 16 | Follow-up review found MVP scope too broad because `mission`, `suggest-links`, and `insert-link` were included in the first mandatory command surface. | Split the read-side MVP from later mission and write-side milestones. | Codex |
| TR-5 | Major | Resolved | 10 / 14 / 17 | Follow-up review found source-range expectations inconsistent between minimum fields and acceptance coverage. | Make `sourceRange` required for Markdown scan output and define the diagnostic fallback for future non-Markdown sources. | Codex |

### Semantic Scores

| Dimension | Score | Notes |
| --- | --- | --- |
| Problem validity | 3 | Current gap is evidenced by repo inspection and aligns with runtime architecture direction. |
| Requirement quality | 3 | Requirements are singular, testable, and mapped to validation. |
| Functional adequacy | 3 | Read-side MVP, later write-side, later mission packet, and audit flows are covered with milestone boundaries. |
| Technical feasibility | 3 | Builds on existing `markdown-engine` behavior and local CLI conventions. |
| Non-functional adequacy | 3 | Determinism, safety, compatibility, and performance are covered by canonicalization, mission aggregation, registry-provenanced lockfiles, prompt-firewall controls, and source-content isolation. |
| Operational safety | 3 | Core path is local, inert, reversible, and excludes handler execution. |
| Verification adequacy | 3 | Deterministic resolution proof is explicit and linked to requirements and mechanisms. |
