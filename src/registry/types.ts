export interface Registry {
  schemaVersion: "markdown-context.registry.v0";
  registryId: string;
  registryVersion: string;
  resources: RegistryResource[];
  ignoredResources?: RegistryIgnoredResource[];
}

export interface RegistryResourceIdentity {
  scheme: string;
  namespace: string;
  kind: string;
}

export interface RegistryResource extends RegistryResourceIdentity {
  idPattern?: string;
  sourcePolicy?: RegistryResourceSourcePolicy;
  defaultLens: string;
  lenses: string[];
  params?: string[];
}

export interface RegistryIgnoredResource extends RegistryResourceIdentity {}

export type RegistryResourceSourcePolicy =
  | {
      allowedPathPrefixes: string[];
      deniedPathPrefixes?: string[];
    }
  | {
      allowedPathPrefixes?: string[];
      deniedPathPrefixes: string[];
    };
