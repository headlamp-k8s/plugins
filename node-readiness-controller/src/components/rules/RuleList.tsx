import { Link, ResourceListView, StatusLabel } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box, Chip, Tooltip, Typography } from '@mui/material';
import React from 'react';
import { NodeReadinessRule } from '../../resources';
import { nrcRouteNames } from '../../utils';
import { getRuleStats, getRuleStatusInfo } from '../../utils';
import { NodeSelectorSummary, TaintChip } from '../common';

export default function RuleList() {
  return (
    <ResourceListView
      title="Node Readiness Rules"
      resourceClass={NodeReadinessRule}
      columns={[
        {
          id: 'name',
          label: 'Name',
          getValue: (rule: InstanceType<typeof NodeReadinessRule>) => rule.metadata.name,
          render: (rule: InstanceType<typeof NodeReadinessRule>) => {
            const isDryRun = Boolean(rule.jsonData?.spec?.dryRun);
            return (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <Tooltip title={rule.metadata.name}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 'bold',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '200px',
                    }}
                  >
                    <Link
                      routeName={nrcRouteNames.ruleDetail}
                      params={{ name: rule.metadata.name }}
                    >
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
                    fontWeight: 500,
                    color: 'text.primary',
                  }}
                >
                  {mode}
                </Typography>
                {policy === 'anyOf' && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ whiteSpace: 'nowrap' }}
                  >
                    Policy: anyOf
                  </Typography>
                )}
              </Box>
            );
          },
        },
        {
          id: 'status',
          label: 'Status',
          getValue: (rule: InstanceType<typeof NodeReadinessRule>) =>
            getRuleStatusInfo(rule).status,
          render: (rule: InstanceType<typeof NodeReadinessRule>) => {
            const info = getRuleStatusInfo(rule);
            return <StatusLabel status={info.severity}>{info.label}</StatusLabel>;
          },
        },
        {
          id: 'unsatisfied',
          label: 'Taints Present',
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
          id: 'failedNodes',
          label: 'Evaluation Errors',
          getValue: (rule: InstanceType<typeof NodeReadinessRule>) => getRuleStats(rule).failed,
          render: (rule: InstanceType<typeof NodeReadinessRule>) => {
            const val = getRuleStats(rule).failed;
            return (
              <Box sx={{ minWidth: '60px', textAlign: 'center' }}>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 'bold' }}
                  color={val > 0 ? 'error.main' : 'text.secondary'}
                >
                  {val > 0 ? val : '-'}
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
          render: (rule: InstanceType<typeof NodeReadinessRule>) => (
            <NodeSelectorSummary selector={rule.jsonData?.spec?.nodeSelector} />
          ),
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
          render: (rule: InstanceType<typeof NodeReadinessRule>) => (
            <TaintChip taint={rule.jsonData?.spec?.taint} />
          ),
        },
        'age',
      ]}
    />
  );
}
