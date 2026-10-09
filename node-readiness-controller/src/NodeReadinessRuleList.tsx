import { Link, ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { StatusLabel } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box, Chip, Tooltip, Typography } from '@mui/material';
import { NodeReadinessRule } from './index';
import { getRuleStats } from './utils';

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
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  minWidth: '140px',
                }}
              >
                <Tooltip title={rule.metadata.name} placement="top-start">
                  <Typography
                    component="div"
                    sx={{
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '200px',
                    }}
                  >
                    <Link routeName="nrc-rule-details" params={{ name: rule.metadata.name }}>
                      {rule.metadata.name}
                    </Link>
                  </Typography>
                </Tooltip>
                {isDryRun && (
                  <Chip
                    label="Dry Run"
                    size="small"
                    color="warning"
                    sx={{ height: 18, fontSize: '0.65rem', mt: 0.5 }}
                  />
                )}
              </Box>
            );
          },
        },
        {
          id: 'enforcement',
          label: 'Enforcement',
          getValue: (rule: InstanceType<typeof NodeReadinessRule>) =>
            `${rule.jsonData?.spec?.enforcementMode || 'continuous'} ${
              rule.jsonData?.spec?.conditionPolicy || 'allOf'
            }`,
          render: (rule: InstanceType<typeof NodeReadinessRule>) => {
            const mode = rule.jsonData?.spec?.enforcementMode || 'continuous';
            const policy = rule.jsonData?.spec?.conditionPolicy || 'allOf';
            return (
              <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: '100px' }}>
                <Typography
                  variant="body2"
                  sx={{
                    whiteSpace: 'nowrap',
                    fontWeight: mode === 'bootstrap-only' ? 'bold' : 'normal',
                    color: mode === 'bootstrap-only' ? 'warning.main' : 'text.primary',
                  }}
                >
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
            if (
              !stats.hasSummary ||
              !(rule.jsonData as any)?.status?.nodeEvaluations ||
              stats.isDryRun
            )
              return 'Pending';
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
                  if (!stats.hasSummary || !statusObj?.nodeEvaluations || stats.isDryRun) {
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
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ whiteSpace: 'nowrap' }}
                      >
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
          getValue: (rule: InstanceType<typeof NodeReadinessRule>) =>
            getRuleStats(rule).unsatisfied,
          render: (rule: InstanceType<typeof NodeReadinessRule>) => {
            const val = getRuleStats(rule).unsatisfied;
            return (
              <Box sx={{ minWidth: '80px', textAlign: 'center' }}>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 'bold' }}
                  color={
                    val === 'N/A'
                      ? 'text.secondary'
                      : (val as number) > 0
                      ? 'error.main'
                      : 'text.secondary'
                  }
                >
                  {val === 'N/A' ? val : (val as number) > 0 ? val : '-'}
                </Typography>
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
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 'bold' }}
                  color={
                    val === 'N/A'
                      ? 'text.secondary'
                      : (val as number) > 0
                      ? 'warning.main'
                      : 'text.secondary'
                  }
                >
                  {val === 'N/A' ? val : (val as number) > 0 ? val : '-'}
                </Typography>
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
            const numLabels = labels ? Object.keys(labels).length : 0;
            const numExprs = exprs ? exprs.length : 0;

            if (numLabels === 1 && numExprs === 0) {
              const key = Object.keys(labels)[0];
              return `${key}=${labels[key]}`;
            }

            const parts = [];
            if (numLabels > 0) parts.push(`${numLabels} Lbls`);
            if (numExprs > 0) parts.push(`${numExprs} Exprs`);
            return parts.join(', ');
          },
          render: (rule: InstanceType<typeof NodeReadinessRule>) => {
            const selector = rule.jsonData?.spec?.nodeSelector || {};
            const labels = selector.matchLabels;
            const exprs = selector.matchExpressions;

            if (!labels && !exprs) {
              return (
                <Box sx={{ minWidth: '70px' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                    All Nodes
                  </Typography>
                </Box>
              );
            }

            const numLabels = labels ? Object.keys(labels).length : 0;
            const numExprs = exprs ? exprs.length : 0;
            const tooltipText = JSON.stringify(selector, null, 2);

            let displayText = '';
            if (numLabels === 1 && numExprs === 0) {
              const key = Object.keys(labels)[0];
              displayText = `${key}=${labels[key]}`;
            } else {
              const parts = [];
              if (numLabels > 0) parts.push(`${numLabels} Lbls`);
              if (numExprs > 0) parts.push(`${numExprs} Exprs`);
              displayText = parts.join(', ');
            }

            return (
              <Box sx={{ minWidth: '70px', maxWidth: '160px' }}>
                <Tooltip
                  title={<pre style={{ margin: 0, fontSize: '0.75rem' }}>{tooltipText}</pre>}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      cursor: 'help',
                      textDecoration: 'underline dotted',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: 'block',
                    }}
                  >
                    {displayText}
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
            return taint.value
              ? `${taint.key}=${taint.value}:${taint.effect}`
              : `${taint.key}:${taint.effect}`;
          },
          render: (rule: InstanceType<typeof NodeReadinessRule>) => {
            const taint = rule.jsonData?.spec?.taint;
            if (!taint)
              return (
                <Typography variant="body2" color="text.secondary">
                  None
                </Typography>
              );
            const text = taint.value
              ? `${taint.key}=${taint.value}:${taint.effect}`
              : `${taint.key}:${taint.effect}`;
            return (
              <Box sx={{ minWidth: '100px' }}>
                <Tooltip title={text}>
                  <Typography
                    variant="body2"
                    sx={{
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '120px',
                    }}
                  >
                    {taint.key}
                  </Typography>
                </Tooltip>
              </Box>
            );
          },
        },
        'age',
      ]}
    />
  );
}
