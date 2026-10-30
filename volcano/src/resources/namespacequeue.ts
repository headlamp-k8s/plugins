import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import {
  getNamespaceQueueDequeueStrategy,
  getNamespaceQueueState,
  isNamespaceQueueReclaimable,
} from '../utils/namespaceQueue';
import { volcanoSchedulingApiVersion } from '../utils/volcanoApi';
import { volcanoRoutePaths } from '../utils/volcanoRoutes';
import { QueueState, ResourceQuantity } from './queue';

/**
 * Desired configuration for a Volcano NamespaceQueue.
 * @see https://github.com/volcano-sh/apis/blob/b23679438079d996d26dfc686bab05d43e8baf7f/pkg/apis/scheduling/v1beta1/types.go#L435
 */
export interface NamespaceQueueSpec {
  /**
   * Parent queue reference. `cluster/<name>` refers to a cluster Queue, and an unprefixed
   * value refers to another NamespaceQueue in the same namespace.
   */
  parent?: string;
  /** Maximum resources this NamespaceQueue may consume. */
  capability?: Record<string, ResourceQuantity>;
  /** Whether workloads in this NamespaceQueue may be reclaimed. */
  reclaimable?: boolean;
  /** Guaranteed resource configuration for this NamespaceQueue. */
  guarantee?: {
    /** Guaranteed resources reserved for this NamespaceQueue and its descendants. */
    resource?: Record<string, ResourceQuantity>;
  };
  /** Fair-share resource entitlement for this NamespaceQueue. */
  deserved?: Record<string, ResourceQuantity>;
  /** Queue priority value. */
  priority?: number;
  /** Strategy used when traversing descendants to dequeue work. */
  dequeueStrategy?: 'fifo' | 'traverse';
}

/**
 * Condition entry describing a NamespaceQueue transition.
 * @see https://github.com/volcano-sh/apis/blob/b23679438079d996d26dfc686bab05d43e8baf7f/pkg/apis/scheduling/v1beta1/types.go#L474
 */
export interface NamespaceQueueCondition {
  /** Condition type. */
  type: string;
  /** Condition status (`True`, `False` or `Unknown`). */
  status: string;
  /** Short machine-friendly reason for the last transition. */
  reason?: string;
  /** Human-readable description of the last transition. */
  message?: string;
  /** Timestamp for the last condition transition. */
  lastTransitionTime?: string;
}

/**
 * Observed status for a Volcano NamespaceQueue.
 * @see https://github.com/volcano-sh/apis/blob/b23679438079d996d26dfc686bab05d43e8baf7f/pkg/apis/scheduling/v1beta1/types.go#L474
 */
export interface NamespaceQueueStatus {
  /** Current queue state. Empty until the NamespaceQueue controller reports it. */
  state?: QueueState;
  /** Number of PodGroups in unknown phase. */
  unknown?: number;
  /** Number of pending PodGroups. */
  pending?: number;
  /** Number of running PodGroups. */
  running?: number;
  /** Number of in-queue PodGroups. */
  inqueue?: number;
  /** Number of completed PodGroups. */
  completed?: number;
  /** Currently allocated resources. */
  allocated?: Record<string, ResourceQuantity>;
  /** Queue reservation details, when present. */
  reservation?: {
    /** Reserved node names. */
    nodes?: string[];
    /** Reserved resources. */
    resource?: Record<string, ResourceQuantity>;
  };
  /** Authorization and scheduling readiness conditions. */
  conditions?: NamespaceQueueCondition[];
}

/**
 * Kubernetes object wrapper for Volcano NamespaceQueue CRDs.
 * @see https://github.com/volcano-sh/apis/blob/b23679438079d996d26dfc686bab05d43e8baf7f/pkg/apis/scheduling/v1beta1/types.go#L417
 */
export interface KubeVolcanoNamespaceQueue extends KubeObjectInterface {
  /** Desired NamespaceQueue configuration. */
  spec: NamespaceQueueSpec;
  /** Observed NamespaceQueue status. */
  status?: NamespaceQueueStatus;
}

export class VolcanoNamespaceQueue extends KubeObject<KubeVolcanoNamespaceQueue> {
  static kind = 'NamespaceQueue';
  static apiName = 'namespacequeues';
  static apiVersion = volcanoSchedulingApiVersion;
  static isNamespaced = true;

  static get detailsRoute() {
    return volcanoRoutePaths.namespaceQueueDetail;
  }

  static getBaseObject() {
    return {
      apiVersion: volcanoSchedulingApiVersion,
      kind: 'NamespaceQueue',
      metadata: {
        name: '',
        namespace: '',
      },
      spec: {
        parent: 'cluster/default',
        reclaimable: true,
        capability: {
          cpu: '2',
          memory: '4Gi',
        },
      },
    };
  }

  get spec() {
    return this.jsonData.spec;
  }

  get status() {
    return this.jsonData.status;
  }

  get state(): QueueState {
    return getNamespaceQueueState(this.status?.state);
  }

  get priority(): number {
    return this.spec.priority ?? 0;
  }

  get reclaimable(): boolean {
    return isNamespaceQueueReclaimable(this.spec.reclaimable);
  }

  get dequeueStrategy(): NonNullable<NamespaceQueueSpec['dequeueStrategy']> {
    return getNamespaceQueueDequeueStrategy(this.spec.dequeueStrategy);
  }

  get inqueue(): number {
    return this.status?.inqueue ?? 0;
  }

  get pending(): number {
    return this.status?.pending ?? 0;
  }

  get running(): number {
    return this.status?.running ?? 0;
  }

  get unknown(): number {
    return this.status?.unknown ?? 0;
  }

  get completed(): number {
    return this.status?.completed ?? 0;
  }

  get guaranteedResources() {
    return this.spec.guarantee?.resource;
  }

  get deservedResources() {
    return this.spec.deserved;
  }

  get allocatedResources() {
    return this.status?.allocated;
  }

  get reservedResources() {
    return this.status?.reservation?.resource;
  }

  get reservedNodes() {
    return this.status?.reservation?.nodes ?? [];
  }
}
