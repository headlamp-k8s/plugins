import { DateLabel, Resource, StatusLabel } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Chip } from '@mui/material';
import React from 'react';
import { useParams } from 'react-router-dom';
import { NodeReadinessRule } from '../../resources';
import { getRuleStats } from '../../utils';
import { formatTaint } from '../common';
import { NodeSelectorDetails, NodeStatusChips } from '../common';
import DryRunResultsSection from './DryRunResultsSection';
import RuleConditionsTable from './RuleConditionsTable';

export function getRuleDetailSections(
  rule: InstanceType<typeof NodeReadinessRule> | null
): { name: React.ReactNode; value: React.ReactNode }[] {
  if (!rule || !rule.jsonData?.spec) return [];
  const spec = rule.jsonData.spec;
  const status = rule.jsonData.status;

  const { targeted, satisfied, unsatisfied, failed } = getRuleStats(rule);

  const sections: { name: React.ReactNode; value: React.ReactNode }[] = [
    {
      name: 'Node Selector',
      value:
        spec.nodeSelector?.matchLabels || spec.nodeSelector?.matchExpressions ? (
          <NodeSelectorDetails selector={spec.nodeSelector} />
        ) : (
          'None (Matches all nodes)'
        ),
    },
    {
      name: <span style={{ whiteSpace: 'nowrap' }}>Enforcement Mode</span>,
      value: <Chip label={spec.enforcementMode || 'continuous'} size="small" variant="outlined" />,
    },
    {
      name: 'Dry-run',
      value: spec.dryRun ? (
        <StatusLabel status="warning" sx={{ fontSize: '0.8125rem', py: 0.25 }}>
          Yes
        </StatusLabel>
      ) : (
        <StatusLabel status="success" sx={{ fontSize: '0.8125rem', py: 0.25 }}>
          No
        </StatusLabel>
      ),
    },
    {
      name: 'Condition Policy',
      value: spec.conditionPolicy || 'allOf',
    },
    {
      name: 'Taint Managed',
      value: spec.taint ? formatTaint(spec.taint) : 'None',
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
        <DryRunResultsSection results={status.dryRunResults} failed={failed} />
      ) : (
        'Pending simulation'
      ),
    });
  } else {
    sections.push({
      name: 'Node Status',
      value: (
        <NodeStatusChips
          targeted={targeted}
          satisfied={satisfied}
          unsatisfied={unsatisfied}
          failed={failed}
        />
      ),
    });
  }

  return sections;
}

export default function RuleDetails() {
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
            section: <RuleConditionsTable conditions={spec.conditions} />,
          },
        ];
      }}
    />
  );
}
