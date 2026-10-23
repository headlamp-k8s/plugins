import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';

/** Shared progress for volume / CSI datamover objects. */
export interface VeleroByteProgress {
  totalBytes?: number;
  bytesDone?: number;
}

export interface VeleroPodVolumeBackupInterface extends KubeObjectInterface {
  spec?: {
    node?: string;
    pod?: { name?: string; namespace?: string; uid?: string };
    volume?: string;
    backupStorageLocation?: string;
    uploaderType?: string;
  };
  status?: {
    phase?: string;
    progress?: VeleroByteProgress;
    message?: string;
  };
}

/** File-system / uploader volume backup (restic/kopia) linked to a Backup. */
export class VeleroPodVolumeBackup extends KubeObject<VeleroPodVolumeBackupInterface> {
  static kind = 'PodVolumeBackup';
  static apiName = 'podvolumebackups';
  static apiVersion = 'velero.io/v1';
  static isNamespaced = true;

  get podName(): string {
    return this.jsonData.spec?.pod?.name ?? 'N/A';
  }

  get volume(): string {
    return this.jsonData.spec?.volume ?? 'N/A';
  }

  get phase(): string {
    return this.jsonData.status?.phase ?? 'Unknown';
  }

  get message(): string {
    return this.jsonData.status?.message ?? '';
  }

  get progress(): VeleroByteProgress | undefined {
    return this.jsonData.status?.progress;
  }
}

export interface VeleroPodVolumeRestoreInterface extends KubeObjectInterface {
  spec?: {
    pod?: { name?: string; namespace?: string; uid?: string };
    volume?: string;
    backupStorageLocation?: string;
    uploaderType?: string;
  };
  status?: {
    phase?: string;
    progress?: VeleroByteProgress;
    message?: string;
  };
}

/** File-system / uploader volume restore linked to a Restore. */
export class VeleroPodVolumeRestore extends KubeObject<VeleroPodVolumeRestoreInterface> {
  static kind = 'PodVolumeRestore';
  static apiName = 'podvolumerestores';
  static apiVersion = 'velero.io/v1';
  static isNamespaced = true;

  get podName(): string {
    return this.jsonData.spec?.pod?.name ?? 'N/A';
  }

  get volume(): string {
    return this.jsonData.spec?.volume ?? 'N/A';
  }

  get phase(): string {
    return this.jsonData.status?.phase ?? 'Unknown';
  }

  get message(): string {
    return this.jsonData.status?.message ?? '';
  }

  get progress(): VeleroByteProgress | undefined {
    return this.jsonData.status?.progress;
  }
}

/** CSI DataDownload target volume may be a string or a structured object. */
export type VeleroDataDownloadTargetVolume =
  | string
  | {
      namespace?: string;
      pvc?: string;
      pv?: string;
    };

export interface VeleroDataUploadInterface extends KubeObjectInterface {
  spec?: {
    backupStorageLocation?: string;
    /** CSI DataUpload v2alpha1 field for the source PVC name. */
    sourcePVC?: string;
    /** Older / alternate field some fixtures may still use. */
    sourceVolume?: string;
    snapshotType?: string;
  };
  status?: {
    phase?: string;
    progress?: VeleroByteProgress;
    message?: string;
  };
}

/**
 * CSI datamover upload (often velero.io/v2alpha1 on newer Velero).
 * Missing CRDs surface as list errors; UI treats that as empty.
 */
export class VeleroDataUpload extends KubeObject<VeleroDataUploadInterface> {
  static kind = 'DataUpload';
  static apiName = 'datauploads';
  static apiVersion = 'velero.io/v2alpha1';
  static isNamespaced = true;

  /** Prefer spec.sourcePVC (Velero v2alpha1); fall back to sourceVolume. */
  get sourceVolume(): string {
    return this.jsonData.spec?.sourcePVC ?? this.jsonData.spec?.sourceVolume ?? 'N/A';
  }

  get snapshotType(): string {
    return this.jsonData.spec?.snapshotType ?? 'N/A';
  }

  get backupStorageLocation(): string {
    return this.jsonData.spec?.backupStorageLocation ?? 'N/A';
  }

  get phase(): string {
    return this.jsonData.status?.phase ?? 'Unknown';
  }

  get message(): string {
    return this.jsonData.status?.message ?? '';
  }

  get progress(): VeleroByteProgress | undefined {
    return this.jsonData.status?.progress;
  }
}

export interface VeleroDataDownloadInterface extends KubeObjectInterface {
  spec?: {
    backupStorageLocation?: string;
    targetVolume?: VeleroDataDownloadTargetVolume;
  };
  status?: {
    phase?: string;
    progress?: VeleroByteProgress;
    message?: string;
  };
}

/** Format DataDownload target volume for table display. */
export function formatDataDownloadTargetVolume(
  target: VeleroDataDownloadTargetVolume | undefined
): string {
  if (target === undefined || target === null) {
    return 'N/A';
  }
  if (typeof target === 'string') {
    return target || 'N/A';
  }
  const ns = target.namespace?.trim();
  const pvc = target.pvc?.trim();
  const pv = target.pv?.trim();
  if (pvc && ns) {
    return `${ns}/${pvc}`;
  }
  if (pvc) {
    return pvc;
  }
  if (pv) {
    return pv;
  }
  if (ns) {
    return ns;
  }
  return 'N/A';
}

/** CSI datamover download linked to a Restore. */
export class VeleroDataDownload extends KubeObject<VeleroDataDownloadInterface> {
  static kind = 'DataDownload';
  static apiName = 'datadownloads';
  static apiVersion = 'velero.io/v2alpha1';
  static isNamespaced = true;

  get targetVolume(): string {
    return formatDataDownloadTargetVolume(this.jsonData.spec?.targetVolume);
  }

  get backupStorageLocation(): string {
    return this.jsonData.spec?.backupStorageLocation ?? 'N/A';
  }

  get phase(): string {
    return this.jsonData.status?.phase ?? 'Unknown';
  }

  get message(): string {
    return this.jsonData.status?.message ?? '';
  }

  get progress(): VeleroByteProgress | undefined {
    return this.jsonData.status?.progress;
  }
}
