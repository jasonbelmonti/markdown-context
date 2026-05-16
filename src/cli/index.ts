#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import path from "node:path";

import { stableJson } from "./json.js";
import { parseCommand, parseOptions, validateOptionsForCommand } from "./options.js";
import { scanMarkdown } from "../core/scan.js";
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
  const scanResult = scanMarkdown(markdown, targetPath);

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
    const resolveResult = await resolveRepoPathLink(validateResult.links, {
      repoRoot: path.resolve(repoRoot),
    });
    const diagnostics = [
      ...validateResult.diagnostics,
      ...resolveResult.diagnostics,
    ];

    return {
      body: { ...resolveResult, diagnostics },
      exitCode: hasError(diagnostics) ? 1 : 0,
      pretty,
    };
  }

  throw new Error(`Unhandled command: ${cliCommand}`);
}

function hasError(diagnostics: readonly { severity: string }[]): boolean {
  return diagnostics.some((diagnostic) => diagnostic.severity === "error");
}
