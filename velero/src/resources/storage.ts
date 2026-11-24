import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { veleroRoutePaths } from '../utils/veleroRoutes';

/** BackupStorageLocation spec (where backup tarballs are stored). */
export interface VeleroBslSpec {
  provider?: string;
  config?: Record<string, string>;
  objectStorage?: {
    bucket?: string;
    prefix?: string;
  };
  credential?: {
    name?: string;
    key?: string;
  };
  accessMode?: 'ReadWrite' | 'ReadOnly' | string;
}

export interface VeleroBslStatus {
  phase?: string;
  lastValidationTime?: string;
  message?: string;
}

export interface VeleroBslInterface extends KubeObjectInterface {
  spec?: VeleroBslSpec;
  status?: VeleroBslStatus;
}

/** Headlamp wrapper for BackupStorageLocation (BSL). */
export class VeleroBackupStorageLocation extends KubeObject<VeleroBslInterface> {
  static kind = 'BackupStorageLocation';
  static apiName = 'backupstoragelocations';
  static apiVersion = 'velero.io/v1';
  static isNamespaced = true;

  static get detailsRoute() {
    return veleroRoutePaths.bslDetail;
  }

  get provider(): string {
    return this.jsonData.spec?.provider ?? 'N/A';
  }

  get bucket(): string {
    return this.jsonData.spec?.objectStorage?.bucket ?? 'N/A';
  }

  get prefix(): string {
    return this.jsonData.spec?.objectStorage?.prefix ?? '';
  }

  get accessMode(): string {
    return this.jsonData.spec?.accessMode ?? 'ReadWrite';
  }

  get phase(): string {
    return this.jsonData.status?.phase ?? 'Unknown';
  }

  get lastValidationTime(): string | undefined {
    return this.jsonData.status?.lastValidationTime;
  }

  get statusMessage(): string {
    return this.jsonData.status?.message ?? '';
  }
}

/** VolumeSnapshotLocation spec (CSI / volume snapshot config). */
export interface VeleroVslSpec {
  provider?: string;
  config?: Record<string, string>;
}

export interface VeleroVslStatus {
  phase?: string;
}

export interface VeleroVslInterface extends KubeObjectInterface {
  spec?: VeleroVslSpec;
  status?: VeleroVslStatus;
}

/** Headlamp wrapper for VolumeSnapshotLocation (VSL). */
export class VeleroVolumeSnapshotLocation extends KubeObject<VeleroVslInterface> {
  static kind = 'VolumeSnapshotLocation';
  static apiName = 'volumesnapshotlocations';
  static apiVersion = 'velero.io/v1';
  static isNamespaced = true;

  static get detailsRoute() {
    return veleroRoutePaths.vslDetail;
  }

  get provider(): string {
    return this.jsonData.spec?.provider ?? 'N/A';
  }

  /** Velero often leaves VSL status.phase unset — do not invent "Unknown". */
  get phase(): string {
    return this.jsonData.status?.phase?.trim() ?? '';
  }

  get hasReportedPhase(): boolean {
    return this.phase.length > 0;
  }

  get configDisplay(): string {
    const config = this.jsonData.spec?.config;
    if (!config || Object.keys(config).length === 0) {
      return 'N/A';
    }
    return Object.entries(config)
      .map(([k, v]) => `${k}=${v}`)
      .join(', ');
  }
}

/** BackupRepository — kopia/restic repo used by datamover / PVB flows. */
export interface VeleroBackupRepositorySpec {
  volumeNamespace?: string;
  backupStorageLocation?: string;
  repositoryType?: string;
  resticIdentifier?: string;
}

export interface VeleroBackupRepositoryStatus {
  phase?: string;
  message?: string;
}

export interface VeleroBackupRepositoryInterface extends KubeObjectInterface {
  spec?: VeleroBackupRepositorySpec;
  status?: VeleroBackupRepositoryStatus;
}

/** Headlamp wrapper for BackupRepository. */
export class VeleroBackupRepository extends KubeObject<VeleroBackupRepositoryInterface> {
  static kind = 'BackupRepository';
  static apiName = 'backuprepositories';
  static apiVersion = 'velero.io/v1';
  static isNamespaced = true;

  static get detailsRoute() {
    return veleroRoutePaths.backupRepositoryDetail;
  }

  get volumeNamespace(): string {
    return this.jsonData.spec?.volumeNamespace ?? 'N/A';
  }

  get backupStorageLocation(): string {
    return this.jsonData.spec?.backupStorageLocation ?? 'N/A';
  }

  get repositoryType(): string {
    return this.jsonData.spec?.repositoryType ?? 'N/A';
  }

  get phase(): string {
    return this.jsonData.status?.phase ?? 'Unknown';
  }

  get statusMessage(): string {
    return this.jsonData.status?.message ?? '';
  }
}
