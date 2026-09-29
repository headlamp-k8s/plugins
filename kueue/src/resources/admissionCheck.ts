import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { kueueApiVersions } from '../utils/kueueApi';
import { kueueRoutePaths } from '../utils/kueueRoutes';
import {
  AdmissionCheckParametersRef,
  renderAdmissionCheckStatus,
  renderControllerName,
  renderParametersRef,
  renderRetryDelay,
} from './admissionCheckFormatters';
import type { KueueCondition } from './clusterQueue';

export interface AdmissionCheckSpec {
  controllerName?: string;
  retryDelayMinutes?: number;
  retryDelaySeconds?: number;
  parameters?: AdmissionCheckParametersRef | null;
}

export interface AdmissionCheckStatus {
  conditions?: KueueCondition[];
}

export interface KubeAdmissionCheck extends KubeObjectInterface {
  spec?: AdmissionCheckSpec;
  status?: AdmissionCheckStatus;
}

export class AdmissionCheck extends KubeObject<KubeAdmissionCheck> {
  static kind = 'AdmissionCheck';
  static apiName = 'admissionchecks';
  static apiVersion = kueueApiVersions;
  static isNamespaced = false;

  static get detailsRoute() {
    return kueueRoutePaths.admissionCheckDetail;
  }

  get spec(): AdmissionCheckSpec {
    return this.jsonData.spec ?? {};
  }

  get status(): AdmissionCheckStatus {
    return this.jsonData.status ?? {};
  }

  get controllerName(): string {
    return this.spec.controllerName || '';
  }

  get controllerNameDisplay(): string {
    return renderControllerName(this.spec.controllerName);
  }

  get retryDelayMinutes(): number | undefined {
    return this.spec.retryDelayMinutes;
  }

  get retryDelaySeconds(): number | undefined {
    return this.spec.retryDelaySeconds;
  }

  get retryDelayDisplay(): string {
    return renderRetryDelay(this.spec.retryDelayMinutes, this.spec.retryDelaySeconds);
  }

  get parameters(): AdmissionCheckParametersRef | null {
    return this.spec.parameters ?? null;
  }

  get parametersDisplay(): string {
    return renderParametersRef(this.spec.parameters);
  }

  get conditions(): KueueCondition[] {
    return this.status.conditions ?? [];
  }

  get statusDisplay(): string {
    return renderAdmissionCheckStatus(this.conditions);
  }
}
