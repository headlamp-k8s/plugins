import { Link, ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { StatusLabel } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box,Chip, Tooltip, Typography } from '@mui/material';
import { NodeReadinessRule } from './index';

function getRuleStats(rule: InstanceType<typeof NodeReadinessRule>) {
  const data = rule.jsonData as any;
  if (data?.status?.summary) {
    const summary = data.status.summary;
    return {
      targeted: summary.matchedNodes || 0,
      satisfied: summary.releasedNodes || 0,
      failed: summary.failedNodes || 0,
      unsatisfied: summary.heldNodes || 0,
      hasSummary: true,
    };
  }

  const nodeEvaluations = data?.status?.nodeEvaluations || [];
  const failedNodes = data?.status?.failedNodes || [];

  let satisfied = 0;
  let unsatisfied = 0;

  nodeEvaluations.forEach((evalItem: any) => {
    if (evalItem.taintStatus === 'Absent') {
      satisfied++;
    } else {
      unsatisfied++;
    }
  });

  return {
    targeted: nodeEvaluations.length + failedNodes.length,
    satisfied,
    unsatisfied,
    failed: failedNodes.length,
    hasSummary: data?.status !== undefined,
  };
}

export default function ReadinessRulesPage() {
  return (
    <ResourceListView
      title="Node Readiness Rules"
      resourceClass={NodeReadinessRule}
      id="nrc-readiness-rules"
      columns={[
        {
          id: 'name',
          label: 'Name',
          getValue: (rule: InstanceType<typeof NodeReadinessRule>) => rule.metadata.name,
          render: (rule: InstanceType<typeof NodeReadinessRule>) => {
            const isDryRun = rule.jsonData?.spec?.dryRun;
            return (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: '140px' }}>
                <Typography component="div" sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
                  <Link routeName="nrc-rule-details" params={{ name: rule.metadata.name }}>
                    {rule.metadata.name}
                  </Link>
                </Typography>
                {isDryRun && <Chip label="Dry Run" size="small" color="warning" sx={{ height: 18, fontSize: '0.65rem', mt: 0.5 }} />}
              </Box>
            );
          },
        },
        {
          id: 'enforcement',
          label: 'Enforcement',
          getValue: (rule: InstanceType<typeof NodeReadinessRule>) =>
            `${rule.jsonData?.spec?.enforcementMode || 'continuous'} ${rule.jsonData?.spec?.conditionPolicy || 'allOf'}`,
          render: (rule: InstanceType<typeof NodeReadinessRule>) => {
            const mode = rule.jsonData?.spec?.enforcementMode || 'continuous';
            const policy = rule.jsonData?.spec?.conditionPolicy || 'allOf';
            return (
              <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: '100px' }}>
                <Typography variant="body2" sx={{ whiteSpace: 'nowrap', fontWeight: mode === 'bootstrap-only' ? 'bold' : 'normal', color: mode === 'bootstrap-only' ? 'warning.main' : 'text.primary' }}>
                  {mode}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                  Policy: {policy}
                </Typography>
              </Box>
            );
          },
        },
        {
          id: 'status',
          label: 'Status',
          getValue: (rule: InstanceType<typeof NodeReadinessRule>) => {
            const stats = getRuleStats(rule);
            if (!stats.hasSummary || (rule.jsonData as any)?.status?.summary === undefined && !(rule.jsonData as any)?.status?.nodeEvaluations) return 'Pending';
            const allSatisfied = stats.targeted > 0 && stats.satisfied === stats.targeted;
            return allSatisfied ? 'OK' : 'Pending';
          },
          render: (rule: InstanceType<typeof NodeReadinessRule>) => {
            const stats = getRuleStats(rule);
            const statusObj = (rule.jsonData as any)?.status;
            
            // By wrapping StatusLabel in a Box with minWidth, we prevent it from overlapping adjacent columns
            return (
              <Box sx={{ minWidth: '120px' }}>
                {(() => {
                  if (!stats.hasSummary || (!statusObj?.summary && !statusObj?.nodeEvaluations)) {
                    return <StatusLabel status="warning">Pending</StatusLabel>;
                  }
                  
                  const allSatisfied = stats.targeted > 0 && stats.satisfied === stats.targeted;
                  const text = `${stats.satisfied}/${stats.targeted}`;
                  
                  return (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {allSatisfied ? (
                        <StatusLabel status="success">OK</StatusLabel>
                      ) : (
                        <StatusLabel status="warning">Pending</StatusLabel>
                      )}
                      <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                        {text}
                      </Typography>
                    </Box>
                  );
                })()}
              </Box>
            );
          },
        },
        {
          id: 'unsatisfied',
          label: 'Unsatisfied',
          getValue: (rule: InstanceType<typeof NodeReadinessRule>) => getRuleStats(rule).unsatisfied,
          render: (rule: InstanceType<typeof NodeReadinessRule>) => {
            const val = getRuleStats(rule).unsatisfied;
            return (
              <Box sx={{ minWidth: '80px', textAlign: 'center' }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }} color={val > 0 ? "error.main" : "text.secondary"}>{val > 0 ? val : '-'}</Typography>
              </Box>
            );
          },
        },
        {
          id: 'failedNodes',
          label: 'Failed',
          getValue: (rule: InstanceType<typeof NodeReadinessRule>) => getRuleStats(rule).failed,
          render: (rule: InstanceType<typeof NodeReadinessRule>) => {
            const val = getRuleStats(rule).failed;
            return (
              <Box sx={{ minWidth: '60px', textAlign: 'center' }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }} color={val > 0 ? "warning.main" : "text.secondary"}>{val > 0 ? val : '-'}</Typography>
              </Box>
            );
          },
        },
        {
          id: 'nodeSelector',
          label: 'Selector',
          getValue: (rule: InstanceType<typeof NodeReadinessRule>) => {
            const labels = rule.jsonData?.spec?.nodeSelector?.matchLabels;
            const exprs = rule.jsonData?.spec?.nodeSelector?.matchExpressions;
            return `${labels ? Object.keys(labels).length : 0} Labels, ${exprs ? exprs.length : 0} Expressions`;
          },
          render: (rule: InstanceType<typeof NodeReadinessRule>) => {
            const selector = rule.jsonData?.spec?.nodeSelector || {};
            const labels = selector.matchLabels;
            const exprs = selector.matchExpressions;
            
            if (!labels && !exprs) {
              return (
                <Box sx={{ minWidth: '70px' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>All Nodes</Typography>
                </Box>
              );
            }

            const numLabels = labels ? Object.keys(labels).length : 0;
            const numExprs = exprs ? exprs.length : 0;
            const tooltipText = JSON.stringify(selector, null, 2);

            return (
              <Box sx={{ minWidth: '70px' }}>
                <Tooltip title={<pre style={{ margin: 0, fontSize: '0.75rem' }}>{tooltipText}</pre>}>
                  <Typography variant="body2" sx={{ cursor: 'help', textDecoration: 'underline dotted', whiteSpace: 'nowrap' }}>
                    {numLabels > 0 ? `${numLabels} Lbls` : ''} {numExprs > 0 ? `${numExprs} Exprs` : ''}
                  </Typography>
                </Tooltip>
              </Box>
            );
          },
        },
        {
          id: 'taint',
          label: 'Taint',
          getValue: (rule: InstanceType<typeof NodeReadinessRule>) => {
            const taint = rule.jsonData?.spec?.taint;
            if (!taint) return 'None';
            return taint.value ? `${taint.key}=${taint.value}:${taint.effect}` : `${taint.key}:${taint.effect}`;
          },
          render: (rule: InstanceType<typeof NodeReadinessRule>) => {
            const taint = rule.jsonData?.spec?.taint;
            if (!taint) return <Typography variant="body2" color="text.secondary">None</Typography>;
            const text = taint.value ? `${taint.key}=${taint.value}:${taint.effect}` : `${taint.key}:${taint.effect}`;
            return (
              <Box sx={{ minWidth: '100px' }}>
                <Tooltip title={text}>
                  <Typography variant="body2" sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>
                    {taint.key}
                  </Typography>
                </Tooltip>
              </Box>
            );
          }
        },
        'age',
      ]}
    />
  );
}
