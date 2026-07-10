import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { kueueApiVersions } from '../utils/kueueApi';
import { kueueRoutePaths } from '../utils/kueueRoutes';
import {
  getUniqueFlavorNames,
  renderAdmissionChecks,
  renderClusterQueueStatus,
  renderConcurrentAdmissionPolicy,
  renderConditions,
  renderFairSharing,
  renderFlavorFungibility,
  renderFlavorUsage,
  renderLabelSelector,
  renderPreemption,
  renderResourceGroups,
  renderResourceGroupsSummary,
  renderStringList,
} from './clusterQueueFormatters';

const CLUSTER_QUEUE_API_DOCS =
  'https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#clusterqueue';
const CLUSTER_QUEUE_SPEC_DOCS =
  'https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#clusterqueuespec';
const CLUSTER_QUEUE_STATUS_DOCS =
  'https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#clusterqueuestatus';

/**
 * Kubernetes resource quantity encoded as a string by the API.
 *
 * @see https://kubernetes.io/docs/reference/kubernetes-api/common-definitions/quantity/
 */
export type ResourceQuantity = string | number;

/**
 * Standard Kubernetes condition status value.
 *
 * @see https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.30/#condition-v1-meta
 */
export type ConditionStatus = 'True' | 'False' | 'Unknown';

/**
 * Kubernetes condition reported by Kueue status fields.
 *
 * @see https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.30/#condition-v1-meta
 */
export interface KueueCondition {
  /**
   * Condition type, such as `Active`.
   *
   * @see https://github.com/kubernetes-sigs/kueue/blob/main/apis/kueue/v1beta2/clusterqueue_types.go
   */
  type: string;
  /**
   * Current condition status.
   *
   * @see https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.30/#condition-v1-meta
   */
  status: ConditionStatus;
  /**
   * Last observed generation for the condition.
   *
   * @see https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.30/#condition-v1-meta
   */
  observedGeneration?: number;
  /**
   * Last condition transition time.
   *
   * @see https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.30/#condition-v1-meta
   */
  lastTransitionTime?: string;
  /**
   * Machine-readable reason for the condition transition.
   *
   * @see https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.30/#condition-v1-meta
   */
  reason?: string;
  /**
   * Human-readable condition message.
   *
   * @see https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.30/#condition-v1-meta
   */
  message?: string;
}

/**
 * Kubernetes label selector used by ClusterQueue namespace policy.
 *
 * @see https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.30/#labelselector-v1-meta
 */
export interface LabelSelector {
  /**
   * Exact label matches required by the selector.
   *
   * @see https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.30/#labelselector-v1-meta
   */
  matchLabels?: Record<string, string>;
  /**
   * Set-based label selector requirements.
   *
   * @see https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.30/#labelselectorrequirement-v1-meta
   */
  matchExpressions?: LabelSelectorRequirement[];
}

/**
 * Set-based label selector requirement.
 *
 * @see https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.30/#labelselectorrequirement-v1-meta
 */
export interface LabelSelectorRequirement {
  /**
   * Label key that the selector applies to.
   *
   * @see https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.30/#labelselectorrequirement-v1-meta
   */
  key: string;
  /**
   * Selector operator.
   *
   * @see https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.30/#labelselectorrequirement-v1-meta
   */
  operator: 'In' | 'NotIn' | 'Exists' | 'DoesNotExist';
  /**
   * Values used by `In` and `NotIn` operators.
   *
   * @see https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.30/#labelselectorrequirement-v1-meta
   */
  values?: string[];
}

/**
 * Queueing strategy supported by Kueue ClusterQueue.
 *
 * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#queueingstrategy
 */
export type QueueingStrategy = 'StrictFIFO' | 'BestEffortFIFO';

/**
 * Stop policy controlling whether a ClusterQueue admits or drains workloads.
 *
 * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#stoppolicy
 */
export type StopPolicy = 'None' | 'Hold' | 'HoldAndDrain';

/**
 * Resource quota configured for a ResourceFlavor in a ClusterQueue resource group.
 *
 * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#resourcequota
 */
export interface ResourceQuota {
  /**
   * Resource name, such as `cpu`, `memory`, or an extended resource.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#resourcequota
   */
  name: string;
  /**
   * Nominal resource quota available to workloads admitted by this ClusterQueue.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#resourcequota
   */
  nominalQuota: ResourceQuantity;
  /**
   * Maximum quota that can be borrowed from other ClusterQueues in the cohort.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#resourcequota
   */
  borrowingLimit?: ResourceQuantity;
  /**
   * Maximum unused quota that can be lent to other ClusterQueues in the cohort.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#resourcequota
   */
  lendingLimit?: ResourceQuantity;
}

/**
 * Quotas for one ResourceFlavor in a ClusterQueue resource group.
 *
 * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#flavorquotas
 */
export interface FlavorQuotas {
  /**
   * ResourceFlavor name referenced by this ClusterQueue.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#flavorquotas
   */
  name: string;
  /**
   * Resource quotas provided by this flavor.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#flavorquotas
   */
  resources?: ResourceQuota[];
}

/**
 * Group of covered resources and ResourceFlavors that provide quotas for them.
 *
 * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#resourcegroup
 */
export interface ResourceGroup {
  /**
   * Resource names covered by this group.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#resourcegroup
   */
  coveredResources?: string[];
  /**
   * ResourceFlavors that provide quotas for the covered resources.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#resourcegroup
   */
  flavors?: FlavorQuotas[];
}

/**
 * Policy used by flavor fungibility settings.
 *
 * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#flavorfungibility
 */
export type FlavorFungibilityPolicy = 'MayStopSearch' | 'TryNextFlavor';

/**
 * Preference used when both borrowing and preemption may be needed.
 *
 * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#flavorfungibility
 */
export type FlavorFungibilityPreference = 'BorrowingOverPreemption' | 'PreemptionOverBorrowing';

/**
 * Controls whether workloads try the next flavor before borrowing or preempting.
 *
 * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#flavorfungibility
 */
export interface FlavorFungibility {
  /**
   * Behavior when admission would require borrowing quota.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#flavorfungibility
   */
  whenCanBorrow?: FlavorFungibilityPolicy;
  /**
   * Behavior when admission would require preemption.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#flavorfungibility
   */
  whenCanPreempt?: FlavorFungibilityPolicy;
  /**
   * Preference when both borrowing and preemption are possible.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#flavorfungibility
   */
  preference?: FlavorFungibilityPreference;
}

/**
 * ClusterQueue preemption policy value.
 *
 * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#preemptionpolicy
 */
export type PreemptionPolicy = 'Never' | 'Any' | 'LowerPriority' | 'LowerOrNewerEqualPriority';

/**
 * Borrow-within-cohort policy value.
 *
 * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#borrowwithincohort
 */
export type BorrowWithinCohortPolicy = 'Never' | 'LowerPriority';

/**
 * Preemption settings for borrowing quota from other ClusterQueues in a cohort.
 *
 * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#borrowwithincohort
 */
export interface BorrowWithinCohort {
  /**
   * Policy for preempting workloads in other ClusterQueues while borrowing.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#borrowwithincohort
   */
  policy?: BorrowWithinCohortPolicy;
  /**
   * Maximum priority threshold of workloads that may be preempted.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#borrowwithincohort
   */
  maxPriorityThreshold?: number;
}

/**
 * Preemption configuration for a ClusterQueue.
 *
 * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#clusterqueuepreemption
 */
export interface ClusterQueuePreemption {
  /**
   * Whether a workload can preempt workloads in other ClusterQueues to reclaim nominal quota.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#clusterqueuepreemption
   */
  reclaimWithinCohort?: PreemptionPolicy;
  /**
   * Whether a borrowing workload can preempt workloads in other ClusterQueues.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#clusterqueuepreemption
   */
  borrowWithinCohort?: BorrowWithinCohort;
  /**
   * Whether a workload can preempt lower-priority workloads inside this ClusterQueue.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#clusterqueuepreemption
   */
  withinClusterQueue?: PreemptionPolicy;
}

/**
 * AdmissionCheck strategy rule for a ClusterQueue.
 *
 * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#admissioncheckstrategyrule
 */
export interface AdmissionCheckStrategyRule {
  /**
   * AdmissionCheck name.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#admissioncheckstrategyrule
   */
  name: string;
  /**
   * ResourceFlavor names for which this AdmissionCheck should run.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#admissioncheckstrategyrule
   */
  onFlavors?: string[];
}

/**
 * Strategy for determining which ResourceFlavors require AdmissionChecks.
 *
 * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#admissionchecksstrategy
 */
export interface AdmissionChecksStrategy {
  /**
   * AdmissionCheck strategy rules.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#admissionchecksstrategy
   */
  admissionChecks?: AdmissionCheckStrategyRule[];
}

/**
 * FairSharing settings for a ClusterQueue.
 *
 * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#fairsharing
 */
export interface FairSharing {
  /**
   * Comparative weight used when competing for unused cohort resources.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#fairsharing
   */
  weight?: ResourceQuantity;
}

/**
 * Current FairSharing status reported by Kueue.
 *
 * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#fairsharingstatus
 */
export interface FairSharingStatus {
  /**
   * Weighted share calculated for this ClusterQueue.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#fairsharingstatus
   */
  weightedShare: number;
}

/**
 * Admission Fair Sharing mode.
 *
 * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#admissionscope
 */
export type AdmissionMode = 'UsageBasedAdmissionFairSharing' | 'NoAdmissionFairSharing';

/**
 * Admission Fair Sharing scope for a ClusterQueue.
 *
 * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#admissionscope
 */
export interface AdmissionScope {
  /**
   * Admission Fair Sharing mode.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#admissionscope
   */
  admissionMode?: AdmissionMode;
}

/**
 * Concurrent admission migration mode.
 *
 * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#concurrentadmissionmigrationmode
 */
export type ConcurrentAdmissionMigrationMode = 'TryPreferredFlavors' | 'RetainFirstAdmission';

/**
 * Constraints for concurrent admission migration.
 *
 * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#concurrentadmissionconstraints
 */
export interface ConcurrentAdmissionConstraints {
  /**
   * Last acceptable ResourceFlavor for workload migration.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#concurrentadmissionconstraints
   */
  lastAcceptableFlavorName?: string;
}

/**
 * Concurrent admission migration configuration.
 *
 * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#concurrentadmissionmigration
 */
export interface ConcurrentAdmissionMigration {
  /**
   * Workload migration mode.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#concurrentadmissionmigration
   */
  mode?: ConcurrentAdmissionMigrationMode;
  /**
   * Workload migration constraints.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#concurrentadmissionmigration
   */
  constraints?: ConcurrentAdmissionConstraints;
}

/**
 * Concurrent admission policy for a ClusterQueue.
 *
 * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#concurrentadmissionpolicy
 */
export interface ConcurrentAdmissionPolicy {
  /**
   * Workload migration policy.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#concurrentadmissionpolicy
   */
  migration?: ConcurrentAdmissionMigration;
}

/**
 * Desired state of a Kueue ClusterQueue.
 *
 * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#clusterqueuespec
 */
export interface ClusterQueueSpec {
  /**
   * Resource groups with the resources and ResourceFlavors that provide quotas.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#clusterqueuespec
   */
  resourceGroups?: ResourceGroup[];
  /**
   * Cohort name this ClusterQueue belongs to.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#clusterqueuespec
   */
  cohortName?: string;
  /**
   * Queueing strategy for workloads across queues in this ClusterQueue.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#clusterqueuespec
   */
  queueingStrategy?: QueueingStrategy;
  /**
   * Namespaces allowed to submit workloads to this ClusterQueue.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#clusterqueuespec
   */
  namespaceSelector?: LabelSelector;
  /**
   * Flavor fungibility behavior while evaluating borrowing and preemption.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#clusterqueuespec
   */
  flavorFungibility?: FlavorFungibility;
  /**
   * Preemption policy configuration.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#clusterqueuespec
   */
  preemption?: ClusterQueuePreemption;
  /**
   * Strategy mapping AdmissionChecks to ResourceFlavors.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#clusterqueuespec
   */
  admissionChecksStrategy?: AdmissionChecksStrategy;
  /**
   * Stop policy for admission and draining behavior.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#clusterqueuespec
   */
  stopPolicy?: StopPolicy;
  /**
   * FairSharing settings.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#clusterqueuespec
   */
  fairSharing?: FairSharing;
  /**
   * Admission Fair Sharing scope.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#clusterqueuespec
   */
  admissionScope?: AdmissionScope;
  /**
   * Concurrent admission policy.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#clusterqueuespec
   */
  concurrentAdmissionPolicy?: ConcurrentAdmissionPolicy;
}

/**
 * Resource usage reported for a ResourceFlavor.
 *
 * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#resourceusage
 */
export interface ResourceUsage {
  /**
   * Resource name.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#resourceusage
   */
  name: string;
  /**
   * Total used quota, including borrowed quota.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#resourceusage
   */
  total?: ResourceQuantity;
  /**
   * Quota borrowed from the cohort.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#resourceusage
   */
  borrowed?: ResourceQuantity;
}

/**
 * Per-flavor reservation or usage status.
 *
 * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#flavorusage
 */
export interface FlavorUsage {
  /**
   * ResourceFlavor name.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#flavorusage
   */
  name: string;
  /**
   * Resources reported for this flavor.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#flavorusage
   */
  resources?: ResourceUsage[];
}

/**
 * Observed state of a Kueue ClusterQueue.
 *
 * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#clusterqueuestatus
 */
export interface ClusterQueueStatus {
  /**
   * Latest observations of ClusterQueue state.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#clusterqueuestatus
   */
  conditions?: KueueCondition[];
  /**
   * Reserved quotas currently used by workloads assigned to this ClusterQueue.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#clusterqueuestatus
   */
  flavorsReservation?: FlavorUsage[];
  /**
   * Used quotas currently used by workloads admitted in this ClusterQueue.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#clusterqueuestatus
   */
  flavorsUsage?: FlavorUsage[];
  /**
   * Number of workloads waiting to be admitted.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#clusterqueuestatus
   */
  pendingWorkloads?: number;
  /**
   * Number of workloads currently reserving quota.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#clusterqueuestatus
   */
  reservingWorkloads?: number;
  /**
   * Number of admitted workloads that have not finished yet.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#clusterqueuestatus
   */
  admittedWorkloads?: number;
  /**
   * Current FairSharing state.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#clusterqueuestatus
   */
  fairSharing?: FairSharingStatus;
}

/**
 * Kubernetes ClusterQueue object returned by the Kueue API.
 *
 * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#clusterqueue
 */
export interface KubeClusterQueue extends KubeObjectInterface {
  /**
   * Kubernetes object metadata for the ClusterQueue.
   *
   * @see https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.30/#objectmeta-v1-meta
   */
  metadata: KubeObjectInterface['metadata'];
  /**
   * ClusterQueue desired state.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#clusterqueuespec
   */
  spec?: ClusterQueueSpec;
  /**
   * ClusterQueue observed state.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#clusterqueuestatus
   */
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

  get cohortName() {
    return this.spec.cohortName || '-';
  }

  get queueingStrategy() {
    return this.spec.queueingStrategy || '-';
  }

  get stopPolicy() {
    return this.spec.stopPolicy || '-';
  }

  get resourceGroups() {
    return this.spec.resourceGroups || [];
  }

  get resourceGroupsDisplay() {
    return renderResourceGroupsSummary(this.resourceGroups);
  }

  get referencedFlavorNames() {
    return getUniqueFlavorNames(this.resourceGroups);
  }

  get referencedFlavorNamesDisplay() {
    return renderStringList(this.referencedFlavorNames);
  }

  get pendingWorkloads() {
    return this.status.pendingWorkloads ?? 0;
  }

  get admittedWorkloads() {
    return this.status.admittedWorkloads ?? 0;
  }

  get reservingWorkloads() {
    return this.status.reservingWorkloads ?? 0;
  }

  get conditions() {
    return this.status.conditions || [];
  }

  get activeCondition() {
    return this.conditions.find(condition => condition.type === 'Active');
  }

  get statusDisplay() {
    return renderClusterQueueStatus(this.activeCondition);
  }

  get namespaceSelectorDisplay() {
    return renderLabelSelector(this.spec.namespaceSelector);
  }

  get resourceGroupsDetailDisplay() {
    return renderResourceGroups(this.resourceGroups);
  }

  get conditionsDisplay() {
    return renderConditions(this.conditions);
  }

  get preemptionDisplay() {
    return renderPreemption(this.spec.preemption);
  }

  get admissionChecksDisplay() {
    return renderAdmissionChecks(this.spec.admissionChecksStrategy);
  }

  get flavorFungibilityDisplay() {
    return renderFlavorFungibility(this.spec.flavorFungibility);
  }

  get flavorsReservationDisplay() {
    return renderFlavorUsage(this.status.flavorsReservation);
  }

  get flavorsUsageDisplay() {
    return renderFlavorUsage(this.status.flavorsUsage);
  }

  get fairSharingDisplay() {
    return renderFairSharing(this.spec.fairSharing, this.status.fairSharing);
  }

  get admissionScopeDisplay() {
    return this.spec.admissionScope?.admissionMode || '-';
  }

  get concurrentAdmissionPolicyDisplay() {
    return renderConcurrentAdmissionPolicy(this.spec.concurrentAdmissionPolicy);
  }
}

export { CLUSTER_QUEUE_API_DOCS, CLUSTER_QUEUE_SPEC_DOCS, CLUSTER_QUEUE_STATUS_DOCS };
