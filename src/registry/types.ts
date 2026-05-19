export interface Registry {
  schemaVersion: "markdown-context.registry.v0";
  registryId: string;
  registryVersion: string;
  resources: RegistryResource[];
}

export interface RegistryResource {
  scheme: string;
  namespace: string;
  kind: string;
  idPattern?: string;
  defaultLens: string;
  lenses: string[];
  params?: string[];
}
