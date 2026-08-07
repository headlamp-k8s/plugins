import {
  KubeObject,
  KubeObjectInterface,
  type KubeOwnerReference,
} from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { kueueApiVersions } from '../utils/kueueApi';
import { kueueRoutePaths } from '../utils/kueueRoutes';
import type { KueueCondition, ResourceQuantity } from './clusterQueue';
import {
  getAdmissionFlavorNames,
  getWorkloadDetailRouteParams,
  renderAdmissionClusterQueue,
  renderAdmissionFlavors,
  renderAdmissionSummary,
  renderAdmittedStatus,
  renderBoolean,
  renderFinishedStatus,
  renderNumber,
  renderOwnerReferences,
  renderPodSetsSummary,
  renderPriority,
  renderPriorityClassName,
  renderQueueName,
  renderReclaimablePodsSummary,
  renderRequeueState,
  renderText,
  renderWorkloadStatus,
} from './workloadFormatters';

const WORKLOAD_API_DOCS = 'https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#workload';
const WORKLOAD_SPEC_DOCS = 'https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#workloadspec';
const WORKLOAD_STATUS_DOCS =
  'https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#workloadstatus';

/**
 * Minimal Kubernetes resource list used by Kueue Workload pod sets and admission.
 *
 * @see https://kubernetes.io/docs/reference/kubernetes-api/common-definitions/quantity/
 */
export type ResourceList = Record<string, ResourceQuantity>;

/**
 * Reference to a Kubernetes or Kueue priority class for a Workload.
 *
 * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#priorityclassref
 */
export interface PriorityClassRef {
  /**
   * API group of the priority class.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#priorityclassref
   */
  group?: 'scheduling.k8s.io' | 'kueue.x-k8s.io';
  /**
   * Kind of priority class.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#priorityclassref
   */
  kind?: 'PriorityClass' | 'WorkloadPriorityClass';
  /**
   * Priority class name.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#priorityclassref
   */
  name?: string;
}

/**
 * Container resource requirements used to summarize pod set requests.
 *
 * @see https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.30/#resourcerequirements-v1-core
 */
export interface ContainerResources {
  /**
   * Minimum resources requested by this container.
   *
   * @see https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.30/#resourcerequirements-v1-core
   */
  requests?: ResourceList;
  /**
   * Maximum resources allowed for this container.
   *
   * @see https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.30/#resourcerequirements-v1-core
   */
  limits?: ResourceList;
}

/**
 * Minimal container shape used by Workload pod set views.
 *
 * @see https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.30/#container-v1-core
 */
export interface PodSetContainer {
  /**
   * Container name.
   *
   * @see https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.30/#container-v1-core
   */
  name: string;
  /**
   * Container image.
   *
   * @see https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.30/#container-v1-core
   */
  image?: string;
  /**
   * Container resource requirements.
   *
   * @see https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.30/#resourcerequirements-v1-core
   */
  resources?: ContainerResources;
}

/**
 * Minimal Kubernetes PodSpec fields used by Workload pod set views.
 *
 * @see https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.30/#podspec-v1-core
 */
export interface PodSpec {
  /**
   * Application containers in the pod template.
   *
   * @see https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.30/#podspec-v1-core
   */
  containers?: PodSetContainer[];
  /**
   * Init containers in the pod template.
   *
   * @see https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.30/#podspec-v1-core
   */
  initContainers?: PodSetContainer[];
  /**
   * Node selector from the pod template.
   *
   * @see https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.30/#podspec-v1-core
   */
  nodeSelector?: Record<string, string>;
}

/**
 * Minimal Kubernetes PodTemplateSpec used by Kueue Workload pod sets.
 *
 * @see https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.30/#podtemplatespec-v1-core
 */
export interface PodTemplateSpec {
  /**
   * Template metadata; Kueue allows labels and annotations here.
   *
   * @see https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.30/#podtemplatespec-v1-core
   */
  metadata?: {
    /** Pod template labels. */
    labels?: Record<string, string>;
    /** Pod template annotations. */
    annotations?: Record<string, string>;
  };
  /**
   * Pod spec for the homogeneous pod set.
   *
   * @see https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.30/#podtemplatespec-v1-core
   */
  spec?: PodSpec;
}

/**
 * Topology request associated with a Workload pod set.
 *
 * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#podsettopologyrequest
 */
export interface PodSetTopologyRequest {
  /**
   * Required topology level.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#podsettopologyrequest
   */
  required?: string;
  /**
   * Preferred topology level.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#podsettopologyrequest
   */
  preferred?: string;
  /**
   * Whether Kueue may schedule without compactness constraints.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#podsettopologyrequest
   */
  unconstrained?: boolean;
}

/**
 * A homogeneous set of pods in a Kueue Workload.
 *
 * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#podset
 */
export interface PodSet {
  /**
   * Pod set name.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#podset
   */
  name?: string;
  /**
   * Pod template for this pod set.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#podset
   */
  template?: PodTemplateSpec;
  /**
   * Number of pods in this pod set.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#podset
   */
  count?: number;
  /**
   * Minimum acceptable pod count for partial admission.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#podset
   */
  minCount?: number;
  /**
   * Topology request for this pod set.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#podset
   */
  topologyRequest?: PodSetTopologyRequest;
}

/**
 * Preemption gate configured on a Workload.
 *
 * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#preemptiongate
 */
export interface PreemptionGate {
  /**
   * Gate name.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#preemptiongate
   */
  name: string;
}

/**
 * Desired state of a Kueue Workload.
 *
 * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#workloadspec
 */
export interface WorkloadSpec {
  /**
   * Sets of homogeneous pods to be admitted together.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#workloadspec
   */
  podSets?: PodSet[];
  /**
   * LocalQueue associated with this Workload.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#workloadspec
   */
  queueName?: string;
  /**
   * Priority class reference used to populate Workload priority.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#workloadspec
   */
  priorityClassRef?: PriorityClassRef;
  /**
   * Numeric priority used for admission ordering.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#workloadspec
   */
  priority?: number;
  /**
   * Whether the Workload can be evaluated for admission.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#workloadspec
   */
  active?: boolean;
  /**
   * Maximum admitted execution time in seconds.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#workloadspec
   */
  maximumExecutionTimeSeconds?: number;
  /**
   * Gates controlling whether this Workload may trigger preemptions.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#workloadspec
   */
  preemptionGates?: PreemptionGate[];
}

/**
 * Admission assignment for one Workload pod set.
 *
 * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#podsetassignment
 */
export interface PodSetAssignment {
  /**
   * Pod set name.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#podsetassignment
   */
  name?: string;
  /**
   * ResourceFlavor assigned per resource name.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#podsetassignment
   */
  flavors?: Record<string, string>;
  /**
   * Total resource usage calculated at admission.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#podsetassignment
   */
  resourceUsage?: ResourceList;
  /**
   * Count of pods taken into account at admission time.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#podsetassignment
   */
  count?: number;
  /**
   * Assigned topology details.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#podsetassignment
   */
  topologyAssignment?: unknown;
  /**
   * Whether topology assignment is delayed.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#podsetassignment
   */
  delayedTopologyRequest?: 'Pending' | 'Ready';
}

/**
 * Admission result for a Workload.
 *
 * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#admission
 */
export interface Admission {
  /**
   * ClusterQueue that admitted this Workload.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#admission
   */
  clusterQueue?: string;
  /**
   * Per-pod-set admission assignments.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#admission
   */
  podSetAssignments?: PodSetAssignment[];
}

/**
 * Requeue backoff state for a Workload evicted by PodsReadyTimeout.
 *
 * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#requeuestate
 */
export interface RequeueState {
  /**
   * Number of backoff requeues.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#requeuestate
   */
  count?: number;
  /**
   * Next requeue time.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#requeuestate
   */
  requeueAt?: string;
}

/**
 * Pod count no longer requiring reservation within a pod set.
 *
 * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#reclaimablepod
 */
export interface ReclaimablePod {
  /**
   * Pod set name.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#reclaimablepod
   */
  name: string;
  /**
   * Reclaimable pod count.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#reclaimablepod
   */
  count: number;
}

/**
 * Resource requests calculated for a non-admitted Workload.
 *
 * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#podsetrequest
 */
export interface PodSetRequest {
  /**
   * Pod set name.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#podsetrequest
   */
  name: string;
  /**
   * Requested resources for this pod set.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#podsetrequest
   */
  resources?: ResourceList;
}

/**
 * Admission check state reported for a Workload.
 *
 * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#admissioncheckstate
 */
export interface AdmissionCheckState {
  /**
   * AdmissionCheck name.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#admissioncheckstate
   */
  name: string;
  /**
   * Current admission check state.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#admissioncheckstate
   */
  state?: 'Pending' | 'Ready' | 'Retry' | 'Rejected';
  /**
   * Last transition time.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#admissioncheckstate
   */
  lastTransitionTime?: string;
  /**
   * Human-readable transition message.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#admissioncheckstate
   */
  message?: string;
  /**
   * Delay before retrying admission.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#admissioncheckstate
   */
  requeueAfterSeconds?: number;
  /**
   * Number of retry transitions.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#admissioncheckstate
   */
  retryCount?: number;
}

/**
 * Eviction statistics for a Workload.
 *
 * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#workloadschedulingstatseviction
 */
export interface WorkloadSchedulingStatsEviction {
  /**
   * Eviction reason.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#workloadschedulingstatseviction
   */
  reason: string;
  /**
   * Finer-grained eviction cause.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#workloadschedulingstatseviction
   */
  underlyingCause?: string;
  /**
   * Eviction count for this reason and cause.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#workloadschedulingstatseviction
   */
  count: number;
}

/**
 * Scheduling statistics reported for a Workload.
 *
 * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#schedulingstats
 */
export interface SchedulingStats {
  /**
   * Eviction statistics grouped by reason and underlying cause.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#schedulingstats
   */
  evictions?: WorkloadSchedulingStatsEviction[];
}

/**
 * Unhealthy node entry reported by topology-aware scheduling.
 *
 * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#unhealthynode
 */
export interface UnhealthyNode {
  /**
   * Node name.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#unhealthynode
   */
  name: string;
}

/**
 * Minimal Workload condition shape used by formatter helpers.
 *
 * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#workloadstatus
 */
export type WorkloadConditionLike = Pick<KueueCondition, 'type' | 'status' | 'reason' | 'message'>;

/**
 * Observed state of a Kueue Workload.
 *
 * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#workloadstatus
 */
export interface WorkloadStatus {
  /**
   * Latest observations of Workload state.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#workloadstatus
   */
  conditions?: KueueCondition[];
  /**
   * Admission assigned by Kueue.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#workloadstatus
   */
  admission?: Admission;
  /**
   * Requeue backoff state.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#workloadstatus
   */
  requeueState?: RequeueState;
  /**
   * Reclaimable pod counts.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#workloadstatus
   */
  reclaimablePods?: ReclaimablePod[];
  /**
   * Admission check states required by the Workload.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#workloadstatus
   */
  admissionChecks?: AdmissionCheckState[];
  /**
   * Requested resources reported when the Workload was considered for admission.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#workloadstatus
   */
  resourceRequests?: PodSetRequest[];
  /**
   * Total seconds spent admitted in previous admit-evict cycles.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#workloadstatus
   */
  accumulatedPastExecutionTimeSeconds?: number;
  /**
   * Scheduling statistics.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#workloadstatus
   */
  schedulingStats?: SchedulingStats;
  /**
   * Nominated MultiKueue cluster names.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#workloadstatus
   */
  nominatedClusterNames?: string[];
  /**
   * Assigned MultiKueue cluster name.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#workloadstatus
   */
  clusterName?: string;
  /**
   * Unhealthy nodes reported by topology-aware scheduling.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#workloadstatus
   */
  unhealthyNodes?: UnhealthyNode[];
}

/**
 * Kubernetes Workload object returned by the Kueue API.
 *
 * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#workload
 */
export interface KubeWorkload extends KubeObjectInterface {
  /**
   * Kubernetes object metadata for the Workload.
   *
   * @see https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.30/#objectmeta-v1-meta
   */
  metadata: KubeObjectInterface['metadata'] & {
    /** Owner references for the job object represented by this Workload. */
    ownerReferences?: KubeOwnerReference[];
  };
  /**
   * Workload desired state.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#workloadspec
   */
  spec?: WorkloadSpec;
  /**
   * Workload observed state.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#workloadstatus
   */
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

  get priority() {
    return this.spec.priority;
  }

  get priorityDisplay() {
    return renderPriority(this.priority);
  }

  get priorityClassName() {
    return this.spec.priorityClassRef?.name;
  }

  get priorityClassDisplay() {
    return renderPriorityClassName(this.priorityClassName);
  }

  get activeDisplay() {
    return renderBoolean(this.spec.active);
  }

  get maximumExecutionTimeSecondsDisplay() {
    return renderNumber(this.spec.maximumExecutionTimeSeconds);
  }

  get podSets() {
    return this.spec.podSets || [];
  }

  get podSetsDisplay() {
    return renderPodSetsSummary(this.podSets);
  }

  get conditions() {
    return this.status.conditions || [];
  }

  get admission() {
    return this.status.admission;
  }

  get admittedDisplay() {
    return renderAdmittedStatus(this.admission, this.conditions);
  }

  get finishedDisplay() {
    return renderFinishedStatus(this.conditions);
  }

  get statusDisplay() {
    return renderWorkloadStatus(this.conditions, this.spec.active, this.admission);
  }

  get admissionClusterQueue() {
    return this.admission?.clusterQueue;
  }

  get admissionClusterQueueDisplay() {
    return renderAdmissionClusterQueue(this.admission);
  }

  get admissionFlavors() {
    return getAdmissionFlavorNames(this.admission);
  }

  get admissionFlavorsDisplay() {
    return renderAdmissionFlavors(this.admission);
  }

  get admissionDisplay() {
    return renderAdmissionSummary(this.admission);
  }

  get reclaimablePods() {
    return this.status.reclaimablePods || [];
  }

  get reclaimablePodsDisplay() {
    return renderReclaimablePodsSummary(this.reclaimablePods);
  }

  get requeueStateDisplay() {
    return renderRequeueState(this.status.requeueState);
  }

  get ownerReferencesDisplay() {
    return renderOwnerReferences(this.metadata.ownerReferences);
  }

  get accumulatedPastExecutionTimeSecondsDisplay() {
    return renderNumber(this.status.accumulatedPastExecutionTimeSeconds);
  }

  get clusterNameDisplay() {
    return renderText(this.status.clusterName);
  }

  get nominatedClusterNamesDisplay() {
    const nominatedClusterNames = this.status.nominatedClusterNames || [];

    return nominatedClusterNames.length > 0 ? nominatedClusterNames.join(', ') : '-';
  }

  get detailRouteParams() {
    return getWorkloadDetailRouteParams(this.metadata.namespace, this.metadata.name);
  }
}

export { WORKLOAD_API_DOCS, WORKLOAD_SPEC_DOCS, WORKLOAD_STATUS_DOCS };
