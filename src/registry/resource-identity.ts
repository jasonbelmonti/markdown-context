import type { RegistryResourceIdentity } from "./types.js";

export function registryResourceIdentityKey(resource: RegistryResourceIdentity): string {
  return `${resource.scheme}\0${resource.namespace}\0${resource.kind}`;
}

export function isSameRegistryResourceIdentity(
  left: RegistryResourceIdentity,
  right: RegistryResourceIdentity,
): boolean {
  return (
    left.scheme === right.scheme &&
    left.namespace === right.namespace &&
    left.kind === right.kind
  );
}

export function compareRegistryResourceIdentities(
  left: RegistryResourceIdentity,
  right: RegistryResourceIdentity,
): number {
  return (
    compareCodeUnits(left.scheme, right.scheme) ||
    compareCodeUnits(left.namespace, right.namespace) ||
    compareCodeUnits(left.kind, right.kind)
  );
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
