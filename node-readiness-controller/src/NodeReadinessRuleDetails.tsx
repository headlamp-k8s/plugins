import {
  DateLabel,
  Resource,
  SectionBox,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box, Chip, Typography } from '@mui/material';
import React from 'react';
import { useParams } from 'react-router-dom';
import { NodeReadinessRule } from './index';
import type { ConditionRequirement, LabelSelectorRequirement } from './types';
import { getRuleStats } from './utils';

export function getRuleDetailSections(
  rule: InstanceType<typeof NodeReadinessRule> | null
): { name: string; value: React.ReactNode }[] {
  if (!rule || !rule.jsonData?.spec) return [];
  const spec = rule.jsonData.spec;
  const status = rule.jsonData.status;

  const { targeted, satisfied, unsatisfied, failed } = getRuleStats(rule);

  const sections: { name: string; value: React.ReactNode }[] = [
    {
      name: 'Node Selector',
      value:
        spec.nodeSelector?.matchLabels || spec.nodeSelector?.matchExpressions ? (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {spec.nodeSelector.matchLabels &&
              Object.entries(spec.nodeSelector.matchLabels).map(([key, val]) => (
                <Chip key={key} label={`${key}: ${val}`} size="small" variant="outlined" />
              ))}
            {spec.nodeSelector.matchExpressions?.map(
              (expression: LabelSelectorRequirement, index: number) => (
                <Chip
                  key={`${expression.key}-${index}`}
                  label={`${expression.key} ${expression.operator}${
                    expression.values?.length ? ` [${expression.values.join(', ')}]` : ''
                  }`}
                  size="small"
                  variant="outlined"
                />
              )
            )}
          </Box>
        ) : (
          'None (Matches all nodes)'
        ),
    },
    {
      name: 'Enforcement Mode',
      value: <Chip label={spec.enforcementMode || 'continuous'} size="small" variant="outlined" />,
    },
    {
      name: 'Dry-run',
      value: spec.dryRun ? (
        <Chip label="Yes" size="small" color="warning" />
      ) : (
        <Chip label="No" size="small" color="success" />
      ),
    },
    {
      name: 'Condition Policy',
      value: spec.conditionPolicy || 'allOf',
    },
    {
      name: 'Taint Managed',
      value: spec.taint
        ? spec.taint.value
          ? `${spec.taint.key}=${spec.taint.value}:${spec.taint.effect}`
          : `${spec.taint.key}:${spec.taint.effect}`
        : 'None',
    },
    {
      name: 'Last Evaluated At',
      value: (() => {
        if (spec.dryRun) {
          return 'Not Available (Dry Run)';
        }
        const records = [...(status?.nodeEvaluations ?? []), ...(status?.failedNodes ?? [])];
        const lastEvaluatedAt = records.reduce<string | undefined>((latest, item) => {
          const timestamp = item?.lastEvaluationTime;
          return !timestamp || (latest && Date.parse(latest) >= Date.parse(timestamp))
            ? latest
            : timestamp;
        }, undefined);
        return lastEvaluatedAt ? <DateLabel date={lastEvaluatedAt} /> : 'Pending';
      })(),
    },
  ];

  if (spec.dryRun) {
    sections.push({
      name: 'Dry-Run Simulation',
      value: status?.dryRunResults ? (
        <Box>
          {status.dryRunResults.summary && (
            <Typography variant="body2" gutterBottom>
              {status.dryRunResults.summary}
            </Typography>
          )}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
            <Chip
              label={`Affected Nodes: ${status.dryRunResults.affectedNodes || 0}`}
              size="small"
            />
            <Chip
              label={`Taints To Add: ${status.dryRunResults.taintsToAdd || 0}`}
              size="small"
              color="warning"
            />
            <Chip
              label={`Taints To Remove: ${status.dryRunResults.taintsToRemove || 0}`}
              size="small"
              color="success"
            />
            <Chip
              label={`Risky Operations: ${status.dryRunResults.riskyOperations || 0}`}
              size="small"
              color="error"
            />
            {failed > 0 && (
              <Chip label={`Evaluation Errors: ${failed}`} size="small" color="error" />
            )}
          </Box>
        </Box>
      ) : (
        'Pending simulation'
      ),
    });
  } else {
    sections.push({
      name: 'Node Status',
      value: (
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip label={`Targeted: ${targeted}`} size="small" variant="outlined" />
          <Chip label={`Taint Absent: ${satisfied}`} size="small" variant="outlined" />
          <Chip
            label={`Taint Present: ${unsatisfied}`}
            size="small"
            color={(unsatisfied as number) > 0 ? 'warning' : 'default'}
          />
          <Chip
            label={`Evaluation Errors: ${failed}`}
            size="small"
            color={failed > 0 ? 'error' : 'default'}
          />
        </Box>
      ),
    });
  }

  return sections;
}

export default function NodeReadinessRuleDetails() {
  const { name } = useParams<{ name: string }>();

  return (
    <Resource.DetailsGrid
      resourceType={NodeReadinessRule}
      name={name!}
      noDefaultActions
      withEvents
      extraInfo={getRuleDetailSections}
      extraSections={(rule: InstanceType<typeof NodeReadinessRule> | null) => {
        if (!rule || !rule.jsonData?.spec) return [];
        const spec = rule.jsonData.spec;
        return [
          {
            id: 'nrc-conditions',
            section: (
              <SectionBox title="Conditions to Evaluate">
                <SimpleTable
                  columns={[
                    { label: 'Condition Type', getter: (c: ConditionRequirement) => c.type },
                    {
                      label: 'Required Status',
                      getter: (c: ConditionRequirement) => c.requiredStatus,
                    },
                    {
                      label: 'Default Status',
                      getter: (c: ConditionRequirement) => c.defaultStatus || 'Unknown',
                    },
                  ]}
                  data={spec.conditions || []}
                  emptyMessage="No conditions defined."
                />
              </SectionBox>
            ),
          },
        ];
      }}
    />
  );
}
