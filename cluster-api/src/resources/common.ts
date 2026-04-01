import { Time } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';

export type ConditionStatus = 'True' | 'False' | 'Unknown';

export interface MetaV1Condition {
  type: string;
  status: ConditionStatus;
  observedGeneration?: number;
  lastTransitionTime: Time;
  reason: string;
  message: string;
}

export interface ClusterV1Condition {
  type: string;
  status: ConditionStatus;
  severity?: string;
  lastTransitionTime: Time;
  reason?: string;
  message?: string;
}

export interface Condition {
  type: string;
  status: ConditionStatus;
  severity?: string;
  observedGeneration?: number;
  lastTransitionTime?: Time;
  reason?: string;
  message?: string;
}

export interface LabelSelector {
  matchLabels?: Record<string, string>;
  matchExpressions?: Array<{
    key: string;
    operator: 'In' | 'NotIn' | 'Exists' | 'DoesNotExist';
    values?: string[];
  }>;
}

export interface LocalObjectReference {
  name: string;
}

export interface ObjectMeta {
  name: string;
  namespace?: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  creationTimestamp: string;
  uid: string;
  resourceVersion?: string;
  selfLink?: string;
  generation?: number;
  deletionTimestamp?: string;
  deletionGracePeriodSeconds?: number;
  finalizers?: string[];
  ownerReferences?: Array<{
    apiVersion: string;
    kind: string;
    name: string;
    uid: string;
    controller: boolean;
    blockOwnerDeletion: boolean;
  }>;
}

export interface ReadinessGate {
  conditionType: string;
  polarity?: 'Positive' | 'Negative';
}

export interface Taint {
  key: string;
  value?: string;
  effect: 'NoSchedule' | 'PreferNoSchedule' | 'NoExecute';
  timeAdded?: Time;
}

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

export function getCondition(
  conditions: Condition[] | undefined,
  type: string
): Condition | undefined {
  return conditions?.find(c => c.type === type);
}

/** Format a deletion timeout from either v1beta1 (string) or v1beta2 (number seconds). */
export function formatDeletionTimeout(
  v1beta2Seconds: number | undefined,
  v1beta1Value: string | number | undefined
): string | undefined {
  if (v1beta2Seconds !== undefined) return `${v1beta2Seconds}s`;
  if (v1beta1Value !== undefined) return String(v1beta1Value);
  return undefined;
}
