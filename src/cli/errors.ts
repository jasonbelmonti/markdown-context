import type { ContextDiagnostic } from "../core/types.js";
import { isCliUsageError, usageLines } from "./options.js";

export interface CliErrorResult {
  schemaVersion: "markdown-context.cli-error.v0";
  diagnostics: ContextDiagnostic[];
  usage?: string[];
}

export function cliErrorResult(error: unknown): CliErrorResult {
  const diagnostic = diagnosticForError(error);
  const body: CliErrorResult = {
    schemaVersion: "markdown-context.cli-error.v0",
    diagnostics: [diagnostic],
  };

  return isCliUsageError(error) ? { ...body, usage: usageLines() } : body;
}

function diagnosticForError(error: unknown): ContextDiagnostic {
  return {
    code: isCliUsageError(error) ? error.diagnosticCode : "cli.execution.failed",
    message: errorMessage(error),
    severity: "error",
  };
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}
