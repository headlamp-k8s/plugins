import type { KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/lib/k8s/KubeObject';

/**
 * Condition evaluation policy determining how multiple conditions are aggregated.
 * 'allOf' requires all conditions to meet their target status.
 * 'anyOf' requires at least one condition to meet its target status.
 */
export type ConditionPolicy = 'allOf' | 'anyOf';

/**
 * Lifecycle enforcement mode for the readiness rule.
 * 'bootstrap-only' enforces readiness gates only during initial node bootstrap.
 * 'continuous' continuously reconciles and enforces readiness throughout node lifecycle.
 */
export type EnforcementMode = 'bootstrap-only' | 'continuous';

/**
 * Status value of a node condition in Kubernetes ('True', 'False', or 'Unknown').
 */
export type ConditionStatus = 'True' | 'False' | 'Unknown';

/**
 * Scheduling effect of a Kubernetes node taint.
 */
export type TaintEffect = 'NoSchedule' | 'PreferNoSchedule' | 'NoExecute';

/**
 * Status indicating whether a managed taint is currently present on or absent from a node.
 */
export type TaintStatus = 'Present' | 'Absent';

/**
 * Set-based label selector operator used for node matching.
 */
export type LabelSelectorOperator = 'In' | 'NotIn' | 'Exists' | 'DoesNotExist';

/**
 * Requirement definition for a single node condition to evaluate.
 */
export interface ConditionRequirement {
  /** The type/name of the Kubernetes node condition (e.g., 'Ready', 'NetworkReady'). */
  type: string;
  /** The expected condition status required for readiness ('True', 'False', or 'Unknown'). */
  requiredStatus: ConditionStatus;
  /** Fallback status to assume if the condition is not present on the node. Defaults to 'Unknown'. */
  defaultStatus?: ConditionStatus;
}

/**
 * Label selector requirement specifying key, operator, and values.
 */
export interface LabelSelectorRequirement {
  /** The label key that the selector applies to. */
  key: string;
  /** The operator representing the relationship between the key and values. */
  operator: LabelSelectorOperator;
  /** Array of string values. If the operator is 'In' or 'NotIn', this array must not be empty. */
  values?: string[];
}

/**
 * Selector used to filter which worker nodes the readiness rule applies to.
 */
export interface NodeSelector {
  /** Map of {key, value} label pairs that nodes must possess to match. */
  matchLabels?: Record<string, string>;
  /** List of expression-based label selector requirements. */
  matchExpressions?: LabelSelectorRequirement[];
}

/**
 * Taint configuration applied to worker nodes while readiness conditions are not satisfied.
 */
export interface NodeReadinessTaint {
  /** The taint key to apply to the node. */
  key: string;
  /** The optional taint value. */
  value?: string;
  /** The effect of the taint on pods that do not tolerate the taint. */
  effect: TaintEffect;
  /** RFC3339 timestamp when the taint was added to the node. */
  timeAdded?: string;
}

/**
 * Desired specification of a NodeReadinessRule custom resource.
 */
export interface NodeReadinessRuleSpec {
  /** Condition evaluation policy ('allOf' or 'anyOf'). Defaults to 'allOf'. */
  conditionPolicy?: ConditionPolicy;
  /** List of conditions that must be satisfied for the node to be considered ready. */
  conditions: ConditionRequirement[];
  /** When true, evaluation results are computed and reported in status without mutating node taints. */
  dryRun?: boolean;
  /** Enforcement mode ('bootstrap-only' or 'continuous'). */
  enforcementMode: EnforcementMode;
  /** Node selector filtering which nodes this rule applies to. */
  nodeSelector: NodeSelector;
  /** Taint managed and applied by this readiness rule. */
  taint: NodeReadinessTaint;
}

/**
 * Evaluation result for a specific condition on an individual node.
 */
export interface ConditionEvaluationResult {
  /** Type/name of the evaluated condition. */
  type: string;
  /** Status required by the readiness rule. */
  requiredStatus: ConditionStatus;
  /** Current status observed on the node. */
  currentStatus: ConditionStatus;
  /** Fallback status applied if the condition was missing from the node. */
  defaultStatus?: ConditionStatus;
}

/**
 * Detailed evaluation record for an individual node under this rule.
 */
export interface NodeEvaluation {
  /** Name of the evaluated worker node. */
  nodeName: string;
  /** Whether the managed taint is currently 'Present' or 'Absent' on the node. */
  taintStatus: TaintStatus;
  /** RFC3339 timestamp of the most recent evaluation. */
  lastEvaluationTime: string;
  /** Per-condition evaluation results for this node. */
  conditionResults: ConditionEvaluationResult[];
}

/**
 * Diagnostic failure record for a node where condition evaluation encountered an error.
 */
export interface NodeFailure {
  /** Name of the node that encountered an evaluation error. */
  nodeName: string;
  /** RFC3339 timestamp of the failure. */
  lastEvaluationTime: string;
  /** Human-readable error message explaining the evaluation failure. */
  message?: string;
  /** Short machine-readable reason for the failure. */
  reason?: string;
}

/**
 * Simulation summary results populated when dryRun mode is enabled.
 */
export interface DryRunResults {
  /** Human-readable narrative summary of the simulation results. */
  summary: string;
  /** Number of cluster nodes matching the rule selector. */
  affectedNodes?: number;
  /** Count of risky operations detected during simulation. */
  riskyOperations?: number;
  /** Count of taints that would be added if live enforcement were active. */
  taintsToAdd?: number;
  /** Count of taints that would be removed if live enforcement were active. */
  taintsToRemove?: number;
}

/**
 * Observed status of a NodeReadinessRule custom resource.
 */
export interface NodeReadinessRuleStatus {
  /** Generation of the resource spec observed by the controller. */
  observedGeneration?: number;
  /** List of node names where managed taints are currently applied. */
  appliedNodes?: string[];
  /** Simulation outcome data populated when spec.dryRun is true. */
  dryRunResults?: DryRunResults;
  /** List of nodes that experienced evaluation errors or timeouts. */
  failedNodes?: NodeFailure[];
  /** Detailed condition evaluation results per node. */
  nodeEvaluations?: NodeEvaluation[];
}

/**
 * Complete KubeObjectInterface representation of a NodeReadinessRule.
 */
export interface NodeReadinessRuleObject extends KubeObjectInterface {
  /** Desired rule specification. */
  spec: NodeReadinessRuleSpec;
  /** Observed status populated by the node-readiness-controller. */
  status?: NodeReadinessRuleStatus;
}
