# BEL-1063 MVP Scope Control and Deferred Work Boundary Evidence

Issue: `BEL-1063`

Captured: 2026-05-22 11:54 CDT

Branch: `codex/bel-1063-scope-control`

Source revision: `1d538cb324c6ee863da0ab585b5c0ba8b220e6c5`

Scope: Final cross-cutting scope-control audit for the read-side MVP after PR #24 merged `BEL-1051` agent preflight and MS-3 handoff evidence.

## Objective

Verify that the landed read-side MVP remains inside the approved `scan`, `validate`, and offline `repo/path` `resolve` boundary while preserving deferred work boundaries for later phases.

## Source Inventory

| Source | Status | Controls |
| --- | --- | --- |
| Linear `BEL-1063` | In Progress during this audit | Scope-control audit objective and success criteria. |
| Linear `BEL-1047` | In Progress at capture time | Parent read-side MVP tracker and completion gate. |
| Linear `BEL-1050` | In Progress at capture time | WP-3 parent tracker; child issues `BEL-1080`, `BEL-1081`, and `BEL-1082` are Done. |
| Linear `BEL-1051` | Done, linked to PR #24 | WP-4 / MS-3 evidence and handoff completion. |
| `docs/execution/markdown-context-read-side-mvp-execution-spec.md` | loaded | Approved MVP scope, non-goals, milestone gates, and completion criteria. |
| `docs/design/markdown-context-operational-design-spec.md` | loaded | Design authority for read-side MVP and later-phase boundaries. |
| `docs/evidence/**` | loaded | Landed evidence artifacts for EVD-1 through EVD-8 and audit tracks. |
| `origin/main` | `1d538cb324c6ee863da0ab585b5c0ba8b220e6c5` | Landed repository baseline. |

## Success Criteria Status

- [x] Code, tests, docs, and Linear project state were reviewed for accidental scope creep or ambiguous deferred functionality.
- [x] Unresolved project-state questions were mapped to source documents and Linear records.
- [x] Follow-up work was classified as audit finding, implementation defect, design decision, project-management closure, or intentionally deferred scope.

## Evidence Coverage

| Evidence | File | Covered claim |
| --- | --- | --- |
| EVD-1 through EVD-4 | `docs/evidence/bel-1049-ms-1.md` | MS-1 build, scan, validate, and resolve critical path. |
| EVD-5 | `docs/evidence/bel-1050-lockfile-determinism.md` | Repeated resolve, registry hash, artifact hash, source hash, and lockfile hash determinism. |
| EVD-6 | `docs/evidence/bel-1051-agent-preflight.md` | Local agent preflight for `scan`, `validate`, and `resolve` without MCP or live connector behavior. |
| EVD-7 | `docs/evidence/bel-1051-ms-3-handoff.md` | Deferred scope and MS-3 completion handoff. |
| EVD-8 | `docs/evidence/bel-1048-ms-2.md` | Full scan link-form coverage and registry validation breadth. |

All execution-spec evidence IDs EVD-1 through EVD-8 are present on the landed baseline.

## Scope-Control Inspection

Command-surface inspection:

```bash
rg -n "\b(mission|suggest-links|insert-link)\b" src package.json test
```

Observed result:

- No matches in `src`, `package.json`, or `test`.
- The shipped command surface remains `scan`, `validate`, and `resolve`.

Deferred connector and publication inspection:

```bash
rg -n "\b(mcp|protocol|connector|node:https|node:http|fetch\(|http://|https://|npm publish|prepublishOnly|publishConfig)\b" src package.json test
```

Observed result:

- One source match: `src/core/context-url.ts` reads `url.protocol` while parsing inert context-link URLs.
- No matches for MCP implementation, live connectors, HTTP modules, `fetch`, network URLs, npm publication config, or publication scripts in `src`, `package.json`, or `test`.
- `package.json` contains `prepack: "npm run build"`, which is local build preparation and not package publication.

## Verdict

Recommendation: Accept the MVP scope-control audit and use this artifact to complete closeout reconciliation after review.

The landed implementation stays inside the approved read-side MVP boundary:

- local CLI-first `scan`, `validate`, and `resolve`;
- offline `ctx://repo/path/...` resolver behavior;
- deterministic lockfile provenance for the fixture path;
- bounded source-data artifacts with explicit trust and content-boundary fields;
- no mission aggregation, write-side commands, MCP transport, OS protocol handlers, browser automation, live network connectors, network-backed resolvers, or package publication.

## Follow-Up Classification

| Follow-up | Classification | Blocking for BEL-1047 closeout? | Notes |
| --- | --- | --- | --- |
| Mark `BEL-1050` Done after confirming child issues `BEL-1080`, `BEL-1081`, and `BEL-1082` remain Done. | Project-management closure | Yes for clean Linear state | Repository evidence shows WP-3 completion; Linear parent remains stale at capture time. |
| Mark `BEL-1063` Done after this evidence lands and review passes. | Project-management closure | Yes for clean Linear state | This document is the completion evidence for BEL-1063. |
| Close `BEL-1047` and the `markdown-context MVP` project after project-owner approval. | Project-management closure | Yes for final closeout | Execution spec REL-3 says close parent after MS-3 approval and handoff evidence. |
| Repo/path id policy for untrusted Markdown. | Follow-up security hardening | No | Recorded in `docs/evidence/bel-1061-security-source-content-boundary-audit.md`. |
| Resolver source-size limit or streaming read strategy. | Follow-up resource hardening | No | Recorded in `docs/evidence/bel-1061-security-source-content-boundary-audit.md`. |
| Check-then-read containment hardening for concurrent local mutation. | Follow-up filesystem hardening | No | Recorded in `docs/evidence/bel-1061-security-source-content-boundary-audit.md`. |
| Mission aggregation. | Intentionally deferred scope | No | Later phase after read-side MVP approval. |
| Write-side `suggest-links` and `insert-link`. | Intentionally deferred scope | No | Later phase after read-side MVP approval. |
| MCP adapter, OS handler, live connectors, and package publication. | Intentionally deferred scope | No | Require separate task, design/review boundary, and validation plan. |

## Closeout Recommendation

After this BEL-1063 evidence is reviewed and merged:

1. Mark `BEL-1063` Done and link the PR.
2. Mark `BEL-1050` Done because all WP-3 child tasks are Done and EVD-5 is landed.
3. Record a parent closeout comment on `BEL-1047` linking PRs #21, #22, #23, #24, and the BEL-1063 PR.
4. Close `BEL-1047` and the `markdown-context MVP` project only after project-owner approval of the final closeout state.

No code implementation defect was found inside the current MVP scope-control boundary.
