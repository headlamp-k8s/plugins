import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';

/**
 * Task definition inside a Volcano Job spec.
 * @see https://github.com/volcano-sh/apis/blob/ae35b8b12bc5ccb6ff5a62fcd9dca06234197e63/pkg/apis/batch/v1alpha1/job.go#L239
 */
export interface TaskSpec {
  /** Task name. */
  name: string;
  /** Number of pods requested for this task. */
  replicas: number;
  /** Minimum available pods required for this task. */
  minAvailable?: number;
  /** Maximum retries before marking this task failed. */
  maxRetry?: number;
  /** Task dependency configuration for scheduling order. */
  dependsOn?: {
    /** Names of tasks this task depends on. */
    name: string[];
    /** Dependency strategy when multiple tasks are listed. */
    iteration?: 'any' | 'all';
  };
  /** Pod template used to create task replicas. */
  template: {
    /** Pod spec for the task template. */
    spec: {
      /** Container templates for task pods. */
      containers: {
        /** Container name. */
        name: string;
        /** Container image reference. */
        image: string;
        /** Optional command override. */
        command?: string[];
        /** Optional resource requests and limits. */
        resources?: Record<string, unknown>;
      }[];
      /** Pod restart policy for this task template. */
      restartPolicy?: string;
    };
  };
  /** Lifecycle policies scoped to this task. */
  policies?: LifecyclePolicy[];
}

/**
 * Lifecycle action policy for Volcano Jobs and Tasks.
 * @see https://github.com/volcano-sh/apis/blob/ae35b8b12bc5ccb6ff5a62fcd9dca06234197e63/pkg/apis/batch/v1alpha1/job.go#L199
 */
export interface LifecyclePolicy {
  /** Action taken when the policy is triggered. */
  action?: string;
  /** Single scheduler/controller event trigger. */
  event?: string;
  /** Multiple scheduler/controller event triggers. */
  events?: string[];
  /** Exit code trigger for policy activation. */
  exitCode?: number;
  /** Delay before applying the policy action. */
  timeout?: string;
}

/**
 * Volume settings for Volcano Job task templates.
 * @see https://github.com/volcano-sh/apis/blob/ae35b8b12bc5ccb6ff5a62fcd9dca06234197e63/pkg/apis/batch/v1alpha1/job.go#L161
 */
export interface VolumeSpec {
  /** Container mount path for the volume. */
  mountPath: string;
  /** Name of an existing PersistentVolumeClaim to mount. */
  volumeClaimName?: string;
  /** Inline PVC template spec. */
  volumeClaim?: Record<string, unknown>;
}

/**
 * Desired configuration for a Volcano Job.
 * @see https://github.com/volcano-sh/apis/blob/ae35b8b12bc5ccb6ff5a62fcd9dca06234197e63/pkg/apis/batch/v1alpha1/job.go#L54
 */
export interface VolcanoJobSpec {
  /** Default scheduler assigned to task pod templates. */
  schedulerName?: string;
  /** Minimum available pods required to run the job. */
  minAvailable?: number;
  /** Minimum successful pods required for job success. */
  minSuccess?: number;
  /** Volcano queue name. */
  queue?: string;
  /** Maximum retries before marking the job failed. */
  maxRetry?: number;
  /** Time-to-live in seconds after job completion. */
  ttlSecondsAfterFinished?: number;
  /** Priority class for job pods. */
  priorityClassName?: string;
  /** User-provided running duration estimate. */
  runningEstimate?: string;
  /** Task definitions for this job. */
  tasks?: TaskSpec[];
  /** Job-level lifecycle policies. */
  policies?: LifecyclePolicy[];
  /** Volcano scheduler plugins and their arguments. */
  plugins?: Record<string, string[]>;
  /** Volumes mounted by tasks in this job. */
  volumes?: VolumeSpec[];
}

export type JobPhase =
  | 'Pending'
  | 'Aborting'
  | 'Aborted'
  | 'Running'
  | 'Restarting'
  | 'Completing'
  | 'Completed'
  | 'Terminating'
  | 'Terminated'
  | 'Failed';

/**
 * Current state details for a Volcano Job.
 * @see https://github.com/volcano-sh/apis/blob/ae35b8b12bc5ccb6ff5a62fcd9dca06234197e63/pkg/apis/batch/v1alpha1/job.go#L333
 */
export interface JobState {
  /** Current job lifecycle phase. */
  phase: JobPhase;
  /** Short machine-friendly reason for this state. */
  reason?: string;
  /** Human-readable description for this state. */
  message?: string;
  /** Timestamp for the last state transition. */
  lastTransitionTime?: string;
}

/**
 * Condition entry describing a Volcano Job transition.
 * @see https://github.com/volcano-sh/apis/blob/ae35b8b12bc5ccb6ff5a62fcd9dca06234197e63/pkg/apis/batch/v1alpha1/job.go#L442-L447
 */
export interface JobCondition {
  /** Condition type, when present. */
  type?: string;
  /** Volcano job phase. */
  status: JobPhase;
  /** Timestamp for the last condition transition. */
  lastTransitionTime?: string;
  /** Short machine-friendly reason for this condition. */
  reason?: string;
  /** Human-readable condition message. */
  message?: string;
}

/**
 * Observed status reported for a Volcano Job.
 * @see https://github.com/volcano-sh/apis/blob/ae35b8b12bc5ccb6ff5a62fcd9dca06234197e63/pkg/apis/batch/v1alpha1/job.go#L360
 */
export interface VolcanoJobStatus {
  /** Aggregated current state object. */
  state?: JobState;
  /** Current minimum available pod requirement in status. */
  minAvailable?: number;
  /** Number of pending pods. */
  pending?: number;
  /** Number of running pods. */
  running?: number;
  /** Number of succeeded pods. */
  succeeded?: number;
  /** Number of failed pods. */
  failed?: number;
  /** Number of terminating pods. */
  terminating?: number;
  /** Number of pods in unknown phase. */
  unknown?: number;
  /** Number of retries attempted by the job. */
  retryCount?: number;
  /** Internal job status version. */
  version?: number;
  /** Duration from running to completion, when available. */
  runningDuration?: string;
  /** Resources created and controlled by this job. */
  controlledResources?: Record<string, string>;
  /** Per-task pod phase counters. */
  taskStatusCount?: Record<string, Record<string, number>>;
  /** Condition history for job transitions. */
  conditions?: JobCondition[];
}

/**
 * Kubernetes object wrapper for Volcano Job CRDs.
 * @see https://github.com/volcano-sh/apis/blob/ae35b8b12bc5ccb6ff5a62fcd9dca06234197e63/pkg/apis/batch/v1alpha1/job.go#L38
 */
export interface KubeVolcanoJob extends KubeObjectInterface {
  /** Desired job configuration. */
  spec: VolcanoJobSpec;
  /** Observed runtime status. */
  status?: VolcanoJobStatus;
}

export class VolcanoJob extends KubeObject<KubeVolcanoJob> {
  static kind = 'VolcanoJob';
  static apiName = 'jobs';
  static apiVersion = 'batch.volcano.sh/v1alpha1';
  static isNamespaced = true;

  static get detailsRoute() {
    return '/volcano/jobs/:namespace/:name';
  }

  static getBaseObject() {
    return {
      apiVersion: 'batch.volcano.sh/v1alpha1',
      kind: 'Job',
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

  get phase(): JobPhase {
    return this.status?.state?.phase || 'Pending';
  }

  get queue(): string {
    return this.spec.queue || 'default';
  }

  get minAvailable(): number {
    return this.spec.minAvailable || 0;
  }

  get runningCount(): number {
    return this.status?.running || 0;
  }

  get taskCount(): number {
    return this.spec.tasks?.length || 0;
  }
}
