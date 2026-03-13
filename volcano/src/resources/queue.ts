import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';

export type QueueState = 'Open' | 'Closed' | 'Closing' | 'Unknown';

export type ResourceQuantity = string | number;

export interface QueueSpec {
  weight?: number;
  capability?: Record<string, ResourceQuantity>;
  reclaimable?: boolean;
  parent?: string;
  priority?: number;
  type?: string;
  deserved?: Record<string, ResourceQuantity>;
  dequeueStrategy?: 'fifo' | 'traverse';
  guarantee?: {
    resource?: Record<string, ResourceQuantity>;
  };
  affinity?: {
    nodeGroupAffinity?: {
      requiredDuringSchedulingIgnoredDuringExecution?: string[];
      preferredDuringSchedulingIgnoredDuringExecution?: string[];
    };
    nodeGroupAntiAffinity?: {
      requiredDuringSchedulingIgnoredDuringExecution?: string[];
      preferredDuringSchedulingIgnoredDuringExecution?: string[];
    };
  };
  extendClusters?: {
    name?: string;
    weight?: number;
    capacity?: Record<string, ResourceQuantity>;
  }[];
}

export interface QueueStatus {
  state?: QueueState;
  unknown?: number;
  pending?: number;
  running?: number;
  inqueue?: number;
  completed?: number;
  allocated?: Record<string, ResourceQuantity>;
  reservation?: {
    nodes?: string[];
    resource?: Record<string, ResourceQuantity>;
  };
}

export interface KubeVolcanoQueue extends KubeObjectInterface {
  spec: QueueSpec;
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
    return this.spec.weight || 1;
  }
}
