import { K8s } from '@kinvolk/headlamp-plugin/lib';
import type { KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { kueueApiVersions } from '../utils/kueueApi';
import { kueueRoutePaths } from '../utils/kueueRoutes';
import type { KueueCondition, ResourceQuantity } from './clusterQueue';

const KubeObject = K8s.cluster.KubeObject;

/**
 * Pod set defined in a Kueue Workload spec.
 *
 * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#podset
 */
export interface PodSet {
  /** PodSet identifier, for example `main` or `workers`. */
  name: string;
  /** Number of pods in the pod set. */
  count: number;
}

/**
 * Quotas allocated to a PodSet upon admission.
 *
 * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#podsetassignment
 */
export interface PodSetAssignment {
  /** Name of the PodSet assigned. */
  name: string;
  /** ResourceFlavor names assigned for each resource. */
  flavors?: Record<string, string>;
  /** Total resources requested by this PodSet. */
  resourceUsage?: Record<string, ResourceQuantity>;
}

/**
 * Admission decision details recorded in Workload status.
 *
 * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#admission
 */
export interface Admission {
  /** ClusterQueue that admitted this Workload. */
  clusterQueue: string;
  /** Per-PodSet flavor and resource allocations. */
  podSetAssignments?: PodSetAssignment[];
}

/**
 * Desired state of a Kueue Workload.
 *
 * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#workloadspec
 */
export interface WorkloadSpec {
  /** LocalQueue name where the Workload was submitted. */
  queueName?: string;
  /** Whether the Workload is active for admission. */
  active?: boolean;
  /** Priority class name controlling queuing order. */
  priorityClassName?: string;
  /** Numeric priority value evaluated by Kueue. */
  priority?: number;
  /** Pod sets wrapped by this Workload. */
  podSets?: PodSet[];
}

/**
 * Observed state of a Kueue Workload.
 *
 * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#workloadstatus
 */
export interface WorkloadStatus {
  /** Admission information if the Workload has been admitted. */
  admission?: Admission;
  /** Conditions observing Workload lifecycle states. */
  conditions?: KueueCondition[];
}

/**
 * Kubernetes Workload object returned by the Kueue API.
 *
 * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#workload
 */
export interface KubeWorkload extends KubeObjectInterface {
  metadata: KubeObjectInterface['metadata'];
  spec?: WorkloadSpec;
  status?: WorkloadStatus;
}

export class Workload extends KubeObject<KubeWorkload> {
  static kind = 'Workload';
  static apiName = 'workloads';
  static apiVersion = kueueApiVersions;
  static isNamespaced = true;

  static get detailsRoute() {
    return kueueRoutePaths.workloadDetail;
  }

  get spec(): WorkloadSpec {
    return this.jsonData.spec ?? {};
  }

  get status(): WorkloadStatus {
    return this.jsonData.status ?? {};
  }

  get queueName(): string {
    return this.spec.queueName || '-';
  }

  get priority(): number | string {
    return this.spec.priority ?? '-';
  }

  get priorityClassName(): string {
    return this.spec.priorityClassName || '-';
  }

  get podSets(): PodSet[] {
    return this.spec.podSets || [];
  }

  get conditions(): KueueCondition[] {
    return this.status.conditions || [];
  }

  get admission(): Admission | undefined {
    return this.status.admission;
  }

  get clusterQueueName(): string {
    return this.admission?.clusterQueue || '-';
  }

  get isAdmitted(): boolean {
    return (
      this.conditions.some(c => c.type === 'Admitted' && c.status === 'True') ||
      Boolean(this.admission)
    );
  }

  get isFinished(): boolean {
    return this.conditions.some(c => c.type === 'Finished' && c.status === 'True');
  }

  get isEvicted(): boolean {
    return this.conditions.some(c => c.type === 'Evicted' && c.status === 'True');
  }

  get isQuotaReserved(): boolean {
    return this.conditions.some(c => c.type === 'QuotaReserved' && c.status === 'True');
  }

  get statusLabel(): 'Admitted' | 'Finished' | 'Evicted' | 'Pending' {
    if (this.isFinished) return 'Finished';
    if (this.isEvicted) return 'Evicted';
    if (this.isAdmitted) return 'Admitted';
    return 'Pending';
  }
}
