import { Condition } from './conditions';

export interface RemoteRef {
  key: string;
  property?: string;
  version?: string;
}

export interface ExternalSecretData {
  secretKey: string;
  remoteRef: RemoteRef;
}

export interface ExternalSecretDataFrom {
  extract?: RemoteRef;
  find?: {
    path?: string;
    name?: {
      regexp?: string;
    };
    tags?: Record<string, string>;
  };
  sourceRef?: object;
}

export interface SecretStoreRef {
  name: string;
  kind?: string;
}

export interface ExternalSecretSpec {
  refreshInterval?: string;
  refreshPolicy?: string;
  secretStoreRef?: SecretStoreRef;
  target?: {
    name?: string;
    creationPolicy?: string;
    deletionPolicy?: string;
  };
  data?: ExternalSecretData[];
  dataFrom?: ExternalSecretDataFrom[];
}

export interface ExternalSecretStatus {
  refreshTime?: string;
  syncedResourceVersion?: string;
  conditions?: Condition[];
}

/** The referenced store name, or '-' when the reference is absent. */
export function getStoreName(spec: ExternalSecretSpec | undefined): string {
  return spec?.secretStoreRef?.name || '-';
}

/** The referenced store kind. ESO defaults an absent kind to SecretStore. */
export function getStoreKind(spec: ExternalSecretSpec | undefined): string {
  return spec?.secretStoreRef?.kind || 'SecretStore';
}

/**
 * The name of the Kubernetes Secret an ExternalSecret syncs into. ESO defaults
 * the target name to the ExternalSecret's own name when spec.target.name is
 * not set.
 */
export function getTargetSecretName(
  spec: ExternalSecretSpec | undefined,
  resourceName: string
): string {
  return spec?.target?.name || resourceName;
}
