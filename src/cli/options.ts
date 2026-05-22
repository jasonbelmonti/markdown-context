export interface CliOptions {
  flags: Set<string>;
  positionals: string[];
  values: Map<string, string>;
}

export type CliCommand = "scan" | "validate" | "resolve";

export class CliUsageError extends Error {
  constructor(
    readonly diagnosticCode: string,
    message: string,
  ) {
    super(message);
    this.name = "CliUsageError";
  }
}

const BOOLEAN_FLAGS = new Set(["--pretty", "--lockfile"]);
const VALUE_FLAGS = new Set(["--registry", "--repo-root", "--lockfile-out"]);
const COMMANDS = new Set<CliCommand>(["scan", "validate", "resolve"]);
const COMMAND_BOOLEAN_OPTIONS: Record<CliCommand, readonly string[]> = {
  scan: ["pretty"],
  validate: ["pretty"],
  resolve: ["pretty", "lockfile"],
};
const COMMAND_VALUE_OPTIONS: Record<CliCommand, readonly string[]> = {
  scan: [],
  validate: ["registry"],
  resolve: ["registry", "repo-root", "lockfile-out"],
};
const REQUIRED_VALUE_OPTIONS: Record<CliCommand, readonly string[]> = {
  scan: [],
  validate: ["registry"],
  resolve: ["registry"],
};

export function parseCommand(command: string | undefined): CliCommand {
  if (command === undefined) {
    throw new CliUsageError("cli.command.required", "Expected a command.");
  }

  if (COMMANDS.has(command as CliCommand)) {
    return command as CliCommand;
  }

  throw new CliUsageError("cli.command.unknown", `Unknown command: ${command}.`);
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

    if (BOOLEAN_FLAGS.has(arg)) {
      const optionName = arg.slice(2);
      if (flags.has(optionName)) {
        throw new CliUsageError("cli.option.duplicate", `Duplicate option: ${arg}.`);
      }
      flags.add(optionName);
      continue;
    }

    if (VALUE_FLAGS.has(arg)) {
      const value = args[index + 1];
      if (value === undefined || value.startsWith("-")) {
        throw new CliUsageError("cli.option.valueRequired", `${arg} requires a value.`);
      }
      const optionName = arg.slice(2);
      if (values.has(optionName)) {
        throw new CliUsageError("cli.option.duplicate", `Duplicate option: ${arg}.`);
      }
      values.set(optionName, value);
      index += 1;
      continue;
    }

    if (arg.startsWith("-")) {
      throw new CliUsageError("cli.option.unknown", `Unknown option: ${arg}.`);
    }

    positionals.push(arg);
  }

  return { flags, positionals, values };
}

export function validateOptionsForCommand(command: CliCommand, options: CliOptions): void {
  if (options.positionals.length !== 1) {
    throw new CliUsageError(
      "cli.argument.count",
      "Expected exactly one <markdown-file> argument.",
    );
  }

  const allowedValueOptions = new Set(COMMAND_VALUE_OPTIONS[command]);
  const allowedBooleanOptions = new Set(COMMAND_BOOLEAN_OPTIONS[command]);

  for (const optionName of options.flags.keys()) {
    if (!allowedBooleanOptions.has(optionName)) {
      throw new CliUsageError(
        "cli.option.unsupported",
        `${command} does not support --${optionName}.`,
      );
    }
  }

  for (const optionName of options.values.keys()) {
    if (!allowedValueOptions.has(optionName)) {
      throw new CliUsageError(
        "cli.option.unsupported",
        `${command} does not support --${optionName}.`,
      );
    }
  }

  for (const optionName of REQUIRED_VALUE_OPTIONS[command]) {
    if (!options.values.has(optionName)) {
      throw new CliUsageError(
        "cli.option.required",
        `${command} requires --${optionName} <path>.`,
      );
    }
  }
}

export function usage(): string {
  return usageLines().join("\n");
}

export function usageLines(): string[] {
  return [
    "Usage:",
    "  markdown-context scan <markdown-file> [--pretty]",
    "  markdown-context validate <markdown-file> --registry <registry.json> [--pretty]",
    "  markdown-context resolve <markdown-file> --registry <registry.json> [--repo-root <path>] [--lockfile] [--lockfile-out <path>] [--pretty]",
  ];
}

export function isCliUsageError(error: unknown): error is CliUsageError {
  return error instanceof CliUsageError;
}
