import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { veleroRoutePaths } from '../utils/veleroRoutes';

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
}

/** Velero Schedule CRD (velero.io/v1). */
export interface VeleroScheduleSpec {
  schedule?: string;
  /** When true, Velero does not create new backups for this schedule. */
  paused?: boolean;
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

export interface VeleroBackupSpec {
  includedNamespaces?: string[];
  excludedNamespaces?: string[];
  includedResources?: string[];
  excludedResources?: string[];
  labelSelector?: LabelSelector;
  orLabelSelectors?: LabelSelector[];
}

export interface VeleroBackupInterface extends KubeObjectInterface {
  spec?: VeleroBackupSpec;
  status?: VeleroBackupStatus;
}

/** Headlamp KubeObject wrapper for Velero Schedule resources. */
export class VeleroSchedule extends KubeObject<VeleroScheduleInterface> {
  static kind = 'Schedule';
  static apiName = 'schedules';
  static apiVersion = 'velero.io/v1';
  static isNamespaced = true;

  static get detailsRoute() {
    return veleroRoutePaths.scheduleDetail;
  }

  get spec(): VeleroScheduleSpec | undefined {
    return this.jsonData.spec;
  }

  get cronSchedule(): string {
    return this.spec?.schedule ?? '';
  }

  get paused(): boolean {
    return !!this.spec?.paused;
  }

  get template(): VeleroBackupTemplate {
    return this.spec?.template ?? {};
  }

  /** Namespaces included by this schedule's backup template. */
  get includedNamespacesDisplay(): string {
    const namespaces = this.template.includedNamespaces;
    if (!namespaces || namespaces.length === 0) {
      return '*';
    }
    return namespaces.join(', ');
  }
}

/** Headlamp KubeObject wrapper for Velero Backup resources. */
export class VeleroBackup extends KubeObject<VeleroBackupInterface> {
  static kind = 'Backup';
  static apiName = 'backups';
  static apiVersion = 'velero.io/v1';
  static isNamespaced = true;

  static get detailsRoute() {
    return veleroRoutePaths.backupDetail;
  }

  get spec(): VeleroBackupSpec | undefined {
    return this.jsonData.spec;
  }

  get scheduleName(): string | undefined {
    return this.metadata.labels?.['velero.io/schedule-name'];
  }

  /** True when the backup was created by a Schedule rather than manually. */
  get isScheduled(): boolean {
    return !!this.scheduleName;
  }

  get triggeredByDisplay(): string {
    return this.scheduleName ?? 'Manual';
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

  get includedNamespacesDisplay(): string {
    const namespaces = this.spec?.includedNamespaces;
    if (!namespaces || namespaces.length === 0) {
      return '*';
    }
    return namespaces.join(', ');
  }
}
