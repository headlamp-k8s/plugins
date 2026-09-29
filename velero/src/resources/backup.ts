import { K8s } from '@kinvolk/headlamp-plugin/lib';
import { KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/KubeObject';

const KubeObject = K8s.cluster.KubeObject;

export interface VeleroBackupSpec {
  includedNamespaces?: string[];
  excludedNamespaces?: string[];
  includedResources?: string[];
  excludedResources?: string[];
  storageLocation?: string;
  ttl?: string;
  snapshotVolumes?: boolean;
  hooks?: Record<string, any>;
  [key: string]: any;
}

export interface VeleroBackupStatus {
  phase?: 'New' | 'InProgress' | 'Completed' | 'Failed' | 'PartiallyFailed' | 'Deleting' | string;
  version?: number;
  expiration?: string;
  startTimestamp?: string;
  completionTimestamp?: string;
  errors?: number;
  warnings?: number;
  progress?: {
    totalItems?: number;
    itemsBackedUp?: number;
  };
  [key: string]: any;
}

export interface VeleroBackupInterface extends KubeObjectInterface {
  spec: VeleroBackupSpec;
  status?: VeleroBackupStatus;
}

export class VeleroBackup extends KubeObject<VeleroBackupInterface> {
  static kind = 'Backup';
  static namespaced = true;
  static apiVersion = 'velero.io/v1';
  static isApiGroup = true;
  static apiGroup = 'velero.io';
  static get pluralName() {
    return 'backups';
  }

  get spec(): VeleroBackupSpec {
    return this.jsonData.spec ?? {};
  }

  get status(): VeleroBackupStatus {
    return this.jsonData.status ?? {};
  }

  get phase(): string {
    return this.status.phase ?? 'Unknown';
  }

  get errorsCount(): number {
    return this.status.errors ?? 0;
  }

  get warningsCount(): number {
    return this.status.warnings ?? 0;
  }

  get includedNamespaces(): string[] {
    return this.spec.includedNamespaces ?? ['*'];
  }

  get excludedNamespaces(): string[] {
    return this.spec.excludedNamespaces ?? [];
  }

  get storageLocation(): string {
    return this.spec.storageLocation ?? 'default';
  }

  get ttl(): string {
    return this.spec.ttl ?? '720h0m0s';
  }

  get expiration(): string | undefined {
    return this.status.expiration;
  }
}
