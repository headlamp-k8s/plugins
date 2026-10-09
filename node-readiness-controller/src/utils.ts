import { NodeReadinessRule } from './index';

export function getRuleStats(rule: InstanceType<typeof NodeReadinessRule>) {
  const data = rule.jsonData as any;
  const isDryRun = data?.spec?.dryRun;

  if (isDryRun) {
    return {
      targeted: data?.status?.dryRunResults?.affectedNodes || 0,
      satisfied: 'N/A',
      unsatisfied: 'N/A',
      failed: 'N/A',
      hasSummary: data?.status !== undefined,
      isDryRun,
    };
  }

  const nodeEvaluations = data?.status?.nodeEvaluations || [];
  const failedNodes = data?.status?.failedNodes || [];

  let satisfied = 0;
  let unsatisfied = 0;

  nodeEvaluations.forEach((evalItem: any) => {
    if (evalItem.taintStatus === 'Absent') {
      satisfied++;
    } else if (evalItem.taintStatus === 'Present') {
      unsatisfied++;
    }
  });

  return {
    targeted: nodeEvaluations.length + failedNodes.length,
    satisfied,
    unsatisfied,
    failed: failedNodes.length,
    hasSummary: data?.status !== undefined,
    isDryRun,
  };
}
