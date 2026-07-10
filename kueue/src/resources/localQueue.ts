import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { kueueApiVersions } from '../utils/kueueApi';
import { kueueRoutePaths } from '../utils/kueueRoutes';

export interface LocalQueueSpec {
  clusterQueue?: string;
}

export interface LocalQueueCondition {
  type: string;
  status: 'True' | 'False' | 'Unknown';
  reason?: string;
  message?: string;
  lastTransitionTime?: string;
}

export interface LocalQueueFlavorUsage {
  name: string;
  resources: Array<{
    name: string;
    total: string;
  }>;
}

export interface LocalQueueStatus {
  pendingWorkloads?: number;
  admittedWorkloads?: number;
  conditions?: LocalQueueCondition[];
  flavorUsage?: LocalQueueFlavorUsage[];
}

export interface KubeLocalQueue extends KubeObjectInterface {
  spec?: LocalQueueSpec;
  status?: LocalQueueStatus;
}

export class LocalQueue extends KubeObject<KubeLocalQueue> {
  static kind = 'LocalQueue';
  static apiName = 'localqueues';
  static apiVersion = kueueApiVersions;
  static isNamespaced = true;

  static get detailsRoute() {
    return kueueRoutePaths.localQueueDetail;
  }

  get spec(): LocalQueueSpec {
    return this.jsonData.spec ?? {};
  }

  get status(): LocalQueueStatus {
    return this.jsonData.status ?? {};
  }

  get clusterQueue(): string {
    return this.spec.clusterQueue ?? '-';
  }

  get pendingWorkloads(): number {
    return this.status.pendingWorkloads ?? 0;
  }

  get admittedWorkloads(): number {
    return this.status.admittedWorkloads ?? 0;
  }

  get conditions(): LocalQueueCondition[] {
    return this.status.conditions ?? [];
  }

  get isActive(): boolean {
    const activeCond = this.conditions.find(c => c.type === 'Active');
    return activeCond?.status === 'True';
  }

  get statusMessage(): string {
    const activeCond = this.conditions.find(c => c.type === 'Active');
    if (!activeCond) {
      return 'Unknown';
    }
    return activeCond.status === 'True' ? 'Active' : `Inactive (${activeCond.reason ?? 'Unknown reason'})`;
  }
}
