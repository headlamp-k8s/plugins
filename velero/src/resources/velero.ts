import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';

/** Backup template fields from a Velero Schedule used for coverage matching. */
export interface VeleroBackupTemplate {
  includedNamespaces?: string[];
  excludedNamespaces?: string[];
  labelSelector?: {
    matchLabels?: Record<string, string>;
  };
  includedResources?: string[];
  excludedResources?: string[];
}

/** Velero Schedule CRD (velero.io/v1). */
export interface VeleroScheduleSpec {
  schedule?: string;
  template?: VeleroBackupTemplate;
}

export interface VeleroScheduleInterface extends KubeObjectInterface {
  spec?: VeleroScheduleSpec;
}

export interface VeleroBackupStatus {
  phase?: string;
  startTimestamp?: string;
  completionTimestamp?: string;
}

export interface VeleroBackupInterface extends KubeObjectInterface {
  status?: VeleroBackupStatus;
}

/** Headlamp KubeObject wrapper for Velero Schedule resources. */
export class VeleroSchedule extends KubeObject<VeleroScheduleInterface> {
  static kind = 'Schedule';
  static apiName = 'schedules';
  static apiVersion = 'velero.io/v1';
  static isNamespaced = true;

  get spec(): VeleroScheduleSpec | undefined {
    return this.jsonData.spec;
  }

  get cronSchedule(): string {
    return this.spec?.schedule ?? '';
  }

  get template(): VeleroBackupTemplate {
    return this.spec?.template ?? {};
  }
}

/** Headlamp KubeObject wrapper for Velero Backup resources. */
export class VeleroBackup extends KubeObject<VeleroBackupInterface> {
  static kind = 'Backup';
  static apiName = 'backups';
  static apiVersion = 'velero.io/v1';
  static isNamespaced = true;

  get scheduleName(): string | undefined {
    return this.metadata.labels?.['velero.io/schedule-name'];
  }

  get phase(): string {
    return this.jsonData.status?.phase ?? 'Unknown';
  }

  get startTimestamp(): string | undefined {
    return this.jsonData.status?.startTimestamp;
  }

  get completionTimestamp(): string | undefined {
    return this.jsonData.status?.completionTimestamp;
  }
}
