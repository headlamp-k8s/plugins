import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { KubeflowResourceCondition } from './common';
import { getKatibMetricValue, KatibMetric, KatibMetricStrategy } from './katibMetric';

/**
 * Objective configuration declared on a Katib Trial resource.
 */
export interface KatibTrialSpec {
  objective?: {
    type?: string;
    goal?: number;
    objectiveMetricName?: string;
    metricStrategies?: KatibMetricStrategy[];
  };
  [key: string]: unknown;
}

/**
 * Observed status fields exposed by a Katib Trial resource.
 */
export interface KatibTrialStatus {
  conditions?: KubeflowResourceCondition[];
  observation?: {
    metrics?: KatibMetric[];
  };
  startTime?: string;
  completionTime?: string;
  [key: string]: unknown;
}

/**
 * Raw Katib Trial custom resource shape consumed by the UI.
 */
export interface KatibTrial extends KubeObjectInterface {
  spec?: KatibTrialSpec;
  status?: KatibTrialStatus;
}

/**
 * Headlamp resource class for the Katib Trial CRD (kubeflow.org/v1beta1).
 */
export class KatibTrialClass extends KubeObject<KatibTrial> {
  static apiVersion = 'kubeflow.org/v1beta1';
  static kind = 'Trial';
  static apiName = 'trials';
  static isNamespaced = true;

  static get detailsRoute() {
    return '/kubeflow/katib/trials/:namespace/:name';
  }

  get spec(): KatibTrialSpec {
    return this.jsonData.spec ?? {};
  }

  get status(): KatibTrialStatus {
    return this.jsonData.status ?? {};
  }

  get conditions(): KubeflowResourceCondition[] {
    return this.status.conditions ?? [];
  }

  get latestCondition(): KubeflowResourceCondition | null {
    return this.conditions[this.conditions.length - 1] ?? null;
  }

  get ownerExperiment(): string {
    const refs = this.metadata.ownerReferences ?? [];
    const exp = refs.find(ref => ref.kind === 'Experiment');
    if (exp?.name) {
      return exp.name;
    }
    const labels = this.metadata.labels ?? {};
    return (
      labels['katib.kubeflow.org/experiment'] || labels['katib.kubeflow.org/experiment-name'] || ''
    );
  }

  get objectiveMetricValue(): string {
    const objective = this.spec.objective;
    const metrics = this.status.observation?.metrics ?? [];
    const metric = objective?.objectiveMetricName
      ? metrics.find(item => item.name === objective.objectiveMetricName)
      : metrics[0];
    return getKatibMetricValue(metric, objective);
  }

  get failureReason(): string {
    const failed = this.conditions.find(condition => {
      return condition.type === 'Failed' && condition.status === 'True';
    });
    return failed?.reason ?? this.latestCondition?.reason ?? '';
  }

  get startTime(): string {
    return this.status.startTime ?? '';
  }

  get completionTime(): string {
    return this.status.completionTime ?? '';
  }
}
