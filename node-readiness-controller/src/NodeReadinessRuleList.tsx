import { Link, ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Chip, Tooltip, Typography } from '@mui/material';
import { NodeReadinessRule } from './index';

/**
 * Computes node counts from a NodeReadinessRule's status fields.
 *
 * The controller writes two separate status arrays:
 *   status.nodeEvaluations[] - per-node evaluation with taintStatus (Present | Absent)
 *   status.failedNodes[]     - nodes where the controller hit an error
 *
 * Targeted = nodeEvaluations.length + failedNodes.length
 * Satisfied = taintStatus === 'Absent' (taint removed, rule conditions met)
 * Unsatisfied = taintStatus === 'Present' (taint still on, waiting for conditions)
 * Failed = failedNodes.length
 */
function getRuleStats(rule: InstanceType<typeof NodeReadinessRule>) {
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

  return {
    targeted: nodeEvaluations.length + failedNodes.length,
    satisfied,
    unsatisfied,
    failed: failedNodes.length,
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
          render: (rule: InstanceType<typeof NodeReadinessRule>) => (
            <Link routeName="nrc-rule-details" params={{ name: rule.metadata.name }}>
              {rule.metadata.name}
            </Link>
          ),
        },
        {
          id: 'mode',
          label: 'Mode',
          getValue: (rule: InstanceType<typeof NodeReadinessRule>) =>
            rule.jsonData?.spec?.enforcementMode || 'N/A',
          render: (rule: InstanceType<typeof NodeReadinessRule>) => {
            const mode = rule.jsonData?.spec?.enforcementMode || 'N/A';
            return (
              <Tooltip title={mode}>
                <Chip label={mode} size="small" variant="outlined" />
              </Tooltip>
            );
          },
        },
        {
          id: 'dryRun',
          label: 'Dry-run',
          getValue: (rule: InstanceType<typeof NodeReadinessRule>) =>
            rule.jsonData?.spec?.dryRun ? 'Yes' : 'No',
          render: (rule: InstanceType<typeof NodeReadinessRule>) => {
            const isDryRun = rule.jsonData?.spec?.dryRun;
            return isDryRun ? <Chip label="Dry Run" size="small" color="warning" /> : '-';
          },
        },
        {
          id: 'targeted',
          label: 'Targeted Nodes',
          getValue: (rule: InstanceType<typeof NodeReadinessRule>) => getRuleStats(rule).targeted,
          render: (rule: InstanceType<typeof NodeReadinessRule>) => {
            const stats = getRuleStats(rule);
            return <Typography variant="body2">{stats.targeted}</Typography>;
          },
        },
        {
          id: 'satisfied',
          label: 'Satisfied',
          getValue: (rule: InstanceType<typeof NodeReadinessRule>) => getRuleStats(rule).satisfied,
          render: (rule: InstanceType<typeof NodeReadinessRule>) => {
            const stats = getRuleStats(rule);
            const allSatisfied = stats.targeted > 0 && stats.satisfied === stats.targeted;
            return (
              <Typography
                variant="body2"
                sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
              >
                {allSatisfied ? '✅' : stats.targeted > 0 ? '⚠️' : '-'} {stats.satisfied} /{' '}
                {stats.targeted}
              </Typography>
            );
          },
        },
        {
          id: 'failedNodes',
          label: 'Failed Nodes',
          getValue: (rule: InstanceType<typeof NodeReadinessRule>) => getRuleStats(rule).failed,
          render: (rule: InstanceType<typeof NodeReadinessRule>) => {
            const stats = getRuleStats(rule);
            return stats.failed > 0 ? (
              <Chip label={stats.failed.toString()} size="small" color="error" />
            ) : (
              '-'
            );
          },
        },
        {
          id: 'nodeSelector',
          label: 'Node Selector',
          getValue: (rule: InstanceType<typeof NodeReadinessRule>) => {
            const labels = rule.jsonData?.spec?.nodeSelector?.matchLabels;
            if (!labels) return 'All Nodes';

            const numLabels = Object.keys(labels).length;
            const tooltipText = JSON.stringify(labels, null, 2);

            return (
              <Tooltip
                title={<pre style={{ margin: 0, fontSize: '0.75rem' }}>{tooltipText}</pre>}
              >
                <Chip label={`${numLabels} Label${numLabels > 1 ? 's' : ''}`} size="small" />
              </Tooltip>
            );
          },
        },
        {
          id: 'taintKey',
          label: 'Taint',
          getValue: (rule: InstanceType<typeof NodeReadinessRule>) =>
            rule.jsonData?.spec?.taint?.key || 'None',
        },
        {
          id: 'taintEffect',
          label: 'Effect',
          getValue: (rule: InstanceType<typeof NodeReadinessRule>) => {
            const effect = rule.jsonData?.spec?.taint?.effect || 'None';
            return <Chip label={effect} size="small" />;
          },
        },
        {
          id: 'conditionPolicy',
          label: 'Condition Policy',
          getValue: (rule: InstanceType<typeof NodeReadinessRule>) => {
            const policy = rule.jsonData?.spec?.conditionPolicy || 'N/A';
            return <Chip label={policy} size="small" color="primary" variant="outlined" />;
          },
        },
        'age',
      ]}
    />
  );
}
