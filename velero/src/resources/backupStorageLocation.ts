import { K8s } from '@kinvolk/headlamp-plugin/lib';
import { KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/KubeObject';

const KubeObject = K8s.cluster.KubeObject;

export interface VeleroBSLSpec {
  provider: string;
  config?: Record<string, string>;
  objectStorage?: {
    bucket: string;
    prefix?: string;
  };
  accessMode?: 'ReadWrite' | 'ReadOnly';
  default?: boolean;
  [key: string]: any;
}

export interface VeleroBSLStatus {
  phase?: 'Available' | 'Unavailable' | string;
  lastValidated?: string;
  accessMode?: string;
  [key: string]: any;
}

export interface VeleroBSLInterface extends KubeObjectInterface {
  spec: VeleroBSLSpec;
  status?: VeleroBSLStatus;
}

export class VeleroBackupStorageLocation extends KubeObject<VeleroBSLInterface> {
  static kind = 'BackupStorageLocation';
  static namespaced = true;
  static apiVersion = 'velero.io/v1';
  static isApiGroup = true;
  static apiGroup = 'velero.io';
  static get pluralName() {
    return 'backupstoragelocations';
  }

  get spec(): VeleroBSLSpec {
    return this.jsonData.spec ?? { provider: '' };
  }

  get status(): VeleroBSLStatus {
    return this.jsonData.status ?? {};
  }

  get provider(): string {
    return this.spec.provider;
  }

  get bucket(): string {
    return this.spec.objectStorage?.bucket ?? '-';
  }

  get phase(): string {
    return this.status.phase ?? 'Unknown';
  }

  get isDefault(): boolean {
    return !!this.spec.default;
  }

  get accessMode(): string {
    return this.spec.accessMode ?? 'ReadWrite';
  }
}
