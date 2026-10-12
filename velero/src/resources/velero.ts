import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';

/** Kubernetes label selector requirement (Velero Schedule template). */
export interface LabelSelectorRequirement {
  key: string;
  operator: string;
  values?: string[];
}

/** Kubernetes label selector used by Velero `labelSelector` / `orLabelSelectors`. */
export interface LabelSelector {
  matchLabels?: Record<string, string>;
  matchExpressions?: LabelSelectorRequirement[];
}

/** Backup template fields from a Velero Schedule used for coverage matching. */
export interface VeleroBackupTemplate {
  includedNamespaces?: string[];
  excludedNamespaces?: string[];
  labelSelector?: LabelSelector;
  orLabelSelectors?: LabelSelector[];
  includedResources?: string[];
  excludedResources?: string[];
  /** Newer Velero BackupSpec filters for namespaced kinds (Deployments, PVCs, …). */
  includedNamespaceScopedResources?: string[];
  excludedNamespaceScopedResources?: string[];
}

/** Velero Schedule CRD (velero.io/v1). */
export interface VeleroScheduleSpec {
  schedule?: string;
  /** When true, Velero does not create new backups for this schedule. */
  paused?: boolean;
  template?: VeleroBackupTemplate;
}

export interface VeleroScheduleStatus {
  phase?: string;
  validationErrors?: string[];
  lastBackup?: string;
  /** Set when Velero skips a scheduled backup (e.g. skipImmediately). */
  lastSkipped?: string;
}

export interface VeleroScheduleInterface extends KubeObjectInterface {
  spec?: VeleroScheduleSpec;
  status?: VeleroScheduleStatus;
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

  get paused(): boolean {
    return !!this.spec?.paused;
  }

  get phase(): string | undefined {
    return this.jsonData.status?.phase;
  }

  /** Timestamp of the last backup created from this schedule (status.lastBackup). */
  get lastBackupTime(): string | undefined {
    return this.jsonData.status?.lastBackup;
  }

  /** Timestamp of the last skipped run (status.lastSkipped). */
  get lastSkippedTime(): string | undefined {
    return this.jsonData.status?.lastSkipped;
  }

  get validationErrors(): string[] {
    return this.jsonData.status?.validationErrors ?? [];
  }

  /** True when Velero will not create backups from this schedule. */
  get isFailedValidation(): boolean {
    return this.phase === 'FailedValidation';
  }

  /** Operator-facing status: FailedValidation, Paused, or Active. */
  get statusDisplay(): string {
    if (this.isFailedValidation) {
      return 'FailedValidation';
    }
    if (this.paused) {
      return 'Paused';
    }
    return 'Active';
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
