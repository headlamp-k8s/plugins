import { Time } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';

export type ConditionStatus = 'True' | 'False' | 'Unknown';

export interface Condition {
  type: string;
  status: ConditionStatus;
  severity?: 'Error' | 'Warning' | 'Info' | ''; // only in clusterv1.Condition
  observedGeneration?: number; // only in metav1.Condition
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
