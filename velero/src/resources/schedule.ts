import { K8s } from '@kinvolk/headlamp-plugin/lib';
import { KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/KubeObject';
import { VeleroBackupSpec } from './backup';

const KubeObject = K8s.cluster.KubeObject;

export interface VeleroScheduleSpec {
  schedule: string;
  template: VeleroBackupSpec;
  paused?: boolean;
  [key: string]: any;
}

export interface VeleroScheduleStatus {
  phase?: 'New' | 'Enabled' | 'FailedValidation' | string;
  lastBackup?: string;
  [key: string]: any;
}

export interface VeleroScheduleInterface extends KubeObjectInterface {
  spec: VeleroScheduleSpec;
  status?: VeleroScheduleStatus;
}

export class VeleroSchedule extends KubeObject<VeleroScheduleInterface> {
  static kind = 'Schedule';
  static namespaced = true;
  static apiVersion = 'velero.io/v1';
  static isApiGroup = true;
  static apiGroup = 'velero.io';
  static get pluralName() {
    return 'schedules';
  }

  get spec(): VeleroScheduleSpec {
    return this.jsonData.spec ?? { schedule: '', template: {} };
  }

  get status(): VeleroScheduleStatus {
    return this.jsonData.status ?? {};
  }

  get cronSchedule(): string {
    return this.spec.schedule;
  }

  get isPaused(): boolean {
    return !!this.spec.paused;
  }

  get lastBackupTimestamp(): string | undefined {
    return this.status.lastBackup;
  }
}
