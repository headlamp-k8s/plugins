import {
  CreateResourceButton,
  Link,
  ResourceListView,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box, Chip, Tooltip, Typography } from '@mui/material';
import React, { useMemo } from 'react';
import { NodeReadinessRule } from '../../resources';
import { getRuleStats, getRuleStatusInfo, nrcRouteNames } from '../../utils';
import { formatTaint, getNodeSelectorSummaryText, NodeSelectorSummary, TaintChip } from '../common';

/**
 * Comparator sorting rules by satisfied node count, breaking ties by targeted count.
 * Aligns with upstream Headlamp DeploymentsList sortByPods implementation.
 */
function sortBySatisfied(r1: NodeReadinessRule, r2: NodeReadinessRule): number {
  const s1 = getRuleStats(r1);
  const s2 = getRuleStats(r2);
  const sat1 = typeof s1.satisfied === 'number' ? s1.satisfied : -1;
  const sat2 = typeof s2.satisfied === 'number' ? s2.satisfied : -1;
  const satDiff = sat1 - sat2;
  if (satDiff !== 0) {
    return satDiff;
  }
  return s1.targeted - s2.targeted;
}

/**
 * Cluster-level list view component displaying all NodeReadinessRule custom resources.
 * Renders a canonical Headlamp ResourceListView table with real-time status badges,
 * enforcement mode, condition evaluation policy, managed taints, and target node selectors.
 *
 * @returns Rendered JSX ResourceListView component.
 */
export default function RuleList() {
  const columns = useMemo(
    () => [
      {
        id: 'name',
        label: 'Name',
        getValue: (rule: NodeReadinessRule) => rule.getName(),
        render: (rule: NodeReadinessRule) => {
          const isDryRun = rule.isDryRun;
          const name = rule.getName();
          return (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <Tooltip title={name}>
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
                  <Link routeName={nrcRouteNames.ruleDetail} params={{ name }}>
                    {name}
                  </Link>
                </Typography>
              </Tooltip>
              {isDryRun && (
                <Chip
                  label="Dry Run"
                  size="small"
                  color="default"
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
        filterVariant: 'multi-select' as const,
        filterSelectOptions: [
          { label: 'continuous', value: 'continuous' },
          { label: 'bootstrap-only', value: 'bootstrap-only' },
        ],
        getValue: (rule: NodeReadinessRule) => rule.enforcementMode,
        render: (rule: NodeReadinessRule) => {
          const mode = rule.enforcementMode;
          const policy = rule.conditionPolicy;
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
                <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
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
        filterVariant: 'multi-select' as const,
        filterSelectOptions: [
          { label: 'OK', value: 'OK' },
          { label: 'Pending', value: 'Pending' },
          { label: 'Dry Run', value: 'Dry Run' },
          { label: 'Failed', value: 'Failed' },
          { label: 'Terminating', value: 'Terminating' },
        ],
        getValue: (rule: NodeReadinessRule) => getRuleStatusInfo(rule).status,
        render: (rule: NodeReadinessRule) => {
          const info = getRuleStatusInfo(rule);
          return <StatusLabel status={info.severity}>{info.label}</StatusLabel>;
        },
      },
      {
        id: 'satisfied',
        label: 'Satisfied Nodes',
        gridTemplate: 'min-content',
        getValue: (rule: NodeReadinessRule) => {
          const stats = getRuleStats(rule);
          return typeof stats.satisfied === 'number' ? stats.satisfied : 0;
        },
        sort: sortBySatisfied,
        render: (rule: NodeReadinessRule) => {
          const stats = getRuleStats(rule);
          if (!stats.hasSummary || typeof stats.satisfied !== 'number') {
            return (
              <Box sx={{ minWidth: '80px', textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  {stats.isDryRun ? 'N/A' : '-'}
                </Typography>
              </Box>
            );
          }
          const allSatisfied = stats.targeted > 0 && stats.satisfied === stats.targeted;
          const hasUnsatisfied = Number(stats.unsatisfied) > 0;
          return (
            <Box sx={{ minWidth: '80px', textAlign: 'center' }}>
              <Tooltip
                title={`${stats.satisfied} out of ${stats.targeted} nodes satisfying this rule`}
              >
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 'bold' }}
                  color={
                    allSatisfied
                      ? 'success.main'
                      : hasUnsatisfied
                      ? 'warning.main'
                      : 'text.secondary'
                  }
                >
                  {stats.satisfied} / {stats.targeted}
                </Typography>
              </Tooltip>
            </Box>
          );
        },
      },
      {
        id: 'unsatisfied',
        label: 'Taints Present',
        getValue: (rule: NodeReadinessRule) => {
          const stats = getRuleStats(rule);
          if (!stats.hasSummary) return stats.isDryRun ? 'N/A' : '-';
          return stats.unsatisfied;
        },
        render: (rule: NodeReadinessRule) => {
          const stats = getRuleStats(rule);
          const val = stats.unsatisfied;
          if (!stats.hasSummary || val === 'N/A') {
            return (
              <Box sx={{ minWidth: '80px', textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  {stats.isDryRun ? 'N/A' : '-'}
                </Typography>
              </Box>
            );
          }
          const count = val as number;
          return (
            <Box sx={{ minWidth: '80px', textAlign: 'center' }}>
              <Tooltip title={`${count} node(s) currently have taint applied`}>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 'bold' }}
                  color={count > 0 ? 'warning.main' : 'text.secondary'}
                >
                  {count > 0 ? count : '-'}
                </Typography>
              </Tooltip>
            </Box>
          );
        },
      },
      {
        id: 'failedNodes',
        label: 'Evaluation Errors',
        getValue: (rule: NodeReadinessRule) => getRuleStats(rule).failed,
        render: (rule: NodeReadinessRule) => {
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
        getValue: (rule: NodeReadinessRule) => getNodeSelectorSummaryText(rule.spec?.nodeSelector),
        render: (rule: NodeReadinessRule) => (
          <NodeSelectorSummary selector={rule.spec?.nodeSelector} />
        ),
      },
      {
        id: 'taint',
        label: 'Taint',
        getValue: (rule: NodeReadinessRule) => formatTaint(rule.spec?.taint),
        render: (rule: NodeReadinessRule) => <TaintChip taint={rule.spec?.taint} />,
      },
      'age' as const,
    ],
    []
  );

  return (
    <ResourceListView
      title="Node Readiness Rules"
      resourceClass={NodeReadinessRule}
      id="nrc-readiness-rules"
      headerProps={{
        titleSideActions: [
          <CreateResourceButton key="create-rule" resourceClass={NodeReadinessRule} />,
        ],
      }}
      enableRowActions={false}
      enableRowSelection={false}
      columns={columns}
    />
  );
}
