import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { kueueApiVersions } from '../utils/kueueApi';
import { kueueRoutePaths } from '../utils/kueueRoutes';
import type { FairSharing, KueueCondition, ResourceQuantity, StopPolicy } from './clusterQueue';
import {
  getLocalQueueDetailRouteParams,
  renderClusterQueueName,
  renderLocalQueueStatus,
  renderStopPolicy,
  renderWorkloadCount,
} from './localQueueFormatters';

const LOCAL_QUEUE_API_DOCS = 'https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#localqueue';
const LOCAL_QUEUE_SPEC_DOCS =
  'https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#localqueuespec';
const LOCAL_QUEUE_STATUS_DOCS =
  'https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#localqueuestatus';

/**
 * Desired state of a Kueue LocalQueue.
 *
 * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#localqueuespec
 */
export interface LocalQueueSpec {
  /**
   * ClusterQueue that backs this LocalQueue.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#localqueuespec
   */
  clusterQueue?: string;
  /**
   * Policy controlling whether new reservations are made for this LocalQueue.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#localqueuespec
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#stoppolicy
   */
  stopPolicy?: StopPolicy;
  /**
   * FairSharing settings used when AdmissionFairSharing is enabled.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#localqueuespec
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#fairsharing
   */
  fairSharing?: FairSharing;
}

/**
 * Per-resource quota usage for a LocalQueue ResourceFlavor.
 *
 * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#localqueueresourceusage
 */
export interface LocalQueueResourceUsage {
  /**
   * Resource name, such as `cpu`, `memory`, or an extended resource.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#localqueueresourceusage
   */
  name: string;
  /**
   * Total quantity of used quota.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#localqueueresourceusage
   */
  total?: ResourceQuantity;
}

/**
 * LocalQueue quota usage grouped by ResourceFlavor.
 *
 * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#localqueueflavorusage
 */
export interface LocalQueueFlavorUsage {
  /**
   * ResourceFlavor name.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#localqueueflavorusage
   */
  name: string;
  /**
   * Resource usage values reported under this flavor.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#localqueueflavorusage
   */
  resources?: LocalQueueResourceUsage[];
}

/**
 * FairSharing consumption details for a LocalQueue.
 *
 * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#localqueueadmissionfairsharingstatus
 */
export interface LocalQueueAdmissionFairSharingStatus {
  /**
   * Aggregated usage of resources over time with a decaying function applied.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#localqueueadmissionfairsharingstatus
   */
  consumedResources?: Record<string, ResourceQuantity>;
  /**
   * Time when fair sharing resource consumption was updated.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#localqueueadmissionfairsharingstatus
   */
  lastUpdate?: string;
}

/**
 * Current FairSharing state reported by Kueue for a LocalQueue.
 *
 * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#localqueuefairsharingstatus
 */
export interface LocalQueueFairSharingStatus {
  /**
   * Weighted share calculated for this LocalQueue.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#localqueuefairsharingstatus
   */
  weightedShare: number;
  /**
   * Admission FairSharing status details.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#localqueuefairsharingstatus
   */
  admissionFairSharingStatus?: LocalQueueAdmissionFairSharingStatus;
}

/**
 * Observed state of a Kueue LocalQueue.
 *
 * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#localqueuestatus
 */
export interface LocalQueueStatus {
  /**
   * Latest observations of LocalQueue state.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#localqueuestatus
   */
  conditions?: KueueCondition[];
  /**
   * Number of workloads waiting to be admitted.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#localqueuestatus
   */
  pendingWorkloads?: number;
  /**
   * Number of workloads currently reserving quota.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#localqueuestatus
   */
  reservingWorkloads?: number;
  /**
   * Number of admitted workloads that have not finished yet.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#localqueuestatus
   */
  admittedWorkloads?: number;
  /**
   * Reserved quotas currently used by workloads assigned to this LocalQueue.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#localqueuestatus
   */
  flavorsReservation?: LocalQueueFlavorUsage[];
  /**
   * Used quotas currently used by workloads assigned to this LocalQueue.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#localqueuestatus
   */
  flavorsUsage?: LocalQueueFlavorUsage[];
  /**
   * Current FairSharing state.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#localqueuestatus
   */
  fairSharing?: LocalQueueFairSharingStatus;
}

/**
 * Kubernetes LocalQueue object returned by the Kueue API.
 *
 * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#localqueue
 */
export interface KubeLocalQueue extends KubeObjectInterface {
  /**
   * Kubernetes object metadata for the LocalQueue.
   *
   * @see https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.30/#objectmeta-v1-meta
   */
  metadata: KubeObjectInterface['metadata'];
  /**
   * LocalQueue desired state.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#localqueuespec
   */
  spec?: LocalQueueSpec;
  /**
   * LocalQueue observed state.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#localqueuestatus
   */
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

  get clusterQueueName() {
    return this.spec.clusterQueue;
  }

  get clusterQueueDisplay() {
    return renderClusterQueueName(this.clusterQueueName);
  }

  get stopPolicy() {
    return this.spec.stopPolicy;
  }

  get stopPolicyDisplay() {
    return renderStopPolicy(this.stopPolicy);
  }

  get pendingWorkloads() {
    return renderWorkloadCount(this.status.pendingWorkloads);
  }

  get admittedWorkloads() {
    return renderWorkloadCount(this.status.admittedWorkloads);
  }

  get reservingWorkloads() {
    return renderWorkloadCount(this.status.reservingWorkloads);
  }

  get conditions() {
    return this.status.conditions || [];
  }

  get activeCondition() {
    return this.conditions.find(condition => condition.type === 'Active');
  }

  get statusDisplay() {
    return renderLocalQueueStatus(this.activeCondition);
  }

  get detailRouteParams() {
    return getLocalQueueDetailRouteParams(this.metadata.namespace, this.metadata.name);
  }
}

export { LOCAL_QUEUE_API_DOCS, LOCAL_QUEUE_SPEC_DOCS, LOCAL_QUEUE_STATUS_DOCS };
