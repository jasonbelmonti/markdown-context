# Repository Layout

## Objective

Make `markdown-context` operable from a predictable Git checkout and prevent
confusion between the local workspace container and actual package roots.

## Local Workspace Map

The current workstation uses this container:

```text
/Users/jasonbelmonti/Documents/Development/markdown-context
```

That container is not itself a Git repository. It holds local documentation and
the `.worktrees/` directory. Treat it as a worktree control area.

The synchronized `main` checkout is:

```text
/Users/jasonbelmonti/Documents/Development/markdown-context/.worktrees/initial-push
```

Task worktrees should be created under:

```text
/Users/jasonbelmonti/Documents/Development/markdown-context/.worktrees/<task-name>
```

## Canonical Package Surface

A valid package checkout has this minimum surface at its root:

```text
package.json
src/
test/
fixtures/
docs/
tsconfig.json
vitest.config.ts
```

If those files are absent, do not run package commands from that directory.
Move into a Git worktree first.

## Standard Operations

Synchronize the local `main` checkout:

```sh
git -C /Users/jasonbelmonti/Documents/Development/markdown-context/.worktrees/initial-push fetch origin --prune
git -C /Users/jasonbelmonti/Documents/Development/markdown-context/.worktrees/initial-push merge --ff-only origin/main
```

Create a task worktree from current remote `main`:

```sh
git -C /Users/jasonbelmonti/Documents/Development/markdown-context/.worktrees/initial-push worktree add /Users/jasonbelmonti/Documents/Development/markdown-context/.worktrees/<task-name> -b codex/<task-name> origin/main
```

Run validation from a package checkout:

```sh
npm run build
npm test
npm run typecheck
```

## Guardrails

- Do not treat the workspace container as the package root.
- Do not manually delete worktree directories; use `git worktree remove`.
- Do not move the `.git` common directory without running `git worktree repair`
  and rechecking every worktree.
- Keep `markdown-context` on the published
  `@jasonbelmonti/markdown-engine` package boundary; do not depend on a sibling
  repository checkout or unpublished tarball.
- Keep task work isolated in a branch worktree and merge only after the local
  validation commands pass.
