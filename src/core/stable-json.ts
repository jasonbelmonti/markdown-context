export function stableJson(value: unknown, pretty = false): string {
  return `${serializeJsonValue(value, pretty, 0) ?? "undefined"}\n`;
}

function serializeJsonValue(value: unknown, pretty: boolean, depth: number): string | undefined {
  if (Array.isArray(value)) {
    return serializeArray(value, pretty, depth);
  }

  if (typeof value === "object" && value !== null) {
    return serializeObject(value as Record<string, unknown>, pretty, depth);
  }

  return JSON.stringify(value);
}

function serializeArray(value: readonly unknown[], pretty: boolean, depth: number): string {
  const items = Array.from({ length: value.length }, (_, index) =>
    serializeJsonValue(value[index], pretty, depth + 1) ?? "null",
  );

  if (!pretty) {
    return `[${items.join(",")}]`;
  }
  if (items.length === 0) {
    return "[]";
  }

  const itemIndent = indent(depth + 1);
  return `[\n${items.map((item) => `${itemIndent}${item}`).join(",\n")}\n${indent(depth)}]`;
}

function serializeObject(value: Record<string, unknown>, pretty: boolean, depth: number): string {
  const entries = Object.entries(value)
    .map(([key, entryValue]) => [key, serializeJsonValue(entryValue, pretty, depth + 1)] as const)
    .filter((entry): entry is readonly [string, string] => entry[1] !== undefined)
    .sort(([left], [right]) => compareCodeUnits(left, right));

  if (!pretty) {
    return `{${entries.map(([key, entryValue]) => `${JSON.stringify(key)}:${entryValue}`).join(",")}}`;
  }
  if (entries.length === 0) {
    return "{}";
  }

  const entryIndent = indent(depth + 1);
  const body = entries
    .map(([key, entryValue]) => `${entryIndent}${JSON.stringify(key)}: ${entryValue}`)
    .join(",\n");

  return `{\n${body}\n${indent(depth)}}`;
}

function compareCodeUnits(left: string, right: string): number {
  if (left < right) {
    return -1;
  }
  if (left > right) {
    return 1;
  }
  return 0;
}

function indent(depth: number): string {
  return "  ".repeat(depth);
}
