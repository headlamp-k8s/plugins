import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { kueueApiVersions } from '../utils/kueueApi';
import { kueueRoutePaths } from '../utils/kueueRoutes';

export interface PodSetFlavor {
  [key: string]: string;
}

export interface PodSetResource {
  name: string;
  requests?: Record<string, string>;
}

export interface PodSet {
  count: number;
  name: string;
  template: {
    spec: {
      containers: Array<{
        name: string;
        image?: string;
        resources?: {
          requests?: Record<string, string>;
          limits?: Record<string, string>;
        };
      }>;
      initContainers?: Array<{
        name: string;
        image?: string;
        resources?: {
          requests?: Record<string, string>;
          limits?: Record<string, string>;
        };
      }>;
    };
  };
}

export interface WorkloadSpec {
  active?: boolean;
  queueName?: string;
  podSets?: PodSet[];
  priorityClassName?: string;
  priority?: number;
}

export interface WorkloadCondition {
  type: string;
  status: 'True' | 'False' | 'Unknown';
  reason?: string;
  message?: string;
  lastTransitionTime?: string;
}

export interface Admission {
  clusterQueue: string;
  podSetFlavors?: Array<{
    name: string;
    flavors?: Record<string, string>;
  }>;
}

export interface WorkloadStatus {
  conditions?: WorkloadCondition[];
  admission?: Admission;
}

export interface KubeWorkload extends KubeObjectInterface {
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
    return this.spec.queueName ?? '-';
  }

  get priority(): number {
    return this.spec.priority ?? 0;
  }

  get priorityClassName(): string {
    return this.spec.priorityClassName ?? '-';
  }

  get isActive(): boolean {
    return this.spec.active !== false; // defaults to true if omitted
  }

  get conditions(): WorkloadCondition[] {
    return this.status.conditions ?? [];
  }

  get admission(): Admission | undefined {
    return this.status.admission;
  }

  get statusMessage(): string {
    const finishedCond = this.conditions.find(c => c.type === 'Finished');
    if (finishedCond?.status === 'True') {
      return 'Finished';
    }

    const admittedCond = this.conditions.find(c => c.type === 'Admitted');
    if (admittedCond?.status === 'True') {
      return 'Admitted';
    }

    const evictedCond = this.conditions.find(c => c.type === 'Evicted');
    if (evictedCond?.status === 'True') {
      return `Evicted (${evictedCond.reason ?? 'Unknown'})`;
    }

    return 'Pending';
  }

  get podSets(): PodSet[] {
    return this.spec.podSets ?? [];
  }
}
