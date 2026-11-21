import type { NodeReadinessEvaluation } from '../resources';
import type { NodeEvaluationState, ReadinessConditionEvaluation } from '../resources/types';

/**
 * Summary statistics representing rule satisfaction progress for a NodeReadinessEvaluation.
 */
export interface EvaluationSummary {
  /** Total number of rules applicable to this node. */
  total: number;
  /** Number of rules whose criteria are completely satisfied. */
  satisfied: number;
  /** Number of rules with unmet conditions. */
  unsatisfied: number;
  /** Indicates whether the controller has not yet written evaluation records. */
  isPending: boolean;
  /** Human-readable status label (e.g. 'OK (2/2)', 'Not Ready (1/3)', 'Evaluation Pending'). */
  statusLabel: string;
  /** Semantic severity for Headlamp StatusLabel badges. */
  statusSeverity: 'success' | 'warning' | 'error' | undefined;
}

/**
 * Computes rule satisfaction summary metrics for a NodeReadinessEvaluation object.
 *
 * @param evaluation - The NodeReadinessEvaluation instance or null/undefined.
 * @returns Summary metrics object.
 */
export function getEvaluationSummary(
  evaluation: NodeReadinessEvaluation | null | undefined
): EvaluationSummary {
  const status = evaluation?.status;
  const rules = evaluation?.rules ?? status?.rules;

  if (!status || !rules || (Object.keys(status).length === 0 && rules.length === 0)) {
    return {
      total: 0,
      satisfied: 0,
      unsatisfied: 0,
      isPending: true,
      statusLabel: 'Evaluation Pending',
      statusSeverity: undefined,
    };
  }

  const total = rules.length;
  let satisfied = 0;

  for (const r of rules) {
    if (r.ruleStatus === 'Satisfied' || r.status === 'Satisfied') {
      satisfied++;
    }
  }

  const unsatisfied = total - satisfied;

  if (total === 0) {
    return {
      total: 0,
      satisfied: 0,
      unsatisfied: 0,
      isPending: false,
      statusLabel: 'No Rules Applicable',
      statusSeverity: 'success',
    };
  }

  if (satisfied === total) {
    return {
      total,
      satisfied,
      unsatisfied: 0,
      isPending: false,
      statusLabel: `OK (${satisfied}/${total})`,
      statusSeverity: 'success',
    };
  }

  return {
    total,
    satisfied,
    unsatisfied,
    isPending: false,
    statusLabel: `Not Ready (${unsatisfied}/${total})`,
    statusSeverity: 'warning',
  };
}

/**
 * Maps an overall NodeEvaluationState enum to a display label and StatusLabel severity.
 *
 * @param state - The node evaluation state from status.state.
 * @returns Object with display label and severity.
 */
export function getEvaluationStateInfo(state?: NodeEvaluationState): {
  label: string;
  severity: 'success' | 'error' | undefined;
} {
  if (state === 'Available') {
    return { label: 'Available', severity: 'success' };
  }
  if (state === 'NotAvailable') {
    return { label: 'NotAvailable', severity: 'error' };
  }
  return { label: 'Evaluation Pending', severity: undefined };
}

/**
 * Formats a duration in milliseconds into a concise readable string (e.g., '42s', '3m 12s', '2h 15m', '3d 4h').
 */
export function formatDurationMs(ms: number): string {
  if (ms < 0 || isNaN(ms)) return '0s';
  const totalSeconds = Math.round(ms / 1000);
  if (totalSeconds < 60) {
    return `${totalSeconds}s`;
  }
  if (totalSeconds < 3600) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds}s`;
  }
  const hours = Math.floor(totalSeconds / 3600);
  const remainingMinutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours < 24) {
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
}

/**
 * Computes duration metric according to Design Doc §5.5 and NRC lifecycle handling:
 * "⏱️ Unblock Duration: {duration}" when the taint was removed (Absent),
 * or "⏳ Blocked at Last Evaluation: {duration}" when actively held by the taint (Present).
 *
 * Uses taintObservedAt as start time (with taintAddedAt as fallback for backward compatibility
 * or when NRC explicitly added the taint), ensuring adopted taints have accurate duration metrics.
 * Uses taintStatus to determine active versus completed lifecycle durations.
 */
export function getRuleDurationInfo(rule: {
  ruleStatus?: string;
  status?: string;
  taintStatus?: 'Present' | 'Absent';
  taintObservedAt?: string;
  taintAddedAt?: string;
  taintRemovedAt?: string;
  lastEvaluatedAt?: string;
}): { label: string; text: string } | null {
  const startedAt = rule.taintObservedAt || rule.taintAddedAt;

  if (rule.taintStatus === 'Absent' || (!rule.taintStatus && rule.taintRemovedAt)) {
    if (startedAt && rule.taintRemovedAt) {
      const added = Date.parse(startedAt);
      const removed = Date.parse(rule.taintRemovedAt);
      if (!isNaN(added) && !isNaN(removed) && removed >= added) {
        return { label: '⏱️ Unblock Duration', text: formatDurationMs(removed - added) };
      }
    }
    return null;
  }

  // Currently blocked (taint is actively present on the node)
  if (
    (rule.taintStatus === 'Present' || (!rule.taintStatus && !rule.taintRemovedAt)) &&
    startedAt
  ) {
    const added = Date.parse(startedAt);
    if (!isNaN(added)) {
      const evaluatedAt = rule.lastEvaluatedAt ? Date.parse(rule.lastEvaluatedAt) : NaN;
      if (isNaN(evaluatedAt)) return null;
      const elapsed = Math.max(0, evaluatedAt - added);
      return { label: '⏳ Blocked at Last Evaluation', text: formatDurationMs(elapsed) };
    }
  }

  return null;
}

/**
 * Evaluates the effective satisfaction status of an individual readiness condition.
 * Conforms to upstream NRC PR #345:
 * - If currentStatus is known ('True' or 'False'), evaluates currentStatus === requiredStatus.
 * - If currentStatus is 'Unknown' (missing from node), falls back to evaluating defaultStatus === requiredStatus.
 * - If requiredStatus is 'Unknown', it matches.
 * - If parent rule is authoritative 'Satisfied' in an allOf policy, all conditions were satisfied.
 * - Otherwise, treats ambiguous 'Unknown' conditions as indeterminate ('Unknown').
 */
export function getConditionEvaluationStatus(
  condition: ReadinessConditionEvaluation,
  parentRuleStatus?: string,
  conditionPolicy?: string
): 'Satisfied' | 'Unsatisfied' | 'Unknown' {
  const { currentStatus, requiredStatus, defaultStatus } = condition;

  // 1. If explicitly observed as True or False on the node, evaluate against requiredStatus
  if (currentStatus === 'True' || currentStatus === 'False') {
    return currentStatus === requiredStatus ? 'Satisfied' : 'Unsatisfied';
  }

  // 2. If condition is missing from node (Unknown), fall back to defaultStatus if specified
  if (defaultStatus === 'True' || defaultStatus === 'False') {
    return defaultStatus === requiredStatus ? 'Satisfied' : 'Unsatisfied';
  }

  // 3. If requiredStatus itself was explicitly Unknown, it matches
  if (requiredStatus === 'Unknown') {
    return 'Satisfied';
  }

  // 4. If parent rule has an authoritative Satisfied outcome in an allOf policy, all conditions were satisfied
  if (parentRuleStatus === 'Satisfied' && conditionPolicy !== 'anyOf') {
    return 'Satisfied';
  }

  // 5. Ambiguous Unknown without authoritative result is indeterminate
  return 'Unknown';
}
