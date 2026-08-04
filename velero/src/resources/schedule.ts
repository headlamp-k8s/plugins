import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { BackupSpec } from './backup';
import { VeleroPhase } from './common';

/**
 * A Schedule creates backups on a cron expression using the embedded backup
 * template.
 *
 * @see https://velero.io/docs/main/api-types/schedule/
 */
export interface ScheduleSpec {
  /** Cron expression, for example "0 2 * * *". */
  schedule?: string;
  template?: BackupSpec;
  paused?: boolean;
  useOwnerReferencesInBackup?: boolean;
}

export interface ScheduleStatus {
  phase?: VeleroPhase;
  /** Timestamp of the last backup this schedule created. */
  lastBackup?: string;
  validationErrors?: string[];
}

export interface KubeSchedule extends KubeObjectInterface {
  spec?: ScheduleSpec;
  status?: ScheduleStatus;
}

export class Schedule extends KubeObject<KubeSchedule> {
  static kind = 'Schedule';
  static apiName = 'schedules';
  static apiVersion = 'velero.io/v1';
  static isNamespaced = true;

  static get detailsRoute() {
    return '/velero/schedules/:namespace/:name';
  }

  get spec(): ScheduleSpec {
    return this.jsonData.spec ?? {};
  }

  get status(): ScheduleStatus {
    return this.jsonData.status ?? {};
  }

  get cronSchedule() {
    return this.spec.schedule;
  }

  get phase() {
    return this.status.phase;
  }

  get lastBackup() {
    return this.status.lastBackup;
  }
}
