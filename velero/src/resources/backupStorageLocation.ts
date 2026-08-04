import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { VeleroPhase } from './common';

/**
 * Where Velero stores backup tarballs and metadata (an object storage bucket).
 *
 * @see https://velero.io/docs/main/api-types/backupstoragelocation/
 */
export interface BackupStorageLocationSpec {
  provider?: string;
  objectStorage?: {
    bucket?: string;
    prefix?: string;
    caCert?: string;
  };
  config?: Record<string, string>;
  accessMode?: 'ReadOnly' | 'ReadWrite' | string;
  default?: boolean;
  backupSyncPeriod?: string;
  validationFrequency?: string;
}

export interface BackupStorageLocationStatus {
  phase?: VeleroPhase;
  lastSyncedTime?: string;
  lastValidationTime?: string;
  message?: string;
}

export interface KubeBackupStorageLocation extends KubeObjectInterface {
  spec?: BackupStorageLocationSpec;
  status?: BackupStorageLocationStatus;
}

export class BackupStorageLocation extends KubeObject<KubeBackupStorageLocation> {
  static kind = 'BackupStorageLocation';
  static apiName = 'backupstoragelocations';
  static apiVersion = 'velero.io/v1';
  static isNamespaced = true;

  get spec(): BackupStorageLocationSpec {
    return this.jsonData.spec ?? {};
  }

  get status(): BackupStorageLocationStatus {
    return this.jsonData.status ?? {};
  }

  get phase() {
    return this.status.phase;
  }

  /** Shown as bucket/prefix in the list, since the prefix is optional. */
  get bucketPath() {
    const bucket = this.spec.objectStorage?.bucket;
    if (!bucket) {
      return '-';
    }

    const prefix = this.spec.objectStorage?.prefix;
    return prefix ? `${bucket}/${prefix}` : bucket;
  }
}
