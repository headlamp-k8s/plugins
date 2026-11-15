import type { NodeEvaluation, NodeFailure } from '../resources';
import { NodeReadinessRule } from '../resources';

/**
 * Aggregated statistics and node counts for a NodeReadinessRule.
 */
export interface RuleStats {
  /** Whether the rule has evaluation summary records or dry-run simulation data. */
  hasSummary: boolean;
  /** Whether the rule is operating in dry-run simulation mode. */
  isDryRun: boolean;
  /** Total number of worker nodes targeted by the rule selector. */
  targeted: number;
  /** Count of nodes satisfying all readiness conditions (taint absent), or 'N/A' in dry-run. */
  satisfied: number | 'N/A';
  /** Count of nodes failing readiness conditions (taint present), or 'N/A' in dry-run. */
  unsatisfied: number | 'N/A';
  /** Count of nodes that experienced evaluation errors or timeouts. */
  failed: number;
}

/**
 * High-level status display information for a NodeReadinessRule badge.
 */
export interface RuleStatusInfo {
  /** Machine-readable canonical status key. */
  status: 'Terminating' | 'Dry Run' | 'Pending' | 'Failed' | 'OK';
  /** Display label to render inside the status badge. */
  label: 'Terminating' | 'Dry Run' | 'Pending' | 'Failed' | 'OK';
  /** Semantic severity level determining the badge color. */
  severity: 'error' | 'warning' | 'info' | 'success';
}

const statsCache = new WeakMap<object, RuleStats>();

/**
 * Computes aggregated node statistics and evaluation counts for a NodeReadinessRule.
 * Uses a WeakMap cache keyed on the status object to prevent redundant computations across re-renders.
 *
 * @param rule - The NodeReadinessRule instance to compute statistics for.
 * @returns Aggregated RuleStats containing targeted, satisfied, unsatisfied, and failed counts.
 */
export function getRuleStats(rule: NodeReadinessRule): RuleStats {
  if (!rule) {
    return {
      hasSummary: false,
      isDryRun: false,
      targeted: 0,
      satisfied: 0,
      unsatisfied: 0,
      failed: 0,
    };
  }

  const statusObj = rule.status ?? rule.jsonData?.status;
  const isDryRun =
    typeof rule.isDryRun === 'boolean' ? rule.isDryRun : Boolean(rule.jsonData?.spec?.dryRun);

  if (statusObj && typeof statusObj === 'object' && statsCache.has(statusObj)) {
    return statsCache.get(statusObj)!;
  }

  if (isDryRun) {
    const failed = statusObj?.failedNodes?.length || 0;
    const stats: RuleStats = {
      hasSummary: Boolean(statusObj?.dryRunResults),
      isDryRun: true,
      targeted: statusObj?.dryRunResults?.affectedNodes || 0,
      satisfied: 'N/A',
      unsatisfied: 'N/A',
      failed,
    };
    if (statusObj && typeof statusObj === 'object') {
      statsCache.set(statusObj, stats);
    }
    return stats;
  }

  const failedNodeNames = new Set(
    (statusObj?.failedNodes || []).map((f: NodeFailure) => f.nodeName)
  );
  const evaluations = (statusObj?.nodeEvaluations || []).filter(
    (e: NodeEvaluation) => !failedNodeNames.has(e.nodeName)
  );

  const targeted = evaluations.length + failedNodeNames.size;
  const satisfied = evaluations.filter((e: NodeEvaluation) => e.taintStatus === 'Absent').length;
  const unsatisfied = evaluations.filter((e: NodeEvaluation) => e.taintStatus === 'Present').length;
  const failed = failedNodeNames.size;
  const hasSummary = Boolean(statusObj?.nodeEvaluations?.length || statusObj?.failedNodes?.length);

  const stats: RuleStats = {
    hasSummary,
    isDryRun: false,
    targeted,
    satisfied,
    unsatisfied,
    failed,
  };

  if (statusObj && typeof statusObj === 'object') {
    statsCache.set(statusObj, stats);
  }

  return stats;
}

/**
 * Determines the high-level canonical status and badge severity for a NodeReadinessRule.
 * Follows canonical status precedence: Terminating -> Failed -> Dry Run -> OK -> Pending.
 *
 * @param rule - The NodeReadinessRule instance to determine status for.
 * @returns Status display object containing status key, display label, and semantic severity.
 */
export function getRuleStatusInfo(rule: NodeReadinessRule): RuleStatusInfo {
  if (rule?.metadata?.deletionTimestamp) {
    return { status: 'Terminating', label: 'Terminating', severity: 'warning' };
  }

  const stats = getRuleStats(rule);

  if (stats.isDryRun) {
    if (stats.failed > 0) {
      return { status: 'Failed', label: 'Failed', severity: 'error' };
    }
    if (stats.hasSummary) {
      return { status: 'Dry Run', label: 'Dry Run', severity: 'info' };
    }
    return { status: 'Pending', label: 'Pending', severity: 'warning' };
  }

  if (stats.failed > 0) {
    return { status: 'Failed', label: 'Failed', severity: 'error' };
  }

  if (stats.hasSummary && stats.targeted > 0 && stats.satisfied === stats.targeted) {
    return { status: 'OK', label: 'OK', severity: 'success' };
  }

  return {
    status: 'Pending',
    label: 'Pending',
    severity: Number(stats.unsatisfied) > 0 ? 'error' : 'warning',
  };
}
