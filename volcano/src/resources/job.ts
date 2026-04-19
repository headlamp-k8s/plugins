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
  template: PodTemplateSpec;
  /** Lifecycle policies scoped to this task. */
  policies?: LifecyclePolicy[];
  /** Topology policy for NUMA-aware scheduling. */
  topologyPolicy?: string;
}

/**
 * Pod template metadata used by a Volcano task.
 * @see https://github.com/volcano-sh/apis/blob/ae35b8b12bc5ccb6ff5a62fcd9dca06234197e63/pkg/apis/batch/v1alpha1/job.go#L239
 * @see https://github.com/kubernetes/api/blob/2b6c3c950fc28eddbbb7b9f98633b3be3dba97b0/core/v1/types.go#L5548
 */
export interface PodTemplateMetadata {
  /** Labels applied to task pods. */
  labels?: Record<string, string>;
  /** Annotations applied to task pods. */
  annotations?: Record<string, string>;
  /** Template creation timestamp when present in the resource payload. */
  creationTimestamp?: string;
}

/**
 * Environment variable specification for a container.
 * @see https://github.com/volcano-sh/apis/blob/ae35b8b12bc5ccb6ff5a62fcd9dca06234197e63/pkg/apis/batch/v1alpha1/job.go#L239
 * @see https://github.com/kubernetes/api/blob/2b6c3c950fc28eddbbb7b9f98633b3be3dba97b0/core/v1/types.go#L2473
 */
export interface EnvVarSpec {
  /** Environment variable name. */
  name: string;
  /** Literal value for the variable. */
  value?: string;
  /** Value source reference when value is not literal. */
  valueFrom?: Record<string, unknown>;
}

/**
 * Exposed container port definition.
 * @see https://github.com/volcano-sh/apis/blob/ae35b8b12bc5ccb6ff5a62fcd9dca06234197e63/pkg/apis/batch/v1alpha1/job.go#L239
 * @see https://github.com/kubernetes/api/blob/2b6c3c950fc28eddbbb7b9f98633b3be3dba97b0/core/v1/types.go#L2352
 */
export interface ContainerPortSpec {
  /** Container port number. */
  containerPort?: number;
  /** Optional port name. */
  name?: string;
  /** Port protocol (TCP/UDP/SCTP). */
  protocol?: string;
}

/**
 * Kubernetes resource requirements for a container.
 * @see https://github.com/volcano-sh/apis/blob/ae35b8b12bc5ccb6ff5a62fcd9dca06234197e63/pkg/apis/batch/v1alpha1/job.go#L239
 * @see https://github.com/kubernetes/api/blob/2b6c3c950fc28eddbbb7b9f98633b3be3dba97b0/core/v1/types.go#L2841
 */
export interface ContainerResourceRequirements {
  /** Resource limits map. */
  limits?: Record<string, string>;
  /** Resource requests map. */
  requests?: Record<string, string>;
}

/**
 * Container specification used in a task pod template.
 * @see https://github.com/volcano-sh/apis/blob/ae35b8b12bc5ccb6ff5a62fcd9dca06234197e63/pkg/apis/batch/v1alpha1/job.go#L239
 * @see https://github.com/kubernetes/api/blob/2b6c3c950fc28eddbbb7b9f98633b3be3dba97b0/core/v1/types.go#L2909
 */
export interface ContainerSpec {
  /** Container name. */
  name: string;
  /** Container image reference. */
  image: string;
  /** Optional image pull policy. */
  imagePullPolicy?: string;
  /** Optional command override. */
  command?: string[];
  /** Optional arguments passed to the container entrypoint. */
  args?: string[];
  /** Optional working directory in the container. */
  workingDir?: string;
  /** Optional container environment variables. */
  env?: EnvVarSpec[];
  /** Optional declared container ports. */
  ports?: ContainerPortSpec[];
  /** Optional resource requests and limits. */
  resources?: ContainerResourceRequirements;
}

/**
 * Pod template spec used by a Volcano task.
 * @see https://github.com/volcano-sh/apis/blob/ae35b8b12bc5ccb6ff5a62fcd9dca06234197e63/pkg/apis/batch/v1alpha1/job.go#L239
 * @see https://github.com/kubernetes/api/blob/2b6c3c950fc28eddbbb7b9f98633b3be3dba97b0/core/v1/types.go#L5548
 */
export interface PodTemplateSpec {
  /** Optional pod template metadata. */
  metadata?: PodTemplateMetadata;
  /** Pod spec for the task template. */
  spec?: {
    /** Container templates for task pods. */
    containers?: ContainerSpec[];
    /** Secrets used for pulling images. */
    imagePullSecrets?: Array<{ name?: string }>;
    /** Pod restart policy for this task template. */
    restartPolicy?: string;
    /** Scheduler name for task pods. */
    schedulerName?: string;
  };
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

const volcanoJobTypeLabel = 'volcano.sh/job-type';

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
  /** Volcano job phase. */
  status: JobPhase;
  /** Timestamp for the last condition transition. */
  lastTransitionTime?: string;
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
  taskStatusCount?: Record<string, { phase?: Record<string, number> }>;
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
    return this.status?.minAvailable ?? this.spec.minAvailable ?? 0;
  }

  get runningCount(): number {
    return this.status?.running || 0;
  }

  get pendingCount(): number {
    return this.status?.pending || 0;
  }

  get succeededCount(): number {
    return this.status?.succeeded || 0;
  }

  get failedCount(): number {
    return this.status?.failed || 0;
  }

  get unknownCount(): number {
    return this.status?.unknown || 0;
  }

  get retryCount(): number {
    return this.status?.retryCount || 0;
  }

  get replicaCount(): number {
    return this.spec.tasks?.reduce((total, task) => total + task.replicas, 0) ?? 0;
  }

  get jobType(): string {
    return this.metadata.labels?.[volcanoJobTypeLabel] || 'Batch';
  }

  get taskCount(): number {
    return this.spec.tasks?.length || 0;
  }
}
