import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { kueueApiVersions } from '../utils/kueueApi';
import { kueueRoutePaths } from '../utils/kueueRoutes';

export interface ClusterQueueResourceQuota {
  name: string;
  nominalQuota: string;
  borrowingLimit?: string;
  lendingLimit?: string;
}

export interface ClusterQueueFlavor {
  name: string;
  resources: ClusterQueueResourceQuota[];
}

export interface ClusterQueueResourceGroup {
  coveredResources: string[];
  flavors: ClusterQueueFlavor[];
}

export interface ClusterQueuePreemption {
  reclaimWithinCohort?: 'Never' | 'Any' | 'LowerPriority';
  withinClusterQueue?: 'Never' | 'Block' | 'LowerPriority';
}

export interface ClusterQueueSpec {
  cohort?: string;
  queueingStrategy?: 'Strict' | 'BestEffort';
  namespaceSelector?: {
    matchLabels?: Record<string, string>;
    matchExpressions?: Array<{
      key: string;
      operator: string;
      values?: string[];
    }>;
  };
  resourceGroups?: ClusterQueueResourceGroup[];
  preemption?: ClusterQueuePreemption;
}

export interface ClusterQueueCondition {
  type: string;
  status: 'True' | 'False' | 'Unknown';
  reason?: string;
  message?: string;
  lastTransitionTime?: string;
}

export interface ClusterQueueStatus {
  pendingWorkloads?: number;
  admittedWorkloads?: number;
  conditions?: ClusterQueueCondition[];
}

export interface KubeClusterQueue extends KubeObjectInterface {
  spec?: ClusterQueueSpec;
  status?: ClusterQueueStatus;
}

export class ClusterQueue extends KubeObject<KubeClusterQueue> {
  static kind = 'ClusterQueue';
  static apiName = 'clusterqueues';
  static apiVersion = kueueApiVersions;
  static isNamespaced = false;

  static get detailsRoute() {
    return kueueRoutePaths.clusterQueueDetail;
  }

  get spec(): ClusterQueueSpec {
    return this.jsonData.spec ?? {};
  }

  get status(): ClusterQueueStatus {
    return this.jsonData.status ?? {};
  }

  get cohort(): string {
    return this.spec.cohort ?? '-';
  }

  get queueingStrategy(): string {
    return this.spec.queueingStrategy ?? 'Strict';
  }

  get pendingWorkloads(): number {
    return this.status.pendingWorkloads ?? 0;
  }

  get admittedWorkloads(): number {
    return this.status.admittedWorkloads ?? 0;
  }

  get conditions(): ClusterQueueCondition[] {
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

  get resourceGroups(): ClusterQueueResourceGroup[] {
    return this.spec.resourceGroups ?? [];
  }
}
