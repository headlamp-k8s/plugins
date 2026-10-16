import type { KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/lib/k8s/KubeObject';

export type ConditionPolicy = 'allOf' | 'anyOf';
export type EnforcementMode = 'bootstrap-only' | 'continuous';
export type ConditionStatus = 'True' | 'False' | 'Unknown';
export type TaintEffect = 'NoSchedule' | 'PreferNoSchedule' | 'NoExecute';
export type TaintStatus = 'Present' | 'Absent';
export type LabelSelectorOperator = 'In' | 'NotIn' | 'Exists' | 'DoesNotExist';

export interface ConditionRequirement {
  type: string;
  requiredStatus: ConditionStatus;
  defaultStatus?: ConditionStatus;
}

export interface LabelSelectorRequirement {
  key: string;
  operator: LabelSelectorOperator;
  values?: string[];
}

export interface NodeSelector {
  matchLabels?: Record<string, string>;
  matchExpressions?: LabelSelectorRequirement[];
}

export interface NodeReadinessTaint {
  key: string;
  value?: string;
  effect: TaintEffect;
  timeAdded?: string;
}

export interface NodeReadinessRuleSpec {
  conditionPolicy?: ConditionPolicy;
  conditions: ConditionRequirement[];
  dryRun?: boolean;
  enforcementMode: EnforcementMode;
  nodeSelector: NodeSelector;
  taint: NodeReadinessTaint;
}

export interface ConditionEvaluationResult {
  type: string;
  requiredStatus: ConditionStatus;
  currentStatus: ConditionStatus;
  defaultStatus?: ConditionStatus;
}

export interface NodeEvaluation {
  nodeName: string;
  taintStatus: TaintStatus;
  lastEvaluationTime: string;
  conditionResults: ConditionEvaluationResult[];
}

export interface NodeFailure {
  nodeName: string;
  lastEvaluationTime: string;
  message?: string;
  reason?: string;
}

export interface DryRunResults {
  summary: string;
  affectedNodes?: number;
  riskyOperations?: number;
  taintsToAdd?: number;
  taintsToRemove?: number;
}

export interface NodeReadinessRuleStatus {
  observedGeneration?: number;
  appliedNodes?: string[];
  dryRunResults?: DryRunResults;
  failedNodes?: NodeFailure[];
  nodeEvaluations?: NodeEvaluation[];
}

export interface NodeReadinessRuleObject extends KubeObjectInterface {
  spec: NodeReadinessRuleSpec;
  status?: NodeReadinessRuleStatus;
}
