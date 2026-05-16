export interface CliOptions {
  flags: Set<string>;
  positionals: string[];
  values: Map<string, string>;
}

export type CliCommand = "scan" | "validate" | "resolve";

const VALUE_FLAGS = new Set(["--registry", "--repo-root"]);
const COMMANDS = new Set<CliCommand>(["scan", "validate", "resolve"]);
const COMMAND_VALUE_OPTIONS: Record<CliCommand, readonly string[]> = {
  scan: [],
  validate: ["registry"],
  resolve: ["registry", "repo-root"],
};
const REQUIRED_VALUE_OPTIONS: Record<CliCommand, readonly string[]> = {
  scan: [],
  validate: ["registry"],
  resolve: ["registry"],
};

export function parseCommand(command: string | undefined): CliCommand {
  if (command === undefined) {
    throw new Error(usage());
  }

  if (COMMANDS.has(command as CliCommand)) {
    return command as CliCommand;
  }

  throw new Error(`Unknown command: ${command}.\n${usage()}`);
}

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
      if (value === undefined || value.startsWith("-")) {
        throw new Error(`${arg} requires a value.\n${usage()}`);
      }
      const optionName = arg.slice(2);
      if (values.has(optionName)) {
        throw new Error(`Duplicate option: ${arg}.\n${usage()}`);
      }
      values.set(optionName, value);
      index += 1;
      continue;
    }

    if (arg.startsWith("-")) {
      throw new Error(`Unknown option: ${arg}.\n${usage()}`);
    }

    positionals.push(arg);
  }

  return { flags, positionals, values };
}

export function validateOptionsForCommand(command: CliCommand, options: CliOptions): void {
  if (options.positionals.length !== 1) {
    throw new Error(`Expected exactly one <markdown-file> argument.\n${usage()}`);
  }

  const allowedValueOptions = new Set(COMMAND_VALUE_OPTIONS[command]);
  for (const optionName of options.values.keys()) {
    if (!allowedValueOptions.has(optionName)) {
      throw new Error(`${command} does not support --${optionName}.\n${usage()}`);
    }
  }

  for (const optionName of REQUIRED_VALUE_OPTIONS[command]) {
    if (!options.values.has(optionName)) {
      throw new Error(`${command} requires --${optionName} <path>.\n${usage()}`);
    }
  }
}

export function usage(): string {
  return [
    "Usage:",
    "  markdown-context scan <markdown-file> [--pretty]",
    "  markdown-context validate <markdown-file> --registry <registry.json> [--pretty]",
    "  markdown-context resolve <markdown-file> --registry <registry.json> [--repo-root <path>] [--pretty]",
  ].join("\n");
}
