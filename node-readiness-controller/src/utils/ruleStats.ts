import type { NodeEvaluation, NodeFailure } from '../resources';
import { NodeReadinessRule } from '../resources';

export interface RuleStats {
  hasSummary: boolean;
  isDryRun: boolean;
  targeted: number;
  satisfied: number | 'N/A';
  unsatisfied: number | 'N/A';
  failed: number;
}

export interface RuleStatusInfo {
  status: 'Terminating' | 'Dry Run' | 'Pending' | 'Failed' | 'OK';
  label: 'Terminating' | 'Dry Run' | 'Pending' | 'Failed' | 'OK';
  severity: 'error' | 'warning' | 'info' | 'success';
}

const statsCache = new WeakMap<object, RuleStats>();

export function getRuleStats(rule: InstanceType<typeof NodeReadinessRule>): RuleStats {
  if (!rule || !rule.jsonData) {
    return {
      hasSummary: false,
      isDryRun: false,
      targeted: 0,
      satisfied: 0,
      unsatisfied: 0,
      failed: 0,
    };
  }

  const statusObj = rule.jsonData.status;
  const isDryRun = Boolean(rule.jsonData.spec?.dryRun);

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

export function getRuleStatusInfo(rule: InstanceType<typeof NodeReadinessRule>): RuleStatusInfo {
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
