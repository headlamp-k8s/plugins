import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { Conditions, KedaTrigger } from './common';

export interface ScaleTargetRef {
  apiVersion?: string;
  kind?: string;
  name: string;
  envSourceContainerName?: string;
}

export interface ScaledObjectFallback {
  failureThreshold: number;
  replicas: number;
}

export interface HPABehaviorScalingRules {
  stabilizationWindowSeconds?: number;
  policies?: Array<{
    type: string;
    value: number;
    periodSeconds: number;
  }>;
}

export interface HPABehavior {
  scaleDown?: HPABehaviorScalingRules;
  scaleUp?: HPABehaviorScalingRules;
}

export enum ScalingModifierMetricType {
  AVERAGEVALUE = 'AverageValue',
  VALUE = 'Value',
}

export interface ScalingModifiers {
  target: number;
  activationTarget?: number;
  metricType?: ScalingModifierMetricType;
  formula: string;
}

export interface ScaledObjectAdvanced {
  restoreToOriginalReplicaCount?: boolean;
  horizontalPodAutoscalerConfig?: {
    name?: string;
    behavior?: HPABehavior;
  };
  scalingModifiers?: ScalingModifiers;
}

export interface ScaleTargetGVKR {
  group: string;
  version: string;
  kind: string;
  resource: string;
}

export enum HealthStatus {
  HAPPY = 'Happy',
  FAILING = 'Failing',
}

export interface KedaScaledObject extends KubeObjectInterface {
  spec: {
    scaleTargetRef: ScaleTargetRef;
    pollingInterval?: number;
    cooldownPeriod?: number;
    initialCooldownPeriod?: number;
    idleReplicaCount?: number;
    minReplicaCount?: number;
    maxReplicaCount?: number;
    fallback?: ScaledObjectFallback;
    advanced?: ScaledObjectAdvanced;
    triggers: KedaTrigger[];
  };
  status?: {
    scaleTargetKind?: string;
    scaleTargetGVKR?: ScaleTargetGVKR;
    originalReplicaCount?: number;
    lastActiveTime?: string;
    externalMetricNames?: string[];
    resourceMetricNames?: string[];
    compositeScalerName?: string;
    conditions?: Conditions;
    health?: {
      [key: string]: {
        numberOfFailures?: number;
        status?: HealthStatus;
      };
    };
    pausedReplicaCount?: number;
    hpaName?: string;
    triggersTypes?: string;
    authenticationsTypes?: string;
  };
}

export class ScaledObject extends KubeObject<KedaScaledObject> {
  static apiVersion = 'keda.sh/v1alpha1';
  static kind = 'ScaledObject';
  static apiName = 'scaledobjects';
  static isNamespaced = true;

  // Note: This workaround is needed to make the plugin compatible with older versions of Headlamp
  static get detailsRoute() {
    return '/keda/scaledobjects/:namespace/:name';
  }

  get spec() {
    return this.jsonData.spec;
  }

  get status() {
    return this.jsonData.status || {};
  }

  get readyStatus(): string {
    return this.status?.conditions?.find(condition => condition.type === 'Ready')?.status;
  }

  get activeStatus(): string {
    return this.status?.conditions?.find(condition => condition.type === 'Active')?.status;
  }

  get fallbackStatus(): string {
    return this.status?.conditions?.find(condition => condition.type === 'Fallback')?.status;
  }

  get pausedStatus(): string {
    return this.status?.conditions?.find(condition => condition.type === 'Paused')?.status;
  }

  get scaleTargetApiVersion(): string {
    return this.spec.scaleTargetRef?.apiVersion || 'apps/v1';
  }

  get scaleTargetKind(): string {
    return this.spec.scaleTargetRef?.kind || 'Deployment';
  }

  get scaleTargetName(): string {
    return this.spec.scaleTargetRef?.name;
  }

  get pollingInterval(): number {
    return this.spec.pollingInterval || 30;
  }

  get cooldownPeriod(): number {
    return this.spec.cooldownPeriod || 300;
  }

  get initialCooldownPeriod(): number {
    return this.spec.initialCooldownPeriod || 0;
  }

  get idleReplicaCount(): number | undefined {
    return this.spec.idleReplicaCount;
  }

  get minReplicaCount(): number {
    return this.spec.minReplicaCount || 0;
  }

  get maxReplicaCount(): number {
    return this.spec.maxReplicaCount || 100;
  }
}
