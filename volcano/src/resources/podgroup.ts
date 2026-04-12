import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';

export type PodGroupPhase = 'Pending' | 'Running' | 'Unknown' | 'Inqueue' | 'Completed';

/**
 * Condition entry for a Volcano PodGroup.
 * @see https://github.com/volcano-sh/apis/blob/ae35b8b12bc5ccb6ff5a62fcd9dca06234197e63/pkg/apis/scheduling/v1beta1/types.go#L82
 */
export interface PodGroupCondition {
  /** Condition type, when present. */
  type?: string;
  /** Kubernetes condition status value. */
  status?: 'True' | 'False' | 'Unknown';
  /** Transition identifier used by Volcano. */
  transitionID?: string;
  /** Timestamp for the last condition transition. */
  lastTransitionTime?: string;
  /** Short machine-friendly reason for this condition. */
  reason?: string;
  /** Human-readable condition message. */
  message?: string;
}

/**
 * Desired PodGroup scheduling configuration.
 * @see https://github.com/volcano-sh/apis/blob/ae35b8b12bc5ccb6ff5a62fcd9dca06234197e63/pkg/apis/scheduling/v1beta1/types.go#L173
 */
export interface PodGroupSpec {
  /** Minimum number of members required for gang scheduling. */
  minMember?: number;
  /** Per-task minimum members when task-level constraints are used. */
  minTaskMember?: Record<string, number>;
  /** Queue used by this PodGroup. */
  queue?: string;
  /** Priority class name applied to the PodGroup. */
  priorityClassName?: string;
  /** Minimum resources required before scheduling. */
  minResources?: Record<string, string | number>;
}

/**
 * Observed PodGroup status reported by Volcano.
 * @see https://github.com/volcano-sh/apis/blob/ae35b8b12bc5ccb6ff5a62fcd9dca06234197e63/pkg/apis/scheduling/v1beta1/types.go#L299
 */
export interface PodGroupStatus {
  /** Current PodGroup phase. */
  phase?: PodGroupPhase;
  /** Condition history for this PodGroup. */
  conditions?: PodGroupCondition[];
  /** Number of running pods in this PodGroup. */
  running?: number;
  /** Number of succeeded pods in this PodGroup. */
  succeeded?: number;
  /** Number of failed pods in this PodGroup. */
  failed?: number;
}

/**
 * Kubernetes object wrapper for Volcano PodGroup CRDs.
 * @see https://github.com/volcano-sh/apis/blob/ae35b8b12bc5ccb6ff5a62fcd9dca06234197e63/pkg/apis/scheduling/v1beta1/types.go#L155
 */
export interface KubeVolcanoPodGroup extends KubeObjectInterface {
  /** Desired PodGroup configuration. */
  spec: PodGroupSpec;
  /** Observed PodGroup status. */
  status?: PodGroupStatus;
}

export class VolcanoPodGroup extends KubeObject<KubeVolcanoPodGroup> {
  static kind = 'PodGroup';
  static apiName = 'podgroups';
  static apiVersion = 'scheduling.volcano.sh/v1beta1';
  static isNamespaced = true;

  static get detailsRoute() {
    return '/volcano/podgroups/:namespace/:name';
  }

  static getBaseObject() {
    return {
      apiVersion: 'scheduling.volcano.sh/v1beta1',
      kind: 'PodGroup',
      metadata: {
        name: '',
        namespace: '',
      },
      spec: {
        queue: 'default',
        minMember: 1,
      },
    };
  }

  get spec() {
    return this.jsonData.spec;
  }

  get status() {
    return this.jsonData.status;
  }

  get phase(): PodGroupPhase {
    return this.status?.phase || 'Pending';
  }

  get queue(): string {
    return this.spec.queue || 'default';
  }

  get minMember(): number {
    return this.spec.minMember || 0;
  }

  get minTaskMember(): PodGroupSpec['minTaskMember'] {
    return this.spec.minTaskMember;
  }

  get runningCount(): number {
    return this.status?.running || 0;
  }

  get succeededCount(): number {
    return this.status?.succeeded || 0;
  }

  get failedCount(): number {
    return this.status?.failed || 0;
  }
}
