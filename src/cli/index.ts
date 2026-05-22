#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { stableJson } from "./json.js";
import {
  parseCommand,
  parseOptions,
  validateOptionsForCommand,
  type CliCommand,
  type CliOptions,
} from "./options.js";
import { scanMarkdown } from "../core/scan.js";
import { stableSourcePathInsideBase } from "../core/source-path.js";
import type { ContextLockfile } from "../lockfile/types.js";
import { createContextLockfile, serializeContextLockfile } from "../lockfile/lockfile.js";
import { loadRegistry, validateScanResult } from "../registry/registry.js";
import { resolveRepoPathLink } from "../resolvers/repo-path.js";

const [, , command, ...args] = process.argv;

try {
  const result = await run(command, args);
  process.stdout.write(stableJson(result.body, result.pretty));
  process.exitCode = result.exitCode;
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 2;
}

async function run(
  command: string | undefined,
  args: string[],
): Promise<{ body: unknown; exitCode: number; pretty: boolean }> {
  const cliCommand = parseCommand(command);
  const options = parseOptions(args);
  validateOptionsForCommand(cliCommand, options);

  const pretty = options.flags.has("pretty");
  const targetPath = options.positionals[0];
  if (targetPath === undefined) {
    throw new Error("Expected exactly one <markdown-file> argument.");
  }

  const markdown = await readFile(targetPath, "utf8");
  const scanResult = scanMarkdown(markdown, sourcePathForCommand(cliCommand, options, targetPath));

  if (cliCommand === "scan") {
    return { body: scanResult, exitCode: hasError(scanResult.diagnostics) ? 1 : 0, pretty };
  }

  const registryPath = options.values.get("registry");
  if (registryPath === undefined) {
    throw new Error(`${cliCommand} requires --registry <path>.`);
  }

  const registry = await loadRegistry(registryPath);
  const validateResult = validateScanResult(scanResult, registry);

  if (cliCommand === "validate") {
    return {
      body: validateResult,
      exitCode: hasError(validateResult.diagnostics) ? 1 : 0,
      pretty,
    };
  }

  if (cliCommand === "resolve") {
    const repoRoot = options.values.get("repo-root") ?? process.cwd();
    const emitLockfile = options.flags.has("lockfile");
    const lockfileOut = options.values.get("lockfile-out");
    const lockfileRequested = emitLockfile || lockfileOut !== undefined;

    if (!validateResult.valid) {
      const lockfile = createContextLockfile([]);

      if (lockfileOut !== undefined) {
        await writeLockfile(lockfileOut, lockfile);
      }

      return {
        body: {
          schemaVersion: "markdown-context.resolve-result.v0",
          artifacts: [],
          diagnostics: validateResult.diagnostics,
          ...(emitLockfile ? { lockfile } : {}),
        },
        exitCode: 1,
        pretty,
      };
    }

    const resolveResult = await resolveRepoPathLink(validateResult.links, {
      repoRoot: path.resolve(repoRoot),
      ...(lockfileRequested
        ? {
            lockfile: {
              registry,
              preserveArtifactSourcePaths: !emitLockfile,
              sourcePathsAlreadyStable: emitLockfile,
            },
          }
        : {}),
    });
    const diagnostics = [
      ...validateResult.diagnostics,
      ...resolveResult.diagnostics,
    ];
    const lockfile = resolveResult.lockfile ?? createContextLockfile([]);

    if (lockfileOut !== undefined) {
      await writeLockfile(lockfileOut, lockfile);
    }

    return {
      body: {
        schemaVersion: resolveResult.schemaVersion,
        artifacts: resolveResult.artifacts,
        diagnostics,
        ...(emitLockfile ? { lockfile } : {}),
      },
      exitCode: hasError(diagnostics) ? 1 : 0,
      pretty,
    };
  }

  throw new Error(`Unhandled command: ${cliCommand}`);
}

function hasError(diagnostics: readonly { severity: string }[]): boolean {
  return diagnostics.some((diagnostic) => diagnostic.severity === "error");
}

async function writeLockfile(lockfilePath: string, lockfile: ContextLockfile): Promise<void> {
  const resolvedPath = path.resolve(lockfilePath);

  await mkdir(path.dirname(resolvedPath), { recursive: true });
  await writeFile(resolvedPath, serializeContextLockfile(lockfile), "utf8");
}

function sourcePathForCommand(
  command: CliCommand,
  options: CliOptions,
  targetPath: string,
): string | undefined {
  if (command !== "resolve" || !options.flags.has("lockfile")) {
    return targetPath;
  }

  const repoRoot = options.values.get("repo-root") ?? process.cwd();
  return stableSourcePathInsideBase(path.resolve(targetPath), repoRoot);
}
