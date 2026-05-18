import type { Registry } from "../registry/registry.js";
import { validateScanResult } from "../registry/registry.js";
import { resolveRepoPathLink } from "../resolvers/repo-path.js";
import type { ResolveResult, ScanResult } from "../core/types.js";

export interface ResolveScanResultOptions {
  repoRoot: string;
}

export async function resolveScanResult(
  scanResult: ScanResult,
  registry: Registry,
  options: ResolveScanResultOptions,
): Promise<ResolveResult> {
  const validateResult = validateScanResult(scanResult, registry);
  if (!validateResult.valid) {
    return {
      schemaVersion: "markdown-context.resolve-result.v0",
      artifacts: [],
      diagnostics: validateResult.diagnostics,
    };
  }

  const resolveResult = await resolveRepoPathLink(validateResult.links, options);
  const diagnostics = [...validateResult.diagnostics, ...resolveResult.diagnostics];

  return {
    ...resolveResult,
    diagnostics,
  };
}
