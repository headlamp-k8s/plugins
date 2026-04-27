import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { VolcanoJobSpec } from './job';

export type JobFlowPhase = 'Pending' | 'Running' | 'Failed' | 'Terminating' | 'Succeed' | string;

/**
 * HTTP probe dependency for a JobFlow flow step.
 * @see https://github.com/volcano-sh/volcano/blob/master/staging/src/volcano.sh/apis/pkg/apis/flow/v1alpha1/jobflow_types.go
 */
export interface JobFlowHttpGetProbe {
  /** Task name targeted by the probe. */
  taskName?: string;
  /** HTTP path to probe. */
  path?: string;
  /** Port to probe. */
  port?: number;
  /** Optional HTTP header sent with the probe. */
  httpHeader?: {
    /** Header name. */
    name: string;
    /** Header value. */
    value: string;
  };
}

/**
 * TCP probe dependency for a JobFlow flow step.
 * @see https://github.com/volcano-sh/volcano/blob/master/staging/src/volcano.sh/apis/pkg/apis/flow/v1alpha1/jobflow_types.go
 */
export interface JobFlowTcpSocketProbe {
  /** Task name targeted by the probe. */
  taskName?: string;
  /** TCP port to probe. */
  port?: number;
}

/**
 * Task status dependency for a JobFlow flow step.
 * @see https://github.com/volcano-sh/volcano/blob/master/staging/src/volcano.sh/apis/pkg/apis/flow/v1alpha1/jobflow_types.go
 */
export interface JobFlowTaskStatusProbe {
  /** Task name targeted by the dependency. */
  taskName?: string;
  /** Required task phase. */
  phase?: string;
}

/**
 * Probe configuration for a JobFlow dependency.
 * @see https://github.com/volcano-sh/volcano/blob/master/staging/src/volcano.sh/apis/pkg/apis/flow/v1alpha1/jobflow_types.go
 */
export interface JobFlowProbe {
  /** HTTP probe dependencies. */
  httpGetList?: JobFlowHttpGetProbe[];
  /** TCP probe dependencies. */
  tcpSocketList?: JobFlowTcpSocketProbe[];
  /** Task status dependencies. */
  taskStatusList?: JobFlowTaskStatusProbe[];
}

/**
 * Dependency configuration for a JobFlow flow step.
 * @see https://github.com/volcano-sh/volcano/blob/master/staging/src/volcano.sh/apis/pkg/apis/flow/v1alpha1/jobflow_types.go
 */
export interface JobFlowDependsOn {
  /** Target JobTemplate names this flow step depends on. */
  targets?: string[];
  /** Optional dependency probes. */
  probe?: JobFlowProbe;
}

/**
 * Per-flow JobTemplate override applied before creating the generated Job.
 * @see https://github.com/volcano-sh/volcano/blob/master/staging/src/volcano.sh/apis/pkg/apis/flow/v1alpha1/jobflow_types.go
 */
export interface JobFlowPatch {
  /** Volcano Job spec fields patched into the referenced JobTemplate. */
  jobSpec?: Partial<VolcanoJobSpec>;
}

/**
 * Flow step inside a Volcano JobFlow.
 * @see https://github.com/volcano-sh/volcano/blob/master/staging/src/volcano.sh/apis/pkg/apis/flow/v1alpha1/jobflow_types.go
 */
export interface JobFlowSpecEntry {
  /** JobTemplate name referenced by this flow step. */
  name: string;
  /** Dependencies that gate this flow step. */
  dependsOn?: JobFlowDependsOn;
  /** JobTemplate overrides for this flow step. */
  patch?: JobFlowPatch;
}

/**
 * Desired configuration for a Volcano JobFlow.
 * @see https://github.com/volcano-sh/volcano/blob/master/staging/src/volcano.sh/apis/pkg/apis/flow/v1alpha1/jobflow_types.go
 */
export interface VolcanoJobFlowSpec {
  /** Generated job retention policy after completion. */
  jobRetainPolicy?: 'retain' | 'delete';
  /** Ordered flow steps for this orchestration. */
  flows?: JobFlowSpecEntry[];
}

/**
 * Per-task phase counters within a JobFlow condition entry.
 * @see https://github.com/volcano-sh/volcano/blob/master/staging/src/volcano.sh/apis/pkg/apis/flow/v1alpha1/jobflow_types.go
 */
export interface JobFlowTaskStateCount {
  /** Phase counters for a task. */
  phase?: Record<string, number>;
}

/**
 * Condition-style status entry keyed by generated Job name.
 * @see https://github.com/volcano-sh/volcano/blob/master/staging/src/volcano.sh/apis/pkg/apis/flow/v1alpha1/jobflow_types.go
 */
export interface JobFlowConditionEntry {
  /** Current generated Job phase. */
  phase?: string;
  /** Creation timestamp of the generated Job. */
  createTime?: string;
  /** Running duration of the generated Job. */
  runningDuration?: string;
  /** Per-task phase counters. */
  taskStatusCount?: Record<string, JobFlowTaskStateCount>;
}

/**
 * Historical running state for a generated Job.
 * @see https://github.com/volcano-sh/volcano/blob/master/staging/src/volcano.sh/apis/pkg/apis/flow/v1alpha1/jobflow_types.go
 */
export interface JobFlowRunningHistory {
  /** Start timestamp of the recorded state. */
  startTimestamp?: string;
  /** End timestamp of the recorded state. */
  endTimestamp?: string;
  /** Recorded state name. */
  state?: string;
}

/**
 * Status entry for one generated Volcano Job.
 * @see https://github.com/volcano-sh/volcano/blob/master/staging/src/volcano.sh/apis/pkg/apis/flow/v1alpha1/jobflow_types.go
 */
export interface JobFlowJobStatus {
  /** Generated Job name. */
  name?: string;
  /** Current generated Job state. */
  state?: string;
  /** Start timestamp for the generated Job. */
  startTimestamp?: string;
  /** End timestamp for the generated Job. */
  endTimestamp?: string;
  /** Number of restarts for the generated Job. */
  restartCount?: number;
  /** Historical job running states. */
  runningHistories?: JobFlowRunningHistory[];
}

/**
 * Current JobFlow phase.
 * @see https://github.com/volcano-sh/volcano/blob/master/staging/src/volcano.sh/apis/pkg/apis/flow/v1alpha1/jobflow_types.go
 */
export interface JobFlowState {
  /** Current orchestration phase. */
  phase?: JobFlowPhase;
}

/**
 * Observed status reported for a Volcano JobFlow.
 * @see https://github.com/volcano-sh/volcano/blob/master/staging/src/volcano.sh/apis/pkg/apis/flow/v1alpha1/jobflow.go
 */
export interface VolcanoJobFlowStatus {
  /** Aggregated current JobFlow state. */
  state?: JobFlowState;
  /** Generated Jobs currently pending. */
  pendingJobs?: string[];
  /** Generated Jobs currently running. */
  runningJobs?: string[];
  /** Generated Jobs that failed. */
  failedJobs?: string[];
  /** Generated Jobs that completed. */
  completedJobs?: string[];
  /** Generated Jobs that terminated. */
  terminatedJobs?: string[];
  /** Generated Jobs in unknown state. */
  unKnowJobs?: string[];
  /** Per-generated-job status list. */
  jobStatusList?: JobFlowJobStatus[];
  /** Per-generated-job condition summaries. */
  conditions?: Record<string, JobFlowConditionEntry>;
}

/**
 * Kubernetes object wrapper for Volcano JobFlow CRDs.
 * @see https://github.com/volcano-sh/volcano/blob/master/config/crd/jobflow/bases/flow.volcano.sh_jobflows.yaml
 */
export interface KubeVolcanoJobFlow extends KubeObjectInterface {
  /** Desired JobFlow configuration. */
  spec: VolcanoJobFlowSpec;
  /** Observed orchestration status. */
  status?: VolcanoJobFlowStatus;
}

export class VolcanoJobFlow extends KubeObject<KubeVolcanoJobFlow> {
  static kind = 'JobFlow';
  static apiName = 'jobflows';
  static apiVersion = 'flow.volcano.sh/v1alpha1';
  static isNamespaced = true;

  static get detailsRoute() {
    return '/volcano/jobflows/:namespace/:name';
  }

  static getBaseObject() {
    return {
      apiVersion: 'flow.volcano.sh/v1alpha1',
      kind: 'JobFlow',
      metadata: {
        name: '',
        namespace: '',
      },
      spec: {
        jobRetainPolicy: 'retain',
        flows: [
          {
            name: 'jobtemplate-name',
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

  get phase(): JobFlowPhase {
    return this.status?.state?.phase || 'Pending';
  }

  get jobRetainPolicy(): string {
    return this.spec.jobRetainPolicy || 'retain';
  }

  get flowCount(): number {
    return this.spec.flows?.length ?? 0;
  }

  get pendingJobCount(): number {
    return this.status?.pendingJobs?.length ?? 0;
  }

  get runningJobCount(): number {
    return this.status?.runningJobs?.length ?? 0;
  }

  get failedJobCount(): number {
    return this.status?.failedJobs?.length ?? 0;
  }

  get completedJobCount(): number {
    return this.status?.completedJobs?.length ?? 0;
  }

  get terminatedJobCount(): number {
    return this.status?.terminatedJobs?.length ?? 0;
  }

  get unknownJobCount(): number {
    return this.status?.unKnowJobs?.length ?? 0;
  }
}
