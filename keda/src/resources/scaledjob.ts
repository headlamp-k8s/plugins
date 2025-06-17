import {
  KubeMetadata,
  KubeObject,
  KubeObjectInterface,
} from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { KubePodSpec } from '@kinvolk/headlamp-plugin/lib/k8s/pod';
import { Conditions, KedaTrigger } from './common';

export interface JobTargetRef {
  parallelism?: number;
  completions?: number;
  activeDeadlineSeconds?: number;
  backoffLimit?: number;
  template: {
    metadata?: KubeMetadata;
    spec: KubePodSpec;
  };
}

export enum RolloutStrategy {
  DEFAULT = 'default',
  GRADUAL = 'gradual',
}

export enum RolloutPropagationPolicy {
  FOREGROUND = 'foreground',
  BACKGROUND = 'background',
}

export enum ScalingStrategy {
  DEFAULT = 'default',
  CUSTOM = 'custom',
  ACCURATE = 'accurate',
  EAGER = 'eager',
}

export enum MultipleScalersCalculation {
  MAX = 'max',
  MIN = 'min',
  AVG = 'avg',
  SUM = 'sum',
}

export interface KedaScaledJob extends KubeObjectInterface {
  spec: {
    jobTargetRef: JobTargetRef;
    pollingInterval?: number;
    successfulJobsHistoryLimit?: number;
    failedJobsHistoryLimit?: number;
    envSourceContainerName?: string;
    minReplicaCount?: number;
    maxReplicaCount?: number;
    rollout?: {
      strategy?: RolloutStrategy;
      propagationPolicy?: RolloutPropagationPolicy;
    };
    scalingStrategy?: {
      strategy?: ScalingStrategy;
      customScalingQueueLengthDeduction?: number;
      customScalingRunningJobPercentage?: number;
      pendingPodConditions?: string[];
      multipleScalersCalculation?: MultipleScalersCalculation;
    };
    triggers: KedaTrigger[];
  };
  status?: {
    lastActiveTime?: string;
    conditions?: Conditions;
    paused?: string;
    triggersTypes?: string;
    authenticationsTypes?: string;
  };
}

export class ScaledJob extends KubeObject<KedaScaledJob> {
  static apiVersion = 'keda.sh/v1alpha1';
  static kind = 'ScaledJob';
  static apiName = 'scaledjobs';
  static isNamespaced = true;

  // Note: This workaround is needed to make the plugin compatible with older versions of Headlamp
  static get detailsRoute() {
    return '/keda/scaledjobs/:namespace/:name';
  }

  get spec() {
    return this.jsonData.spec;
  }

  get status() {
    return this.jsonData.status || {};
  }

  get readyStatus() {
    return this.status?.conditions?.find(condition => condition.type === 'Ready')?.status;
  }

  get activeStatus() {
    return this.status?.conditions?.find(condition => condition.type === 'Active')?.status;
  }

  get pausedStatus() {
    return this.status?.conditions?.find(condition => condition.type === 'Paused')?.status;
  }

  get jobTargetParallelism(): number {
    return this.spec.jobTargetRef?.parallelism || 1;
  }

  get jobTargetCompletions(): number {
    return this.spec.jobTargetRef?.completions || 1;
  }

  get jobTargetActiveDeadlineSeconds(): number {
    return this.spec.jobTargetRef?.activeDeadlineSeconds;
  }

  get jobTargetBackoffLimit(): number {
    return this.spec.jobTargetRef?.backoffLimit || 6;
  }

  get pollingInterval(): number {
    return this.spec.pollingInterval || 30;
  }

  get successfulJobsHistoryLimit(): number {
    return this.spec.successfulJobsHistoryLimit || 100;
  }

  get failedJobsHistoryLimit(): number {
    return this.spec.failedJobsHistoryLimit || 100;
  }

  get envSourceContainerName(): string {
    return (
      this.spec.envSourceContainerName ||
      this.spec.jobTargetRef?.template?.spec?.containers[0]?.name
    );
  }

  get minReplicaCount(): number {
    return this.spec.minReplicaCount || 0;
  }

  get maxReplicaCount(): number {
    return this.spec.maxReplicaCount || 100;
  }

  get rolloutStrategy(): string {
    return this.spec.rollout?.strategy || RolloutStrategy.DEFAULT;
  }

  get rolloutPropagationPolicy(): RolloutPropagationPolicy {
    return this.spec.rollout?.propagationPolicy || RolloutPropagationPolicy.BACKGROUND;
  }

  get scalingStrategy(): ScalingStrategy {
    return this.spec.scalingStrategy?.strategy || ScalingStrategy.DEFAULT;
  }

  get scalingStrategyCustomScalingQueueLengthDeduction(): number {
    return this.spec.scalingStrategy?.customScalingQueueLengthDeduction;
  }

  get scalingStrategyCustomScalingRunningJobPercentage(): number {
    return this.spec.scalingStrategy?.customScalingRunningJobPercentage;
  }

  get scalingStrategyPendingPodConditions(): string[] {
    return this.spec.scalingStrategy?.pendingPodConditions || [];
  }

  get scalingStrategyMultipleScalersCalculation() {
    return this.spec.scalingStrategy?.multipleScalersCalculation || MultipleScalersCalculation.MAX;
  }
}
