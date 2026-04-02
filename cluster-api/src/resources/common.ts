import { Time } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';

export type ConditionStatus = 'True' | 'False' | 'Unknown';

/**
 * Standard Kubernetes condition format (v1).
 * @see https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.30/#condition-v1-meta
 */
export interface MetaV1Condition {
  type: string;
  status: ConditionStatus;
  observedGeneration?: number;
  lastTransitionTime: Time;
  reason: string;
  message: string;
}

/**
 * Cluster API legacy condition format (v1alphaX/v1beta1).
 * @see https://cluster-api.sigs.k8s.io/reference/glossary.html#capi
 */
export interface ClusterV1Condition {
  type: string;
  status: ConditionStatus;
  severity?: string;
  lastTransitionTime: Time;
  reason?: string;
  message?: string;
}

/**
 * Unified condition interface for CAPI resources.
 * @see https://cluster-api.sigs.k8s.io/reference/glossary.html#capi
 */
export interface Condition {
  type: string;
  status: ConditionStatus;
  severity?: string;
  observedGeneration?: number;
  lastTransitionTime?: Time;
  reason?: string;
  message?: string;
}

/**
 * Standard Kubernetes label selector.
 * @see https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/#label-selectors
 */
export interface LabelSelector {
  matchLabels?: Record<string, string>;
  matchExpressions?: Array<{
    key: string;
    operator: 'In' | 'NotIn' | 'Exists' | 'DoesNotExist';
    values?: string[];
  }>;
}

/**
 * LocalObjectReference contains enough information to let you locate the referenced object inside the same namespace.
 */
export interface LocalObjectReference {
  /** Name of the referent. @see https://kubernetes.io/docs/concepts/overview/working-with-objects/names/#names */
  name: string;
}

/**
 * ObjectMeta is metadata that all persisted resources must have, which includes all objects users must create.
 * @see https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.30/#objectmeta-v1-meta
 */
export interface ObjectMeta {
  /** Name must be unique within a namespace. */
  name: string;
  /** Namespace defines the space within which each name must be unique. */
  namespace?: string;
  /** Labels are key value pairs that are attached to objects and can be used to organize and select subsets of objects. */
  labels?: Record<string, string>;
  /** Annotations is an unstructured key value map stored with a resource that may be set by external tools to store and retrieve arbitrary metadata. */
  annotations?: Record<string, string>;
  /** CreationTimestamp is a timestamp representing the server time when this object was created. */
  creationTimestamp: string;
  /** UID is the unique in time and space value for this object. */
  uid: string;
  /** ResourceVersion is an opaque value that represents the internal version of this object that can be used by clients to determine when objects have changed. */
  resourceVersion?: string;
  /** SelfLink is a URL representing this object. @deprecated */
  selfLink?: string;
  /** A sequence number representing a specific generation of the desired state. */
  generation?: number;
  /** DeletionTimestamp is RFC 3339 date and time at which this resource will be deleted. */
  deletionTimestamp?: string;
  /** Number of seconds allowed for this object to gracefully terminate before it will be removed from the system. */
  deletionGracePeriodSeconds?: number;
  /** Must be empty before the object is deleted from the system. */
  finalizers?: string[];
  /** List of objects depended by this object. */
  ownerReferences?: Array<{
    apiVersion: string;
    kind: string;
    name: string;
    uid: string;
    controller: boolean;
    blockOwnerDeletion: boolean;
  }>;
}

/**
 * ReadinessGate contains the configuration for a readiness gate.
 */
export interface ReadinessGate {
  /** ConditionType refers to a condition in the status.conditions list with the matching type. */
  conditionType: string;
  /** Polarity defines the polarity of the readiness gate (v1beta2). */
  polarity?: 'Positive' | 'Negative';
}

/**
 * Standard Kubernetes taint format.
 * @see https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/
 */
export interface Taint {
  key: string;
  value?: string;
  effect: 'NoSchedule' | 'PreferNoSchedule' | 'NoExecute';
  timeAdded?: Time;
}

/**
 * Generic reference to another Kubernetes object.
 * @see https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.30/#objectreference-v1-core
 */
export interface KubeReference {
  apiGroup?: string;
  apiVersion?: string;
  kind?: string;
  name?: string;
  namespace?: string;
}

export interface DeletionTimeoutsV1Beta1 {
  /** v1beta1 — duration string e.g. "10m"; replaced by nodeDrainTimeoutSeconds in v1beta2 */
  nodeDrainTimeout?: string;
  /** v1beta1 — duration string; replaced by nodeVolumeDetachTimeoutSeconds in v1beta2 */
  nodeVolumeDetachTimeout?: string;
  /** v1beta1 — duration string; replaced by nodeDeletionTimeoutSeconds in v1beta2 */
  nodeDeletionTimeout?: string;
}

export interface DeletionTimeoutsV1Beta2 {
  /** v1beta2 — integer seconds; replaces nodeDrainTimeout */
  nodeDrainTimeoutSeconds?: number;
  /** v1beta2 — integer seconds; replaces nodeVolumeDetachTimeout */
  nodeVolumeDetachTimeoutSeconds?: number;
  /** v1beta2 — integer seconds; replaces nodeDeletionTimeout */
  nodeDeletionTimeoutSeconds?: number;
}

export interface MachineTemplateMetadata {
  metadata?: ObjectMeta;
}

export interface RollingUpdateStrategy {
  maxUnavailable?: number | string;
  maxSurge?: number | string;
  deletePolicy?: 'Random' | 'Newest' | 'Oldest';
}

/**
 * Resource update strategy for MachineDeployments and KCP.
 * @see https://cluster-api.sigs.k8s.io/developer/architecture/controllers/machine-deployment.html#update-strategy
 */
export interface MachineDeploymentStrategy {
  type: 'RollingUpdate' | 'OnDelete';
  rollingUpdate?: RollingUpdateStrategy;
  remediationStrategy?: {
    maxInFlight?: number | string;
  };
}

export interface FailureInfo {
  failureReason?: string;
  failureMessage?: string;
}

/**
 * Finds a specific condition by its type in an array of conditions.
 *
 * @param conditions - The array of conditions to search.
 * @param type - The condition type (e.g. 'Ready').
 * @returns The matching Condition object or undefined.
 */
export function getCondition(
  conditions: Condition[] | undefined,
  type: string
): Condition | undefined {
  return conditions?.find(c => c.type === type);
}

/** Format a deletion timeout from either v1beta1 (string) or v1beta2 (number seconds). */
/**
 * Formats a deletion timeout for display, supporting both v1beta1 (string) and v1beta2 (seconds).
 *
 * @param v1beta2Seconds - The timeout in seconds (v1beta2).
 * @param v1beta1Value - The absolute timeout string or number (v1beta1).
 * @returns A formatted string or undefined.
 */
export function formatDeletionTimeout(
  v1beta2Seconds: number | undefined,
  v1beta1Value: string | number | undefined
): string | undefined {
  if (v1beta2Seconds !== undefined) return `${v1beta2Seconds}s`;
  if (v1beta1Value !== undefined) return String(v1beta1Value);
  return undefined;
}
