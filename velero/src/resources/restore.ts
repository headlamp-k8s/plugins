import { K8s } from '@kinvolk/headlamp-plugin/lib';
import { KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/KubeObject';

const KubeObject = K8s.cluster.KubeObject;

export interface VeleroRestoreSpec {
  backupName: string;
  includedNamespaces?: string[];
  excludedNamespaces?: string[];
  namespaceMapping?: Record<string, string>;
  restorePVs?: boolean;
  [key: string]: any;
}

export interface VeleroRestoreStatus {
  phase?: 'New' | 'InProgress' | 'Completed' | 'Failed' | 'PartiallyFailed' | string;
  errors?: number;
  warnings?: number;
  startTimestamp?: string;
  completionTimestamp?: string;
  progress?: {
    totalItems?: number;
    itemsRestored?: number;
  };
  [key: string]: any;
}

export interface VeleroRestoreInterface extends KubeObjectInterface {
  spec: VeleroRestoreSpec;
  status?: VeleroRestoreStatus;
}

export class VeleroRestore extends KubeObject<VeleroRestoreInterface> {
  static kind = 'Restore';
  static namespaced = true;
  static apiVersion = 'velero.io/v1';
  static isApiGroup = true;
  static apiGroup = 'velero.io';
  static get pluralName() {
    return 'restores';
  }

  get spec(): VeleroRestoreSpec {
    return this.jsonData.spec ?? { backupName: '' };
  }

  get status(): VeleroRestoreStatus {
    return this.jsonData.status ?? {};
  }

  get backupName(): string {
    return this.spec.backupName;
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
}
