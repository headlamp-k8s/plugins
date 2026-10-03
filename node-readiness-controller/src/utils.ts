import { NodeReadinessRule } from './index';
import type { NodeEvaluation, NodeFailure } from './types';

export interface RuleStats {
  hasSummary: boolean;
  isDryRun: boolean;
  targeted: number;
  satisfied: number | 'N/A';
  unsatisfied: number | 'N/A';
  failed: number;
}

export interface RuleStatusInfo {
  status: 'Terminating' | 'Dry Run' | 'OK' | 'Failed' | 'Pending';
  label: string;
  severity: 'success' | 'warning' | 'error' | 'info';
}

const statsCache = new WeakMap<object, RuleStats>();

export function getRuleStats(rule: InstanceType<typeof NodeReadinessRule>): RuleStats {
  const data = rule?.jsonData;
  const cacheKey =
    data?.status && typeof data.status === 'object'
      ? data.status
      : data && typeof data === 'object'
      ? data
      : rule && typeof rule === 'object'
      ? rule
      : null;

  if (cacheKey) {
    const cached = statsCache.get(cacheKey);
    if (cached) {
      return cached;
    }
  }

  const result = computeRuleStats(rule);
  if (cacheKey) {
    statsCache.set(cacheKey, result);
  }
  return result;
}

export function getRuleStatusInfo(rule: InstanceType<typeof NodeReadinessRule>): RuleStatusInfo {
  if (rule?.metadata?.deletionTimestamp) {
    return { status: 'Terminating', label: 'Terminating', severity: 'warning' };
  }

  const stats = getRuleStats(rule);

  if (stats.failed > 0) {
    return { status: 'Failed', label: 'Failed', severity: 'error' };
  }

  if (stats.isDryRun) {
    if (stats.hasSummary) {
      return {
        status: 'Dry Run',
        label: 'Dry Run',
        severity: 'info',
      };
    }
    return { status: 'Pending', label: 'Pending', severity: 'warning' };
  }

  if (!stats.hasSummary) {
    return { status: 'Pending', label: 'Pending', severity: 'warning' };
  }

  const allSatisfied =
    stats.targeted > 0 && stats.satisfied === stats.targeted && Number(stats.failed) === 0;

  if (allSatisfied) {
    return { status: 'OK', label: 'OK', severity: 'success' };
  }

  return {
    status: 'Pending',
    label: 'Pending',
    severity: Number(stats.unsatisfied) > 0 ? 'error' : 'warning',
  };
}

function computeRuleStats(rule: InstanceType<typeof NodeReadinessRule>): RuleStats {
  const data = rule?.jsonData;
  const status = data?.status;
  const spec = data?.spec;
  const isDryRun = Boolean(spec?.dryRun);

  if (!status) {
    return {
      hasSummary: false,
      isDryRun,
      targeted: 0,
      satisfied: isDryRun ? 'N/A' : 0,
      unsatisfied: isDryRun ? 'N/A' : 0,
      failed: 0,
    };
  }

  const failedNodes: NodeFailure[] = status.failedNodes || [];

  if (isDryRun) {
    const hasSummary = Boolean(status.dryRunResults);
    const affected = status.dryRunResults?.affectedNodes ?? 0;
    return {
      hasSummary,
      isDryRun: true,
      targeted: affected,
      satisfied: 'N/A',
      unsatisfied: 'N/A',
      failed: failedNodes.length,
    };
  }

  // Calculate stats directly from official CRD status fields: nodeEvaluations and failedNodes
  const nodeEvaluations: NodeEvaluation[] = status.nodeEvaluations || [];

  if (nodeEvaluations.length > 0 || failedNodes.length > 0) {
    // Build failedNodeNames first so failures take precedence over old evaluations
    const failedNodeNames = new Set(failedNodes.map(item => item.nodeName).filter(Boolean));

    const evaluatedNodeNames = new Set(
      nodeEvaluations.map(evalItem => evalItem.nodeName).filter(Boolean)
    );

    let satisfied = 0;
    let unsatisfied = 0;

    nodeEvaluations.forEach(evalItem => {
      const nodeName = evalItem.nodeName;
      // Exclude overlapping failed nodes from evaluation status counters
      if (nodeName && failedNodeNames.has(nodeName)) {
        return;
      }

      if (evalItem.taintStatus === 'Absent') {
        satisfied++;
      } else if (evalItem.taintStatus === 'Present') {
        unsatisfied++;
      }
    });

    const uniqueNodes = new Set([...evaluatedNodeNames, ...failedNodeNames]);
    const targetedCount = uniqueNodes.size;

    return {
      hasSummary: true,
      isDryRun: false,
      targeted: targetedCount,
      satisfied,
      unsatisfied,
      failed: failedNodes.length,
    };
  }

  return {
    hasSummary: false,
    isDryRun: false,
    targeted: 0,
    satisfied: 0,
    unsatisfied: 0,
    failed: 0,
  };
}
