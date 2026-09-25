import { Resource, SimpleTable } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box, Chip } from '@mui/material';
import { useParams } from 'react-router-dom';
import { NodeReadinessRule } from './index';


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

        // Compute stats from the rule's own status fields.
        // status.nodeEvaluations[] has taintStatus: "Present" (unsatisfied) or "Absent" (satisfied)
        // status.failedNodes[] is a separate array for nodes with errors
        const nodeEvaluations = rule.jsonData?.status?.nodeEvaluations || [];
        const failedNodes = rule.jsonData?.status?.failedNodes || [];

        let satisfied = 0;
        let unsatisfied = 0;

        nodeEvaluations.forEach((evalItem: any) => {
          if (evalItem.taintStatus === 'Absent') {
            satisfied++;
          } else {
            unsatisfied++;
          }
        });

        const targeted = nodeEvaluations.length + failedNodes.length;
        const failed = failedNodes.length;

        return [
          {
            name: 'Node Selector',
            value: spec.nodeSelector?.matchLabels ? (
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                {Object.entries(spec.nodeSelector.matchLabels).map(([key, val]) => (
                  <Chip key={key} label={`${key}: ${val}`} size="small" variant="outlined" />
                ))}
              </Box>
            ) : (
              'None (Matches all nodes)'
            ),
          },
          {
            name: 'Enforcement Mode',
            value: <Chip label={spec.enforcementMode || 'N/A'} size="small" variant="outlined" />,
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
            value: spec.conditionPolicy || 'N/A',
          },
          {
            name: 'Taint Managed',
            value: spec.taint ? `${spec.taint.key}:${spec.taint.effect}` : 'None',
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
      }}
    />
  );
}
