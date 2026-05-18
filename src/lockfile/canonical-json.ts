import { stableJson } from "../core/stable-json.js";

export type CanonicalJsonPrimitive = string | number | boolean | null;
export type CanonicalJsonValue =
  | CanonicalJsonPrimitive
  | CanonicalJsonValue[]
  | { [key: string]: CanonicalJsonValue };
export type CanonicalJsonObject = { [key: string]: CanonicalJsonValue };

export function serializeCanonicalJson(value: unknown): string {
  assertCanonicalJsonValue(value, "$");

  return stableJson(value);
}

export function cloneCanonicalJsonObject(value: unknown): CanonicalJsonObject {
  const cloned = cloneCanonicalJsonValue(value);

  if (!isRecord(cloned) || Array.isArray(cloned)) {
    throw new Error("Canonical JSON value must be an object.");
  }

  return cloned;
}

function cloneCanonicalJsonValue(value: unknown): CanonicalJsonValue {
  assertCanonicalJsonValue(value, "$");

  if (Array.isArray(value)) {
    return Array.from({ length: value.length }, (_, index) =>
      cloneCanonicalJsonValue(value[index]),
    );
  }

  if (isRecord(value)) {
    const cloned = Object.create(null) as CanonicalJsonObject;

    for (const key of Object.keys(value).sort(compareCodeUnits)) {
      cloned[key] = cloneCanonicalJsonValue(value[key]);
    }

    return cloned;
  }

  return value;
}

function assertCanonicalJsonValue(value: unknown, path: string): asserts value is CanonicalJsonValue {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return;
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new Error(`Canonical JSON number at ${path} must be finite.`);
    }
    return;
  }

  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      if (!(index in value)) {
        throw new Error(`Canonical JSON array at ${path} must not contain empty slots.`);
      }

      assertCanonicalJsonValue(value[index], `${path}[${index}]`);
    }
    return;
  }

  if (isRecord(value)) {
    for (const [key, item] of Object.entries(value)) {
      if (item === undefined) {
        throw new Error(`Canonical JSON object at ${path} must not contain undefined field ${key}.`);
      }
      assertCanonicalJsonValue(item, `${path}.${key}`);
    }
    return;
  }

  throw new Error(`Unsupported canonical JSON value at ${path}.`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);

  return prototype === Object.prototype || prototype === null;
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
