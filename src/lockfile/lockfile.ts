import type {
  Registry,
  RegistryIgnoredResource,
  RegistryResource,
} from "../registry/registry.js";
import { compareRegistryResourceIdentities } from "../registry/resource-identity.js";
import type { CanonicalJsonObject } from "./canonical-json.js";
import { cloneCanonicalJsonObject, serializeCanonicalJson } from "./canonical-json.js";
import { hashCanonicalJson } from "./hash.js";
import type {
  ContextLockfile,
  ContextLockfileRecord,
  LockfileSourceIdentity,
  Sha256Hash,
} from "./types.js";

export interface CreateContextLockfileRecordInput {
  canonicalUrl: string;
  selectedLens: string;
  artifactPath: string;
  artifactHash: Sha256Hash;
  registry: Registry;
  resolverId: string;
  resolverVersion: string;
  sourceIdentity: LockfileSourceIdentity;
  sourceHash: Sha256Hash;
  outputOptions?: CanonicalJsonObject;
}

export function createContextLockfileRecord(
  input: CreateContextLockfileRecordInput,
): ContextLockfileRecord {
  const sourceIdentity = cloneLockfileSourceIdentity(input.sourceIdentity);

  return {
    schemaVersion: "markdown-context.lockfile-record.v0",
    canonicalUrl: input.canonicalUrl,
    selectedLens: input.selectedLens,
    artifactPath: input.artifactPath,
    artifactHash: input.artifactHash,
    registryId: input.registry.registryId,
    registryVersion: input.registry.registryVersion,
    registryHash: hashRegistry(input.registry),
    resolverId: input.resolverId,
    resolverVersion: input.resolverVersion,
    sourceIdentity,
    sourceHash: input.sourceHash,
    outputOptions: cloneCanonicalJsonObject(input.outputOptions ?? {}),
  };
}

export function createContextLockfile(
  records: readonly ContextLockfileRecord[],
): ContextLockfile {
  return {
    schemaVersion: "markdown-context.lockfile.v0",
    records: [...records].sort(compareLockfileRecords),
  };
}

export function serializeContextLockfile(lockfile: ContextLockfile): string {
  return serializeCanonicalJson(createContextLockfile(lockfile.records));
}

export function hashContextLockfile(lockfile: ContextLockfile): Sha256Hash {
  return hashCanonicalJson(createContextLockfile(lockfile.records));
}

export function serializeCanonicalRegistry(registry: Registry): string {
  return serializeCanonicalJson(canonicalRegistrySnapshot(registry));
}

export function hashRegistry(registry: Registry): Sha256Hash {
  return hashCanonicalJson(canonicalRegistrySnapshot(registry));
}

function canonicalRegistrySnapshot(registry: Registry): CanonicalJsonObject {
  const snapshot: CanonicalJsonObject = {
    registryId: registry.registryId,
    registryVersion: registry.registryVersion,
    resources: [...registry.resources]
      .sort(compareRegistryResourceIdentities)
      .map(canonicalRegistryResource),
    schemaVersion: registry.schemaVersion,
  };

  if ((registry.ignoredResources?.length ?? 0) > 0) {
    snapshot.ignoredResources = [...(registry.ignoredResources ?? [])]
      .sort(compareRegistryResourceIdentities)
      .map(canonicalRegistryIgnoredResource);
  }

  return snapshot;
}

function canonicalRegistryResource(resource: RegistryResource): CanonicalJsonObject {
  const snapshot: CanonicalJsonObject = {
    defaultLens: resource.defaultLens,
    kind: resource.kind,
    lenses: [...resource.lenses].sort(compareCodeUnits),
    namespace: resource.namespace,
    params: [...(resource.params ?? [])].sort(compareCodeUnits),
    scheme: resource.scheme,
  };

  if (resource.idPattern !== undefined) {
    snapshot.idPattern = resource.idPattern;
  }

  return snapshot;
}

function canonicalRegistryIgnoredResource(
  resource: RegistryIgnoredResource,
): CanonicalJsonObject {
  return {
    kind: resource.kind,
    namespace: resource.namespace,
    scheme: resource.scheme,
  };
}

function compareLockfileRecords(
  left: ContextLockfileRecord,
  right: ContextLockfileRecord,
): number {
  return (
    compareCodeUnits(left.canonicalUrl, right.canonicalUrl) ||
    compareCodeUnits(left.selectedLens, right.selectedLens) ||
    compareCodeUnits(left.resolverId, right.resolverId) ||
    compareCodeUnits(
      serializeCanonicalJson(left.sourceIdentity),
      serializeCanonicalJson(right.sourceIdentity),
    ) ||
    compareCodeUnits(left.artifactPath, right.artifactPath) ||
    compareCodeUnits(serializeCanonicalJson(left), serializeCanonicalJson(right))
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

function cloneLockfileSourceIdentity(sourceIdentity: LockfileSourceIdentity): LockfileSourceIdentity {
  const cloned = cloneCanonicalJsonObject(sourceIdentity);

  if (typeof cloned.kind !== "string" || cloned.kind.length === 0) {
    throw new Error("Lockfile sourceIdentity.kind must be a non-empty string.");
  }

  return cloned as LockfileSourceIdentity;
}
