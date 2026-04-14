import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';

export type QueueState = 'Open' | 'Closed' | 'Closing' | 'Unknown';

export type ResourceQuantity = string | number;

/**
 * Desired configuration for a Volcano Queue.
 * @see https://github.com/volcano-sh/apis/blob/ae35b8b12bc5ccb6ff5a62fcd9dca06234197e63/pkg/apis/scheduling/v1beta1/types.go#L459
 */
export interface QueueSpec {
  /** Relative queue weight used by the scheduler. */
  weight?: number;
  /** Maximum allocatable resources for this queue. */
  capability?: Record<string, ResourceQuantity>;
  /** Whether resources from this queue are reclaimable. */
  reclaimable?: boolean;
  /** Parent queue name for hierarchy. */
  parent?: string;
  /** Queue priority value. */
  priority?: number;
  /** Queue type (for example, deserved). */
  type?: string;
  /** Resources deserved by this queue. */
  deserved?: Record<string, ResourceQuantity>;
  /** Strategy used when dequeuing jobs. */
  dequeueStrategy?: 'fifo' | 'traverse';
  /** Guaranteed resource configuration for this queue. */
  guarantee?: {
    /** Guaranteed resources reserved for this queue. */
    resource?: Record<string, ResourceQuantity>;
  };
  /** Node-group affinity and anti-affinity preferences. */
  affinity?: {
    /** Node-group affinity rules for queue workloads. */
    nodeGroupAffinity?: {
      /** Hard-required node groups. */
      requiredDuringSchedulingIgnoredDuringExecution?: string[];
      /** Soft-preferred node groups. */
      preferredDuringSchedulingIgnoredDuringExecution?: string[];
    };
    /** Node-group anti-affinity rules for queue workloads. */
    nodeGroupAntiAffinity?: {
      /** Hard-required anti-affinity node groups. */
      requiredDuringSchedulingIgnoredDuringExecution?: string[];
      /** Soft-preferred anti-affinity node groups. */
      preferredDuringSchedulingIgnoredDuringExecution?: string[];
    };
  };
  /** Optional configuration for extended clusters. */
  extendClusters?: {
    /** Name of the extended cluster entry. */
    name?: string;
    /** Relative scheduling weight for the extended cluster. */
    weight?: number;
    /** Capacity limits for the extended cluster. */
    capacity?: Record<string, ResourceQuantity>;
  }[];
}

/**
 * Observed status for a Volcano Queue.
 * @see https://github.com/volcano-sh/apis/blob/ae35b8b12bc5ccb6ff5a62fcd9dca06234197e63/pkg/apis/scheduling/v1beta1/types.go#L388
 */
export interface QueueStatus {
  /** Current queue state. */
  state?: QueueState;
  /** Number of jobs in unknown state. */
  unknown?: number;
  /** Number of pending jobs. */
  pending?: number;
  /** Number of running jobs. */
  running?: number;
  /** Number of in-queue jobs. */
  inqueue?: number;
  /** Number of completed jobs. */
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
}

/**
 * Kubernetes object wrapper for Volcano Queue CRDs.
 * @see https://github.com/volcano-sh/apis/blob/ae35b8b12bc5ccb6ff5a62fcd9dca06234197e63/pkg/apis/scheduling/v1beta1/types.go#L354
 */
export interface KubeVolcanoQueue extends KubeObjectInterface {
  /** Desired queue configuration. */
  spec: QueueSpec;
  /** Observed queue status. */
  status?: QueueStatus;
}

export class VolcanoQueue extends KubeObject<KubeVolcanoQueue> {
  static kind = 'Queue';
  static apiName = 'queues';
  static apiVersion = 'scheduling.volcano.sh/v1beta1';
  static isNamespaced = false;

  static get detailsRoute() {
    return '/volcano/queues/:name';
  }

  static getBaseObject() {
    return {
      apiVersion: 'scheduling.volcano.sh/v1beta1',
      kind: 'Queue',
      metadata: {
        name: '',
      },
      spec: {
        weight: 1,
        reclaimable: true,
        capability: {
          cpu: '100',
          memory: '100Gi',
        },
        guarantee: {
          resource: {
            cpu: '0',
            memory: '0',
          },
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
    return this.status?.state || 'Unknown';
  }

  get weight(): number {
    return this.spec.weight ?? 1;
  }

  get priority(): number {
    return this.spec.priority ?? 0;
  }

  get dequeueStrategy(): NonNullable<QueueSpec['dequeueStrategy']> {
    return this.spec.dequeueStrategy ?? 'traverse';
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

  get reservedResources() {
    return this.status?.reservation?.resource;
  }

  get reservedNodes() {
    return this.status?.reservation?.nodes ?? [];
  }
}
