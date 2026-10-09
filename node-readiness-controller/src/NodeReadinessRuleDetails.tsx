import { Resource, SimpleTable } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box, Chip, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';
import { NodeReadinessRule } from './index';
import { getRuleStats } from './utils';

export default function NodeReadinessRuleDetails() {
  const { name } = useParams<{ name: string }>();

  return (
    <Resource.DetailsGrid
      resourceType={NodeReadinessRule}
      name={name!}
      withEvents
      extraInfo={(rule: InstanceType<typeof NodeReadinessRule> | null) => {
        if (!rule) return [];
        const spec = rule.jsonData?.spec || {};
        const status = rule.jsonData?.status || {};

        const { targeted, satisfied, unsatisfied, failed } = getRuleStats(rule);

        const sections = [
          {
            name: 'Node Selector',
            value:
              spec.nodeSelector?.matchLabels || spec.nodeSelector?.matchExpressions ? (
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {spec.nodeSelector.matchLabels &&
                    Object.entries(spec.nodeSelector.matchLabels).map(([key, val]) => (
                      <Chip key={key} label={`${key}: ${val}`} size="small" variant="outlined" />
                    ))}
                  {spec.nodeSelector.matchExpressions?.map((expression: any, index: number) => (
                    <Chip
                      key={`${expression.key}-${index}`}
                      label={`${expression.key} ${expression.operator}${
                        expression.values?.length ? ` [${expression.values.join(', ')}]` : ''
                      }`}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Box>
              ) : (
                'None (Matches all nodes)'
              ),
          },
          {
            name: 'Enforcement Mode',
            value: (
              <Chip label={spec.enforcementMode || 'continuous'} size="small" variant="outlined" />
            ),
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
            name: 'Node Status',
            value: (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip label={`Targeted: ${targeted}`} size="small" variant="outlined" />
                <Chip label={`Satisfied: ${satisfied}`} size="small" color="success" />
                <Chip label={`Unsatisfied: ${unsatisfied}`} size="small" color="error" />
                <Chip label={`Failed: ${failed}`} size="small" color="warning" />
              </Box>
            ),
          },
          {
            name: 'Conditions to Evaluate',
            value: (
              <SimpleTable
                columns={[
                  { label: 'Condition Type', getter: (c: any) => c.type },
                  { label: 'Required Status', getter: (c: any) => c.requiredStatus },
                  { label: 'Default Status', getter: (c: any) => c.defaultStatus || 'Unknown' },
                ]}
                data={spec.conditions || []}
                emptyMessage="No conditions defined."
              />
            ),
          },
        ];

        if (spec.dryRun && status.dryRunResults) {
          sections.push({
            name: 'Dry-Run Results',
            value: (
              <Box>
                <Typography variant="body2" gutterBottom>
                  {status.dryRunResults.summary}
                </Typography>
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
                </Box>
              </Box>
            ),
          });
        }

        return sections;
      }}
    />
  );
}
