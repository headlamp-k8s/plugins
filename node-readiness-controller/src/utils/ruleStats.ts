import type { NodeEvaluation, NodeFailure } from '../resources';
import { NodeReadinessRule } from '../resources';

/**
 * Minimal structural shape of a NodeReadinessRule resource or plain object.
 */
export interface RuleLike {
  metadata?: {
    name?: string;
    generation?: number;
    deletionTimestamp?: string | null;
    [key: string]: any;
  };
  spec?: {
    dryRun?: boolean;
    [key: string]: any;
  };
  status?: {
    failedNodes?: Array<{ nodeName: string; reason?: string; lastEvaluationTime?: string }>;
    nodeEvaluations?: Array<{
      nodeName: string;
      taintStatus: string;
      lastEvaluationTime?: string;
      [key: string]: any;
    }>;
    dryRunResults?: {
      affectedNodes?: number;
      summary?: string;
      taintsToAdd?: number;
      taintsToRemove?: number;
      riskyOperations?: number;
    };
    observedGeneration?: number;
    [key: string]: any;
  };
  isDryRun?: boolean;
  getName?: () => string;
}

/**
 * Aggregated statistics and node counts for a NodeReadinessRule.
 */
export interface RuleStats {
  /** Whether the rule has evaluation summary records or dry-run simulation data. */
  hasSummary: boolean;
  /** Whether the rule is operating in dry-run simulation mode. */
  isDryRun: boolean;
  /** Total number of worker nodes targeted by the rule selector (affectedNodes in dry-run). */
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
  /** Semantic severity level determining the badge color ('': color-neutral default). */
  severity: 'error' | 'warning' | 'info' | 'success' | '';
}

const statsCache = new WeakMap<object, RuleStats>();

/**
 * Checks whether a NodeReadinessRule's specification has been modified and awaits controller synchronization.
 * Handles newly created rules where observedGeneration is not yet defined, or updated rules where observedGeneration < generation.
 * Note: If the controller is offline or paused, rules stay in this pending sync state.
 *
 * @param rule - The rule object to check.
 * @returns True if the rule is pending controller sync.
 */
export function isRulePendingSync(rule: RuleLike | NodeReadinessRule | null | undefined): boolean {
  if (!rule) return false;
  const gen = rule.metadata?.generation;
  const obsGen = rule.status?.observedGeneration;
  return gen !== undefined && (obsGen === undefined || obsGen < gen);
}

/**
 * Checks whether a NodeReadinessRule is newly created and has never been observed by the controller yet
 * (generation is present, but status.observedGeneration is still undefined).
 *
 * @param rule - The rule object to check.
 * @returns True if the rule is fresh (initial sync is pending).
 */
export function isFreshRule(rule: RuleLike | NodeReadinessRule | null | undefined): boolean {
  if (!rule) return false;
  const gen = rule.metadata?.generation;
  const obsGen = rule.status?.observedGeneration;
  return gen !== undefined && obsGen === undefined;
}

/**
 * Computes aggregated node statistics and evaluation counts for a NodeReadinessRule.
 * Uses a WeakMap cache keyed on the status object to prevent redundant computations across re-renders.
 *
 * @param rule - The NodeReadinessRule or RuleLike instance to compute statistics for.
 * @returns Aggregated RuleStats containing targeted, satisfied, unsatisfied, and failed counts.
 */
export function getRuleStats(rule: RuleLike | NodeReadinessRule): RuleStats {
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

  const statusObj = rule.status;
  const isDryRun = typeof rule.isDryRun === 'boolean' ? rule.isDryRun : Boolean(rule.spec?.dryRun);

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
export function getRuleStatusInfo(rule: RuleLike | NodeReadinessRule): RuleStatusInfo {
  if (rule?.metadata?.deletionTimestamp) {
    return { status: 'Terminating', label: 'Terminating', severity: 'warning' };
  }

  const stats = getRuleStats(rule);

  if (stats.isDryRun) {
    if (stats.failed > 0) {
      return { status: 'Failed', label: 'Failed', severity: 'error' };
    }
    if (stats.hasSummary) {
      return { status: 'Dry Run', label: 'Dry Run', severity: '' };
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
