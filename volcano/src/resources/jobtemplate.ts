import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { LifecyclePolicy, TaskSpec } from './job';

/**
 * Network topology scheduling settings for a Volcano JobTemplate.
 * @see https://github.com/volcano-sh/volcano/blob/master/staging/src/volcano.sh/apis/pkg/apis/flow/v1alpha1/jobtemplate_types.go
 */
export interface JobTemplateNetworkTopology {
  /** Scheduling mode for topology-aware placement. */
  mode?: 'hard' | 'soft';
  /** Highest tier allowed during topology-aware placement. */
  highestTierAllowed?: number;
}

/**
 * Desired configuration for a Volcano JobTemplate.
 * @see https://github.com/volcano-sh/volcano/blob/master/staging/src/volcano.sh/apis/pkg/apis/flow/v1alpha1/jobtemplate_types.go
 */
export interface VolcanoJobTemplateSpec {
  /** Default scheduler assigned to generated Jobs. */
  schedulerName?: string;
  /** Minimum available pods required to run the generated Job. */
  minAvailable?: number;
  /** Minimum successful pods required for generated Job success. */
  minSuccess?: number;
  /** Volcano queue name. */
  queue?: string;
  /** Maximum retries before marking the generated Job failed. */
  maxRetry?: number;
  /** Priority class for generated Job pods. */
  priorityClassName?: string;
  /** User-provided running duration estimate. */
  runningEstimate?: string;
  /** Volcano scheduler plugins and their arguments. */
  plugins?: Record<string, string[]>;
  /** Job-level lifecycle policies. */
  policies?: LifecyclePolicy[];
  /** Task definitions for the generated Job. */
  tasks?: TaskSpec[];
  /** Network topology constraints. */
  networkTopology?: JobTemplateNetworkTopology;
}

/**
 * Observed status reported for a Volcano JobTemplate.
 * @see https://github.com/volcano-sh/volcano/blob/master/staging/src/volcano.sh/apis/pkg/apis/flow/v1alpha1/jobtemplate_types.go
 */
export interface VolcanoJobTemplateStatus {
  /** Generated Jobs created from this template. */
  jobDependsOnList?: string[];
}

/**
 * Kubernetes object wrapper for Volcano JobTemplate CRDs.
 * @see https://github.com/volcano-sh/volcano/blob/master/config/crd/jobflow/bases/flow.volcano.sh_jobtemplates.yaml
 */
export interface KubeVolcanoJobTemplate extends KubeObjectInterface {
  /** Desired JobTemplate configuration. */
  spec: VolcanoJobTemplateSpec;
  /** Observed JobTemplate status. */
  status?: VolcanoJobTemplateStatus;
}

export class VolcanoJobTemplate extends KubeObject<KubeVolcanoJobTemplate> {
  static kind = 'JobTemplate';
  static apiName = 'jobtemplates';
  static apiVersion = 'flow.volcano.sh/v1alpha1';
  static isNamespaced = true;

  static get detailsRoute() {
    return '/volcano/jobtemplates/:namespace/:name';
  }

  static getBaseObject() {
    return {
      apiVersion: 'flow.volcano.sh/v1alpha1',
      kind: 'JobTemplate',
      metadata: {
        name: '',
        namespace: '',
      },
      spec: {
        schedulerName: 'volcano',
        minAvailable: 1,
        queue: 'default',
        tasks: [
          {
            replicas: 1,
            name: 'task',
            template: {
              spec: {
                containers: [
                  {
                    name: 'container',
                    image: '',
                  },
                ],
                restartPolicy: 'Never',
              },
            },
          },
        ],
      },
    };
  }

  get spec() {
    return this.jsonData.spec;
  }

  get status() {
    return this.jsonData.status;
  }

  get queue(): string {
    return this.spec.queue || 'default';
  }

  get schedulerName(): string {
    return this.spec.schedulerName || 'volcano';
  }

  get minAvailable(): number {
    return this.spec.minAvailable ?? 0;
  }

  get minSuccess(): string | number {
    return this.spec.minSuccess ?? '-';
  }

  get maxRetry(): number {
    return this.spec.maxRetry ?? 3;
  }

  get taskCount(): number {
    return this.spec.tasks?.length ?? 0;
  }

  get generatedJobNames(): string[] {
    return this.status?.jobDependsOnList ?? [];
  }

  get generatedJobCount(): number {
    return this.generatedJobNames.length;
  }
}
