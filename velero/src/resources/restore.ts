import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { LabelSelector, VeleroPhase, VeleroProgress } from './common';

/**
 * A Velero Restore points at an existing backup and optionally narrows down
 * what gets restored from it.
 *
 * @see https://velero.io/docs/main/api-types/restore/
 */
export interface RestoreSpec {
  backupName?: string;
  scheduleName?: string;
  includedNamespaces?: string[];
  excludedNamespaces?: string[];
  includedResources?: string[];
  excludedResources?: string[];
  /** Maps a namespace in the backup to a different namespace in the cluster. */
  namespaceMapping?: Record<string, string>;
  labelSelector?: LabelSelector;
  restorePVs?: boolean;
  includeClusterResources?: boolean;
  existingResourcePolicy?: string;
}

export interface RestoreStatus {
  phase?: VeleroPhase;
  startTimestamp?: string;
  completionTimestamp?: string;
  errors?: number;
  warnings?: number;
  validationErrors?: string[];
  failureReason?: string;
  progress?: VeleroProgress;
}

export interface KubeRestore extends KubeObjectInterface {
  spec?: RestoreSpec;
  status?: RestoreStatus;
}

export class Restore extends KubeObject<KubeRestore> {
  static kind = 'Restore';
  static apiName = 'restores';
  static apiVersion = 'velero.io/v1';
  static isNamespaced = true;

  static get detailsRoute() {
    return '/velero/restores/:namespace/:name';
  }

  get spec(): RestoreSpec {
    return this.jsonData.spec ?? {};
  }

  get status(): RestoreStatus {
    return this.jsonData.status ?? {};
  }

  get phase() {
    return this.status.phase;
  }

  get backupName() {
    return this.spec.backupName;
  }
}
