import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { LabelSelector, VeleroPhase, VeleroProgress } from './common';

/**
 * What a Velero Backup asks for. Schedules embed the same shape as their
 * template, so it is exported on its own.
 *
 * @see https://velero.io/docs/main/api-types/backup/
 */
export interface BackupSpec {
  includedNamespaces?: string[];
  excludedNamespaces?: string[];
  includedResources?: string[];
  excludedResources?: string[];
  labelSelector?: LabelSelector;
  snapshotVolumes?: boolean;
  includeClusterResources?: boolean;
  defaultVolumesToFsBackup?: boolean;
  storageLocation?: string;
  volumeSnapshotLocations?: string[];
  /** How long the backup is kept before Velero deletes it, e.g. "720h0m0s". */
  ttl?: string;
}

export interface BackupStatus {
  phase?: VeleroPhase;
  startTimestamp?: string;
  completionTimestamp?: string;
  expiration?: string;
  version?: number;
  formatVersion?: string;
  errors?: number;
  warnings?: number;
  validationErrors?: string[];
  failureReason?: string;
  progress?: VeleroProgress;
}

export interface KubeBackup extends KubeObjectInterface {
  spec?: BackupSpec;
  status?: BackupStatus;
}

export class Backup extends KubeObject<KubeBackup> {
  static kind = 'Backup';
  static apiName = 'backups';
  static apiVersion = 'velero.io/v1';
  static isNamespaced = true;

  static get detailsRoute() {
    return '/velero/backups/:namespace/:name';
  }

  get spec(): BackupSpec {
    return this.jsonData.spec ?? {};
  }

  get status(): BackupStatus {
    return this.jsonData.status ?? {};
  }

  get phase() {
    return this.status.phase;
  }

  /** Backups without a TTL never expire, so there is nothing to show. */
  get expiration() {
    return this.status.expiration;
  }
}
