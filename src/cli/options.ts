export interface CliOptions {
  flags: Set<string>;
  positionals: string[];
  values: Map<string, string>;
}

const VALUE_FLAGS = new Set(["--registry", "--repo-root"]);

export function parseOptions(args: readonly string[]): CliOptions {
  const flags = new Set<string>();
  const positionals: string[] = [];
  const values = new Map<string, string>();

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === undefined) {
      continue;
    }

    if (arg === "--pretty") {
      flags.add("pretty");
      continue;
    }

    if (VALUE_FLAGS.has(arg)) {
      const value = args[index + 1];
      if (value === undefined) {
        throw new Error(`${arg} requires a value.`);
      }
      values.set(arg.slice(2), value);
      index += 1;
      continue;
    }

    positionals.push(arg);
  }

  return { flags, positionals, values };
}

export function usage(): string {
  return [
    "Usage:",
    "  markdown-context scan <markdown-file> [--pretty]",
    "  markdown-context validate <markdown-file> --registry <registry.json> [--pretty]",
    "  markdown-context resolve <markdown-file> --registry <registry.json> [--repo-root <path>] [--pretty]",
  ].join("\n");
}
