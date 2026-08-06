import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { kueueApiVersions } from '../utils/kueueApi';
import { kueueRoutePaths } from '../utils/kueueRoutes';
import { KueueCondition } from './clusterQueue';
import {
  getWorkloadDetailRouteParams,
  renderPriorityClassName,
  renderQueueName,
  renderWorkloadStatus,
} from './workloadFormatters';

const WORKLOAD_API_DOCS = 'https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#workload';
const WORKLOAD_SPEC_DOCS = 'https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#workloadspec';
const WORKLOAD_STATUS_DOCS = 'https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#workloadstatus';

export interface PodSet {
  name: string;
  template: any;
  count: number;
}

export interface WorkloadSpec {
  queueName?: string;
  priorityClassName?: string;
  podSets?: PodSet[];
}

export interface WorkloadStatus {
  conditions?: KueueCondition[];
  admission?: {
    clusterQueue: string;
  };
}

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

  get queueName() {
    return this.spec.queueName;
  }

  get queueNameDisplay() {
    return renderQueueName(this.queueName);
  }

  get priorityClassName() {
    return this.spec.priorityClassName;
  }

  get priorityClassNameDisplay() {
    return renderPriorityClassName(this.priorityClassName);
  }

  get conditions() {
    return this.status.conditions || [];
  }

  get activeCondition() {
    // Determine the most relevant condition
    const admitted = this.conditions.find(c => c.type === 'Admitted' && c.status === 'True');
    if (admitted) return admitted;
    const evicted = this.conditions.find(c => c.type === 'Evicted' && c.status === 'True');
    if (evicted) return evicted;
    return this.conditions[this.conditions.length - 1];
  }

  get statusDisplay() {
    return renderWorkloadStatus(this.activeCondition);
  }

  get detailRouteParams() {
    return getWorkloadDetailRouteParams(this.metadata.namespace!, this.metadata.name);
  }
}

export { WORKLOAD_API_DOCS, WORKLOAD_SPEC_DOCS, WORKLOAD_STATUS_DOCS };
