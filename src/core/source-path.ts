import { realpathSync } from "node:fs";
import path from "node:path";

export interface StableSourcePathOptions {
  relativePathBase?: string;
}

export function stableSourcePathInsideBase(
  sourcePath: string,
  basePath: string,
  options: StableSourcePathOptions = {},
): string | undefined {
  const resolvedBase = canonicalPath(basePath);
  const resolvedSource = canonicalPath(
    path.isAbsolute(sourcePath)
      ? sourcePath
      : path.resolve(options.relativePathBase ?? process.cwd(), sourcePath),
  );
  const relativePath = path.relative(resolvedBase, resolvedSource);

  if (isOutsideBasePath(relativePath)) {
    return undefined;
  }

  return relativePath === "" ? path.basename(sourcePath) : toPosixPath(relativePath);
}

function toPosixPath(filePath: string): string {
  return filePath.split(path.sep).join("/");
}

export function isOutsideBasePath(relativePath: string): boolean {
  return (
    relativePath === ".." ||
    relativePath.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativePath)
  );
}

function canonicalPath(filePath: string): string {
  try {
    return realpathSync(filePath);
  } catch {
    return path.resolve(filePath);
  }
}
